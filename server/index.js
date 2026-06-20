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
const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

// PDFs are served through the API (see GET /files/...) so they work even when
// the storage bucket isn't publicly readable. A short HMAC token keeps the
// predictable keys from being trivially enumerable.
const FILE_FOLDERS = { quotes: 'quote', invoices: 'invoice' };
const fileToken = (key) => crypto.createHmac('sha256', JWT_SECRET).update(key).digest('hex').slice(0, 24);
const pdfKey = (folder, id) => `${folder}/${FILE_FOLDERS[folder]}-${id}.pdf`;
const pdfLink = (folder, id) => {
  const key = pdfKey(folder, id);
  return `${PUBLIC_URL}/files/${key}?t=${fileToken(key)}`;
};
// Add a ready-to-open pdf_url to a quote/invoice row when it has a PDF.
const withPdfUrl = (row, folder) => ({ ...row, pdf_url: row.pdf_path ? pdfLink(folder, row.id) : null });

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

// Stream a stored PDF through the API so links work without a public bucket.
// Validated by the HMAC token issued alongside the link.
app.get('/files/:folder/:name', asyncHandler(async (req, res) => {
  const { folder, name } = req.params;
  if (!FILE_FOLDERS[folder] || !/^[\w.\-]+\.pdf$/.test(name)) {
    return res.status(404).send('Not found');
  }
  const key = `${folder}/${name}`;
  if (req.query.t !== fileToken(key)) return res.status(403).send('Invalid or expired link');
  let obj;
  try {
    obj = await storage.getStream(key);
  } catch (e) {
    if (e?.name === 'NoSuchKey' || e?.code === 'ENOENT') return res.status(404).send('File not found');
    throw e;
  }
  res.setHeader('Content-Type', obj.contentType || 'application/pdf');
  if (obj.contentLength != null) res.setHeader('Content-Length', obj.contentLength);
  res.setHeader('Content-Disposition', `inline; filename="${name}"`);
  res.setHeader('Cache-Control', 'private, max-age=300');
  obj.stream.on('error', () => res.destroy());
  obj.stream.pipe(res);
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
// Move a lead forward in the pipeline only — never backwards. Taking an action
// (e.g. re-quoting a job that's already Booked) should not drag its Kanban card
// back to an earlier column.
async function advanceLeadStatus(leadId, currentStatus, target) {
  if (LEAD_STATUSES.indexOf(target) > LEAD_STATUSES.indexOf(currentStatus)) {
    await pool.query('UPDATE leads SET status = $2, updated_at = now() WHERE id = $1', [leadId, target]);
  }
}

const stageIndex = (s) => LEAD_STATUSES.indexOf(s);
const BOOKED_INDEX = stageIndex('Booked');

// Undo a booking: cancel any Google Calendar events and clear the scheduled
// date on the lead's job(s). Called when a card is dragged back before 'Booked'
// or when a new quote supersedes an existing booking (re-quote).
async function resetBooking(leadId) {
  const { rows } = await pool.query('SELECT * FROM jobs WHERE lead_id = $1', [leadId]);
  for (const job of rows) {
    if (job.calendar_event_id) {
      try {
        await calendar.deleteEvent(job.calendar_event_id);
      } catch (e) {
        console.error('calendar delete error', e.message);
      }
    }
    await pool.query(
      `UPDATE jobs SET scheduled_date = NULL, calendar_event_id = NULL, calendar_link = NULL,
         status = 'Scheduled', updated_at = now() WHERE id = $1`,
      [job.id]
    );
  }
  return rows.length;
}

async function notify({ email, phone, subject, message, attachments, mediaUrl }) {
  const tasks = [];
  if (email) tasks.push(sendEmail({ to: email, subject, text: message, html: `<p>${message}</p>`, attachments }).catch((e) => console.error('email error', e.message)));
  if (phone) tasks.push(sendWhatsApp({ to: phone, body: message, mediaUrl }).catch((e) => console.error('whatsapp error', e.message)));
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

  // Pipeline integrity checks when the status actually changes.
  if (req.body.status) {
    const curRes = await pool.query('SELECT status FROM leads WHERE id = $1', [id]);
    if (!curRes.rows.length) return res.status(404).json({ error: 'Lead not found' });
    const current = curRes.rows[0].status;
    if (req.body.status !== current) {
      // Invoiced is terminal — never move a card back out of it.
      if (current === 'Invoiced') {
        return res.status(409).json({
          error: 'This job is already invoiced — that is final. Reverse the invoice before moving it back.',
        });
      }
      // Dragging back before 'Booked' undoes the booking (date + calendar).
      if (stageIndex(req.body.status) < BOOKED_INDEX && stageIndex(current) >= BOOKED_INDEX) {
        await resetBooking(id);
      }
    }
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

  // A new quote can't supersede an invoiced job — the books are closed.
  if (lead.status === 'Invoiced') {
    return res.status(409).json({
      error: 'This job is already invoiced. Reverse the invoice before issuing a new quote.',
    });
  }
  // Re-quote: issuing a new quote on a job that's already Booked or further
  // resets the booking and pulls the card back to 'Quoted' so it follows the
  // pipeline again from there.
  const isRequote = stageIndex(lead.status) >= BOOKED_INDEX;

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

  // Advance (or reset) the lead and notify the client with the new quote.
  if (isRequote) {
    await resetBooking(lid);
    await pool.query("UPDATE leads SET status = 'Quoted', updated_at = now() WHERE id = $1", [lid]);
  } else {
    await advanceLeadStatus(lid, lead.status, 'Quoted');
  }
  // Fire-and-forget — don't block the response on email/WhatsApp delivery.
  notify({
    email: lead.email,
    phone: lead.phone,
    subject: `Your KV Tree quotation #${quote.id}`,
    message: `Hi ${lead.name || 'there'}, your quotation for "${lead.service}" is ready: R ${Number(price || 0).toFixed(2)}. The quote is attached as a PDF. Thank you for choosing KV Tree.`,
    attachments: [{ filename: `quote-${quote.id}.pdf`, path: localPath }],
    mediaUrl: pdfLink('quotes', quote.id),
  }).catch((e) => console.error('notify error', e.message));

  res.status(201).json({ ...withPdfUrl(quote, 'quotes'), requote: isRequote });
}));

app.get('/api/quotes', authRequired, asyncHandler(async (req, res) => {
  if (isStaff(req.user)) {
    const { rows } = req.query.leadId
      ? await pool.query(
          `SELECT q.*, l.name AS lead_name, l.service AS lead_service
           FROM quotes q LEFT JOIN leads l ON l.id = q.lead_id
           WHERE q.lead_id = $1 ORDER BY q.created_at DESC`,
          [parseId(req.query.leadId)]
        )
      : await pool.query(
          `SELECT q.*, l.name AS lead_name, l.service AS lead_service
           FROM quotes q LEFT JOIN leads l ON l.id = q.lead_id
           ORDER BY q.created_at DESC`
        );
    return res.json(rows.map((r) => withPdfUrl(r, 'quotes')));
  }
  // Clients: quotes attached to their leads only.
  const { rows } = await pool.query(
    `SELECT q.* FROM quotes q JOIN leads l ON l.id = q.lead_id
     WHERE l.client_id = $1 OR l.email = $2 ORDER BY q.created_at DESC`,
    [req.user.id, req.user.email]
  );
  res.json(rows.map((r) => withPdfUrl(r, 'quotes')));
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
  res.json(withPdfUrl(quote, 'quotes'));
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
  await advanceLeadStatus(lid, lead.status, 'Invoiced');

  // Fire-and-forget — don't block the response on email/WhatsApp delivery.
  notify({
    email: lead.email,
    phone: lead.phone,
    subject: `Invoice #${invoice.id} from KV Tree`,
    message: `Hi ${lead.name || 'there'}, your invoice for "${lead.service}" of R ${Number(amount).toFixed(2)} is attached as a PDF. Log in to your account to pay it online. Thank you for choosing KV Tree.`,
    attachments: [{ filename: `invoice-${invoice.id}.pdf`, path: localPath }],
    mediaUrl: pdfLink('invoices', invoice.id),
  }).catch((e) => console.error('notify error', e.message));

  res.status(201).json(withPdfUrl(invoice, 'invoices'));
}));

app.get('/api/invoices', authRequired, asyncHandler(async (req, res) => {
  if (isStaff(req.user)) {
    const { rows } = await pool.query(
      `SELECT i.*, l.name AS lead_name, l.service AS lead_service
       FROM invoices i LEFT JOIN leads l ON l.id = i.lead_id
       ORDER BY i.created_at DESC`
    );
    return res.json(rows.map((r) => withPdfUrl(r, 'invoices')));
  }
  const { rows } = await pool.query(
    `SELECT i.* FROM invoices i JOIN leads l ON l.id = i.lead_id
     WHERE l.client_id = $1 OR l.email = $2 ORDER BY i.created_at DESC`,
    [req.user.id, req.user.email]
  );
  res.json(rows.map((r) => withPdfUrl(r, 'invoices')));
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
  res.json(withPdfUrl(invoice, 'invoices'));
}));

// Staff: manually set an invoice's payment status (e.g. mark Paid on EFT
// received, or revert an error). Complements the automatic PayFast update.
app.put('/api/invoices/:id/status', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { status, reference } = req.body;
  if (!['Paid', 'Unpaid'].includes(status)) {
    return res.status(400).json({ error: "status must be 'Paid' or 'Unpaid'" });
  }
  const existing = await pool.query('SELECT id FROM invoices WHERE id = $1', [id]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Invoice not found' });

  const { rows } =
    status === 'Paid'
      ? await pool.query(
          `UPDATE invoices SET status = 'Paid', payment_reference = $2,
             paid_at = COALESCE(paid_at, now()), updated_at = now()
           WHERE id = $1 RETURNING *`,
          [id, (reference && String(reference).trim()) || 'Manual / EFT']
        )
      : await pool.query(
          `UPDATE invoices SET status = 'Unpaid', payment_reference = NULL,
             paid_at = NULL, updated_at = now()
           WHERE id = $1 RETURNING *`,
          [id]
        );
  console.log(`💰 Invoice #${id} manually marked ${status} by ${req.user.email}`);
  res.json(withPdfUrl(rows[0], 'invoices'));
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
// Crew roster + job costing
// ---------------------------------------------------------------------------
// The crew roster: field workers with a default daily rate. Separate from the
// 'users' table (those are login accounts); crew don't need portal access.
app.get('/api/workers', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM workers ORDER BY active DESC, name ASC'
  );
  res.json(rows);
}));

app.post('/api/workers', authRequired, requireRole('admin'), asyncHandler(async (req, res) => {
  const { name, phone, defaultDailyRate } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
  const { rows } = await pool.query(
    `INSERT INTO workers (name, phone, default_daily_rate)
     VALUES ($1, $2, $3) RETURNING *`,
    [String(name).trim(), phone ?? null, Number(defaultDailyRate) || 0]
  );
  res.status(201).json(rows[0]);
}));

app.put('/api/workers/:id', authRequired, requireRole('admin'), asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { name, phone, defaultDailyRate, active } = req.body;
  const { rows } = await pool.query(
    `UPDATE workers SET
       name = COALESCE($2, name),
       phone = COALESCE($3, phone),
       default_daily_rate = COALESCE($4, default_daily_rate),
       active = COALESCE($5, active)
     WHERE id = $1 RETURNING *`,
    [
      id,
      name != null ? String(name).trim() : null,
      phone ?? null,
      defaultDailyRate != null ? Number(defaultDailyRate) : null,
      typeof active === 'boolean' ? active : null,
    ]
  );
  if (!rows.length) return res.status(404).json({ error: 'Worker not found' });
  res.json(rows[0]);
}));

