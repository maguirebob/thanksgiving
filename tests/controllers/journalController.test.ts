import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createJournalPage,
  getJournalPages,
  getJournalPage,
  updateJournalPage,
  deleteJournalPage,
  createContentItem,
  updateContentItem,
  deleteContentItem,
  reorderContentItems,
  getAvailableContent
} from '../../src/controllers/journalController';
import {
  updatePhotoType,
  getPhotosByType
} from '../../src/controllers/photoTypeController';

// Mock Prisma client
jest.mock('@prisma/client');
const MockedPrismaClient = PrismaClient as jest.MockedClass<typeof PrismaClient>;

describe('Journal Controller', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockPrisma = new MockedPrismaClient() as jest.Mocked<PrismaClient>;
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createJournalPage', () => {
    it('should create a journal page successfully', async () => {
      const mockEvent = { event_id: 1, event_name: 'Test Event' };
      const mockJournalPage = {
        journal_page_id: 1,
        event_id: 1,
        year: 2023,
        page_number: 1,
        title: 'Test Page',
        description: 'Test Description',
        is_published: false,
        created_at: new Date(),
        updated_at: new Date(),
        content_items: []
      };

      mockRequest.body = {
        event_id: 1,
        year: 2023,
        title: 'Test Page',
        description: 'Test Description'
      };

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent as any);
      mockPrisma.journalPage.create.mockResolvedValue(mockJournalPage as any);

      await createJournalPage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { journal_page: mockJournalPage }
      });
    });

    it('should return 400 if event_id is missing', async () => {
      mockRequest.body = { year: 2023 };

      await createJournalPage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Event ID and year are required'
      });
    });

    it('should return 404 if event not found', async () => {
      mockRequest.body = { event_id: 999, year: 2023 };
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await createJournalPage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Event not found'
      });
    });
  });

  describe('getJournalPages', () => {
    it('should return journal pages with pagination', async () => {
      const mockJournalPages = [
        {
          journal_page_id: 1,
          event_id: 1,
          year: 2023,
          page_number: 1,
          title: 'Test Page',
          is_published: false,
          created_at: new Date(),
          updated_at: new Date(),
          content_items: []
        }
      ];

      mockRequest.query = { event_id: '1', year: '2023', page: '1', limit: '10' };
      mockPrisma.journalPage.findMany.mockResolvedValue(mockJournalPages as any);
      mockPrisma.journalPage.count.mockResolvedValue(1);

      await getJournalPages(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          journal_pages: mockJournalPages,
          pagination: {
            total: 1,
            page: 1,
            limit: 10
          }
        }
      });
    });
  });

  describe('getJournalPage', () => {
    it('should return a specific journal page', async () => {
      const mockJournalPage = {
        journal_page_id: 1,
        event_id: 1,
        year: 2023,
        page_number: 1,
        title: 'Test Page',
        is_published: false,
        created_at: new Date(),
        updated_at: new Date(),
        content_items: []
      };

      mockRequest.params = { journalPageId: '1' };
      mockPrisma.journalPage.findUnique.mockResolvedValue(mockJournalPage as any);

      await getJournalPage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { journal_page: mockJournalPage }
      });
    });

    it('should return 404 if journal page not found', async () => {
      mockRequest.params = { journalPageId: '999' };
      mockPrisma.journalPage.findUnique.mockResolvedValue(null);

      await getJournalPage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Journal page not found'
      });
    });
  });
});

describe('Photo Type Controller', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockPrisma = new MockedPrismaClient() as jest.Mocked<PrismaClient>;
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('updatePhotoType', () => {
    it('should update photo type successfully', async () => {
      const mockPhoto = {
        photo_id: 1,
        filename: 'test.jpg',
        photo_type: 'individual' as const,
        taken_date: new Date()
      };

      const updatedPhoto = {
        ...mockPhoto,
        photo_type: 'page' as const
      };

      mockRequest.params = { photoId: '1' };
      mockRequest.body = { photo_type: 'page' };

      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto as any);
      mockPrisma.photo.update.mockResolvedValue(updatedPhoto as any);

      await updatePhotoType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          photo: updatedPhoto,
          photo_type: 'page'
        }
      });
    });

    it('should return 400 if photo_type is missing', async () => {
      mockRequest.params = { photoId: '1' };
      mockRequest.body = {};

      await updatePhotoType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Photo type is required'
      });
    });

    it('should return 400 if photo_type is invalid', async () => {
      mockRequest.params = { photoId: '1' };
      mockRequest.body = { photo_type: 'invalid' };

      await updatePhotoType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Photo type must be either "individual" or "page"'
      });
    });

    it('should return 404 if photo not found', async () => {
      mockRequest.params = { photoId: '999' };
      mockRequest.body = { photo_type: 'page' };
      mockPrisma.photo.findUnique.mockResolvedValue(null);

      await updatePhotoType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Photo not found'
      });
    });
  });

  describe('getPhotosByType', () => {
    it('should return photos filtered by type', async () => {
      const mockPhotos = [
        {
          photo_id: 1,
          filename: 'test1.jpg',
          photo_type: 'individual' as const,
          taken_date: new Date()
        },
        {
          photo_id: 2,
          filename: 'test2.jpg',
          photo_type: 'individual' as const,
          taken_date: new Date()
        }
      ];

      mockRequest.params = { event_id: '1', photo_type: 'individual' };
      mockPrisma.photo.findMany.mockResolvedValue(mockPhotos as any);

      await getPhotosByType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          photos: mockPhotos,
          photo_type: 'individual'
        }
      });
    });

    it('should return 400 if photo_type is invalid', async () => {
      mockRequest.params = { event_id: '1', photo_type: 'invalid' };

      await getPhotosByType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Photo type must be either "individual" or "page"'
      });
    });
  });
});

