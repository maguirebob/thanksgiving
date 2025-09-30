#!/bin/bash

# Deployment script with automatic database migrations
# Usage: ./scripts/deploy.sh [environment]

set -e  # Exit on any error

ENVIRONMENT=${1:-production}
echo "🚀 Deploying to $ENVIRONMENT environment..."

# Function to run migrations
run_migrations() {
    echo "📊 Running database migrations..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "⚠️  Production migration - using migrate deploy"
        npx prisma migrate deploy
    else
        echo "🔧 Development migration - using migrate dev"
        npx prisma migrate dev
    fi
    
    echo "✅ Database migrations completed"
}

# Function to verify deployment
verify_deployment() {
    echo "🔍 Verifying deployment..."
    
    # Check if migrations were applied
    npx prisma migrate status
    
    # Check database connection
    npx prisma db execute --stdin <<< "SELECT 1;"
    
    echo "✅ Deployment verification completed"
}

# Main deployment flow
main() {
    echo "📦 Starting deployment process..."
    
    # Run migrations
    run_migrations
    
    # Verify deployment
    verify_deployment
    
    echo "🎉 Deployment to $ENVIRONMENT completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Test the application"
    echo "2. Check logs for any issues"
    echo "3. Monitor performance"
}

# Run main function
main "$@"
