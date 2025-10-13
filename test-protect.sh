#!/bin/bash

# Test Environment Database Protection Script
# This script provides safeguards for Railway test environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🧪 TEST ENVIRONMENT DATABASE PROTECTION SCRIPT 🧪${NC}"
echo "================================================"

# Function to detect test environment
detect_test_environment() {
    if [ "$RAILWAY_ENVIRONMENT" = "test" ] || [ "$NODE_ENV" = "test" ]; then
        echo "test"
    elif [ -n "$RAILWAY_ENVIRONMENT" ]; then
        echo "$RAILWAY_ENVIRONMENT"
    elif [ -n "$NODE_ENV" ]; then
        echo "$NODE_ENV"
    else
        echo "unknown"
    fi
}

# Function to get test database URL
get_test_db_url() {
    if [ -n "$DATABASE_URL" ]; then
        echo "$DATABASE_URL"
    else
        echo -e "${RED}❌ DATABASE_URL not found! Cannot proceed safely.${NC}"
        exit 1
    fi
}

# Function to create test backup
create_test_backup() {
    local env=$(detect_test_environment)
    local backup_name="test_backup_${env}_$(date +%Y%m%d_%H%M%S)"
    local backup_file="./archive/${backup_name}.sql"
    
    echo -e "${YELLOW}⚠️  Creating backup for ${env} environment...${NC}"
    
    # Create backup directory if it doesn't exist
    mkdir -p ./archive
    
    # Get database URL
    local db_url=$(get_test_db_url)
    
    # Create backup
    echo -e "${BLUE}📦 Backing up ${env} database...${NC}"
    pg_dump "$db_url" > "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${env} backup created successfully: ${backup_file}${NC}"
        echo "   Backup size: $(du -h "$backup_file" | cut -f1)"
        echo "   Environment: $env"
        echo "   Timestamp: $(date)"
    else
        echo -e "${RED}❌ ${env} backup failed!${NC}"
        exit 1
    fi
}

# Function to check test database status
check_test_status() {
    local env=$(detect_test_environment)
    echo -e "${GREEN}📊 ${env} Database Status:${NC}"
    
    # Use Node.js to check via Prisma
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function checkStatus() {
        try {
            const eventCount = await prisma.event.count();
            const photoCount = await prisma.photo.count();
            const blogCount = await prisma.blogPost.count();
            const userCount = await prisma.user.count();
            
            console.log('   Events:', eventCount);
            console.log('   Photos:', photoCount);
            console.log('   Blogs:', blogCount);
            console.log('   Users:', userCount);
            console.log('   Environment:', process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'unknown');
            
            await prisma.\$disconnect();
        } catch (error) {
            console.error('   Error:', error.message);
        }
    }
    
    checkStatus();
    "
}

# Function to warn about test environment operations
warn_test_operations() {
    echo -e "${CYAN}🧪 TEST ENVIRONMENT OPERATIONS WARNING 🧪${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Test environment operations:${NC}"
    echo "   • Test data should be preserved for consistency"
    echo "   • Test environment mirrors production structure"
    echo "   • Lost test data requires recreation from production"
    echo ""
    echo -e "${RED}🚨 DANGEROUS operations for test environment:${NC}"
    echo "   • npx prisma migrate reset"
    echo "   • npx prisma migrate reset --force"
    echo "   • npm run db:reset"
    echo "   • Any direct database DROP/CLEAR operations"
    echo ""
    echo -e "${GREEN}✅ SAFE alternatives for test:${NC}"
    echo "   • npm run test:backup (create backup first)"
    echo "   • npm run test:safe-migrate (backup + migrate)"
    echo "   • Use Railway dashboard for safe operations"
    echo "   • Test changes locally before applying to test"
    echo ""
    echo -e "${BLUE}📋 Test environment recovery:${NC}"
    echo "   1. Stop all operations immediately"
    echo "   2. Check backups: npm run test:list"
    echo "   3. Restore from backup if needed"
    echo "   4. Recreate test data from production if necessary"
}

# Function to sync test data from production
sync_from_production() {
    echo -e "${BLUE}🔄 Syncing test data from production...${NC}"
    echo -e "${YELLOW}⚠️  This will replace test data with production data${NC}"
    echo -e "${YELLOW}   Are you sure you want to continue? (yes/no)${NC}"
    
    read -r confirmation
    if [ "$confirmation" != "yes" ]; then
        echo -e "${GREEN}✅ Sync cancelled${NC}"
        exit 0
    fi
    
    # Create backup before sync
    create_test_backup
    
    echo -e "${BLUE}📦 Production sync would happen here${NC}"
    echo -e "${YELLOW}   (Implementation depends on your sync method)${NC}"
    echo -e "${GREEN}✅ Test environment ready for sync${NC}"
}

# Main script logic
case "$1" in
    "backup")
        create_test_backup
        ;;
    "status")
        check_test_status
        ;;
    "warn")
        warn_test_operations
        ;;
    "sync")
        sync_from_production
        ;;
    "help"|"--help"|"-h")
        echo "Test Environment Database Protection Script"
        echo ""
        echo "Usage:"
        echo "  ./test-protect.sh backup    - Create test environment backup"
        echo "  ./test-protect.sh status    - Check test database status"
        echo "  ./test-protect.sh warn      - Show test operations warning"
        echo "  ./test-protect.sh sync      - Sync test data from production"
        echo "  ./test-protect.sh help      - Show this help"
        echo ""
        echo "Environment Detection:"
        echo "  RAILWAY_ENVIRONMENT=test or NODE_ENV=test determines target"
        echo ""
        echo "Safety Features:"
        echo "  • Automatic test environment detection"
        echo "  • Backup verification"
        echo "  • Test-specific operation warnings"
        echo "  • Production sync capabilities"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Use './test-protect.sh help' for usage information"
        exit 1
        ;;
esac

