import { Request, Response } from 'express';
import {
  getEventPhotos,
  uploadEventPhoto,
  getPhoto,
  updatePhoto,
  deletePhoto,
  searchPhotos,
  servePhotoFile
} from '../../src/controllers/photoController';
// import * as testUtils from '../setup'; // Not used in this test file

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    event: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    },
    photo: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    blogPost: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    recipe: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    }
  }))
}));

// Mock multer
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req: any, _res: any, next: any) => {
      req.file = {
        filename: 'test-photo.jpg',
        originalname: 'original-photo.jpg',
        size: 1024,
        mimetype: 'image/jpeg'
      };
      next();
    }
  });
  multer.diskStorage = jest.fn();
  return multer;
});

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  createReadStream: jest.fn(() => ({
    pipe: jest.fn()
  }))
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  extname: jest.fn(() => '.jpg')
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123')
}));

describe('Photo Controller', () => {
  let prisma: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  // let mockNext: jest.Mock; // Not used in this test file

  beforeEach(() => {
    prisma = {
      event: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn()
      },
      photo: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      }
    };
    mockRequest = {
      params: {},
      query: {},
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };
    // mockNext = jest.fn(); // Not used in this test file

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getEventPhotos', () => {
    it('should return photos for a valid event', async () => {
      const eventId = '1';
      const mockEvent = { event_id: 1, event_name: 'Test Event' };
      const mockPhotos = [
        {
          photo_id: 1,
          filename: 'photo1.jpg',
          original_filename: 'original1.jpg',
          description: 'Test photo',
          caption: 'Test caption',
          taken_date: new Date(),
          file_size: 1024,
          mime_type: 'image/jpeg',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      prisma.event.findUnique = jest.fn().mockResolvedValue(mockEvent);
      prisma.photo.findMany = jest.fn().mockResolvedValue(mockPhotos);
      prisma.photo.count = jest.fn().mockResolvedValue(1);

      mockRequest.params = { eventId };
      mockRequest.query = {};

      await getEventPhotos(mockRequest as Request, mockResponse as Response);

      expect(prisma.event.findUnique).toHaveBeenCalledWith({
        where: { event_id: parseInt(eventId, 10) }
      });
      expect(prisma.photo.findMany).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          photos: mockPhotos,
          pagination: expect.any(Object)
        }
      });
    });

    it('should return 404 for non-existent event', async () => {
      prisma.event.findUnique = jest.fn().mockResolvedValue(null);

      mockRequest.params = { eventId: '999' };

      await getEventPhotos(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Event not found'
      });
    });

    it('should handle search query', async () => {
      const eventId = '1';
      const mockEvent = { event_id: 1, event_name: 'Test Event' };
      const mockPhotos: any[] = [];

      prisma.event.findUnique = jest.fn().mockResolvedValue(mockEvent);
      prisma.photo.findMany = jest.fn().mockResolvedValue(mockPhotos);
      prisma.photo.count = jest.fn().mockResolvedValue(0);

      mockRequest.params = { eventId };
      mockRequest.query = { search: 'test' };

      await getEventPhotos(mockRequest as Request, mockResponse as Response);

      expect(prisma.photo.findMany).toHaveBeenCalledWith({
        where: {
          event_id: parseInt(eventId, 10),
          OR: expect.any(Array)
        },
        orderBy: { taken_date: 'desc' },
        skip: 0,
        take: 20,
        select: expect.any(Object)
      });
    });

    it('should handle pagination', async () => {
      const eventId = '1';
      const mockEvent = { event_id: 1, event_name: 'Test Event' };
      const mockPhotos: any[] = [];

      prisma.event.findUnique = jest.fn().mockResolvedValue(mockEvent);
      prisma.photo.findMany = jest.fn().mockResolvedValue(mockPhotos);
      prisma.photo.count = jest.fn().mockResolvedValue(0);

      mockRequest.params = { eventId };
      mockRequest.query = { page: '2', limit: '10' };

      await getEventPhotos(mockRequest as Request, mockResponse as Response);

      expect(prisma.photo.findMany).toHaveBeenCalledWith({
        where: { event_id: parseInt(eventId, 10) },
        orderBy: { taken_date: 'desc' },
        skip: 10, // (page 2 - 1) * limit 10
        take: 10,
        select: expect.any(Object)
      });
    });

    it('should handle database errors', async () => {
      // Event exists, but photo query fails
      prisma.event.findUnique = jest.fn().mockResolvedValue({ event_id: 1, event_name: 'Test Event' });
      prisma.photo.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

      mockRequest.params = { eventId: '1' };
      mockRequest.query = {};

      await getEventPhotos(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('uploadEventPhoto', () => {
    it('should upload photo successfully', async () => {
      const eventId = '1';
      const mockEvent = { event_id: 1, event_name: 'Test Event' };
      const mockPhoto = {
        photo_id: 1,
        filename: 'test-photo.jpg',
        original_filename: 'original-photo.jpg',
        description: 'Test description',
        caption: 'Test caption',
        taken_date: new Date(),
        file_size: 1024,
        mime_type: 'image/jpeg',
        created_at: new Date()
      };

      prisma.event.findUnique = jest.fn().mockResolvedValue(mockEvent);
      prisma.photo.create = jest.fn().mockResolvedValue(mockPhoto);

      mockRequest.params = { eventId };
      mockRequest.body = { description: 'Test description', caption: 'Test caption' };
      mockRequest.file = {
        filename: 'test-photo.jpg',
        originalname: 'original-photo.jpg',
        size: 1024,
        mimetype: 'image/jpeg'
      } as any;

      await uploadEventPhoto(mockRequest as Request, mockResponse as Response);

      expect(prisma.photo.create).toHaveBeenCalledWith({
        data: {
          event_id: parseInt(eventId, 10),
          filename: 'test-photo.jpg',
          original_filename: 'original-photo.jpg',
          description: 'Test description',
          caption: 'Test caption',
          file_size: 1024,
          mime_type: 'image/jpeg',
          file_data: null
        },
        select: expect.any(Object)
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { photo: mockPhoto },
        message: 'Photo uploaded successfully'
      });
    });

    it('should return 404 for non-existent event', async () => {
      prisma.event.findUnique = jest.fn().mockResolvedValue(null);

      mockRequest.params = { eventId: '999' };
      mockRequest.file = {} as any;

      await uploadEventPhoto(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Event not found'
      });
    });

    it('should return 400 when no file provided', async () => {
      const eventId = '1';
      const mockEvent = { event_id: 1, event_name: 'Test Event' };

      prisma.event.findUnique = jest.fn().mockResolvedValue(mockEvent);

      mockRequest.params = { eventId };
      mockRequest.file = undefined;

      await uploadEventPhoto(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No photo file provided'
      });
    });

    it('should handle database errors', async () => {
      const eventId = '1';
      const mockEvent = { event_id: 1, event_name: 'Test Event' };

      prisma.event.findUnique = jest.fn().mockResolvedValue(mockEvent);
      prisma.photo.create = jest.fn().mockRejectedValue(new Error('Database error'));

      mockRequest.params = { eventId };
      mockRequest.body = {};
      mockRequest.file = {} as any;

      await uploadEventPhoto(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('getPhoto', () => {
    it('should return photo by ID', async () => {
      const photoId = '1';
      const mockPhoto = {
        photo_id: 1,
        event_id: 1,
        filename: 'photo1.jpg',
        original_filename: 'original1.jpg',
        description: 'Test photo',
        caption: 'Test caption',
        taken_date: new Date(),
        file_size: 1024,
        mime_type: 'image/jpeg',
        created_at: new Date(),
        updated_at: new Date(),
        event: {
          event_name: 'Test Event',
          event_date: new Date()
        }
      };

      prisma.photo.findUnique = jest.fn().mockResolvedValue(mockPhoto);

      mockRequest.params = { photoId };

      await getPhoto(mockRequest as Request, mockResponse as Response);

      expect(prisma.photo.findUnique).toHaveBeenCalledWith({
        where: { photo_id: parseInt(photoId, 10) },
        select: expect.any(Object)
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { photo: mockPhoto }
      });
    });

    it('should return 404 for non-existent photo', async () => {
      prisma.photo.findUnique = jest.fn().mockResolvedValue(null);

      mockRequest.params = { photoId: '999' };

      await getPhoto(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Photo not found'
      });
    });

    it('should handle database errors', async () => {
      prisma.photo.findUnique = jest.fn().mockRejectedValue(new Error('Database error'));

      mockRequest.params = { photoId: '1' };

      await getPhoto(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('updatePhoto', () => {
    it('should update photo successfully', async () => {
      const photoId = '1';
      const existingPhoto = {
        photo_id: 1,
        description: 'Old description',
        caption: 'Old caption'
      };
      const updatedPhoto = {
        photo_id: 1,
        filename: 'photo1.jpg',
        original_filename: 'original1.jpg',
        description: 'New description',
        caption: 'New caption',
        taken_date: new Date(),
        file_size: 1024,
        mime_type: 'image/jpeg',
        created_at: new Date(),
        updated_at: new Date()
      };

      prisma.photo.findUnique = jest.fn().mockResolvedValue(existingPhoto);
      prisma.photo.update = jest.fn().mockResolvedValue(updatedPhoto);

      mockRequest.params = { photoId };
      mockRequest.body = { description: 'New description', caption: 'New caption' };

      await updatePhoto(mockRequest as Request, mockResponse as Response);

      expect(prisma.photo.update).toHaveBeenCalledWith({
        where: { photo_id: parseInt(photoId, 10) },
        data: {
          description: 'New description',
          caption: 'New caption'
        },
        select: expect.any(Object)
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { photo: updatedPhoto },
        message: 'Photo updated successfully'
      });
    });

    it('should return 404 for non-existent photo', async () => {
      prisma.photo.findUnique = jest.fn().mockResolvedValue(null);

      mockRequest.params = { photoId: '999' };
      mockRequest.body = { description: 'New description' };

      await updatePhoto(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Photo not found'
      });
    });

    it('should handle partial updates', async () => {
      const photoId = '1';
      const existingPhoto = {
        photo_id: 1,
        description: 'Old description',
        caption: 'Old caption'
      };
      const updatedPhoto = {
        photo_id: 1,
        filename: 'photo1.jpg',
        original_filename: 'original1.jpg',
        description: 'Old description', // Not updated
        caption: 'New caption', // Updated
        taken_date: new Date(),
        file_size: 1024,
        mime_type: 'image/jpeg',
        created_at: new Date(),
        updated_at: new Date()
      };

      prisma.photo.findUnique = jest.fn().mockResolvedValue(existingPhoto);
      prisma.photo.update = jest.fn().mockResolvedValue(updatedPhoto);

      mockRequest.params = { photoId };
      mockRequest.body = { caption: 'New caption' }; // Only caption provided

      await updatePhoto(mockRequest as Request, mockResponse as Response);

      expect(prisma.photo.update).toHaveBeenCalledWith({
        where: { photo_id: parseInt(photoId, 10) },
        data: {
          description: 'Old description', // Should keep existing value
          caption: 'New caption'
        },
        select: expect.any(Object)
      });
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo successfully', async () => {
      const photoId = '1';
      const existingPhoto = {
        photo_id: 1,
        filename: 'photo1.jpg'
      };

      prisma.photo.findUnique = jest.fn().mockResolvedValue(existingPhoto);
      prisma.photo.delete = jest.fn().mockResolvedValue({});

      mockRequest.params = { photoId };

      await deletePhoto(mockRequest as Request, mockResponse as Response);

      expect(prisma.photo.delete).toHaveBeenCalledWith({
        where: { photo_id: parseInt(photoId, 10) }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Photo deleted successfully'
      });
    });

    it('should return 404 for non-existent photo', async () => {
      prisma.photo.findUnique = jest.fn().mockResolvedValue(null);

      mockRequest.params = { photoId: '999' };

      await deletePhoto(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Photo not found'
      });
    });

    it('should handle database errors', async () => {
      const photoId = '1';
      const existingPhoto = {
        photo_id: 1,
        filename: 'photo1.jpg'
      };

      prisma.photo.findUnique = jest.fn().mockResolvedValue(existingPhoto);
      prisma.photo.delete = jest.fn().mockRejectedValue(new Error('Database error'));

      mockRequest.params = { photoId };

      await deletePhoto(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('searchPhotos', () => {
    it('should search photos successfully', async () => {
      const searchTerm = 'test';
      const mockPhotos = [
        {
          photo_id: 1,
          filename: 'photo1.jpg',
          original_filename: 'original1.jpg',
          description: 'Test photo',
          caption: 'Test caption',
          taken_date: new Date(),
          file_size: 1024,
          mime_type: 'image/jpeg',
          created_at: new Date(),
          event: {
            event_id: 1,
            event_name: 'Test Event',
            event_date: new Date()
          }
        }
      ];

      prisma.photo.findMany = jest.fn().mockResolvedValue(mockPhotos);
      prisma.photo.count = jest.fn().mockResolvedValue(1);

      mockRequest.query = { q: searchTerm };

      await searchPhotos(mockRequest as Request, mockResponse as Response);

      expect(prisma.photo.findMany).toHaveBeenCalledWith({
        where: {
          OR: expect.any(Array)
        },
        orderBy: { taken_date: 'desc' },
        skip: 0,
        take: 20,
        select: expect.any(Object)
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          photos: mockPhotos,
          pagination: expect.any(Object),
          searchTerm
        }
      });
    });

    it('should return 400 for empty search query', async () => {
      mockRequest.query = { q: '' };

      await searchPhotos(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search query is required'
      });
    });

    it('should return 400 for missing search query', async () => {
      mockRequest.query = {};

      await searchPhotos(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search query is required'
      });
    });

    it('should handle pagination in search', async () => {
      const searchTerm = 'test';
      const mockPhotos: any[] = [];

      prisma.photo.findMany = jest.fn().mockResolvedValue(mockPhotos);
      prisma.photo.count = jest.fn().mockResolvedValue(0);

      mockRequest.query = { q: searchTerm, page: '2', limit: '10' };

      await searchPhotos(mockRequest as Request, mockResponse as Response);

      expect(prisma.photo.findMany).toHaveBeenCalledWith({
        where: {
          OR: expect.any(Array)
        },
        orderBy: { taken_date: 'desc' },
        skip: 10, // (page 2 - 1) * limit 10
        take: 10,
        select: expect.any(Object)
      });
    });
  });

  describe('servePhotoFile', () => {
    it('should serve photo file successfully', async () => {
      const photoId = '1';
      const mockPhoto = {
        filename: 'photo1.jpg',
        mime_type: 'image/jpeg',
        original_filename: 'original1.jpg'
      };

      prisma.photo.findUnique = jest.fn().mockResolvedValue(mockPhoto);

      mockRequest.params = { photoId };

      await servePhotoFile(mockRequest as Request, mockResponse as Response);

      expect(prisma.photo.findUnique).toHaveBeenCalledWith({
        where: { photo_id: parseInt(photoId, 10) },
        select: {
          filename: true,
          mime_type: true,
          original_filename: true
        }
      });

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'inline; filename="original1.jpg"'
      );
    });

    it('should return 404 for non-existent photo', async () => {
      prisma.photo.findUnique = jest.fn().mockResolvedValue(null);

      mockRequest.params = { photoId: '999' };

      await servePhotoFile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Photo not found'
      });
    });

    it('should return 404 when file does not exist', async () => {
      const photoId = '1';
      const mockPhoto = {
        filename: 'photo1.jpg',
        mime_type: 'image/jpeg',
        original_filename: 'original1.jpg'
      };

      prisma.photo.findUnique = jest.fn().mockResolvedValue(mockPhoto);
      const fs = require('fs');
      fs.existsSync = jest.fn().mockReturnValue(false);

      mockRequest.params = { photoId };

      await servePhotoFile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Photo file not found'
      });
    });
  });
});
