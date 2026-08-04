# 🎯 Quick Guide: Seed Supabase with SQL

## Step 1: Open Supabase SQL Editor

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your **production project**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

## Step 2: Copy and Paste the SQL

1. Open the file: `/app/supabase-seed.sql`
2. **Copy ALL the SQL code** (from the first line to the last)
3. **Paste it** into the Supabase SQL Editor

## Step 3: Run the Query

1. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for it to complete (should take 5-10 seconds)
3. You should see:
   ```
   ✅ Database seeded successfully!
   
   📊 Created:
      - 5 Subscription Plans
      - 3 Users
      - 21 Backlink Opportunities
      - 15 Sample Instructions
      - 1 Demo Project
   
   🔐 Login Credentials:
      Email: admin@rankseo.com
      Password: password
   ```

## Step 4: Verify the Data

Go to **Table Editor** in Supabase and check:
- ✅ **Plan** table has 5 records
- ✅ **User** table has 3 records (admin@rankseo.com, toms@uprankd.com, demo@rankdseo.com)
- ✅ **BacklinkOpportunity** table has 21 records
- ✅ **Subscription** table has 3 records

## Step 5: Test Login

1. Go to your production site: **https://rankdseo.com/signin**
2. Login with:
   - **Email**: `admin@rankseo.com`
   - **Password**: `password`
3. ⚠️ **Change the password immediately** after first login!

---

## What This SQL Does

✅ Creates all necessary tables (User, Plan, Subscription, BacklinkOpportunity, etc.)
✅ Creates proper indexes for performance
✅ Handles conflicts gracefully (won't error if data exists)
✅ Inserts 5 subscription plans including Weekly $7.49
✅ Creates 3 users with proper bcrypt password hashing
✅ Creates 21 backlink opportunities with SEO-friendly slugs
✅ Adds sample instructions for top opportunities
✅ Creates a demo project

---

## Plans Created

| Plan | Price | Interval | Features |
|------|-------|----------|----------|
| **Free** | $0 | month | 20 opportunities, 1 project |
| **Weekly** | $7.49 | week | Unlimited, 3-day trial ⭐ |
| **Monthly** | $34.99 | month | Unlimited |
| **Yearly** | $99.99 | year | Unlimited, best value |
| **Lifetime** | $179.99 | one-time | Unlimited forever |

---

## Users Created

| Email | Password | Role | Subscription |
|-------|----------|------|--------------|
| admin@rankseo.com | password | ADMIN | Lifetime |
| toms@uprankd.com | password | USER | Free |
| demo@rankdseo.com | password | USER | Free |

---

## Troubleshooting

### Error: "relation already exists"
- **Solution**: This is OK! It means tables exist. The script handles this.
- The data will still be inserted with `ON CONFLICT DO NOTHING`

### Error: "permission denied"
- **Solution**: Make sure you're using the **database owner** credentials in Supabase
- Check your Supabase project settings → Database → Connection pooling

### Error: "syntax error near..."
- **Solution**: Make sure you copied the **entire SQL file** from start to finish
- Don't copy just part of it

### Nothing happens / No output
- **Solution**: Scroll down in the results panel - the success message should be there
- Or check Table Editor to verify data was inserted

---

## Security Notes

⚠️ **CRITICAL:**
- Default password is `password` - **change it immediately!**
- This is meant for initial setup only
- Use strong, unique passwords in production
- Enable 2FA for admin accounts if possible

---

## Next Steps After Seeding

1. ✅ Database is seeded
2. 🚀 Deploy latest code to production (if not done)
3. 🔧 Set environment variables in Emergent:
   - `NEXTAUTH_URL=https://rankdseo.com`
   - `NEXTAUTH_SECRET=<your-secure-secret>`
   - `DATABASE_URL=<your-supabase-production-url>`
4. 🧪 Test login and features
5. 🔐 Change admin password
6. 🎉 Your production site is ready!

---

## Need Help?

If you encounter any issues:
1. Check the Supabase logs in the SQL Editor output
2. Verify your database connection is working
3. Make sure your Supabase project is not paused
4. Contact Emergent support for deployment issues
