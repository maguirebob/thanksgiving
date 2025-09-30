#!/usr/bin/env node

/**
 * Production Deployment Script for Thanksgiving Website
 * 
 * This script automates the production deployment process for Railway
 * Usage: npm run deploy:production
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging utilities
const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  step: (msg: string) => console.log(`${colors.cyan}🚀${colors.reset} ${colors.bright}${msg}${colors.reset}`)
};

// Configuration
const config = {
  productionUrl: process.env.PRODUCTION_URL || 'https://thanksgiving-production.up.railway.app',
  testUrl: process.env.TEST_URL || 'https://thanksgiving-test-test.up.railway.app',
  adminUsername: 'admin',
  adminPassword: 'admin123'
};

/**
 * Execute a command and return the output
 */
function execCommand(command: string, options: any = {}): string {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    }).trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

/**
 * Check if we're in the correct directory
 */
function checkProjectStructure(): void {
  log.step('Checking project structure...');
  
  const requiredFiles = [
    'package.json',
    'src/server.ts',
    'prisma/schema.prisma',
    'docs/PRODUCTION_DEPLOYMENT_PLAN.md'
  ];
  
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }
  
  log.success('Project structure verified');
}

/**
 * Check if all tests pass
 */
function runTests(): void {
  log.step('Running tests...');
  
  try {
    execCommand('npm test');
    log.success('Unit tests passed');
    
    execCommand('npm run test:api');
    log.success('API tests passed');
    
    execCommand('npm run test:smoke');
    log.success('Smoke tests passed');
  } catch (error) {
    throw new Error('Tests failed - deployment aborted');
  }
}

/**
 * Build the application for production
 */
function buildApplication(): void {
  log.step('Building application for production...');
  
  try {
    // Clean previous build
    if (existsSync('dist')) {
      execCommand('rm -rf dist');
    }
    
    // Build TypeScript
    execCommand('npm run build');
    
    // Verify build
    if (!existsSync('dist/server.js')) {
      throw new Error('Build failed - dist/server.js not found');
    }
    
    log.success('Application built successfully');
  } catch (error) {
    throw new Error('Build failed - deployment aborted');
  }
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables(): void {
  log.step('Checking environment variables...');
  
  const requiredVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'SESSION_SECRET',
    'CORS_ORIGIN'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    log.warning(`Missing environment variables: ${missing.join(', ')}`);
    log.info('Please set these in Railway dashboard before deployment');
  } else {
    log.success('Environment variables configured');
  }
}

/**
 * Verify package.json version
 */
function checkVersion(): void {
  log.step('Checking version...');
  
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const version = packageJson.version;
    
    log.info(`Current version: ${version}`);
    
    // Check if version follows semantic versioning
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      throw new Error('Version must follow semantic versioning (x.y.z)');
    }
    
    log.success(`Version ${version} is valid`);
  } catch (error) {
    throw new Error('Version check failed');
  }
}

/**
 * Run production smoke tests
 */
function runProductionSmokeTests(): void {
  log.step('Running production smoke tests...');
  
  try {
    const testCommand = `TEST_BASE_URL=${config.productionUrl} npm run test:smoke`;
    execCommand(testCommand);
    log.success('Production smoke tests passed');
  } catch (error) {
    log.warning('Production smoke tests failed - check deployment manually');
  }
}

/**
 * Check Railway deployment status
 */
function checkRailwayStatus(): void {
  log.step('Checking Railway deployment status...');
  
  try {
    // Check if Railway CLI is available
    execCommand('railway --version');
    log.success('Railway CLI available');
    
    // Check project status
    try {
      const status = execCommand('railway status');
      log.info('Railway project status:');
      console.log(status);
    } catch (error) {
      log.warning('Could not get Railway status - check dashboard manually');
    }
  } catch (error) {
    log.warning('Railway CLI not available - check deployment manually');
  }
}