// Costing for a lead: every logged worker-day plus a per-worker summary of what
// is owed (totals split by paid / outstanding).
async function costingForLead(leadId) {
  const { rows: entries } = await pool.query(
    `SELECT d.id, d.lead_id, d.worker_id, to_char(d.work_date, 'YYYY-MM-DD') AS work_date,
            d.rate, d.paid, d.paid_at, d.payment_reference,
            w.name AS worker_name, w.phone AS worker_phone
     FROM job_worker_days d JOIN workers w ON w.id = d.worker_id
     WHERE d.lead_id = $1 ORDER BY d.work_date ASC, w.name ASC`,
    [leadId]
  );
  const { rows: summary } = await pool.query(
    `SELECT w.id AS worker_id, w.name AS worker_name, w.phone AS worker_phone,
            COUNT(*)::int AS days,
            COALESCE(SUM(d.rate), 0) AS total,
            COALESCE(SUM(d.rate) FILTER (WHERE NOT d.paid), 0) AS unpaid_total,
            COUNT(*) FILTER (WHERE NOT d.paid)::int AS unpaid_days
     FROM job_worker_days d JOIN workers w ON w.id = d.worker_id
     WHERE d.lead_id = $1
     GROUP BY w.id, w.name, w.phone ORDER BY w.name ASC`,
    [leadId]
  );
  return { entries, summary };
}

