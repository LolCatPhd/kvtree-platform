const { Pool } = require('pg');

// Prefer a single DATABASE_URL if provided, otherwise fall back to the
// individual PG* variables (the convention Railway/most hosts use).
const useSsl =
  process.env.PGSSLMODE === 'require' || /sslmode=require/.test(process.env.DATABASE_URL || '');

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

// Pipeline status values used by the Kanban board. Stored on leads.status.
const LEAD_STATUSES = [
  'Quote Requested',
  'Site Visit Scheduled',
  'Quoted',
  'Booked',
  'In Progress',
  'Completed',
  'Invoiced',
];

// Create tables if they don't exist. Runs once on startup. Uses IF NOT EXISTS
// and additive ALTERs so it is safe to re-run against an existing database.
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          TEXT,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'client',
      phone         TEXT,
      marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS leads (
      id                 SERIAL PRIMARY KEY,
      client_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
      assigned_worker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name               TEXT,
      email              TEXT,
      phone              TEXT,
      address            TEXT,
      service            TEXT,
      description        TEXT,
      latitude           DOUBLE PRECISION,
      longitude          DOUBLE PRECISION,
      estimated_quote    NUMERIC,
      photos             JSONB       NOT NULL DEFAULT '[]'::jsonb,
      status             TEXT        NOT NULL DEFAULT 'Quote Requested',
      created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id          SERIAL PRIMARY KEY,
      lead_id     INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      price       NUMERIC,
      details     TEXT,
      pdf_path    TEXT,
      status      TEXT         NOT NULL DEFAULT 'Draft',
      created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id              SERIAL PRIMARY KEY,
      quote_id        INTEGER REFERENCES quotes(id) ON DELETE SET NULL,
      lead_id         INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      assigned_worker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      scheduled_date  TIMESTAMPTZ,
      status          TEXT        NOT NULL DEFAULT 'Scheduled',
      notes           TEXT,
      photos          JSONB       NOT NULL DEFAULT '[]'::jsonb,
      calendar_event_id TEXT,
      calendar_link     TEXT,
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

    CREATE TABLE IF NOT EXISTS invoices (
      id                SERIAL PRIMARY KEY,
      lead_id           INTEGER REFERENCES leads(id) ON DELETE SET NULL,
      quote_id          INTEGER REFERENCES quotes(id) ON DELETE SET NULL,
      job_id            INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
      amount            NUMERIC NOT NULL,
      status            TEXT NOT NULL DEFAULT 'Unpaid',
      pdf_path          TEXT,
      payment_reference TEXT,
      paid_at           TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id           SERIAL PRIMARY KEY,
      subject      TEXT NOT NULL,
      body         TEXT NOT NULL,
      segment      TEXT NOT NULL DEFAULT 'all',
      channel      TEXT NOT NULL DEFAULT 'email',
      recipients   INTEGER NOT NULL DEFAULT 0,
      sent_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Crew roster for job costing. These are field workers who get paid a daily
    -- rate; they don't need portal logins (unlike the 'worker' role in users).
    CREATE TABLE IF NOT EXISTS workers (
      id                 SERIAL PRIMARY KEY,
      name               TEXT NOT NULL,
      phone              TEXT,
      default_daily_rate NUMERIC NOT NULL DEFAULT 0,
      active             BOOLEAN NOT NULL DEFAULT true,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- One row per (crew member, lead, day worked). The rate is snapshotted from
    -- the worker's default at log time but can be overridden per day. paid marks
    -- whether the worker has been paid for that day.
    CREATE TABLE IF NOT EXISTS job_worker_days (
      id                SERIAL PRIMARY KEY,
      lead_id           INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      worker_id         INTEGER REFERENCES workers(id) ON DELETE CASCADE,
      work_date         DATE NOT NULL,
      rate              NUMERIC NOT NULL DEFAULT 0,
      paid              BOOLEAN NOT NULL DEFAULT false,
      paid_at           TIMESTAMPTZ,
      payment_reference TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (lead_id, worker_id, work_date)
    );
  `);

  // Additive migrations for databases created before these columns existed.
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT false;`);
  await pool.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;`);
  await pool.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS calendar_link TEXT;`);
}

module.exports = { pool, initDb, LEAD_STATUSES };
