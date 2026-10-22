
USE MiniLMS;

DELIMITER $$

-- 1. Check that the assigned course owner is an instructor
CREATE TRIGGER trg_Courses_CheckInstructor
BEFORE INSERT ON Courses
FOR EACH ROW
BEGIN
    DECLARE v_role VARCHAR(20);

    SELECT Role INTO v_role
    FROM Users
    WHERE UserID = NEW.InstructorID;

    IF v_role <> 'Instructor' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Course owner must have Instructor role.';
    END IF;
END$$

-- 2. Prevent an attempt score from exceeding quiz maximum
CREATE TRIGGER trg_Attempts_CheckScore
BEFORE INSERT ON Attempts
FOR EACH ROW
BEGIN
    DECLARE v_max_score INT;

    SELECT MaxScore INTO v_max_score
    FROM Quizzes
    WHERE QuizID = NEW.QuizID;

    IF NEW.Score IS NOT NULL AND NEW.Score > v_max_score THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Attempt score cannot exceed quiz maximum score.';
    END IF;
END$$

-- 3. Prevent a grade from exceeding quiz maximum
CREATE TRIGGER trg_Grades_CheckValue
BEFORE INSERT ON Grades
FOR EACH ROW
BEGIN
    DECLARE v_max_score INT;

    SELECT q.MaxScore INTO v_max_score
    FROM Quizzes q
    JOIN Attempts a ON a.QuizID = q.QuizID
    WHERE a.AttemptID = NEW.AttemptID;

    IF NEW.GradeValue > v_max_score THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Grade cannot exceed quiz maximum score.';
    END IF;
END$$

DELIMITER ;
