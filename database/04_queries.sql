-- ============================================================
-- 04_queries.sql
-- Project : MiniLMS - CSL0311 DBMS PBL
-- Purpose : Example queries showing joins, aggregates and
--           subqueries against the MiniLMS schema.
-- How to  : Open this file in MySQL Workbench and click the
--           "Execute" button (lightning icon), or run it from
--           the mysql client. Each block is independent.
-- ============================================================

USE MiniLMS;

-- ------------------------------------------------------------
-- Q1. All available courses with their instructor names (JOIN)
-- ------------------------------------------------------------
SELECT c.CourseCode,
       c.Title        AS CourseTitle,
       u.Name         AS InstructorName,
       u.Email        AS InstructorEmail,
       c.Status
FROM Courses c
JOIN Users u ON c.InstructorID = u.UserID
ORDER BY c.CourseCode;

-- ------------------------------------------------------------
-- Q2. The enrolled courses of one student (UserID = 5)
--     Change 5 to another UserID to see a different student.
-- ------------------------------------------------------------
SELECT u.Name         AS StudentName,
       c.CourseCode,
       c.Title        AS CourseTitle,
       e.Status       AS EnrollmentStatus,
       e.EnrollDate
FROM Enrollments e
JOIN Users u ON e.UserID = u.UserID
JOIN Courses c ON e.CourseID = c.CourseID
WHERE e.UserID = 5
ORDER BY e.EnrollDate;

-- ------------------------------------------------------------
-- Q3. Modules and lessons of one selected course (CourseID = 1)
-- ------------------------------------------------------------
SELECT c.CourseCode,
       m.SequenceNo   AS ModuleNo,
       m.Title        AS ModuleTitle,
       l.SequenceNo   AS LessonNo,
       l.Title        AS LessonTitle,
       l.ReleaseDate
FROM Modules m
JOIN Courses c ON m.CourseID = c.CourseID
JOIN Lessons l ON l.ModuleID = m.ModuleID
WHERE m.CourseID = 1
ORDER BY m.SequenceNo, l.SequenceNo;

-- ------------------------------------------------------------
-- Q4. All enrolled students of one selected course (CourseID = 1)
-- ------------------------------------------------------------
SELECT u.Name         AS StudentName,
       u.Email,
       e.Status       AS EnrollmentStatus,
       e.EnrollDate
FROM Enrollments e
JOIN Users u ON e.UserID = u.UserID
WHERE e.CourseID = 1
ORDER BY u.Name;

-- ------------------------------------------------------------
-- Q5. Quiz attempts and scores of one student (StudentID = 5)
-- ------------------------------------------------------------
SELECT u.Name         AS StudentName,
       q.Title        AS QuizTitle,
       c.CourseCode,
       a.AttemptNo,
       a.Score,
       q.MaxScore,
       a.Status       AS AttemptStatus,
       a.SubmittedAt
FROM Attempts a
JOIN Quizzes q ON a.QuizID = q.QuizID
JOIN Courses c ON q.CourseID = c.CourseID
JOIN Users u   ON a.StudentID = u.UserID
WHERE a.StudentID = 5
ORDER BY q.Title, a.AttemptNo;

-- ------------------------------------------------------------
-- Q6. All grades with student, course and grader names
--     (three joins in one query)
-- ------------------------------------------------------------
SELECT g.GradeID,
       u.Name         AS StudentName,
       c.CourseCode,
       c.Title        AS CourseTitle,
       q.Title        AS QuizTitle,
       g.GradeValue,
       g.Status       AS GradeStatus,
       gr.Name        AS GradedBy,
       g.GradedAt
FROM Grades g
JOIN Attempts a  ON g.AttemptID = a.AttemptID
JOIN Users u     ON a.StudentID = u.UserID
JOIN Quizzes q   ON a.QuizID = q.QuizID
JOIN Courses c   ON q.CourseID = c.CourseID
JOIN Users gr    ON g.GradedBy = gr.UserID
ORDER BY g.GradedAt;

-- ------------------------------------------------------------
-- Q7. Number of enrollments per course (GROUP BY)
--     LEFT JOIN + COALESCE keeps courses with zero students.
-- ------------------------------------------------------------
SELECT c.CourseCode,
       c.Title,
       COUNT(e.EnrollmentID) AS TotalEnrollments
FROM Courses c
LEFT JOIN Enrollments e ON e.CourseID = c.CourseID
GROUP BY c.CourseID, c.CourseCode, c.Title
ORDER BY TotalEnrollments DESC;

-- ------------------------------------------------------------
-- Q8. Students who have NOT enrolled in any course
--     (subquery with NOT EXISTS - the outer query runs first
--      for the WHERE clause, the inner query checks each row)
-- ------------------------------------------------------------
SELECT u.UserID,
       u.Name,
       u.Email
FROM Users u
WHERE u.Role = 'Student'
  AND NOT EXISTS (SELECT 1
                  FROM Enrollments e
                  WHERE e.UserID = u.UserID)
ORDER BY u.Name;

-- ------------------------------------------------------------
-- Q9. Highest score for each quiz (aggregate function MAX)
--     LEFT JOIN so quizzes without attempts are still listed.
-- ------------------------------------------------------------
SELECT q.QuizID,
       q.Title        AS QuizTitle,
       c.CourseCode,
       MAX(a.Score)   AS HighestScore,
       COUNT(a.AttemptID) AS TotalAttempts
FROM Quizzes q
JOIN Courses c   ON q.CourseID = c.CourseID
LEFT JOIN Attempts a ON a.QuizID = q.QuizID
GROUP BY q.QuizID, q.Title, c.CourseCode
ORDER BY HighestScore DESC;

-- ------------------------------------------------------------
-- Q10. Demo of joins + aggregates + subquery together:
--      students whose average score is above the overall
--      average score of all submitted attempts.
--      (The subquery in HAVING is evaluated once.)
-- ------------------------------------------------------------
SELECT u.Name                    AS StudentName,
       COUNT(a.AttemptID)        AS TotalAttempts,
       ROUND(AVG(a.Score), 2)    AS AverageScore
FROM Users u
JOIN Attempts a ON a.StudentID = u.UserID
WHERE a.Score IS NOT NULL
GROUP BY u.UserID, u.Name
HAVING AVG(a.Score) > (SELECT AVG(Score)
                       FROM Attempts
                       WHERE Score IS NOT NULL)
ORDER BY AverageScore DESC;
