"""
Backlink Creator Bot v2 - With 2Captcha Integration
Target URL: https://arxio.pro
Email: blindandead@gmail.com
Bio: The ultimate platform for CS2 highlights. Upload your best aces, clutches, and frags.
"""

import asyncio
import json
import random
import string
import time
import re
import psycopg2
from datetime import datetime
from playwright.async_api import async_playwright, TimeoutError as PWTimeout
from twocaptcha import TwoCaptcha

TARGET_URL = "https://arxio.pro"
EMAIL = "blindandead@gmail.com"
BIO = "The ultimate platform for CS2 highlights. Upload your best aces, clutches, and frags."
CAPTCHA_API_KEY = "3c06d4130d9128b6af6281b2d7e1922e"
RESULTS_FILE = "/app/backlink_bot_results_v2.json"
LOG_FILE = "/app/backlink_bot_v2.log"

solver = TwoCaptcha(CAPTCHA_API_KEY)

FIRST_NAMES = ["Alex", "Jordan", "Morgan", "Taylor", "Casey", "Riley", "Quinn", "Avery", "Cameron", "Dakota",
               "Drew", "Emery", "Finley", "Harper", "Kai", "Logan", "Parker", "Reese", "Sage", "Skyler",
               "Blake", "Charlie", "Devon", "Ellis", "Frankie", "Gray", "Hayden", "Indigo", "Jamie", "Kendall"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Martinez", "Anderson",
              "Wilson", "Moore", "Taylor", "Thomas", "Jackson", "White", "Harris", "Martin", "Lee", "Clark",
              "Lewis", "Walker", "Hall", "Allen", "Young", "King", "Wright", "Scott", "Green", "Baker"]

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def rand_name():
    return random.choice(FIRST_NAMES) + " " + random.choice(LAST_NAMES)

def rand_username():
    return random.choice(FIRST_NAMES).lower() + random.choice(LAST_NAMES).lower() + str(random.randint(10, 999))

def rand_password():
    return "Qx9!" + ''.join(random.choices(string.ascii_letters + string.digits, k=10))

def get_opportunities():
    conn = psycopg2.connect(dbname="rankseo", user="rankseo", password="dev_password", host="localhost")
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
    return [{"id": r[0], "siteName": r[1], "url": r[2], "da": r[3], "steps": r[4]} for r in rows]


def solve_recaptcha_v2(sitekey, page_url):
    """Solve reCAPTCHA v2 using 2Captcha service."""
    try:
        result = solver.recaptcha(sitekey=sitekey, url=page_url)
        return result['code']
    except Exception as e:
        log(f"    2Captcha error: {e}")
        return None

def solve_hcaptcha(sitekey, page_url):
    """Solve hCaptcha using 2Captcha service."""
    try:
        result = solver.hcaptcha(sitekey=sitekey, url=page_url)
        return result['code']
    except Exception as e:
        log(f"    2Captcha hcaptcha error: {e}")
        return None

def solve_turnstile(sitekey, page_url):
    """Solve Cloudflare Turnstile using 2Captcha."""
    try:
        result = solver.turnstile(sitekey=sitekey, url=page_url)
        return result['code']
    except Exception as e:
        log(f"    2Captcha turnstile error: {e}")
        return None


