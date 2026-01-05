# Mailgun Sandbox Setup Guide

## 🎯 What You Need To Do

Your app is now configured for **Mailgun Sandbox Mode**, but you need to update it with your actual sandbox domain.

## 📋 Step-by-Step Instructions

### 1. Get Your Sandbox Domain from Mailgun

1. Go to https://app.mailgun.com/
2. Log in with your Mailgun account
3. Click **"Sending"** in the left menu
4. Click **"Domains"**
5. Look for a domain that looks like: `sandbox1234567890abcdef.mailgun.org`
6. **Copy this domain** (you'll need it in the next step)

### 2. Update Your .env File

Replace the placeholder in `/app/.env`:

**Current (placeholder):**
```
MAILGUN_DOMAIN="sandbox1234567890abcdef.mailgun.org"
MAILGUN_FROM_EMAIL="noreply@sandbox1234567890abcdef.mailgun.org"
```

**Replace with your actual sandbox domain:**
```
MAILGUN_DOMAIN="sandbox[YOUR-ACTUAL-HASH].mailgun.org"
MAILGUN_FROM_EMAIL="noreply@sandbox[YOUR-ACTUAL-HASH].mailgun.org"
```

### 3. Add Authorized Recipients (Important!)

⚠️ **Sandbox domains only send emails to authorized recipients**

1. In Mailgun dashboard, go to **Sending → Domains**
2. Click on your sandbox domain
3. Go to **"Authorized Recipients"** tab
4. Click **"Add Recipient"**
5. Add your email address (e.g., admin@rankseo.com)
6. Check your email and click the verification link
7. Now emails will be delivered to this address for testing!

### 4. Restart the Server

After updating `.env`:
```bash
sudo supervisorctl restart nextjs
```

## 📧 Testing Your Setup

Once configured, you can test by:
1. Creating a new user account → Should receive welcome email
2. Admin resetting a password → User should receive password reset email
3. Check the authorized email inbox for the test emails

## ⚠️ Sandbox Limitations

- ✅ Perfect for testing and development
- ✅ No DNS configuration required
- ✅ Free to use
- ❌ Only sends to authorized recipients (you must add them)
- ❌ Not for production use
- ❌ Has "via mailgun.org" in email headers

## 🚀 Moving to Production

When you're ready for production:
1. Register your own domain (e.g., rankdseo.com)
2. Add it to Mailgun: **Sending → Domains → Add New Domain**
3. Configure DNS records at your domain registrar
4. Update `.env` with your verified domain
5. Emails will be sent from your own domain!

## 📝 Current Configuration

```
MAILGUN_API_KEY: ✅ Already set
MAILGUN_REGION: ✅ EU
MAILGUN_FROM_NAME: ✅ RankdSEO-Admin
MAILGUN_DOMAIN: ⚠️ Needs your actual sandbox domain
MAILGUN_FROM_EMAIL: ⚠️ Needs your actual sandbox domain
```

## ❓ Need Help?

If you don't see a sandbox domain in your Mailgun account, it should be created automatically. Look for any domain ending in `.mailgun.org` - that's your sandbox!
