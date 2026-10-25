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

/** Load every table the frontend needs, mapped to frontend shapes (role-scoped). */
async function fetchBootstrap(user) {
  if (!user) {
    throw new Error('fetchBootstrap requires a user');
  }

  const role = String(user.Role || '').toLowerCase();

  if (role === 'admin') {
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

  if (role === 'instructor') {
    const instructorId = Number(user.UserID);

    // Get courses owned by this instructor
    const ownedCourses = await db.query('SELECT * FROM Courses WHERE InstructorID = ? ORDER BY CourseID', [instructorId]);
    const courseIds = ownedCourses.map((c) => c.CourseID);
    if (courseIds.length === 0) {
      // Still need self + possibly other instructors for forms; return minimal scoped data
      const [selfUser, allInstructors] = await Promise.all([
        db.query('SELECT * FROM Users WHERE UserID = ?', [instructorId]),
        db.query("SELECT * FROM Users WHERE Role = 'Instructor' AND Status = 'Active' ORDER BY UserID"),
      ]);
      const usersSet = new Map();
      selfUser.forEach((u) => usersSet.set(String(u.UserID), u));
      allInstructors.forEach((u) => usersSet.set(String(u.UserID), u));
      const users = Array.from(usersSet.values()).sort((a, b) => Number(a.UserID) - Number(b.UserID));
      return {
        users: users.map(mapUser),
        courses: [],
        modules: [],
        lessons: [],
        enrollments: [],
        quizzes: [],
        attempts: [],
        grades: [],
      };
    }

    const courseIdPlaceholders = courseIds.map(() => '?').join(',');

    const [usersRows, modules, lessons, enrollments, quizzes, attempts, grades] = await Promise.all([
      // self + students enrolled in own courses + active instructors (for dropdowns)
      db.query(
        `SELECT DISTINCT u.* FROM Users u
         WHERE u.UserID = ?
            OR (u.Role = 'Instructor' AND u.Status = 'Active')
            OR u.UserID IN (SELECT DISTINCT e.UserID FROM Enrollments e WHERE e.CourseID IN (${courseIdPlaceholders}))
         ORDER BY u.UserID`,
        [instructorId, ...courseIds]
      ),
      db.query(`SELECT * FROM Modules WHERE CourseID IN (${courseIdPlaceholders}) ORDER BY CourseID, SequenceNo`, courseIds),
      db.query(
        `SELECT l.*, m.CourseID AS CourseID
           FROM Lessons l
           JOIN Modules m ON m.ModuleID = l.ModuleID
          WHERE m.CourseID IN (${courseIdPlaceholders})
          ORDER BY m.CourseID, m.SequenceNo, l.SequenceNo`,
        courseIds
      ),
      db.query(`SELECT * FROM Enrollments WHERE CourseID IN (${courseIdPlaceholders}) ORDER BY EnrollmentID`, courseIds),
      db.query(`SELECT * FROM Quizzes WHERE CourseID IN (${courseIdPlaceholders}) ORDER BY QuizID`, courseIds),
      db.query(
        `SELECT a.*, q.CourseID AS CourseID, q.MaxScore AS MaxScore
           FROM Attempts a
           JOIN Quizzes q ON q.QuizID = a.QuizID
          WHERE q.CourseID IN (${courseIdPlaceholders})
          ORDER BY a.AttemptID`,
        courseIds
      ),
      db.query(
        `SELECT g.*, a.StudentID AS StudentID, a.QuizID AS QuizID,
                q.CourseID AS CourseID, q.MaxScore AS MaxScore
           FROM Grades g
           JOIN Attempts a ON a.AttemptID = g.AttemptID
           JOIN Quizzes q  ON q.QuizID = a.QuizID
          WHERE q.CourseID IN (${courseIdPlaceholders})
          ORDER BY g.GradeID`,
        courseIds
      ),
    ]);

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
      users: usersRows.map(mapUser),
      courses: ownedCourses.map(mapCourse),
      modules: modules.map(mapModule),
      lessons: mappedLessons,
      enrollments: enrollments.map(mapEnrollment),
      quizzes: quizzes.map(mapQuiz),
      attempts: attempts.map(mapAttempt),
      grades: grades.map(mapGrade),
    };
  }

  // student
  if (role === 'student') {
    const studentId = Number(user.UserID);

    // Get enrollments for this student
    const studentEnrollments = await db.query('SELECT * FROM Enrollments WHERE UserID = ? ORDER BY EnrollmentID', [studentId]);
    const enrolledCourseIds = studentEnrollments.map((e) => e.CourseID);

    // Courses: published OR enrolled
    let courses = [];
    if (enrolledCourseIds.length > 0) {
      const enrolledPlaceholders = enrolledCourseIds.map(() => '?').join(',');
      courses = await db.query(
        `SELECT * FROM Courses WHERE Status = 'Published' OR CourseID IN (${enrolledPlaceholders}) ORDER BY CourseID`,
        enrolledCourseIds
      );
    } else {
      courses = await db.query("SELECT * FROM Courses WHERE Status = 'Published' ORDER BY CourseID");
    }
    const courseIds = courses.map((c) => c.CourseID);
    if (courseIds.length === 0) {
      const selfUser = await db.query('SELECT * FROM Users WHERE UserID = ?', [studentId]);
      return {
        users: selfUser.map(mapUser),
        courses: [],
        modules: [],
        lessons: [],
        enrollments: [],
        quizzes: [],
        attempts: [],
        grades: [],
      };
    }

    const courseIdPlaceholders = courseIds.map(() => '?').join(',');

    const [instructorsRows, modules, lessons, quizzes, attempts, grades] = await Promise.all([
      // instructors of visible courses + self
      db.query(
        `SELECT DISTINCT u.* FROM Users u
         WHERE u.UserID = ?
            OR (u.Role = 'Instructor' AND u.UserID IN (SELECT DISTINCT c.InstructorID FROM Courses c WHERE c.CourseID IN (${courseIdPlaceholders})))
         ORDER BY u.UserID`,
        [studentId, ...courseIds]
      ),
      db.query(`SELECT * FROM Modules WHERE CourseID IN (${courseIdPlaceholders}) ORDER BY CourseID, SequenceNo`, courseIds),
      db.query(
        `SELECT l.*, m.CourseID AS CourseID
           FROM Lessons l
           JOIN Modules m ON m.ModuleID = l.ModuleID
          WHERE m.CourseID IN (${courseIdPlaceholders})
          ORDER BY m.CourseID, m.SequenceNo, l.SequenceNo`,
        courseIds
      ),
      // quizzes published OR attempted by self
      db.query(
        `SELECT DISTINCT q.* FROM Quizzes q
         WHERE q.CourseID IN (${courseIdPlaceholders})
           AND (q.Status = 'Published' OR q.QuizID IN (SELECT DISTINCT a.QuizID FROM Attempts a WHERE a.StudentID = ?))
         ORDER BY q.QuizID`,
        [...courseIds, studentId]
      ),
      db.query(
        `SELECT a.*, q.CourseID AS CourseID, q.MaxScore AS MaxScore
           FROM Attempts a
           JOIN Quizzes q ON q.QuizID = a.QuizID
          WHERE a.StudentID = ? AND q.CourseID IN (${courseIdPlaceholders})
          ORDER BY a.AttemptID`,
        [studentId, ...courseIds]
      ),
      // only published/released grades for this student
      db.query(
        `SELECT g.*, a.StudentID AS StudentID, a.QuizID AS QuizID,
                q.CourseID AS CourseID, q.MaxScore AS MaxScore
           FROM Grades g
           JOIN Attempts a ON a.AttemptID = g.AttemptID
           JOIN Quizzes q  ON q.QuizID = a.QuizID
          WHERE a.StudentID = ? AND q.CourseID IN (${courseIdPlaceholders}) AND g.Status = 'Published'
          ORDER BY g.GradeID`,
        [studentId, ...courseIds]
      ),
    ]);

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

    // Only own enrollments
    const ownEnrollments = studentEnrollments.filter((e) => courseIds.includes(e.CourseID));

    return {
      users: instructorsRows.map(mapUser),
      courses: courses.map(mapCourse),
      modules: modules.map(mapModule),
      lessons: mappedLessons,
      enrollments: ownEnrollments.map(mapEnrollment),
      quizzes: quizzes.map(mapQuiz),
      attempts: attempts.map(mapAttempt),
      grades: grades.map(mapGrade),
    };
  }

  // Fallback - deny by returning minimal
  const selfUser = await db.query('SELECT * FROM Users WHERE UserID = ?', [user.UserID]);
  return {
    users: selfUser.map(mapUser),
    courses: [],
    modules: [],
    lessons: [],
    enrollments: [],
    quizzes: [],
    attempts: [],
    grades: [],
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
