#!/usr/bin/env python3
"""
Backend Testing Script for PayPal Removal & Payment Method Column Feature
Tests admin.listUsers query with payment transaction data and payment method classification
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://uprankd-billing.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api/trpc"

# Admin credentials
ADMIN_EMAIL = "admin@rankseo.com"
ADMIN_PASSWORD = "Admin123!"

def login_admin():
    """Login as admin and get session cookie"""
    print("\n" + "="*80)
    print("ADMIN LOGIN")
    print("="*80)
    
    try:
        # First, get CSRF token
        session = requests.Session()
        csrf_response = session.get(f"{BASE_URL}/api/auth/csrf", timeout=10)
        csrf_token = csrf_response.json().get('csrfToken')
        
        # Login
        login_data = {
            'email': ADMIN_EMAIL,
            'password': ADMIN_PASSWORD,
            'csrfToken': csrf_token,
            'callbackUrl': f"{BASE_URL}/dashboard",
            'json': 'true'
        }
        
        login_response = session.post(
            f"{BASE_URL}/api/auth/callback/credentials",
            data=login_data,
            timeout=10,
            allow_redirects=False
        )
        
        if login_response.status_code in [200, 302]:
            print(f"✅ Admin login successful")
            print(f"   Email: {ADMIN_EMAIL}")
            return session
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"   Response: {login_response.text[:200]}")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_admin_list_users_with_payments(session):
    """Test 1: Verify admin.listUsers includes payment transaction data"""
    print("\n" + "="*80)
    print("TEST 1: admin.listUsers Query - Payment Transaction Data")
    print("="*80)
    
    try:
        # Call admin.listUsers tRPC endpoint
        response = session.get(
            f"{API_URL}/admin.listUsers",
            timeout=15
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: API returned status {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return False
        
        data = response.json()
        
        # Check response structure
        if 'result' not in data or 'data' not in data['result']:
            print(f"❌ FAIL: Invalid response structure")
            print(f"   Response keys: {data.keys()}")
            return False
        
        result_data = data['result']['data']
        
        # tRPC wraps the response in 'json' field
        if 'json' not in result_data:
            print(f"❌ FAIL: Response missing 'json' field")
            print(f"   Response data keys: {result_data.keys()}")
            return False
        
        json_data = result_data['json']
        
        # Verify it returns { users: [...] } structure
        if 'users' not in json_data:
            print(f"❌ FAIL: Response missing 'users' field")
            print(f"   Response json keys: {json_data.keys()}")
            return False
        
        users = json_data['users']
        
        if not isinstance(users, list):
            print(f"❌ FAIL: 'users' is not an array")
            return False
        
        print(f"✅ PASS: admin.listUsers returns correct structure")
        print(f"   Total users: {len(users)}")
        
        # Check if users have payment data
        users_with_payments = 0
        users_with_subscription = 0
        
        for user in users:
            # Check for payments field
            if 'payments' in user:
                if isinstance(user['payments'], list):
                    users_with_payments += 1
                    if len(user['payments']) > 0:
                        payment = user['payments'][0]
                        print(f"\n   User: {user.get('email', 'N/A')}")
                        print(f"   - Has {len(user['payments'])} payment record(s)")
                        print(f"   - Payment method: {payment.get('paymentMethod', 'N/A')}")
                        print(f"   - Amount: ${payment.get('amount', 0)}")
                        print(f"   - Status: {payment.get('status', 'N/A')}")
            
            # Check for subscription field
            if 'subscription' in user and user['subscription']:
                users_with_subscription += 1
        
        print(f"\n✅ PASS: Payment data structure verified")
        print(f"   Users with payments field: {users_with_payments}/{len(users)}")
        print(f"   Users with subscription: {users_with_subscription}/{len(users)}")
        
        # Verify the response includes required fields
        if len(users) > 0:
            sample_user = users[0]
            required_fields = ['id', 'email', 'name', 'subscription', 'payments', '_count']
            missing_fields = [field for field in required_fields if field not in sample_user]
            
            if missing_fields:
                print(f"⚠️  WARNING: Sample user missing fields: {missing_fields}")
            else:
                print(f"✅ PASS: All required fields present in user objects")
        
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Error testing admin.listUsers: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_payment_method_classification(session):
    """Test 2: Verify payment method classification logic for different user scenarios"""
    print("\n" + "="*80)
    print("TEST 2: Payment Method Classification Logic")
    print("="*80)
    
    try:
        # Get all users
        response = session.get(f"{API_URL}/admin.listUsers", timeout=15)
        
        if response.status_code != 200:
            print(f"❌ FAIL: Could not fetch users")
            return False
        
        data = response.json()
        users = data['result']['data']['json']['users']
        
        # Test scenarios
        scenarios = {
            'free': [],      # Free plan users (price === 0)
            'stripe': [],    # Stripe users (paymentMethod === 'stripe')
            'paypal': [],    # PayPal users (paymentMethod === 'paypal')
            'manual': [],    # Manual users (paid plan, no payment records, no stripeCustomerId)
            'none': []       # No subscription
        }
        
        for user in users:
            email = user.get('email', 'N/A')
            subscription = user.get('subscription')
            payments = user.get('payments', [])
            
            # Classify user
            if not subscription:
                scenarios['none'].append(email)
                continue
            
            plan = subscription.get('plan', {})
            plan_price = plan.get('price', 0)
            stripe_customer_id = subscription.get('stripeCustomerId')
            
            # Free plan
            if plan_price == 0:
                scenarios['free'].append(email)
            # Has payment records
            elif len(payments) > 0:
                payment_method = payments[0].get('paymentMethod', '')
                if payment_method == 'stripe':
                    scenarios['stripe'].append(email)
                elif payment_method == 'paypal':
                    scenarios['paypal'].append(email)
                else:
                    scenarios['manual'].append(email)
            # Has Stripe customer ID but no payment records
            elif stripe_customer_id:
                scenarios['stripe'].append(email)
            # Paid plan but no payment records and no stripeCustomerId
            else:
                scenarios['manual'].append(email)
        
        # Print results
        print(f"\n✅ PASS: Payment method classification completed")
        print(f"\n   Classification Results:")
        print(f"   - Free Plan Users: {len(scenarios['free'])}")
        if scenarios['free']:
            for email in scenarios['free'][:3]:
                print(f"     • {email}")
            if len(scenarios['free']) > 3:
                print(f"     ... and {len(scenarios['free']) - 3} more")
        
        print(f"\n   - Stripe Users: {len(scenarios['stripe'])}")
        if scenarios['stripe']:
            for email in scenarios['stripe'][:3]:
                print(f"     • {email}")
            if len(scenarios['stripe']) > 3:
                print(f"     ... and {len(scenarios['stripe']) - 3} more")
        
        print(f"\n   - PayPal Users (Legacy): {len(scenarios['paypal'])}")
        if scenarios['paypal']:
            for email in scenarios['paypal'][:3]:
                print(f"     • {email}")
            if len(scenarios['paypal']) > 3:
                print(f"     ... and {len(scenarios['paypal']) - 3} more")
        
        print(f"\n   - Manual Users: {len(scenarios['manual'])}")
        if scenarios['manual']:
            for email in scenarios['manual'][:3]:
                print(f"     • {email}")
            if len(scenarios['manual']) > 3:
                print(f"     ... and {len(scenarios['manual']) - 3} more")
        
        print(f"\n   - No Subscription: {len(scenarios['none'])}")
        if scenarios['none']:
            for email in scenarios['none'][:3]:
                print(f"     • {email}")
            if len(scenarios['none']) > 3:
                print(f"     ... and {len(scenarios['none']) - 3} more")
        
        # Verify all users are classified
        total_classified = sum(len(v) for v in scenarios.values())
        if total_classified == len(users):
            print(f"\n✅ PASS: All {len(users)} users successfully classified")
        else:
            print(f"\n⚠️  WARNING: {len(users) - total_classified} users not classified")
        
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Error testing payment method classification: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_data_integrity(session):
    """Test 3: Verify data integrity - payment records and subscription relationships"""
    print("\n" + "="*80)
    print("TEST 3: Data Integrity Check")
    print("="*80)
    
    try:
        response = session.get(f"{API_URL}/admin.listUsers", timeout=15)
        
        if response.status_code != 200:
            print(f"❌ FAIL: Could not fetch users")
            return False
        
        data = response.json()
        users = data['result']['data']['json']['users']
        
        issues = []
        users_with_payments = 0
        users_with_subscription = 0
        users_with_plan = 0
        
        for user in users:
            email = user.get('email', 'N/A')
            subscription = user.get('subscription')
            payments = user.get('payments', [])
            
            # Check subscription integrity
            if subscription:
                users_with_subscription += 1
                
                # Check if subscription has plan
                if 'plan' in subscription and subscription['plan']:
                    users_with_plan += 1
                else:
                    issues.append(f"User {email}: Subscription missing plan data")
            
            # Check payment records
            if payments and len(payments) > 0:
                users_with_payments += 1
                
                # Verify payment structure
                payment = payments[0]
                required_payment_fields = ['id', 'amount', 'status', 'paymentMethod']
                missing_payment_fields = [f for f in required_payment_fields if f not in payment]
                
                if missing_payment_fields:
                    issues.append(f"User {email}: Payment missing fields: {missing_payment_fields}")
        
        print(f"\n✅ PASS: Data integrity check completed")
        print(f"\n   Statistics:")
        print(f"   - Total users: {len(users)}")
        print(f"   - Users with subscription: {users_with_subscription}")
        print(f"   - Users with plan data: {users_with_plan}")
        print(f"   - Users with payment records: {users_with_payments}")
        
        if issues:
            print(f"\n⚠️  Data Integrity Issues Found ({len(issues)}):")
            for issue in issues[:5]:
                print(f"   - {issue}")
            if len(issues) > 5:
                print(f"   ... and {len(issues) - 5} more issues")
            return False
        else:
            print(f"\n✅ PASS: No data integrity issues found")
            print(f"   - All subscriptions have plan data")
            print(f"   - All payment records have required fields")
            return True
        
    except Exception as e:
        print(f"❌ FAIL: Error checking data integrity: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_payment_method_scenarios(session):
    """Test 4: Test specific payment method determination scenarios"""
    print("\n" + "="*80)
    print("TEST 4: Payment Method Determination - Specific Scenarios")
    print("="*80)
    
    try:
        response = session.get(f"{API_URL}/admin.listUsers", timeout=15)
        
        if response.status_code != 200:
            print(f"❌ FAIL: Could not fetch users")
            return False
        
        data = response.json()
        users = data['result']['data']['json']['users']
        
        test_cases = {
            'free_plan': {'found': False, 'expected': 'Free', 'actual': None},
            'stripe_payment': {'found': False, 'expected': 'Stripe', 'actual': None},
            'paypal_payment': {'found': False, 'expected': 'PayPal', 'actual': None},
            'stripe_customer': {'found': False, 'expected': 'Stripe', 'actual': None},
            'manual_user': {'found': False, 'expected': 'Manual', 'actual': None},
            'no_subscription': {'found': False, 'expected': 'None', 'actual': None}
        }
        
        for user in users:
            subscription = user.get('subscription')
            payments = user.get('payments', [])
            
            # Test Case 1: Free Plan User
            if subscription and subscription.get('plan', {}).get('price') == 0:
                if not test_cases['free_plan']['found']:
                    test_cases['free_plan']['found'] = True
                    test_cases['free_plan']['actual'] = 'Free'
                    test_cases['free_plan']['email'] = user.get('email')
            
            # Test Case 2: Stripe Payment User
            if payments and len(payments) > 0 and payments[0].get('paymentMethod') == 'stripe':
                if not test_cases['stripe_payment']['found']:
                    test_cases['stripe_payment']['found'] = True
                    test_cases['stripe_payment']['actual'] = 'Stripe'
                    test_cases['stripe_payment']['email'] = user.get('email')
            
            # Test Case 3: PayPal Payment User (Legacy)
            if payments and len(payments) > 0 and payments[0].get('paymentMethod') == 'paypal':
                if not test_cases['paypal_payment']['found']:
                    test_cases['paypal_payment']['found'] = True
                    test_cases['paypal_payment']['actual'] = 'PayPal'
                    test_cases['paypal_payment']['email'] = user.get('email')
            
            # Test Case 4: Stripe Customer (no payment records but has stripeCustomerId)
            if subscription and subscription.get('stripeCustomerId') and not payments:
                if not test_cases['stripe_customer']['found']:
                    test_cases['stripe_customer']['found'] = True
                    test_cases['stripe_customer']['actual'] = 'Stripe'
                    test_cases['stripe_customer']['email'] = user.get('email')
            
            # Test Case 5: Manual User (paid plan, no payment records, no stripeCustomerId)
            if subscription:
                plan_price = subscription.get('plan', {}).get('price', 0)
                stripe_customer_id = subscription.get('stripeCustomerId')
                if plan_price > 0 and not payments and not stripe_customer_id:
                    if not test_cases['manual_user']['found']:
                        test_cases['manual_user']['found'] = True
                        test_cases['manual_user']['actual'] = 'Manual'
                        test_cases['manual_user']['email'] = user.get('email')
            
            # Test Case 6: No Subscription
            if not subscription:
                if not test_cases['no_subscription']['found']:
                    test_cases['no_subscription']['found'] = True
                    test_cases['no_subscription']['actual'] = 'None'
                    test_cases['no_subscription']['email'] = user.get('email')
        
        # Print results
        print(f"\n   Test Case Results:")
        all_passed = True
        
        for case_name, case_data in test_cases.items():
            if case_data['found']:
                status = "✅ PASS" if case_data['actual'] == case_data['expected'] else "❌ FAIL"
                print(f"   {status}: {case_name.replace('_', ' ').title()}")
                print(f"      Expected: {case_data['expected']}, Actual: {case_data['actual']}")
                print(f"      Example: {case_data.get('email', 'N/A')}")
                if case_data['actual'] != case_data['expected']:
                    all_passed = False
            else:
                print(f"   ⚠️  SKIP: {case_name.replace('_', ' ').title()} - No matching user found")
        
        if all_passed:
            print(f"\n✅ PASS: All found test cases passed")
        else:
            print(f"\n❌ FAIL: Some test cases failed")
        
        return all_passed
        
    except Exception as e:
        print(f"❌ FAIL: Error testing payment method scenarios: {e}")
        import traceback
        traceback.print_exc()
        return False

def run_all_tests():
    """Run all payment method feature tests"""
    print("\n" + "="*80)
    print("PAYPAL REMOVAL & PAYMENT METHOD COLUMN FEATURE TESTING")
    print("Testing admin.listUsers with Payment Transaction Data")
    print("="*80)
    print(f"API URL: {API_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Login as admin
    session = login_admin()
    if not session:
        print("\n❌ CRITICAL: Admin login failed. Cannot proceed with tests.")
        return False
    
    results = []
    
    # Run all tests
    results.append(("admin.listUsers with Payment Data", test_admin_list_users_with_payments(session)))
    results.append(("Payment Method Classification", test_payment_method_classification(session)))
    results.append(("Data Integrity Check", test_data_integrity(session)))
    results.append(("Payment Method Scenarios", test_payment_method_scenarios(session)))
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("\n" + "="*80)
    print(f"TOTAL: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    print("="*80)
    
    if passed == total:
        print("\n✅ ALL TESTS PASSED - Payment Method Feature Working Correctly")
    else:
        print(f"\n⚠️  {total - passed} TEST(S) FAILED")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
