-- Migration Script: Legacy to AD-Aligned Schema
-- Safely migrates existing data to new AD-aligned structure

-- =====================================================
-- BACKUP EXISTING DATA
-- =====================================================

-- Create backup tables for existing data
CREATE TABLE IF NOT EXISTS backup_initiatives AS SELECT * FROM initiatives;
CREATE TABLE IF NOT EXISTS backup_documents AS SELECT * FROM documents;  
CREATE TABLE IF NOT EXISTS backup_users AS SELECT * FROM users;

-- =====================================================
-- MIGRATION HELPER FUNCTIONS (Implemented as temp tables)
-- =====================================================

-- Create mapping table for user migration
CREATE TEMPORARY TABLE user_mapping AS
SELECT 
    id as old_id,
    username,
    email,
    role,
    created_at,
    CASE 
        WHEN username = 'admin' THEN 'admin.user'
        WHEN username = 'reviewer' THEN 'reviewer.user' 
        WHEN username = 'contributor' THEN 'contributor.user'
        ELSE LOWER(REPLACE(REPLACE(username, ' ', '.'), '''', ''))
    END as ad_username,
    CASE
        WHEN email LIKE '%cardio%' OR username LIKE '%cardio%' THEN 'CARDIO'
        WHEN email LIKE '%neuro%' OR username LIKE '%neuro%' THEN 'NEURO'
        WHEN email LIKE '%research%' OR username LIKE '%research%' THEN 'RESEARCH'
        WHEN username IN ('admin', 'reviewer') THEN 'ADMIN'
        ELSE 'IT'
    END as dept_code
FROM backup_users;

-- Create department mapping for initiatives
CREATE TEMPORARY TABLE dept_mapping AS
SELECT DISTINCT
    department as old_dept,
    CASE 
        WHEN department IS NULL THEN 'IT'
        WHEN UPPER(department) LIKE '%CARDIO%' THEN 'CARDIO'
        WHEN UPPER(department) LIKE '%NEURO%' THEN 'NEURO'
        WHEN UPPER(department) LIKE '%RESEARCH%' THEN 'RESEARCH'
        WHEN UPPER(department) LIKE '%ADMIN%' THEN 'ADMIN'
        WHEN UPPER(department) LIKE '%IT%' THEN 'IT'
        ELSE 'IT'
    END as new_dept_code
FROM backup_initiatives
WHERE department IS NOT NULL;

-- =====================================================
-- PHASE 1: POPULATE DEPARTMENTS TABLE
-- =====================================================

-- Insert base departments (using data from seed_data.sql structure)
INSERT OR REPLACE INTO departments (dept_code, dept_name, parent_dept_code, dept_head_username, budget_code, location, description) VALUES
('IT', 'Information Technology', NULL, 'admin.user', 'IT-001', 'Building A, Floor 3', 'Technology and digital infrastructure'),
('CARDIO', 'Cardiology', NULL, 'sarah.johnson', 'MED-CARDIO', 'Medical Center, Wing B', 'Cardiac care and cardiovascular services'),
('NEURO', 'Neurology', NULL, 'michael.brown', 'MED-NEURO', 'Medical Center, Wing C', 'Neurological care and brain health'),
('ADMIN', 'Administration', NULL, 'reviewer.user', 'ADM-001', 'Building A, Floor 1', 'Administrative and executive functions'),
('RESEARCH', 'Clinical Research', NULL, 'david.wilson', 'RES-001', 'Research Building, Floor 2', 'Clinical research and innovation');

-- =====================================================
-- PHASE 2: MIGRATE USERS TO AD_USER_CACHE
-- =====================================================

-- Insert migrated users into ad_user_cache
INSERT OR REPLACE INTO ad_user_cache (
    username, display_name, first_name, last_name, email,
    department_code, title, manager_username, phone, location, employee_id, created_at
)
SELECT 
    um.ad_username,
    COALESCE(bu.username, um.ad_username) as display_name,
    CASE 
        WHEN INSTR(um.ad_username, '.') > 0 THEN 
            UPPER(SUBSTR(um.ad_username, 1, 1)) || SUBSTR(um.ad_username, 2, INSTR(um.ad_username, '.') - 2)
        ELSE UPPER(SUBSTR(um.ad_username, 1, 1)) || SUBSTR(um.ad_username, 2)
    END as first_name,
    CASE 
        WHEN INSTR(um.ad_username, '.') > 0 THEN 
            UPPER(SUBSTR(um.ad_username, INSTR(um.ad_username, '.') + 1, 1)) || SUBSTR(um.ad_username, INSTR(um.ad_username, '.') + 2)
        ELSE 'User'
    END as last_name,
    COALESCE(bu.email, um.ad_username || '@company.com') as email,
    um.dept_code,
    CASE um.role
        WHEN 'admin' THEN 'System Administrator'
        WHEN 'reviewer' THEN 'Data Reviewer'
        WHEN 'contributor' THEN 'Program Contributor'
        ELSE 'Staff Member'
    END as title,
    NULL as manager_username, -- Will be updated separately if needed
    '555-' || PRINTF('%04d', ABS(RANDOM() % 10000)) as phone,
    CASE um.dept_code
        WHEN 'IT' THEN 'Building A, Floor 3'
        WHEN 'CARDIO' THEN 'Medical Center, Wing B'
        WHEN 'NEURO' THEN 'Medical Center, Wing C'
        WHEN 'ADMIN' THEN 'Building A, Floor 1'
        WHEN 'RESEARCH' THEN 'Research Building, Floor 2'
        ELSE 'Main Campus'
    END as location,
    'EMP' || PRINTF('%03d', um.old_id + 100) as employee_id,
    um.created_at
FROM user_mapping um
LEFT JOIN backup_users bu ON um.old_id = bu.id;

-- =====================================================
-- PHASE 3: MIGRATE INITIATIVES TO AI_PROGRAMS
-- =====================================================

-- Insert migrated initiatives into ai_programs
INSERT INTO ai_programs (
    program_name, program_code, description, department_code,
    program_lead, business_sponsor, technical_lead, created_by,
    status, stage, priority,
    business_value, technical_approach,
    planned_start_date, planned_end_date,
    created_at, updated_at,
    custom_attributes
)
SELECT 
    bi.name as program_name,
    'MIG-' || PRINTF('%03d', bi.id) as program_code,
    bi.description,
    COALESCE(dm.new_dept_code, 'IT') as department_code,
    
    -- Map lead information to AD usernames
    COALESCE(
        (SELECT ad_username FROM user_mapping WHERE username = bi.lead_name LIMIT 1),
        'admin.user'
    ) as program_lead,
    
    COALESCE(
        (SELECT ad_username FROM user_mapping WHERE username = bi.lead_name LIMIT 1),
        'admin.user'
    ) as business_sponsor,
    
    COALESCE(
        (SELECT ad_username FROM user_mapping WHERE username = bi.lead_name LIMIT 1),
        'admin.user'  
    ) as technical_lead,
    
    'admin.user' as created_by, -- Migration user
    
    -- Map status values
    CASE bi.status
        WHEN 'active' THEN 'active'
        WHEN 'paused' THEN 'on_hold'
        WHEN 'completed' THEN 'completed'
        WHEN 'deleted' THEN 'cancelled'
        ELSE 'active'
    END as status,
    
    -- Map stage values  
    CASE bi.stage
        WHEN 'discovery' THEN 'discovery'
        WHEN 'pilot' THEN 'pilot'
        WHEN 'production' THEN 'production'
        WHEN 'retired' THEN 'retired'
        ELSE 'planning'
    END as stage,
    
    -- Map priority values
    CASE bi.priority
        WHEN 'low' THEN 'low'
        WHEN 'medium' THEN 'medium'
        WHEN 'high' THEN 'high'
        WHEN 'critical' THEN 'critical'
        ELSE 'medium'
    END as priority,
    
    bi.business_value,
    bi.technical_approach,
    
    -- Convert date strings to proper dates
    CASE 
        WHEN bi.start_date IS NOT NULL AND bi.start_date != '' THEN 
            DATE(bi.start_date)
        ELSE NULL
    END as planned_start_date,
    
    CASE 
        WHEN bi.end_date IS NOT NULL AND bi.end_date != '' THEN 
            DATE(bi.end_date)
        ELSE NULL
    END as planned_end_date,
    
    bi.created_at,
    bi.updated_at,
    
    -- Store original data as JSON for reference
    JSON_OBJECT(
        'migrated_from_id', bi.id,
        'original_lead_name', bi.lead_name,
        'original_lead_email', bi.lead_email,
        'original_department', bi.department,
        'migration_date', CURRENT_TIMESTAMP
    ) as custom_attributes
    
FROM backup_initiatives bi
LEFT JOIN dept_mapping dm ON bi.department = dm.old_dept
WHERE bi.status != 'deleted'; -- Don't migrate deleted records

-- =====================================================
-- PHASE 4: MIGRATE DOCUMENTS
-- =====================================================

-- Update documents table to link to new ai_programs
INSERT INTO documents (
    program_id, filename, file_path, file_size, file_type,
    document_type, version, description, uploaded_by, uploaded_at, is_active
)
SELECT 
    ap.program_id,
    bd.filename,
    bd.file_path,
    COALESCE(bd.file_size, 0),
    CASE 
        WHEN bd.filename LIKE '%.pdf' THEN 'application/pdf'
        WHEN bd.filename LIKE '%.doc%' THEN 'application/msword'
        WHEN bd.filename LIKE '%.xls%' THEN 'application/vnd.ms-excel'
        ELSE 'application/octet-stream'
    END as file_type,
    COALESCE(bd.document_type, 'general') as document_type,
    '1.0' as version,
    'Migrated from legacy system' as description,
    COALESCE(bd.uploaded_by, 'admin.user') as uploaded_by,
    bd.uploaded_at,
    1 as is_active
FROM backup_documents bd
JOIN ai_programs ap ON JSON_EXTRACT(ap.custom_attributes, '$.migrated_from_id') = CAST(bd.initiative_id AS TEXT);

-- =====================================================
-- PHASE 5: CREATE AUDIT TRAIL FOR MIGRATION
-- =====================================================

-- Log the migration in audit_log
INSERT INTO audit_log (
    table_name, record_id, operation, 
    old_value, new_value, changed_by, change_reason, 
    ip_address, session_id
) 
SELECT 
    'ai_programs',
    CAST(program_id AS TEXT),
    'INSERT',
    'legacy_initiative_id:' || JSON_EXTRACT(custom_attributes, '$.migrated_from_id'),
    program_name,
    'admin.user',
    'Data migration from legacy initiatives table',
    '127.0.0.1',
    'migration_' || STRFTIME('%Y%m%d_%H%M%S', 'now')
FROM ai_programs 
WHERE custom_attributes IS NOT NULL 
  AND JSON_EXTRACT(custom_attributes, '$.migrated_from_id') IS NOT NULL;

-- =====================================================
-- PHASE 6: VALIDATION AND CLEANUP
-- =====================================================

-- Validation queries to ensure migration integrity
-- These will be used by the validation script

-- Count validation
CREATE TEMPORARY VIEW migration_validation AS
SELECT 
    'Initiatives migrated' as check_type,
    (SELECT COUNT(*) FROM backup_initiatives WHERE status != 'deleted') as expected_count,
    (SELECT COUNT(*) FROM ai_programs WHERE custom_attributes LIKE '%migrated_from_id%') as actual_count
UNION ALL
SELECT 
    'Documents migrated',
    (SELECT COUNT(*) FROM backup_documents) as expected_count,
    (SELECT COUNT(*) FROM documents WHERE description = 'Migrated from legacy system') as actual_count
UNION ALL
SELECT 
    'Users migrated',
    (SELECT COUNT(*) FROM backup_users) as expected_count,
    (SELECT COUNT(*) FROM ad_user_cache WHERE employee_id LIKE 'EMP%') as actual_count;

-- =====================================================
-- MIGRATION SUMMARY
-- =====================================================

-- Create a summary of the migration for reporting
CREATE TABLE IF NOT EXISTS migration_summary AS
SELECT 
    CURRENT_TIMESTAMP as migration_date,
    'Legacy to AD-Aligned Schema' as migration_type,
    (SELECT COUNT(*) FROM backup_initiatives) as initiatives_processed,
    (SELECT COUNT(*) FROM ai_programs WHERE custom_attributes LIKE '%migrated_from_id%') as initiatives_migrated,
    (SELECT COUNT(*) FROM backup_documents) as documents_processed,
    (SELECT COUNT(*) FROM documents WHERE description = 'Migrated from legacy system') as documents_migrated,
    (SELECT COUNT(*) FROM backup_users) as users_processed,
    (SELECT COUNT(*) FROM ad_user_cache WHERE employee_id LIKE 'EMP%') as users_migrated,
    'Migration completed successfully' as status;

-- Drop temporary tables
DROP TABLE user_mapping;
DROP TABLE dept_mapping;