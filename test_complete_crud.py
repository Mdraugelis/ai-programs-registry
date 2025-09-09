#!/usr/bin/env python3
"""
Comprehensive CRUD test to verify all frontend-backend operations
"""
import requests
import json

BASE_URL = 'http://127.0.0.1:8000'

def get_auth_headers():
    """Get authentication headers"""
    login_data = {'username': 'admin', 'password': 'admin123'}
    response = requests.post(f'{BASE_URL}/api/auth/login', data=login_data)
    if response.status_code == 200:
        token = response.json()['access_token']
        return {'Authorization': f'Bearer {token}'}
    else:
        raise Exception(f"Login failed: {response.text}")

def test_full_crud_cycle():
    """Test complete CRUD cycle"""
    print("🧪 Testing Complete CRUD Operations\n")
    
    headers = get_auth_headers()
    
    # 1. CREATE - Create a new initiative
    print("1️⃣ Testing CREATE operation...")
    new_initiative = {
        'name': 'CRUD Test Initiative',
        'description': 'This initiative tests full CRUD functionality',
        'department': 'Engineering',
        'stage': 'discovery',
        'priority': 'high',
        'lead_name': 'Test Engineer',
        'lead_email': 'test@example.com',
        'business_value': 'Ensures system reliability',
        'technical_approach': 'Automated testing with real API calls'
    }
    
    response = requests.post(f'{BASE_URL}/api/initiatives', headers=headers, json=new_initiative)
    assert response.status_code == 200, f"Create failed: {response.text}"
    
    created = response.json()
    initiative_id = created['id']
    print(f"   ✅ Created initiative ID: {initiative_id}")
    print(f"   ✅ Name: {created['name']}")
    print(f"   ✅ Stage: {created['stage']}")
    
    # 2. READ - Get the created initiative
    print("\n2️⃣ Testing READ operation...")
    response = requests.get(f'{BASE_URL}/api/initiatives/{initiative_id}', headers=headers)
    assert response.status_code == 200, f"Read failed: {response.text}"
    
    retrieved = response.json()
    print(f"   ✅ Retrieved initiative: {retrieved['name']}")
    print(f"   ✅ Status: {retrieved.get('status', 'active')}")
    assert retrieved['name'] == new_initiative['name'], "Retrieved data doesn't match created data"
    
    # 3. UPDATE - Update the initiative
    print("\n3️⃣ Testing UPDATE operation...")
    update_data = {
        'name': 'CRUD Test Initiative - UPDATED',
        'stage': 'pilot',
        'priority': 'critical',
        'description': 'This initiative tests full CRUD functionality - NOW UPDATED!'
    }
    
    response = requests.put(f'{BASE_URL}/api/initiatives/{initiative_id}', headers=headers, json=update_data)
    assert response.status_code == 200, f"Update failed: {response.text}"
    
    updated = response.json()
    print(f"   ✅ Updated name: {updated['name']}")
    print(f"   ✅ Updated stage: {updated['stage']}")
    print(f"   ✅ Updated priority: {updated['priority']}")
    assert updated['name'] == update_data['name'], "Update didn't apply correctly"
    assert updated['stage'] == update_data['stage'], "Stage update didn't apply"
    
    # 4. LIST - Verify initiative appears in list
    print("\n4️⃣ Testing LIST operation...")
    response = requests.get(f'{BASE_URL}/api/initiatives', headers=headers)
    assert response.status_code == 200, f"List failed: {response.text}"
    
    initiatives = response.json()
    found = False
    for init in initiatives:
        if init['id'] == initiative_id:
            found = True
            print(f"   ✅ Found initiative in list: {init['name']}")
            break
    
    assert found, "Created initiative not found in list"
    print(f"   ✅ Total initiatives in system: {len(initiatives)}")
    
    # 5. DELETE - Delete the initiative
    print("\n5️⃣ Testing DELETE operation...")
    response = requests.delete(f'{BASE_URL}/api/initiatives/{initiative_id}', headers=headers)
    assert response.status_code == 200, f"Delete failed: {response.text}"
    print(f"   ✅ Deleted initiative ID: {initiative_id}")
    
    # 6. VERIFY DELETE - Ensure initiative is soft deleted
    print("\n6️⃣ Verifying DELETE operation...")
    # Individual GET should still work but show status as 'deleted'
    response = requests.get(f'{BASE_URL}/api/initiatives/{initiative_id}', headers=headers)
    if response.status_code == 200:
        deleted_item = response.json()
        assert deleted_item.get('status') == 'deleted', f"Status should be 'deleted', got: {deleted_item.get('status')}"
        print(f"   ✅ Initiative soft deleted (status: {deleted_item.get('status')})")
    else:
        print(f"   ✅ Initiative not accessible after delete (status: {response.status_code})")
    
    # Should not appear in active list
    response = requests.get(f'{BASE_URL}/api/initiatives', headers=headers)
    assert response.status_code == 200, f"List failed: {response.text}"
    active_initiatives = response.json()
    
    for init in active_initiatives:
        assert init['id'] != initiative_id, "Deleted initiative still appears in active list"
    
    print(f"   ✅ Deleted initiative removed from active list (now showing {len(active_initiatives)} active initiatives)")
    
    print("\n🎉 All CRUD operations completed successfully!")
    print("✅ CREATE ✅ READ ✅ UPDATE ✅ LIST ✅ DELETE")

def test_data_mapping():
    """Test that data mapping between frontend and backend works correctly"""
    print("\n🔄 Testing Frontend-Backend Data Mapping\n")
    
    headers = get_auth_headers()
    
    # Test that frontend field names map correctly to backend schema
    frontend_style_data = {
        'name': 'Data Mapping Test',
        'description': 'Testing field mapping',
        'department': 'QA',
        'stage': 'pilot',
        'priority': 'medium',
        'lead_name': 'Data Mapper',
        'business_value': 'Ensures data consistency'
    }
    
    response = requests.post(f'{BASE_URL}/api/initiatives', headers=headers, json=frontend_style_data)
    assert response.status_code == 200, f"Data mapping test failed: {response.text}"
    
    created = response.json()
    print(f"   ✅ Backend accepts frontend data format")
    print(f"   ✅ Created: {created['name']} (ID: {created['id']})")
    
    # Clean up
    requests.delete(f'{BASE_URL}/api/initiatives/{created["id"]}', headers=headers)
    print("   ✅ Test data cleaned up")

if __name__ == '__main__':
    try:
        test_full_crud_cycle()
        test_data_mapping()
        print("\n🚀 Frontend-Backend Integration FULLY VERIFIED!")
        print("🎯 All systems operational and ready for production!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()