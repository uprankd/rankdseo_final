# How to Seed Your Supabase Production Database

## Quick Summary
You need to run the seed script against your Supabase production database. This will create all the necessary data (plans, users, opportunities).

---

## Option 1: Run from Your Local Machine (Recommended) ⭐

### Step 1: Get Your Production Database URL

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your production project
3. Navigate to: **Settings → Database → Connection string**
4. Copy the **Session Pooler** connection string (Port 5432)
   - Format: `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres`
   - Replace `[PASSWORD]` with your actual database password

### Step 2: Download Required Files

Download these files from your Emergent preview to your local machine:
- `/app/prisma/schema.prisma`
- `/app/prisma/seed.js`
- `/app/package.json`
- `/app/scripts/seed-supabase-production.sh`

### Step 3: Run the Seed Script

```bash
# On your local machine
cd /path/to/downloaded/files

# Make script executable
chmod +x scripts/seed-supabase-production.sh

# Run with your Supabase connection string
./scripts/seed-supabase-production.sh 'postgresql://postgres.xxxxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres'
```

### Step 4: Verify

The script will output:
```
✅ Production database seeded successfully!

📊 Created:
   - 4 Subscription Plans (Weekly, Monthly, Yearly, Lifetime)
   - Admin user: admin@rankseo.com
   - Test user: toms@uprankd.com
   - 147+ Backlink opportunities

🔐 Login credentials:
   Email: admin@rankseo.com
   Password: password
```

---

## Option 2: Manual Commands (Alternative)

If you prefer to run commands manually:

```bash
# 1. Install dependencies
npm install @prisma/client bcrypt

# 2. Set database URL
export DATABASE_URL='postgresql://postgres.xxxxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres'

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations (creates tables)
npx prisma migrate deploy

# 5. Run seed
npx prisma db seed
```

---

## Option 3: Via Supabase SQL Editor

If you can't run scripts locally:

### Step 1: Create Tables
1. Go to **Supabase Dashboard → SQL Editor**
2. Click **New Query**
3. Ask me to generate the full SQL schema (I can provide it)
4. Run the SQL

### Step 2: Insert Data Manually
This is tedious but possible. You'd need to insert:
- Plans (Weekly, Monthly, Yearly, Lifetime)
- Admin user with bcrypt-hashed password
- Opportunities

**Not recommended** - too manual!

---

## Option 4: After Production Deployment (If Emergent Provides Shell Access)

If Emergent gives you SSH/shell access to production:

```bash
# SSH into production
cd /app

# Run the seed script
./scripts/seed-production.sh
```

---

## What Gets Seeded?

### Subscription Plans ✅
- **Free Plan**: $0 (20 opportunities)
- **Weekly Plan**: $7.49/week (Unlimited, 3-day trial)
- **Monthly Plan**: $34.99/month (Unlimited)
- **Yearly Plan**: $99.99/year (Unlimited, best value)
- **Lifetime Plan**: $179.99 (One-time, unlimited forever)

### Users ✅
- **Admin**: admin@rankseo.com / password (ADMIN role, Lifetime plan)
- **Test User**: toms@uprankd.com / password (USER role, Free plan)
- **Demo User**: For "View Platform" feature

### Content ✅
- **147+ Backlink Opportunities** with:
  - URLs and site names
  - Step-by-step instructions
  - Difficulty ratings
  - Categories and niches
  - DA/DR scores

### Demo Data ✅
- 1 sample project with opportunities assigned

---

## Troubleshooting

### Error: "Can't reach database server"
- Check your DATABASE_URL is correct
- Ensure you're using the **Session Pooler** (port 5432), not Transaction Pooler
- Verify your IP is allowed in Supabase settings

### Error: "Database schema is not empty"
- This means tables already exist (OK!)
- Skip `prisma migrate deploy` and just run `prisma db seed`

### Error: "Unique constraint failed"
- Data already exists in database
- You can either:
  - Drop all tables and start fresh (in Supabase SQL Editor)
  - Or skip seeding if data is already there

### Error: "Permission denied"
- Make script executable: `chmod +x scripts/seed-supabase-production.sh`

---

## Verification Checklist

After seeding, verify in Supabase Dashboard → Table Editor:

- [ ] **Plan** table has 4+ records
- [ ] **User** table has 2+ records
- [ ] **BacklinkOpportunity** table has 147+ records
- [ ] **Subscription** table has records for users
- [ ] Admin user email is `admin@rankseo.com`

---

## After Seeding

1. **Deploy your app** to production (if not already deployed)
2. **Set environment variables** in Emergent production secrets:
   ```
   NEXTAUTH_URL=https://rankdseo.com
   NEXTAUTH_SECRET=<your-secure-secret>
   DATABASE_URL=<your-supabase-production-url>
   ```
3. **Test login** at https://rankdseo.com/signin
   - Email: admin@rankseo.com
   - Password: password
4. **Change the admin password** immediately!
5. **Test features**:
   - View opportunities
   - Check pricing page shows all plans
   - Test signup flow
   - Verify Weekly plan appears

---

## Security Notes

⚠️ **Important:**
- The default password is `password` - **change it immediately** after first login!
- Store your DATABASE_URL securely
- Never commit database credentials to git
- Use different credentials for preview vs production

---

## Need Help?

If you encounter issues:
1. Check Supabase logs in dashboard
2. Verify DATABASE_URL format is correct
3. Ensure Prisma schema matches your database
4. Contact Emergent support for deployment-specific help

---

## Quick Reference

**Supabase Connection String Format:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

**Seed Command:**
```bash
export DATABASE_URL='your-connection-string'
npx prisma db seed
```

**Test Login:**
- URL: https://rankdseo.com/signin
- Email: admin@rankseo.com
- Password: password (change this!)
