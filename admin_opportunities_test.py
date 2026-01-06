#!/usr/bin/env python3
"""
Admin Opportunities List API Test
Tests that admin users get unlimited access to all opportunities (not limited to 50).
"""

import requests
import json
import sys
from typing import Dict, List, Any, Optional

# Configuration
BASE_URL = "https://backlink-buddy-1.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

class AdminOpportunitiesTester:
    def __init__(self):
        self.session = requests.Session()
        
    def login(self, email: str = "admin@rankseo.com", password: str = "Admin123!") -> bool:
        """Login as admin user"""
        try:
            print(f"🔐 Logging in as admin user: {email}...")
            
            # First, get CSRF token
            csrf_response = self.session.get(f"{BASE_URL}/api/auth/csrf")
            if csrf_response.status_code != 200:
                print(f"❌ Failed to get CSRF token: {csrf_response.status_code}")
                return False
                
            csrf_data = csrf_response.json()
            csrf_token = csrf_data.get('csrfToken')
            
            # Login request
            login_data = {
                'email': email,
                'password': password,
                'csrfToken': csrf_token,
                'callbackUrl': f"{BASE_URL}/dashboard",
                'json': 'true'
            }
            
            login_response = self.session.post(
                f"{BASE_URL}/api/auth/callback/credentials",
                data=login_data,
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                allow_redirects=False
            )
            
            print(f"Login response status: {login_response.status_code}")
            
            # Check for successful login
            if login_response.status_code == 200:
                try:
                    result = login_response.json()
                    if result.get('url'):
                        print("✅ Admin login successful")
                        return True
                    else:
                        print(f"❌ Login failed: {result}")
                        return False
                except:
                    # Check cookies for session
                    cookies = self.session.cookies.get_dict()
                    if any('session' in key.lower() or 'auth' in key.lower() for key in cookies.keys()):
                        print("✅ Admin login successful (cookies set)")
                        return True
                    else:
                        print(f"❌ Login failed - no session cookies")
                        return False
            elif login_response.status_code in [302, 307]:
                print("✅ Admin login successful (redirect)")
                return True
            else:
                print(f"❌ Login request failed: {login_response.status_code}")
                print(f"Response: {login_response.text[:200]}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def test_opportunities_list_unlimited_access(self) -> Dict[str, Any]:
        """Test that admin users get unlimited access to all opportunities"""
        try:
            print("\n🔍 Testing opportunity.list tRPC endpoint for admin unlimited access...")
            
            # Test with limit=100 to verify we get all opportunities
            trpc_input = {
                "0": {
                    "json": {
                        "limit": 100  # Request 100 opportunities
                    }
                }
            }
            
            # Make tRPC request
            response = self.session.get(
                f"{API_URL}/trpc/opportunity.list",
                params={
                    'batch': '1',
                    'input': json.dumps(trpc_input)
                },
                headers={
                    'Content-Type': 'application/json'
                }
            )
            
            print(f"API Response Status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"❌ API request failed: {response.status_code}")
                print(f"Response: {response.text}")
                return {
                    'success': False,
                    'error': f'API request failed with status {response.status_code}',
                    'response_text': response.text[:500]
                }
            
            # Parse response
            try:
                data = response.json()
                print(f"Response data type: {type(data)}")
                print(f"Raw response data: {json.dumps(data, indent=2)[:1000]}...")
                
                if isinstance(data, list) and len(data) > 0:
                    print(f"First item in response: {json.dumps(data[0], indent=2)[:500]}...")
                    
                    # Check if there's an error in the response
                    if 'error' in data[0]:
                        error_info = data[0]['error']
                        print(f"❌ tRPC Error: {error_info}")
                        return {
                            'success': False,
                            'error': f'tRPC Error: {error_info}',
                            'response_data': data
                        }
                    
                    # Handle nested JSON structure in tRPC response
                    result_data = data[0].get('result', {}).get('data', {})
                    if 'json' in result_data:
                        result = result_data['json']
                    else:
                        result = result_data
                    
                    opportunities = result.get('opportunities', [])
                    plan_limit = result.get('planLimit')
                    has_more = result.get('hasMore', False)
                    next_cursor = result.get('nextCursor')
                    
                    print(f"📊 API Response Analysis:")
                    print(f"   Opportunities returned: {len(opportunities)}")
                    print(f"   Plan limit: {plan_limit}")
                    print(f"   Has more: {has_more}")
                    print(f"   Next cursor: {next_cursor}")
                    
                    # Verify admin unlimited access
                    test_results = {
                        'success': True,
                        'opportunities_count': len(opportunities),
                        'plan_limit': plan_limit,
                        'has_more': has_more,
                        'next_cursor': next_cursor,
                        'tests': {}
                    }
                    
                    # Test 1: Check if we got all 64 opportunities (or close to it)
                    if len(opportunities) >= 60:  # Allow some flexibility
                        test_results['tests']['all_opportunities_returned'] = {
                            'passed': True,
                            'message': f"✅ Got {len(opportunities)} opportunities (expected ~64)"
                        }
                    else:
                        test_results['tests']['all_opportunities_returned'] = {
                            'passed': False,
                            'message': f"❌ Only got {len(opportunities)} opportunities (expected ~64)"
                        }
                    
                    # Test 2: Check planLimit is 999999 for unlimited access
                    if plan_limit == 999999:
                        test_results['tests']['unlimited_plan_limit'] = {
                            'passed': True,
                            'message': f"✅ Plan limit is {plan_limit} (unlimited access confirmed)"
                        }
                    else:
                        test_results['tests']['unlimited_plan_limit'] = {
                            'passed': False,
                            'message': f"❌ Plan limit is {plan_limit} (expected 999999 for unlimited)"
                        }
                    
                    # Test 3: Verify opportunities data structure
                    if opportunities and len(opportunities) > 0:
                        sample_opp = opportunities[0]
                        required_fields = ['id', 'siteName', 'domainAuthority', 'url', 'category']
                        missing_fields = [field for field in required_fields if field not in sample_opp]
                        
                        if not missing_fields:
                            test_results['tests']['data_structure'] = {
                                'passed': True,
                                'message': f"✅ Opportunities data structure is correct",
                                'sample_fields': list(sample_opp.keys())[:10]
                            }
                        else:
                            test_results['tests']['data_structure'] = {
                                'passed': False,
                                'message': f"❌ Missing required fields: {missing_fields}",
                                'available_fields': list(sample_opp.keys())
                            }
                    else:
                        test_results['tests']['data_structure'] = {
                            'passed': False,
                            'message': "❌ No opportunities returned to verify structure"
                        }
                    
                    # Test 4: Verify admin is not limited to 50 opportunities
                    if len(opportunities) > 50:
                        test_results['tests']['not_limited_to_50'] = {
                            'passed': True,
                            'message': f"✅ Admin got {len(opportunities)} opportunities (not limited to 50)"
                        }
                    else:
                        test_results['tests']['not_limited_to_50'] = {
                            'passed': False,
                            'message': f"❌ Admin only got {len(opportunities)} opportunities (may be limited)"
                        }
                    
                    return test_results
                    
                else:
                    print(f"❌ Unexpected response format: {data}")
                    return {
                        'success': False,
                        'error': 'Unexpected response format',
                        'response_data': data
                    }
                    
            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse JSON response: {e}")
                return {
                    'success': False,
                    'error': f'JSON parse error: {str(e)}',
                    'response_text': response.text[:500]
                }
                
        except Exception as e:
            print(f"❌ Error testing opportunities list: {str(e)}")
            return {
                'success': False,
                'error': f'Exception: {str(e)}'
            }
    
    def run_admin_opportunities_test(self) -> bool:
        """Run the complete admin opportunities test"""
        print("🚀 Starting Admin Opportunities List API Test")
        print("=" * 60)
        print("Testing Requirements:")
        print("1. Login as admin user (admin@rankseo.com / Admin123!)")
        print("2. Call opportunity.list tRPC endpoint with limit=100")
        print("3. Verify all 64 opportunities are returned (not limited to 50)")
        print("4. Verify planLimit field is 999999 (unlimited access)")
        print("5. Verify opportunities data is correctly structured")
        print("=" * 60)
        
        # Step 1: Login as admin
        if not self.login():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        # Step 2: Test opportunities list API
        test_results = self.test_opportunities_list_unlimited_access()
        
        if not test_results.get('success'):
            print(f"❌ API test failed: {test_results.get('error')}")
            return False
        
        # Step 3: Print detailed results
        print("\n" + "="*60)
        print("📋 DETAILED TEST RESULTS")
        print("="*60)
        
        all_tests_passed = True
        
        for test_name, test_result in test_results.get('tests', {}).items():
            status = "✅ PASS" if test_result['passed'] else "❌ FAIL"
            print(f"{status} {test_name.replace('_', ' ').title()}")
            print(f"     {test_result['message']}")
            
            if not test_result['passed']:
                all_tests_passed = False
        
        # Step 4: Summary
        print("\n" + "="*60)
        print("🏁 ADMIN OPPORTUNITIES TEST SUMMARY")
        print("="*60)
        
        print(f"📊 API Response Summary:")
        print(f"   Opportunities returned: {test_results.get('opportunities_count', 'N/A')}")
        print(f"   Plan limit: {test_results.get('plan_limit', 'N/A')}")
        print(f"   Has more data: {test_results.get('has_more', 'N/A')}")
        
        if all_tests_passed:
            print("\n🎉 ALL TESTS PASSED!")
            print("✅ Admin users have unlimited access to all opportunities")
            print("✅ Backend API is returning correct data for admin users")
            return True
        else:
            print("\n⚠️  SOME TESTS FAILED!")
            print("❌ Admin unlimited access may not be working correctly")
            return False

def main():
    """Main test execution"""
    tester = AdminOpportunitiesTester()
    success = tester.run_admin_opportunities_test()
    
    if success:
        print(f"\n🎯 CONCLUSION: Admin opportunities list API is working correctly")
        sys.exit(0)
    else:
        print(f"\n🚨 CONCLUSION: Admin opportunities list API has issues that need attention")
        sys.exit(1)

if __name__ == "__main__":
    main()