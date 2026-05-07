"""Integration tests for Avento API endpoints."""
import requests
import json
from datetime import datetime, timedelta, timezone

BASE_URL = "http://localhost:5000/api"

# Test headers for development mode (uses X-Test-User header instead of JWT)
TEST_ORGANIZER_HEADERS = {
    "X-Test-User": "organizer_test_123",
    "X-Test-Role": "organizer",
    "Content-Type": "application/json"
}

TEST_EVENT = {
    "title": "Test Conference 2026",
    "description": "A great conference for testing",
    "location": "San Francisco, CA",
    "start_datetime": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
    "end_datetime": (datetime.now(timezone.utc) + timedelta(days=30, hours=2)).isoformat(),
    "capacity": 5,
    "registration_mode": "open"
}

def log_test(name, passed, response_code=None, response_body=None):
    """Log test result."""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status} | {name}")
    if response_code:
        print(f"   Status: {response_code}")
    if response_body:
        print(f"   Response: {json.dumps(response_body, indent=2)[:200]}")

def test_create_event():
    """Test 1: Create event as organizer."""
    print("\n" + "="*60)
    print("TEST 1: Create Event (Organizer)")
    print("="*60)
    
    try:
        response = requests.post(f"{BASE_URL}/events", json=TEST_EVENT, headers=TEST_ORGANIZER_HEADERS, timeout=5)
        passed = response.status_code == 201
        data = response.json()
        
        log_test("Create event", passed, response.status_code, data)
        
        if passed and 'id' in data and 'slug' in data:
            print(f"   ✓ Event ID: {data['id']}")
            print(f"   ✓ Slug: {data['slug']}")
            print(f"   ✓ Status: {data.get('status')} (expected: draft)")
            return data['id']
        return None
    except Exception as e:
        log_test("Create event", False)
        print(f"   Error: {str(e)}")
        return None

def test_publish_event(event_id):
    """Test 2: Publish event."""
    print("\n" + "="*60)
    print("TEST 2: Publish Event")
    print("="*60)
    
    try:
        response = requests.post(f"{BASE_URL}/events/{event_id}/publish", headers=TEST_ORGANIZER_HEADERS, timeout=5)
        passed = response.status_code == 200
        data = response.json()
        
        log_test("Publish event", passed, response.status_code, data)
        
        if passed:
            print(f"   ✓ Status: {data.get('status')} (expected: published)")
        return passed
    except Exception as e:
        log_test("Publish event", False)
        print(f"   Error: {str(e)}")
        return False

