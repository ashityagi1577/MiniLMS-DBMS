'use strict';
/**
 * routes.js - all MiniLMS API endpoints.
 *
 * Conventions:
 *  - Success: HTTP 200 with { ok: true, ... }
 *  - Failure: HTTP 4xx/5xx with { ok: false, error: "..." }
 *  - Every SQL statement uses `?` placeholders (parameterised queries).
 *  - Every input is validated with validators.js before use.
 *  - Identity (who is acting) always comes from the auth token, never
 *    from the request body - see auth.js.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');
const mappers = require('./mappers');
const v = require('./validators');
const rateLimit = require('./ratelimit');
const {
  issueToken,
  revokeToken,
  revokeUserSessions,
  verifyPassword,
  toPublicUser,
  requireAuth,
  requireRole,
  assertCourseManager,
} = require('./auth');

const router = express.Router();

/** Wrap async handlers so thrown ApiErrors reach the error middleware. */
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * A throwaway bcrypt hash used to spend the same work for unknown e-mails as
 * for real accounts, so sign-in timing does not reveal whether an address is
 * registered. (No password is involved: the comparison always fails.)
 */
const TIMING_DUMMY_HASH = bcrypt.hashSync('mini-lms-timing-equaliser', 10);

function clientIp(req) {
  return req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
}

/* =========================== health & demo helpers ======================= */

router.get('/health', h(async (req, res) => {
  try {
    await db.ping();
    res.json({ ok: true, db: 'connected', database: process.env.DB_NAME || 'MiniLMS' });
  } catch (err) {
    res.status(503).json({ ok: false, db: 'unreachable', error: 'Cannot reach MySQL. Check that MySQL80 is running and .env credentials are correct.' });
  }
}));

/**
 * Account list - ADMIN ONLY (requireAuth + requireRole('Admin').
 *
 * This endpoint used to be public, which let any unauthenticated visitor
 * enumerate every user's name, e-mail, role and status (account-enumeration
 * vulnerability). The login screen no longer needs it: the frontend ships a
 * small local demo-account config (DEMO_ACCOUNTS in script.js) instead.
 * Admins can still list accounts here or via GET /api/users below.
 */
router.get('/auth/accounts', requireAuth, requireRole('Admin'), h(async (req, res) => {
  const rows = await db.query('SELECT UserID, Name, Email, Role, Status FROM Users ORDER BY Role, UserID');
  res.json({ ok: true, users: rows.map(toPublicUser) });
}));

/* ================================ auth ================================== */

router.post('/auth/login', h(async (req, res) => {
  const emailInput = v.email(req.body && req.body.email);
  const passwordInput = String((req.body && req.body.password) ?? '');
  const ip = clientIp(req);

  // Rate limit BEFORE touching the database so a blocked client learns
  // nothing about the account either (generic 429, no enumeration).
  const gate = rateLimit.check(ip, emailInput);
  if (gate.blocked) {
    res.set('Retry-After', String(gate.retryAfterSeconds));
    throw new v.ApiError(429, 'Too many sign-in attempts. Please try again later.');
  }

  const row = await db.get('SELECT * FROM Users WHERE Email = ?', [emailInput]);
  if (!row) {
    // Spend the same bcrypt work as a real check, then fail generically:
    // the response must not reveal whether this e-mail is registered.
    await bcrypt.compare(passwordInput, TIMING_DUMMY_HASH);
    rateLimit.recordFailure(ip, emailInput);
    throw new v.ApiError(401, 'Invalid email or password.');
  }

  const okPassword = await verifyPassword(row, passwordInput);
  // Inactive accounts deliberately get the same generic answer (no status
  // oracle for attackers); admins still see the status in user management.
  if (!okPassword || row.Status !== 'Active') {
    rateLimit.recordFailure(ip, emailInput);
    throw new v.ApiError(401, 'Invalid email or password.');
  }

  rateLimit.recordSuccess(ip, emailInput);
  const token = issueToken(row.UserID);
  res.json({ ok: true, token, user: toPublicUser(row) });
}));

router.post('/auth/logout', h(async (req, res) => {
  revokeToken(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
    ? req.headers.authorization.slice(7) : null);
  res.json({ ok: true });
}));

router.get('/auth/me', requireAuth, h(async (req, res) => {
  res.json({ ok: true, user: toPublicUser(req.user) });
}));

router.post('/auth/change-password', requireAuth, h(async (req, res) => {
  const current = String((req.body && req.body.current) ?? '');
  const next = v.password((req.body && req.body.next), 'New password');
  const okCurrent = await verifyPassword(req.user, current);
  if (!okCurrent) throw new v.ApiError(400, 'Current password is incorrect.');
  const hash = await bcrypt.hash(next, 10);
  await db.query('UPDATE Users SET PasswordHash = ? WHERE UserID = ?', [hash, req.user.UserID]);
  // Keep the session that made the change, drop every other session of this
  // user (an attacker holding a stolen token loses access after a reset).
  revokeUserSessions(req.user.UserID, req.token);
  res.json({ ok: true });
}));

