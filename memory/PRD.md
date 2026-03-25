# RankdSEO - Product Requirements Document

## Problem Statement
SaaS application for managing Backlink Opportunities. Users can discover, track, and manage high-quality backlink sources with step-by-step instructions.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **API**: tRPC v11
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js
- **Payments**: Stripe (working), PayPal (signup working, upgrades pending)
- **Email**: Mailgun (sandbox mode)
- **Scheduling**: node-schedule

## Core Features (Implemented)
- User auth with NextAuth
- Stripe payments & subscriptions
- PayPal signup flow (fixed Mar 2026)
- Admin panel (opportunities, users, invoices, coupons, activity log, reports)
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
- **Subscription Expiration Enforcement** (verified Mar 25, 2026)

## What's Been Implemented
- [Mar 25 2026] Subscription Expiration: Enforces plan duration (monthly/yearly/lifetime). Expired users see block screen with renewal CTA. Admin & demo users exempt. `getSubscriptionStatus` tRPC endpoint verified working.
- [Mar 6 2026] Invoice System: A4-formatted invoice with SIA Uprankd company details, public invoice page, print support
- [Mar 2026] Backlink Creator Bot: One-time Playwright bot with 2Captcha, final report at `/app/backlink_bot_final_report.json`
- [Mar 2026] Homepage: Sales copy section, "View Sample Backlink" button for guests
- [Mar 2026] Admin password reset email system: individual + bulk send, 24h token expiry
- [Mar 2026] Activity Log: admin CRUD + read-only timeline for all users
- [Mar 2026] Comprehensive SEO: sitemap.xml, robots.txt, JSON-LD, dynamic meta, canonical URLs
- [Mar 2026] SEO-friendly slug URLs for all opportunities
- [Mar 2026] "View Platform" demo mode
- [Mar 2026] PayPal signup bug fix
- [Mar 2026] Cursor-based pagination with useInfiniteQuery
- [Earlier] Stripe signup fix, email system, invoice management, free plan limits

## Prioritized Backlog
### P0
- (none — subscription expiration verified)

### P1
- PayPal for Plan Upgrades (settings page)

### P2
- Backlink Validator Bot (blocked on user feedback)
- SEOBot AI Integration (seobotai.com)

### P3
- User Email Preferences (opt out of notifications)
- Cleanup unused settings.exportData endpoint
- 10 opportunities missing screenshot tutorials
- Email template refactoring (move from mailgun.ts to separate files)

## Credentials
- Admin: admin@rankseo.com / Admin123!
- Test user: sarah.smith@example.com / TestUser123!
- Free user: toms@uprankd.com / password
- Mailgun: sandbox mode (only authorized recipients)

## Key Files
- `/app/app/(dashboard)/layout.tsx` - Dashboard layout with subscription expiration check
- `/app/lib/api/routers/opportunity.ts` - Opportunity API with free plan + pagination + getSubscriptionStatus
- `/app/lib/api/routers/payment.ts` - Stripe + PayPal payment logic
- `/app/app/(auth)/signup/page.tsx` - Signup with payment selection
- `/app/app/(dashboard)/opportunities/page.tsx` - Main opportunities page with infinite scroll
- `/app/lib/mailgun.ts` - Email templates and sending
- `/app/lib/api/routers/admin.ts` - Admin endpoints
- `/app/components/InvoiceA4.tsx` - A4 invoice component with company details
- `/app/app/(dashboard)/admin/invoices/page.tsx` - Invoice management with A4 preview
- `/app/app/invoice/[id]/page.tsx` - Public invoice page
- `/app/api/webhooks/stripe/route.ts` - Stripe webhook with subscription end date logic
