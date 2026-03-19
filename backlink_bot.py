"""
Backlink Creator Bot - Automated Profile Creation
Target URL: https://arxio.pro
Bio: The ultimate platform for CS2 highlights. Upload your best aces, clutches, and frags.
"""

import asyncio
import json
import random
import string
import os
import time
import psycopg2
from datetime import datetime
from playwright.async_api import async_playwright, TimeoutError as PWTimeout

TARGET_URL = "https://arxio.pro"
BIO = "The ultimate platform for CS2 highlights. Upload your best aces, clutches, and frags."
RESULTS_FILE = "/app/backlink_bot_results.json"
LOG_FILE = "/app/backlink_bot.log"

# Random name generators
FIRST_NAMES = ["Alex", "Jordan", "Morgan", "Taylor", "Casey", "Riley", "Quinn", "Avery", "Cameron", "Dakota", "Drew", "Emery", "Finley", "Harper", "Kai", "Logan", "Parker", "Reese", "Sage", "Skyler"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Martinez", "Anderson", "Wilson", "Moore", "Taylor", "Thomas", "Jackson", "White", "Harris", "Martin", "Lee", "Clark"]

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def rand_name():
    return random.choice(FIRST_NAMES) + " " + random.choice(LAST_NAMES)

def rand_username():
    return random.choice(FIRST_NAMES).lower() + random.choice(LAST_NAMES).lower() + str(random.randint(100, 9999))

def rand_email():
    return rand_username() + "@protonmail.com"

def rand_password():
    return "Ax!" + ''.join(random.choices(string.ascii_letters + string.digits, k=12))

def get_opportunities():
    """Fetch all free profile opportunities from DB, ordered by DA desc."""
    conn = psycopg2.connect(
        dbname="rankseo", user="rankseo", password="dev_password", host="localhost"
    )
    cur = conn.cursor()
    cur.execute("""
        SELECT bo.id, bo."siteName", bo.url, bo."domainAuthority",
               ARRAY_AGG(oi."stepDescription" ORDER BY oi."stepOrder") as steps
        FROM "BacklinkOpportunity" bo
        JOIN "OpportunityInstruction" oi ON oi."opportunityId" = bo.id
        WHERE bo."isFree" = true AND bo."linkType" = 'PROFILE'
        GROUP BY bo.id
        ORDER BY bo."domainAuthority" DESC
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    opportunities = []
    for row in rows:
        opportunities.append({
            "id": row[0],
            "siteName": row[1],
            "url": row[2],
            "da": row[3],
            "steps": row[4],
        })
    return opportunities


async def attempt_site(page, opp, results):
    """Try to visit a site and create a profile with backlink."""
    site_name = opp["siteName"]
    url = opp["url"]
    da = opp["da"]
    
    result = {
        "siteName": site_name,
        "url": url,
        "da": da,
        "status": "FAILED",
        "reason": "",
        "profileUrl": None,
        "backlinkPlaced": False,
    }
    
    try:
        # Step 1: Navigate to the site
        log(f"  Visiting {site_name} ({url})...")
        resp = await page.goto(url, timeout=15000, wait_until="domcontentloaded")
        
        if resp is None or resp.status >= 400:
            result["reason"] = f"HTTP {resp.status if resp else 'no response'}"
            results.append(result)
            return result
        
        await page.wait_for_timeout(2000)
        
        # Step 2: Look for signup/register links
        signup_found = False
        signup_selectors = [
            'a:has-text("Sign Up")', 'a:has-text("Register")', 'a:has-text("Create Account")',
            'a:has-text("Join")', 'a:has-text("Get Started")', 'a:has-text("Sign up")',
            'a:has-text("Create your")', 'a:has-text("Create One")',
            'button:has-text("Sign Up")', 'button:has-text("Register")',
            'button:has-text("Join")', 'button:has-text("Get Started")',
            '[href*="signup"]', '[href*="register"]', '[href*="join"]',
            '[href*="sign-up"]', '[href*="sign_up"]', '[href*="create-account"]',
        ]
        
        for sel in signup_selectors:
            try:
                el = page.locator(sel).first
                if await el.is_visible(timeout=1000):
                    await el.click(force=True, timeout=5000)
                    signup_found = True
                    log(f"    Found signup link: {sel}")
                    await page.wait_for_timeout(3000)
                    break
            except:
                continue
        
        # Step 3: Check for captcha - if found, skip
        page_content = await page.content()
        captcha_indicators = [
            'g-recaptcha', 'h-captcha', 'recaptcha', 'captcha',
            'cf-turnstile', 'hcaptcha', 'data-sitekey',
        ]
        has_captcha = any(ind in page_content.lower() for ind in captcha_indicators)
        
        if has_captcha:
            result["reason"] = "CAPTCHA detected"
            result["status"] = "SKIPPED_CAPTCHA"
            results.append(result)
            return result
        
        # Step 4: Try to find and fill registration form
        name = rand_name()
        username = rand_username()
        email = rand_email()
        password = rand_password()
        
        # Try common form field patterns
        form_fields = {
            "name": ['input[name="name"]', 'input[name="full_name"]', 'input[name="fullname"]',
                      'input[name="display_name"]', 'input[name="displayname"]',
                      'input[placeholder*="name" i]', 'input[placeholder*="Name"]',
                      '#name', '#fullName', '#displayName'],
            "username": ['input[name="username"]', 'input[name="user"]', 'input[name="login"]',
                         'input[name="nickname"]', 'input[placeholder*="username" i]',
                         '#username', '#user', '#login_field'],
            "email": ['input[name="email"]', 'input[type="email"]', 'input[name="user_email"]',
                      'input[placeholder*="email" i]', '#email', '#user_email',
                      'input[name="emailAddress"]'],
            "password": ['input[name="password"]', 'input[type="password"]',
                         'input[name="user_password"]', '#password', '#pass'],
            "website": ['input[name="url"]', 'input[name="website"]', 'input[name="site"]',
                        'input[name="homepage"]', 'input[placeholder*="website" i]',
                        'input[placeholder*="url" i]', 'input[placeholder*="URL"]',
                        'input[type="url"]', '#url', '#website', '#homepage'],
            "bio": ['textarea[name="bio"]', 'textarea[name="about"]', 'textarea[name="description"]',
                    'textarea[placeholder*="bio" i]', 'textarea[placeholder*="about" i]',
                    '#bio', '#about', '#description', 'textarea:first-of-type'],
        }
        
        filled = {}
        for field_type, selectors in form_fields.items():
            for sel in selectors:
                try:
                    el = page.locator(sel).first
                    if await el.is_visible(timeout=500):
                        if field_type == "name":
                            await el.fill(name)
                        elif field_type == "username":
                            await el.fill(username)
                        elif field_type == "email":
                            await el.fill(email)
                        elif field_type == "password":
                            await el.fill(password)
                        elif field_type == "website":
                            await el.fill(TARGET_URL)
                            result["backlinkPlaced"] = True
                        elif field_type == "bio":
                            await el.fill(f"{BIO} {TARGET_URL}")
                            result["backlinkPlaced"] = True
                        filled[field_type] = True
                        break
                except:
                    continue
        
        # Also fill confirm password if present
        try:
            for sel in ['input[name="password_confirmation"]', 'input[name="confirm_password"]',
                        'input[name="confirmPassword"]', 'input[name="password2"]',
                        '#password_confirmation', '#confirm_password']:
                el = page.locator(sel).first
                if await el.is_visible(timeout=500):
                    await el.fill(password)
                    break
        except:
            pass
        
        if not filled:
            result["reason"] = "No fillable form fields found"
            results.append(result)
            return result
        
        log(f"    Filled fields: {list(filled.keys())}")
        
        # Step 5: Try to submit the form
        submit_selectors = [
            'button[type="submit"]', 'input[type="submit"]',
            'button:has-text("Sign Up")', 'button:has-text("Register")',
            'button:has-text("Create")', 'button:has-text("Join")',
            'button:has-text("Submit")', 'button:has-text("Next")',
            'button:has-text("Continue")', 'button:has-text("Get Started")',
        ]
        
        submitted = False
        for sel in submit_selectors:
            try:
                el = page.locator(sel).first
                if await el.is_visible(timeout=1000):
                    await el.click(force=True, timeout=5000)
                    submitted = True
                    log(f"    Submitted form via: {sel}")
                    await page.wait_for_timeout(4000)
                    break
            except:
                continue
        
        if not submitted:
            result["reason"] = f"Could not find submit button. Filled: {list(filled.keys())}"
            result["status"] = "PARTIAL"
            results.append(result)
            return result
        
        # Step 6: Check post-submission for errors or captcha
        post_content = await page.content()
        if any(ind in post_content.lower() for ind in captcha_indicators):
            result["reason"] = "CAPTCHA appeared after submit"
            result["status"] = "SKIPPED_CAPTCHA"
            results.append(result)
            return result
        
        # Check for email verification requirement
        email_verify_indicators = ["verify your email", "check your email", "confirmation email",
                                    "verify your account", "email verification", "we sent you"]
        if any(ind in post_content.lower() for ind in email_verify_indicators):
            result["reason"] = "Email verification required"
            result["status"] = "NEEDS_EMAIL_VERIFICATION"
            results.append(result)
            return result
        
        # Check for error messages
        error_indicators = ["already exists", "already taken", "invalid email",
                           "error", "failed", "try again"]
        page_text = await page.inner_text("body")
        
        # If we got this far with a website/bio field filled, it might have worked
        if filled.get("website") or filled.get("bio"):
            result["status"] = "LIKELY_SUCCESS"
            result["reason"] = f"Form submitted. Fields: {list(filled.keys())}"
            result["profileUrl"] = page.url
        elif filled.get("email") and submitted:
            result["status"] = "SUBMITTED"
            result["reason"] = f"Form submitted but no URL field. Fields: {list(filled.keys())}"
        else:
            result["status"] = "UNCERTAIN"
            result["reason"] = f"Submitted. Fields: {list(filled.keys())}"
        
        results.append(result)
        return result
        
    except PWTimeout:
        result["reason"] = "Timeout"
        results.append(result)
        return result
    except Exception as e:
        result["reason"] = str(e)[:200]
        results.append(result)
        return result


async def run_bot():
    log("=" * 60)
    log("BACKLINK CREATOR BOT - Starting")
    log(f"Target URL: {TARGET_URL}")
    log(f"Bio: {BIO}")
    log("=" * 60)
    
    opportunities = get_opportunities()
    log(f"Found {len(opportunities)} opportunities to process")
    
    results = []
    stats = {"total": 0, "success": 0, "captcha": 0, "email_verify": 0, "failed": 0, "partial": 0, "timeout": 0}
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
        )
        
        # Process in batches of 3 concurrent tabs
        batch_size = 3
        
        for i in range(0, len(opportunities), batch_size):
            batch = opportunities[i:i+batch_size]
            tasks = []
            
            for opp in batch:
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    viewport={"width": 1280, "height": 800},
                )
                page = await context.new_page()
                tasks.append(attempt_site(page, opp, results))
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Close all pages/contexts
            for ctx in browser.contexts:
                try:
                    await ctx.close()
                except:
                    pass
            
            # Update stats
            for r in results[stats["total"]:]:
                if isinstance(r, dict):
                    st = r.get("status", "FAILED")
                    if st in ("LIKELY_SUCCESS",):
                        stats["success"] += 1
                    elif st == "SKIPPED_CAPTCHA":
                        stats["captcha"] += 1
                    elif st == "NEEDS_EMAIL_VERIFICATION":
                        stats["email_verify"] += 1
                    elif st == "PARTIAL" or st == "SUBMITTED":
                        stats["partial"] += 1
                    elif "Timeout" in r.get("reason", ""):
                        stats["timeout"] += 1
                    else:
                        stats["failed"] += 1
            
            stats["total"] = len(results)
            
            # Save progress periodically
            if stats["total"] % 15 == 0 or stats["total"] >= len(opportunities):
                save_results(results, stats)
                log(f"\n--- Progress: {stats['total']}/{len(opportunities)} ---")
                log(f"    Success: {stats['success']} | Captcha: {stats['captcha']} | Email Verify: {stats['email_verify']}")
                log(f"    Partial: {stats['partial']} | Timeout: {stats['timeout']} | Failed: {stats['failed']}\n")
        
        await browser.close()
    
    save_results(results, stats)
    log("=" * 60)
    log("BOT COMPLETE")
    log(f"Total: {stats['total']} | Success: {stats['success']} | Captcha: {stats['captcha']}")
    log(f"Email Verify: {stats['email_verify']} | Partial: {stats['partial']} | Failed: {stats['failed']}")
    log("=" * 60)


def save_results(results, stats):
    data = {
        "targetUrl": TARGET_URL,
        "bio": BIO,
        "runDate": datetime.now().isoformat(),
        "stats": stats,
        "results": results,
    }
    with open(RESULTS_FILE, "w") as f:
        json.dump(data, f, indent=2)


if __name__ == "__main__":
    asyncio.run(run_bot())