app.get('/api/leads/:id/costing', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  res.json(await costingForLead(id));
}));

// Log one or more days for a worker on a lead. Rate defaults to the worker's
// current default daily rate but can be overridden. Re-logging the same day
// updates the rate rather than erroring.
app.post('/api/leads/:id/costing', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const workerId = parseId(req.body.workerId);
  if (!workerId) return res.status(400).json({ error: 'Valid workerId required' });
  const dates = Array.isArray(req.body.dates) ? req.body.dates : [req.body.workDate];
  const clean = dates.filter((d) => d && /^\d{4}-\d{2}-\d{2}$/.test(d));
  if (!clean.length) return res.status(400).json({ error: 'At least one valid work date (YYYY-MM-DD) is required' });

  const wRes = await pool.query('SELECT default_daily_rate FROM workers WHERE id = $1', [workerId]);
  if (!wRes.rows.length) return res.status(404).json({ error: 'Worker not found' });
  const rate = req.body.rate != null ? Number(req.body.rate) : Number(wRes.rows[0].default_daily_rate) || 0;

  for (const work_date of clean) {
    await pool.query(
      `INSERT INTO job_worker_days (lead_id, worker_id, work_date, rate)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (lead_id, worker_id, work_date)
       DO UPDATE SET rate = EXCLUDED.rate`,
      [id, workerId, work_date, rate]
    );
  }
  res.status(201).json(await costingForLead(id));
}));