async def handle_captcha(page):
    """Detect and solve captcha on the page. Returns True if solved or no captcha."""
    content = await page.content()
    page_url = page.url

    # reCAPTCHA v2
    recaptcha_match = re.search(r'data-sitekey=["\']([a-zA-Z0-9_-]+)["\']', content)
    if not recaptcha_match:
        recaptcha_match = re.search(r'sitekey["\s:]+["\']([a-zA-Z0-9_-]+)["\']', content)

    if recaptcha_match and 'g-recaptcha' in content.lower():
        sitekey = recaptcha_match.group(1)
        log(f"    Solving reCAPTCHA v2 (sitekey: {sitekey[:20]}...)")
        token = solve_recaptcha_v2(sitekey, page_url)
        if token:
            await page.evaluate(f'''() => {{
                const el = document.getElementById("g-recaptcha-response");
                if (el) {{ el.style.display = "block"; el.value = "{token}"; }}
                const els = document.querySelectorAll('[name="g-recaptcha-response"]');
                els.forEach(e => {{ e.value = "{token}"; }});
                if (typeof ___grecaptcha_cfg !== "undefined") {{
                    Object.entries(___grecaptcha_cfg.clients).forEach(([k,v]) => {{
                        Object.entries(v).forEach(([kk,vv]) => {{
                            if (vv && typeof vv === "object") {{
                                Object.entries(vv).forEach(([kkk,vvv]) => {{
                                    if (vvv && vvv.callback) vvv.callback("{token}");
                                }});
                            }}
                        }});
                    }});
                }}
            }}''')
            log(f"    reCAPTCHA SOLVED")
            return True
        return False

    # hCaptcha
    hcaptcha_match = re.search(r'data-sitekey=["\']([a-f0-9-]+)["\']', content)
    if 'hcaptcha' in content.lower() or 'h-captcha' in content.lower():
        if hcaptcha_match:
            sitekey = hcaptcha_match.group(1)
            log(f"    Solving hCaptcha (sitekey: {sitekey[:20]}...)")
            token = solve_hcaptcha(sitekey, page_url)
            if token:
                await page.evaluate(f'''() => {{
                    const resp = document.querySelector('[name="h-captcha-response"]') ||
                                 document.querySelector('[name="g-recaptcha-response"]');
                    if (resp) resp.value = "{token}";
                    const iframe = document.querySelector('iframe[src*="hcaptcha"]');
                    if (iframe) iframe.dataset.hcaptchaResponse = "{token}";
                }}''')
                log(f"    hCaptcha SOLVED")
                return True
        return False

    # Cloudflare Turnstile
    turnstile_match = re.search(r'cf-turnstile.*?data-sitekey=["\']([a-zA-Z0-9_-]+)["\']', content, re.DOTALL)
    if 'cf-turnstile' in content:
        if turnstile_match:
            sitekey = turnstile_match.group(1)
            log(f"    Solving Turnstile (sitekey: {sitekey[:20]}...)")
            token = solve_turnstile(sitekey, page_url)
            if token:
                await page.evaluate(f'''() => {{
                    const el = document.querySelector('[name="cf-turnstile-response"]');
                    if (el) el.value = "{token}";
                }}''')
                log(f"    Turnstile SOLVED")
                return True
        return False

    # No captcha detected or it's invisible/not blocking
    return True


