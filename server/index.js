const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { pool, initDb, LEAD_STATUSES } = require('./db');
const { hashPassword, verifyPassword, signToken, authRequired, requireRole } = require('./auth');
const { sendEmail } = require('./mailer');
const { sendWhatsApp } = require('./whatsapp');
const { generateQuotePdf, generateInvoicePdf } = require('./pdf');
const { geocode, distanceKm } = require('./geocode');
const { paymentsEnabled, buildPayment, verifySignature, validateWithPayfast } = require('./payments');
const calendar = require('./calendar');
const storage = require('./storage');

const app = express();
const port = process.env.PORT || 5000;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${port}`;

// ---------------------------------------------------------------------------
// Middleware + static uploads
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
// PayFast posts ITN callbacks as urlencoded; keep the raw body for validation.
app.use(
  express.urlencoded({
    extended: false,
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(path.join(UPLOAD_DIR, 'photos'), { recursive: true });
// Serve local files only when S3 isn't handling storage.
if (!storage.storageEnabled) {
  app.use('/uploads', express.static(UPLOAD_DIR));
}

// Buffer uploads in memory, then hand them to the storage layer (S3 or disk).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB each, max 10
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

const safeName = (name) => name.replace(/[^a-zA-Z0-9.\-_]/g, '_');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const parseId = (v) => {
  const id = Number.parseInt(v, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};
const isStaff = (user) => user && (user.role === 'admin' || user.role === 'worker');

// Returns the user id from a Bearer token if present and valid, else null.
// Used by public endpoints that optionally link to a logged-in client.
const optionalUserId = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), JWT_SECRET).sub;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get('/', (req, res) => res.send('KV Tree API is running'));
app.get('/test-db', asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT NOW() as now');
  res.json({ message: 'Database connection successful!', timestamp: result.rows[0].now });
}));
app.get('/api/meta', (req, res) => res.json({ leadStatuses: LEAD_STATUSES }));

// ---------------------------------------------------------------------------
// File uploads — returns public URLs to attach to a lead/job
// ---------------------------------------------------------------------------
app.post('/api/uploads', upload.array('photos', 10), asyncHandler(async (req, res) => {
  const urls = await Promise.all(
    (req.files || []).map((f) => {
      const key = `photos/${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeName(f.originalname)}`;
      return storage.save(f.buffer, key, f.mimetype);
    })
  );
  res.status(201).json({ urls });
}));

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { name, email, password, phone, marketingOptIn } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });
  const hash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, phone, marketing_opt_in)
     VALUES ($1, $2, $3, 'client', $4, $5)
     RETURNING id, name, email, role, phone`,
    [name ?? null, email.toLowerCase(), hash, phone ?? null, marketingOptIn === true]
  );
  const user = rows[0];
  res.status(201).json({ token: signToken(user), user });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const safe = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone };
  res.json({ token: signToken(safe), user: safe });
}));

app.get('/api/auth/me', authRequired, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, phone, marketing_opt_in FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
}));

// Update own marketing preferences (POPIA consent).
app.put('/api/auth/me', authRequired, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE users SET
       name = COALESCE($2, name),
       phone = COALESCE($3, phone),
       marketing_opt_in = COALESCE($4, marketing_opt_in)
     WHERE id = $1 RETURNING id, name, email, role, phone, marketing_opt_in`,
    [req.user.id, req.body.name ?? null, req.body.phone ?? null,
     typeof req.body.marketingOptIn === 'boolean' ? req.body.marketingOptIn : null]
  );
  res.json(rows[0]);
}));

// Admin creates a staff account (worker or admin), or a client.
app.post('/api/users', authRequired, requireRole('admin'), asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const allowed = ['client', 'worker', 'admin'];
  const userRole = allowed.includes(role) ? role : 'worker';
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });
  const hash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone`,
    [name ?? null, email.toLowerCase(), hash, userRole, phone ?? null]
  );
  res.status(201).json(rows[0]);
}));

// Admin updates a user's role.
app.put('/api/users/:id/role', authRequired, requireRole('admin'), asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const allowed = ['client', 'worker', 'admin'];
  if (!allowed.includes(req.body.role)) return res.status(400).json({ error: 'Invalid role' });
  const { rows } = await pool.query(
    'UPDATE users SET role = $2 WHERE id = $1 RETURNING id, name, email, role, phone',
    [id, req.body.role]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
}));

