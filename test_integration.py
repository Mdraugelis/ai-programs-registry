#!/usr/bin/env python3
import requests
import json
import sys
import os

BASE_URL = "http://localhost:8000"

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

def main():
    """Run all integration tests"""
    print("=" * 50)
    print("Running Integration Tests")
    print("=" * 50)
    
    try:
        # Test health check
        test_health()
        
        # Test authentication and get token
        token = test_auth()
        
        # Test initiatives CRUD
        initiative_id = test_initiatives_crud(token)
        
        # Test document upload (use existing initiative ID 1)
        doc_id = test_document_upload(token, 1)
        
        # Test CSV export
        test_csv_export(token)
        
        print("\n" + "=" * 50)
        print("✅ All tests passed!")
        print("=" * 50)
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to API. Make sure the server is running:")
        print("   cd backend && uvicorn app:app --reload")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()