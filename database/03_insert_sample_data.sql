

USE MiniLMS;

INSERT INTO Users (UserID, Name, Email, PasswordHash, Role, Status, CreatedAt) VALUES
(1,  'Priya Sharma', 'priya.sharma@example.com',   '$2y$10$PLACEHOLDER_HASH_DEMO_ONLY_NOT_A_REAL_CREDENTIAL', 'Admin',     'Active', '2026-06-01 09:00:00'),
(2,  'Ananya Iyer',  'ananya.iyer@example.com',    '$2y$10$PLACEHOLDER_HASH_DEMO_ONLY_NOT_A_REAL_CREDENTIAL', 'Instructor','Active', '2026-06-05 09:00:00'),
(3,  'Ravi Kumar',   'ravi.kumar@example.com',     '$2y$10$PLACEHOLDER_HASH_DEMO_ONLY_NOT_A_REAL_CREDENTIAL', 'Instructor','Active', '2026-06-05 09:00:00'),
(4,  'Sneha Rao',    'sneha.rao@example.com',      '$2y$10$PLACEHOLDER_HASH_DEMO_ONLY_NOT_A_REAL_CREDENTIAL', 'Instructor','Active', '2026-06-06 09:00:00'),
(5,  'Aarav Mehta',  'aarav.mehta@example.com',    '$2y$10$PLACEHOLDER_HASH_DEMO_ONLY_NOT_A_REAL_CREDENTIAL', 'Student',   'Active', '2026-07-20 10:00:00'),
(6,  'Diya Nair',    'diya.nair@example.com',      '$2y$10$PLACEHOLDER_HASH_DEMO_ONLY_NOT_A_REAL_CREDENTIAL', 'Student',   'Active', '2026-07-20 10:00:00'),
(7,  'Rohan Verma',  'rohan.verma@example.com',    '$2y$10$PLACEHOLDER_HASH_DEMO_ONLY_NOT_A_REAL_CREDENTIAL', 'Student',   'Active', '2026-07-21 10:00:00'),
(8,  'Kavya Singh',  'kavya.singh@example.com',    '$2y$10$PLACEHOLDER_HASH_DEMO_ONLY_NOT_A_REAL_CREDENTIAL', 'Student',   'Active', '2026-07-21 10:00:00'),
(9,  'Arjun Patel',  'arjun.patel@example.com',    '$2y$10$PLACEHOLDER_HASH_DEMO_ONLY_NOT_A_REAL_CREDENTIAL', 'Student',   'Active', '2026-07-22 10:00:00'),
(10, 'Meera Joshi',  'meera.joshi@example.com',    '$2y$10$PLACEHOLDER_HASH_DEMO_ONLY_NOT_A_REAL_CREDENTIAL', 'Student',   'Active', '2026-07-22 10:00:00'),
(11, 'Vikram Reddy', 'vikram.reddy@example.com',   '$2y$10$PLACEHOLDER_HASH_DEMO_ONLY_NOT_A_REAL_CREDENTIAL', 'Student',   'Active', '2026-07-23 10:00:00'),
(12, 'Isha Kapoor',  'isha.kapoor@example.com',    '$2y$10$PLACEHOLDER_HASH_DEMO_ONLY_NOT_A_REAL_CREDENTIAL', 'Student',   'Inactive','2026-07-23 10:00:00'),
(13, 'Neel Chandra', 'neel.chandra@example.com',   '$2y$10$PLACEHOLDER_HASH_DEMO_ONLY_NOT_A_REAL_CREDENTIAL', 'Student',   'Active', '2026-07-24 10:00:00');

INSERT INTO Courses (CourseID, CourseCode, Title, Description, InstructorID, Status, CreatedAt) VALUES
(1, 'DB-101', 'Database Management Systems',
    'Relational modelling, SQL, normalisation and transactions.', 2, 'Published', '2026-07-01 09:00:00'),
(2, 'WD-204', 'Web Development Fundamentals',
    'Semantic HTML, modern CSS and responsive layout techniques.', 3, 'Published', '2026-07-02 09:00:00'),
(3, 'PY-110', 'Programming with Python',
    'Variables, control flow, functions, collections and files.', 4, 'Published', '2026-07-03 09:00:00');


INSERT INTO Modules (ModuleID, CourseID, Title, Description, SequenceNo) VALUES
(1, 1, 'Relational Foundations', 'Entities, keys and integrity rules.',        1),
(2, 1, 'SQL and Normalisation',   'Queries, joins and normal forms.',           2),
(3, 2, 'HTML and CSS Basics',     'Markup structure and forms.',                1),
(4, 2, 'Responsive Layouts',      'Box model, flexbox and grid.',               2),
(5, 3, 'Language Basics',         'Syntax, conditionals, loops and functions.', 1),
(6, 3, 'Working with Data',       'Collections, files and exceptions.',         2);


