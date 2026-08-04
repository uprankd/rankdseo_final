# 🚨 CRITICAL: Production Deployment Fix Guide

## Problem Summary
- Production (https://rankdseo.com) shows OLD design and broken pages
- Production login fails (invalid username/password)
- Missing features (Weekly plan, password reset, etc.)
- Preview works correctly ✅

## Root Causes
1. **Wrong code deployed** - Production may have old code
2. **Database not seeded** - No users, no plans
3. **Environment variables missing** - Auth can't work
4. **Browser caching** - Old assets cached

---

## SOLUTION: Complete Production Deployment

### STEP 1: Set All Production Environment Variables

Go to **Emergent Dashboard → uprankd-billing → Manage Publishes → Secrets**

```bash
# ===== AUTHENTICATION (CRITICAL) =====
NEXTAUTH_URL=https://rankdseo.com
NEXTAUTH_SECRET=<generate-secure-32-char-secret>
# Generate: openssl rand -base64 32

# ===== APPLICATION URLs =====
NEXT_PUBLIC_APP_URL=https://rankdseo.com
NEXT_PUBLIC_BASE_URL=https://rankdseo.com
CORS_ORIGINS=https://rankdseo.com

# ===== DATABASE (CRITICAL) =====
# Use your PRODUCTION PostgreSQL database
DATABASE_URL=postgresql://user:password@host:5432/database

# ===== EMAIL (Mailgun) =====
MAILGUN_API_KEY=your-production-key
MAILGUN_DOMAIN=rankdseo.com
MAILGUN_REGION=eu
MAILGUN_FROM_EMAIL=info@rankdseo.com

# ===== STRIPE (Use LIVE keys) =====
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# ===== PAYPAL (If used) =====
PAYPAL_CLIENT_ID=your-live-client-id
PAYPAL_CLIENT_SECRET=your-live-secret
PAYPAL_MODE=live

# ===== OTHER APIs =====
DATAFORSEO_LOGIN=backlinksupports@uprankd.com
DATAFORSEO_PASSWORD=869da58434f0f017

# ===== ANALYTICS =====
NEXT_PUBLIC_GA_TRACKING_ID=your-ga-id
NEXT_PUBLIC_REDDIT_PIXEL=your-pixel
```

### STEP 2: Deploy Latest Code

In **Emergent Dashboard**:
1. Click **"Publish"** or **"Deploy"** button
2. Wait for build to complete (2-5 minutes)
3. Verify deployment shows "Success"

### STEP 3: Seed Production Database

**CRITICAL:** The database needs plans and users!

**Option A: Via Emergent Console** (If available)
```bash
# SSH into production environment
cd /app
npx prisma migrate deploy
npx prisma db seed
```

**Option B: Via Database Client** (Recommended)
1. Connect to your production PostgreSQL database
2. Run the seed script manually OR
3. Export data from preview and import to production

**Option C: Contact Emergent Support**
Ask them to help seed the production database with:
- Subscription plans (Free, Weekly, Monthly, Yearly, Lifetime)
- Admin user (admin@rankseo.com / password)
- Backlink opportunities

### STEP 4: Clear Browser Cache

After deployment:
1. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear browser cache** completely
3. Try **incognito/private window**
4. **Clear CDN cache** if using Cloudflare/similar

### STEP 5: Test Production

Test these critical flows:
1. ✅ Homepage loads with modern design
2. ✅ Login with `admin@rankseo.com` / `password`
3. ✅ View opportunities list
4. ✅ Weekly plan shows in pricing ($7.49/week)
5. ✅ Password reset link works on signin page
6. ✅ Admin features accessible

---

## How to Seed Production Database

### Automatic Method (Recommended)
Use the script I created:

```bash
chmod +x /app/scripts/seed-production.sh
DATABASE_URL="your-production-db-url" ./scripts/seed-production.sh
```

### Manual Method
```bash
# 1. Apply migrations
npx prisma migrate deploy --schema=/app/prisma/schema.prisma

# 2. Run seed
node /app/prisma/seed.js
```

### What Gets Seeded
- ✅ 5 Subscription Plans (Free, Weekly $7.49, Monthly $34.99, Yearly $299, Lifetime $999)
- ✅ Admin user: admin@rankseo.com / password
- ✅ Test user: toms@uprankd.com / password  
- ✅ Demo user for "View Platform"
- ✅ 1000+ Backlink opportunities with tutorials
- ✅ Instructions and step-by-step guides

---

## Verification Checklist

After deployment, verify:

### Homepage ✅
- [ ] Modern gradient hero section
- [ ] "1,000+ Curated Backlink Opportunities" badge
- [ ] Blue gradient headings
- [ ] Pricing shows Weekly and Yearly plans
- [ ] "Get Started" button works

### Authentication ✅
- [ ] Signin page loads
- [ ] "Forgot Password?" link present
- [ ] Login works with test credentials
- [ ] Redirects to dashboard after login

### Features ✅
- [ ] Weekly plan ($7.49) visible in pricing
- [ ] Activity Log accessible
- [ ] Opportunities list loads with pagination
- [ ] SEO-friendly URLs work (slug-based)
- [ ] Admin features accessible
- [ ] Report opportunity button visible

### API/Backend ✅
- [ ] Database connection working
- [ ] tRPC endpoints responding
- [ ] Stripe integration working
- [ ] Email sending (Mailgun) working

---

## If Problems Persist

### Issue: Still seeing old design
**Fix:** 
- Clear ALL browser cache
- Try different browser
- Check if CDN is caching old assets
- Verify correct code was deployed

### Issue: Login still fails  
**Fix:**
- Verify NEXTAUTH_URL = https://rankdseo.com (exactly)
- Verify NEXTAUTH_SECRET is set
- Check production logs for auth errors
- Verify database has users (run: `SELECT * FROM "User" LIMIT 1;`)

### Issue: Features missing
**Fix:**
- Verify latest code was deployed (check git commit hash)
- Check if database was seeded
- Verify environment variables are set

### Issue: Database empty
**Fix:**
- Run seed script (see above)
- OR export preview database and import to production
- OR contact Emergent Support

---

## Quick Commands Reference

```bash
# Check database connection
psql "$DATABASE_URL" -c "SELECT version();"

# Check if users exist
psql "$DATABASE_URL" -c 'SELECT COUNT(*) FROM "User";'

# Check if plans exist  
psql "$DATABASE_URL" -c 'SELECT * FROM "Plan";'

# Run migrations
npx prisma migrate deploy

# Run seed
npx prisma db seed

# Build locally to test
yarn build
```

---

## Support Contacts

- **Emergent Platform Support:** support@emergent.sh
- **Database Issues:** Check Supabase dashboard
- **Domain/DNS Issues:** Check domain registrar

---

## Summary of Changes in This Update

✅ Fixed password reset system (was completely missing)
✅ Added Weekly plan to seed ($7.49/week with 3-day trial)
✅ Fixed NextAuth production config (trustHost: true)
✅ Verified all existing features present in code
✅ Created production seeding scripts
✅ Modern homepage design confirmed working in preview

**The code is ready. Production just needs:**
1. Correct environment variables
2. Latest code deployed  
3. Database seeded
4. Browser cache cleared
