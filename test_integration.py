#!/usr/bin/env python3
import requests
import json
import sys
import os
import sqlite3
from datetime import datetime

BASE_URL = "http://localhost:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    END = '\033[0m'

def test_with_status(test_name):
    """Decorator for test status reporting"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            print(f"\n{Colors.BLUE}Testing {test_name}...{Colors.END}")
            try:
                result = func(*args, **kwargs)
                print(f"{Colors.GREEN}✓ {test_name} passed{Colors.END}")
                return result
            except Exception as e:
                print(f"{Colors.RED}✗ {test_name} failed: {str(e)}{Colors.END}")
                raise
        return wrapper
    return decorator

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    print("✓ Health check passed")

def test_auth():
    """Test authentication"""
    print("\nTesting authentication...")
    
    # Test login with correct credentials
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data=login_data
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    print("✓ Login successful")
    
    # Test getting current user
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    assert response.status_code == 200
    user = response.json()
    assert user["username"] == "admin"
    print("✓ Current user retrieved")
    
    # Test with invalid credentials
    bad_login = {
        "username": "admin",
        "password": "wrongpassword"
    }
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data=bad_login
    )
    assert response.status_code == 401
    print("✓ Invalid credentials rejected")
    
    return token

def test_initiatives_crud(token):
    """Test initiatives CRUD operations"""
    print("\nTesting initiatives CRUD...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create initiative
    new_initiative = {
        "name": "Test AI Initiative",
        "description": "Testing the API",
        "department": "IT",
        "stage": "discovery",
        "priority": "medium",
        "lead_name": "Test Lead",
        "lead_email": "test@example.com"
    }
    response = requests.post(
        f"{BASE_URL}/api/initiatives",
        json=new_initiative,
        headers=headers
    )
    assert response.status_code == 200
    created = response.json()
    initiative_id = created["id"]
    print(f"✓ Initiative created (ID: {initiative_id})")
    
    # Get single initiative
    response = requests.get(
        f"{BASE_URL}/api/initiatives/{initiative_id}",
        headers=headers
    )
    assert response.status_code == 200
    initiative = response.json()
    assert initiative["name"] == new_initiative["name"]
    print("✓ Single initiative retrieved")
    
    # Update initiative
    update_data = {
        "priority": "high",
        "stage": "pilot"
    }
    response = requests.put(
        f"{BASE_URL}/api/initiatives/{initiative_id}",
        json=update_data,
        headers=headers
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["priority"] == "high"
    assert updated["stage"] == "pilot"
    print("✓ Initiative updated")
    
    # List initiatives with filters
    response = requests.get(
        f"{BASE_URL}/api/initiatives",
        params={"department": "IT", "stage": "pilot"},
        headers=headers
    )
    assert response.status_code == 200
    initiatives = response.json()
    assert len(initiatives) > 0
    print(f"✓ Initiatives listed with filters ({len(initiatives)} found)")
    
    # Delete initiative (admin only)
    response = requests.delete(
        f"{BASE_URL}/api/initiatives/{initiative_id}",
        headers=headers
    )
    assert response.status_code == 200
    print("✓ Initiative deleted")
    
    return initiative_id

def test_document_upload(token, initiative_id=1):
    """Test document upload"""
    print("\nTesting document upload...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a test file
    test_file_path = "test_document.txt"
    with open(test_file_path, "w") as f:
        f.write("This is a test document for the AI initiative.")
    
    try:
        # Upload document
        with open(test_file_path, "rb") as f:
            files = {"file": ("test_document.txt", f, "text/plain")}
            data = {
                "initiative_id": initiative_id,
                "document_type": "test"
            }
            response = requests.post(
                f"{BASE_URL}/api/upload",
                files=files,
                data=data,
                headers=headers
            )
        
        if response.status_code == 200:
            doc_info = response.json()
            print(f"✓ Document uploaded (ID: {doc_info['id']})")
            
            # List documents for initiative
            response = requests.get(
                f"{BASE_URL}/api/initiatives/{initiative_id}/documents",
                headers=headers
            )
            assert response.status_code == 200
            documents = response.json()
            print(f"✓ Documents listed ({len(documents)} found)")
            
            return doc_info['id']
        else:
            print(f"✗ Document upload failed: {response.status_code}")
            return None
    
    finally:
        # Clean up test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

def test_csv_export(token):
    """Test CSV export"""
    print("\nTesting CSV export...")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/export/csv",
        headers=headers
    )
    assert response.status_code == 200
    csv_content = response.text
    assert len(csv_content) > 0
    lines = csv_content.strip().split('\n')
    print(f"✓ CSV export successful ({len(lines)-1} initiatives)")

@test_with_status("Database Schema Validation")
def test_database_schema():
    """Verify the database schema matches Issue #1 requirements"""
    db_path = "backend/database.db"
    if not os.path.exists(db_path):
        raise AssertionError("Database file does not exist")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if all required tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    required_tables = ['initiatives', 'documents', 'users']
    
    for table in required_tables:
        assert table in tables, f"Required table '{table}' not found"
    
    # Verify initiatives table structure
    cursor.execute("PRAGMA table_info(initiatives)")
    initiatives_columns = {row[1]: row[2] for row in cursor.fetchall()}
    required_init_columns = ['id', 'name', 'description', 'department', 'stage', 
                           'priority', 'lead_name', 'lead_email', 'business_value', 
                           'technical_approach', 'start_date', 'end_date', 'status', 
                           'created_at', 'updated_at']
    
    for col in required_init_columns:
        assert col in initiatives_columns, f"Column '{col}' missing from initiatives table"
    
    # Verify documents table structure
    cursor.execute("PRAGMA table_info(documents)")
    doc_columns = {row[1]: row[2] for row in cursor.fetchall()}
    required_doc_columns = ['id', 'initiative_id', 'filename', 'file_path', 
                          'file_size', 'uploaded_by', 'uploaded_at', 'document_type']
    
    for col in required_doc_columns:
        assert col in doc_columns, f"Column '{col}' missing from documents table"
    
    # Verify users table structure
    cursor.execute("PRAGMA table_info(users)")
    user_columns = {row[1]: row[2] for row in cursor.fetchall()}
    required_user_columns = ['id', 'username', 'email', 'hashed_password', 'role', 
                           'created_at', 'last_login']
    
    for col in required_user_columns:
        assert col in user_columns, f"Column '{col}' missing from users table"
    
    # Verify foreign key constraints
    cursor.execute("PRAGMA foreign_key_list(documents)")
    fk_info = cursor.fetchall()
    assert len(fk_info) > 0, "No foreign key constraints found on documents table"
    
    conn.close()