INSERT INTO Lessons (LessonID, ModuleID, Title, Content, SequenceNo, ReleaseDate) VALUES
(1,  1, 'Introduction to Databases', 'What a database is and why we use one.',            1, '2026-08-03 09:00:00'),
(2,  1, 'ER Modelling',              'Entities, attributes, relationships, cardinality.', 2, '2026-08-05 09:00:00'),
(3,  1, 'Keys and Constraints',      'Primary keys, foreign keys and integrity rules.',   3, '2026-08-07 09:00:00'),
(4,  2, 'SQL SELECT Queries',        'Filtering, sorting and grouping rows.',             1, '2026-08-10 09:00:00'),
(5,  2, 'JOIN Queries',              'Combining data from multiple tables.',              2, '2026-08-12 09:00:00'),
(6,  2, 'Normal Forms 1NF to 3NF',   'Removing redundancy step by step.',                 3, '2026-08-14 09:00:00'),
(7,  3, 'Semantic HTML5',            'Header, nav, main, article and footer.',            1, '2026-08-03 09:00:00'),
(8,  3, 'Forms and Validation',      'Input types and browser validation.',               2, '2026-08-06 09:00:00'),
(9,  4, 'The CSS Box Model',         'Margin, border, padding and content.',              1, '2026-08-10 09:00:00'),
(10, 4, 'Flexbox and Grid',          'One-dimensional and two-dimensional layouts.',       2, '2026-08-13 09:00:00'),
(11, 5, 'Variables and Data Types',  'Integers, strings, booleans and mutability.',       1, '2026-08-04 09:00:00'),
(12, 5, 'Loops and Functions',       'Iteration, def, arguments and return values.',      2, '2026-08-08 09:00:00'),
(13, 6, 'Lists and Dictionaries',    'Choosing and using built-in containers.',           1, '2026-08-11 09:00:00'),
(14, 6, 'File Handling',             'Reading and writing files safely.',                 2, NULL);


INSERT INTO Enrollments (EnrollmentID, UserID, CourseID, EnrollDate, Status) VALUES
(1,  5,  1, '2026-08-01 10:00:00', 'Active'),
(2,  6,  1, '2026-08-01 10:00:00', 'Completed'),
(3,  7,  1, '2026-08-02 10:00:00', 'Active'),
(4,  5,  2, '2026-08-02 10:00:00', 'Active'),
(5,  8,  2, '2026-08-02 10:00:00', 'Active'),
(6,  9,  2, '2026-08-03 10:00:00', 'Dropped'),
(7, 10,  3, '2026-08-03 10:00:00', 'Active'),
(8, 11,  3, '2026-08-03 10:00:00', 'Active'),
(9, 12,  1, '2026-08-04 10:00:00', 'Active'),
(10, 6,  3, '2026-08-04 10:00:00', 'Active'),
(11, 12, 3, '2026-08-05 10:00:00', 'Dropped');


INSERT INTO Quizzes (QuizID, CourseID, Title, MaxScore, MaxAttempts, AvailableFrom, AvailableUntil, Status) VALUES
(1, 1, 'RDBMS Fundamentals',     10, 3, '2026-09-01 00:00:00', '2026-12-15 23:59:00', 'Published'),
(2, 1, 'Normalisation Practice',  5, 2, '2026-11-01 00:00:00', '2026-12-20 23:59:00', 'Draft'),
(3, 2, 'HTML and CSS Basics',     8, 2, '2026-09-10 00:00:00', '2026-12-10 23:59:00', 'Published'),
(4, 3, 'Python Basics',          10, 3, '2026-09-05 00:00:00', '2026-12-12 23:59:00', 'Published');


INSERT INTO Attempts (AttemptID, QuizID, StudentID, AttemptNo, Score, SubmittedAt, Status) VALUES
(1, 1, 5,  1, 8.00, '2026-09-12 10:05:00', 'Submitted'),
(2, 1, 5,  2, 9.00, '2026-09-14 11:00:00', 'Submitted'),
(3, 1, 6,  1, 7.50, '2026-09-12 10:20:00', 'Submitted'),
(4, 3, 8,  1, 6.00, '2026-09-18 14:30:00', 'Submitted'),
(5, 4, 10, 1, NULL, NULL,                   'In Progress'),
(6, 4, 11, 1, 9.50, '2026-09-20 09:45:00', 'Submitted');

INSERT INTO Grades (GradeID, AttemptID, GradedBy, GradeValue, Status, GradedAt) VALUES
(1, 1, 2, 8.00, 'Published', '2026-09-13 09:00:00'),
(2, 3, 2, 7.50, 'Published', '2026-09-13 09:30:00'),
(3, 4, 3, 6.00, 'Draft',     '2026-09-19 16:00:00'),
(4, 6, 4, 9.50, 'Published', '2026-09-21 12:00:00');


SELECT 'Sample data loaded.' AS Result;
