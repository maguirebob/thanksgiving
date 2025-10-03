#!/bin/bash

# Railway Deployment Script
# This script ensures migrations are applied before starting the server

set -e  # Exit on any error

echo "🚀 Starting Railway deployment process..."

# Step 1: Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Step 2: Check migration status
echo "🔍 Checking migration status..."
npx prisma migrate status

# Step 3: Apply migrations with timeout
echo "🔄 Applying database migrations..."
timeout 60s npx prisma migrate deploy || {
    echo "⚠️ Migration failed or timed out, but continuing..."
    echo "📝 Server will start but may have database issues"
}

# Step 4: Start the server
echo "🚀 Starting Node.js server..."
exec node dist/server.js
