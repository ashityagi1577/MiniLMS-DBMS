# MiniLMS – Data Dictionary

**Subject:** Database Management Systems (CSL0311)  
**Project:** Mini Learning Management System (MiniLMS)  
**Programme:** B.Tech. CSE, III Semester  
**Institution:** ITM University, Gwalior  
**Database:** MySQL 8.0.46  
**Storage Engine:** InnoDB  
**Character Set:** utf8mb4

## 1. Introduction

The data dictionary describes the structure of the MiniLMS database, including table names, attributes, data types, primary keys, foreign keys, and integrity constraints.

## 2. Users Table

**Purpose:** Stores student, instructor, and administrator accounts.

| Attribute | Data Type | Constraint / Description |
|---|---|---|
| UserID | INT UNSIGNED | Primary Key, Auto Increment |
| Name | VARCHAR(100) | NOT NULL |
| Email | VARCHAR(150) | NOT NULL, UNIQUE |
| PasswordHash | VARCHAR(255) | NOT NULL |
| Role | ENUM | Student, Instructor, Admin; default Student |
| Status | ENUM | Active, Inactive; default Active |
| CreatedAt | DATETIME | NOT NULL, default current timestamp |

## 3. Courses Table

**Purpose:** Stores course information and the assigned instructor.

| Attribute | Data Type | Constraint / Description |
|---|---|---|
| CourseID | INT UNSIGNED | Primary Key, Auto Increment |
| CourseCode | VARCHAR(20) | NOT NULL, UNIQUE |
| Title | VARCHAR(150) | NOT NULL |
| Description | TEXT | NULL allowed |
| InstructorID | INT UNSIGNED | NOT NULL, Foreign Key → Users.UserID |
| Status | ENUM | Draft, Published, Archived; default Draft |
| CreatedAt | DATETIME | NOT NULL, default current timestamp |

## 4. Modules Table

**Purpose:** Organizes courses into ordered modules.

| Attribute | Data Type | Constraint / Description |
|---|---|---|
| ModuleID | INT UNSIGNED | Primary Key, Auto Increment |
| CourseID | INT UNSIGNED | NOT NULL, Foreign Key → Courses.CourseID |
| Title | VARCHAR(150) | NOT NULL |
| Description | TEXT | NULL allowed |
| SequenceNo | INT | NOT NULL, CHECK greater than 0 |
| — | — | UNIQUE (CourseID, SequenceNo) |

## 5. Lessons Table

**Purpose:** Stores lessons within each module.

| Attribute | Data Type | Constraint / Description |
|---|---|---|
| LessonID | INT UNSIGNED | Primary Key, Auto Increment |
| ModuleID | INT UNSIGNED | NOT NULL, Foreign Key → Modules.ModuleID |
| Title | VARCHAR(150) | NOT NULL |
| Content | TEXT | NULL allowed |
| SequenceNo | INT | NOT NULL, CHECK greater than 0 |
| ReleaseDate | DATETIME | NULL allowed |
| — | — | UNIQUE (ModuleID, SequenceNo) |

## 6. Enrollments Table

**Purpose:** Records users enrolled in courses.

| Attribute | Data Type | Constraint / Description |
|---|---|---|
| EnrollmentID | INT UNSIGNED | Primary Key, Auto Increment |
| UserID | INT UNSIGNED | NOT NULL, Foreign Key → Users.UserID |
| CourseID | INT UNSIGNED | NOT NULL, Foreign Key → Courses.CourseID |
| EnrollDate | DATETIME | NOT NULL, default current timestamp |
| Status | ENUM | Active, Completed, Dropped; default Active |
| — | — | UNIQUE (UserID, CourseID) |

## 7. Quizzes Table

**Purpose:** Stores course quizzes and their availability settings.

