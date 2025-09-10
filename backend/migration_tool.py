#!/usr/bin/env python3
"""
Migration Tool for AD-Aligned Database Schema
Safely migrates existing data to new AD-integrated structure
"""

import sqlite3
import os
import sys
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatabaseMigrator:
    """Handles migration from legacy to AD-aligned schema"""
    
    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = os.path.join(os.path.dirname(__file__), "database.db")
        
        self.db_path = db_path
        self.backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.database_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database")
        
        # SQL script paths
        self.schema_sql = os.path.join(self.database_dir, "schema.sql")
        self.migration_sql = os.path.join(self.database_dir, "migration.sql")
        self.seed_sql = os.path.join(self.database_dir, "seed_data.sql")
        self.rollback_sql = os.path.join(self.database_dir, "rollback.sql")
        
        logger.info(f"Initialized migrator for database: {self.db_path}")
    
    def create_backup(self) -> bool:
        """Create a backup of the current database"""
        try:
            if os.path.exists(self.db_path):
                import shutil
                shutil.copy2(self.db_path, self.backup_path)
                logger.info(f"Database backup created: {self.backup_path}")
                return True
            else:
                logger.warning("No existing database found to backup")
                return False
        except Exception as e:
            logger.error(f"Failed to create backup: {e}")
            return False
    
    def validate_prerequisites(self) -> bool:
        """Validate that all required files exist"""
        required_files = [self.schema_sql, self.migration_sql, self.seed_sql]
        
        missing_files = []
        for file_path in required_files:
            if not os.path.exists(file_path):
                missing_files.append(file_path)
        
        if missing_files:
            logger.error(f"Missing required files: {missing_files}")
            return False
        
        logger.info("All prerequisite files found")
        return True
    
    def execute_sql_file(self, conn: sqlite3.Connection, file_path: str) -> bool:
        """Execute SQL commands from a file"""
        try:
            with open(file_path, 'r') as f:
                sql_content = f.read()
            
            # Handle multi-statement SQL with triggers (BEGIN...END blocks)
            statements = self._parse_sql_statements(sql_content)
            
            for i, statement in enumerate(statements):
                if statement:
                    try:
                        conn.execute(statement)
                    except sqlite3.Error as e:
                        # Some statements might fail due to existing objects, log but continue
                        logger.warning(f"SQL statement {i+1} warning: {e}")
                        continue
            
            conn.commit()
            logger.info(f"Successfully executed SQL file: {os.path.basename(file_path)}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to execute SQL file {file_path}: {e}")
            return False
    
    def _parse_sql_statements(self, sql_content: str) -> List[str]:
        """Parse SQL content into individual statements, handling BEGIN...END blocks and multi-line statements"""
        statements = []
        current_statement = ""
        in_block = False
        block_type = None
        
        lines = sql_content.split('\n')
        
        for line in lines:
            line_stripped = line.strip()
            
            # Skip empty lines and comments when not in a statement
            if not line_stripped or (line_stripped.startswith('--') and not current_statement):
                continue
            
            current_statement += line + '\n'
            
            # Check for multi-line statement blocks
            if any(keyword in line_stripped.upper() for keyword in ['CREATE TRIGGER', 'CREATE VIEW', 'CREATE TEMPORARY VIEW']):
                in_block = True
                block_type = 'TRIGGER' if 'TRIGGER' in line_stripped.upper() else 'VIEW'
            elif 'BEGIN' in line_stripped.upper() and block_type == 'TRIGGER':
                in_block = True
            elif any(line_stripped.upper().startswith(keyword) for keyword in ['INSERT INTO', 'UPDATE ', 'DELETE FROM']):
                # Multi-line DML statements
                in_block = True
                block_type = 'DML'
            
            # Check for statement end
            if line_stripped.endswith(';'):
                if not in_block:
                    # Simple statement complete
                    statements.append(current_statement.strip())
                    current_statement = ""
                elif block_type == 'TRIGGER' and 'END;' in line_stripped.upper():
                    # Trigger complete
                    statements.append(current_statement.strip())
                    current_statement = ""
                    in_block = False
                    block_type = None
                elif block_type in ['VIEW', 'DML']:
                    # View or DML statement complete
                    statements.append(current_statement.strip())
                    current_statement = ""
                    in_block = False
                    block_type = None
        
        # Add any remaining statement
        if current_statement.strip():
            statements.append(current_statement.strip())
        
        # Filter out empty statements and pure comment blocks
        filtered_statements = []
        for stmt in statements:
            if stmt and not self._is_pure_comment_block(stmt):
                filtered_statements.append(stmt)
        
        return filtered_statements
    
    def _is_pure_comment_block(self, statement: str) -> bool:
        """Check if a statement is just comments and separators"""
        lines = [line.strip() for line in statement.split('\n')]
        for line in lines:
            if line and not line.startswith('--') and not all(c in '-=' for c in line):
                return False
        return True
    
    def check_existing_data(self) -> Dict[str, int]:
        """Check what data exists in the current database"""
        data_counts = {
            'initiatives': 0,
            'documents': 0,
            'users': 0
        }
        
        if not os.path.exists(self.db_path):
            logger.info("No existing database found")
            return data_counts
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                for table in data_counts.keys():
                    try:
                        cursor = conn.execute(f"SELECT COUNT(*) FROM {table}")
                        data_counts[table] = cursor.fetchone()[0]
                    except sqlite3.Error:
                        # Table might not exist
                        data_counts[table] = 0
            
            logger.info(f"Existing data counts: {data_counts}")
            return data_counts
            
        except Exception as e:
            logger.error(f"Failed to check existing data: {e}")
            return data_counts
    
    def create_fresh_database(self) -> bool:
        """Create a fresh database with AD-aligned schema"""
        try:
            # Remove existing database if it exists
            if os.path.exists(self.db_path):
                os.remove(self.db_path)
            
            # Create new database
            with sqlite3.connect(self.db_path) as conn:
                # Enable foreign keys
                conn.execute("PRAGMA foreign_keys = ON")
                
                # Execute schema
                if not self.execute_sql_file(conn, self.schema_sql):
                    return False
                
                # Execute seed data
                if not self.execute_sql_file(conn, self.seed_sql):
                    return False
            
            logger.info("Fresh AD-aligned database created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create fresh database: {e}")
            return False
    
    def migrate_existing_data(self) -> bool:
        """Migrate existing data to AD-aligned schema"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Enable foreign keys
                conn.execute("PRAGMA foreign_keys = ON")
                
                # First, create the new schema alongside existing tables
                logger.info("Creating AD-aligned schema...")
                if not self.execute_sql_file(conn, self.schema_sql):
                    return False
                
                # Execute migration script
                logger.info("Migrating existing data...")
                if not self.execute_sql_file(conn, self.migration_sql):
                    return False
                
                # Verify migration
                return self.verify_migration(conn)
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return False
    
    def verify_migration(self, conn: sqlite3.Connection) -> bool:
        """Verify that migration was successful"""
        try:
            # Check migration validation view
            cursor = conn.execute("""
                SELECT check_type, expected_count, actual_count
                FROM migration_validation
            """)
            
            validation_results = cursor.fetchall()
            all_valid = True
            
            for check_type, expected, actual in validation_results:
                if expected != actual:
                    logger.error(f"Migration validation failed - {check_type}: expected {expected}, got {actual}")
                    all_valid = False
                else:
                    logger.info(f"Migration validation passed - {check_type}: {actual} records")
            
            if all_valid:
                logger.info("All migration validations passed")
            
            return all_valid
            
        except Exception as e:
            logger.error(f"Migration verification failed: {e}")
            return False
    
    def rollback_migration(self) -> bool:
        """Rollback to pre-migration state"""
        try:
            if not os.path.exists(self.backup_path):
                logger.error("No backup file found for rollback")
                return False
            
            # Restore from backup
            import shutil
            shutil.copy2(self.backup_path, self.db_path)
            logger.info(f"Database restored from backup: {self.backup_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            return False
    
    def get_migration_summary(self) -> Dict:
        """Get summary of migration results"""
        if not os.path.exists(self.db_path):
            return {"error": "Database not found"}
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("SELECT * FROM migration_summary")
                row = cursor.fetchone()
                
                if row:
                    columns = [desc[0] for desc in cursor.description]
                    return dict(zip(columns, row))
                else:
                    return {"status": "No migration summary found"}
        
        except Exception as e:
            return {"error": f"Failed to get migration summary: {e}"}
    
    def run_migration(self, force_fresh: bool = False) -> bool:
        """Run the complete migration process"""
        logger.info("Starting database migration process...")
        
        # Validate prerequisites
        if not self.validate_prerequisites():
            return False
        
        # Check existing data
        existing_data = self.check_existing_data()
        has_existing_data = any(count > 0 for count in existing_data.values())
        
        if force_fresh or not has_existing_data:
            logger.info("Creating fresh database with AD-aligned schema...")
            return self.create_fresh_database()
        else:
            logger.info("Migrating existing data to AD-aligned schema...")
            
            # Create backup
            if not self.create_backup():
                logger.error("Cannot proceed without backup")
                return False
            
            # Perform migration
            if self.migrate_existing_data():
                logger.info("Migration completed successfully!")
                summary = self.get_migration_summary()
                logger.info(f"Migration summary: {summary}")
                return True
            else:
                logger.error("Migration failed, consider rollback")
                return False

def main():
    """Command line interface for migration tool"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Database Migration Tool')
    parser.add_argument('--db-path', help='Path to database file')
    parser.add_argument('--fresh', action='store_true', help='Create fresh database (ignore existing data)')
    parser.add_argument('--rollback', action='store_true', help='Rollback to previous state')
    parser.add_argument('--verify', action='store_true', help='Verify migration status')
    parser.add_argument('--summary', action='store_true', help='Show migration summary')
    
    args = parser.parse_args()
    
    migrator = DatabaseMigrator(args.db_path)
    
    if args.rollback:
        logger.info("Performing rollback...")
        success = migrator.rollback_migration()
    elif args.verify:
        logger.info("Verifying migration...")
        with sqlite3.connect(migrator.db_path) as conn:
            success = migrator.verify_migration(conn)
    elif args.summary:
        logger.info("Getting migration summary...")
        summary = migrator.get_migration_summary()
        print(json.dumps(summary, indent=2, default=str))
        success = True
    else:
        logger.info("Running migration...")
        success = migrator.run_migration(force_fresh=args.fresh)
    
    if success:
        logger.info("Operation completed successfully!")
        sys.exit(0)
    else:
        logger.error("Operation failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()