// List workers/users for assignment (admin only)
app.get('/api/users', authRequired, requireRole('admin'), asyncHandler(async (req, res) => {
  const role = req.query.role;
  const { rows } = role
    ? await pool.query('SELECT id, name, email, role, phone FROM users WHERE role = $1 ORDER BY name', [role])
    : await pool.query('SELECT id, name, email, role, phone FROM users ORDER BY role, name');
  res.json(rows);
}));

// ---------------------------------------------------------------------------
// Notifications helper
// ---------------------------------------------------------------------------
async function notify({ email, phone, subject, message, attachments }) {
  const tasks = [];
  if (email) tasks.push(sendEmail({ to: email, subject, text: message, html: `<p>${message}</p>`, attachments }).catch((e) => console.error('email error', e.message)));
  if (phone) tasks.push(sendWhatsApp({ to: phone, body: message }).catch((e) => console.error('whatsapp error', e.message)));
  await Promise.all(tasks);
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
// Public: anyone can request a quote. If a Bearer token is present, link it.
app.post('/api/leads', asyncHandler(async (req, res) => {
  const { name, email, phone, address, service, description, photos } = req.body;

  const clientId = optionalUserId(req);
  const { latitude, longitude } = await geocode(address);

  const { rows } = await pool.query(
    `INSERT INTO leads (client_id, name, email, phone, address, service, description, photos, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
     RETURNING *`,
    [clientId, name, email, phone, address, service, description, JSON.stringify(photos ?? []), latitude, longitude]
  );
  const lead = rows[0];

  // Acknowledge to client; alert internal inbox. Fire-and-forget so a slow or
  // misconfigured email/WhatsApp provider can never hang the HTTP response.
  notify({
    email,
    phone,
    subject: 'We received your quote request — KV Tree',
    message: `Hi ${name || 'there'}, thanks for your request for "${service || 'tree services'}". Our team will review it and be in touch shortly.`,
  }).catch((e) => console.error('notify error', e.message));
  if (process.env.INTERNAL_NOTIFY_EMAIL) {
    notify({ email: process.env.INTERNAL_NOTIFY_EMAIL, subject: 'New quote request', message: `New lead #${lead.id} from ${name} (${email}) — ${service}` }).catch((e) => console.error('notify error', e.message));
  }

  res.status(201).json(lead);
}));

// Staff: all leads, with distance from base. Clients: only their own.
app.get('/api/leads', authRequired, asyncHandler(async (req, res) => {
  let rows;
  if (isStaff(req.user)) {
    const status = req.query.status;
    ({ rows } = status
      ? await pool.query('SELECT * FROM leads WHERE status = $1 ORDER BY created_at DESC', [status])
      : await pool.query('SELECT * FROM leads ORDER BY created_at DESC'));
  } else {
    ({ rows } = await pool.query(
      'SELECT * FROM leads WHERE client_id = $1 OR email = $2 ORDER BY created_at DESC',
      [req.user.id, req.user.email]
    ));
  }
  const withDistance = rows.map((l) => ({
    ...l,
    distance_km: distanceKm({ latitude: l.latitude, longitude: l.longitude }),
  }));
  res.json(withDistance);
}));

app.get('/api/leads/:id', authRequired, asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { rows } = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
  const lead = rows[0];
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (!isStaff(req.user) && lead.client_id !== req.user.id && lead.email !== req.user.email) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  res.json({ ...lead, distance_km: distanceKm({ latitude: lead.latitude, longitude: lead.longitude }) });
}));

