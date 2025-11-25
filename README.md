# RankdSEO - SaaS Backlink Management Platform

A comprehensive backlink opportunity database with step-by-step guides and SEO metrics, designed for website owners and SEO agencies.

## Features

### ✅ Implemented (MVP)
- **User Authentication** - Sign up/Sign in with NextAuth.js
- **Backlink Opportunities Database** - 21+ curated opportunities with:
  - SEO metrics (DA, DR, Traffic, Spam Score)
  - Step-by-step instructions
  - Filtering and search
  - Real-time search with debouncing
- **Project Management** - Create and manage multiple projects
- **Status Tracking** - 5-state workflow (Not Started, In Progress, Submitted, Approved, Rejected)
- **3-Tier Subscription System** - Free (50 opps, 1 project), Basic ($29, 1000 opps, 5 projects), Pro ($99, unlimited)
- **Dashboard** - Stats, recent projects, quick actions
- **Activity Logging** - Track all project and opportunity changes

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: tRPC for type-safe APIs
- **Database**: PostgreSQL 15 with Prisma ORM
- **Authentication**: NextAuth.js v5
- **State Management**: TanStack Query (React Query)
- **Validation**: Zod
- **UI Components**: shadcn/ui (Radix UI + Tailwind)

## Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- PostgreSQL 15
- Redis 7 (for future background jobs)

### Installation

1. **Clone and install dependencies:**
```bash
cd /app
yarn install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Update DATABASE_URL and other variables
```

3. **Start PostgreSQL and Redis:**
```bash
# Already running via services
sudo service postgresql status
sudo service redis-server status
```

4. **Run database migrations:**
```bash
npx prisma generate
npx prisma migrate dev
```

5. **Seed the database:**
```bash
node prisma/seed.js
```

6. **Start the development server:**
```bash
yarn dev
```

Visit http://localhost:3000

## Demo Credentials

**Admin Account:**
- Email: `admin@rankseo.com`
- Password: `Admin123!`

## Database Schema

- **Users** - Authentication and user profiles
- **Plans** - Free, Basic, Pro subscription plans
- **Subscriptions** - User subscription management
- **Projects** - User-created backlink projects
- **BacklinkOpportunities** - Curated opportunities with metrics
- **OpportunityInstructions** - Step-by-step guides for each opportunity
- **ProjectOpportunities** - Opportunities added to projects with status tracking
- **ActivityLogs** - Audit trail of all actions

## Project Structure

```
/app
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   │   ├── signin/
│   │   └── signup/
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── dashboard/       # Home dashboard
│   │   ├── projects/        # Projects list
│   │   └── opportunities/   # Opportunities browser
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth API route
│   │   └── trpc/[trpc]/         # tRPC API handler
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Landing page
├── lib/
│   ├── api/                 # tRPC routers and configuration
│   │   ├── routers/         # API route handlers
│   │   ├── trpc.ts          # tRPC setup
│   │   └── root.ts          # Root router
│   ├── auth/                # NextAuth configuration
│   └── db/                  # Prisma client
├── components/
│   └── ui/                  # shadcn/ui components
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.js              # Seed data
└── types/                   # TypeScript type definitions
```

## API Routes (tRPC)

### Auth
- `auth.signUp` - Create new user account

### User
- `user.getProfile` - Get current user profile
- `user.updateProfile` - Update user information
- `user.updatePassword` - Change password

### Subscription
- `subscription.getCurrent` - Get current subscription
- `subscription.getPlans` - List all available plans
- `subscription.getUsageStats` - Get current usage vs limits

### Project
- `project.list` - List all user projects
- `project.getById` - Get project details
- `project.create` - Create new project
- `project.update` - Update project
- `project.delete` - Delete project
- `project.getStats` - Get project statistics

### Opportunity
- `opportunity.list` - List opportunities with filters
- `opportunity.getById` - Get opportunity details
- `opportunity.addToProject` - Add opportunity to project
- `opportunity.removeFromProject` - Remove from project
- `opportunity.updateStatus` - Update opportunity status
- `opportunity.getFilters` - Get available filter options

## Environment Variables

Required variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://rankseo:dev_password@localhost:5432/rankseo"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Redis (for background jobs)
REDIS_URL="redis://localhost:6379"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Stripe (Test Mode - Optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## Development

### Adding New Opportunities

Edit `prisma/seed.js` to add more backlink opportunities to the database.

### Database Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# View database in Prisma Studio
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

## Testing

### Manual Testing Checklist

1. **Authentication**
   - [ ] Sign up with new account
   - [ ] Sign in with existing account
   - [ ] Sign out

2. **Dashboard**
   - [ ] View dashboard stats
   - [ ] See recent projects

3. **Projects**
   - [ ] Create new project
   - [ ] View project list
   - [ ] View project details

4. **Opportunities**
   - [ ] Browse opportunities
   - [ ] Search opportunities
   - [ ] View opportunity details
   - [ ] Add opportunity to project

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Database Setup

Use PostgreSQL hosting:
- Neon (recommended)
- Supabase
- Railway

## Roadmap

### Phase 2 (Not Implemented)
- Background jobs for metrics updates
- Email notifications
- CSV export for Pro users
- Advanced filtering UI
- Suggested opportunities

### Phase 3 (Future)
- Stripe payment integration
- Admin panel for CRUD
- Analytics dashboard
- API access for Pro users

## License

Proprietary - All rights reserved

## Support

For issues or questions, please contact support or create an issue in the repository.

---

Built with ❤️ using Next.js, Prisma, and tRPC
