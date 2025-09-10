-- AD-Aligned Database Schema for AI Programs Registry
-- Task 1.1: Create AD-Aligned Database Schema

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- =====================================================
-- DEPARTMENTS TABLE
-- =====================================================
-- Manages organizational structure with hierarchy support
CREATE TABLE IF NOT EXISTS departments (
    dept_code TEXT PRIMARY KEY,           -- Unique department identifier (e.g., 'CARDIO', 'IT')
    dept_name TEXT NOT NULL,              -- Full department name
    parent_dept_code TEXT,                -- Self-referencing for hierarchy
    dept_head_username TEXT,              -- Department head (AD username)
    budget_code TEXT,                     -- Financial tracking code
    location TEXT,                        -- Physical location
    description TEXT,                     -- Department description
    is_active BOOLEAN DEFAULT 1,          -- Active status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (parent_dept_code) REFERENCES departments(dept_code),
    CHECK (dept_code = UPPER(dept_code)),  -- Enforce uppercase codes
    CHECK (is_active IN (0, 1))           -- Boolean constraint
);

-- =====================================================
-- AD USER CACHE TABLE  
-- =====================================================
-- Caches Active Directory user information for performance
CREATE TABLE IF NOT EXISTS ad_user_cache (
    username TEXT PRIMARY KEY,            -- AD username (sAMAccountName)
    display_name TEXT NOT NULL,           -- Full display name
    first_name TEXT,                      -- First name
    last_name TEXT,                       -- Last name  
    email TEXT UNIQUE,                    -- Email address
    department_code TEXT,                 -- Primary department
    title TEXT,                           -- Job title
    manager_username TEXT,                -- Manager's AD username
    phone TEXT,                           -- Phone number
    location TEXT,                        -- Office location
    employee_id TEXT,                     -- Employee ID number
    is_active BOOLEAN DEFAULT 1,          -- Active status
    last_ad_sync TIMESTAMP,               -- Last AD synchronization
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (department_code) REFERENCES departments(dept_code),
    FOREIGN KEY (manager_username) REFERENCES ad_user_cache(username),
    CHECK (is_active IN (0, 1))
    -- Username is stored as lowercase via application validation
);

-- =====================================================
-- AI PROGRAMS TABLE
-- =====================================================
-- Main table for tracking AI initiatives and programs
CREATE TABLE IF NOT EXISTS ai_programs (
    program_id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_name TEXT NOT NULL,           -- Initiative/program name
    program_code TEXT UNIQUE,             -- Short code identifier
    description TEXT,                     -- Detailed description
    department_code TEXT NOT NULL,        -- Owning department
    program_lead TEXT NOT NULL,           -- Program lead (AD username)
    business_sponsor TEXT,                -- Business sponsor (AD username)
    technical_lead TEXT,                  -- Technical lead (AD username)
    
    -- Program Status and Stage
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'on_hold', 'completed', 'cancelled')),
    stage TEXT DEFAULT 'discovery' CHECK(stage IN ('discovery', 'planning', 'development', 'pilot', 'production', 'retired')),
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Business Information
    business_value TEXT,                  -- Business value description
    success_metrics TEXT,                 -- Success criteria and KPIs
    roi_projection DECIMAL(10,2),         -- ROI projection percentage
    budget_allocated DECIMAL(12,2),       -- Allocated budget
    budget_spent DECIMAL(12,2) DEFAULT 0, -- Spent budget
    
    -- Technical Information  
    technical_approach TEXT,              -- Technical implementation approach
    tech_stack TEXT,                      -- Technology stack (JSON)
    data_sources TEXT,                    -- Data sources used
    security_classification TEXT DEFAULT 'internal' CHECK(security_classification IN ('public', 'internal', 'confidential', 'restricted')),
    
    -- Timeline
    planned_start_date DATE,              -- Planned start date
    actual_start_date DATE,               -- Actual start date  
    planned_end_date DATE,                -- Planned completion date
    actual_end_date DATE,                 -- Actual completion date
    last_milestone TEXT,                  -- Last achieved milestone
    next_milestone TEXT,                  -- Next milestone target
    
    -- Risk and Compliance
    risk_level TEXT DEFAULT 'medium' CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
    compliance_requirements TEXT,          -- Regulatory compliance needs
    data_privacy_impact TEXT,             -- Privacy impact assessment
    
    -- Flexible Attributes
    custom_attributes TEXT,               -- JSON for additional attributes
    tags TEXT,                           -- Comma-separated tags
    
    -- Audit Fields
    created_by TEXT NOT NULL,             -- Created by (AD username)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,                      -- Last updated by (AD username)  
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints
    FOREIGN KEY (department_code) REFERENCES departments(dept_code),
    FOREIGN KEY (program_lead) REFERENCES ad_user_cache(username),
    FOREIGN KEY (business_sponsor) REFERENCES ad_user_cache(username),
    FOREIGN KEY (technical_lead) REFERENCES ad_user_cache(username),
    FOREIGN KEY (created_by) REFERENCES ad_user_cache(username),
    FOREIGN KEY (updated_by) REFERENCES ad_user_cache(username),
    
    -- Business Logic Constraints
    CHECK (budget_spent <= budget_allocated OR budget_allocated IS NULL),
    CHECK (planned_start_date <= planned_end_date OR planned_end_date IS NULL),
    CHECK (actual_start_date <= actual_end_date OR actual_end_date IS NULL),
    CHECK (roi_projection >= -100.0)      -- ROI can be negative but not less than -100%
);

