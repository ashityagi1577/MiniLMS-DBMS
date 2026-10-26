
USE MiniLMS;


CREATE TABLE Users (
    UserID       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    Name         VARCHAR(100) NOT NULL,
    Email        VARCHAR(150) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role         ENUM('Student', 'Instructor', 'Admin') NOT NULL DEFAULT 'Student',
    Status       ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    CreatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID),
    
    UNIQUE KEY uq_users_email (Email)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;


CREATE TABLE Courses (
    CourseID     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    CourseCode   VARCHAR(20)  NOT NULL,
    Title        VARCHAR(150) NOT NULL,
    Description  TEXT         NULL,
    InstructorID INT UNSIGNED NOT NULL,
    Status       ENUM('Draft', 'Published', 'Archived') NOT NULL DEFAULT 'Draft',
    CreatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (CourseID),
    
    UNIQUE KEY uq_courses_code (CourseCode),
    -- Rule: a course must reference an existing user (the instructor).
    CONSTRAINT fk_courses_instructor
        FOREIGN KEY (InstructorID) REFERENCES Users (UserID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,          -- do not delete an instructor who owns courses
    INDEX idx_courses_instructor (InstructorID)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;


CREATE TABLE Modules (
    ModuleID    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    CourseID    INT UNSIGNED NOT NULL,
    Title       VARCHAR(150) NOT NULL,
    Description TEXT         NULL,
    SequenceNo  INT          NOT NULL,
    PRIMARY KEY (ModuleID),
    -- Rule: no two modules of the same course share a sequence number.
    UNIQUE KEY uq_modules_course_seq (CourseID, SequenceNo),
    -- Rule: sequence numbers must be positive.
    CONSTRAINT chk_modules_seq CHECK (SequenceNo > 0),
    -- Rule: every module must belong to an existing course.
    CONSTRAINT fk_modules_course
        FOREIGN KEY (CourseID) REFERENCES Courses (CourseID)
        ON UPDATE CASCADE
        ON DELETE CASCADE            -- deleting a course removes its modules
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;


CREATE TABLE Lessons (
    LessonID    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    ModuleID    INT UNSIGNED NOT NULL,
    Title       VARCHAR(150) NOT NULL,
    Content     TEXT         NULL,
    SequenceNo  INT          NOT NULL,
    ReleaseDate DATETIME     NULL,
    PRIMARY KEY (LessonID),
    -- Rule: no two lessons of the same module share a sequence number.
    UNIQUE KEY uq_lessons_module_seq (ModuleID, SequenceNo),
    -- Rule: sequence numbers must be positive.
    CONSTRAINT chk_lessons_seq CHECK (SequenceNo > 0),
    -- Rule: every lesson must belong to an existing module.
    CONSTRAINT fk_lessons_module
        FOREIGN KEY (ModuleID) REFERENCES Modules (ModuleID)
        ON UPDATE CASCADE
        ON DELETE CASCADE            -- deleting a module removes its lessons
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;


CREATE TABLE Enrollments (
    EnrollmentID INT UNSIGNED NOT NULL AUTO_INCREMENT,
    UserID       INT UNSIGNED NOT NULL,
    CourseID     INT UNSIGNED NOT NULL,
    EnrollDate   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status       ENUM('Active', 'Completed', 'Dropped') NOT NULL DEFAULT 'Active',
    PRIMARY KEY (EnrollmentID),
    UNIQUE KEY uq_enrollments_user_course (UserID, CourseID),
    CONSTRAINT fk_enrollments_user
        FOREIGN KEY (UserID) REFERENCES Users (UserID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,          -- keep enrollment history
    CONSTRAINT fk_enrollments_course
        FOREIGN KEY (CourseID) REFERENCES Courses (CourseID)
        ON UPDATE CASCADE
        ON DELETE CASCADE,           
    INDEX idx_enrollments_course (CourseID)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;


CREATE TABLE Quizzes (
    QuizID         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    CourseID       INT UNSIGNED NOT NULL,
    Title          VARCHAR(150) NOT NULL,
    MaxScore       INT NOT NULL DEFAULT 10,
    MaxAttempts    INT NOT NULL DEFAULT 1,
    AvailableFrom  DATETIME NULL,
    AvailableUntil DATETIME NULL,
    Status         ENUM('Draft', 'Published', 'Closed') NOT NULL DEFAULT 'Draft',
    PRIMARY KEY (QuizID),
    -- Rule: maximum score and maximum attempts must be positive.
    CONSTRAINT chk_quizzes_maxscore  CHECK (MaxScore > 0),
    CONSTRAINT chk_quizzes_maxattempts CHECK (MaxAttempts > 0),
    -- Extra safety: the end of the window must be after the start.
    CONSTRAINT chk_quizzes_window
        CHECK (AvailableUntil IS NULL
            OR AvailableFrom IS NULL
            OR AvailableUntil > AvailableFrom),
    CONSTRAINT fk_quizzes_course
        FOREIGN KEY (CourseID) REFERENCES Courses (CourseID)
        ON UPDATE CASCADE
        ON DELETE CASCADE,           -- deleting a course removes its quizzes
    INDEX idx_quizzes_course (CourseID)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;


CREATE TABLE Attempts (
    AttemptID   INT UNSIGNED NOT NULL AUTO_INCREMENT,
    QuizID      INT UNSIGNED NOT NULL,
    StudentID   INT UNSIGNED NOT NULL,
    AttemptNo   INT NOT NULL,
    Score       DECIMAL(5,2) NULL,
    SubmittedAt DATETIME NULL,
    Status      ENUM('In Progress', 'Submitted', 'Auto-Submitted') NOT NULL DEFAULT 'In Progress',
    PRIMARY KEY (AttemptID),
    UNIQUE KEY uq_attempts_quiz_student_no (QuizID, StudentID, AttemptNo),
    -- Rule: a score can never be negative.
    CONSTRAINT chk_attempts_score CHECK (Score IS NULL OR Score >= 0),
    CONSTRAINT fk_attempts_quiz
        FOREIGN KEY (QuizID) REFERENCES Quizzes (QuizID)
        ON UPDATE CASCADE
        ON DELETE CASCADE,           -- deleting a quiz removes its attempts
    CONSTRAINT fk_attempts_student
        FOREIGN KEY (StudentID) REFERENCES Users (UserID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,          -- keep attempt history
    INDEX idx_attempts_student (StudentID)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;


CREATE TABLE Grades (
    GradeID    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    AttemptID  INT UNSIGNED NOT NULL,
    GradedBy   INT UNSIGNED NOT NULL,
    GradeValue DECIMAL(5,2) NOT NULL,
    Status     ENUM('Draft', 'Published') NOT NULL DEFAULT 'Draft',
    GradedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (GradeID),
    -- One grade per attempt (no double grading of the same try).
    UNIQUE KEY uq_grades_attempt (AttemptID),
    -- Rule: a grade can never be negative.
    CONSTRAINT chk_grades_value CHECK (GradeValue >= 0),
    CONSTRAINT fk_grades_attempt
        FOREIGN KEY (AttemptID) REFERENCES Attempts (AttemptID)
        ON UPDATE CASCADE
        ON DELETE CASCADE,           -- deleting an attempt removes its grade
    CONSTRAINT fk_grades_gradedby
        FOREIGN KEY (GradedBy) REFERENCES Users (UserID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,          -- never delete a user who has graded work
    INDEX idx_grades_gradedby (GradedBy)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;



