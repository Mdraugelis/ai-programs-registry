-- Rollback Script: AD-Aligned to Legacy Schema
-- Emergency rollback to previous database state

-- =====================================================
-- ROLLBACK WARNING
-- =====================================================
-- This script will restore the database to its pre-migration state
-- All data created after migration will be LOST
-- Only use this script if migration fails or needs to be reversed

-- =====================================================
-- PHASE 1: DROP NEW TABLES AND VIEWS
-- =====================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS trg_departments_updated_at;
DROP TRIGGER IF EXISTS trg_ad_users_updated_at; 
DROP TRIGGER IF EXISTS trg_programs_updated_at;

-- Drop indexes
DROP INDEX IF EXISTS idx_departments_parent;
DROP INDEX IF EXISTS idx_departments_head;
DROP INDEX IF EXISTS idx_departments_active;
DROP INDEX IF EXISTS idx_ad_users_dept;
DROP INDEX IF EXISTS idx_ad_users_manager;
DROP INDEX IF EXISTS idx_ad_users_email;
DROP INDEX IF EXISTS idx_ad_users_active;
DROP INDEX IF EXISTS idx_ad_users_sync;
DROP INDEX IF EXISTS idx_programs_dept;
DROP INDEX IF EXISTS idx_programs_lead;
DROP INDEX IF EXISTS idx_programs_status;
DROP INDEX IF EXISTS idx_programs_stage;
DROP INDEX IF EXISTS idx_programs_priority;
DROP INDEX IF EXISTS idx_programs_dates;
DROP INDEX IF EXISTS idx_programs_created;
DROP INDEX IF EXISTS idx_programs_code;
DROP INDEX IF EXISTS idx_audit_table;
DROP INDEX IF EXISTS idx_audit_record;
DROP INDEX IF EXISTS idx_audit_user;
DROP INDEX IF EXISTS idx_audit_date;
DROP INDEX IF EXISTS idx_audit_operation;

-- Drop compatibility views
DROP VIEW IF EXISTS initiatives;
DROP VIEW IF EXISTS users;

-- Drop new tables
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS ai_programs;
DROP TABLE IF EXISTS ad_user_cache;
DROP TABLE IF EXISTS departments;

-- Drop migration tracking tables
DROP TABLE IF EXISTS migration_summary;

-- =====================================================
-- PHASE 2: RESTORE ORIGINAL TABLES
-- =====================================================

-- Restore initiatives table from backup
DROP TABLE IF EXISTS initiatives;
CREATE TABLE initiatives AS SELECT * FROM backup_initiatives;

-- Restore documents table from backup  
DROP TABLE IF EXISTS documents;
CREATE TABLE documents AS SELECT * FROM backup_documents;

-- Restore users table from backup
DROP TABLE IF EXISTS users; 
CREATE TABLE users AS SELECT * FROM backup_users;

-- =====================================================
-- PHASE 3: RECREATE ORIGINAL INDEXES
-- =====================================================

-- Recreate indexes for initiatives table
CREATE INDEX IF NOT EXISTS idx_initiatives_department ON initiatives(department);
CREATE INDEX IF NOT EXISTS idx_initiatives_stage ON initiatives(stage);
CREATE INDEX IF NOT EXISTS idx_initiatives_status ON initiatives(status);

-- Recreate indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_initiative ON documents(initiative_id);

-- =====================================================
-- PHASE 4: RESTORE FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Note: SQLite doesn't allow adding foreign key constraints to existing tables
-- The original tables will need to be recreated with proper constraints

-- Backup current data
CREATE TEMPORARY TABLE temp_initiatives AS SELECT * FROM initiatives;
CREATE TEMPORARY TABLE temp_documents AS SELECT * FROM documents;
CREATE TEMPORARY TABLE temp_users AS SELECT * FROM users;

-- Drop and recreate initiatives table with constraints
DROP TABLE initiatives;
CREATE TABLE initiatives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    department TEXT,
    stage TEXT CHECK(stage IN ('discovery', 'pilot', 'production', 'retired')),
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical')),
    lead_name TEXT,
    lead_email TEXT,
    business_value TEXT,
    technical_approach TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'deleted')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restore initiatives data
INSERT INTO initiatives SELECT * FROM temp_initiatives;

-- Drop and recreate documents table with constraints
DROP TABLE documents;
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    initiative_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    document_type TEXT,
    FOREIGN KEY (initiative_id) REFERENCES initiatives (id)
);

-- Restore documents data
INSERT INTO documents SELECT * FROM temp_documents;

-- Drop and recreate users table with constraints
DROP TABLE users;
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'reviewer', 'contributor')) DEFAULT 'contributor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Restore users data
INSERT INTO users SELECT * FROM temp_users;

-- =====================================================
-- PHASE 5: RECREATE ORIGINAL INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_initiatives_department ON initiatives(department);
CREATE INDEX IF NOT EXISTS idx_initiatives_stage ON initiatives(stage);
CREATE INDEX IF NOT EXISTS idx_initiatives_status ON initiatives(status);
CREATE INDEX IF NOT EXISTS idx_documents_initiative ON documents(initiative_id);

-- =====================================================
-- PHASE 6: CLEANUP
-- =====================================================

-- Drop temporary tables
DROP TABLE temp_initiatives;
DROP TABLE temp_documents;
DROP TABLE temp_users;

-- =====================================================
-- PHASE 7: ROLLBACK VERIFICATION
-- =====================================================

-- Create rollback verification report
CREATE TABLE rollback_verification AS
SELECT 
    CURRENT_TIMESTAMP as rollback_date,
    'AD-Aligned to Legacy Schema' as rollback_type,
    (SELECT COUNT(*) FROM initiatives) as initiatives_restored,
    (SELECT COUNT(*) FROM documents) as documents_restored,
    (SELECT COUNT(*) FROM users) as users_restored,
    (SELECT COUNT(*) FROM backup_initiatives) as initiatives_expected,
    (SELECT COUNT(*) FROM backup_documents) as documents_expected,
    (SELECT COUNT(*) FROM backup_users) as users_expected,
    CASE 
        WHEN (SELECT COUNT(*) FROM initiatives) = (SELECT COUNT(*) FROM backup_initiatives)
         AND (SELECT COUNT(*) FROM documents) = (SELECT COUNT(*) FROM backup_documents)
         AND (SELECT COUNT(*) FROM users) = (SELECT COUNT(*) FROM backup_users)
        THEN 'SUCCESS: All data restored correctly'
        ELSE 'WARNING: Data counts do not match - manual verification required'
    END as verification_status;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================

-- Display rollback summary
SELECT * FROM rollback_verification;

-- Clean up backup tables (optional - comment out if you want to keep them)
-- DROP TABLE IF EXISTS backup_initiatives;
-- DROP TABLE IF EXISTS backup_documents;  
-- DROP TABLE IF EXISTS backup_users;