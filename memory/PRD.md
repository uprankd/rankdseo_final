# RankdSEO - Product Requirements Document

## Problem Statement
SaaS application for managing Backlink Opportunities. Users can discover, track, and manage high-quality backlink sources with step-by-step instructions.

## Tech Stack
- **Framework**: Next.js (App Router)
- **API**: tRPC v11
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js
- **Payments**: Stripe (working), PayPal (partially working - signup fixed, upgrades pending)
- **Email**: Mailgun (sandbox mode)
- **Scheduling**: node-schedule

## Core Features (Implemented)
- User auth with NextAuth
- Stripe payments & subscriptions
- PayPal signup flow (fixed Mar 2026)
- Admin panel (opportunities, users, invoices, coupons)
- Email notifications (Mailgun sandbox)
- Free plan: 50 curated constant opportunities, 1 project limit
- Paid plans: Full access with cursor-based pagination (100/page)
- Project management with opportunity tracking
- Activity logs & analytics

## What's Been Implemented
- [Mar 2026] Admin password reset email system: individual + bulk send, secure token-based reset page, 24h expiry
- [Mar 2026] Activity Log: admin CRUD + read-only view for all users, timeline UI
- [Mar 2026] Comprehensive SEO: sitemap.xml (1361 URLs), robots.txt, JSON-LD (Organization, WebSite, FAQ, Product), dynamic meta per opportunity, canonical URLs, noindex on auth, manifest.json
- [Mar 2026] SEO-friendly slug URLs for all opportunities (e.g., `/opportunities/microsoft-backlink`)
- [Mar 2026] "View Platform" demo mode: auto-login to browse 20 opportunities without signup
- [Mar 2026] Fixed Free Plan: top 20 by DA dynamically, skip client-side filtering for free users
- [Mar 2026] PayPal signup bug fix: safer flow (create user before capture)
- [Mar 2026] Cursor-based pagination: useInfiniteQuery with 100/page "Load More"
- [Earlier] Stripe signup fix, email system, invoice management, free plan limits

## Prioritized Backlog
### P0
- (none currently)

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
- Free user: toms@uprankd.com / password
- Mailgun: sandbox mode (only authorized recipients)

## Key Files
- `/app/lib/api/routers/opportunity.ts` - Opportunity API with free plan + pagination
- `/app/lib/api/routers/payment.ts` - Stripe + PayPal payment logic
- `/app/app/(auth)/signup/page.tsx` - Signup with payment selection
- `/app/app/(dashboard)/opportunities/page.tsx` - Main opportunities page with infinite scroll
- `/app/lib/mailgun.ts` - Email templates and sending
- `/app/lib/api/routers/admin.ts` - Admin endpoints
