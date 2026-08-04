# Test Credentials for RankdSEO

## Preview Environment
Database: Supabase PostgreSQL (Session Pooler)

### Admin Account
- Email: `admin@rankseo.com`
- Password: `password`
- Role: ADMIN
- Status: ✅ Created via seed script

### Test User Account  
- Email: `toms@uprankd.com`
- Password: `password`
- Role: USER
- Status: ✅ Created via seed script

### Demo User Account
- Auto-login via `/demo` route
- Read-only access
- Status: ✅ Created via seed script

## Production Environment
**⚠️ NOT YET SEEDED**

You need to:
1. Set DATABASE_URL in production secrets
2. Run seed script in production
3. Test login with admin@rankseo.com / password

## Notes
- All passwords are bcrypt hashed
- Email verification is pre-confirmed
- Admin has LIFETIME subscription pre-configured
- Test user has FREE plan
