'use strict';
/**
 * auth.js - authentication (login tokens) and authorisation middleware.
 *
 * Security model (IMPORTANT - read before changing anything):
 *  - Identity comes ONLY from the server-side token. A request that says
 *    "I am user 7 / I am an instructor" in its JSON body is NEVER believed.
 *  - Tokens are random 64-hex strings kept in an in-memory server Map with
 *    an expiry. The browser stores its token in localStorage and sends it as
 *    `Authorization: Bearer <token>`.
 *  - On every protected request the user row is re-read from MySQL, so a
 *    deactivated account or a changed role takes effect immediately.
 *
 * KNOWN INCOMPLETE PARTS (also listed in README):
 *  - Sessions live in process memory: restarting the server logs everyone
 *    out, and this does not scale to several server instances. Swap the Map
 *    for a MySQL table or Redis for production.
 *  - No token refresh, no rate limiting, no HTTPS termination.
 *  - Seeded demo accounts contain placeholder password hashes (the SQL seed
 *    files were written before this backend existed). Login falls back to
 *    the DEMO_PASSWORD .env value for such rows; any account created through
 *    the API stores a real bcrypt hash.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { ApiError } = require('./validators');

const sessions = new Map(); // token -> { userId, expiresAt (ms) }

function tokenTtlMs() {
  const minutes = Number(process.env.TOKEN_TTL_MINUTES) || 480;
  return minutes * 60000;
}

function issueToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId, expiresAt: Date.now() + tokenTtlMs() });
  return token;
}

function revokeToken(token) {
  if (token) sessions.delete(token);
}

function readBearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

/** Does this user row accept the given plaintext password? */
async function verifyPassword(userRow, candidate) {
  const hash = String(userRow.PasswordHash || '');
  // A structurally valid bcrypt hash ($2a$/$2b$/$2y$, 60 chars) is verified
  // with bcrypt.compare. The $2y$ prefix (PHP) is normalised to $2b$.
  const looksLikeBcrypt = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash);
  if (looksLikeBcrypt) {
    return bcrypt.compare(String(candidate), hash.replace(/^\$2y\$/, '$2b$'));
  }
  // Placeholder hash from the seed file (not a real hash): accept the demo
  // password from .env. Accounts created through the API always get a real
  // bcrypt hash above, so they never take this path.
  return String(candidate) === String(process.env.DEMO_PASSWORD || 'demo123');
}

/** Map a MySQL Users row to the shape the frontend uses (lowercase enums, no hash). */
function toPublicUser(row) {
  if (!row) return null;
  return {
    id: String(row.UserID),
    name: row.Name,
    email: row.Email,
    role: String(row.Role).toLowerCase(),
    status: String(row.Status).toLowerCase(),
    createdAt: row.CreatedAt,
  };
}

/** Express middleware: require a valid token; sets req.user (MySQL row) + req.token. */
async function requireAuth(req, res, next) {
  try {
    const token = readBearer(req);
    if (!token) throw new ApiError(401, 'Not signed in.');
    const entry = sessions.get(token);
    if (!entry) throw new ApiError(401, 'Session expired. Please sign in again.');
    if (entry.expiresAt < Date.now()) {
      sessions.delete(token);
      throw new ApiError(401, 'Session expired. Please sign in again.');
    }
    const user = await db.get('SELECT * FROM Users WHERE UserID = ?', [entry.userId]);
    if (!user) throw new ApiError(401, 'Session expired. Please sign in again.');
    if (user.Status !== 'Active') throw new ApiError(403, 'This account is deactivated.');
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

/** Express middleware factory: require one of the given DB roles ('Admin', 'Instructor', 'Student'). */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not signed in.'));
    if (!roles.includes(req.user.Role)) {
      return next(new ApiError(403, `This action requires the ${roles.join(' or ')} role.`));
    }
    next();
  };
}

/**
 * Assert the signed-in user may manage a course (Admin always may,
 * an Instructor only if they own it). Returns the Courses row.
 */
async function assertCourseManager(user, courseId) {
  const course = await db.get('SELECT * FROM Courses WHERE CourseID = ?', [courseId]);
  if (!course) throw new ApiError(404, 'Course not found.');
  if (user.Role === 'Admin') return course;
  if (user.Role === 'Instructor' && Number(course.InstructorID) === Number(user.UserID)) return course;
  throw new ApiError(403, 'You can only manage your own courses.');
}

module.exports = {
  issueToken,
  revokeToken,
  readBearer,
  verifyPassword,
  toPublicUser,
  requireAuth,
  requireRole,
  assertCourseManager,
};
