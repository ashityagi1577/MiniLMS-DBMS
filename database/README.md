# MiniLMS - MySQL Database (CSL0311 DBMS PBL)

This folder contains the complete MySQL backend for MiniLMS as **SQL files only**
(no backend server code). It creates a database with 8 tables, 3 views, sample
data, and 10 example queries.

## Files (run them in this exact order)

| # | File | What it does |
|---|------|--------------|
| 1 | `01_create_database.sql` | Drops (if exists) and creates the `MiniLMS` database |
| 2 | `02_create_tables.sql` | Creates the 8 tables: `Users, Courses, Modules, Lessons, Enrollments, Quizzes, Attempts, Grades` |
| 3 | `03_insert_sample_data.sql` | Loads fictional demo data (13 users, 3 courses, 6 modules, 14 lessons, 11 enrollments, 4 quizzes, 6 attempts, 4 grades) |
| 4 | `04_queries.sql` | The 10 required example queries (joins, aggregates, subqueries) |
| 5 | `05_views.sql` | Creates 3 views: `vw_CourseDetails`, `vw_EnrollmentDetails`, `vw_StudentGrades` |
| - | `README.md` | This file |

## Schema summary

- **Engine:** InnoDB, charset `utf8mb4` (foreign keys required)
- **Primary keys:** `INT UNSIGNED AUTO_INCREMENT` named `UserID, CourseID, ...`
- **Foreign keys (10):** course -> instructor, module -> course, lesson -> module,
  enrollment -> user/course, quiz -> course, attempt -> quiz/student,
  grade -> attempt/gradedBy. Deleting a course cascades to its children;
  deleting users who own courses/enrollments/grades is blocked (`RESTRICT`).
- **Unique keys (7):** `Email`, `CourseCode`, `(CourseID,SequenceNo)`,
  `(ModuleID,SequenceNo)`, `(UserID,CourseID)`, `(QuizID,StudentID,AttemptNo)`, `AttemptID`
- **Check constraints (7):** positive sequence numbers, `MaxScore > 0`,
  `MaxAttempts > 0`, valid availability window, `Score >= 0`, `GradeValue >= 0`

## How to run (MySQL Workbench)

1. Start MySQL (`MySQL80` service) and open MySQL Workbench.
2. Connect to `Local instance` (enter the root password when asked).
3. `File > Open SQL Script...` and open `01_create_database.sql`, then click the
   **Execute** (lightning bolt) button.
4. Repeat for `02_create_tables.sql`, `03_insert_sample_data.sql`,
   `04_queries.sql`, `05_views.sql` - **always in order 1 -> 5**.
5. Re-running file 01 deletes the database, so 01-05 always start from a clean state.

### Command line alternative

```bat
cd /d C:\Users\Lenovo\Downloads\SmartConnect\minilms\database
set MYSQL_PWD=<your-local-mysql-password>
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root < 01_create_database.sql
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root < 02_create_tables.sql
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root < 03_insert_sample_data.sql
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root < 04_queries.sql
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root < 05_views.sql
```

`MYSQL_PWD` is set for this terminal session only - never commit it, hardcode it
in a script, or paste the real password into documentation. The Express backend
reads the same credentials from `backend/.env` (git-ignored; template:
`backend/.env.example`).

## How to verify

```sql
USE MiniLMS;
SHOW TABLES;                     -- 8 tables (+ 3 views)
SHOW CREATE TABLE Attempts\G     -- inspect constraints
SELECT * FROM vw_CourseDetails;
SELECT * FROM vw_EnrollmentDetails;
SELECT * FROM vw_StudentGrades;
SELECT COUNT(*) FROM Users;      -- 13
SELECT COUNT(*) FROM Enrollments;-- 11
```

Intentional-violation tests (each line must FAIL):

```sql
USE MiniLMS;
-- duplicate e-mail              -> ERROR 1062
INSERT INTO Users (Name,Email,PasswordHash,Role)
VALUES ('X','priya.sharma@example.com','x','Student');
-- invalid role                  -> ERROR 1265
INSERT INTO Users (Name,Email,PasswordHash,Role)
VALUES ('X','x@example.com','x','Teacher');
-- duplicate course code         -> ERROR 1062
INSERT INTO Courses (CourseCode,Title,InstructorID) VALUES ('DB-101','X',2);
-- zero maximum score            -> ERROR 3819
INSERT INTO Quizzes (CourseID,Title,MaxScore,MaxAttempts) VALUES (1,'X',0,1);
-- duplicate active enrollment   -> ERROR 1062
INSERT INTO Enrollments (UserID,CourseID) VALUES (5,1);
-- negative score                -> ERROR 3819
INSERT INTO Attempts (QuizID,StudentID,AttemptNo,Score,SubmittedAt,Status)
VALUES (1,5,99,-5,'2026-09-30 10:00:00','Submitted');
-- unknown instructor            -> ERROR 1452
INSERT INTO Courses (CourseCode,Title,InstructorID) VALUES ('XX-999','X',999);
-- delete instructor who owns courses -> ERROR 1451
DELETE FROM Users WHERE UserID = 2;
```

## Rules that are NOT enforced by this schema (need triggers or application code)

These three rules span two tables or check a role, which plain column
constraints cannot do. Tested on MySQL 8.0: inserts that break them are
currently **accepted**, so the application must check them:

1. **Instructor role** - `Courses.InstructorID` must point to a user with
   `Role = 'Instructor'`. The FK only guarantees the user exists.
2. **Attempt score limit** - `Attempts.Score <= Quizzes.MaxScore` (cross-table).
3. **Grade limit** - `Grades.GradeValue <= Quizzes.MaxScore` (cross-table).

Optional trigger for rule 2 is included **commented out** at the bottom of
`02_create_tables.sql` (uncomment + re-run 01-05 to enable).

Also application-level by nature (timing data lives in the `Quizzes` row):
quiz availability window and max-attempt limits, and enrolling only in
`Published` courses. Enforcing "one active enrollment per student" IS covered
by the `UNIQUE (UserID, CourseID)` key - a dropped student re-enrolls by
updating the existing row back to `Active`.

## Next steps to connect the frontend

- The frontend (`../index.html`, `../script.js`) stores data in localStorage
  behind `api.*` functions (keys `minilms_db_v1` / `minilms_session_v1`).
- Replace each `api.*` body with a `fetch()` call to a future backend that
  runs these SQL statements; keep the same returned object shapes.
- Hash passwords server-side (the seeded `PasswordHash` values are fake
  placeholders, never real credentials) and map `Role`/`Status` enums 1:1.
