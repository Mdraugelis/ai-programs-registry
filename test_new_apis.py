#!/usr/bin/env python3
"""
Test script for new three-tier document API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8001"

def get_auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", data={
        "username": "admin",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

def test_api_endpoints():
    """Test the new API endpoints"""
    token = get_auth_token()
    if not token:
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("Testing new three-tier document API endpoints...")
    
    # Test 1: List admin documents
    print("\n1. Testing admin documents listing...")
    response = requests.get(f"{BASE_URL}/api/admin/documents", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        docs = response.json()
        print(f"Found {len(docs)} admin documents")
    else:
        print(f"Error: {response.text}")
    
    # Test 2: List document templates  
    print("\n2. Testing document templates listing...")
    response = requests.get(f"{BASE_URL}/api/admin/templates", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        templates = response.json()
        print(f"Found {len(templates)} templates")
    else:
        print(f"Error: {response.text}")
    
    # Test 3: Test initiative documents (filtered by library type)
    print("\n3. Testing initiative documents with library type filter...")
    response = requests.get(f"{BASE_URL}/api/initiatives/1/documents?library_type=ancillary", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        docs = response.json()
        print(f"Found {len(docs)} ancillary documents for initiative 1")
    else:
        print(f"Error: {response.text}")
    
    # Test 4: Test compliance status
    print("\n4. Testing compliance status...")
    response = requests.get(f"{BASE_URL}/api/initiatives/1/compliance", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        compliance = response.json()
        print(f"Compliance status: {compliance['status']} ({compliance['compliance_percentage']:.1f}%)")
        print(f"Required: {compliance['total_required']}, Completed: {compliance['completed']}")
        if compliance['missing']:
            print(f"Missing: {', '.join(compliance['missing'])}")
    else:
        print(f"Error: {response.text}")
    
    # Test 5: Test required documents list
    print("\n5. Testing required documents list...")
    response = requests.get(f"{BASE_URL}/api/initiatives/1/required-documents", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        required = response.json()
        print(f"Found {len(required)} required documents:")
        for doc in required:
            status = "✓" if doc['is_uploaded'] else "✗"
            print(f"  {status} {doc['name']} ({doc['category']})")
    else:
        print(f"Error: {response.text}")
    
    print("\nAPI endpoint testing completed!")

if __name__ == "__main__":
    test_api_endpoints()