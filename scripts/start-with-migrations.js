#!/usr/bin/env node

/**
 * Startup script that runs database migrations before starting the server
 * This ensures migrations are applied even if they fail during build
 */

const { execSync } = require('child_process');
const path = require('path');

async function startWithMigrations() {
  try {
    console.log('🚀 Starting application with database migrations...');
    
    // Run database migrations
    console.log('📋 Running database migrations...');
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Database migrations completed successfully');
    } catch (migrationError) {
      console.warn('⚠️  Database migration failed, but continuing with startup...');
      console.warn('Migration error:', migrationError.message);
    }
    
    // Start the server
    console.log('🌐 Starting server...');
    execSync('npm start', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    process.exit(1);
  }
}

startWithMigrations();
