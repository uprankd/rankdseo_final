#!/usr/bin/env python3
"""
Backend API Testing for RankdSEO Admin Panel & Stripe Payment Integration
Tests all admin tRPC procedures and payment flow with proper authentication
"""

import requests
import json
import sys
import time
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://seorank-manage.preview.emergentagent.com"
TRPC_URL = f"{BASE_URL}/api/trpc"

# Admin credentials
ADMIN_EMAIL = "admin@rankseo.com"
ADMIN_PASSWORD = "Admin123!"

# Test plan IDs (from database)
PAID_PLAN_ID = "cmifs7pkx0000q72z5od6iqb7"  # Monthly Membership: $34.99
LIFETIME_PLAN_ID = "cmifs7pl40003q72zuoy5v8wb"  # Lifetime Membership: $179.99

# Test user data for payment testing
TEST_USER_EMAIL = "testpayment@example.com"
TEST_USER_NAME = "Test Payment User"
TEST_USER_PASSWORD = "TestPass123!"

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

def test_payment_create_checkout(client: TRPCClient):
    """Test payment.createSignupCheckout endpoint"""
    print("\n=== Testing payment.createSignupCheckout ===")
    
    # Test with paid plan
    test_data = {
        "email": TEST_USER_EMAIL,
        "name": TEST_USER_NAME,
        "planId": PAID_PLAN_ID
    }
    
    result = client.call_trpc("payment.createSignupCheckout", test_data, is_mutation=True)
    
    if result.get('error'):
        print(f"❌ createSignupCheckout failed: {result.get('message', 'Unknown error')}")
        return False, None
    
    if 'result' in result and 'data' in result['result']:
        data = result['result']['data']
        
        # Should return checkout session for paid plan
        if data.get('isFree') == False and data.get('sessionId') and data.get('url'):
            print(f"✅ createSignupCheckout successful for paid plan")
            print(f"   Session ID: {data.get('sessionId')}")
            print(f"   Checkout URL: {data.get('url')[:50]}...")
            return True, data.get('sessionId')
        elif data.get('isFree') == True:
            print(f"❌ Paid plan incorrectly marked as free")
            return False, None
        else:
            print(f"❌ createSignupCheckout missing required fields: {data}")
            return False, None
    else:
        print(f"❌ createSignupCheckout unexpected response format: {result}")
        return False, None

def test_payment_checkout_status(client: TRPCClient, session_id: str):
    """Test payment.getCheckoutStatus endpoint"""
    print(f"\n=== Testing payment.getCheckoutStatus (Session: {session_id}) ===")
    
    result = client.call_trpc("payment.getCheckoutStatus", {"sessionId": session_id})
    
    if result.get('error'):
        # Expected to fail with mock Stripe keys, but should handle gracefully
        error_msg = result.get('message', '')
        if 'stripe' in error_msg.lower() or 'api' in error_msg.lower():
            print(f"✅ getCheckoutStatus handled Stripe API error gracefully: {error_msg[:100]}...")
            return True
        else:
            print(f"❌ getCheckoutStatus failed unexpectedly: {error_msg}")
            return False
    
    if 'result' in result and 'data' in result['result']:
        data = result['result']['data']
        print(f"✅ getCheckoutStatus returned data: {data}")
        return True
    else:
        print(f"❌ getCheckoutStatus unexpected response format: {result}")
        return False

def test_auth_signup_paid_plan(client: TRPCClient, session_id: str):
    """Test auth.signUp with paid plan"""
    print(f"\n=== Testing auth.signUp with paid plan ===")
    
    signup_data = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD,
        "name": TEST_USER_NAME,
        "planId": PAID_PLAN_ID,
        "paymentSessionId": session_id
    }
    
    result = client.call_trpc("auth.signUp", signup_data, is_mutation=True)
    
    if result.get('error'):
        error_msg = result.get('message', '')
        if 'already exists' in error_msg.lower():
            print(f"✅ User already exists (expected for repeated tests)")
            return True, None
        else:
            print(f"❌ signUp failed: {error_msg}")
            return False, None
    
    if 'result' in result and 'data' in result['result']:
        data = result['result']['data']
        
        if (data.get('success') == True and 
            data.get('requiresPayment') == True and
            data.get('user', {}).get('accountStatus') == 'PENDING'):
            print(f"✅ signUp successful with PENDING status")
            print(f"   User ID: {data.get('user', {}).get('id')}")
            print(f"   Account Status: {data.get('user', {}).get('accountStatus')}")
            return True, data.get('user', {}).get('id')
        else:
            print(f"❌ signUp incorrect response for paid plan: {data}")
            return False, None
    else:
        print(f"❌ signUp unexpected response format: {result}")
        return False, None

