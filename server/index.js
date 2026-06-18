const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
// Use PORT from environment (Railway/Render provide this), default to 5000.
const port = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
// Prefer a single DATABASE_URL if provided, otherwise fall back to the
// individual PG* variables (the convention Railway/most hosts use).
const useSsl = process.env.PGSSLMODE === 'require' || /sslmode=require/.test(process.env.DATABASE_URL || '');
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      }
);

pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
});

// Create tables if they don't exist. Runs once on startup.
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id          SERIAL PRIMARY KEY,
      name        TEXT,
      email       TEXT,
      phone       TEXT,
      address     TEXT,
      service     TEXT,
      description TEXT,
      photos      JSONB        NOT NULL DEFAULT '[]'::jsonb,
      status      TEXT         NOT NULL DEFAULT 'Quote Requested',
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id          SERIAL PRIMARY KEY,
      lead_id     INTEGER REFERENCES leads(id) ON DELETE SET NULL,
      price       NUMERIC,
      details     TEXT,
      status      TEXT         NOT NULL DEFAULT 'Draft',
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id              SERIAL PRIMARY KEY,
      quote_id        INTEGER REFERENCES quotes(id) ON DELETE SET NULL,
      assigned_worker TEXT,
      scheduled_date  TIMESTAMPTZ,
      status          TEXT        NOT NULL DEFAULT 'Scheduled',
      notes           TEXT,
      photos          JSONB       NOT NULL DEFAULT '[]'::jsonb,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS clients (
      id          SERIAL PRIMARY KEY,
      name        TEXT,
      email       TEXT,
      phone       TEXT,
      address     TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// Wrap async route handlers so rejected promises become 500s instead of
// crashing the process.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const parseId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// ---------------------------------------------------------------------------
// Health / diagnostics
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.send('KV Tree API is running');
});

app.get('/test-db', asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT NOW() as now');
  res.json({ message: 'Database connection successful!', timestamp: result.rows[0].now });
}));

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
app.post('/api/leads', asyncHandler(async (req, res) => {
  const { name, email, phone, address, service, description, photos } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO leads (name, email, phone, address, service, description, photos)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     RETURNING *`,
    [name, email, phone, address, service, description, JSON.stringify(photos ?? [])]
  );
  res.status(201).json(rows[0]);
}));

app.get('/api/leads', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
  res.json(rows);
}));

app.get('/api/leads/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { rows } = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Lead not found' });
  res.json(rows[0]);
}));

app.put('/api/leads/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { rows } = await pool.query(
    `UPDATE leads SET
       name = COALESCE($2, name),
       email = COALESCE($3, email),
       phone = COALESCE($4, phone),
       address = COALESCE($5, address),
       service = COALESCE($6, service),
       description = COALESCE($7, description),
       status = COALESCE($8, status),
       photos = COALESCE($9::jsonb, photos),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      req.body.name ?? null,
      req.body.email ?? null,
      req.body.phone ?? null,
      req.body.address ?? null,
      req.body.service ?? null,
      req.body.description ?? null,
      req.body.status ?? null,
      req.body.photos != null ? JSON.stringify(req.body.photos) : null,
    ]
  );
  if (!rows.length) return res.status(404).json({ error: 'Lead not found' });
  res.json(rows[0]);
}));

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------
app.post('/api/quotes', asyncHandler(async (req, res) => {
  const { leadId, price, details } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO quotes (lead_id, price, details)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [leadId ?? null, price ?? null, details ?? null]
  );
  res.status(201).json(rows[0]);
}));

app.get('/api/quotes', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM quotes ORDER BY created_at DESC');
  res.json(rows);
}));

app.get('/api/quotes/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { rows } = await pool.query('SELECT * FROM quotes WHERE id = $1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Quote not found' });
  res.json(rows[0]);
}));

app.put('/api/quotes/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { rows } = await pool.query(
    `UPDATE quotes SET
       price = COALESCE($2, price),
       details = COALESCE($3, details),
       status = COALESCE($4, status),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, req.body.price ?? null, req.body.details ?? null, req.body.status ?? null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Quote not found' });
  res.json(rows[0]);
}));

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------
app.post('/api/jobs', asyncHandler(async (req, res) => {
  const { quoteId, assignedWorker, scheduledDate, notes, photos } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO jobs (quote_id, assigned_worker, scheduled_date, notes, photos)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING *`,
    [quoteId ?? null, assignedWorker ?? null, scheduledDate ?? null, notes ?? null, JSON.stringify(photos ?? [])]
  );
  res.status(201).json(rows[0]);
}));

app.get('/api/jobs', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
  res.json(rows);
}));

app.get('/api/jobs/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { rows } = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Job not found' });
  res.json(rows[0]);
}));

app.put('/api/jobs/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { rows } = await pool.query(
    `UPDATE jobs SET
       assigned_worker = COALESCE($2, assigned_worker),
       scheduled_date = COALESCE($3, scheduled_date),
       status = COALESCE($4, status),
       notes = COALESCE($5, notes),
       photos = COALESCE($6::jsonb, photos),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      req.body.assignedWorker ?? null,
      req.body.scheduledDate ?? null,
      req.body.status ?? null,
      req.body.notes ?? null,
      req.body.photos != null ? JSON.stringify(req.body.photos) : null,
    ]
  );
  if (!rows.length) return res.status(404).json({ error: 'Job not found' });
  res.json(rows[0]);
}));

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
app.post('/api/clients', asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO clients (name, email, phone, address)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name ?? null, email ?? null, phone ?? null, address ?? null]
  );
  res.status(201).json(rows[0]);
}));

app.get('/api/clients', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
  res.json(rows);
}));

app.get('/api/clients/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Client not found' });
  res.json(rows[0]);
}));

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('❌ Request error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
initDb()
  .then(() => {
    console.log('✅ Database schema ready');
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database schema:', err.message);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`🚀 KV Tree API server listening on port ${port}`);
    });
  });
