#!/bin/bash

# Railway Safe Deployment Script
# Ensures backups are created before any Railway deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚂 Railway Safe Deployment Script${NC}"
echo "=================================="

# Function to check if we're in Railway environment
check_railway_environment() {
    if [ -n "$RAILWAY_ENVIRONMENT" ]; then
        echo -e "${GREEN}✅ Railway environment detected: $RAILWAY_ENVIRONMENT${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Not in Railway environment - using local protection${NC}"
        return 1
    fi
}

# Function to create backup before deployment
create_deployment_backup() {
    local env=$(echo ${RAILWAY_ENVIRONMENT:-"local"})
    echo -e "${YELLOW}📦 Creating backup before deployment to $env...${NC}"
    
    if check_railway_environment; then
        # Production/test environment
        npm run prod:backup
    else
        # Local environment
        npm run db:backup
    fi
}

# Function to run safe migration
run_safe_migration() {
    local env=$(echo ${RAILWAY_ENVIRONMENT:-"local"})
    echo -e "${BLUE}🔄 Running safe migration for $env...${NC}"
    
    if check_railway_environment; then
        # Production/test environment - use deploy (not dev)
        npm run prod:safe-migrate
    else
        # Local environment
        npm run db:safe-reset
    fi
}

# Function to deploy with safety checks
safe_deploy() {
    echo -e "${GREEN}🚀 Starting safe deployment process...${NC}"
    
    # Step 1: Create backup
    create_deployment_backup
    
    # Step 2: Build application
    echo -e "${BLUE}🔨 Building application...${NC}"
    npm run build
    
    # Step 3: Run safe migration
    run_safe_migration
    
    # Step 4: Start application
    echo -e "${GREEN}✅ Safe deployment complete!${NC}"
    echo -e "${GREEN}   Backup created before deployment${NC}"
    echo -e "${GREEN}   Application built successfully${NC}"
    echo -e "${GREEN}   Database migrated safely${NC}"
}

# Function to show deployment status
show_status() {
    echo -e "${BLUE}📊 Deployment Status:${NC}"
    
    if check_railway_environment; then
        npm run prod:status
    else
        npm run db:check
    fi
}

# Main script logic
case "$1" in
    "deploy")
        safe_deploy
        ;;
    "backup")
        create_deployment_backup
        ;;
    "migrate")
        run_safe_migration
        ;;
    "status")
        show_status
        ;;
    "help"|"--help"|"-h")
        echo "Railway Safe Deployment Script"
        echo ""
        echo "Usage:"
        echo "  ./railway-safe.sh deploy   - Safe deployment with backup"
        echo "  ./railway-safe.sh backup   - Create backup before changes"
        echo "  ./railway-safe.sh migrate - Run safe migration"
        echo "  ./railway-safe.sh status  - Show deployment status"
        echo "  ./railway-safe.sh help    - Show this help"
        echo ""
        echo "Safety Features:"
        echo "  • Automatic environment detection"
        echo "  • Backup creation before deployment"
        echo "  • Safe migration procedures"
        echo "  • Production data protection"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Use './railway-safe.sh help' for usage information"
        exit 1
        ;;
esac

