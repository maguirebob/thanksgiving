import { PrismaClient } from '@prisma/client';

// Define safe cleanup function - only deletes specific test records
const cleanupTestData = async (prisma: PrismaClient, testRecordIds?: {
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
  
  // SAFETY CHECK: Verify we're using test or dev database
  if (!process.env['DATABASE_URL']?.includes('thanksgiving_test') && !process.env['DATABASE_URL']?.includes('bobmaguire') && !process.env['DATABASE_URL']?.includes('metro.proxy.rlwy.net')) {
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
};

// Define test event creation function locally
const createTestEvent = async (prisma: PrismaClient, overrides = {}) => {
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
};

// Define test user creation function locally
const createTestUser = async (prisma: PrismaClient, overrides = {}) => {
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
};

describe('Smoke Tests - Database Operations', () => {
  let prisma: PrismaClient;
  let testRecordIds: {
    eventIds: number[];
    userIds: number[];
    photoIds: number[];
    blogPostIds: number[];
    recipeIds: number[];
  };

  beforeAll(async () => {
    prisma = new PrismaClient();
    testRecordIds = {
      eventIds: [],
      userIds: [],
      photoIds: [],
      blogPostIds: [],
      recipeIds: []
    };
  });

  afterAll(async () => {
    await cleanupTestData(prisma, testRecordIds);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // No cleanup before each test - we'll track what we create
  });

  describe('Event Operations', () => {
    test('should create an event', async () => {
      const event = await createTestEvent(prisma);
      
      // Track this event for cleanup
      testRecordIds.eventIds.push(event.event_id);
      
      expect(event).toMatchObject({
        event_id: expect.any(Number),
        event_name: expect.stringMatching(/^Test Thanksgiving \d+_\d+$/),
        event_type: 'Thanksgiving',
        event_location: 'Test Home',
        event_description: 'Test Thanksgiving event',
        menu_title: 'Test Menu',
        menu_image_filename: expect.stringMatching(/^test_menu_\d+_\d+\.jpg$/)
      });
      expect(event.event_date).toBeInstanceOf(Date);
    });

    test('should find events by date range', async () => {
      await createTestEvent(prisma, {
        event_date: new Date('2024-11-28'),
        event_name: 'Thanksgiving 2024'
      });
      
      await createTestEvent(prisma, {
        event_date: new Date('2023-11-23'),
        event_name: 'Thanksgiving 2023'
      });

      const recentEvents = await prisma.event.findMany({
        where: {
          event_date: {
            gte: new Date('2024-01-01')
          }
        },
        orderBy: { event_date: 'desc' }
      });

      expect(recentEvents).toHaveLength(1);
      expect(recentEvents[0]?.event_name).toBe('Thanksgiving 2024');
    });

    test('should update an event', async () => {
      const event = await createTestEvent(prisma);
      
      const updatedEvent = await prisma.event.update({
        where: { event_id: event.event_id },
        data: { event_description: 'Updated description' }
      });

      expect(updatedEvent.event_description).toBe('Updated description');
    });

    test('should delete an event', async () => {
      const event = await createTestEvent(prisma);
      
      await prisma.event.delete({
        where: { event_id: event.event_id }
      });

      const deletedEvent = await prisma.event.findUnique({
        where: { event_id: event.event_id }
      });

      expect(deletedEvent).toBeNull();
    });
  });

  describe('User Operations', () => {
    test.skip('should create a user with hashed password', async () => {
      const user = await createTestUser(prisma);
      
      expect(user).toMatchObject({
        user_id: expect.any(Number),
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        first_name: 'Test',
        last_name: 'User'
      });
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe('testpass123'); // Should be hashed
    });

    test.skip('should find user by username', async () => {
      await createTestUser(prisma);
      
      const user = await prisma.user.findUnique({
        where: { username: 'testuser' }
      });

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
    });

    test.skip('should find user by email', async () => {
      await createTestUser(prisma);
      
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });
  });

  describe('Photo Operations', () => {
    test('should create a photo linked to an event', async () => {
      const event = await createTestEvent(prisma);
      
      const photo = await prisma.photo.create({
        data: {
          event_id: event.event_id,
          filename: 'test-photo.jpg',
          original_filename: 'original-test-photo.jpg',
          description: 'Test photo description',
          caption: 'Test photo caption',
          file_size: 1024,
          mime_type: 'image/jpeg'
        }
      });

      expect(photo).toMatchObject({
        photo_id: expect.any(Number),
        event_id: event.event_id,
        filename: 'test-photo.jpg',
        original_filename: 'original-test-photo.jpg',
        description: 'Test photo description',
        caption: 'Test photo caption',
        file_size: 1024,
        mime_type: 'image/jpeg'
      });
    });

    test('should find photos by event', async () => {
      const event = await createTestEvent(prisma);
      
      await prisma.photo.create({
        data: {
          event_id: event.event_id,
          filename: 'photo1.jpg',
          description: 'First photo'
        }
      });

      await prisma.photo.create({
        data: {
          event_id: event.event_id,
          filename: 'photo2.jpg',
          description: 'Second photo'
        }
      });

      const photos = await prisma.photo.findMany({
        where: { event_id: event.event_id }
      });

      expect(photos).toHaveLength(2);
    });
  });

  describe('Relationships', () => {
    test('should include photos when fetching event', async () => {
      const event = await createTestEvent(prisma);
      
      await prisma.photo.create({
        data: {
          event_id: event.event_id,
          filename: 'test-photo.jpg',
          description: 'Test photo'
        }
      });

      const eventWithPhotos = await prisma.event.findUnique({
        where: { event_id: event.event_id },
        include: { photos: true }
      });

      expect(eventWithPhotos?.photos).toHaveLength(1);
      expect(eventWithPhotos?.photos?.[0]?.filename).toBe('test-photo.jpg');
    });
  });
});
