#!/usr/bin/env ts-node

/**
 * About Page Database Validation Script
 * 
 * This script runs the same database validation that the about page uses
 * to ensure there are no schema errors before deployment
 */

import { verifyDatabaseStructure } from '../src/lib/databaseVerifier';

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
  step: (msg: string) => console.log(`${colors.cyan}🔍${colors.reset} ${colors.bright}${msg}${colors.reset}`)
};

async function runAboutPageValidation(): Promise<void> {
  console.log(`${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║              ABOUT PAGE DATABASE VALIDATION               ║
║              Thanksgiving Menu Collection                    ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  try {
    log.step('Running about page database validation...');
    
    const result = await verifyDatabaseStructure();
    
    console.log(`\n${colors.bright}📊 Validation Results:${colors.reset}`);
    console.log(`Version: ${result.versionInfo.currentVersion}`);
    console.log(`Schema Definition: ${result.versionInfo.hasSchemaDefinition ? '✅ Found' : '❌ Missing'}`);
    console.log(`Latest Schema: ${result.versionInfo.latestSchemaVersion}`);
    console.log(`Timestamp: ${result.timestamp}`);
    
    if (result.errors.length > 0) {
      console.log(`\n${colors.red}❌ ERRORS (${result.errors.length}):${colors.reset}`);
      result.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    if (result.warnings.length > 0) {
      console.log(`\n${colors.yellow}⚠️ WARNINGS (${result.warnings.length}):${colors.reset}`);
      result.warnings.forEach(warning => {
        console.log(`  • ${warning}`);
      });
    }
    
    if (result.isValid && result.errors.length === 0) {
      log.success('About page database validation passed!');
      console.log(`\n${colors.green}🎉 Ready for deployment!${colors.reset}`);
      console.log(`The about page will show: "Database structure is correct"`);
      process.exit(0);
    } else {
      log.error('About page database validation failed!');
      console.log(`\n${colors.red}❌ NOT READY FOR DEPLOYMENT${colors.reset}`);
      console.log(`The about page would show errors. Please fix the issues above.`);
      process.exit(1);
    }
    
  } catch (error) {
    log.error(`About page validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log(`\n${colors.red}❌ VALIDATION ERROR${colors.reset}`);
    console.log(`The about page would show: "Failed to verify database structure"`);
    process.exit(1);
  }
}

// Run validation
runAboutPageValidation().catch(error => {
  log.error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
});
