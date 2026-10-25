'use strict';
/**
 * server.js - MiniLMS backend entry point (Node.js + Express + mysql2).
 *
 * Run:
 *   1. Copy-Item .env.example .env   (then edit DB_PASSWORD)
 *   2. npm install
 *   3. npm start
 *
 * The server exposes the JSON API under /api and also serves the three
 * frontend files (index.html, style.css, script.js) so the whole app runs
 * from one URL: http://localhost:5000
 * It does NOT serve the database/ folder (SQL files stay on disk only).
 */
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');
const routes = require('./routes');
const { ApiError } = require('./validators');

const app = express();
app.disable('x-powered-by');
const PORT = Number(process.env.PORT) || 5000;
const FRONTEND_DIR = path.join(__dirname, '..');

// CORS: the browser blocks cross-origin fetch unless the server opts in.
// Needed when the frontend is opened from file:// or another static server;
// requests still carry the Authorization header and are authenticated.
// (ALLOWED_ORIGINS in .env is kept for documentation/future hardening.)
app.use(cors({
  origin(origin, cb) {
    // Reflect any origin for this classroom demo (no cookies are used -
    // authentication is a Bearer token the browser stores itself).
    cb(null, origin || true);
  },
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json({ limit: '256kb' }));

// ---- API ----------------------------------------------------------------
// API responses (including the login token) must not be cached by browsers or
// intermediate proxies.
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use('/api', routes);

// ---- Frontend (static, just the three app files) ------------------------
app.get('/', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'index.html')));
app.get('/style.css', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'style.css')));
app.get('/script.js', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'script.js')));

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found.' });
});

// ---- Error handling -----------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ ok: false, error: err.message });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, error: 'Invalid JSON body.' });
  }
  if (err && err.errno === 1062) {
    return res.status(409).json({ ok: false, error: 'That record already exists.' });
  }
  if (err && (err.sqlState === '45000' || err.errno === 3819)) {
    return res.status(400).json({ ok: false, error: err.sqlMessage || 'Database rule violated.' });
  }
  // Log a compact, credential-free summary. mysql2 error objects can carry
  // SQL text and connection metadata, so the full object is never dumped to
  // log files (log redirection writes backend/*.log).
  const summary = `${(err && (err.code || err.name)) || 'Error'} - ${(err && err.message) || String(err)}`;
  console.error('[MiniLMS] Unhandled error:', summary);
  res.status(500).json({ ok: false, error: 'Internal server error.' });
});

// ---- Start --------------------------------------------------------------
app.listen(PORT, async () => {
  console.log(`[MiniLMS] Backend listening on http://localhost:${PORT}`);
  console.log(`[MiniLMS] Frontend    : http://localhost:${PORT}/`);
  try {
    await db.ping();
    console.log(`[MiniLMS] MySQL OK    : ${process.env.DB_NAME || 'MiniLMS'} @ ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
  } catch (err) {
    console.warn('[MiniLMS] WARNING: cannot reach MySQL right now -', err.message);
    console.warn('[MiniLMS] Start the MySQL80 service and check backend/.env credentials.');
  }
});
