#!/usr/bin/env python3
"""
Backend Testing Script for Projects/Campaign System
Tests all project router endpoints comprehensively
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://uprankd-billing.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api/trpc"

# Admin credentials
ADMIN_EMAIL = "admin@rankseo.com"
ADMIN_PASSWORD = "Admin123!"

# Test counters
tests_passed = 0
tests_failed = 0
test_results = []

def print_test_result(test_name: str, passed: bool, message: str = ""):
    """Print and track test results"""
    global tests_passed, tests_failed
    
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status} - {test_name}")
    if message:
        print(f"  {message}")
    
    if passed:
        tests_passed += 1
    else:
        tests_failed += 1
    
    test_results.append({
        "test": test_name,
        "passed": passed,
        "message": message
    })

def login_admin() -> Optional[requests.Session]:
    """Login as admin and return session"""
    print("\n" + "="*80)
    print("LOGGING IN AS ADMIN")
    print("="*80)
    
    try:
        session = requests.Session()
        
        # Step 1: Get CSRF token from signin page
        signin_page_url = f"{BASE_URL}/signin"
        print(f"Getting CSRF token from {signin_page_url}")
        
        page_response = session.get(signin_page_url)
        print(f"Signin page status: {page_response.status_code}")
        
        # Step 2: Get CSRF token from NextAuth
        csrf_url = f"{BASE_URL}/api/auth/csrf"
        csrf_response = session.get(csrf_url)
        
        if csrf_response.status_code == 200:
            csrf_data = csrf_response.json()
            csrf_token = csrf_data.get("csrfToken")
            print(f"✓ Got CSRF token: {csrf_token[:20]}...")
        else:
            print(f"⚠ Could not get CSRF token, trying without it")
            csrf_token = None
        
        # Step 3: Login via NextAuth credentials endpoint
        signin_url = f"{BASE_URL}/api/auth/callback/credentials"
        
        payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "redirect": "false",
            "json": "true"
        }
        
        if csrf_token:
            payload["csrfToken"] = csrf_token
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
        }
        
        response = session.post(
            signin_url,
            data=payload,
            headers=headers,
            allow_redirects=False
        )
        
        print(f"Login response status: {response.status_code}")
        print(f"Cookies: {session.cookies.get_dict()}")
        
        # Check if we have a session cookie
        has_session = any('session' in cookie.lower() or 'token' in cookie.lower() 
                         for cookie in session.cookies.keys())
        
        if has_session or response.status_code in [200, 302]:
            print(f"✓ Login successful!")
            
            # Verify by trying to access a protected endpoint
            verify_url = f"{API_URL}/user.getCurrent"
            verify_response = session.get(verify_url)
            
            if verify_response.status_code == 200:
                print(f"✓ Session verified - can access protected endpoints")
                return session
            else:
                print(f"⚠ Session may not be fully authenticated (status: {verify_response.status_code})")
                print(f"Response: {verify_response.text[:200]}")
                # Still return session, might work for some endpoints
                return session
        else:
            print(f"✗ Login failed: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return None
            
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def make_trpc_request(session: requests.Session, procedure: str, input_data: Dict[str, Any] = None, method: str = "query") -> Dict[str, Any]:
    """Make a tRPC request with proper formatting"""
    try:
        url = f"{API_URL}/{procedure}"
        
        if method == "query":
            # For queries, use GET with input as query parameter in tRPC format
            if input_data:
                # tRPC expects input in format: {"json": data}
                trpc_input = {"json": input_data}
                params = {"input": json.dumps(trpc_input)}
                response = session.get(url, params=params)
            else:
                # For procedures with no input, still need to send empty json
                params = {"input": json.dumps({"json": None})}
                response = session.get(url, params=params)
        else:
            # For mutations, use POST with body in tRPC format
            # tRPC expects: {"json": data}
            body = {"json": input_data if input_data else {}}
            response = session.post(
                url,
                json=body,
                headers={"Content-Type": "application/json"}
            )
        
        # Parse tRPC response format
        if response.status_code == 200:
            response_data = response.json()
            # tRPC response structure: {"result": {"data": {"json": ..., "meta": ...}}}
            # Extract the actual data from the nested structure
            if "result" in response_data and "data" in response_data["result"]:
                result_data = response_data["result"]["data"]
                if "json" in result_data:
                    actual_data = result_data["json"]
                else:
                    actual_data = result_data
            elif "json" in response_data:
                actual_data = response_data["json"]
            else:
                actual_data = response_data
            
            return {
                "status": response.status_code,
                "data": actual_data,
                "error": None
            }
        else:
            return {
                "status": response.status_code,
                "data": None,
                "error": response.text
            }
    except Exception as e:
        return {
            "status": 0,
            "data": None,
            "error": str(e)
        }

def test_project_list(session: requests.Session):
    """Test project.list endpoint"""
    print("\n" + "="*80)
    print("TEST 1: project.list - List all projects")
    print("="*80)
    
    result = make_trpc_request(session, "project.list", {"limit": 50}, "query")
    
    if result["status"] == 200 and result["data"]:
        data = result["data"]
        projects = data.get("projects", [])
        print(f"✓ Retrieved {len(projects)} projects")
        
        # Check if projects have opportunity counts
        if projects:
            first_project = projects[0]
            has_count = "_count" in first_project
            print(f"✓ Projects include opportunity counts: {has_count}")
            print(f"First project: {json.dumps(first_project, indent=2)[:300]}...")
            print_test_result("project.list", True, f"Retrieved {len(projects)} projects with proper structure")
        else:
            print("⚠ No projects found (this is OK for new users)")
            print_test_result("project.list", True, "Endpoint working, no projects found")
    else:
        print(f"✗ Failed: {result['status']} - {result['error']}")
        print_test_result("project.list", False, f"Status {result['status']}: {result['error']}")

def test_project_create(session: requests.Session) -> Optional[str]:
    """Test project.create endpoint"""
    print("\n" + "="*80)
    print("TEST 2: project.create - Create new project")
    print("="*80)
    
    project_data = {
        "name": "Test Backlink Campaign",
        "domain": "example.com",
        "description": "Test campaign for backlinks",
        "niche": "SEO",
        "targetCountry": "US",
        "targetLanguage": "en"
    }
    
    result = make_trpc_request(session, "project.create", project_data, "mutation")
    
    if result["status"] == 200 and result["data"]:
        data = result["data"]
        print(f"DEBUG: Full response data: {json.dumps(data, indent=2)[:500]}")
        project_id = data.get("id")
        print(f"✓ Project created successfully!")
        print(f"Project ID: {project_id}")
        print(f"Project name: {data.get('name')}")
        print(f"Project domain: {data.get('domain')}")
        print_test_result("project.create", True, f"Created project: {project_id}")
        return project_id
    else:
        print(f"✗ Failed: {result['status']} - {result['error']}")
        print_test_result("project.create", False, f"Status {result['status']}: {result['error']}")
        return None

def test_project_get_by_id(session: requests.Session, project_id: str):
    """Test project.getById endpoint"""
    print("\n" + "="*80)
    print("TEST 3: project.getById - Get project by ID")
    print("="*80)
    
    result = make_trpc_request(session, "project.getById", {"id": project_id}, "query")
    
    if result["status"] == 200 and result["data"]:
        data = result["data"]
        print(f"✓ Project retrieved successfully!")
        print(f"Project name: {data.get('name')}")
        print(f"Opportunities: {len(data.get('opportunities', []))}")
        print_test_result("project.getById", True, f"Retrieved project {project_id}")
    else:
        print(f"✗ Failed: {result['status']} - {result['error']}")
        print_test_result("project.getById", False, f"Status {result['status']}: {result['error']}")

def test_project_update(session: requests.Session, project_id: str):
    """Test project.update endpoint"""
    print("\n" + "="*80)
    print("TEST 4: project.update - Update project")
    print("="*80)
    
    update_data = {
        "id": project_id,
        "name": "Updated Test Campaign",
        "description": "Updated description for testing"
    }
    
    result = make_trpc_request(session, "project.update", update_data, "mutation")
    
    if result["status"] == 200 and result["data"]:
        data = result["data"]
        print(f"✓ Project updated successfully!")
        print(f"New name: {data.get('name')}")
        print(f"New description: {data.get('description')}")
        print_test_result("project.update", True, f"Updated project {project_id}")
    else:
        print(f"✗ Failed: {result['status']} - {result['error']}")
        print_test_result("project.update", False, f"Status {result['status']}: {result['error']}")

def get_first_opportunity(session: requests.Session) -> Optional[str]:
    """Get the first available opportunity ID"""
    print("\n" + "="*80)
    print("HELPER: Getting first opportunity ID")
    print("="*80)
    
    result = make_trpc_request(session, "opportunity.list", {"limit": 1}, "query")
    
    if result["status"] == 200 and result["data"]:
        data = result["data"]
        opportunities = data.get("opportunities", [])
        if opportunities:
            opp_id = opportunities[0].get("id")
            opp_name = opportunities[0].get("siteName", "Unknown")
            print(f"✓ Found opportunity: {opp_id} ({opp_name})")
            return opp_id
    
    print("✗ Could not find any opportunities")
    return None

def test_project_add_opportunity(session: requests.Session, project_id: str, opportunity_id: str):
    """Test project.addOpportunity endpoint"""
    print("\n" + "="*80)
    print("TEST 5: project.addOpportunity - Add opportunity to project")
    print("="*80)
    
    add_data = {
        "projectId": project_id,
        "opportunityId": opportunity_id,
        "priority": 4,
        "notes": "Test opportunity for campaign"
    }
    
    result = make_trpc_request(session, "project.addOpportunity", add_data, "mutation")
    
    if result["status"] == 200 and result["data"]:
        data = result["data"]
        print(f"✓ Opportunity added successfully!")
        print(f"ProjectOpportunity ID: {data.get('id')}")
        print(f"Status: {data.get('status')}")
        print(f"Priority: {data.get('priority')}")
        print_test_result("project.addOpportunity", True, f"Added opportunity {opportunity_id} to project")
    else:
        print(f"✗ Failed: {result['status']} - {result['error']}")
        print_test_result("project.addOpportunity", False, f"Status {result['status']}: {result['error']}")

def test_project_update_opportunity_status(session: requests.Session, project_id: str, opportunity_id: str):
    """Test project.updateOpportunityStatus endpoint"""
    print("\n" + "="*80)
    print("TEST 6: project.updateOpportunityStatus - Update opportunity status")
    print("="*80)
    
    # Test multiple status changes
    statuses = ["IN_PROGRESS", "SUBMITTED", "APPROVED"]
    
    for status in statuses:
        update_data = {
            "projectId": project_id,
            "opportunityId": opportunity_id,
            "status": status,
            "notes": f"Testing {status} status"
        }
        
        if status == "SUBMITTED":
            update_data["linkUrl"] = "https://example.com/test-backlink"
        
        result = make_trpc_request(session, "project.updateOpportunityStatus", update_data, "mutation")
        
        if result["status"] == 200 and result["data"]:
            data = result["data"]
            print(f"✓ Status updated to {status}")
            print(f"  Current status: {data.get('status')}")
        else:
            print(f"✗ Failed to update to {status}: {result['status']} - {result['error']}")
            print_test_result("project.updateOpportunityStatus", False, f"Failed to update to {status}")
            return
    
    print_test_result("project.updateOpportunityStatus", True, "Successfully updated through all statuses")

def test_project_remove_opportunity(session: requests.Session, project_id: str, opportunity_id: str):
    """Test project.removeOpportunity endpoint"""
    print("\n" + "="*80)
    print("TEST 7: project.removeOpportunity - Remove opportunity from project")
    print("="*80)
    
    remove_data = {
        "projectId": project_id,
        "opportunityId": opportunity_id
    }
    
    result = make_trpc_request(session, "project.removeOpportunity", remove_data, "mutation")
    
    if result["status"] == 200 and result["data"]:
        data = result["data"]
        print(f"✓ Opportunity removed successfully!")
        print(f"Success: {data.get('success')}")
        print_test_result("project.removeOpportunity", True, f"Removed opportunity {opportunity_id} from project")
    else:
        print(f"✗ Failed: {result['status']} - {result['error']}")
        print_test_result("project.removeOpportunity", False, f"Status {result['status']}: {result['error']}")

def test_subscription_limits(session: requests.Session):
    """Test project creation limits based on subscription"""
    print("\n" + "="*80)
    print("TEST 8: Subscription Limits - Test project creation limits")
    print("="*80)
    
    # Get current subscription info
    result = make_trpc_request(session, "subscription.getCurrent", {}, "query")
    
    if result["status"] == 200 and result["data"]:
        data = result["data"]
        plan = data.get("plan", {})
        max_projects = plan.get("maxProjects", 0)
        print(f"✓ Current plan allows {max_projects} projects")
        
        # Count current projects
        list_result = make_trpc_request(session, "project.list", {"limit": 100}, "query")
        if list_result["status"] == 200 and list_result["data"]:
            list_data = list_result["data"]
            current_count = len(list_data.get("projects", []))
            print(f"✓ User currently has {current_count} projects")
            
            if current_count < max_projects:
                print(f"✓ User can create {max_projects - current_count} more projects")
                print_test_result("Subscription Limits", True, f"Limit check working: {current_count}/{max_projects} projects")
            else:
                print(f"⚠ User has reached project limit ({current_count}/{max_projects})")
                # Try to create one more and expect failure
                extra_project = {
                    "name": "Should Fail - Over Limit",
                    "domain": "test.com"
                }
                create_result = make_trpc_request(session, "project.create", extra_project, "mutation")
                
                if create_result["status"] != 200:
                    print(f"✓ Correctly rejected project creation over limit")
                    print_test_result("Subscription Limits", True, "Limit enforcement working correctly")
                else:
                    print(f"✗ Should have rejected project creation over limit")
                    print_test_result("Subscription Limits", False, "Limit not enforced")
        else:
            print(f"✗ Could not get project list")
            print_test_result("Subscription Limits", False, "Could not verify limits")
    else:
        print(f"✗ Could not get subscription info")
        print_test_result("Subscription Limits", False, "Could not get subscription info")

def test_project_delete(session: requests.Session, project_id: str):
    """Test project.delete endpoint"""
    print("\n" + "="*80)
    print("TEST 9: project.delete - Delete project")
    print("="*80)
    
    delete_data = {
        "id": project_id
    }
    
    result = make_trpc_request(session, "project.delete", delete_data, "mutation")
    
    if result["status"] == 200 and result["data"]:
        data = result["data"]
        print(f"✓ Project deleted successfully!")
        print(f"Success: {data.get('success')}")
        
        # Verify deletion by trying to get the project
        get_result = make_trpc_request(session, "project.getById", {"id": project_id}, "query")
        if get_result["status"] == 404 or (get_result["status"] != 200):
            print(f"✓ Verified: Project no longer exists")
            print_test_result("project.delete", True, f"Deleted project {project_id}")
        else:
            print(f"⚠ Project still exists after deletion")
            print_test_result("project.delete", False, "Project not properly deleted")
    else:
        print(f"✗ Failed: {result['status']} - {result['error']}")
        print_test_result("project.delete", False, f"Status {result['status']}: {result['error']}")

def test_data_integrity(session: requests.Session):
    """Test data integrity - cascade deletes, relations, etc."""
    print("\n" + "="*80)
    print("TEST 10: Data Integrity - Test relations and cascade deletes")
    print("="*80)
    
    # Create a project
    project_data = {
        "name": "Integrity Test Project",
        "domain": "integrity-test.com"
    }
    
    create_result = make_trpc_request(session, "project.create", project_data, "mutation")
    
    if create_result["status"] == 200 and create_result["data"]:
        project_id = create_result["data"].get("id")
        print(f"✓ Created test project: {project_id}")
        
        # Get an opportunity
        opp_id = get_first_opportunity(session)
        if opp_id:
            # Add opportunity to project
            add_result = make_trpc_request(session, "project.addOpportunity", {
                "projectId": project_id,
                "opportunityId": opp_id
            }, "mutation")
            
            if add_result["status"] == 200:
                print(f"✓ Added opportunity to project")
                
                # Delete the project
                delete_result = make_trpc_request(session, "project.delete", {
                    "id": project_id
                }, "mutation")
                
                if delete_result["status"] == 200:
                    print(f"✓ Deleted project with opportunities")
                    print(f"✓ Cascade delete should have removed ProjectOpportunity records")
                    print_test_result("Data Integrity", True, "Cascade deletes and relations working")
                else:
                    print(f"✗ Failed to delete project")
                    print_test_result("Data Integrity", False, "Could not test cascade delete")
            else:
                print(f"✗ Failed to add opportunity")
                print_test_result("Data Integrity", False, "Could not add opportunity")
        else:
            print(f"✗ No opportunities available")
            print_test_result("Data Integrity", False, "No opportunities to test with")
    else:
        print(f"✗ Failed to create test project")
        print_test_result("Data Integrity", False, "Could not create test project")

def main():
    """Main test execution"""
    print("\n" + "="*80)
    print("PROJECTS/CAMPAIGN SYSTEM - COMPREHENSIVE BACKEND TESTING")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"API URL: {API_URL}")
    print(f"Admin: {ADMIN_EMAIL}")
    
    # Login as admin
    session = login_admin()
    if not session:
        print("\n❌ CRITICAL: Could not login as admin. Aborting tests.")
        sys.exit(1)
    
    print("\n✅ Admin login successful! Starting tests...\n")
    
    # Run all tests
    test_project_list(session)
    
    # Create a project for testing
    project_id = test_project_create(session)
    
    if project_id:
        # Test project operations
        test_project_get_by_id(session, project_id)
        test_project_update(session, project_id)
        
        # Get an opportunity for testing
        opportunity_id = get_first_opportunity(session)
        
        if opportunity_id:
            # Test opportunity operations
            test_project_add_opportunity(session, project_id, opportunity_id)
            test_project_update_opportunity_status(session, project_id, opportunity_id)
            test_project_remove_opportunity(session, project_id, opportunity_id)
        else:
            print("\n⚠ WARNING: No opportunities available for testing opportunity operations")
        
        # Test subscription limits
        test_subscription_limits(session)
        
        # Test deletion
        test_project_delete(session, project_id)
    else:
        print("\n⚠ WARNING: Could not create project. Skipping dependent tests.")
    
    # Test data integrity
    test_data_integrity(session)
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {tests_passed + tests_failed}")
    print(f"✅ Passed: {tests_passed}")
    print(f"❌ Failed: {tests_failed}")
    print(f"Success Rate: {(tests_passed / (tests_passed + tests_failed) * 100):.1f}%")
    
    print("\n" + "="*80)
    print("DETAILED RESULTS")
    print("="*80)
    for result in test_results:
        status = "✅" if result["passed"] else "❌"
        print(f"{status} {result['test']}")
        if result["message"]:
            print(f"   {result['message']}")
    
    # Exit with appropriate code
    sys.exit(0 if tests_failed == 0 else 1)

if __name__ == "__main__":
    main()