// Staff: update lead (status, assignment, estimate, coords). Drives the Kanban.
app.put('/api/leads/:id', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  if (req.body.status && !LEAD_STATUSES.includes(req.body.status)) {
    return res.status(400).json({ error: `Invalid status. One of: ${LEAD_STATUSES.join(', ')}` });
  }
  const { rows } = await pool.query(
    `UPDATE leads SET
       status = COALESCE($2, status),
       assigned_worker_id = COALESCE($3, assigned_worker_id),
       estimated_quote = COALESCE($4, estimated_quote),
       latitude = COALESCE($5, latitude),
       longitude = COALESCE($6, longitude),
       updated_at = now()
     WHERE id = $1 RETURNING *`,
    [
      id,
      req.body.status ?? null,
      req.body.assignedWorkerId ?? null,
      req.body.estimatedQuote ?? null,
      req.body.latitude ?? null,
      req.body.longitude ?? null,
    ]
  );
  if (!rows.length) return res.status(404).json({ error: 'Lead not found' });
  res.json(rows[0]);
}));

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------
// Staff: create a quote for a lead → generate PDF → notify client → status 'Quoted'.
app.post('/api/quotes', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  const { leadId, price, details } = req.body;
  const lid = parseId(leadId);
  if (!lid) return res.status(400).json({ error: 'Valid leadId required' });
  const leadRes = await pool.query('SELECT * FROM leads WHERE id = $1', [lid]);
  const lead = leadRes.rows[0];
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const inserted = await pool.query(
    `INSERT INTO quotes (lead_id, price, details, status, created_by)
     VALUES ($1, $2, $3, 'Sent', $4) RETURNING *`,
    [lid, price ?? null, details ?? null, req.user.id]
  );
  let quote = inserted.rows[0];

  // Generate the PDF, publish it to storage, and persist its URL.
  const { localPath, key } = await generateQuotePdf({ quote, lead });
  const pdfUrl = await storage.publish(localPath, key, 'application/pdf');
  const updated = await pool.query('UPDATE quotes SET pdf_path = $2 WHERE id = $1 RETURNING *', [quote.id, pdfUrl]);
  quote = updated.rows[0];

  // Advance the lead and notify the client with the quote link.
  await pool.query("UPDATE leads SET status = 'Quoted', updated_at = now() WHERE id = $1", [lid]);
  // Fire-and-forget — don't block the response on email/WhatsApp delivery.
  notify({
    email: lead.email,
    phone: lead.phone,
    subject: `Your KV Tree quotation #${quote.id}`,
    message: `Hi ${lead.name || 'there'}, your quotation for "${lead.service}" is ready: R ${Number(price || 0).toFixed(2)}. View it here: ${pdfUrl}`,
    attachments: [{ filename: `quote-${quote.id}.pdf`, path: localPath }],
  }).catch((e) => console.error('notify error', e.message));

  res.status(201).json(quote);
}));

app.get('/api/quotes', authRequired, asyncHandler(async (req, res) => {
  if (isStaff(req.user)) {
    const { rows } = req.query.leadId
      ? await pool.query('SELECT * FROM quotes WHERE lead_id = $1 ORDER BY created_at DESC', [parseId(req.query.leadId)])
      : await pool.query('SELECT * FROM quotes ORDER BY created_at DESC');
    return res.json(rows);
  }
  // Clients: quotes attached to their leads only.
  const { rows } = await pool.query(
    `SELECT q.* FROM quotes q JOIN leads l ON l.id = q.lead_id
     WHERE l.client_id = $1 OR l.email = $2 ORDER BY q.created_at DESC`,
    [req.user.id, req.user.email]
  );
  res.json(rows);
}));

app.get('/api/quotes/:id', authRequired, asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { rows } = await pool.query(
    `SELECT q.*, l.client_id, l.email AS lead_email FROM quotes q
     JOIN leads l ON l.id = q.lead_id WHERE q.id = $1`,
    [id]
  );
  const quote = rows[0];
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  if (!isStaff(req.user) && quote.client_id !== req.user.id && quote.lead_email !== req.user.email) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  res.json(quote);
}));

// Client accepts/rejects; staff edits price/details.
app.put('/api/quotes/:id', authRequired, asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const cur = await pool.query(
    `SELECT q.*, l.client_id, l.email AS lead_email FROM quotes q
     JOIN leads l ON l.id = q.lead_id WHERE q.id = $1`,
    [id]
  );
  const quote = cur.rows[0];
  if (!quote) return res.status(404).json({ error: 'Quote not found' });

  const owner = quote.client_id === req.user.id || quote.lead_email === req.user.email;
  if (!isStaff(req.user) && !owner) return res.status(403).json({ error: 'Insufficient permissions' });

  // Clients may only change status to Accepted/Rejected.
  if (!isStaff(req.user)) {
    const status = req.body.status;
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Clients can only accept or reject' });
    }
    const { rows } = await pool.query('UPDATE quotes SET status = $2, updated_at = now() WHERE id = $1 RETURNING *', [id, status]);
    if (status === 'Accepted') {
      await pool.query("UPDATE leads SET status = 'Booked', updated_at = now() WHERE id = $1", [quote.lead_id]);
    }
    return res.json(rows[0]);
  }

  const { rows } = await pool.query(
    `UPDATE quotes SET price = COALESCE($2, price), details = COALESCE($3, details),
       status = COALESCE($4, status), updated_at = now() WHERE id = $1 RETURNING *`,
    [id, req.body.price ?? null, req.body.details ?? null, req.body.status ?? null]
  );
  res.json(rows[0]);
}));

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------
// Assemble the calendar event payload for a job from its lead + worker.
async function calendarOptsForJob(job) {
  const leadRes = job.lead_id ? await pool.query('SELECT * FROM leads WHERE id = $1', [job.lead_id]) : { rows: [] };
  const lead = leadRes.rows[0];
  const workerRes = job.assigned_worker_id
    ? await pool.query('SELECT email FROM users WHERE id = $1', [job.assigned_worker_id])
    : { rows: [] };
  return {
    summary: `KV Tree — ${lead?.service || 'Job'} for ${lead?.name || 'client'}`,
    description: `${lead?.description || ''}\n\nJob #${job.id}. ${job.notes || ''}`.trim(),
    location: lead?.address || undefined,
    startISO: job.scheduled_date,
    durationHours: 2,
    attendees: [lead?.email, workerRes.rows[0]?.email],
  };
}

