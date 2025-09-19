const db = require('../../models');
const DatabaseHelper = require('../helpers/database');

describe('Event Model', () => {
  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
  });

  beforeEach(async () => {
    await DatabaseHelper.clearDatabase();
  });

  describe('Event Creation', () => {
    test('should create event with valid data', async () => {
      const eventData = {
        year: 2023,
        title: 'Thanksgiving 2023',
        description: 'Test Thanksgiving event',
        date: '2023-11-23',
        location: 'Test Location',
        host: 'Test Host',
        menu_items: JSON.stringify([
          { item: 'Turkey', category: 'Main Course' },
          { item: 'Mashed Potatoes', category: 'Side Dish' }
        ])
      };

      const event = await db.Event.create(eventData);

      expect(event).toBeTruthy();
      expect(event.year).toBe(2023);
      expect(event.title).toBe('Thanksgiving 2023');
      expect(event.description).toBe('Test Thanksgiving event');
      expect(event.date).toBe('2023-11-23');
      expect(event.location).toBe('Test Location');
      expect(event.host).toBe('Test Host');
      expect(event.menu_items).toBeDefined();
      expect(event.event_id).toBeDefined();
      expect(event.created_at).toBeDefined();
      expect(event.updated_at).toBeDefined();
    });

    test('should handle menu_items as JSON string', async () => {
      const menuItems = [
        { item: 'Turkey', category: 'Main Course' },
        { item: 'Mashed Potatoes', category: 'Side Dish' },
        { item: 'Pumpkin Pie', category: 'Dessert' }
      ];

      const eventData = {
        year: 2023,
        title: 'Thanksgiving 2023',
        description: 'Test event',
        date: '2023-11-23',
        location: 'Test Location',
        host: 'Test Host',
        menu_items: JSON.stringify(menuItems)
      };

      const event = await db.Event.create(eventData);
      const parsedMenuItems = JSON.parse(event.menu_items);

      expect(parsedMenuItems).toHaveLength(3);
      expect(parsedMenuItems[0].item).toBe('Turkey');
      expect(parsedMenuItems[0].category).toBe('Main Course');
    });

    test('should handle empty menu_items', async () => {
      const eventData = {
        year: 2023,
        title: 'Thanksgiving 2023',
        description: 'Test event',
        date: '2023-11-23',
        location: 'Test Location',
        host: 'Test Host',
        menu_items: JSON.stringify([])
      };

      const event = await db.Event.create(eventData);
      const parsedMenuItems = JSON.parse(event.menu_items);

      expect(parsedMenuItems).toHaveLength(0);
    });

    test('should enforce unique year constraint', async () => {
      const eventData1 = {
        year: 2023,
        title: 'Thanksgiving 2023',
        description: 'Test event 1',
        date: '2023-11-23',
        location: 'Test Location 1',
        host: 'Test Host 1',
        menu_items: JSON.stringify([])
      };

      const eventData2 = {
        year: 2023, // Same year
        title: 'Thanksgiving 2023 Duplicate',
        description: 'Test event 2',
        date: '2023-11-23',
        location: 'Test Location 2',
        host: 'Test Host 2',
        menu_items: JSON.stringify([])
      };

      await db.Event.create(eventData1);

      await expect(db.Event.create(eventData2)).rejects.toThrow();
    });
  });

  describe('Event Queries', () => {
    beforeEach(async () => {
      // Create test events
      await db.Event.bulkCreate([
        {
          year: 2020,
          title: 'Thanksgiving 2020',
          description: 'Test event 2020',
          date: '2020-11-26',
          location: 'Location 2020',
          host: 'Host 2020',
          menu_items: JSON.stringify([
            { item: 'Turkey 2020', category: 'Main Course' }
          ])
        },
        {
          year: 2021,
          title: 'Thanksgiving 2021',
          description: 'Test event 2021',
          date: '2021-11-25',
          location: 'Location 2021',
          host: 'Host 2021',
          menu_items: JSON.stringify([
            { item: 'Turkey 2021', category: 'Main Course' }
          ])
        },
        {
          year: 2022,
          title: 'Thanksgiving 2022',
          description: 'Test event 2022',
          date: '2022-11-24',
          location: 'Location 2022',
          host: 'Host 2022',
          menu_items: JSON.stringify([
            { item: 'Turkey 2022', category: 'Main Course' }
          ])
        }
      ]);
    });

    test('should find event by year', async () => {
      const event = await db.Event.findOne({ where: { year: 2021 } });
      expect(event).toBeTruthy();
      expect(event.year).toBe(2021);
      expect(event.title).toBe('Thanksgiving 2021');
    });

    test('should find event by ID', async () => {
      const event = await db.Event.findByPk(1);
      expect(event).toBeTruthy();
      expect(event.event_id).toBe(1);
    });

    test('should find all events', async () => {
      const events = await db.Event.findAll();
      expect(events).toHaveLength(3);
    });

    test('should find events by year range', async () => {
      const events = await db.Event.findAll({
        where: {
          year: {
            [db.Sequelize.Op.gte]: 2021
          }
        }
      });
      expect(events).toHaveLength(2);
      expect(events.every(event => event.year >= 2021)).toBe(true);
    });

    test('should order events by year', async () => {
      const events = await db.Event.findAll({
        order: [['year', 'ASC']]
      });
      expect(events[0].year).toBe(2020);
      expect(events[1].year).toBe(2021);
      expect(events[2].year).toBe(2022);
    });

    test('should count events', async () => {
      const eventCount = await db.Event.count();
      expect(eventCount).toBe(3);
    });

    test('should find events by title pattern', async () => {
      const events = await db.Event.findAll({
        where: {
          title: {
            [db.Sequelize.Op.like]: '%2021%'
          }
        }
      });
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Thanksgiving 2021');
    });
  });

  describe('Event Updates', () => {
    let event;

    beforeEach(async () => {
      event = await db.Event.create({
        event_name: 'Thanksgiving 2023',
        event_type: 'Thanksgiving',
        event_date: '2023-11-23',
        event_location: 'Test Location',
        description: 'Test event',
        menu_image_url: '/images/2023_Menu.jpeg'
      });
    });

    test('should update event fields', async () => {
      event.event_name = 'Updated Thanksgiving 2023';
      event.description = 'Updated description';
      event.event_location = 'Updated Location';
      await event.save();

      const updatedEvent = await db.Event.findByPk(event.id);
      expect(updatedEvent.event_name).toBe('Updated Thanksgiving 2023');
      expect(updatedEvent.description).toBe('Updated description');
      expect(updatedEvent.event_location).toBe('Updated Location');
    });

    test('should update menu image URL', async () => {
      event.menu_image_url = '/images/updated_2023_Menu.jpeg';
      await event.save();

      const updatedEvent = await db.Event.findByPk(event.id);
      expect(updatedEvent.menu_image_url).toBe('/images/updated_2023_Menu.jpeg');
    });

    test('should update updated_at timestamp', async () => {
      const originalUpdatedAt = event.updated_at;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      event.event_name = 'Updated Title';
      await event.save();

      expect(event.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Event Deletion', () => {
    test('should delete event', async () => {
      const event = await db.Event.create({
        event_name: 'Thanksgiving 2023',
        event_type: 'Thanksgiving',
        event_date: '2023-11-23',
        event_location: 'Test Location',
        description: 'Test event',
        menu_image_url: '/images/2023_Menu.jpeg'
      });

      const eventId = event.id;
      await event.destroy();

      const deletedEvent = await db.Event.findByPk(eventId);
      expect(deletedEvent).toBeNull();
    });

    test('should cascade delete photos when event is deleted', async () => {
      const event = await db.Event.create({
        event_name: 'Thanksgiving 2023',
        event_type: 'Thanksgiving',
        event_date: '2023-11-23',
        event_location: 'Test Location',
        description: 'Test event',
        menu_image_url: '/images/2023_Menu.jpeg'
      });

      // Create a photo for the event
      const photo = await db.Photo.create({
        event_id: event.id,
        filename: 'test-photo.jpg',
        original_name: 'test-photo.jpg',
        description: 'Test photo',
        caption: 'Test caption',
        file_path: 'data:image/jpeg;base64,' + Buffer.from('fake image data').toString('base64'),
        file_size: 1024000,
        mime_type: 'image/jpeg'
      });

      // Delete the event
      await event.destroy();

      // Check that the photo was also deleted
      const deletedPhoto = await db.Photo.findByPk(photo.id);
      expect(deletedPhoto).toBeNull();
    });
  });

  describe('Event Associations', () => {
    test('should have many photos', async () => {
      const event = await db.Event.create({
        event_name: 'Thanksgiving 2023',
        event_type: 'Thanksgiving',
        event_date: '2023-11-23',
        event_location: 'Test Location',
        description: 'Test event',
        menu_image_url: '/images/2023_Menu.jpeg'
      });

      // Create photos for the event
      await db.Photo.bulkCreate([
        {
          event_id: event.id,
          filename: 'photo1.jpg',
          original_name: 'photo1.jpg',
          description: 'Photo 1',
          caption: 'Caption 1',
          file_path: 'data:image/jpeg;base64,' + Buffer.from('fake image data 1').toString('base64'),
          file_size: 1024000,
          mime_type: 'image/jpeg'
        },
        {
          event_id: event.id,
          filename: 'photo2.jpg',
          original_name: 'photo2.jpg',
          description: 'Photo 2',
          caption: 'Caption 2',
          file_path: 'data:image/jpeg;base64,' + Buffer.from('fake image data 2').toString('base64'),
          file_size: 1024000,
          mime_type: 'image/jpeg'
        }
      ]);

      // Test association
      const eventWithPhotos = await db.Event.findByPk(event.id, {
        include: [db.Photo]
      });

      expect(eventWithPhotos.Photos).toHaveLength(2);
      expect(eventWithPhotos.Photos[0].filename).toBe('photo1.jpg');
      expect(eventWithPhotos.Photos[1].filename).toBe('photo2.jpg');
    });
  });
});


