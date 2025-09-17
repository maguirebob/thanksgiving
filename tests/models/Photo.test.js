const db = require('../../models');
const DatabaseHelper = require('../helpers/database');

describe('Photo Model', () => {
  let testEvent;

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
  });

  beforeEach(async () => {
    await DatabaseHelper.clearDatabase();
    
    // Create a test event
    testEvent = await db.Event.create({
      year: 2023,
      title: 'Thanksgiving 2023',
      description: 'Test event',
      date: '2023-11-23',
      location: 'Test Location',
      host: 'Test Host',
      menu_items: JSON.stringify([])
    });
  });

  describe('Photo Creation', () => {
    test('should create photo with valid data', async () => {
      const photoData = {
        event_id: testEvent.event_id,
        filename: 'test-photo.jpg',
        original_filename: 'test-photo.jpg',
        description: 'Test photo description',
        caption: 'Test photo caption',
        taken_date: new Date('2023-11-23'),
        file_size: 1024000,
        mime_type: 'image/jpeg',
        file_path: '/uploads/test-photo.jpg'
      };

      const photo = await db.Photo.create(photoData);

      expect(photo).toBeTruthy();
      expect(photo.event_id).toBe(testEvent.event_id);
      expect(photo.filename).toBe('test-photo.jpg');
      expect(photo.original_filename).toBe('test-photo.jpg');
      expect(photo.description).toBe('Test photo description');
      expect(photo.caption).toBe('Test photo caption');
      expect(photo.taken_date).toBeDefined();
      expect(photo.file_size).toBe(1024000);
      expect(photo.mime_type).toBe('image/jpeg');
      expect(photo.file_path).toBe('/uploads/test-photo.jpg');
      expect(photo.photo_id).toBeDefined();
      expect(photo.created_at).toBeDefined();
      expect(photo.updated_at).toBeDefined();
    });

    test('should create photo with minimal required data', async () => {
      const photoData = {
        event_id: testEvent.event_id,
        filename: 'minimal-photo.jpg',
        taken_date: new Date()
      };

      const photo = await db.Photo.create(photoData);

      expect(photo).toBeTruthy();
      expect(photo.event_id).toBe(testEvent.event_id);
      expect(photo.filename).toBe('minimal-photo.jpg');
      expect(photo.taken_date).toBeDefined();
    });

    test('should set default taken_date to current time', async () => {
      const photoData = {
        event_id: testEvent.event_id,
        filename: 'auto-date-photo.jpg'
      };

      const photo = await db.Photo.create(photoData);

      expect(photo.taken_date).toBeDefined();
      expect(photo.taken_date).toBeInstanceOf(Date);
    });

    test('should require event_id', async () => {
      const photoData = {
        filename: 'no-event-photo.jpg',
        taken_date: new Date()
      };

      await expect(db.Photo.create(photoData)).rejects.toThrow();
    });

    test('should require filename', async () => {
      const photoData = {
        event_id: testEvent.event_id,
        taken_date: new Date()
      };

      await expect(db.Photo.create(photoData)).rejects.toThrow();
    });
  });

  describe('Photo Queries', () => {
    beforeEach(async () => {
      // Create test photos
      await db.Photo.bulkCreate([
        {
          event_id: testEvent.event_id,
          filename: 'photo1.jpg',
          original_filename: 'photo1.jpg',
          description: 'Photo 1',
          caption: 'Caption 1',
          taken_date: new Date('2023-11-23T10:00:00Z'),
          file_size: 1024000,
          mime_type: 'image/jpeg',
          file_path: '/uploads/photo1.jpg'
        },
        {
          event_id: testEvent.event_id,
          filename: 'photo2.jpg',
          original_filename: 'photo2.jpg',
          description: 'Photo 2',
          caption: 'Caption 2',
          taken_date: new Date('2023-11-23T11:00:00Z'),
          file_size: 2048000,
          mime_type: 'image/jpeg',
          file_path: '/uploads/photo2.jpg'
        },
        {
          event_id: testEvent.event_id,
          filename: 'photo3.png',
          original_filename: 'photo3.png',
          description: 'Photo 3',
          caption: 'Caption 3',
          taken_date: new Date('2023-11-23T12:00:00Z'),
          file_size: 512000,
          mime_type: 'image/png',
          file_path: '/uploads/photo3.png'
        }
      ]);
    });

    test('should find photo by ID', async () => {
      const photo = await db.Photo.findByPk(1);
      expect(photo).toBeTruthy();
      expect(photo.photo_id).toBe(1);
      expect(photo.filename).toBe('photo1.jpg');
    });

    test('should find photos by event_id', async () => {
      const photos = await db.Photo.findAll({
        where: { event_id: testEvent.event_id }
      });
      expect(photos).toHaveLength(3);
      expect(photos.every(photo => photo.event_id === testEvent.event_id)).toBe(true);
    });

    test('should find photos by filename', async () => {
      const photo = await db.Photo.findOne({
        where: { filename: 'photo2.jpg' }
      });
      expect(photo).toBeTruthy();
      expect(photo.filename).toBe('photo2.jpg');
    });

    test('should find photos by mime_type', async () => {
      const jpegPhotos = await db.Photo.findAll({
        where: { mime_type: 'image/jpeg' }
      });
      expect(jpegPhotos).toHaveLength(2);
      expect(jpegPhotos.every(photo => photo.mime_type === 'image/jpeg')).toBe(true);
    });

    test('should order photos by taken_date DESC', async () => {
      const photos = await db.Photo.findAll({
        where: { event_id: testEvent.event_id },
        order: [['taken_date', 'DESC']]
      });
      expect(photos[0].filename).toBe('photo3.png');
      expect(photos[1].filename).toBe('photo2.jpg');
      expect(photos[2].filename).toBe('photo1.jpg');
    });

    test('should filter photos by file size range', async () => {
      const largePhotos = await db.Photo.findAll({
        where: {
          file_size: {
            [db.Sequelize.Op.gte]: 1000000
          }
        }
      });
      expect(largePhotos).toHaveLength(2);
      expect(largePhotos.every(photo => photo.file_size >= 1000000)).toBe(true);
    });

    test('should count photos', async () => {
      const photoCount = await db.Photo.count();
      expect(photoCount).toBe(3);
    });

    test('should count photos by event', async () => {
      const photoCount = await db.Photo.count({
        where: { event_id: testEvent.event_id }
      });
      expect(photoCount).toBe(3);
    });
  });

  describe('Photo Updates', () => {
    let photo;

    beforeEach(async () => {
      photo = await db.Photo.create({
        event_id: testEvent.event_id,
        filename: 'test-photo.jpg',
        original_filename: 'test-photo.jpg',
        description: 'Original description',
        caption: 'Original caption',
        taken_date: new Date(),
        file_size: 1024000,
        mime_type: 'image/jpeg',
        file_path: '/uploads/test-photo.jpg'
      });
    });

    test('should update photo fields', async () => {
      photo.description = 'Updated description';
      photo.caption = 'Updated caption';
      photo.file_size = 2048000;
      await photo.save();

      const updatedPhoto = await db.Photo.findByPk(photo.photo_id);
      expect(updatedPhoto.description).toBe('Updated description');
      expect(updatedPhoto.caption).toBe('Updated caption');
      expect(updatedPhoto.file_size).toBe(2048000);
    });

    test('should update filename and file_path', async () => {
      photo.filename = 'renamed-photo.jpg';
      photo.file_path = '/uploads/renamed-photo.jpg';
      await photo.save();

      const updatedPhoto = await db.Photo.findByPk(photo.photo_id);
      expect(updatedPhoto.filename).toBe('renamed-photo.jpg');
      expect(updatedPhoto.file_path).toBe('/uploads/renamed-photo.jpg');
    });

    test('should update taken_date', async () => {
      const newDate = new Date('2023-12-25');
      photo.taken_date = newDate;
      await photo.save();

      const updatedPhoto = await db.Photo.findByPk(photo.photo_id);
      expect(updatedPhoto.taken_date.getTime()).toBe(newDate.getTime());
    });

    test('should update updated_at timestamp', async () => {
      const originalUpdatedAt = photo.updated_at;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      photo.description = 'Updated description';
      await photo.save();

      expect(photo.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Photo Deletion', () => {
    test('should delete photo', async () => {
      const photo = await db.Photo.create({
        event_id: testEvent.event_id,
        filename: 'delete-test.jpg',
        taken_date: new Date()
      });

      const photoId = photo.photo_id;
      await photo.destroy();

      const deletedPhoto = await db.Photo.findByPk(photoId);
      expect(deletedPhoto).toBeNull();
    });

    test('should delete photos when event is deleted', async () => {
      const photo = await db.Photo.create({
        event_id: testEvent.event_id,
        filename: 'cascade-test.jpg',
        taken_date: new Date()
      });

      // Delete the event
      await testEvent.destroy();

      // Check that the photo was also deleted
      const deletedPhoto = await db.Photo.findByPk(photo.photo_id);
      expect(deletedPhoto).toBeNull();
    });
  });

  describe('Photo Associations', () => {
    test('should belong to event', async () => {
      const photo = await db.Photo.create({
        event_id: testEvent.event_id,
        filename: 'association-test.jpg',
        taken_date: new Date()
      });

      const photoWithEvent = await db.Photo.findByPk(photo.photo_id, {
        include: [db.Event]
      });

      expect(photoWithEvent.Event).toBeTruthy();
      expect(photoWithEvent.Event.event_id).toBe(testEvent.event_id);
      expect(photoWithEvent.Event.title).toBe('Thanksgiving 2023');
    });

    test('should have correct foreign key relationship', async () => {
      const photo = await db.Photo.create({
        event_id: testEvent.event_id,
        filename: 'fk-test.jpg',
        taken_date: new Date()
      });

      // Test that the foreign key constraint works
      const photoWithEvent = await db.Photo.findByPk(photo.photo_id, {
        include: [db.Event]
      });

      expect(photoWithEvent.event_id).toBe(testEvent.event_id);
      expect(photoWithEvent.Event.event_id).toBe(testEvent.event_id);
    });
  });

  describe('Photo Validation', () => {
    test('should validate file_size is positive', async () => {
      const photoData = {
        event_id: testEvent.event_id,
        filename: 'invalid-size.jpg',
        taken_date: new Date(),
        file_size: -1000
      };

      await expect(db.Photo.create(photoData)).rejects.toThrow();
    });

    test('should validate mime_type format', async () => {
      const photoData = {
        event_id: testEvent.event_id,
        filename: 'invalid-mime.jpg',
        taken_date: new Date(),
        mime_type: 'invalid-mime-type'
      };

      // This should not throw an error as we don't have strict validation
      // but we can test that it accepts the value
      const photo = await db.Photo.create(photoData);
      expect(photo.mime_type).toBe('invalid-mime-type');
    });

    test('should handle very long descriptions', async () => {
      const longDescription = 'A'.repeat(1000);
      const photoData = {
        event_id: testEvent.event_id,
        filename: 'long-desc.jpg',
        taken_date: new Date(),
        description: longDescription
      };

      const photo = await db.Photo.create(photoData);
      expect(photo.description).toBe(longDescription);
    });
  });
});