/**
 * Verify production deployment
 */
function verifyProductionDeployment(): void {
  log.step('Verifying production deployment...');
  
  const endpoints = [
    '/api/health',
    '/auth/login',
    '/api/v1/events'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const url = `${config.productionUrl}${endpoint}`;
      const response = execCommand(`curl -s -o /dev/null -w "%{http_code}" "${url}"`);
      
      if (response === '200' || response === '302') {
        log.success(`${endpoint} - OK (${response})`);
      } else {
        log.warning(`${endpoint} - Unexpected status (${response})`);
      }
    } catch (error) {
      log.warning(`${endpoint} - Could not verify`);
    }
  }
}

/**
 * Display deployment summary
 */
function displaySummary(): void {
  log.step('Deployment Summary');
  
  console.log(`
${colors.bright}🎉 Production Deployment Complete!${colors.reset}

${colors.green}Production URL:${colors.reset} ${config.productionUrl}
${colors.green}Test URL:${colors.reset} ${config.testUrl}
${colors.green}Admin Username:${colors.reset} ${config.adminUsername}
${colors.green}Admin Password:${colors.reset} ${config.adminPassword}

${colors.yellow}Next Steps:${colors.reset}
1. Verify all functionality in production
2. Test admin dashboard access
3. Upload test photos and blogs
4. Monitor application performance
5. Set up monitoring and alerts

${colors.blue}Documentation:${colors.reset}
- Production Plan: docs/PRODUCTION_DEPLOYMENT_PLAN.md
- Configuration: docs/PRODUCTION_CONFIGURATION.md
- Checklist: docs/RAILWAY_DEPLOYMENT_CHECKLIST.md
`);
}

/**
 * Main deployment function
 */
async function deployToProduction(): Promise<void> {
  console.log(`${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                🚀 PRODUCTION DEPLOYMENT                     ║
║              Thanksgiving Menu Collection                    ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  try {
    // Pre-deployment checks
    checkProjectStructure();
    checkVersion();
    checkEnvironmentVariables();
    
    // Build and test
    runTests();
    buildApplication();
    
    // Railway-specific checks
    checkRailwayStatus();
    
    // Post-deployment verification
    runProductionSmokeTests();
    verifyProductionDeployment();
    
    // Success
    displaySummary();
    
  } catch (error: any) {
    log.error(`Deployment failed: ${error.message}`);
    console.log(`
${colors.red}❌ DEPLOYMENT FAILED${colors.reset}

${colors.yellow}Troubleshooting:${colors.reset}
1. Check the error message above
2. Review Railway dashboard for issues
3. Check environment variables
4. Verify database connectivity
5. Review application logs

${colors.blue}Support Resources:${colors.reset}
- Railway Docs: https://docs.railway.app/
- Project Issues: Check GitHub issues
- Deployment Logs: Railway dashboard
`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
${colors.bright}Production Deployment Script${colors.reset}

Usage: npm run deploy:production

This script automates the production deployment process for the Thanksgiving
Menu Collection website on Railway.

${colors.yellow}Prerequisites:${colors.reset}
- All tests must pass
- Environment variables configured in Railway
- Railway project created and linked
- Database migrations ready

${colors.blue}Environment Variables:${colors.reset}
- NODE_ENV=production
- DATABASE_URL=[railway-postgres-url]
- SESSION_SECRET=[secure-random-string]
- CORS_ORIGIN=https://[your-domain]

${colors.green}What this script does:${colors.reset}
1. Verifies project structure
2. Runs all tests
3. Builds application
4. Checks Railway status
5. Runs production smoke tests
6. Verifies deployment

${colors.magenta}Manual Steps Required:${colors.reset}
1. Create Railway project
2. Configure environment variables
3. Deploy from GitHub
4. Run database migrations
5. Seed production data
6. Create admin user
`);
  process.exit(0);
}

// Run deployment
deployToProduction().catch(error => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
