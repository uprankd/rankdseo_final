#!/bin/bash

echo "🔍 Starting database initialization..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL..."
    apt-get update > /dev/null 2>&1
    apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
    echo "✅ PostgreSQL installed"
fi

# Start PostgreSQL
if ! pgrep -x postgres > /dev/null; then
    echo "🚀 Starting PostgreSQL..."
    service postgresql start > /dev/null 2>&1
    sleep 3
fi

# Check if database exists
DB_EXISTS=$(sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -w rankseo | wc -l)

if [ "$DB_EXISTS" -eq "0" ]; then
    echo "📊 Creating database and user..."
    sudo -u postgres psql -c "CREATE USER rankseo WITH PASSWORD 'dev_password' CREATEDB;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE rankseo OWNER rankseo;" 2>/dev/null || true
    echo "✅ Database created"
fi

# Run migrations
echo "🔄 Running migrations..."
cd /app && npx prisma migrate deploy > /dev/null 2>&1

# Check if admin user exists
ADMIN_EXISTS=$(sudo -u postgres psql -d rankseo -t -c "SELECT COUNT(*) FROM \"User\" WHERE email = 'admin@rankseo.com';" 2>/dev/null | tr -d '[:space:]')

if [ "$ADMIN_EXISTS" != "1" ]; then
    echo "🌱 Seeding database..."
    cd /app && node prisma/seed.js > /dev/null 2>&1
    echo "✅ Database seeded"
else
    echo "✅ Database ready"
fi

echo "🎉 Startup complete!"
