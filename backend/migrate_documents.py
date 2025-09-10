#!/usr/bin/env python3
"""
Migration script to upgrade documents table to support three-tier document system
"""
import sqlite3
import os
from database import DATABASE_PATH, get_db
from models import (DOCUMENT_TEMPLATES_TABLE, DOCUMENT_REQUIREMENTS_TABLE, 
                    DOCUMENT_VERSIONS_TABLE)

def migrate_documents_table():
    """Migrate existing documents table to new schema"""
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        print("Starting documents table migration...")
        
        # Check if migration already done
        try:
            cursor.execute("SELECT library_type FROM documents LIMIT 1")
            print("Migration already completed - documents table has new columns")
            return
        except sqlite3.OperationalError:
            # Column doesn't exist, proceed with migration
            pass
        
        try:
            # Step 1: Create backup of existing data
            print("Creating backup of existing documents...")
            cursor.execute("""
                CREATE TABLE documents_backup AS 
                SELECT * FROM documents
            """)
            
            # Step 2: Drop existing table
            print("Dropping old documents table...")
            cursor.execute("DROP TABLE documents")
            
            # Step 3: Create new documents table with enhanced schema
            print("Creating new documents table...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    initiative_id INTEGER,
                    filename TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    file_size INTEGER,
                    uploaded_by TEXT,
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    document_type TEXT,
                    library_type TEXT CHECK(library_type IN ('admin', 'core', 'ancillary')) NOT NULL,
                    category TEXT,
                    is_template INTEGER DEFAULT 0,
                    is_required INTEGER DEFAULT 0,
                    template_id INTEGER,
                    version INTEGER DEFAULT 1,
                    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'deleted')),
                    description TEXT,
                    tags TEXT,
                    FOREIGN KEY (initiative_id) REFERENCES initiatives (id),
                    FOREIGN KEY (template_id) REFERENCES documents (id)
                )
            """)
            
            # Step 4: Migrate existing data
            print("Migrating existing data...")
            cursor.execute("""
                INSERT INTO documents (
                    id, initiative_id, filename, file_path, file_size, 
                    uploaded_by, uploaded_at, document_type, library_type
                )
                SELECT 
                    id, initiative_id, filename, file_path, file_size,
                    uploaded_by, uploaded_at, document_type, 
                    'ancillary' as library_type
                FROM documents_backup
            """)
            
            # Step 5: Create new tables
            print("Creating document templates table...")
            cursor.execute(DOCUMENT_TEMPLATES_TABLE)
            
            print("Creating document requirements table...")
            cursor.execute(DOCUMENT_REQUIREMENTS_TABLE)
            
            print("Creating document versions table...")
            cursor.execute(DOCUMENT_VERSIONS_TABLE)
            
            # Step 6: Create indexes
            print("Creating indexes...")
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_documents_initiative 
                ON documents(initiative_id)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_documents_library_type 
                ON documents(library_type)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_documents_template_id 
                ON documents(template_id)
            """)
            
            # Step 7: Insert some sample document requirements
            print("Inserting sample document requirements...")
            sample_requirements = [
                ("Business Case", "Business justification document", "business", "discovery", 1, None),
                ("Technical Architecture", "Technical design and architecture", "technical", "design", 1, None),
                ("Risk Assessment", "Risk analysis and mitigation plan", "compliance", "discovery", 1, None),
                ("Implementation Plan", "Project implementation timeline", "project", "build", 1, None),
                ("Go-Live Checklist", "Production readiness checklist", "deployment", "pilot", 1, None)
            ]
            
            for req in sample_requirements:
                cursor.execute("""
                    INSERT INTO document_requirements 
                    (name, description, category, stage, is_mandatory, template_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, req)
            
            # Step 8: Clean up backup table
            print("Cleaning up...")
            cursor.execute("DROP TABLE documents_backup")
            
            conn.commit()
            print("Documents table migration completed successfully!")
            
            # Show migration results
            cursor.execute("SELECT COUNT(*) FROM documents")
            doc_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM document_templates")
            template_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM document_requirements")
            req_count = cursor.fetchone()[0]
            
            print(f"Migration summary:")
            print(f"  - Documents migrated: {doc_count}")
            print(f"  - Document templates: {template_count}")
            print(f"  - Document requirements: {req_count}")
            
        except Exception as e:
            print(f"Migration failed: {e}")
            # Try to restore from backup if it exists
            try:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='documents_backup'")
                if cursor.fetchone():
                    print("Attempting to restore from backup...")
                    cursor.execute("DROP TABLE IF EXISTS documents")
                    cursor.execute("ALTER TABLE documents_backup RENAME TO documents")
                    conn.commit()
                    print("Restored from backup")
            except Exception as restore_error:
                print(f"Failed to restore from backup: {restore_error}")
            raise

if __name__ == "__main__":
    migrate_documents_table()