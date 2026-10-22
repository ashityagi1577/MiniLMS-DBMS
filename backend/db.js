'use strict';
/**
 * db.js - MySQL connection pool for MiniLMS.
 * All SQL in this backend goes through query()/get()/exec(), which use
 * mysql2 parameterised statements (`?` placeholders) - never string
 * concatenation - so user input can never alter SQL structure.
 * Database credentials come from .env (see .env.example).
 */
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'MiniLMS',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  // DATETIME columns are returned as 'YYYY-MM-DD HH:MM:SS' strings.
  // The browser parses those as local time, which keeps display correct.
  dateStrings: true,
};

const pool = mysql.createPool(config);

/** Run a parameterised query, return rows (SELECT) or result (INSERT/UPDATE). */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** Run a query expected to return at most one row (or null). */
async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length ? rows[0] : null;
}

/** Insert and return the generated auto-increment id. */
async function insert(sql, params = []) {
  const result = await pool.query(sql, params);
  return result[0].insertId;
}

/** Cheap connectivity check used by /api/health and at server start-up. */
async function ping() {
  await pool.query('SELECT 1');
  return true;
}

/** Close the pool (used by tests / graceful shutdown). */
async function closePool() {
  await pool.end();
}

module.exports = { pool, query, get, insert, ping, closePool };
