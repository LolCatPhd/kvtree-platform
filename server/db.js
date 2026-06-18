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

module.exports = { pool, initDb, LEAD_STATUSES };
