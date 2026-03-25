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
- **Scheduling**: node-schedule + setInterval-based scheduler

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
- **Automated Expiration Emails** (daily at 8 AM, with duplicate prevention)
- Help & Support Ticket System
- Google Tag Manager, Google Analytics, Google Search Console
- Bulk User Import from CSV
- Hidden "3 Month Membership" plan (visible only in Admin → Manage Users)

## What's Been Implemented
- [Mar 25 2026] Automated Expiration Emails: Scheduler runs daily at 8 AM, sends expiration emails to users with expired subscriptions. Uses `expirationEmailSentAt` field on Subscription to prevent duplicate sends. Both admin manual trigger and automated job mark emails as sent.
- [Mar 25 2026] Hidden 3 Month Plan: Filtered from signup page (API-level) and settings page (frontend) — only visible in Admin → Manage Users.
- [Mar 25 2026] Bulk User Import: Imported 709 users from old site CSV. Created hidden "3 Month Membership" plan at $34.99. Total users: 736.
- [Mar 25 2026] Help & Support System, PayPal Upgrades, Google Integrations, Expiration Email Template
- [Mar 6 2026] Invoice System: A4-formatted with SIA Uprankd company details
- [Mar 2026] Comprehensive SEO, slug URLs, demo mode, PayPal signup fix, pagination, Activity Log, Admin password reset

## Prioritized Backlog
### P0
- (none)

### P1
- (none)

### P2
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
- `/app/lib/jobs/expiration-emails.ts` - Automated expiration email job
- `/app/lib/scheduler/index.ts` - Central scheduler (link verification, reports, expiration emails)
- `/app/scripts/import-users.js` - Bulk user import script
- `/app/lib/api/routers/admin.ts` - Admin endpoints (incl. manual expiration email trigger)
- `/app/lib/api/routers/subscription.ts` - Subscription endpoints (3 Month plan filtered from public)
- `/app/lib/mailgun.ts` - Email templates and sending
- `/app/prisma/schema.prisma` - Database schema (added expirationEmailSentAt to Subscription)
