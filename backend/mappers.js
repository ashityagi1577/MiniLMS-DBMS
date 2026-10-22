'use strict';
/**
 * mappers.js - converts MySQL rows into the exact object shapes the
 * existing frontend already uses (camelCase keys, string ids, lowercase
 * enums). Keeping the mapping here means script.js changes stay minimal.
 *
 * Columns that do NOT exist in the MySQL schema (course category/level/
 * credits/prereqs, lesson type/duration, quiz questions/passMark, attempt
 * answers, grade feedback, user dept/phone/bio) are NOT produced here -
 * the browser fills them from its localStorage overlay (minilms_ext_v1).
 */
const db = require('./db');

const lower = (v) => String(v ?? '').toLowerCase();

function mapUser(row) {
  return {
    id: String(row.UserID),
    name: row.Name,
    email: row.Email,
    role: lower(row.Role),
    status: lower(row.Status),
    createdAt: row.CreatedAt,
  };
}

function mapCourse(row) {
  return {
    id: String(row.CourseID),
    code: row.CourseCode,
    title: row.Title,
    desc: row.Description || '',
    instructorId: String(row.InstructorID),
    status: lower(row.Status),
    createdAt: row.CreatedAt,
  };
}

function mapModule(row) {
  return {
    id: String(row.ModuleID),
    courseId: String(row.CourseID),
    title: row.Title,
    seq: Number(row.SequenceNo),
    description: row.Description || '',
  };
}

function mapLesson(row) {
  return {
    id: String(row.LessonID),
    courseId: String(row.CourseID),   // derived from the lesson's module
    moduleId: String(row.ModuleID),
    title: row.Title,
    seq: Number(row.SequenceNo),
    globalSeq: Number(row.GlobalSeq), // course-wide order (module seq, then lesson seq)
    content: row.Content || '',
    createdAt: row.CreatedAt || null,
  };
}

function mapEnrollment(row) {
  return {
    id: String(row.EnrollmentID),
    studentId: String(row.UserID),
    courseId: String(row.CourseID),
    status: lower(row.Status),
    enrolledAt: row.EnrollDate,
    completedAt: null, // no completion-date column exists; UI shows it locally
  };
}

function mapQuiz(row) {
  return {
    id: String(row.QuizID),
    courseId: String(row.CourseID),
    title: row.Title,
    maxScore: Number(row.MaxScore),      // read by the frontend for % display
    maxAttempts: Number(row.MaxAttempts),
    availableFrom: row.AvailableFrom,
    availableUntil: row.AvailableUntil,
    status: lower(row.Status),
    createdAt: row.CreatedAt || null,
  };
}

function mapAttempt(row) {
  const score = row.Score === null || row.Score === undefined ? null : Number(row.Score);
  const max = Number(row.MaxScore) || 1;
  return {
    id: String(row.AttemptID),
    quizId: String(row.QuizID),
    courseId: String(row.CourseID),      // derived from the attempt's quiz
    studentId: String(row.StudentID),
    attemptNo: Number(row.AttemptNo),
    score,
    // Percentage is reconstructed from Score / Quizzes.MaxScore (answers and
    // question totals live only in the browser - see README limitations).
    percentage: score === null ? 0 : Math.round((score / max) * 100),
    passed: false,                       // recomputed client-side with passMark
    status: row.Status === 'In Progress' ? 'in_progress' : 'submitted',
    submittedAt: row.SubmittedAt,
  };
}

function mapGrade(row) {
  const value = Number(row.GradeValue);
  const max = Number(row.MaxScore) || 1;
  const published = row.Status === 'Published';
  return {
    id: String(row.GradeID),
    attemptId: String(row.AttemptID),
    studentId: String(row.StudentID),    // derived via the graded attempt
    courseId: String(row.CourseID),      // derived via attempt -> quiz
    score: Math.round((value / max) * 100), // stored as GradeValue/MaxScore, shown as 0-100
    status: published ? 'released' : 'draft',
    createdAt: row.GradedAt,
    publishedAt: published ? row.GradedAt : null,
    adjustedAt: null,
  };
}

/** Load every table the frontend needs, mapped to frontend shapes. */
async function fetchBootstrap() {
  const [users, courses, modules, lessons, enrollments, quizzes, attempts, grades] = await Promise.all([
    db.query('SELECT * FROM Users ORDER BY UserID'),
    db.query('SELECT * FROM Courses ORDER BY CourseID'),
    db.query('SELECT * FROM Modules ORDER BY CourseID, SequenceNo'),
    db.query(
      `SELECT l.*, m.CourseID AS CourseID
         FROM Lessons l
         JOIN Modules m ON m.ModuleID = l.ModuleID
        ORDER BY m.CourseID, m.SequenceNo, l.SequenceNo`
    ),
    db.query('SELECT * FROM Enrollments ORDER BY EnrollmentID'),
    db.query('SELECT * FROM Quizzes ORDER BY QuizID'),
    db.query(
      `SELECT a.*, q.CourseID AS CourseID, q.MaxScore AS MaxScore
         FROM Attempts a
         JOIN Quizzes q ON q.QuizID = a.QuizID
        ORDER BY a.AttemptID`
    ),
    db.query(
      `SELECT g.*, a.StudentID AS StudentID, a.QuizID AS QuizID,
              q.CourseID AS CourseID, q.MaxScore AS MaxScore
         FROM Grades g
         JOIN Attempts a ON a.AttemptID = g.AttemptID
         JOIN Quizzes q  ON q.QuizID = a.QuizID
        ORDER BY g.GradeID`
    ),
  ]);

  // Lessons need a course-wide sequence number (globalSeq) in module order.
  let lastCourse = null;
  let globalSeq = 0;
  const mappedLessons = lessons.map((row) => {
    if (String(row.CourseID) !== lastCourse) {
      lastCourse = String(row.CourseID);
      globalSeq = 0;
    }
    globalSeq += 1;
    return mapLesson({ ...row, GlobalSeq: globalSeq });
  });

  return {
    users: users.map(mapUser),
    courses: courses.map(mapCourse),
    modules: modules.map(mapModule),
    lessons: mappedLessons,
    enrollments: enrollments.map(mapEnrollment),
    quizzes: quizzes.map(mapQuiz),
    attempts: attempts.map(mapAttempt),
    grades: grades.map(mapGrade),
  };
}

module.exports = {
  mapUser,
  mapCourse,
  mapModule,
  mapLesson,
  mapEnrollment,
  mapQuiz,
  mapAttempt,
  mapGrade,
  fetchBootstrap,
};