/* ============================== bootstrap =============================== */

/** Everything the frontend needs after login (one request, no passwords). */
router.get('/bootstrap', requireAuth, h(async (req, res) => {
  const payload = await mappers.fetchBootstrap(req.user);
  res.json({ ok: true, ...payload });
}));

/* =============================== courses ================================= */

router.get('/courses', requireAuth, h(async (req, res) => {
  const rows = await db.query('SELECT * FROM Courses ORDER BY CourseID');
  res.json({ ok: true, courses: rows.map(mappers.mapCourse) });
}));

router.get('/courses/:id', requireAuth, h(async (req, res) => {
  const id = v.int(req.params.id, 'CourseID');
  const row = await db.get('SELECT * FROM Courses WHERE CourseID = ?', [id]);
  if (!row) throw new v.ApiError(404, 'Course not found.');
  res.json({ ok: true, course: mappers.mapCourse(row) });
}));

router.post('/courses', requireAuth, requireRole('Instructor', 'Admin'), h(async (req, res) => {
  const body = req.body || {};
  const code = v.str(body.code, 'Course code', { max: 20 }).toUpperCase();
  const title = v.str(body.title, 'Title', { max: 150 });
  const desc = v.str(body.desc, 'Description', { max: 5000, optional: true });
  const status = body.status ? v.enumOf(body.status, ['Draft', 'Published', 'Archived'], 'Status') : 'Draft';

  // Instructor id: an instructor can only create courses for themselves;
  // an admin may assign any instructor. The value is checked against Users.
  let instructorId = req.user.UserID;
  if (req.user.Role === 'Admin' && body.instructorId !== undefined && body.instructorId !== null && body.instructorId !== '') {
    instructorId = v.int(body.instructorId, 'InstructorID');
  }
  const owner = await db.get('SELECT UserID, Role FROM Users WHERE UserID = ?', [instructorId]);
  if (!owner) throw new v.ApiError(400, 'Selected instructor does not exist.');
  if (owner.Role !== 'Instructor') throw new v.ApiError(400, 'Course owner must have Instructor role.');

  try {
    const courseId = await db.insert(
      'INSERT INTO Courses (CourseCode, Title, Description, InstructorID, Status) VALUES (?, ?, ?, ?, ?)',
      [code, title, desc || null, instructorId, status]
    );
    const row = await db.get('SELECT * FROM Courses WHERE CourseID = ?', [courseId]);
    res.json({ ok: true, course: mappers.mapCourse(row) });
  } catch (err) {
    if (err.errno === 1062) throw new v.ApiError(409, `Course code "${code}" already exists - codes must be unique.`);
    throw err;
  }
}));

router.put('/courses/:id', requireAuth, requireRole('Instructor', 'Admin'), h(async (req, res) => {
  const id = v.int(req.params.id, 'CourseID');
  const course = await assertCourseManager(req.user, id);
  const body = req.body || {};

  const fields = [];
  const params = [];
  if (body.code !== undefined) {
    const code = v.str(body.code, 'Course code', { max: 20 }).toUpperCase();
    if (code !== course.CourseCode) {
      const dup = await db.get('SELECT CourseID FROM Courses WHERE CourseCode = ? AND CourseID <> ?', [code, id]);
      if (dup) throw new v.ApiError(409, `Course code "${code}" already exists.`);
    }
    fields.push('CourseCode = ?');
    params.push(code);
  }
  if (body.title !== undefined) {
    fields.push('Title = ?');
    params.push(v.str(body.title, 'Title', { max: 150 }));
  }
  if (body.desc !== undefined) {
    fields.push('Description = ?');
    params.push(v.str(body.desc, 'Description', { max: 5000, optional: true }) || null);
  }
  if (body.status !== undefined) {
    fields.push('Status = ?');
    params.push(v.enumOf(body.status, ['Draft', 'Published', 'Archived'], 'Status'));
  }
  if (body.instructorId !== undefined && body.instructorId !== null && body.instructorId !== '') {
    const instructorId = v.int(body.instructorId, 'InstructorID');
    // Re-assigning to the SAME instructor is a no-op, so instructors may send
    // their own unchanged id from the edit form; only a real change is
    // restricted to admins.
    if (instructorId !== Number(course.InstructorID)) {
      if (req.user.Role !== 'Admin') throw new v.ApiError(403, 'Only an admin can reassign the course instructor.');
      const owner = await db.get('SELECT Role FROM Users WHERE UserID = ?', [instructorId]);
      if (!owner || owner.Role !== 'Instructor') throw new v.ApiError(400, 'Course owner must have Instructor role.');
      fields.push('InstructorID = ?');
      params.push(instructorId);
    }
  }
  if (!fields.length) throw new v.ApiError(400, 'Nothing to update.');

  params.push(id);
  await db.query(`UPDATE Courses SET ${fields.join(', ')} WHERE CourseID = ?`, params);
  const row = await db.get('SELECT * FROM Courses WHERE CourseID = ?', [id]);
  res.json({ ok: true, course: mappers.mapCourse(row) });
}));

