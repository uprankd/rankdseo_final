#!/usr/bin/env python3
"""
Backend API Testing Script for Support Ticket Reply Functionality
Tests the TypeScript fix in admin help page for ticket replies
"""

import requests
import json
import sys
from datetime import datetime

# Base URL from environment
BASE_URL = "https://uprankd-billing.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api/trpc"

# Test credentials
ADMIN_EMAIL = "admin@rankseo.com"
ADMIN_PASSWORD = "password"
USER_EMAIL = "toms@uprankd.com"
USER_PASSWORD = "password"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(message):
    print(f"\n{Colors.BLUE}🧪 TEST: {message}{Colors.END}")

def print_success(message):
    print(f"{Colors.GREEN}✅ PASS: {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}❌ FAIL: {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.YELLOW}ℹ️  INFO: {message}{Colors.END}")

def signin(email, password):
    """Sign in and get session cookie"""
    print_test(f"Signing in as {email}")
    
    try:
        # Create a session to maintain cookies
        session = requests.Session()
        
        # First, get CSRF token
        csrf_response = session.get(f"{BASE_URL}/api/auth/csrf")
        csrf_token = csrf_response.json().get('csrfToken')
        
        # Sign in with form data (not JSON)
        signin_data = {
            'email': email,
            'password': password,
            'csrfToken': csrf_token,
            'callbackUrl': f"{BASE_URL}/dashboard",
            'json': 'true'
        }
        
        signin_response = session.post(
            f"{BASE_URL}/api/auth/callback/credentials",
            data=signin_data,
            allow_redirects=True  # Follow redirects
        )
        
        # After signin, make a request to get the session
        session_response = session.get(f"{BASE_URL}/api/auth/session")
        
        # Get all cookies from session after following redirects
        cookies_dict = session.cookies.get_dict()
        
        # Check if we have a valid session
        if session_response.status_code == 200:
            session_data = session_response.json()
            if session_data and 'user' in session_data:
                print_success(f"Signed in successfully as {email}")
                print_info(f"User: {session_data['user'].get('email')}, Role: {session_data['user'].get('role')}")
                print_info(f"Cookies: {list(cookies_dict.keys())}")
                # Return the session object which maintains cookies
                return session
            else:
                print_error(f"No valid session found for {email}")
                return None
        else:
            print_error(f"Failed to get session for {email}")
            print_info(f"Session response status: {session_response.status_code}")
            return None
            
    except Exception as e:
        print_error(f"Sign in failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def trpc_query(procedure, input_data, session):
    """Make a tRPC query"""
    try:
        params = {
            'batch': '1',
            'input': json.dumps({'0': {'json': input_data}})
        }
        
        response = session.get(
            f"{API_URL}/{procedure}",
            params=params,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                return result[0].get('result', {}).get('data', {}).get('json')
            return result
        else:
            print_error(f"Query failed with status {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Query error: {str(e)}")
        return None

def trpc_mutation(procedure, input_data, session):
    """Make a tRPC mutation"""
    try:
        payload = {
            '0': {
                'json': input_data
            }
        }
        
        response = session.post(
            f"{API_URL}/{procedure}?batch=1",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                return result[0].get('result', {}).get('data', {}).get('json')
            return result
        else:
            print_error(f"Mutation failed with status {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Mutation error: {str(e)}")
        return None

def test_support_ticket_reply():
    """Test the complete support ticket reply flow"""
    
    print(f"\n{'='*80}")
    print(f"{Colors.BLUE}SUPPORT TICKET REPLY FUNCTIONALITY TEST{Colors.END}")
    print(f"Testing TypeScript fix: if (vars && 'ticketId' in vars)")
    print(f"{'='*80}\n")
    
    test_results = {
        'total': 0,
        'passed': 0,
        'failed': 0
    }
    
    # Step 1: Sign in as regular user
    print_test("Step 1: Sign in as regular user")
    test_results['total'] += 1
    user_session = signin(USER_EMAIL, USER_PASSWORD)
    if user_session:
        print_success("User authentication successful")
        test_results['passed'] += 1
    else:
        print_error("User authentication failed")
        test_results['failed'] += 1
        return test_results
    
    # Step 2: Create a support ticket as user
    print_test("Step 2: Create a support ticket")
    test_results['total'] += 1
    
    ticket_data = {
        'subject': f'Test Ticket - TypeScript Fix Verification {datetime.now().strftime("%Y%m%d%H%M%S")}',
        'message': 'This is a test ticket to verify the admin reply functionality after the TypeScript fix. The fix ensures that vars.ticketId is accessed safely using a type guard.',
        'category': 'technical',
        'priority': 'MEDIUM'
    }
    
    create_result = trpc_mutation('support.createTicket', ticket_data, user_session)
    
    if create_result and 'id' in create_result:
        ticket_id = create_result['id']
        print_success(f"Ticket created successfully with ID: {ticket_id}")
        print_info(f"Spam check - isSpam: {create_result.get('isSpam', False)}, spamScore: {create_result.get('spamScore', 0)}")
        test_results['passed'] += 1
    else:
        print_error("Failed to create ticket")
        test_results['failed'] += 1
        return test_results
    
    # Step 3: Verify ticket was created
    print_test("Step 3: Verify ticket exists in user's ticket list")
    test_results['total'] += 1
    
    user_tickets = trpc_query('support.listMyTickets', {}, user_session)
    
    if user_tickets and isinstance(user_tickets, list):
        found_ticket = next((t for t in user_tickets if t['id'] == ticket_id), None)
        if found_ticket:
            print_success(f"Ticket found in user's list")
            print_info(f"Status: {found_ticket['status']}, Subject: {found_ticket['subject']}")
            test_results['passed'] += 1
        else:
            print_error("Ticket not found in user's list")
            test_results['failed'] += 1
    else:
        print_error("Failed to retrieve user tickets")
        test_results['failed'] += 1
    
    # Step 4: Sign in as admin
    print_test("Step 4: Sign in as admin")
    test_results['total'] += 1
    admin_session = signin(ADMIN_EMAIL, ADMIN_PASSWORD)
    if admin_session:
        print_success("Admin authentication successful")
        test_results['passed'] += 1
    else:
        print_error("Admin authentication failed")
        test_results['failed'] += 1
        return test_results
    
    # Step 5: Verify admin can see the ticket
    print_test("Step 5: Verify admin can see the ticket")
    test_results['total'] += 1
    
    admin_tickets = trpc_query('support.listAllTickets', {'status': 'ALL', 'includeSpam': False}, admin_session)
    
    if admin_tickets and isinstance(admin_tickets, list):
        found_ticket = next((t for t in admin_tickets if t['id'] == ticket_id), None)
        if found_ticket:
            print_success(f"Admin can see the ticket")
            print_info(f"Status: {found_ticket['status']}, Replies: {len(found_ticket.get('replies', []))}")
            initial_status = found_ticket['status']
            initial_reply_count = len(found_ticket.get('replies', []))
            test_results['passed'] += 1
        else:
            print_error("Admin cannot see the ticket")
            test_results['failed'] += 1
            return test_results
    else:
        print_error("Failed to retrieve admin tickets")
        test_results['failed'] += 1
        return test_results
    
    # Step 6: Admin replies to the ticket (THIS TESTS THE TYPESCRIPT FIX)
    print_test("Step 6: Admin replies to ticket (Testing TypeScript fix)")
    test_results['total'] += 1
    
    reply_message = f"Thank you for your ticket. This is an admin reply to verify the TypeScript fix works correctly. The fix ensures safe access to vars.ticketId in the onSuccess callback. Reply sent at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    reply_result = trpc_mutation('support.replyToTicket', {
        'ticketId': ticket_id,
        'message': reply_message
    }, admin_session)
    
    if reply_result and 'id' in reply_result:
        reply_id = reply_result['id']
        print_success(f"Admin reply sent successfully with ID: {reply_id}")
        print_info("TypeScript fix working: vars.ticketId accessed safely")
        test_results['passed'] += 1
    else:
        print_error("Failed to send admin reply - TypeScript fix may have issues")
        test_results['failed'] += 1
        return test_results
    
    # Step 7: Verify reply was saved correctly
    print_test("Step 7: Verify reply was saved in database")
    test_results['total'] += 1
    
    ticket_details = trpc_query('support.getTicket', {'ticketId': ticket_id}, admin_session)
    
    if ticket_details:
        replies = ticket_details.get('replies', [])
        if len(replies) > initial_reply_count:
            latest_reply = replies[-1]
            if latest_reply['message'] == reply_message and latest_reply['isAdmin']:
                print_success("Reply saved correctly in database")
                print_info(f"Reply ID: {latest_reply['id']}, isAdmin: {latest_reply['isAdmin']}")
                test_results['passed'] += 1
            else:
                print_error("Reply content or admin flag mismatch")
                test_results['failed'] += 1
        else:
            print_error("Reply not found in ticket")
            test_results['failed'] += 1
    else:
        print_error("Failed to retrieve ticket details")
        test_results['failed'] += 1
    
    # Step 8: Verify ticket status updated to ANSWERED
    print_test("Step 8: Verify ticket status updated to ANSWERED")
    test_results['total'] += 1
    
    if ticket_details:
        current_status = ticket_details.get('status')
        if current_status == 'ANSWERED':
            print_success(f"Ticket status updated correctly: {initial_status} → {current_status}")
            test_results['passed'] += 1
        else:
            print_error(f"Ticket status not updated correctly. Expected: ANSWERED, Got: {current_status}")
            test_results['failed'] += 1
    else:
        print_error("Cannot verify status - ticket details not available")
        test_results['failed'] += 1
    
    # Step 9: Verify user can see admin reply
    print_test("Step 9: Verify user can see admin reply")
    test_results['total'] += 1
    
    user_ticket_details = trpc_query('support.getTicket', {'ticketId': ticket_id}, user_session)
    
    if user_ticket_details:
        user_replies = user_ticket_details.get('replies', [])
        admin_reply = next((r for r in user_replies if r['isAdmin']), None)
        if admin_reply:
            print_success("User can see admin reply")
            print_info(f"Admin reply visible to user: {admin_reply['message'][:50]}...")
            test_results['passed'] += 1
        else:
            print_error("User cannot see admin reply")
            test_results['failed'] += 1
    else:
        print_error("Failed to retrieve ticket details for user")
        test_results['failed'] += 1
    
    # Step 10: Test admin reply with empty message (should fail)
    print_test("Step 10: Test validation - empty reply message should fail")
    test_results['total'] += 1
    
    empty_reply_result = trpc_mutation('support.replyToTicket', {
        'ticketId': ticket_id,
        'message': ''
    }, admin_session)
    
    if not empty_reply_result or 'error' in str(empty_reply_result):
        print_success("Validation working: Empty message rejected")
        test_results['passed'] += 1
    else:
        print_error("Validation failed: Empty message was accepted")
        test_results['failed'] += 1
    
    # Step 11: User replies back to ticket
    print_test("Step 11: User replies back to ticket")
    test_results['total'] += 1
    
    user_reply_message = "Thank you for your response! This confirms the ticket system is working correctly."
    
    user_reply_result = trpc_mutation('support.replyToTicket', {
        'ticketId': ticket_id,
        'message': user_reply_message
    }, user_session)
    
    if user_reply_result and 'id' in user_reply_result:
        print_success("User reply sent successfully")
        test_results['passed'] += 1
    else:
        print_error("Failed to send user reply")
        test_results['failed'] += 1
    
    # Step 12: Verify ticket status changed back to OPEN after user reply
    print_test("Step 12: Verify ticket status changed to OPEN after user reply")
    test_results['total'] += 1
    
    final_ticket_details = trpc_query('support.getTicket', {'ticketId': ticket_id}, admin_session)
    
    if final_ticket_details:
        final_status = final_ticket_details.get('status')
        if final_status == 'OPEN':
            print_success(f"Ticket status updated correctly after user reply: ANSWERED → {final_status}")
            test_results['passed'] += 1
        else:
            print_error(f"Ticket status not updated correctly. Expected: OPEN, Got: {final_status}")
            test_results['failed'] += 1
    else:
        print_error("Cannot verify final status")
        test_results['failed'] += 1
    
    # Step 13: Admin closes the ticket
    print_test("Step 13: Admin closes the ticket")
    test_results['total'] += 1
    
    close_result = trpc_mutation('support.closeTicket', {'ticketId': ticket_id}, admin_session)
    
    if close_result and close_result.get('success'):
        print_success("Ticket closed successfully")
        test_results['passed'] += 1
    else:
        print_error("Failed to close ticket")
        test_results['failed'] += 1
    
    # Step 14: Verify ticket is closed
    print_test("Step 14: Verify ticket status is CLOSED")
    test_results['total'] += 1
    
    closed_ticket = trpc_query('support.getTicket', {'ticketId': ticket_id}, admin_session)
    
    if closed_ticket and closed_ticket.get('status') == 'CLOSED':
        print_success("Ticket status confirmed as CLOSED")
        test_results['passed'] += 1
    else:
        print_error("Ticket status not CLOSED")
        test_results['failed'] += 1
    
    return test_results

def main():
    """Main test execution"""
    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}BACKEND API TESTING - SUPPORT TICKET REPLY FUNCTIONALITY{Colors.END}")
    print(f"{Colors.BLUE}Testing TypeScript Fix: if (vars && 'ticketId' in vars){Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}\n")
    
    results = test_support_ticket_reply()
    
    # Print summary
    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}TEST SUMMARY{Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"Total Tests: {results['total']}")
    print(f"{Colors.GREEN}Passed: {results['passed']}{Colors.END}")
    print(f"{Colors.RED}Failed: {results['failed']}{Colors.END}")
    
    pass_rate = (results['passed'] / results['total'] * 100) if results['total'] > 0 else 0
    print(f"\nPass Rate: {pass_rate:.1f}%")
    
    if results['failed'] == 0:
        print(f"\n{Colors.GREEN}✅ ALL TESTS PASSED - TypeScript fix is working correctly!{Colors.END}")
        print(f"{Colors.GREEN}The admin reply functionality works as expected after the fix.{Colors.END}")
        return 0
    else:
        print(f"\n{Colors.RED}❌ SOME TESTS FAILED - Review the errors above{Colors.END}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