async def attempt_site(page, opp, results):
    site_name = opp["siteName"]
    url = opp["url"]
    da = opp["da"]

    result = {
        "siteName": site_name, "url": url, "da": da,
        "status": "FAILED", "reason": "", "profileUrl": None,
        "backlinkPlaced": False, "captchaSolved": False,
    }

    try:
        log(f"  [{da}] {site_name} ({url[:60]})")
        resp = await page.goto(url, timeout=20000, wait_until="domcontentloaded")

        if resp is None or resp.status >= 400:
            result["reason"] = f"HTTP {resp.status if resp else 'no response'}"
            results.append(result)
            return result

        await page.wait_for_timeout(2000)

        # Find signup link
        signup_selectors = [
            'a:has-text("Sign Up")', 'a:has-text("Register")', 'a:has-text("Create Account")',
            'a:has-text("Join")', 'a:has-text("Get Started")', 'a:has-text("Sign up")',
            'a:has-text("Create your")', 'a:has-text("Create One")', 'a:has-text("Join Free")',
            'a:has-text("Sign Up Free")', 'a:has-text("Create a free account")',
            'button:has-text("Sign Up")', 'button:has-text("Register")',
            'button:has-text("Join")', 'button:has-text("Get Started")',
            'button:has-text("Create Account")', 'button:has-text("Join Free")',
            '[href*="signup"]', '[href*="register"]', '[href*="join"]',
            '[href*="sign-up"]', '[href*="sign_up"]', '[href*="create-account"]',
            '[href*="registration"]', '[href*="new-account"]',
        ]

        for sel in signup_selectors:
            try:
                el = page.locator(sel).first
                if await el.is_visible(timeout=800):
                    await el.click(force=True, timeout=5000)
                    log(f"    -> signup: {sel}")
                    await page.wait_for_timeout(3000)
                    break
            except:
                continue

        # Handle captcha before filling form
        captcha_result = await handle_captcha(page)
        if captcha_result:
            result["captchaSolved"] = True

        # Fill registration form
        name = rand_name()
        username = rand_username()
        password = rand_password()

        form_fields = {
            "name": ['input[name="name"]', 'input[name="full_name"]', 'input[name="fullname"]',
                      'input[name="display_name"]', 'input[name="displayname"]', 'input[name="first_name"]',
                      'input[placeholder*="name" i]', 'input[placeholder*="Name"]', 'input[placeholder*="Full" i]',
                      '#name', '#fullName', '#displayName', '#first_name', 'input[aria-label*="name" i]'],
            "username": ['input[name="username"]', 'input[name="user"]', 'input[name="login"]',
                         'input[name="nickname"]', 'input[name="screen_name"]',
                         'input[placeholder*="username" i]', 'input[placeholder*="Username"]',
                         '#username', '#user', '#login_field', '#screen_name',
                         'input[aria-label*="username" i]'],
            "email": ['input[name="email"]', 'input[type="email"]', 'input[name="user_email"]',
                      'input[name="emailAddress"]', 'input[name="user[email]"]',
                      'input[placeholder*="email" i]', 'input[placeholder*="Email"]',
                      '#email', '#user_email', '#emailAddress',
                      'input[aria-label*="email" i]'],
            "password": ['input[name="password"]', 'input[type="password"]',
                         'input[name="user_password"]', 'input[name="passwd"]',
                         '#password', '#pass', '#passwd',
                         'input[placeholder*="password" i]'],
            "website": ['input[name="url"]', 'input[name="website"]', 'input[name="site"]',
                        'input[name="homepage"]', 'input[name="web"]', 'input[name="user_url"]',
                        'input[placeholder*="website" i]', 'input[placeholder*="url" i]',
                        'input[placeholder*="URL"]', 'input[placeholder*="Website"]',
                        'input[type="url"]', '#url', '#website', '#homepage',
                        'input[aria-label*="website" i]', 'input[aria-label*="url" i]'],
            "bio": ['textarea[name="bio"]', 'textarea[name="about"]', 'textarea[name="description"]',
                    'textarea[name="profile_bio"]', 'textarea[name="user_bio"]',
                    'textarea[placeholder*="bio" i]', 'textarea[placeholder*="about" i]',
                    'textarea[placeholder*="yourself" i]', 'textarea[placeholder*="description" i]',
                    '#bio', '#about', '#description', '#profile_bio',
                    'textarea[aria-label*="bio" i]'],
        }

        filled = {}
        for field_type, selectors in form_fields.items():
            for sel in selectors:
                try:
                    el = page.locator(sel).first
                    if await el.is_visible(timeout=500):
                        val = {
                            "name": name,
                            "username": username,
                            "email": EMAIL,
                            "password": password,
                            "website": TARGET_URL,
                            "bio": f"{BIO} {TARGET_URL}",
                        }[field_type]
                        await el.fill(val)
                        if field_type in ("website", "bio"):
                            result["backlinkPlaced"] = True
                        filled[field_type] = True
                        break
                except:
                    continue

        # Confirm password
        for sel in ['input[name="password_confirmation"]', 'input[name="confirm_password"]',
                    'input[name="confirmPassword"]', 'input[name="password2"]', 'input[name="repassword"]',
                    '#password_confirmation', '#confirm_password', '#password2',
                    'input[placeholder*="confirm" i]', 'input[placeholder*="Confirm" i]',
                    'input[placeholder*="Repeat" i]', 'input[placeholder*="Re-enter" i]']:
            try:
                el = page.locator(sel).first
                if await el.is_visible(timeout=400):
                    await el.fill(password)
                    break
            except:
                continue

        # Check TOS checkbox
        for sel in ['input[name="tos"]', 'input[name="terms"]', 'input[name="agree"]',
                    'input[name="accept"]', 'input[type="checkbox"][id*="term"]',
                    'input[type="checkbox"][id*="agree"]', 'input[type="checkbox"][id*="tos"]',
                    'input[type="checkbox"][name*="policy"]', 'input[type="checkbox"][name*="consent"]']:
            try:
                el = page.locator(sel).first
                if await el.is_visible(timeout=400):
                    await el.check(force=True)
                    break
            except:
                continue

        if not filled:
            result["reason"] = "No fillable form fields found"
            results.append(result)
            return result

        log(f"    Filled: {list(filled.keys())}")

        # Handle captcha again (some appear after filling)
        await handle_captcha(page)

        # Submit
        submit_selectors = [
            'button[type="submit"]', 'input[type="submit"]',
            'button:has-text("Sign Up")', 'button:has-text("Register")',
            'button:has-text("Create")', 'button:has-text("Join")',
            'button:has-text("Submit")', 'button:has-text("Next")',
            'button:has-text("Continue")', 'button:has-text("Get Started")',
            'button:has-text("Create Account")', 'button:has-text("Sign up")',
            'button:has-text("Agree")', 'button:has-text("Complete")',
            'input[value="Register"]', 'input[value="Sign Up"]',
            'input[value="Submit"]', 'input[value="Create"]',
        ]

        submitted = False
        for sel in submit_selectors:
            try:
                el = page.locator(sel).first
                if await el.is_visible(timeout=800):
                    await el.click(force=True, timeout=5000)
                    submitted = True
                    log(f"    Submitted: {sel}")
                    await page.wait_for_timeout(4000)
                    break
            except:
                continue

        if not submitted:
            result["reason"] = f"No submit button. Filled: {list(filled.keys())}"
            result["status"] = "PARTIAL"
            results.append(result)
            return result

        # Post-submission analysis
        post_content = await page.content()

        email_verify = ["verify your email", "check your email", "confirmation email",
                        "verify your account", "email verification", "we sent you",
                        "check your inbox", "verification link"]
        if any(ind in post_content.lower() for ind in email_verify):
            result["status"] = "NEEDS_EMAIL_VERIFICATION"
            result["reason"] = f"Email verification needed. Fields: {list(filled.keys())}"
            result["profileUrl"] = page.url
            results.append(result)
            return result

        success_indicators = ["welcome", "dashboard", "profile", "account created",
                              "successfully", "thank you for", "congrat"]
        page_text_lower = (await page.inner_text("body")).lower()

        if filled.get("website") or filled.get("bio"):
            result["status"] = "LIKELY_SUCCESS"
            result["reason"] = f"Submitted with URL. Fields: {list(filled.keys())}"
            result["profileUrl"] = page.url
        elif any(s in page_text_lower for s in success_indicators):
            result["status"] = "REGISTERED"
            result["reason"] = f"Registration likely succeeded. Fields: {list(filled.keys())}"
            result["profileUrl"] = page.url
        elif filled.get("email") and submitted:
            result["status"] = "SUBMITTED"
            result["reason"] = f"Submitted (no URL field). Fields: {list(filled.keys())}"
            result["profileUrl"] = page.url
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
    # Clear old log
    with open(LOG_FILE, "w") as f:
        f.write("")

    log("=" * 60)
    log("BACKLINK CREATOR BOT v2 - With 2Captcha")
    log(f"Target: {TARGET_URL}")
    log(f"Email: {EMAIL}")
    log(f"Bio: {BIO}")
    log("=" * 60)

    opportunities = get_opportunities()
    log(f"Total opportunities: {len(opportunities)}")

    # Load previous results to skip already processed
    prev_done = set()
    try:
        with open(RESULTS_FILE) as f:
            prev = json.load(f)
            for r in prev.get("results", []):
                prev_done.add(r["url"])
        log(f"Resuming — {len(prev_done)} already processed")
    except:
        pass

    results = []
    stats = {"total": 0, "success": 0, "registered": 0, "captcha_solved": 0,
             "captcha_failed": 0, "email_verify": 0, "failed": 0, "partial": 0,
             "submitted": 0, "timeout": 0}

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
                   "--disable-blink-features=AutomationControlled"]
        )

        batch_size = 2  # Lower concurrency for captcha solving (needs time)

        for i in range(0, len(opportunities), batch_size):
            batch = opportunities[i:i+batch_size]
            tasks = []

            for opp in batch:
                if opp["url"] in prev_done:
                    continue

                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    viewport={"width": 1366, "height": 768},
                    java_script_enabled=True,
                )
                # Hide webdriver
                await context.add_init_script("""
                    Object.defineProperty(navigator, 'webdriver', {get: () => false});
                """)
                pg = await context.new_page()
                tasks.append(attempt_site(pg, opp, results))

            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

            for ctx in browser.contexts:
                try:
                    await ctx.close()
                except:
                    pass

            # Update stats
            stats = {"total": len(results), "success": 0, "registered": 0,
                     "captcha_solved": 0, "captcha_failed": 0, "email_verify": 0,
                     "failed": 0, "partial": 0, "submitted": 0, "timeout": 0}
            for r in results:
                st = r.get("status", "FAILED")
                if st == "LIKELY_SUCCESS":
                    stats["success"] += 1
                elif st == "REGISTERED":
                    stats["registered"] += 1
                elif st == "NEEDS_EMAIL_VERIFICATION":
                    stats["email_verify"] += 1
                elif st == "PARTIAL":
                    stats["partial"] += 1
                elif st == "SUBMITTED":
                    stats["submitted"] += 1
                elif "Timeout" in r.get("reason", ""):
                    stats["timeout"] += 1
                else:
                    stats["failed"] += 1
                if r.get("captchaSolved"):
                    stats["captcha_solved"] += 1

            if stats["total"] % 20 == 0 and stats["total"] > 0:
                save_results(results, stats)
                log(f"\n--- Progress: {stats['total']}/{len(opportunities)} ---")
                log(f"    SUCCESS: {stats['success']} | REGISTERED: {stats['registered']} | SUBMITTED: {stats['submitted']}")
                log(f"    PARTIAL: {stats['partial']} | EMAIL_VERIFY: {stats['email_verify']}")
                log(f"    CAPTCHA_SOLVED: {stats['captcha_solved']} | TIMEOUT: {stats['timeout']} | FAILED: {stats['failed']}\n")

        await browser.close()

    save_results(results, stats)
    log("=" * 60)
    log("BOT v2 COMPLETE")
    log(f"Total: {stats['total']}")
    log(f"SUCCESS: {stats['success']} | REGISTERED: {stats['registered']} | SUBMITTED: {stats['submitted']}")
    log(f"PARTIAL: {stats['partial']} | EMAIL_VERIFY: {stats['email_verify']}")
    log(f"CAPTCHA_SOLVED: {stats['captcha_solved']} | TIMEOUT: {stats['timeout']} | FAILED: {stats['failed']}")
    log("=" * 60)


def save_results(results, stats):
    with open(RESULTS_FILE, "w") as f:
        json.dump({
            "targetUrl": TARGET_URL, "email": EMAIL, "bio": BIO,
            "runDate": datetime.now().isoformat(),
            "stats": stats, "results": results,
        }, f, indent=2)


if __name__ == "__main__":
    asyncio.run(run_bot())
