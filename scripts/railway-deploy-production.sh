#!/bin/bash

# Enhanced Railway Production Deployment Script
# This script provides comprehensive migration safety for production

set -e  # Exit on any error

echo "🚀 Starting Railway PRODUCTION deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to log with colors
log_info() { echo -e "${BLUE}ℹ️${NC} $1"; }
log_success() { echo -e "${GREEN}✅${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }
log_step() { echo -e "${CYAN}🚀${NC} $1"; }

# Function to create production backup before migration
create_production_backup() {
    log_step "Creating production database backup..."
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL not set - cannot create backup"
        exit 1
    fi
    
    local backup_name="prod_backup_$(date +%Y%m%d_%H%M%S)"
    local backup_file="/tmp/${backup_name}.sql"
    
    # Create backup
    pg_dump "$DATABASE_URL" > "$backup_file" || {
        log_error "Backup creation failed!"
        exit 1
    }
    
    log_success "Production backup created: $backup_file"
    echo "BACKUP_FILE=$backup_file" >> /tmp/prod_backup_info.env
}

# Function to validate migration files
validate_migrations() {
    log_step "Validating migration files..."
    
    # Check if migration directory exists
    if [ ! -d "prisma/migrations" ]; then
        log_error "Migration directory not found!"
        exit 1
    fi
    
    # Check for syntax errors in migration files
    for migration_dir in prisma/migrations/*/; do
        if [ -f "${migration_dir}migration.sql" ]; then
            # Basic SQL syntax check
            if ! grep -q ";" "${migration_dir}migration.sql"; then
                log_warning "Migration ${migration_dir} may have syntax issues"
            fi
        fi
    done
    
    log_success "Migration files validated"
}

# Function to check migration status with detailed output
check_migration_status() {
    log_step "Checking migration status..."
    
    local status_output
    status_output=$(npx prisma migrate status 2>&1) || {
        log_error "Migration status check failed!"
        echo "$status_output"
        exit 1
    }
    
    echo "$status_output"
    
    # Check for failed migrations
    if echo "$status_output" | grep -q "failed"; then
        log_error "Failed migrations detected!"
        echo "$status_output"
        exit 1
    fi
    
    log_success "Migration status check passed"
}

# Function to apply migrations with comprehensive error handling
apply_migrations() {
    log_step "Applying database migrations..."
    
    # Create backup before migration
    create_production_backup
    
    # Apply migrations with detailed logging
    local migration_output
    migration_output=$(npx prisma migrate deploy 2>&1) || {
        log_error "Migration application failed!"
        echo "$migration_output"
        
        # Attempt to restore from backup
        log_warning "Attempting to restore from backup..."
        restore_from_backup
        
        exit 1
    }
    
    echo "$migration_output"
    log_success "Migrations applied successfully"
}

# Function to restore from backup
restore_from_backup() {
    if [ -f "/tmp/prod_backup_info.env" ]; then
        source /tmp/prod_backup_info.env
        
        if [ -f "$BACKUP_FILE" ]; then
            log_warning "Restoring database from backup..."
            psql "$DATABASE_URL" < "$BACKUP_FILE" || {
                log_error "Backup restoration failed!"
                exit 1
            }
            log_success "Database restored from backup"
        else
            log_error "Backup file not found!"
        fi
    else
        log_error "No backup information available!"
    fi
}

# Function to verify migration success
verify_migration_success() {
    log_step "Verifying migration success..."
    
    # Check if all migrations are applied
    local status_output
    status_output=$(npx prisma migrate status 2>&1)
    
    if echo "$status_output" | grep -q "Database is up to date"; then
        log_success "All migrations successfully applied"
    else
        log_error "Migration verification failed!"
        echo "$status_output"
        exit 1
    fi
    
    # Verify critical tables exist
    local critical_tables=("Users" "events" "Photos" "JournalSections" "JournalContentItems")
    
    for table in "${critical_tables[@]}"; do
        local table_check
        table_check=$(npx prisma db execute --stdin <<< "SELECT 1 FROM \"$table\" LIMIT 1;" 2>&1) || {
            log_error "Critical table '$table' not accessible!"
            exit 1
        }
        log_success "Table '$table' verified"
    done
}

# Function to generate Prisma client
generate_prisma_client() {
    log_step "Generating Prisma client..."
    
    npx prisma generate || {
        log_error "Prisma client generation failed!"
        exit 1
    }
    
    log_success "Prisma client generated"
}

# Function to start server with health check
start_server() {
    log_step "Starting Node.js server..."
    
    # Start server in background
    node dist/server.js &
    local server_pid=$!
    
    # Wait for server to start
    sleep 5
    
    # Health check
    local health_check
    health_check=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/health" || echo "000")
    
    if [ "$health_check" = "200" ]; then
        log_success "Server started successfully (PID: $server_pid)"
        wait $server_pid
    else
        log_error "Server health check failed (Status: $health_check)"
        kill $server_pid 2>/dev/null || true
        exit 1
    fi
}

# Function to validate build
validate_build() {
    log_step "Validating TypeScript build..."
    
    # Check if dist directory exists
    if [ ! -d "dist" ]; then
        log_error "Build directory 'dist' not found!"
        log_info "Running build process..."
        npm run build || {
            log_error "Build failed!"
            exit 1
        }
    else
        log_info "Build directory exists, validating TypeScript..."
        npx tsc --noEmit || {
            log_error "TypeScript validation failed!"
            exit 1
        }
    fi
    
    log_success "Build validation passed"
}

# Main deployment process
main() {
    log_step "PRODUCTION DEPLOYMENT STARTED"
    
    # Pre-deployment checks
    validate_build
    validate_migrations
    check_migration_status
    
    # Generate Prisma client
    generate_prisma_client
    
    # Apply migrations with safety checks
    apply_migrations
    
    # Verify migration success
    verify_migration_success
    
    # Start server
    start_server
    
    log_success "PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY"
}

# Error handling
trap 'log_error "Deployment failed at line $LINENO"; exit 1' ERR

# Run main function
main "$@"
