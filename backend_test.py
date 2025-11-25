#!/usr/bin/env python3
"""
Backend API Testing for RankdSEO Admin Panel
Tests all admin tRPC procedures with proper authentication
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://rankboost-7.preview.emergentagent.com"
TRPC_URL = f"{BASE_URL}/api/trpc"

# Admin credentials
ADMIN_EMAIL = "admin@rankseo.com"
ADMIN_PASSWORD = "Admin123!"

class TRPCClient:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'RankdSEO-Test-Client/1.0'
        })
        self.auth_token = None
        
    def authenticate(self, email: str, password: str) -> bool:
        """Authenticate with the admin credentials"""
        try:
            # First, try to get CSRF token
            csrf_response = self.session.get(f"{BASE_URL}/api/auth/csrf")
            if csrf_response.status_code == 200:
                csrf_data = csrf_response.json()
                csrf_token = csrf_data.get('csrfToken')
                if csrf_token:
                    self.session.headers.update({'X-CSRF-Token': csrf_token})
            
            # Attempt login via NextAuth
            login_data = {
                'email': email,
                'password': password,
                'csrfToken': csrf_token if 'csrf_token' in locals() else '',
                'callbackUrl': BASE_URL,
                'json': 'true'
            }
            
            login_response = self.session.post(
                f"{BASE_URL}/api/auth/callback/credentials",
                data=login_data,
                allow_redirects=False
            )
            
            print(f"Login attempt status: {login_response.status_code}")
            print(f"Login response headers: {dict(login_response.headers)}")
            
            # Check if we have session cookies
            cookies = self.session.cookies.get_dict()
            print(f"Session cookies: {list(cookies.keys())}")
            
            return len(cookies) > 0
            
        except Exception as e:
            print(f"Authentication error: {e}")
            return False
    
    def call_trpc(self, procedure: str, input_data: Optional[Dict[str, Any]] = None, is_mutation: bool = False) -> Dict[str, Any]:
        """Make a tRPC call"""
        try:
            if is_mutation:
                # For mutations, use POST
                url = f"{TRPC_URL}/{procedure}"
                response = self.session.post(url, json=input_data or {})
            else:
                # For queries, use GET with input as query param
                url = f"{TRPC_URL}/{procedure}"
                params = {}
                if input_data:
                    params['input'] = json.dumps(input_data)
                response = self.session.get(url, params=params)
            
            print(f"tRPC call: {procedure}")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:500]}...")
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    'error': True,
                    'status': response.status_code,
                    'message': response.text
                }
                
        except Exception as e:
            return {
                'error': True,
                'message': str(e)
            }

def test_admin_authentication():
    """Test admin authentication"""
    print("\n=== Testing Admin Authentication ===")
    
    client = TRPCClient()
    success = client.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD)
    
    if success:
        print("✅ Admin authentication successful")
        return client
    else:
        print("❌ Admin authentication failed")
        return None

def test_admin_stats(client: TRPCClient):
    """Test admin.getStats endpoint"""
    print("\n=== Testing admin.getStats ===")
    
    result = client.call_trpc("admin.getStats")
    
    if result.get('error'):
        print(f"❌ getStats failed: {result.get('message', 'Unknown error')}")
        return False
    
    # Check if we have the expected stats
    expected_fields = ['totalOpportunities', 'activeOpportunities', 'totalInstructions', 'totalUsers', 'totalProjects']
    
    if 'result' in result and 'data' in result['result']:
        data = result['result']['data']
        missing_fields = [field for field in expected_fields if field not in data]
        
        if not missing_fields:
            print("✅ getStats returned all expected fields")
            print(f"   Stats: {data}")
            return True
        else:
            print(f"❌ getStats missing fields: {missing_fields}")
            return False
    else:
        print(f"❌ getStats unexpected response format: {result}")
        return False

def test_list_opportunities(client: TRPCClient):
    """Test admin.listOpportunities endpoint"""
    print("\n=== Testing admin.listOpportunities ===")
    
    # Test without filters
    result = client.call_trpc("admin.listOpportunities")
    
    if result.get('error'):
        print(f"❌ listOpportunities failed: {result.get('message', 'Unknown error')}")
        return False, []
    
    if 'result' in result and 'data' in result['result']:
        data = result['result']['data']
        opportunities = data.get('opportunities', [])
        print(f"✅ listOpportunities returned {len(opportunities)} opportunities")
        
        # Test with search filter
        if opportunities:
            search_result = client.call_trpc("admin.listOpportunities", {"search": "test", "limit": 10})
            print(f"✅ Search filter test completed")
        
        return True, opportunities
    else:
        print(f"❌ listOpportunities unexpected response format: {result}")
        return False, []

def test_create_opportunity(client: TRPCClient):
    """Test admin.createOpportunity endpoint"""
    print("\n=== Testing admin.createOpportunity ===")
    
    test_opportunity = {
        "url": "https://example-test-site.com",
        "siteName": "Test Site for Admin Testing",
        "shortDescription": "A test backlink opportunity created by automated testing",
        "category": "Technology",
        "niche": "SEO Tools",
        "linkType": "GUEST_POST",
        "isFree": True,
        "difficultyLevel": 3,
        "domainAuthority": 45,
        "isDofollow": True,
        "status": "ACTIVE"
    }
    
    result = client.call_trpc("admin.createOpportunity", test_opportunity, is_mutation=True)
    
    if result.get('error'):
        print(f"❌ createOpportunity failed: {result.get('message', 'Unknown error')}")
        return False, None
    
    if 'result' in result and 'data' in result['result']:
        created_opportunity = result['result']['data']
        opportunity_id = created_opportunity.get('id')
        
        if opportunity_id:
            print(f"✅ createOpportunity successful, ID: {opportunity_id}")
            return True, opportunity_id
        else:
            print(f"❌ createOpportunity missing ID in response: {created_opportunity}")
            return False, None
    else:
        print(f"❌ createOpportunity unexpected response format: {result}")
        return False, None

def test_get_opportunity(client: TRPCClient, opportunity_id: str):
    """Test admin.getOpportunity endpoint"""
    print(f"\n=== Testing admin.getOpportunity (ID: {opportunity_id}) ===")
    
    result = client.call_trpc("admin.getOpportunity", {"id": opportunity_id})
    
    if result.get('error'):
        print(f"❌ getOpportunity failed: {result.get('message', 'Unknown error')}")
        return False
    
    if 'result' in result and 'data' in result['result']:
        opportunity = result['result']['data']
        
        if opportunity.get('id') == opportunity_id:
            print(f"✅ getOpportunity successful")
            print(f"   Site: {opportunity.get('siteName')}")
            print(f"   Instructions: {len(opportunity.get('instructions', []))}")
            return True
        else:
            print(f"❌ getOpportunity returned wrong opportunity")
            return False
    else:
        print(f"❌ getOpportunity unexpected response format: {result}")
        return False

def test_update_opportunity(client: TRPCClient, opportunity_id: str):
    """Test admin.updateOpportunity endpoint"""
    print(f"\n=== Testing admin.updateOpportunity (ID: {opportunity_id}) ===")
    
    update_data = {
        "id": opportunity_id,
        "siteName": "Updated Test Site Name",
        "status": "NEEDS_REVIEW",
        "difficultyLevel": 4
    }
    
    result = client.call_trpc("admin.updateOpportunity", update_data, is_mutation=True)
    
    if result.get('error'):
        print(f"❌ updateOpportunity failed: {result.get('message', 'Unknown error')}")
        return False
    
    if 'result' in result and 'data' in result['result']:
        updated_opportunity = result['result']['data']
        
        if (updated_opportunity.get('siteName') == "Updated Test Site Name" and 
            updated_opportunity.get('status') == "NEEDS_REVIEW"):
            print(f"✅ updateOpportunity successful")
            return True
        else:
            print(f"❌ updateOpportunity data not updated correctly")
            return False
    else:
        print(f"❌ updateOpportunity unexpected response format: {result}")
        return False

def test_create_instruction(client: TRPCClient, opportunity_id: str):
    """Test admin.createInstruction endpoint"""
    print(f"\n=== Testing admin.createInstruction (Opportunity ID: {opportunity_id}) ===")
    
    instruction_data = {
        "opportunityId": opportunity_id,
        "stepOrder": 1,
        "stepTitle": "Test Instruction Step",
        "stepDescription": "This is a test instruction created by automated testing",
        "estimatedMinutes": 5
    }
    
    result = client.call_trpc("admin.createInstruction", instruction_data, is_mutation=True)
    
    if result.get('error'):
        print(f"❌ createInstruction failed: {result.get('message', 'Unknown error')}")
        return False, None
    
    if 'result' in result and 'data' in result['result']:
        instruction = result['result']['data']
        instruction_id = instruction.get('id')
        
        if instruction_id:
            print(f"✅ createInstruction successful, ID: {instruction_id}")
            return True, instruction_id
        else:
            print(f"❌ createInstruction missing ID in response")
            return False, None
    else:
        print(f"❌ createInstruction unexpected response format: {result}")
        return False, None

def test_update_instruction(client: TRPCClient, instruction_id: str):
    """Test admin.updateInstruction endpoint"""
    print(f"\n=== Testing admin.updateInstruction (ID: {instruction_id}) ===")
    
    update_data = {
        "id": instruction_id,
        "stepTitle": "Updated Test Instruction Step",
        "stepDescription": "This instruction has been updated by automated testing",
        "estimatedMinutes": 10
    }
    
    result = client.call_trpc("admin.updateInstruction", update_data, is_mutation=True)
    
    if result.get('error'):
        print(f"❌ updateInstruction failed: {result.get('message', 'Unknown error')}")
        return False
    
    if 'result' in result and 'data' in result['result']:
        instruction = result['result']['data']
        
        if instruction.get('stepTitle') == "Updated Test Instruction Step":
            print(f"✅ updateInstruction successful")
            return True
        else:
            print(f"❌ updateInstruction data not updated correctly")
            return False
    else:
        print(f"❌ updateInstruction unexpected response format: {result}")
        return False

def test_delete_instruction(client: TRPCClient, instruction_id: str):
    """Test admin.deleteInstruction endpoint"""
    print(f"\n=== Testing admin.deleteInstruction (ID: {instruction_id}) ===")
    
    result = client.call_trpc("admin.deleteInstruction", {"id": instruction_id}, is_mutation=True)
    
    if result.get('error'):
        print(f"❌ deleteInstruction failed: {result.get('message', 'Unknown error')}")
        return False
    
    if 'result' in result and 'data' in result['result']:
        response = result['result']['data']
        
        if response.get('success'):
            print(f"✅ deleteInstruction successful")
            return True
        else:
            print(f"❌ deleteInstruction did not return success")
            return False
    else:
        print(f"❌ deleteInstruction unexpected response format: {result}")
        return False

def test_delete_opportunity(client: TRPCClient, opportunity_id: str):
    """Test admin.deleteOpportunity endpoint"""
    print(f"\n=== Testing admin.deleteOpportunity (ID: {opportunity_id}) ===")
    
    result = client.call_trpc("admin.deleteOpportunity", {"id": opportunity_id}, is_mutation=True)
    
    if result.get('error'):
        print(f"❌ deleteOpportunity failed: {result.get('message', 'Unknown error')}")
        return False
    
    if 'result' in result and 'data' in result['result']:
        response = result['result']['data']
        
        if response.get('success'):
            print(f"✅ deleteOpportunity successful")
            return True
        else:
            print(f"❌ deleteOpportunity did not return success")
            return False
    else:
        print(f"❌ deleteOpportunity unexpected response format: {result}")
        return False

def test_unauthorized_access():
    """Test that non-admin users cannot access admin endpoints"""
    print("\n=== Testing Unauthorized Access ===")
    
    # Create client without authentication
    client = TRPCClient()
    
    result = client.call_trpc("admin.getStats")
    
    if result.get('error') and result.get('status') in [401, 403]:
        print("✅ Unauthorized access properly blocked")
        return True
    else:
        print(f"❌ Unauthorized access not properly blocked: {result}")
        return False

def main():
    """Run all admin API tests"""
    print("🚀 Starting RankdSEO Admin Panel Backend API Tests")
    print(f"Base URL: {BASE_URL}")
    print(f"tRPC URL: {TRPC_URL}")
    
    test_results = []
    
    # Test unauthorized access first
    test_results.append(("Unauthorized Access Block", test_unauthorized_access()))
    
    # Test admin authentication
    client = test_admin_authentication()
    if not client:
        print("\n❌ Cannot proceed without admin authentication")
        sys.exit(1)
    
    # Test admin endpoints
    test_results.append(("Admin Stats", test_admin_stats(client)))
    
    success, opportunities = test_list_opportunities(client)
    test_results.append(("List Opportunities", success))
    
    # Create test opportunity
    success, opportunity_id = test_create_opportunity(client)
    test_results.append(("Create Opportunity", success))
    
    if opportunity_id:
        # Test operations on the created opportunity
        test_results.append(("Get Opportunity", test_get_opportunity(client, opportunity_id)))
        test_results.append(("Update Opportunity", test_update_opportunity(client, opportunity_id)))
        
        # Test instruction operations
        success, instruction_id = test_create_instruction(client, opportunity_id)
        test_results.append(("Create Instruction", success))
        
        if instruction_id:
            test_results.append(("Update Instruction", test_update_instruction(client, instruction_id)))
            test_results.append(("Delete Instruction", test_delete_instruction(client, instruction_id)))
        
        # Clean up - delete test opportunity
        test_results.append(("Delete Opportunity", test_delete_opportunity(client, opportunity_id)))
    
    # Print summary
    print("\n" + "="*60)
    print("🏁 TEST SUMMARY")
    print("="*60)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {len(test_results)} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {failed} test(s) failed")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)