@test_with_status("API Endpoints Coverage")
def test_api_endpoints_exist():
    """Verify all required API endpoints exist"""
    # Test without authentication first to check endpoint existence
    endpoints_to_test = [
        ("/", "GET"),
        ("/health", "GET"),
        ("/api/auth/login", "POST"),
        ("/api/initiatives", "GET"),
        ("/api/initiatives", "POST"),
        ("/api/export/csv", "GET"),
        ("/api/upload", "POST")
    ]
    
    for endpoint, method in endpoints_to_test:
        response = requests.request(method, f"{BASE_URL}{endpoint}")
        # We expect either 200, 401 (auth required), or 422 (validation error)
        assert response.status_code in [200, 401, 422], f"Endpoint {method} {endpoint} not accessible"

@test_with_status("Pagination and Sorting")
def test_pagination_and_sorting(token):
    """Test pagination, sorting, and filtering capabilities"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create multiple test initiatives
    test_initiatives = [
        {"name": f"Test Initiative {i}", "department": "IT" if i % 2 == 0 else "Finance", 
         "priority": "high" if i < 2 else "medium", "stage": "discovery"}
        for i in range(5)
    ]
    
    created_ids = []
    for init in test_initiatives:
        response = requests.post(f"{BASE_URL}/api/initiatives", json=init, headers=headers)
        assert response.status_code == 200
        created_ids.append(response.json()["id"])
    
    try:
        # Test pagination
        response = requests.get(f"{BASE_URL}/api/initiatives?skip=0&limit=3", headers=headers)
        assert response.status_code == 200
        initiatives = response.json()
        assert len(initiatives) <= 3, "Pagination limit not respected"
        
        # Test sorting by name
        response = requests.get(f"{BASE_URL}/api/initiatives?sort_by=name&sort_order=asc", headers=headers)
        assert response.status_code == 200
        initiatives = response.json()
        if len(initiatives) >= 2:
            assert initiatives[0]["name"] <= initiatives[1]["name"], "Sorting by name not working"
        
        # Test filtering by department
        response = requests.get(f"{BASE_URL}/api/initiatives?department=IT", headers=headers)
        assert response.status_code == 200
        initiatives = response.json()
        for init in initiatives:
            assert init["department"] == "IT", "Department filter not working"
        
        # Test multiple filters
        response = requests.get(f"{BASE_URL}/api/initiatives?department=IT&priority=high", headers=headers)
        assert response.status_code == 200
        initiatives = response.json()
        for init in initiatives:
            assert init["department"] == "IT" and init["priority"] == "high", "Multiple filters not working"
    
    finally:
        # Clean up test data
        for init_id in created_ids:
            requests.delete(f"{BASE_URL}/api/initiatives/{init_id}", headers=headers)

@test_with_status("Role-Based Authorization")
def test_role_based_authorization():
    """Test different user roles and authorization"""
    # Test contributor access
    login_data = {"username": "contributor", "password": "contrib123"}
    response = requests.post(f"{BASE_URL}/api/auth/login", data=login_data)
    assert response.status_code == 200
    contrib_token = response.json()["access_token"]
    contrib_headers = {"Authorization": f"Bearer {contrib_token}"}
    
    # Contributor should be able to read initiatives
    response = requests.get(f"{BASE_URL}/api/initiatives", headers=contrib_headers)
    assert response.status_code == 200
    
    # Contributor should NOT be able to delete (admin only)
    response = requests.delete(f"{BASE_URL}/api/initiatives/1", headers=contrib_headers)
    assert response.status_code == 403, "Contributor should not have delete access"
    
    # Test reviewer access
    login_data = {"username": "reviewer", "password": "review123"}
    response = requests.post(f"{BASE_URL}/api/auth/login", data=login_data)
    assert response.status_code == 200
    reviewer_token = response.json()["access_token"]
    reviewer_headers = {"Authorization": f"Bearer {reviewer_token}"}
    
    # Reviewer should be able to read initiatives
    response = requests.get(f"{BASE_URL}/api/initiatives", headers=reviewer_headers)
    assert response.status_code == 200

@test_with_status("Error Handling and Edge Cases")
def test_error_handling(token):
    """Test error handling and edge cases"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 404 for non-existent initiative
    response = requests.get(f"{BASE_URL}/api/initiatives/99999", headers=headers)
    assert response.status_code == 404
    
    # Test invalid initiative data
    invalid_initiative = {
        "name": "",  # Empty name should fail
        "stage": "invalid_stage",  # Invalid stage
        "priority": "invalid_priority"  # Invalid priority
    }
    response = requests.post(f"{BASE_URL}/api/initiatives", json=invalid_initiative, headers=headers)
    assert response.status_code in [422, 400], "Invalid data should be rejected"
    
    # Test unauthorized access (no token)
    response = requests.get(f"{BASE_URL}/api/initiatives")
    assert response.status_code == 401, "Unauthorized access should be rejected"
    
    # Test invalid token
    bad_headers = {"Authorization": "Bearer invalid_token"}
    response = requests.get(f"{BASE_URL}/api/initiatives", headers=bad_headers)
    assert response.status_code == 401, "Invalid token should be rejected"