/* =============================== modules ================================ */

router.post('/courses/:id/modules', requireAuth, requireRole('Instructor', 'Admin'), h(async (req, res) => {
  const courseId = v.int(req.params.id, 'CourseID');
  await assertCourseManager(req.user, courseId);
  const body = req.body || {};
  const title = v.str(body.title, 'Title', { max: 150 });
  const description = v.str(body.description, 'Description', { max: 2000, optional: true });

  let seq;
  if (body.seq !== undefined && body.seq !== null && body.seq !== '') {
    seq = v.int(body.seq, 'Sequence number');
  } else {
    const maxRow = await db.get('SELECT COALESCE(MAX(SequenceNo), 0) AS m FROM Modules WHERE CourseID = ?', [courseId]);
    seq = Number(maxRow.m) + 1;
  }
  try {
    const moduleId = await db.insert(
      'INSERT INTO Modules (CourseID, Title, Description, SequenceNo) VALUES (?, ?, ?, ?)',
      [courseId, title, description || null, seq]
    );
    const row = await db.get('SELECT * FROM Modules WHERE ModuleID = ?', [moduleId]);
    res.json({ ok: true, module: mappers.mapModule(row) });
  } catch (err) {
    if (err.errno === 1062) throw new v.ApiError(409, `Module sequence ${seq} already used in this course.`);
    throw err;
  }
}));

router.put('/modules/:id', requireAuth, requireRole('Instructor', 'Admin'), h(async (req, res) => {
  const id = v.int(req.params.id, 'ModuleID');
  const row = await db.get('SELECT * FROM Modules WHERE ModuleID = ?', [id]);
  if (!row) throw new v.ApiError(404, 'Module not found.');
  await assertCourseManager(req.user, row.CourseID);
  const body = req.body || {};

  const fields = [];
  const params = [];
  if (body.title !== undefined) {
    fields.push('Title = ?');
    params.push(v.str(body.title, 'Title', { max: 150 }));
  }
  if (body.description !== undefined) {
    fields.push('Description = ?');
    params.push(v.str(body.description, 'Description', { max: 2000, optional: true }) || null);
  }
  if (body.seq !== undefined && body.seq !== null && body.seq !== '') {
    fields.push('SequenceNo = ?');
    params.push(v.int(body.seq, 'Sequence number'));
  }
  if (!fields.length) throw new v.ApiError(400, 'Nothing to update.');
  params.push(id);
  try {
    await db.query(`UPDATE Modules SET ${fields.join(', ')} WHERE ModuleID = ?`, params);
  } catch (err) {
    if (err.errno === 1062) throw new v.ApiError(409, 'Module sequence already used in this course.');
    throw err;
  }
  const fresh = await db.get('SELECT * FROM Modules WHERE ModuleID = ?', [id]);
  res.json({ ok: true, module: mappers.mapModule(fresh) });
}));

router.delete('/modules/:id', requireAuth, requireRole('Instructor', 'Admin'), h(async (req, res) => {
  const id = v.int(req.params.id, 'ModuleID');
  const row = await db.get('SELECT * FROM Modules WHERE ModuleID = ?', [id]);
  if (!row) throw new v.ApiError(404, 'Module not found.');
  await assertCourseManager(req.user, row.CourseID);
  // Mirror the frontend rule: only empty modules may be deleted (otherwise
  // the ON DELETE CASCADE would silently remove the module's lessons).
  const lesson = await db.get('SELECT LessonID FROM Lessons WHERE ModuleID = ? LIMIT 1', [id]);
  if (lesson) throw new v.ApiError(400, 'Move or delete the module lessons first.');
  await db.query('DELETE FROM Modules WHERE ModuleID = ?', [id]);
  res.json({ ok: true });
}));

/* =============================== lessons ================================= */

router.post('/modules/:id/lessons', requireAuth, requireRole('Instructor', 'Admin'), h(async (req, res) => {
  const moduleId = v.int(req.params.id, 'ModuleID');
  const mod = await db.get('SELECT * FROM Modules WHERE ModuleID = ?', [moduleId]);
  if (!mod) throw new v.ApiError(404, 'Module not found.');
  await assertCourseManager(req.user, mod.CourseID);
  const body = req.body || {};
  const title = v.str(body.title, 'Title', { max: 150 });
  const content = v.str(body.content, 'Content', { max: 20000, optional: true });
  if (body.seq !== undefined && body.seq !== null && body.seq !== '') {
    v.int(body.seq, 'Sequence number'); // validate early for a clear error
  }
  const maxRow = await db.get('SELECT COALESCE(MAX(SequenceNo), 0) AS m FROM Lessons WHERE ModuleID = ?', [moduleId]);
  const seq = body.seq !== undefined && body.seq !== null && body.seq !== '' ? Number(body.seq) : Number(maxRow.m) + 1;
  try {
    const lessonId = await db.insert(
      'INSERT INTO Lessons (ModuleID, Title, Content, SequenceNo, ReleaseDate) VALUES (?, ?, ?, ?, NULL)',
      [moduleId, title, content || null, seq]
    );
    const row = await db.get(
      `SELECT l.*, m.CourseID AS CourseID FROM Lessons l
        JOIN Modules m ON m.ModuleID = l.ModuleID WHERE l.LessonID = ?`,
      [lessonId]
    );
    res.json({ ok: true, lesson: mappers.mapLesson({ ...row, GlobalSeq: 0 }) });
  } catch (err) {
    if (err.errno === 1062) throw new v.ApiError(409, 'Lesson sequence already used in this module.');
    throw err;
  }
}));

