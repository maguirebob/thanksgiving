#!/bin/bash

# Test Environment Database Backup Script
# This script creates a backup of the test environment database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛡️  Test Environment Database Backup${NC}"
echo "=========================================="

# Check if we're in Railway environment
if [ -z "$RAILWAY_ENVIRONMENT" ]; then
    echo -e "${RED}❌ This script must be run in Railway environment${NC}"
    exit 1
fi

if [ "$RAILWAY_ENVIRONMENT" != "Test" ]; then
    echo -e "${RED}❌ This script is for Test environment only${NC}"
    echo -e "${YELLOW}   Current environment: $RAILWAY_ENVIRONMENT${NC}"
    exit 1
fi

# Create backup
BACKUP_NAME="test_env_backup_$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="/tmp/${BACKUP_NAME}.sql"

echo -e "${GREEN}📦 Creating test environment backup: ${BACKUP_NAME}${NC}"

# Create backup using pg_dump
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup created successfully: ${BACKUP_FILE}${NC}"
    echo -e "${GREEN}   Backup size: ${BACKUP_SIZE}${NC}"
    
    # Display backup info
    echo -e "${GREEN}📊 Backup Information:${NC}"
    echo -e "${GREEN}   Environment: $RAILWAY_ENVIRONMENT${NC}"
    echo -e "${GREEN}   Service: $RAILWAY_SERVICE_NAME${NC}"
    echo -e "${GREEN}   Backup file: $BACKUP_FILE${NC}"
    echo -e "${GREEN}   Backup size: $BACKUP_SIZE${NC}"
    
    # Show first few lines of backup
    echo -e "${GREEN}📋 Backup preview (first 10 lines):${NC}"
    head -10 "$BACKUP_FILE"
    
    echo -e "${GREEN}✅ Test environment backup completed successfully!${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi
