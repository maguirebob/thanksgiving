#!/bin/bash

# Database Protection Script
# This script provides safeguards against accidental data loss

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛡️  Database Protection Script${NC}"
echo "=================================="

# Function to create backup
create_backup() {
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    local backup_file="./archive/${backup_name}.sql"
    
    echo -e "${GREEN}📦 Creating database backup: ${backup_name}${NC}"
    
    # Create backup directory if it doesn't exist
    mkdir -p ./archive
    
    # Create backup
    pg_dump postgresql://bobmaguire@localhost:5432/bobmaguire > "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup created successfully: ${backup_file}${NC}"
        echo "   Backup size: $(du -h "$backup_file" | cut -f1)"
    else
        echo -e "${RED}❌ Backup failed!${NC}"
        exit 1
    fi
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ Backup file not found: ${backup_file}${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  WARNING: This will replace ALL data in your database!${NC}"
    echo -e "${YELLOW}   Backup file: ${backup_file}${NC}"
    echo -e "${YELLOW}   Are you sure you want to continue? (yes/no)${NC}"
    
    read -r confirmation
    if [ "$confirmation" != "yes" ]; then
        echo -e "${GREEN}✅ Restore cancelled${NC}"
        exit 0
    fi
    
    echo -e "${GREEN}🔄 Restoring database from backup...${NC}"
    psql postgresql://bobmaguire@localhost:5432/bobmaguire < "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database restored successfully!${NC}"
    else
        echo -e "${RED}❌ Restore failed!${NC}"
        exit 1
    fi
}

# Function to list available backups
list_backups() {
    echo -e "${GREEN}📋 Available backups:${NC}"
    if [ -d "./archive" ]; then
        ls -la ./archive/*.sql 2>/dev/null | while read -r line; do
            echo "   $line"
        done
    else
        echo "   No backups found"
    fi
}

# Function to check database status
check_status() {
    echo -e "${GREEN}📊 Database Status:${NC}"
    
    # Count records
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
            
            await prisma.\$disconnect();
        } catch (error) {
            console.error('   Error:', error.message);
        }
    }
    
    checkStatus();
    "
}

# Main script logic
case "$1" in
    "backup")
        create_backup
        ;;
    "restore")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Please specify backup file: ./db-protect.sh restore <backup_file>${NC}"
            exit 1
        fi
        restore_backup "$2"
        ;;
    "list")
        list_backups
        ;;
    "status")
        check_status
        ;;
    "help"|"--help"|"-h")
        echo "Database Protection Script"
        echo ""
        echo "Usage:"
        echo "  ./db-protect.sh backup          - Create a new backup"
        echo "  ./db-protect.sh restore <file>  - Restore from backup"
        echo "  ./db-protect.sh list            - List available backups"
        echo "  ./db-protect.sh status          - Check database status"
        echo "  ./db-protect.sh help            - Show this help"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Use './db-protect.sh help' for usage information"
        exit 1
        ;;
esac