// Edit a single logged day (rate / date / paid flag).
app.put('/api/costing/:id', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const paid = typeof req.body.paid === 'boolean' ? req.body.paid : null;
  const { rows } = await pool.query(
    `UPDATE job_worker_days SET
       rate = COALESCE($2, rate),
       work_date = COALESCE($3, work_date),
       paid = COALESCE($4, paid),
       paid_at = CASE WHEN $4 IS TRUE THEN COALESCE(paid_at, now())
                      WHEN $4 IS FALSE THEN NULL ELSE paid_at END,
       payment_reference = CASE WHEN $4 IS FALSE THEN NULL ELSE payment_reference END
     WHERE id = $1 RETURNING lead_id`,
    [
      id,
      req.body.rate != null ? Number(req.body.rate) : null,
      req.body.workDate && /^\d{4}-\d{2}-\d{2}$/.test(req.body.workDate) ? req.body.workDate : null,
      paid,
    ]
  );
  if (!rows.length) return res.status(404).json({ error: 'Entry not found' });
  res.json(await costingForLead(rows[0].lead_id));
}));

app.delete('/api/costing/:id', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { rows } = await pool.query('DELETE FROM job_worker_days WHERE id = $1 RETURNING lead_id', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Entry not found' });
  res.json(await costingForLead(rows[0].lead_id));
}));

// Mark every outstanding day for a worker on a lead as paid, then WhatsApp the
// worker a payment receipt. Returns the refreshed costing plus delivery status.
app.post('/api/leads/:id/costing/pay', authRequired, requireRole('admin', 'worker'), asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const workerId = parseId(req.body.workerId);
  if (!workerId) return res.status(400).json({ error: 'Valid workerId required' });
  const reference = (req.body.reference && String(req.body.reference).trim()) || 'Cash / EFT';

  const wRes = await pool.query('SELECT * FROM workers WHERE id = $1', [workerId]);
  const worker = wRes.rows[0];
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  const { rows: paidRows } = await pool.query(
    `UPDATE job_worker_days SET paid = true, paid_at = now(), payment_reference = $3
     WHERE lead_id = $1 AND worker_id = $2 AND NOT paid
     RETURNING work_date, rate`,
    [id, workerId, reference]
  );
  if (!paidRows.length) {
    return res.status(400).json({ error: 'No outstanding days to pay for this worker' });
  }
  const total = paidRows.reduce((s, r) => s + Number(r.rate || 0), 0);
  const leadRes = await pool.query('SELECT name, service FROM leads WHERE id = $1', [id]);
  const lead = leadRes.rows[0] || {};

  const dateList = paidRows
    .map((r) => new Date(r.work_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }))
    .join(', ');
  const message =
    `KV Tree payment receipt\n\n` +
    `Hi ${worker.name}, you've been paid R ${total.toFixed(2)} for ${paidRows.length} day${paidRows.length === 1 ? '' : 's'} ` +
    `on the ${lead.service || 'job'}${lead.name ? ` for ${lead.name}` : ''}.\n` +
    `Days: ${dateList}\nReference: ${reference}\n\nThank you for your work.`;

  let whatsapp = { skipped: true };
  if (worker.phone) {
    try {
      whatsapp = await sendWhatsApp({ to: worker.phone, body: message });
    } catch (e) {
      console.error('worker receipt whatsapp error', e.message);
      whatsapp = { error: e.message };
    }
  }
  console.log(`💸 Paid ${worker.name} R${total.toFixed(2)} (${paidRows.length} days) on lead #${id} by ${req.user.email}`);
  res.json({ ...(await costingForLead(id)), paid: { worker_id: workerId, total, days: paidRows.length }, whatsapp });
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