def test_public_registration_valid(event_id):
    """Test 3: Public registration - valid case."""
    print("\n" + "="*60)
    print("TEST 3: Public Registration - Valid")
    print("="*60)
    
    reg_data = {
        "attendee_name": "Alice Johnson",
        "attendee_email": "alice@example.com"
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(
            f"{BASE_URL}/events/{event_id}/register",
            json=reg_data,
            headers=headers,
            timeout=5
        )
        passed = response.status_code == 201
        data = response.json()
        
        log_test("Register attendee (valid)", passed, response.status_code, data)
        
        if passed:
            print(f"   ✓ Attendee: {data.get('attendee_name')}")
            print(f"   ✓ Email: {data.get('attendee_email')}")
            print(f"   ✓ Status: {data.get('status')} (expected: registered)")
            print(f"   ✓ Registration ID: {data.get('id')}")
        return passed
    except Exception as e:
        log_test("Register attendee (valid)", False)
        print(f"   Error: {str(e)}")
        return False

def test_public_registration_duplicate_email(event_id):
    """Test 4: Public registration - duplicate email blocking."""
    print("\n" + "="*60)
    print("TEST 4: Public Registration - Duplicate Email")
    print("="*60)
    
    reg_data = {
        "attendee_name": "Bob Smith",
        "attendee_email": "alice@example.com"  # Same as first registration
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(
            f"{BASE_URL}/events/{event_id}/register",
            json=reg_data,
            headers=headers,
            timeout=5
        )
        # Should fail with 422 (domain rule violation)
        passed = response.status_code == 422
        data = response.json()
        
        log_test("Block duplicate email", passed, response.status_code, data)
        
        if passed:
            print(f"   ✓ Error message: {data.get('error')}")
        return passed
    except Exception as e:
        log_test("Block duplicate email", False)
        print(f"   Error: {str(e)}")
        return False

def test_public_registration_capacity_fill(event_id):
    """Test 5: Fill event to capacity."""
    print("\n" + "="*60)
    print("TEST 5: Fill Event to Capacity")
    print("="*60)
    
    headers = {"Content-Type": "application/json"}
    emails_registered = ["alice@example.com"]  # Already registered
    
    # Register 4 more attendees (capacity is 5)
    for i in range(2, 6):
        reg_data = {
            "attendee_name": f"Attendee {i}",
            "attendee_email": f"user{i}@example.com"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/events/{event_id}/register",
                json=reg_data,
                headers=headers,
                timeout=5
            )
            if response.status_code == 201:
                emails_registered.append(f"user{i}@example.com")
                print(f"   ✓ Registered user{i}@example.com")
            else:
                print(f"   ⚠ Failed to register user{i}@example.com: {response.status_code}")
        except Exception as e:
            print(f"   ⚠ Error registering user{i}@example.com: {str(e)}")
    
    print(f"\n   Total registered: {len(emails_registered)}/5")
    return len(emails_registered)

def test_public_registration_capacity_exceeded(event_id):
    """Test 6: Attempt to exceed capacity."""
    print("\n" + "="*60)
    print("TEST 6: Exceed Capacity (Should Fail)")
    print("="*60)
    
    reg_data = {
        "attendee_name": "Over Capacity",
        "attendee_email": "overcapacity@example.com"
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(
            f"{BASE_URL}/events/{event_id}/register",
            json=reg_data,
            headers=headers,
            timeout=5
        )
        # Should fail with 422 (capacity exceeded)
        passed = response.status_code == 422
        data = response.json()
        
        log_test("Reject over-capacity registration", passed, response.status_code, data)
        
        if passed:
            print(f"   ✓ Error message: {data.get('error')}")
        return passed
    except Exception as e:
        log_test("Reject over-capacity registration", False)
        print(f"   Error: {str(e)}")
        return False

def test_get_event_by_slug(slug):
    """Test 7: Get event by slug (public)."""
    print("\n" + "="*60)
    print("TEST 7: Get Event by Slug (Public)")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/events/slug/{slug}", timeout=5)
        passed = response.status_code == 200
        data = response.json()
        
        log_test("Get event by slug", passed, response.status_code, data)
        
        if passed:
            print(f"   ✓ Event: {data.get('title')}")
            print(f"   ✓ Status: {data.get('status')}")
        return passed
    except Exception as e:
        log_test("Get event by slug", False)
        print(f"   Error: {str(e)}")
        return False

def test_invalid_request_body():
    """Test 8: Invalid request body validation."""
    print("\n" + "="*60)
    print("TEST 8: Validation - Missing Required Fields")
    print("="*60)
    
    # Missing attendee_name
    reg_data = {"attendee_email": "test@example.com"}
    headers = {"Content-Type": "application/json"}
    
    # Use a dummy event ID since validation should fail first
    try:
        response = requests.post(
            f"{BASE_URL}/events/dummy-id/register",
            json=reg_data,
            headers=headers,
            timeout=5
        )
        # Should fail with 400 (validation error)
        passed = response.status_code == 400
        data = response.json()
        
        log_test("Reject invalid body", passed, response.status_code, data)
        return passed
    except Exception as e:
        log_test("Reject invalid body", False)
        print(f"   Error: {str(e)}")
        return False

def main():
    """Run all tests."""
    print("\n" + "█"*60)
    print("█" + " "*58 + "█")
    print("█" + "  AVENTO API INTEGRATION TEST SUITE".center(58) + "█")
    print("█" + " "*58 + "█")
    print("█"*60)
    print(f"\n🚀 Testing against: {BASE_URL}")
    print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Test 1: Create event
    event_id = test_create_event()
    if not event_id:
        print("\n❌ Cannot continue - event creation failed")
        return
    results['create_event'] = event_id is not None
    
    # Test 2: Publish event
    results['publish_event'] = test_publish_event(event_id)
    
    # Test 3: Valid registration
    results['valid_registration'] = test_public_registration_valid(event_id)
    
    # Test 4: Duplicate email blocking
    results['duplicate_blocking'] = test_public_registration_duplicate_email(event_id)
    
    # Test 5: Fill to capacity
    capacity_count = test_public_registration_capacity_fill(event_id)
    results['capacity_fill'] = capacity_count >= 5
    
    # Test 6: Exceed capacity
    results['capacity_exceeded'] = test_public_registration_capacity_exceeded(event_id)
    
    # Test 7: Get by slug
    slug = f"test-event-xxxx"  # Adjust based on actual slug from test 1
    results['get_by_slug'] = test_get_event_by_slug(slug)
    
    # Test 8: Validation
    results['validation'] = test_invalid_request_body()
    
    # Summary
    print("\n" + "█"*60)
    print("█" + "  TEST SUMMARY".center(58) + "█")
    print("█"*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅" if result else "❌"
        print(f"{status} {test_name.replace('_', ' ').title()}")
    
    print(f"\n📊 Results: {passed}/{total} passed")
    
    if passed == total:
        print("\n🎉 All tests passed! System is ready for production.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review the output above.")
    
    print(f"\n⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {str(e)}")