router.put('/lessons/:id', requireAuth, requireRole('Instructor', 'Admin'), h(async (req, res) => {
  const id = v.int(req.params.id, 'LessonID');
  const row = await db.get(
    `SELECT l.*, m.CourseID AS CourseID FROM Lessons l
       JOIN Modules m ON m.ModuleID = l.ModuleID WHERE l.LessonID = ?`,
    [id]
  );
  if (!row) throw new v.ApiError(404, 'Lesson not found.');
  await assertCourseManager(req.user, row.CourseID);
  const body = req.body || {};

  const fields = [];
  const params = [];
  if (body.title !== undefined) {
    fields.push('Title = ?');
    params.push(v.str(body.title, 'Title', { max: 150 }));
  }
  if (body.content !== undefined) {
    fields.push('Content = ?');
    params.push(v.str(body.content, 'Content', { max: 20000, optional: true }) || null);
  }
  if (body.seq !== undefined && body.seq !== null && body.seq !== '') {
    fields.push('SequenceNo = ?');
    params.push(v.int(body.seq, 'Sequence number'));
  }
  if (body.releaseDate !== undefined) {
    fields.push('ReleaseDate = ?');
    params.push(v.dateTime(body.releaseDate, 'Release date', { optional: true }));
  }
  if (!fields.length) throw new v.ApiError(400, 'Nothing to update.');
  params.push(id);
  try {
    await db.query(`UPDATE Lessons SET ${fields.join(', ')} WHERE LessonID = ?`, params);
  } catch (err) {
    if (err.errno === 1062) throw new v.ApiError(409, 'Lesson sequence already used in this module.');
    throw err;
  }
  const fresh = await db.get(
    `SELECT l.*, m.CourseID AS CourseID FROM Lessons l
       JOIN Modules m ON m.ModuleID = l.ModuleID WHERE l.LessonID = ?`,
    [id]
  );
  res.json({ ok: true, lesson: mappers.mapLesson({ ...fresh, GlobalSeq: 0 }) });
}));

router.delete('/lessons/:id', requireAuth, requireRole('Instructor', 'Admin'), h(async (req, res) => {
  const id = v.int(req.params.id, 'LessonID');
  const row = await db.get(
    `SELECT l.*, m.CourseID AS CourseID FROM Lessons l
       JOIN Modules m ON m.ModuleID = l.ModuleID WHERE l.LessonID = ?`,
    [id]
  );
  if (!row) throw new v.ApiError(404, 'Lesson not found.');
  await assertCourseManager(req.user, row.CourseID);
  await db.query('DELETE FROM Lessons WHERE LessonID = ?', [id]);
  res.json({ ok: true });
}));

/* ============================= enrollments =============================== */

router.post('/enrollments', requireAuth, requireRole('Student'), h(async (req, res) => {
  const body = req.body || {};
  const courseId = v.int(body.CourseID, 'CourseID');
  const studentId = req.user.UserID; // ALWAYS the token user - never the body

  const course = await db.get('SELECT * FROM Courses WHERE CourseID = ?', [courseId]);
  if (!course) throw new v.ApiError(404, 'Course not found.');
  if (course.Status !== 'Published') throw new v.ApiError(400, 'You can only enroll in published courses. (Rule 3)');

  const existing = await db.get(
    'SELECT * FROM Enrollments WHERE UserID = ? AND CourseID = ?',
    [studentId, courseId]
  );
  if (existing && existing.Status === 'Dropped') {
    // Re-join by re-activating the same row (UNIQUE(UserID, CourseID) rule).
    await db.query('UPDATE Enrollments SET Status = ? WHERE EnrollmentID = ?', ['Active', existing.EnrollmentID]);
    const row = await db.get('SELECT * FROM Enrollments WHERE EnrollmentID = ?', [existing.EnrollmentID]);
    return res.json({ ok: true, enrollment: mappers.mapEnrollment(row), reactivated: true });
  }
  if (existing) throw new v.ApiError(409, 'Already enrolled in this course. (Rule 4)');

  try {
    const id = await db.insert(
      'INSERT INTO Enrollments (UserID, CourseID, Status) VALUES (?, ?, ?)',
      [studentId, courseId, 'Active']
    );
    const row = await db.get('SELECT * FROM Enrollments WHERE EnrollmentID = ?', [id]);
    res.json({ ok: true, enrollment: mappers.mapEnrollment(row) });
  } catch (err) {
    if (err.errno === 1062) throw new v.ApiError(409, 'Already enrolled in this course. (Rule 4)');
    throw err;
  }
}));