app.post('/api/jobs', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  const { quoteId, leadId, assignedWorkerId, scheduledDate, notes, photos } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO jobs (quote_id, lead_id, assigned_worker_id, scheduled_date, notes, photos)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING *`,
    [parseId(quoteId), parseId(leadId), assignedWorkerId ?? null, scheduledDate ?? null, notes ?? null, JSON.stringify(photos ?? [])]
  );
  let job = rows[0];
  if (leadId) await pool.query("UPDATE leads SET status = 'Booked', updated_at = now() WHERE id = $1", [parseId(leadId)]);

  // Create a Google Calendar event if scheduling info is present.
  if (job.scheduled_date) {
    const event = await calendar.createEvent(await calendarOptsForJob(job));
    if (event) {
      job = (await pool.query(
        'UPDATE jobs SET calendar_event_id = $2, calendar_link = $3 WHERE id = $1 RETURNING *',
        [job.id, event.id, event.link]
      )).rows[0];
    }
  }
  res.status(201).json(job);
}));

app.get('/api/jobs', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  // Workers see only their assigned jobs; admins see all.
  const { rows } = req.user.role === 'worker'
    ? await pool.query('SELECT * FROM jobs WHERE assigned_worker_id = $1 ORDER BY scheduled_date NULLS LAST', [req.user.id])
    : await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
  res.json(rows);
}));

app.put('/api/jobs/:id', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { rows } = await pool.query(
    `UPDATE jobs SET
       assigned_worker_id = COALESCE($2, assigned_worker_id),
       scheduled_date = COALESCE($3, scheduled_date),
       status = COALESCE($4, status),
       notes = COALESCE($5, notes),
       photos = COALESCE($6::jsonb, photos),
       updated_at = now() WHERE id = $1 RETURNING *`,
    [id, req.body.assignedWorkerId ?? null, req.body.scheduledDate ?? null, req.body.status ?? null, req.body.notes ?? null, req.body.photos != null ? JSON.stringify(req.body.photos) : null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Job not found' });
  let job = rows[0];
  // Mirror completion onto the lead pipeline.
  if (job.status === 'Completed' && job.lead_id) {
    await pool.query("UPDATE leads SET status = 'Completed', updated_at = now() WHERE id = $1", [job.lead_id]);
  }
  // Keep the calendar in sync: cancel on completion, otherwise create/update.
  if (job.status === 'Completed' && job.calendar_event_id) {
    await calendar.deleteEvent(job.calendar_event_id);
    job = (await pool.query('UPDATE jobs SET calendar_event_id = NULL, calendar_link = NULL WHERE id = $1 RETURNING *', [job.id])).rows[0];
  } else if (job.scheduled_date) {
    const opts = await calendarOptsForJob(job);
    const event = job.calendar_event_id
      ? await calendar.updateEvent(job.calendar_event_id, opts)
      : await calendar.createEvent(opts);
    if (event) {
      job = (await pool.query(
        'UPDATE jobs SET calendar_event_id = $2, calendar_link = $3 WHERE id = $1 RETURNING *',
        [job.id, event.id, event.link]
      )).rows[0];
    }
  }
  res.json(job);
}));

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------
// Staff: raise an invoice for a lead → generate PDF → mark lead 'Invoiced' → email client.
app.post('/api/invoices', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  const { leadId, quoteId, jobId, amount } = req.body;
  const lid = parseId(leadId);
  if (!lid) return res.status(400).json({ error: 'Valid leadId required' });
  if (amount == null || Number.isNaN(Number(amount))) return res.status(400).json({ error: 'Valid amount required' });
  const leadRes = await pool.query('SELECT * FROM leads WHERE id = $1', [lid]);
  const lead = leadRes.rows[0];
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const inserted = await pool.query(
    `INSERT INTO invoices (lead_id, quote_id, job_id, amount, status)
     VALUES ($1, $2, $3, $4, 'Unpaid') RETURNING *`,
    [lid, parseId(quoteId), parseId(jobId), Number(amount)]
  );
  let invoice = inserted.rows[0];

  const { localPath, key } = await generateInvoicePdf({ invoice, lead });
  const pdfUrl = await storage.publish(localPath, key, 'application/pdf');
  invoice = (await pool.query('UPDATE invoices SET pdf_path = $2 WHERE id = $1 RETURNING *', [invoice.id, pdfUrl])).rows[0];
  await pool.query("UPDATE leads SET status = 'Invoiced', updated_at = now() WHERE id = $1", [lid]);

  // Fire-and-forget — don't block the response on email/WhatsApp delivery.
  notify({
    email: lead.email,
    phone: lead.phone,
    subject: `Invoice #${invoice.id} from KV Tree`,
    message: `Hi ${lead.name || 'there'}, your invoice for "${lead.service}" of R ${Number(amount).toFixed(2)} is ready. View it here: ${pdfUrl} — or log in to your account to pay it online.`,
    attachments: [{ filename: `invoice-${invoice.id}.pdf`, path: localPath }],
  }).catch((e) => console.error('notify error', e.message));

  res.status(201).json(invoice);
}));