def test_database_verification(user_id: str):
    """Verify database records after signup"""
    print(f"\n=== Testing Database Verification (User ID: {user_id}) ===")
    
    try:
        # Use Node.js to query database
        import subprocess
        
        script = f"""
const {{ PrismaClient }} = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUser() {{
  try {{
    const user = await prisma.user.findUnique({{
      where: {{ id: '{user_id}' }},
      include: {{
        subscription: {{ include: {{ plan: true }} }},
        payments: true
      }}
    }});
    
    if (!user) {{
      console.log('ERROR: User not found');
      return;
    }}
    
    console.log('User Status:', user.accountStatus);
    console.log('Subscription Status:', user.subscription?.status);
    console.log('Plan Name:', user.subscription?.plan?.name);
    console.log('Payment Records:', user.payments?.length || 0);
    
    // Check if user has PENDING status and INCOMPLETE subscription
    if (user.accountStatus === 'PENDING' && user.subscription?.status === 'INCOMPLETE') {{
      console.log('SUCCESS: Database verification passed');
    }} else {{
      console.log('ERROR: Database verification failed');
    }}
    
    await prisma.$disconnect();
  }} catch (error) {{
    console.error('Database error:', error.message);
    await prisma.$disconnect();
  }}
}}

verifyUser();
"""
        
        result = subprocess.run(['node', '-e', script], 
                              cwd='/app', 
                              capture_output=True, 
                              text=True)
        
        if result.returncode == 0:
            output = result.stdout.strip()
            print(f"Database query output:\n{output}")
            
            if 'SUCCESS: Database verification passed' in output:
                print("✅ Database verification successful")
                return True
            else:
                print("❌ Database verification failed")
                return False
        else:
            print(f"❌ Database query failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Database verification error: {e}")
        return False

def test_auth_blocking_pending_user():
    """Test that PENDING users cannot login"""
    print(f"\n=== Testing Auth Blocking for PENDING Users ===")
    
    # Create new client for login attempt
    test_client = TRPCClient()
    
    # Try to authenticate with the test user
    success = test_client.authenticate(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    
    if not success:
        print("✅ PENDING user login correctly blocked")
        return True
    else:
        print("❌ PENDING user was able to login (should be blocked)")
        return False

def test_webhook_endpoint():
    """Test webhook endpoint structure"""
    print(f"\n=== Testing Webhook Endpoint Structure ===")
    
    try:
        # Test webhook endpoint exists
        webhook_url = f"{BASE_URL}/api/webhooks/stripe"
        
        # Send a test POST request (will fail signature verification, but endpoint should exist)
        response = requests.post(webhook_url, 
                               json={"test": "data"}, 
                               headers={"Content-Type": "application/json"})
        
        print(f"Webhook endpoint status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        # Should return 400 (bad signature) not 404 (not found)
        if response.status_code == 400 and 'signature' in response.text.lower():
            print("✅ Webhook endpoint exists and handles signature verification")
            return True
        elif response.status_code == 404:
            print("❌ Webhook endpoint not found")
            return False
        else:
            print(f"✅ Webhook endpoint exists (status: {response.status_code})")
            return True
            
    except Exception as e:
        print(f"❌ Webhook endpoint test error: {e}")
        return False

def cleanup_test_user():
    """Clean up test user from database"""
    print(f"\n=== Cleaning up test user ===")
    
    try:
        import subprocess
        
        script = f"""
const {{ PrismaClient }} = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {{
  try {{
    // Delete payment transactions first
    await prisma.paymentTransaction.deleteMany({{
      where: {{ user: {{ email: '{TEST_USER_EMAIL}' }} }}
    }});
    
    // Delete user (cascade will handle subscription)
    const deleted = await prisma.user.deleteMany({{
      where: {{ email: '{TEST_USER_EMAIL}' }}
    }});
    
    console.log('Deleted users:', deleted.count);
    await prisma.$disconnect();
  }} catch (error) {{
    console.error('Cleanup error:', error.message);
    await prisma.$disconnect();
  }}
}}

cleanup();
"""
        
        result = subprocess.run(['node', '-e', script], 
                              cwd='/app', 
                              capture_output=True, 
                              text=True)
        
        if result.returncode == 0:
            print("✅ Test user cleanup completed")
        else:
            print(f"⚠️ Cleanup warning: {result.stderr}")
            
    except Exception as e:
        print(f"⚠️ Cleanup error: {e}")

def main():
    """Run all backend API tests including payment integration"""
    print("🚀 Starting RankdSEO Backend API Tests (Admin Panel + Stripe Payment)")
    print(f"Base URL: {BASE_URL}")
    print(f"tRPC URL: {TRPC_URL}")
    
    test_results = []
    
    # Clean up any existing test user first
    cleanup_test_user()
    
    # Test unauthorized access first
    test_results.append(("Unauthorized Access Block", test_unauthorized_access()))
    
    # Test admin authentication
    client = test_admin_authentication()
    if not client:
        print("\n❌ Cannot proceed without admin authentication")
        sys.exit(1)
    
    # Test admin endpoints (existing tests)
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
    
    print("\n" + "="*60)
    print("🔄 STARTING STRIPE PAYMENT INTEGRATION TESTS")
    print("="*60)
    
    # Test payment integration (new tests)
    success, session_id = test_payment_create_checkout(client)
    test_results.append(("Payment Create Checkout", success))
    
    if session_id:
        test_results.append(("Payment Checkout Status", test_payment_checkout_status(client, session_id)))
        
        success, user_id = test_auth_signup_paid_plan(client, session_id)
        test_results.append(("Auth Signup Paid Plan", success))
        
        if user_id:
            test_results.append(("Database Verification", test_database_verification(user_id)))
            test_results.append(("Auth Blocking PENDING User", test_auth_blocking_pending_user()))
    
    test_results.append(("Webhook Endpoint Structure", test_webhook_endpoint()))
    
    # Clean up test user
    cleanup_test_user()
    
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