-- =====================================================
-- DOCUMENTS TABLE (Updated for AD alignment)
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
    document_id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL,          -- Link to AI program
    filename TEXT NOT NULL,               -- Original filename
    file_path TEXT NOT NULL,              -- Storage path
    file_size INTEGER,                    -- File size in bytes
    file_type TEXT,                       -- MIME type
    document_type TEXT,                   -- Category (requirements, design, etc.)
    version TEXT DEFAULT '1.0',           -- Document version
    description TEXT,                     -- Document description
    uploaded_by TEXT NOT NULL,            -- Uploader (AD username)
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,          -- Soft delete flag
    
    -- Security and Access
    access_level TEXT DEFAULT 'internal' CHECK(access_level IN ('public', 'internal', 'confidential', 'restricted')),
    
    FOREIGN KEY (program_id) REFERENCES ai_programs(program_id),
    FOREIGN KEY (uploaded_by) REFERENCES ad_user_cache(username),
    CHECK (is_active IN (0, 1)),
    CHECK (file_size >= 0)
);

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================
-- Comprehensive audit trail for all changes
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,             -- Table that was modified
    record_id TEXT NOT NULL,              -- Primary key of modified record
    operation TEXT NOT NULL CHECK(operation IN ('INSERT', 'UPDATE', 'DELETE')),
    field_name TEXT,                      -- Specific field changed (for UPDATEs)
    old_value TEXT,                       -- Previous value
    new_value TEXT,                       -- New value
    changed_by TEXT NOT NULL,             -- User who made the change (AD username)
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT,                   -- Optional reason for change
    session_id TEXT,                      -- Session identifier for tracking
    ip_address TEXT,                      -- Client IP address
    
    FOREIGN KEY (changed_by) REFERENCES ad_user_cache(username)
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Departments indexes
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_dept_code);
CREATE INDEX IF NOT EXISTS idx_departments_head ON departments(dept_head_username);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

-- AD User Cache indexes
CREATE INDEX IF NOT EXISTS idx_ad_users_dept ON ad_user_cache(department_code);
CREATE INDEX IF NOT EXISTS idx_ad_users_manager ON ad_user_cache(manager_username);
CREATE INDEX IF NOT EXISTS idx_ad_users_email ON ad_user_cache(email);
CREATE INDEX IF NOT EXISTS idx_ad_users_active ON ad_user_cache(is_active);
CREATE INDEX IF NOT EXISTS idx_ad_users_sync ON ad_user_cache(last_ad_sync);

-- AI Programs indexes  
CREATE INDEX IF NOT EXISTS idx_programs_dept ON ai_programs(department_code);
CREATE INDEX IF NOT EXISTS idx_programs_lead ON ai_programs(program_lead);
CREATE INDEX IF NOT EXISTS idx_programs_status ON ai_programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_stage ON ai_programs(stage);
CREATE INDEX IF NOT EXISTS idx_programs_priority ON ai_programs(priority);
CREATE INDEX IF NOT EXISTS idx_programs_dates ON ai_programs(planned_start_date, planned_end_date);
CREATE INDEX IF NOT EXISTS idx_programs_created ON ai_programs(created_at);
CREATE INDEX IF NOT EXISTS idx_programs_code ON ai_programs(program_code);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_program ON documents(program_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON documents(uploaded_at);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_operation ON audit_log(operation);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================

-- Departments updated_at trigger
CREATE TRIGGER IF NOT EXISTS trg_departments_updated_at
    AFTER UPDATE ON departments
    FOR EACH ROW
BEGIN
    UPDATE departments SET updated_at = CURRENT_TIMESTAMP WHERE dept_code = NEW.dept_code;
END;

-- AD User Cache updated_at trigger
CREATE TRIGGER IF NOT EXISTS trg_ad_users_updated_at
    AFTER UPDATE ON ad_user_cache
    FOR EACH ROW
BEGIN
    UPDATE ad_user_cache SET updated_at = CURRENT_TIMESTAMP WHERE username = NEW.username;
END;

-- AI Programs updated_at trigger
CREATE TRIGGER IF NOT EXISTS trg_programs_updated_at
    AFTER UPDATE ON ai_programs
    FOR EACH ROW
BEGIN
    UPDATE ai_programs SET updated_at = CURRENT_TIMESTAMP WHERE program_id = NEW.program_id;
END;

-- =====================================================
-- VIEWS FOR BACKWARD COMPATIBILITY
-- =====================================================

-- View to maintain compatibility with existing "initiatives" queries
CREATE VIEW IF NOT EXISTS initiatives AS
SELECT 
    p.program_id as id,
    p.program_name as name,
    p.description,
    d.dept_name as department,
    p.stage,
    p.priority,
    u.display_name as lead_name,
    u.email as lead_email,
    p.business_value,
    p.technical_approach,
    p.planned_start_date as start_date,
    p.planned_end_date as end_date,
    p.status,
    p.created_at,
    p.updated_at
FROM ai_programs p
JOIN departments d ON p.department_code = d.dept_code
LEFT JOIN ad_user_cache u ON p.program_lead = u.username
WHERE p.status != 'cancelled';

-- View for user information (maintains compatibility)
CREATE VIEW IF NOT EXISTS users AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY username) as id,
    username,
    email,
    CASE 
        WHEN username LIKE '%admin%' THEN 'admin'
        WHEN username LIKE '%review%' THEN 'reviewer'
        ELSE 'contributor'
    END as role,
    created_at,
    NULL as last_login
FROM ad_user_cache
WHERE is_active = 1;