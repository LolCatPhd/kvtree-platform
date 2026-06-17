const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
// CRITICAL: Use PORT from environment (Railway provides this)
const port = process.env.PORT || 5000;

// Add immediate logging
console.log(`🔧 Environment check:`);
console.log(`   PORT: ${process.env.PORT}`);
console.log(`   DB_HOST: ${process.env.PGHOST}`);
console.log(`   Starting server on port ${port}`);

// Use PG* variables that Railway provides
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

// Test database connection endpoint
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now');
    res.json({ 
      message: 'Database connection successful!',
      timestamp: result.rows[0].now 
    });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ 
      error: 'Database connection failed', 
      details: err.message 
    });
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage
let leads = [];
let quotes = [];
let jobs = [];
let clients = [];
let counter = 1;

// Helper to generate ID
const generateId = () => counter++;

// Lead schema: { id, name, email, phone, address, service, description, photos, status, createdAt, updatedAt }
// Quote schema: { id, leadId, price, details, status, createdAt, updatedAt }
// Job schema: { id, quoteId, assignedWorker, scheduledDate, status, notes, photos, createdAt, updatedAt }
// Client schema: { id, name, email, phone, address, createdAt }

// Routes

// Health check
app.get('/', (req, res) => {
  res.send('KV Tree API is running');
  console.log('📡 Health check request received');
});

// Lead endpoints
app.post('/api/leads', (req, res) => {
  const lead = {
    id: generateId(),
    ...req.body,
    status: 'Quote Requested',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  leads.push(lead);
  res.status(201).json(lead);
});

app.get('/api/leads', (req, res) => {
  res.json(leads);
});

app.get('/api/leads/:id', (req, res) => {
  const lead = leads.find(l => l.id === parseInt(req.params.id));
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

app.put('/api/leads/:id', (req, res) => {
  const lead = leads.find(l => l.id === parseInt(req.params.id));
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  Object.assign(lead, req.body, { updatedAt: new Date().toISOString() });
  res.json(lead);
});

// Quote endpoints
app.post('/api/quotes', (req, res) => {
  const quote = {
    id: generateId(),
    ...req.body,
    status: 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  quotes.push(quote);
  res.status(201).json(quote);
});

app.get('/api/quotes', (req, res) => {
  res.json(quotes);
});

app.get('/api/quotes/:id', (req, res) => {
  const quote = quotes.find(q => q.id === parseInt(req.params.id));
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  res.json(quote);
});

app.put('/api/quotes/:id', (req, res) => {
  const quote = quotes.find(q => q.id === parseInt(req.params.id));
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  Object.assign(quote, req.body, { updatedAt: new Date().toISOString() });
  res.json(quote);
});

// Job endpoints
app.post('/api/jobs', (req, res) => {
  const job = {
    id: generateId(),
    ...req.body,
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  jobs.push(job);
  res.status(201).json(job);
});

app.get('/api/jobs', (req, res) => {
  res.json(jobs);
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.find(j => j.id === parseInt(req.params.id));
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.put('/api/jobs/:id', (req, res) => {
  const job = jobs.find(j => j.id === parseInt(req.params.id));
  if (!job) return res.status(404).json({ error: 'Job not found' });
  Object.assign(job, req.body, { updatedAt: new Date().toISOString() });
  res.json(job);
});

// Client endpoints
app.post('/api/clients', (req, res) => {
  const client = {
    id: generateId(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  clients.push(client);
  res.status(201).json(client);
});

app.get('/api/clients', (req, res) => {
  res.json(clients);
});

app.get('/api/clients/:id', (req, res) => {
  const client = clients.find(c => c.id === parseInt(req.params.id));
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
});

const server = app.listen(port, () => {
  console.log(`🚀 KV Tree API server listening on port ${port}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

server.on('listening', () => {
  console.log(`👂 Server is now listening on port ${port}`);
});
// Redeploy trigger
