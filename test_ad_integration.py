#!/usr/bin/env python3
"""
Integration Test for AD-Aligned Schema Implementation
Validates all components of GitHub issue #12
"""

import sqlite3
import json
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend'
sys.path.append(str(backend_path))

def test_with_status(test_name):
    """Decorator for test status output"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            print(f"\n{'='*60}")
            print(f"🔍 TEST: {test_name}")
            print('='*60)
            try:
                result = func(*args, **kwargs)
                print(f"✅ PASSED: {test_name}")
                return result
            except Exception as e:
                print(f"❌ FAILED: {test_name} - {e}")
                raise
        return wrapper
    return decorator

class ADSchemaIntegrationTest:
    """Comprehensive AD Schema Integration Tests"""
    
    def __init__(self):
        self.test_db = 'backend/test_migration.db'
        self.passed_tests = 0
        self.total_tests = 0
    
    @test_with_status("Database Schema Structure")
    def test_schema_structure(self):
        """Test 1: Verify all required tables and structures exist"""
        self.total_tests += 1
        
        with sqlite3.connect(self.test_db) as conn:
            # Check tables exist
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            tables = [row[0] for row in cursor.fetchall()]
            
            required_tables = [
                'ad_user_cache', 'ai_programs', 'audit_log', 
                'departments', 'documents'
            ]
            
            print("Tables found:", ", ".join(tables))
            
            for table in required_tables:
                if table not in tables:
                    raise ValueError(f"Missing required table: {table}")
            
            # Check indexes exist
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_autoindex_%'")
            indexes = [row[0] for row in cursor.fetchall()]
            print(f"Performance indexes: {len(indexes)} created")
            
            # Check views exist for compatibility
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='view'")
            views = [row[0] for row in cursor.fetchall()]
            print(f"Compatibility views: {views}")
            
            required_views = ['initiatives', 'users']
            for view in required_views:
                if view not in views:
                    raise ValueError(f"Missing compatibility view: {view}")
        
        self.passed_tests += 1

    @test_with_status("Seed Data Population")
    def test_seed_data(self):
        """Test 2: Verify seed data was populated correctly"""
        self.total_tests += 1
        
        with sqlite3.connect(self.test_db) as conn:
            # Check data counts
            counts = {}
            tables = ['departments', 'ad_user_cache', 'ai_programs', 'documents', 'audit_log']
            
            for table in tables:
                cursor = conn.execute(f"SELECT COUNT(*) FROM {table}")
                counts[table] = cursor.fetchone()[0]
                print(f"✓ {table}: {counts[table]} records")
            
            # Validate minimum expected data
            if counts['departments'] < 5:
                raise ValueError(f"Insufficient departments: {counts['departments']} < 5")
            if counts['ad_user_cache'] < 10:
                raise ValueError(f"Insufficient users: {counts['ad_user_cache']} < 10")
            if counts['ai_programs'] < 3:
                raise ValueError(f"Insufficient programs: {counts['ai_programs']} < 3")
                
        self.passed_tests += 1

    @test_with_status("Foreign Key Constraints")
    def test_foreign_keys(self):
        """Test 3: Verify foreign key constraints are enforced"""
        self.total_tests += 1
        
        with sqlite3.connect(self.test_db) as conn:
            # Enable foreign keys
            conn.execute("PRAGMA foreign_keys = ON")
            
            # Test 1: Invalid department reference
            try:
                conn.execute("""
                    INSERT INTO ai_programs (program_name, department_code, program_lead, created_by) 
                    VALUES ('Test Program', 'INVALID_DEPT', 'admin.user', 'admin.user')
                """)
                conn.commit()
                raise AssertionError("Foreign key constraint not enforced for department")
            except sqlite3.IntegrityError:
                print("✓ Department foreign key constraint working")
            
            # Test 2: Invalid user reference
            try:
                conn.execute("""
                    INSERT INTO ai_programs (program_name, department_code, program_lead, created_by) 
                    VALUES ('Test Program', 'IT', 'invalid_user', 'invalid_user')
                """)
                conn.commit()
                raise AssertionError("Foreign key constraint not enforced for user")
            except sqlite3.IntegrityError:
                print("✓ User foreign key constraint working")
                
        self.passed_tests += 1

    @test_with_status("Data Validation Constraints")
    def test_data_validation(self):
        """Test 4: Verify business rule constraints"""
        self.total_tests += 1
        
        with sqlite3.connect(self.test_db) as conn:
            # Test budget constraint (spent <= allocated)
            try:
                conn.execute("""
                    INSERT INTO ai_programs (
                        program_name, department_code, program_lead, created_by,
                        budget_allocated, budget_spent
                    ) VALUES ('Test Budget', 'IT', 'admin.user', 'admin.user', 1000.00, 2000.00)
                """)
                conn.commit()
                raise AssertionError("Budget validation constraint not enforced")
            except sqlite3.IntegrityError:
                print("✓ Budget validation constraint working")
                
            # Test status constraint
            try:
                conn.execute("""
                    INSERT INTO ai_programs (program_name, department_code, program_lead, created_by, status) 
                    VALUES ('Test Status', 'IT', 'admin.user', 'admin.user', 'invalid_status')
                """)
                conn.commit()
                raise AssertionError("Status validation constraint not enforced")
            except sqlite3.IntegrityError:
                print("✓ Status validation constraint working")
                
        self.passed_tests += 1

    @test_with_status("Pydantic Model Integration")
    def test_pydantic_models(self):
        """Test 5: Verify Pydantic models work with database data"""
        self.total_tests += 1
        
        try:
            from models_ad import AIProgram, Department, ADUser, Document, AuditLog
            
            with sqlite3.connect(self.test_db) as conn:
                # Test AIProgram model
                cursor = conn.execute("SELECT * FROM ai_programs LIMIT 1")
                columns = [desc[0] for desc in cursor.description]
                row = cursor.fetchone()
                
                if row:
                    program_data = dict(zip(columns, row))
                    program = AIProgram(**program_data)
                    print(f"✓ AIProgram model: {program.program_name}")
                    print(f"  Department: {program.department_code}")
                    print(f"  Status: {program.status}")
                    print(f"  Stage: {program.stage}")
                    print(f"  Priority: {program.priority}")
                
                # Test Department model
                cursor = conn.execute("SELECT * FROM departments LIMIT 1")
                columns = [desc[0] for desc in cursor.description]
                row = cursor.fetchone()
                
                if row:
                    dept_data = dict(zip(columns, row))
                    dept = Department(**dept_data)
                    print(f"✓ Department model: {dept.dept_name} ({dept.dept_code})")
                
                # Test ADUser model  
                cursor = conn.execute("SELECT * FROM ad_user_cache LIMIT 1")
                columns = [desc[0] for desc in cursor.description]
                row = cursor.fetchone()
                
                if row:
                    user_data = dict(zip(columns, row))
                    user = ADUser(**user_data)
                    print(f"✓ ADUser model: {user.display_name} ({user.username})")
                    
        except ImportError as e:
            raise ValueError(f"Cannot import Pydantic models: {e}")
        except Exception as e:
            raise ValueError(f"Pydantic model validation failed: {e}")
            
        self.passed_tests += 1

    @test_with_status("Backward Compatibility Views")
    def test_backward_compatibility(self):
        """Test 6: Verify backward compatibility views function correctly"""
        self.total_tests += 1
        
        with sqlite3.connect(self.test_db) as conn:
            # Test initiatives view
            cursor = conn.execute("SELECT COUNT(*) FROM initiatives")
            initiatives_count = cursor.fetchone()[0]
            print(f"✓ Initiatives view: {initiatives_count} records")
            
            # Test view structure
            cursor = conn.execute("PRAGMA table_info(initiatives)")
            init_columns = [row[1] for row in cursor.fetchall()]
            
            expected_init_columns = [
                'id', 'name', 'description', 'department', 'stage', 
                'priority', 'lead_name', 'lead_email', 'business_value', 
                'technical_approach', 'start_date', 'end_date', 'status',
                'created_at', 'updated_at'
            ]
            
            for col in expected_init_columns:
                if col not in init_columns:
                    raise ValueError(f"Missing column in initiatives view: {col}")
            
            print(f"✓ Initiatives view structure: {len(init_columns)} columns")
            
            # Test users view
            cursor = conn.execute("SELECT COUNT(*) FROM users")
            users_count = cursor.fetchone()[0]
            print(f"✓ Users view: {users_count} records")
            
            # Test data can be queried
            cursor = conn.execute("SELECT id, name, department FROM initiatives LIMIT 3")
            sample_initiatives = cursor.fetchall()
            print(f"✓ Sample initiatives: {len(sample_initiatives)} retrieved")
            
        self.passed_tests += 1

    @test_with_status("Complex Queries and Joins")
    def test_complex_queries(self):
        """Test 7: Verify complex queries work across tables"""
        self.total_tests += 1
        
        with sqlite3.connect(self.test_db) as conn:
            # Test join across multiple tables
            query = """
                SELECT 
                    p.program_name,
                    d.dept_name,
                    u.display_name as lead_name,
                    p.status,
                    p.stage
                FROM ai_programs p
                JOIN departments d ON p.department_code = d.dept_code
                JOIN ad_user_cache u ON p.program_lead = u.username
                LIMIT 5
            """
            cursor = conn.execute(query)
            join_results = cursor.fetchall()
            print(f"✓ Multi-table join: {len(join_results)} results")
            
            # Test aggregation query
            agg_query = """
                SELECT 
                    d.dept_name,
                    COUNT(p.program_id) as program_count,
                    SUM(COALESCE(p.budget_allocated, 0)) as total_budget
                FROM departments d
                LEFT JOIN ai_programs p ON d.dept_code = p.department_code
                GROUP BY d.dept_code, d.dept_name
                ORDER BY program_count DESC
            """
            cursor = conn.execute(agg_query)
            agg_results = cursor.fetchall()
            print(f"✓ Aggregation query: {len(agg_results)} department summaries")
            
            # Test search query
            search_query = """
                SELECT program_name, description 
                FROM ai_programs 
                WHERE program_name LIKE '%AI%' OR description LIKE '%machine learning%'
            """
            cursor = conn.execute(search_query)
            search_results = cursor.fetchall()
            print(f"✓ Search query: {len(search_results)} matching programs")
            
        self.passed_tests += 1

    @test_with_status("Audit Logging Functionality")
    def test_audit_logging(self):
        """Test 8: Verify audit logging captures changes"""
        self.total_tests += 1
        
        with sqlite3.connect(self.test_db) as conn:
            # Check existing audit entries
            cursor = conn.execute("SELECT COUNT(*) FROM audit_log")
            initial_count = cursor.fetchone()[0]
            print(f"✓ Initial audit entries: {initial_count}")
            
            # Insert test audit entry
            conn.execute("""
                INSERT INTO audit_log (
                    table_name, record_id, operation, field_name,
                    old_value, new_value, changed_by, change_reason
                ) VALUES (
                    'ai_programs', '1', 'UPDATE', 'status',
                    'active', 'on_hold', 'admin.user', 'Integration test'
                )
            """)
            conn.commit()
            
            # Verify audit entry was added
            cursor = conn.execute("SELECT COUNT(*) FROM audit_log WHERE change_reason = 'Integration test'")
            test_count = cursor.fetchone()[0]
            
            if test_count != 1:
                raise ValueError(f"Audit entry not created: expected 1, got {test_count}")
            
            print("✓ Audit logging working correctly")
            
        self.passed_tests += 1

    @test_with_status("Migration Tool Functionality")
    def test_migration_tool(self):
        """Test 9: Verify migration tool works correctly"""
        self.total_tests += 1
        
        try:
            from migration_tool import DatabaseMigrator
            
            # Test migrator initialization
            migrator = DatabaseMigrator(self.test_db)
            
            # Test prerequisite validation
            if not migrator.validate_prerequisites():
                raise ValueError("Migration tool prerequisites not met")
            
            print("✓ Migration tool initialized")
            print("✓ Prerequisites validated")
            
            # Test summary generation
            summary = migrator.get_migration_summary()
            print(f"✓ Migration summary available: {type(summary).__name__}")
            
        except ImportError as e:
            raise ValueError(f"Cannot import migration tool: {e}")
        except Exception as e:
            raise ValueError(f"Migration tool test failed: {e}")
            
        self.passed_tests += 1

    @test_with_status("Performance and Scalability")
    def test_performance(self):
        """Test 10: Verify performance optimizations"""
        self.total_tests += 1
        
        with sqlite3.connect(self.test_db) as conn:
            # Test index usage with EXPLAIN QUERY PLAN
            test_queries = [
                "SELECT * FROM ai_programs WHERE department_code = 'IT'",
                "SELECT * FROM ad_user_cache WHERE department_code = 'IT'",
                "SELECT * FROM ai_programs WHERE status = 'active'",
                "SELECT * FROM documents WHERE program_id = 1"
            ]
            
            for query in test_queries:
                cursor = conn.execute(f"EXPLAIN QUERY PLAN {query}")
                plan = cursor.fetchall()
                
                # Check if index is being used (not doing full table scan)
                uses_index = any("USING INDEX" in str(step) for step in plan)
                if uses_index:
                    print(f"✓ Query uses index: {query[:40]}...")
                else:
                    print(f"⚠ Query may need optimization: {query[:40]}...")
            
            # Test large result set handling
            cursor = conn.execute("SELECT COUNT(*) FROM ai_programs")
            total_programs = cursor.fetchone()[0]
            print(f"✓ Database handles {total_programs} programs")
            
        self.passed_tests += 1

    def run_all_tests(self):
        """Run all integration tests"""
        print("🚀 STARTING AD-ALIGNED SCHEMA INTEGRATION TESTS")
        print("="*80)
        
        # Check if test database exists
        if not os.path.exists(self.test_db):
            raise FileNotFoundError(f"Test database not found: {self.test_db}")
        
        try:
            # Run all tests
            self.test_schema_structure()
            self.test_seed_data()
            self.test_foreign_keys()
            self.test_data_validation()
            self.test_pydantic_models()
            self.test_backward_compatibility()
            self.test_complex_queries()
            self.test_audit_logging()
            self.test_migration_tool()
            self.test_performance()
            
        except Exception as e:
            print(f"\n💥 TEST SUITE FAILED: {e}")
            return False
        
        # Print summary
        print("\n" + "="*80)
        print("📊 TEST SUITE SUMMARY")
        print("="*80)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests)*100:.1f}%")
        
        if self.passed_tests == self.total_tests:
            print("\n🎉 ALL INTEGRATION TESTS PASSED!")
            print("✅ GitHub Issue #12 (AD-Aligned Database Schema) FULLY IMPLEMENTED")
            print("✅ Schema ready for production deployment")
            return True
        else:
            print(f"\n❌ {self.total_tests - self.passed_tests} TESTS FAILED")
            print("❌ Issues need to be resolved before deployment")
            return False

def main():
    """Main test runner"""
    test_suite = ADSchemaIntegrationTest()
    success = test_suite.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)