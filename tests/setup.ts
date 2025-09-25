import { PrismaClient } from '@prisma/client';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env['NODE_ENV'] = 'test';
  process.env['DATABASE_URL'] = process.env['DATABASE_URL'] || 'postgresql://test:test@localhost:5432/thanksgiving_test';
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

  // Helper to clean up test data
  cleanupTestData: async (prisma: PrismaClient) => {
    // Delete in order to respect foreign key constraints
    await prisma.photo.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.blogPost.deleteMany();
    await prisma.event.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  }
};
