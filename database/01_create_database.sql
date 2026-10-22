-- ============================================================
-- 01_create_database.sql
-- Project : MiniLMS (Mini Learning Management System)
-- Subject : CSL0311 - Database Management Systems
-- Purpose : Creates and selects the MiniLMS database.
-- ============================================================

-- WARNING: This line deletes the database if it already exists,
-- so re-running this file starts everything from scratch.
-- Delete this line if you want to keep your existing data.
DROP DATABASE IF EXISTS MiniLMS;

-- Create the database with UTF-8 so names and text in any language are stored safely.
CREATE DATABASE MiniLMS
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Select it so the next scripts run inside MiniLMS.
USE MiniLMS;

-- Quick confirmation message (optional).
SELECT 'MiniLMS database created successfully.' AS Result;
