import { PrismaClient } from '@prisma/client';
import { testUtils } from '../setup';

describe('Smoke Tests - Database Operations', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await testUtils.cleanupTestData(prisma);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    await testUtils.cleanupTestData(prisma);
  });

  describe('Event Operations', () => {
    test('should create an event', async () => {
      const event = await testUtils.createTestEvent(prisma);
      
      expect(event).toMatchObject({
        event_id: expect.any(Number),
        event_name: 'Test Thanksgiving 2024',
        event_type: 'Thanksgiving',
        event_location: 'Test Home',
        event_description: 'Test Thanksgiving event',
        menu_title: 'Test Menu',
        menu_image_filename: 'test_menu.jpg'
      });
      expect(event.event_date).toBeInstanceOf(Date);
    });

    test('should find events by date range', async () => {
      const event1 = await testUtils.createTestEvent(prisma, {
        event_date: new Date('2024-11-28'),
        event_name: 'Thanksgiving 2024'
      });
      
      const event2 = await testUtils.createTestEvent(prisma, {
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
      expect(recentEvents[0].event_name).toBe('Thanksgiving 2024');
    });

    test('should update an event', async () => {
      const event = await testUtils.createTestEvent(prisma);
      
      const updatedEvent = await prisma.event.update({
        where: { event_id: event.event_id },
        data: { event_description: 'Updated description' }
      });

      expect(updatedEvent.event_description).toBe('Updated description');
    });

    test('should delete an event', async () => {
      const event = await testUtils.createTestEvent(prisma);
      
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
    test('should create a user with hashed password', async () => {
      const user = await testUtils.createTestUser(prisma);
      
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

    test('should find user by username', async () => {
      await testUtils.createTestUser(prisma);
      
      const user = await prisma.user.findUnique({
        where: { username: 'testuser' }
      });

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
    });

    test('should find user by email', async () => {
      await testUtils.createTestUser(prisma);
      
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });
  });

  describe('Photo Operations', () => {
    test('should create a photo linked to an event', async () => {
      const event = await testUtils.createTestEvent(prisma);
      
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
      const event = await testUtils.createTestEvent(prisma);
      
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
      const event = await testUtils.createTestEvent(prisma);
      
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
      expect(eventWithPhotos?.photos[0].filename).toBe('test-photo.jpg');
    });
  });
});