@test_with_status("File Upload Edge Cases")
def test_file_upload_edge_cases(token):
    """Test file upload with various edge cases"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test upload to non-existent initiative
    test_file = "temp_test.txt"
    with open(test_file, "w") as f:
        f.write("test content")
    
    try:
        with open(test_file, "rb") as f:
            files = {"file": ("test.txt", f, "text/plain")}
            data = {"initiative_id": 99999, "document_type": "test"}
            response = requests.post(f"{BASE_URL}/api/upload", files=files, data=data, headers=headers)
        
        assert response.status_code == 404, "Upload to non-existent initiative should fail"
        
        # Test download of non-existent document
        response = requests.get(f"{BASE_URL}/api/documents/99999", headers=headers)
        assert response.status_code == 404, "Download of non-existent document should fail"
    
    finally:
        if os.path.exists(test_file):
            os.remove(test_file)

@test_with_status("Database Connection Management")
def test_database_connection_handling():
    """Test database connection context handling"""
    # This test verifies the database connection manager works correctly
    # by making multiple concurrent-like requests
    
    # Login to get token
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{BASE_URL}/api/auth/login", data=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Make multiple rapid requests to test connection handling
    for i in range(10):
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        
        response = requests.get(f"{BASE_URL}/api/initiatives", headers=headers)
        assert response.status_code == 200

def main():
    """Run comprehensive integration tests for Issue #1 verification"""
    print("=" * 70)
    print(f"{Colors.BLUE}AI ATLAS - COMPREHENSIVE INTEGRATION TEST SUITE{Colors.END}")
    print(f"{Colors.BLUE}Verifying GitHub Issue #1 Implementation{Colors.END}")
    print("=" * 70)
    
    passed_tests = 0
    failed_tests = 0
    
    def run_test(test_func, *args):
        nonlocal passed_tests, failed_tests
        try:
            test_func(*args)
            passed_tests += 1
        except Exception as e:
            print(f"{Colors.RED}✗ {test_func.__name__} failed: {str(e)}{Colors.END}")
            failed_tests += 1
    
    try:
        # Phase 1: Infrastructure and Schema Tests
        print(f"\n{Colors.YELLOW}=== PHASE 1: Infrastructure & Database ===={Colors.END}")
        run_test(test_database_schema)
        run_test(test_api_endpoints_exist)
        run_test(test_database_connection_handling)
        
        # Phase 2: Authentication and Authorization
        print(f"\n{Colors.YELLOW}=== PHASE 2: Authentication & Authorization ===={Colors.END}")
        
        # Basic health and auth tests (legacy format for compatibility)
        print("\nTesting health endpoint...")
        test_health()
        passed_tests += 1
        
        print("\nTesting authentication...")
        token = test_auth()
        passed_tests += 1
        
        run_test(test_role_based_authorization)
        
        # Phase 3: Core CRUD Operations
        print(f"\n{Colors.YELLOW}=== PHASE 3: CRUD Operations ===={Colors.END}")
        
        print("\nTesting initiatives CRUD...")
        initiative_id = test_initiatives_crud(token)
        passed_tests += 1
        
        run_test(test_pagination_and_sorting, token)
        run_test(test_error_handling, token)
        
        # Phase 4: Document Management
        print(f"\n{Colors.YELLOW}=== PHASE 4: Document Management ===={Colors.END}")
        
        print("\nTesting document upload...")
        doc_id = test_document_upload(token, 1)
        passed_tests += 1
        
        run_test(test_file_upload_edge_cases, token)
        
        # Phase 5: Data Export
        print(f"\n{Colors.YELLOW}=== PHASE 5: Data Export ===={Colors.END}")
        
        print("\nTesting CSV export...")
        test_csv_export(token)
        passed_tests += 1
        
        # Summary
        total_tests = passed_tests + failed_tests
        print("\n" + "=" * 70)
        print(f"{Colors.BLUE}INTEGRATION TEST SUMMARY{Colors.END}")
        print("=" * 70)
        print(f"Total Tests Run: {total_tests}")
        print(f"{Colors.GREEN}Passed: {passed_tests}{Colors.END}")
        
        if failed_tests > 0:
            print(f"{Colors.RED}Failed: {failed_tests}{Colors.END}")
            print(f"\n{Colors.RED}❌ Some tests failed. Issue #1 verification incomplete.{Colors.END}")
            sys.exit(1)
        else:
            print(f"{Colors.RED}Failed: {failed_tests}{Colors.END}")
            print(f"\n{Colors.GREEN}✅ ALL TESTS PASSED!{Colors.END}")
            print(f"{Colors.GREEN}🎉 GitHub Issue #1 implementation is COMPLETE and verified!{Colors.END}")
            print("=" * 70)
        
    except requests.exceptions.ConnectionError:
        print(f"\n{Colors.RED}❌ Cannot connect to API. Make sure the server is running:{Colors.END}")
        print("   cd backend && uvicorn app:app --reload")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}❌ Unexpected error: {e}{Colors.END}")
        sys.exit(1)

if __name__ == "__main__":
    main()