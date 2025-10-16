#!/bin/bash

# Production Database Backup Script
# Creates a backup of the production database before any deployment

set -e  # Exit on any error

echo "🔄 Creating Production Database Backup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}ℹ️${NC} $1"; }
log_success() { echo -e "${GREEN}✅${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable not set"
    log_info "Please set DATABASE_URL to your production database connection string"
    exit 1
fi

# Create backup filename with timestamp
backup_name="production_backup_$(date +%Y%m%d_%H%M%S)"
backup_file="backups/${backup_name}.sql"

# Create backups directory if it doesn't exist
mkdir -p backups

log_info "Creating backup: $backup_file"

# Create the backup
if pg_dump "$DATABASE_URL" > "$backup_file"; then
    log_success "Production backup created successfully!"
    log_info "Backup file: $backup_file"
    
    # Get file size
    file_size=$(du -h "$backup_file" | cut -f1)
    log_info "Backup size: $file_size"
    
    # Create a symlink to latest backup
    ln -sf "$backup_file" "backups/latest_production_backup.sql"
    log_info "Latest backup symlink created: backups/latest_production_backup.sql"
    
else
    log_error "Failed to create production backup"
    exit 1
fi

log_success "Production database backup completed successfully!"
log_warning "Keep this backup safe - it contains all production data"