| Attribute | Data Type | Constraint / Description |
|---|---|---|
| QuizID | INT UNSIGNED | Primary Key, Auto Increment |
| CourseID | INT UNSIGNED | NOT NULL, Foreign Key → Courses.CourseID |
| Title | VARCHAR(150) | NOT NULL |
| MaxScore | INT | NOT NULL, default 10, CHECK greater than 0 |
| MaxAttempts | INT | NOT NULL, default 1, CHECK greater than 0 |
| AvailableFrom | DATETIME | NULL allowed |
| AvailableUntil | DATETIME | NULL allowed |
| Status | ENUM | Draft, Published, Closed; default Draft |
| — | — | CHECK: end time must be after start time when both are provided |

## 8. Attempts Table

**Purpose:** Records student quiz attempts, scores, and submission status.

| Attribute | Data Type | Constraint / Description |
|---|---|---|
| AttemptID | INT UNSIGNED | Primary Key, Auto Increment |
| QuizID | INT UNSIGNED | NOT NULL, Foreign Key → Quizzes.QuizID |
| StudentID | INT UNSIGNED | NOT NULL, Foreign Key → Users.UserID |
| AttemptNo | INT | NOT NULL |
| Score | DECIMAL(5,2) | NULL allowed; CHECK non-negative when provided |
| SubmittedAt | DATETIME | NULL allowed |
| Status | ENUM | In Progress, Submitted, Auto-Submitted; default In Progress |
| — | — | UNIQUE (QuizID, StudentID, AttemptNo) |

## 9. Grades Table

**Purpose:** Stores grades assigned to quiz attempts.

| Attribute | Data Type | Constraint / Description |
|---|---|---|
| GradeID | INT UNSIGNED | Primary Key, Auto Increment |
| AttemptID | INT UNSIGNED | NOT NULL, UNIQUE, Foreign Key → Attempts.AttemptID |
| GradedBy | INT UNSIGNED | NOT NULL, Foreign Key → Users.UserID |
| GradeValue | DECIMAL(5,2) | NOT NULL, CHECK non-negative |
| Status | ENUM | Draft, Published; default Draft |
| GradedAt | DATETIME | NOT NULL, default current timestamp |

## 10. Database Integrity Constraints

The database uses the following constraints:

- **Primary Keys:** Uniquely identify records in each table.
- **Foreign Keys:** Maintain relationships between tables.
- **UNIQUE Constraints:** Prevent duplicate emails, course codes, sequence numbers within their parent records, user-course enrollment pairs, repeated attempt numbers, and multiple grades for one attempt.
- **CHECK Constraints:** Validate positive sequence numbers, positive quiz limits, valid availability windows, and non-negative scores and grades.
- **NOT NULL:** Requires values for mandatory attributes.
- **ENUM:** Restricts selected columns to predefined status or role values.
- **AUTO_INCREMENT:** Generates identifiers automatically.
- **Indexes:** Support selected lookups and joins.

## 11. Foreign-Key Relationships

| Child Table | Foreign-Key Attribute | Parent Table |
|---|---|---|
| Courses | InstructorID | Users |
| Modules | CourseID | Courses |
| Lessons | ModuleID | Modules |
| Enrollments | UserID | Users |
| Enrollments | CourseID | Courses |
| Quizzes | CourseID | Courses |
| Attempts | QuizID | Quizzes |
| Attempts | StudentID | Users |
| Grades | AttemptID | Attempts |
| Grades | GradedBy | Users |

## 12. Database Views

The project includes three views:

- `vw_CourseDetails`
- `vw_EnrollmentDetails`
- `vw_StudentGrades`

These provide reusable views of course, enrollment, and student-grade information. Their exact selected columns are defined in `05_views.sql`.

## 13. Business Rules Not Fully Enforced by the Table Definitions

The current table definitions do not enforce every business rule:

1. The user assigned to a course must have the Instructor role.
2. An attempt's score must not exceed the quiz's maximum score.
3. A grade value must not exceed the quiz's maximum score.
4. Other application rules, such as checking a user's role before allowing an operation, may require backend validation.

These rules should be enforced using suitable triggers or backend validation.

## 14. Conclusion

The MiniLMS data dictionary documents the database tables, attributes, data types, relationships, and integrity constraints. It supports understanding, testing, maintenance, and evaluation of the database implementation.