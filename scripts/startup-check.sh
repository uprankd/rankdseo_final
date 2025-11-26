#!/bin/bash

echo "🔍 Checking database status..."

# Wait for PostgreSQL to be ready
sleep 5

# Check if admin user exists
ADMIN_EXISTS=$(sudo -u postgres psql -d rankseo -t -c "SELECT COUNT(*) FROM \"User\" WHERE email = 'admin@rankseo.com';" 2>/dev/null || echo "0")

if [ "$ADMIN_EXISTS" -eq "0" ] || [ -z "$ADMIN_EXISTS" ]; then
    echo "⚠️  Admin user not found. Running seed script..."
    cd /app && node prisma/seed.js
    echo "✅ Database seeded successfully"
else
    echo "✅ Admin user exists. Skipping seed."
fi
