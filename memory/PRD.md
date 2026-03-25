# RankdSEO - Product Requirements Document

## Problem Statement
SaaS application for managing Backlink Opportunities. Users can discover, track, and manage high-quality backlink sources with step-by-step instructions.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **API**: tRPC v11
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js
- **Payments**: Stripe (working), PayPal (signup + upgrades working)
- **Email**: Mailgun (sandbox mode)
- **Scheduling**: node-schedule

## Core Features (Implemented)
- User auth with NextAuth
- Stripe payments & subscriptions
- PayPal signup + upgrade flows
- Admin panel (opportunities, users, invoices, coupons, activity log, reports, help desk)
- Email notifications (Mailgun sandbox)
- Free plan: 20 curated constant opportunities, 1 project limit
- Paid plans: Full access with cursor-based pagination (100/page)
- Project management with opportunity tracking
- Activity logs & analytics
- Invoice system: A4-formatted with company details, public viewing page
- SEO: sitemap.xml, robots.txt, JSON-LD, slug-based URLs, dynamic metadata
- "View Platform" demo mode for unauthenticated users
- Admin-initiated password reset (individual + bulk)
- Opportunity reporting system for paid users
- Subscription Expiration Enforcement
- Help & Support Ticket System
- Google Tag Manager, Google Analytics, Google Search Console
- Bulk User Import from CSV

## What's Been Implemented
- [Mar 25 2026] Bulk User Import: Imported 709 users from old site CSV with correct subscription plans (Monthly, Yearly, 3-Month, Lifetime). Created hidden "3 Month Membership" plan at $34.99. Total users now: 736.
- [Mar 25 2026] Help & Support System: Full ticket system with user/admin interfaces
- [Mar 25 2026] PayPal for Plan Upgrades: Users can upgrade via PayPal from Settings
- [Mar 25 2026] Google Integrations: GTM, GA, GSC
- [Mar 25 2026] Subscription Expiration Emails: Admin-triggered email notifications
- [Mar 25 2026] Free plan DB fix: Updated maxOpportunities from 50 to 20
- [Mar 6 2026] Invoice System: A4-formatted with SIA Uprankd company details
- [Mar 2026] Backlink Creator Bot, Homepage updates, Admin password reset, Activity Log
- [Mar 2026] Comprehensive SEO, slug URLs, demo mode, PayPal signup fix, pagination

## Prioritized Backlog
### P0
- (none)

### P1
- (none)

### P2
- Automate Expiration Emails (scheduler - needs user confirmation)
- Backlink Validator Bot (blocked on user feedback)
- SEOBot AI Integration (seobotai.com)

### P3
- User Email Preferences (opt out of notifications)
- Cleanup unused settings.exportData endpoint
- Email template refactoring (move from mailgun.ts to separate files)

## Credentials
- Admin: admin@rankseo.com / Admin123!
- Imported users: [email from CSV] / Rankdseo2025!
- Free user: toms@uprankd.com / password
- Mailgun: sandbox mode (only authorized recipients)

## Key Files
- `/app/scripts/import-users.js` - Bulk user import script (reads CSV)
- `/app/scripts/members.csv` - Source CSV for user import
- `/app/app/(dashboard)/layout.tsx` - Dashboard layout with subscription expiration check
- `/app/lib/api/routers/opportunity.ts` - Opportunity API with free plan + pagination
- `/app/lib/api/routers/admin.ts` - Admin endpoints
- `/app/lib/api/routers/support.ts` - Help/support ticket system
- `/app/lib/mailgun.ts` - Email templates and sending
- `/app/components/InvoiceA4.tsx` - A4 invoice component
- `/app/prisma/schema.prisma` - Database schema