/**
 * Change an enrollment's status.
 * Allowed by: the enrolled student themselves (self-service drop/complete),
 * the instructor who owns the course, or an admin.
 */
router.put('/enrollments/:id/status', requireAuth, h(async (req, res) => {
  const id = v.int(req.params.id, 'EnrollmentID');
  const status = v.enumOf((req.body && req.body.status), ['Active', 'Completed', 'Dropped'], 'Status');
  const row = await db.get('SELECT * FROM Enrollments WHERE EnrollmentID = ?', [id]);
  if (!row) throw new v.ApiError(404, 'Enrollment not found.');

  const isSelf = Number(row.UserID) === Number(req.user.UserID);
  if (!isSelf) {
    if (req.user.Role === 'Admin') {
      // allowed
    } else if (req.user.Role === 'Instructor') {
      await assertCourseManager(req.user, row.CourseID);
    } else {
      throw new v.ApiError(403, 'You may only change your own enrollment.');
    }
  }
  await db.query('UPDATE Enrollments SET Status = ? WHERE EnrollmentID = ?', [status, id]);
  const fresh = await db.get('SELECT * FROM Enrollments WHERE EnrollmentID = ?', [id]);
  res.json({ ok: true, enrollment: mappers.mapEnrollment(fresh) });
}));

/* ================================ quizzes ================================ */

router.post('/courses/:id/quizzes', requireAuth, requireRole('Instructor', 'Admin'), h(async (req, res) => {
  const courseId = v.int(req.params.id, 'CourseID');
  await assertCourseManager(req.user, courseId);
  const body = req.body || {};
  const title = v.str(body.title, 'Title', { max: 150 });
  const status = body.status ? v.enumOf(body.status, ['Draft', 'Published', 'Closed'], 'Status') : 'Draft';
  const maxAttempts = body.maxAttempts !== undefined ? v.int(body.maxAttempts, 'Max attempts', { min: 1 }) : 1;
  const availableFrom = v.dateTime(body.availableFrom, 'Available from', { optional: true });
  const availableUntil = v.dateTime(body.availableUntil, 'Available until', { optional: true });
  if (availableFrom && availableUntil && availableUntil <= availableFrom) {
    throw new v.ApiError(400, 'The end of the availability window must be after the start.');
  }
  try {
    const quizId = await db.insert(
      `INSERT INTO Quizzes (CourseID, Title, MaxScore, MaxAttempts, AvailableFrom, AvailableUntil, Status)
       VALUES (?, ?, 10, ?, ?, ?, ?)`,
      [courseId, title, maxAttempts, availableFrom, availableUntil, status]
    );
    const row = await db.get('SELECT * FROM Quizzes WHERE QuizID = ?', [quizId]);
    res.json({ ok: true, quiz: mappers.mapQuiz(row) });
  } catch (err) {
    if (err.errno === 1062) throw new v.ApiError(409, 'Duplicate quiz.');
    throw err;
  }
}));

router.put('/quizzes/:id', requireAuth, requireRole('Instructor', 'Admin'), h(async (req, res) => {
  const id = v.int(req.params.id, 'QuizID');
  const row = await db.get('SELECT * FROM Quizzes WHERE QuizID = ?', [id]);
  if (!row) throw new v.ApiError(404, 'Quiz not found.');
  await assertCourseManager(req.user, row.CourseID);
  const body = req.body || {};

  const fields = [];
  const params = [];
  if (body.title !== undefined) {
    fields.push('Title = ?');
    params.push(v.str(body.title, 'Title', { max: 150 }));
  }
  if (body.status !== undefined) {
    fields.push('Status = ?');
    params.push(v.enumOf(body.status, ['Draft', 'Published', 'Closed'], 'Status'));
  }
  if (body.maxAttempts !== undefined && body.maxAttempts !== null && body.maxAttempts !== '') {
    fields.push('MaxAttempts = ?');
    params.push(v.int(body.maxAttempts, 'Max attempts', { min: 1 }));
  }
  if (body.availableFrom !== undefined) {
    fields.push('AvailableFrom = ?');
    params.push(v.dateTime(body.availableFrom, 'Available from', { optional: true }));
  }
  if (body.availableUntil !== undefined) {
    fields.push('AvailableUntil = ?');
    params.push(v.dateTime(body.availableUntil, 'Available until', { optional: true }));
  }
  if (body.maxScore !== undefined && body.maxScore !== null && body.maxScore !== '') {
    fields.push('MaxScore = ?');
    params.push(v.int(body.maxScore, 'Max score', { min: 1 }));
  }
  if (!fields.length) throw new v.ApiError(400, 'Nothing to update.');

  // Re-check the availability window with the merged result.
  const from = body.availableFrom !== undefined ? v.dateTime(body.availableFrom, 'Available from', { optional: true }) : row.AvailableFrom;
  const until = body.availableUntil !== undefined ? v.dateTime(body.availableUntil, 'Available until', { optional: true }) : row.AvailableUntil;
  if (from && until && until <= from) {
    throw new v.ApiError(400, 'The end of the availability window must be after the start.');
  }

  params.push(id);
  await db.query(`UPDATE Quizzes SET ${fields.join(', ')} WHERE QuizID = ?`, params);
  const fresh = await db.get('SELECT * FROM Quizzes WHERE QuizID = ?', [id]);
  res.json({ ok: true, quiz: mappers.mapQuiz(fresh) });
}));

