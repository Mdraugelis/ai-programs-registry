#!/usr/bin/env python3
"""
Test script to verify frontend-backend integration
"""
import requests
import json

BASE_URL = 'http://127.0.0.1:8000'

def test_login():
    """Test user authentication"""
    print("Testing login...")
    
    # Test login with admin credentials
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    response = requests.post(f'{BASE_URL}/api/auth/login', data=login_data)
    
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data['access_token']
        print(f"✅ Login successful! Token: {access_token[:20]}...")
        return access_token
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def test_get_user_info(token):
    """Test getting user information"""
    print("Testing user info...")
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/api/auth/me', headers=headers)
    
    if response.status_code == 200:
        user_data = response.json()
        print(f"✅ User info: {user_data}")
        return user_data
    else:
        print(f"❌ Get user info failed: {response.status_code} - {response.text}")
        return None

def test_get_initiatives(token):
    """Test getting initiatives list"""
    print("Testing initiatives list...")
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/api/initiatives', headers=headers)
    
    if response.status_code == 200:
        initiatives = response.json()
        print(f"✅ Got {len(initiatives)} initiatives")
        for init in initiatives:
            print(f"  - {init['name']} ({init['stage']})")
        return initiatives
    else:
        print(f"❌ Get initiatives failed: {response.status_code} - {response.text}")
        return None

def test_create_initiative(token):
    """Test creating a new initiative"""
    print("Testing initiative creation...")
    
    headers = {'Authorization': f'Bearer {token}'}
    initiative_data = {
        'name': 'Frontend Integration Test Initiative',
        'description': 'This is a test initiative created during frontend-backend integration',
        'department': 'Engineering',
        'stage': 'discovery',
        'priority': 'medium',
        'lead_name': 'Integration Tester',
        'lead_email': 'test@example.com',
        'business_value': 'Validates that frontend and backend work together',
        'technical_approach': 'API integration testing with real requests'
    }
    
    response = requests.post(f'{BASE_URL}/api/initiatives', 
                           headers=headers, 
                           json=initiative_data)
    
    if response.status_code == 200:
        created_init = response.json()
        print(f"✅ Created initiative: {created_init['name']} (ID: {created_init['id']})")
        return created_init
    else:
        print(f"❌ Create initiative failed: {response.status_code} - {response.text}")
        return None

def run_integration_tests():
    """Run all integration tests"""
    print("🚀 Starting Frontend-Backend Integration Tests\n")
    
    # Test 1: Authentication
    token = test_login()
    if not token:
        print("❌ Cannot continue without authentication")
        return False
    
    print()
    
    # Test 2: User info
    user_info = test_get_user_info(token)
    if not user_info:
        print("❌ User info test failed")
        return False
    
    print()
    
    # Test 3: Get initiatives
    initiatives = test_get_initiatives(token)
    if initiatives is None:
        print("❌ Get initiatives test failed")
        return False
    
    print()
    
    # Test 4: Create initiative
    new_initiative = test_create_initiative(token)
    if not new_initiative:
        print("❌ Create initiative test failed")
        return False
    
    print()
    print("✅ All integration tests passed!")
    print("🎉 Frontend-backend integration is working correctly!")
    return True

if __name__ == '__main__':
    try:
        run_integration_tests()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Make sure it's running on http://127.0.0.1:8000")
    except Exception as e:
        print(f"❌ Integration test failed with error: {e}")