app.get('/api/invoices', authRequired, asyncHandler(async (req, res) => {
  if (isStaff(req.user)) {
    const { rows } = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
    return res.json(rows);
  }
  const { rows } = await pool.query(
    `SELECT i.* FROM invoices i JOIN leads l ON l.id = i.lead_id
     WHERE l.client_id = $1 OR l.email = $2 ORDER BY i.created_at DESC`,
    [req.user.id, req.user.email]
  );
  res.json(rows);
}));

// Helper: fetch invoice + lead with an ownership check.
async function getInvoiceForUser(id, user) {
  const { rows } = await pool.query(
    `SELECT i.*, l.client_id, l.email AS lead_email, l.name AS lead_name, l.phone AS lead_phone, l.service AS lead_service, l.address AS lead_address
     FROM invoices i JOIN leads l ON l.id = i.lead_id WHERE i.id = $1`,
    [id]
  );
  const inv = rows[0];
  if (!inv) return { error: 404 };
  if (!isStaff(user) && inv.client_id !== user.id && inv.lead_email !== user.email) return { error: 403 };
  return { invoice: inv };
}

app.get('/api/invoices/:id', authRequired, asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { invoice, error } = await getInvoiceForUser(id, req.user);
  if (error === 404) return res.status(404).json({ error: 'Invoice not found' });
  if (error === 403) return res.status(403).json({ error: 'Insufficient permissions' });
  res.json(invoice);
}));

// Owner: initiate online payment. Returns PayFast form fields to POST.
app.post('/api/invoices/:id/pay', authRequired, asyncHandler(async (req, res) => {
  if (!paymentsEnabled) return res.status(503).json({ error: 'Online payments are not configured' });
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { invoice, error } = await getInvoiceForUser(id, req.user);
  if (error === 404) return res.status(404).json({ error: 'Invoice not found' });
  if (error === 403) return res.status(403).json({ error: 'Insufficient permissions' });
  if (invoice.status === 'Paid') return res.status(400).json({ error: 'Invoice already paid' });

  const site = process.env.SITE_URL || PUBLIC_URL;
  const payment = buildPayment({
    invoice,
    lead: { name: invoice.lead_name, email: invoice.lead_email },
    returnUrl: `${site}/portal?paid=${invoice.id}`,
    cancelUrl: `${site}/portal?cancelled=${invoice.id}`,
    notifyUrl: `${PUBLIC_URL}/api/payments/payfast/notify`,
  });
  res.json(payment);
}));

// Public: PayFast ITN webhook. Verifies the callback then marks the invoice paid.
app.post('/api/payments/payfast/notify', asyncHandler(async (req, res) => {
  // Always 200 quickly so PayFast doesn't retry; do the work after validating.
  res.status(200).end();
  const body = req.body || {};
  if (!verifySignature(body)) return console.warn('PayFast ITN: bad signature');
  const valid = await validateWithPayfast(req.rawBody || '');
  if (!valid) return console.warn('PayFast ITN: server validation failed');

  const invoiceId = parseId(body.m_payment_id);
  if (!invoiceId) return;
  const invRes = await pool.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
  const invoice = invRes.rows[0];
  if (!invoice) return;

  // Confirm amount and completion status.
  if (body.payment_status === 'COMPLETE' && Number(body.amount_gross) === Number(invoice.amount)) {
    await pool.query(
      "UPDATE invoices SET status = 'Paid', payment_reference = $2, paid_at = now(), updated_at = now() WHERE id = $1",
      [invoiceId, body.pf_payment_id || null]
    );
    console.log(`💰 Invoice #${invoiceId} marked paid (ref ${body.pf_payment_id})`);
  }
}));

