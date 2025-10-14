#!/bin/bash

# Production Database Protection Script
# This script provides safeguards for Railway production/test environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🚨 PRODUCTION DATABASE PROTECTION SCRIPT 🚨${NC}"
echo "=============================================="

# Function to detect environment
detect_environment() {
    if [ -n "$RAILWAY_ENVIRONMENT" ]; then
        echo "$RAILWAY_ENVIRONMENT"
    elif [ -n "$NODE_ENV" ]; then
        echo "$NODE_ENV"
    else
        echo "unknown"
    fi
}

# Function to get production database URL
get_production_db_url() {
    if [ -n "$DATABASE_URL" ]; then
        echo "$DATABASE_URL"
    else
        echo -e "${RED}❌ DATABASE_URL not found! Cannot proceed safely.${NC}"
        exit 1
    fi
}

# Function to create production backup
create_production_backup() {
    local env=$(detect_environment)
    local backup_name="production_backup_${env}_$(date +%Y%m%d_%H%M%S)"
    local backup_file="./archive/${backup_name}.sql"
    
    echo -e "${YELLOW}⚠️  Creating backup for ${env} environment...${NC}"
    
    # Create backup directory if it doesn't exist
    mkdir -p ./archive
    
    # Get database URL
    local db_url=$(get_production_db_url)
    
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

# Function to check production database status
check_production_status() {
    local env=$(detect_environment)
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

# Function to warn about dangerous operations
warn_dangerous_operations() {
    echo -e "${RED}🚨 DANGEROUS OPERATIONS DETECTED! 🚨${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  The following operations can DESTROY production data:${NC}"
    echo "   • npx prisma migrate reset"
    echo "   • npx prisma migrate reset --force"
    echo "   • npm run db:reset"
    echo "   • Any direct database DROP/CLEAR operations"
    echo ""
    echo -e "${GREEN}✅ SAFE alternatives:${NC}"
    echo "   • npm run prod:backup (create backup first)"
    echo "   • npm run prod:safe-migrate (backup + migrate)"
    echo "   • Use Railway dashboard for safe operations"
    echo ""
    echo -e "${BLUE}📋 Recovery procedures:${NC}"
    echo "   1. Stop all operations immediately"
    echo "   2. Check backups: npm run prod:list"
    echo "   3. Restore from backup if needed"
    echo "   4. Contact admin if data is lost"
}

# Main script logic
case "$1" in
    "backup")
        create_production_backup
        ;;
    "status")
        check_production_status
        ;;
    "warn")
        warn_dangerous_operations
        ;;
    "help"|"--help"|"-h")
        echo "Production Database Protection Script"
        echo ""
        echo "Usage:"
        echo "  ./prod-protect.sh backup    - Create production backup"
        echo "  ./prod-protect.sh status    - Check production database status"
        echo "  ./prod-protect.sh warn      - Show dangerous operations warning"
        echo "  ./prod-protect.sh help      - Show this help"
        echo ""
        echo "Environment Detection:"
        echo "  RAILWAY_ENVIRONMENT or NODE_ENV determines target environment"
        echo ""
        echo "Safety Features:"
        echo "  • Automatic environment detection"
        echo "  • Backup verification"
        echo "  • Dangerous operation warnings"
        echo "  • Recovery procedures"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Use './prod-protect.sh help' for usage information"
        exit 1
        ;;
esac



