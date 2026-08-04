#!/bin/bash
# Seed Supabase Production Database
# Run this on your LOCAL machine (not in preview)

echo "🌱 RankdSEO Production Database Seeder"
echo "======================================"
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: DATABASE_URL required"
    echo ""
    echo "Usage:"
    echo "  ./seed-supabase-production.sh 'postgresql://postgres.xxxxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres'"
    echo ""
    echo "Get your connection string from:"
    echo "  Supabase Dashboard → Settings → Database → Connection string (Session Pooler)"
    echo ""
    exit 1
fi

DATABASE_URL="$1"

echo "✅ Database URL provided"
echo ""

# Check if we have the necessary files
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: prisma/schema.prisma not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

if [ ! -f "prisma/seed.js" ]; then
    echo "❌ Error: prisma/seed.js not found"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install --silent @prisma/client bcrypt

echo ""
echo "🔧 Generating Prisma client..."
export DATABASE_URL="$DATABASE_URL"
npx prisma generate --silent

echo ""
echo "📊 Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Migration warning (this is OK if tables already exist)"
    echo "Proceeding with seed..."
fi

echo ""
echo "🌱 Seeding database..."
npx prisma db seed

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Production database seeded successfully!"
    echo ""
    echo "📊 Created:"
    echo "   - 4 Subscription Plans (Weekly, Monthly, Yearly, Lifetime)"
    echo "   - Admin user: admin@rankseo.com"
    echo "   - Test user: toms@uprankd.com"
    echo "   - 147+ Backlink opportunities"
    echo ""
    echo "🔐 Login credentials:"
    echo "   Email: admin@rankseo.com"
    echo "   Password: password"
    echo ""
    echo "🎉 Your production database is ready!"
else
    echo ""
    echo "❌ Seeding failed!"
    echo "Check the error messages above"
    exit 1
fi