// ---------------------------------------------------------------------------
// Marketing campaigns (POPIA: only opted-in recipients)
// ---------------------------------------------------------------------------
async function campaignRecipients(segment) {
  if (segment === 'past') {
    const { rows } = await pool.query(
      `SELECT DISTINCT u.email, u.name FROM users u
       JOIN leads l ON (l.client_id = u.id OR l.email = u.email)
       WHERE u.marketing_opt_in = true AND u.role = 'client'
         AND l.status IN ('Completed', 'Invoiced')`
    );
    return rows;
  }
  const roleClause = segment === 'clients' ? "AND role = 'client'" : '';
  const { rows } = await pool.query(
    `SELECT email, name FROM users WHERE marketing_opt_in = true ${roleClause}`
  );
  return rows;
}

app.get('/api/campaigns', authRequired, requireRole('admin'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM campaigns ORDER BY created_at DESC');
  res.json(rows);
}));

// Preview the recipient count for a segment before sending.
app.get('/api/campaigns/recipients', authRequired, requireRole('admin'), asyncHandler(async (req, res) => {
  const recipients = await campaignRecipients(req.query.segment || 'all');
  res.json({ count: recipients.length });
}));

app.post('/api/campaigns', authRequired, requireRole('admin'), asyncHandler(async (req, res) => {
  const { subject, body, segment } = req.body;
  if (!subject || !body) return res.status(400).json({ error: 'Subject and body are required' });
  const seg = ['all', 'clients', 'past'].includes(segment) ? segment : 'all';
  const recipients = await campaignRecipients(seg);

  // Send individually so addresses aren't disclosed to each other.
  await Promise.all(
    recipients.map((r) =>
      sendEmail({
        to: r.email,
        subject,
        html: `<p>Hi ${r.name || 'there'},</p>${body}<hr/><p style="font-size:12px;color:#888">You received this because you opted in to KV Tree updates. Reply STOP to unsubscribe.</p>`,
        text: body.replace(/<[^>]+>/g, ''),
      }).catch((e) => console.error('campaign email error', e.message))
    )
  );

  const { rows } = await pool.query(
    `INSERT INTO campaigns (subject, body, segment, channel, recipients, sent_by)
     VALUES ($1, $2, $3, 'email', $4, $5) RETURNING *`,
    [subject, body, seg, recipients.length, req.user.id]
  );
  res.status(201).json(rows[0]);
}));

// ---------------------------------------------------------------------------
// Stats for the admin dashboard
// ---------------------------------------------------------------------------
app.get('/api/stats', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  const byStatus = await pool.query('SELECT status, COUNT(*)::int AS count FROM leads GROUP BY status');
  const totals = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM leads) AS leads,
      (SELECT COUNT(*)::int FROM quotes) AS quotes,
      (SELECT COUNT(*)::int FROM jobs) AS jobs,
      (SELECT COALESCE(SUM(price),0) FROM quotes WHERE status = 'Accepted') AS accepted_value,
      (SELECT COALESCE(SUM(amount),0) FROM invoices WHERE status = 'Paid') AS paid_revenue,
      (SELECT COALESCE(SUM(amount),0) FROM invoices WHERE status = 'Unpaid') AS outstanding
  `);
  res.json({ byStatus: byStatus.rows, totals: totals.rows[0] });
}));

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
  console.error('❌ Request error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ---------------------------------------------------------------------------
// Seed an initial admin (optional) then start
// ---------------------------------------------------------------------------
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length) return;
  const hash = await hashPassword(password);
  await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')",
    ['Administrator', email.toLowerCase(), hash]
  );
  console.log(`✅ Seeded admin user ${email}`);
}

initDb()
  .then(async () => {
    console.log('✅ Database schema ready');
    await seedAdmin();
  })
  .catch((err) => console.error('❌ Failed to initialize database:', err.message))
  .finally(() => {
    app.listen(port, () => console.log(`🚀 KV Tree API server listening on port ${port}`));
  });
