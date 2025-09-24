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
    return await prisma.event.create({
      data: {
        event_name: 'Test Thanksgiving 2024',
        event_type: 'Thanksgiving',
        event_location: 'Test Home',
        event_date: new Date('2024-11-28'),
        event_description: 'Test Thanksgiving event',
        menu_title: 'Test Menu',
        menu_image_filename: 'test_menu.jpg',
        ...overrides
      }
    });
  },

  // Helper to create test user
  createTestUser: async (prisma: PrismaClient, overrides = {}) => {
    const bcrypt = require('bcryptjs');
    return await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
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
    await prisma.photo.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await prisma.session.deleteMany();
  }
};
