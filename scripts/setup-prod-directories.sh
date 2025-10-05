#!/bin/bash

# Script to create necessary directories in production environment
# This ensures production has the same directory structure as test

echo "🚀 Setting up directories for production environment..."

# Create necessary directories
echo "📁 Creating /app/uploads directory..."
railway run mkdir -p /app/uploads

echo "📁 Creating /app/uploads/photos directory..."
railway run mkdir -p /app/uploads/photos

echo "📁 Creating /app/public/images directory..."
railway run mkdir -p /app/public/images

# Verify directories exist
echo "🔍 Verifying directories exist..."
railway run test -d /app/uploads && echo "✅ /app/uploads exists"
railway run test -d /app/uploads/photos && echo "✅ /app/uploads/photos exists"
railway run test -d /app/public/images && echo "✅ /app/public/images exists"

echo "🎉 Directory setup complete!"
echo ""
echo "Next steps:"
echo "1. Test photo upload functionality"
echo "2. Verify photos page loads correctly"
echo "3. Check admin dashboard photo management"
