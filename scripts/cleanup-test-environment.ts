#!/usr/bin/env ts-node

/**
 * Test Environment Cleanup Script
 * 
 * This script cleans up test data from the test environment
 * to prevent accumulation of test events and other data
 */

import { PrismaClient } from '@prisma/client';

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
  step: (msg: string) => console.log(`${colors.cyan}🧹${colors.reset} ${colors.bright}${msg}${colors.reset}`)
};

async function cleanupTestEnvironment(): Promise<void> {
  console.log(`${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║              TEST ENVIRONMENT CLEANUP                     ║
║              Thanksgiving Menu Collection                    ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  // SAFETY CHECK: Verify we're in test environment
  if (process.env['NODE_ENV'] !== 'test') {
    log.error('❌ SAFETY VIOLATION: This script can only run in test environment');
    process.exit(1);
  }
  
  // SAFETY CHECK: Verify we're using test database
  const dbUrl = process.env['DATABASE_URL'];
  if (!dbUrl) {
    log.error('❌ No DATABASE_URL found');
    process.exit(1);
  }
  
  // Allow Railway test database URLs
  const isTestDb = dbUrl.includes('thanksgiving_test') || 
                   dbUrl.includes('metro.proxy.rlwy.net') ||
                   dbUrl.includes('railway.app') ||
                   dbUrl.includes('test');
  
  if (!isTestDb) {
    log.error('❌ SAFETY VIOLATION: This script can only run against test database');
    log.error(`Current DATABASE_URL: ${dbUrl}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    log.step('Connecting to test database...');
    await prisma.$connect();
    log.success('Connected to test database');

    // Clean up test events (events with "Test" in the name)
    log.step('Cleaning up test events...');
    const testEvents = await prisma.event.findMany({
      where: {
        OR: [
          { event_name: { contains: 'Test' } },
          { event_name: { contains: 'test' } },
          { menu_title: { contains: 'Test' } },
          { menu_title: { contains: 'test' } }
        ]
      }
    });

    if (testEvents.length > 0) {
      log.info(`Found ${testEvents.length} test events to clean up`);
      
      // Delete related data first (cascade should handle this, but being safe)
      for (const event of testEvents) {
        // Delete related blog posts
        await prisma.blogPost.deleteMany({
          where: { event_id: event.event_id }
        });
        
        // Delete related photos
        await prisma.photo.deleteMany({
          where: { event_id: event.event_id }
        });
        
        // Delete related recipes
        await prisma.recipe.deleteMany({
          where: { event_id: event.event_id }
        });
        
        // Delete related journal sections
        await prisma.journalSection.deleteMany({
          where: { event_id: event.event_id }
        });
      }
      
      // Delete the test events
      const deletedEvents = await prisma.event.deleteMany({
        where: {
          OR: [
            { event_name: { contains: 'Test' } },
            { event_name: { contains: 'test' } },
            { menu_title: { contains: 'Test' } },
            { menu_title: { contains: 'test' } }
          ]
        }
      });
      
      log.success(`Deleted ${deletedEvents.count} test events`);
    } else {
      log.info('No test events found to clean up');
    }

    // Clean up test users (users with "test" in username or email)
    log.step('Cleaning up test users...');
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: 'test' } },
          { email: { contains: 'test' } }
        ]
      }
    });

    if (testUsers.length > 0) {
      log.info(`Found ${testUsers.length} test users to clean up`);
      
      // Delete related data first
      for (const user of testUsers) {
        // Delete related sessions
        await prisma.session.deleteMany({
          where: { user_id: user.user_id }
        });
        
        // Delete related password reset tokens
        await prisma.passwordResetToken.deleteMany({
          where: { user_id: user.user_id }
        });
      }
      
      // Delete the test users
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          OR: [
            { username: { contains: 'test' } },
            { email: { contains: 'test' } }
          ]
        }
      });
      
      log.success(`Deleted ${deletedUsers.count} test users`);
    } else {
      log.info('No test users found to clean up');
    }

    // Show final counts
    log.step('Final database state:');
    const totalEvents = await prisma.event.count();
    const totalUsers = await prisma.user.count();
    const totalPhotos = await prisma.photo.count();
    const totalBlogPosts = await prisma.blogPost.count();
    
    log.info(`Total events: ${totalEvents}`);
    log.info(`Total users: ${totalUsers}`);
    log.info(`Total photos: ${totalPhotos}`);
    log.info(`Total blog posts: ${totalBlogPosts}`);

    log.success('Test environment cleanup completed!');
    
  } catch (error) {
    log.error(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanupTestEnvironment().catch(error => {
  log.error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
});
