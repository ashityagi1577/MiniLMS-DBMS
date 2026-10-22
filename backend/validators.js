'use strict';
/**
 * validators.js - request validation helpers.
 * Every value coming from the browser is checked here before it reaches SQL.
 * Failed checks throw ApiError, which the error middleware turns into
 * HTTP 400 with { ok: false, error: "..." }.
 */

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Positive integer (database ids). */
function int(value, label = 'id', { min = 1, optional = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return null;
    throw new ApiError(400, `${label} is required.`);
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < min) throw new ApiError(400, `${label} must be a whole number >= ${min}.`);
  return n;
}

/** Number within an inclusive range (scores, marks...). */
function num(value, label, { min = -Infinity, max = Infinity, optional = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return null;
    throw new ApiError(400, `${label} is required.`);
  }
  const n = Number(value);
  if (!Number.isFinite(n)) throw new ApiError(400, `${label} must be a number.`);
  if (n < min || n > max) throw new ApiError(400, `${label} must be between ${min} and ${max}.`);
  return n;
}

/** Trimmed string with length limits. */
function str(value, label, { max = 255, min = 1, optional = false } = {}) {
  if (value === undefined || value === null) value = '';
  const s = String(value).trim();
  if (!s) {
    if (optional) return '';
    throw new ApiError(400, `${label} is required.`);
  }
  if (s.length < min) throw new ApiError(400, `${label} must be at least ${min} characters.`);
  if (s.length > max) throw new ApiError(400, `${label} must be at most ${max} characters.`);
  return s;
}

/** One of a fixed set of allowed values (mirrors MySQL ENUM columns). */
function enumOf(value, allowed, label) {
  const s = String(value ?? '').trim();
  const match = allowed.find((a) => a.toLowerCase() === s.toLowerCase());
  if (!match) throw new ApiError(400, `${label} must be one of: ${allowed.join(', ')}.`);
  return match;
}

/** Simple e-mail format + length check. */
function email(value) {
  const s = str(value, 'Email', { max: 150 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new ApiError(400, 'Enter a valid email address.');
  return s;
}

/**
 * Convert anything date-like (ISO string, datetime-local value, Date) into
 * 'YYYY-MM-DD HH:MM:SS' for MySQL DATETIME columns. Returns null for empty.
 */
function dateTime(value, label, { optional = false } = {}) {
  if (value === undefined || value === null || String(value).trim() === '') {
    if (optional) return null;
    throw new ApiError(400, `${label} is required.`);
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new ApiError(400, `${label} is not a valid date/time.`);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** Password policy shared by register / change-password. */
function password(value, label = 'Password') {
  const s = String(value ?? '');
  if (s.length < 6) throw new ApiError(400, `${label} must be at least 6 characters.`);
  if (s.length > 72) throw new ApiError(400, `${label} must be at most 72 characters.`);
  return s;
}

module.exports = { ApiError, int, num, str, enumOf, email, dateTime, password };