router.delete('/quizzes/:id', requireAuth, requireRole('Instructor', 'Admin'), h(async (req, res) => {
  const id = v.int(req.params.id, 'QuizID');
  const row = await db.get('SELECT * FROM Quizzes WHERE QuizID = ?', [id]);
  if (!row) throw new v.ApiError(404, 'Quiz not found.');
  await assertCourseManager(req.user, row.CourseID);
  // Attempts (and their grades) go with the quiz via ON DELETE CASCADE.
  await db.query('DELETE FROM Quizzes WHERE QuizID = ?', [id]);
  res.json({ ok: true });
}));

/* =============================== attempts ================================ */

/**
 * Submit a quiz attempt.
 * - StudentID comes from the token (never the body).
 * - Server re-checks: enrolled, quiz open, attempts remaining, score bounds.
 * - LIMITATION: the MySQL schema has no Questions table, so the server
 *   cannot re-grade the answers itself - it validates the client-computed
 *   Score against Quizzes.MaxScore (also enforced by trg_Attempts_CheckScore
 *   if 06_create_triggers.sql has been run).
 */
router.post('/attempts', requireAuth, requireRole('Student'), h(async (req, res) => {
  const body = req.body || {};
  const quizId = v.int(body.QuizID, 'QuizID');
  const score = numOrZero(body.Score);

  const quiz = await db.get('SELECT * FROM Quizzes WHERE QuizID = ?', [quizId]);
  if (!quiz) throw new v.ApiError(404, 'Quiz not found.');
  if (quiz.Status !== 'Published') throw new v.ApiError(400, 'This quiz is not open for attempts.');
  if (quiz.AvailableFrom && new Date(quiz.AvailableFrom).getTime() > Date.now()) {
    throw new v.ApiError(400, `Opens ${quiz.AvailableFrom}.`);
  }
  if (quiz.AvailableUntil && new Date(quiz.AvailableUntil).getTime() < Date.now()) {
    throw new v.ApiError(400, `Closed since ${quiz.AvailableUntil}.`);
  }

  const enrollment = await db.get(
    'SELECT * FROM Enrollments WHERE UserID = ? AND CourseID = ? AND Status <> ?',
    [req.user.UserID, quiz.CourseID, 'Dropped']
  );
  if (!enrollment) throw new v.ApiError(400, 'Enroll in the course before attempting quizzes. (Rule 3)');

  const usedRow = await db.get(
    'SELECT COUNT(*) AS used FROM Attempts WHERE QuizID = ? AND StudentID = ?',
    [quizId, req.user.UserID]
  );
  if (Number(usedRow.used) >= Number(quiz.MaxAttempts)) {
    throw new v.ApiError(400, `Attempt limit reached (${quiz.MaxAttempts}). (Rule 7)`);
  }
  if (score < 0 || score > Number(quiz.MaxScore)) {
    throw new v.ApiError(400, `Score must be between 0 and the quiz maximum of ${quiz.MaxScore}.`);
  }

  const attemptNo = Number(usedRow.used) + 1;
  try {
    const attemptId = await db.insert(
      `INSERT INTO Attempts (QuizID, StudentID, AttemptNo, Score, SubmittedAt, Status)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [quizId, req.user.UserID, attemptNo, score, 'Submitted']
    );
    const row = await db.get('SELECT * FROM Attempts WHERE AttemptID = ?', [attemptId]);
    res.json({ ok: true, attempt: mappers.mapAttempt({ ...row, CourseID: quiz.CourseID, MaxScore: quiz.MaxScore }) });
  } catch (err) {
    if (err.errno === 1062) throw new v.ApiError(409, 'That attempt number already exists - refresh and try again.');
    if (err.sqlState === '45000') throw new v.ApiError(400, err.sqlMessage);
    throw err;
  }
}));

function numOrZero(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new v.ApiError(400, 'Score must be a number.');
  return Math.round(n * 100) / 100;
}

/* ================================ grades ================================= */

/**
 * Create or update the grade for a student in a course.
 * The grade is attached to one of that student's attempts (the schema's
 * FK requires Attempts.AttemptID; an attempt-less student cannot be graded
 * until they attempt a quiz - see README).
 * Score arrives as the UI's 0-100 percentage and is stored as
 * GradeValue = Score / 100 * MaxScore so trg_Grades_CheckValue holds.
 */
router.post('/grades', requireAuth, requireRole('Instructor', 'Admin'), h(async (req, res) => {
  const body = req.body || {};
  const courseId = v.int(body.CourseID, 'CourseID');
  const studentId = v.int(body.StudentID, 'StudentID');
  const score100 = v.num(body.Score, 'Score', { min: 0, max: 100 });
  const status = body.status ? v.enumOf(body.status, ['draft', 'published', 'released'], 'Status') : 'draft';
  const published = status === 'published' || status === 'released';

  await assertCourseManager(req.user, courseId);

  // Prefer the attempt that already carries this student's grade in this
  // course, otherwise the student's most recent attempt in the course.
  const existing = await db.get(
    `SELECT g.*, a.AttemptID AS AttemptID, q.MaxScore AS MaxScore
       FROM Grades g
       JOIN Attempts a ON a.AttemptID = g.AttemptID
       JOIN Quizzes q ON q.QuizID = a.QuizID
      WHERE a.StudentID = ? AND q.CourseID = ?
      ORDER BY g.GradeID DESC LIMIT 1`,
    [studentId, courseId]
  );

  let attemptId;
  let maxScore;
  if (existing) {
    attemptId = Number(existing.AttemptID);
    maxScore = Number(existing.MaxScore);
  } else {
    const attempt = await db.get(
      `SELECT a.AttemptID AS AttemptID, q.MaxScore AS MaxScore
         FROM Attempts a JOIN Quizzes q ON q.QuizID = a.QuizID
        WHERE a.StudentID = ? AND q.CourseID = ?
        ORDER BY a.AttemptID DESC LIMIT 1`,
      [studentId, courseId]
    );
    if (!attempt) {
      throw new v.ApiError(400, 'No quiz attempt exists for this student in this course - the schema grades attempts, so ask the student to attempt a quiz first.');
    }
    attemptId = Number(attempt.AttemptID);
    maxScore = Number(attempt.MaxScore);
  }

  const gradeValue = Math.round((score100 / 100) * maxScore * 100) / 100;
  const dbStatus = published ? 'Published' : 'Draft';

  if (existing) {
    try {
      await db.query(
        'UPDATE Grades SET GradeValue = ?, Status = ?, GradedBy = ?, GradedAt = NOW() WHERE GradeID = ?',
        [gradeValue, dbStatus, req.user.UserID, existing.GradeID]
      );
    } catch (err) {
      if (err.sqlState === '45000') throw new v.ApiError(400, err.sqlMessage);
      throw err;
    }
    const row = await db.get(
      `SELECT g.*, a.StudentID AS StudentID, q.CourseID AS CourseID, q.MaxScore AS MaxScore
         FROM Grades g JOIN Attempts a ON a.AttemptID = g.AttemptID
         JOIN Quizzes q ON q.QuizID = a.QuizID WHERE g.GradeID = ?`,
      [existing.GradeID]
    );
    return res.json({ ok: true, grade: mappers.mapGrade(row) });
  }

  try {
    const gradeId = await db.insert(
      'INSERT INTO Grades (AttemptID, GradedBy, GradeValue, Status, GradedAt) VALUES (?, ?, ?, ?, NOW())',
      [attemptId, req.user.UserID, gradeValue, dbStatus]
    );
    const row = await db.get(
      `SELECT g.*, a.StudentID AS StudentID, q.CourseID AS CourseID, q.MaxScore AS MaxScore
         FROM Grades g JOIN Attempts a ON a.AttemptID = g.AttemptID
         JOIN Quizzes q ON q.QuizID = a.QuizID WHERE g.GradeID = ?`,
      [gradeId]
    );
    res.json({ ok: true, grade: mappers.mapGrade(row) });
  } catch (err) {
    if (err.errno === 1062) throw new v.ApiError(409, 'This attempt is already graded.');
    if (err.sqlState === '45000') throw new v.ApiError(400, err.sqlMessage);
    throw err;
  }
}));

/** Withdraw (back to draft) or re-publish a grade. */
router.put('/grades/:id/status', requireAuth, requireRole('Instructor', 'Admin'), h(async (req, res) => {
  const id = v.int(req.params.id, 'GradeID');
  const status = v.enumOf((req.body && req.body.status), ['draft', 'published', 'released'], 'Status');
  const row = await db.get(
    `SELECT g.*, q.CourseID AS CourseID
       FROM Grades g JOIN Attempts a ON a.AttemptID = g.AttemptID
       JOIN Quizzes q ON q.QuizID = a.QuizID WHERE g.GradeID = ?`,
    [id]
  );
  if (!row) throw new v.ApiError(404, 'Grade not found.');
  await assertCourseManager(req.user, row.CourseID);
  const dbStatus = status === 'draft' ? 'Draft' : 'Published';
  await db.query('UPDATE Grades SET Status = ? WHERE GradeID = ?', [dbStatus, id]);
  const fresh = await db.get(
    `SELECT g.*, a.StudentID AS StudentID, q.CourseID AS CourseID, q.MaxScore AS MaxScore
       FROM Grades g JOIN Attempts a ON a.AttemptID = g.AttemptID
       JOIN Quizzes q ON q.QuizID = a.QuizID WHERE g.GradeID = ?`,
    [id]
  );
  res.json({ ok: true, grade: mappers.mapGrade(fresh) });
}));

/* ================================= users ================================= */

router.get('/users', requireAuth, requireRole('Admin'), h(async (req, res) => {
  const rows = await db.query('SELECT * FROM Users ORDER BY UserID');
  res.json({ ok: true, users: rows.map(mappers.mapUser) });
}));

router.post('/users', requireAuth, requireRole('Admin'), h(async (req, res) => {
  const body = req.body || {};
  const name = v.str(body.name, 'Name', { max: 100 });
  const emailInput = v.email(body.email);
  const role = v.enumOf(body.role || 'Student', ['Student', 'Instructor', 'Admin'], 'Role');
  const status = body.status ? v.enumOf(body.status, ['Active', 'Inactive'], 'Status') : 'Active';
  const plain = v.password(body.password, 'Password');

  const dup = await db.get('SELECT UserID FROM Users WHERE Email = ?', [emailInput]);
  if (dup) throw new v.ApiError(409, 'That email is already registered.');

  const hash = await bcrypt.hash(plain, 10);
  try {
    const userId = await db.insert(
      'INSERT INTO Users (Name, Email, PasswordHash, Role, Status) VALUES (?, ?, ?, ?, ?)',
      [name, emailInput, hash, role, status]
    );
    const row = await db.get('SELECT * FROM Users WHERE UserID = ?', [userId]);
    res.json({ ok: true, user: mappers.mapUser(row) });
  } catch (err) {
    if (err.errno === 1062) throw new v.ApiError(409, 'That email is already registered.');
    throw err;
  }
}));

/**
 * Update a user. Admins may change anything; a signed-in user may update
 * their OWN Name only (profile form). Role/status are admin-only and the
 * "cannot deactivate yourself" rule is enforced here, not in the browser.
 */
router.put('/users/:id', requireAuth, h(async (req, res) => {
  const id = v.int(req.params.id, 'UserID');
  const row = await db.get('SELECT * FROM Users WHERE UserID = ?', [id]);
  if (!row) throw new v.ApiError(404, 'User not found.');
  const isAdmin = req.user.Role === 'Admin';
  const isSelf = Number(req.user.UserID) === id;
  if (!isAdmin && !isSelf) throw new v.ApiError(403, 'Only an admin can edit other users.');
  const body = req.body || {};

  const fields = [];
  const params = [];
  let passwordChanged = false;
  if (body.name !== undefined) {
    fields.push('Name = ?');
    params.push(v.str(body.name, 'Name', { max: 100 }));
  }
  if (body.email !== undefined) {
    if (!isAdmin) throw new v.ApiError(403, 'Only an admin can change an email address.');
    const emailInput = v.email(body.email);
    const dup = await db.get('SELECT UserID FROM Users WHERE Email = ? AND UserID <> ?', [emailInput, id]);
    if (dup) throw new v.ApiError(409, 'That email is already registered.');
    fields.push('Email = ?');
    params.push(emailInput);
  }
  if (body.role !== undefined) {
    if (!isAdmin) throw new v.ApiError(403, 'Only an admin can change a role.');
    fields.push('Role = ?');
    params.push(v.enumOf(body.role, ['Student', 'Instructor', 'Admin'], 'Role'));
  }
  if (body.status !== undefined) {
    const status = v.enumOf(body.status, ['Active', 'Inactive'], 'Status');
    if (isSelf && status !== 'Active') throw new v.ApiError(400, 'You cannot deactivate your own account.');
    if (!isAdmin) throw new v.ApiError(403, 'Only an admin can change an account status.');
    fields.push('Status = ?');
    params.push(status);
  }
  if (body.password !== undefined && body.password !== null && body.password !== '') {
    if (!isAdmin && !isSelf) throw new v.ApiError(403, 'Not allowed.');
    const plain = v.password(body.password, 'Password');
    fields.push('PasswordHash = ?');
    params.push(await bcrypt.hash(plain, 10));
    passwordChanged = true;
  }
  if (!fields.length) throw new v.ApiError(400, 'Nothing to update.');
  params.push(id);
  await db.query(`UPDATE Users SET ${fields.join(', ')} WHERE UserID = ?`, params);
  if (passwordChanged) {
    // Revoke the user's sessions after a password reset; if an admin is
    // resetting their own password, keep the session that made the change.
    revokeUserSessions(id, isSelf ? req.token : null);
  }
  const fresh = await db.get('SELECT * FROM Users WHERE UserID = ?', [id]);
  res.json({ ok: true, user: mappers.mapUser(fresh) });
}));

module.exports = router;
