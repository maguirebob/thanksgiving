#!/bin/bash

# Script to run migrations against Railway test environment
# This requires the Railway test DATABASE_URL to be set

set -e

echo "🚀 Running migrations against Railway test environment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "💡 You need to set DATABASE_URL to the Railway test database connection string"
    echo "   Example: export DATABASE_URL='postgresql://user:pass@host:port/db'"
    echo "   Get this from Railway dashboard > Test project > Database > Connect"
    exit 1
fi

echo "📊 Using database: ${DATABASE_URL}"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Check migration status
echo "🔍 Checking migration status..."
npx prisma migrate status

# Apply migrations
echo "🔄 Applying migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed successfully!"

# Verify the schema
echo "🔍 Verifying database schema..."
npx prisma db pull --print
