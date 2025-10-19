import { PrismaClient } from '@prisma/client';

// Global test setup
beforeAll(async () => {
  // Force test environment variables - Use RAILWAY TEST database for smoke tests
  process.env['NODE_ENV'] = 'test';
  process.env['DATABASE_URL'] = 'postgresql://postgres:KSaqSfPzavQLaSSmQcQvgCGVNCSQYzuJ@metro.proxy.rlwy.net:24517/railway';
  
  // Verify we're actually connected to the dev database
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ Connected to RAILWAY TEST database for smoke tests:', process.env['DATABASE_URL']);
  } catch (error) {
    console.error('❌ FAILED to connect to Railway test database:', error);
    throw new Error('Cannot run tests - Railway test database not available');
  } finally {
    await prisma.$disconnect();
  }
});

afterAll(async () => {
  // Cleanup after all tests
});

// Global test utilities
export const testUtils = {
  // Helper to create test data
  createTestEvent: async (prisma: PrismaClient, overrides = {}) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return await prisma.event.create({
      data: {
        event_name: `Test Thanksgiving ${timestamp}_${random}`,
        event_type: 'Thanksgiving',
        event_location: 'Test Home',
        event_date: new Date('2024-11-28'),
        event_description: 'Test Thanksgiving event',
        menu_title: 'Test Menu',
        menu_image_filename: `test_menu_${timestamp}_${random}.jpg`,
        ...overrides
      }
    });
  },

  // Helper to create test user
  createTestUser: async (prisma: PrismaClient, overrides = {}) => {
    const bcrypt = require('bcryptjs');
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return await prisma.user.create({
      data: {
        username: `testuser_${timestamp}_${random}`,
        email: `test_${timestamp}_${random}@example.com`,
        password_hash: await bcrypt.hash('testpass123', 10),
        role: 'user' as any, // Cast to any to avoid enum issues
        first_name: 'Test',
        last_name: 'User',
        ...overrides
      }
    });
  },

  // Helper to clean up ONLY the test records we created
  cleanupTestData: async (prisma: PrismaClient, testRecordIds?: {
    eventIds?: number[];
    userIds?: number[];
    photoIds?: number[];
    blogPostIds?: number[];
    recipeIds?: number[];
  }) => {
    // SAFETY CHECK: Verify we're in test environment
    if (process.env['NODE_ENV'] !== 'test') {
      throw new Error('❌ SAFETY VIOLATION: cleanupTestData can only run in test environment');
    }
    
    // SAFETY CHECK: Verify we're using test or dev database (for smoke tests)
    if (!process.env['DATABASE_URL']?.includes('thanksgiving_test') && !process.env['DATABASE_URL']?.includes('memories_dev') && !process.env['DATABASE_URL']?.includes('bobmaguire') && !process.env['DATABASE_URL']?.includes('metro.proxy.rlwy.net')) {
      throw new Error('❌ SAFETY VIOLATION: cleanupTestData can only run against test or dev database');
    }
    
    console.log('🧹 Cleaning up ONLY test records we created');
    
    if (!testRecordIds) {
      console.log('⚠️ No test record IDs provided - skipping cleanup');
      return;
    }
    
    // Delete ONLY the specific records we created during tests
    if (testRecordIds.photoIds && testRecordIds.photoIds.length > 0) {
      await prisma.photo.deleteMany({
        where: { photo_id: { in: testRecordIds.photoIds } }
      });
    }
    
    if (testRecordIds.recipeIds && testRecordIds.recipeIds.length > 0) {
      await prisma.recipe.deleteMany({
        where: { recipe_id: { in: testRecordIds.recipeIds } }
      });
    }
    
    if (testRecordIds.blogPostIds && testRecordIds.blogPostIds.length > 0) {
      await prisma.blogPost.deleteMany({
        where: { blog_post_id: { in: testRecordIds.blogPostIds } }
      });
    }
    
    if (testRecordIds.eventIds && testRecordIds.eventIds.length > 0) {
      await prisma.event.deleteMany({
        where: { event_id: { in: testRecordIds.eventIds } }
      });
    }
    
    if (testRecordIds.userIds && testRecordIds.userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { user_id: { in: testRecordIds.userIds } }
      });
    }
    
    console.log('✅ Cleaned up only test records we created');
  }
};
