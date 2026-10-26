

USE MiniLMS;


CREATE OR REPLACE VIEW vw_CourseDetails AS
SELECT c.CourseID,
       c.CourseCode,
       c.Title,
       c.Description,
       u.Name         AS InstructorName,
       u.Email        AS InstructorEmail,
       c.Status,
       c.CreatedAt,
       (SELECT COUNT(*)
        FROM Modules m
        WHERE m.CourseID = c.CourseID) AS ModuleCount,
       (SELECT COUNT(*)
        FROM Enrollments e
        WHERE e.CourseID = c.CourseID) AS EnrollmentCount
FROM Courses c
JOIN Users u ON c.InstructorID = u.UserID;

CREATE OR REPLACE VIEW vw_EnrollmentDetails AS
SELECT e.EnrollmentID,
       u.Name         AS StudentName,
       u.Email        AS StudentEmail,
       c.CourseCode,
       c.Title        AS CourseTitle,
       e.EnrollDate,
       e.Status       AS EnrollmentStatus
FROM Enrollments e
JOIN Users u   ON e.UserID = u.UserID
JOIN Courses c ON e.CourseID = c.CourseID;


CREATE OR REPLACE VIEW vw_StudentGrades AS
SELECT g.GradeID,
       u.Name         AS StudentName,
       c.CourseCode,
       c.Title        AS CourseTitle,
       q.Title        AS QuizTitle,
       a.AttemptNo,
       a.Score,
       q.MaxScore,
       g.GradeValue,
       g.Status       AS GradeStatus,
       gr.Name        AS GradedByName,
       g.GradedAt
FROM Grades g
JOIN Attempts a ON g.AttemptID = a.AttemptID
JOIN Users u    ON a.StudentID = u.UserID
JOIN Quizzes q  ON a.QuizID = q.QuizID
JOIN Courses c  ON q.CourseID = c.CourseID
JOIN Users gr   ON g.GradedBy = gr.UserID;


SELECT 'Views created.' AS Result;
