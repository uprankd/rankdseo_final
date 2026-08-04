#!/bin/bash
# Production Database Seeding Script
# Run this AFTER deploying to production with correct DATABASE_URL

echo "🌱 Starting Production Database Seed..."
echo ""
echo "⚠️  IMPORTANT: Make sure DATABASE_URL in production points to your production database!"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    echo "Please set it in your production environment or Emergent dashboard secrets."
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Run Prisma migrations (creates tables if they don't exist)
echo "📊 Running database migrations..."
npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo "❌ Migration failed!"
    exit 1
fi

echo "✅ Migrations complete"
echo ""

# Run seed script
echo "🌱 Seeding database with:"
echo "   - Subscription Plans (Free, Weekly, Monthly, Yearly, Lifetime)"
echo "   - Admin user (admin@rankseo.com)"  
echo "   - Test user (toms@uprankd.com)"
echo "   - Demo user"
echo "   - Backlink opportunities"
echo "   - Instructions & tutorials"
echo ""

npx prisma db seed
if [ $? -ne 0 ]; then
    echo "❌ Seeding failed!"
    exit 1
fi

echo ""
echo "✅ Database seeded successfully!"
echo ""
echo "📝 Test Credentials:"
echo "   Admin: admin@rankseo.com / password"
echo "   User:  toms@uprankd.com / password"
echo ""
echo "🎉 Production database is ready!"
