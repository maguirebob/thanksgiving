const { PhotoManager } = require('../../src/javascript/photoManager');
const { PhotoApiClient } = require('../../src/javascript/photoApiClient');
const { FileUtils } = require('../../src/javascript/fileUtils');
const { ErrorHandler } = require('../../src/javascript/errorHandler');

// Mock dependencies
jest.mock('../../src/javascript/photoApiClient');
jest.mock('../../src/javascript/fileUtils');
jest.mock('../../src/javascript/errorHandler');

describe('PhotoManager', () => {
  let photoManager;
  let mockApiClient;
  let mockFileUtils;
  let mockErrorHandler;

  beforeEach(() => {
    mockApiClient = {
      getPhotos: jest.fn(),
      uploadPhoto: jest.fn(),
      updatePhoto: jest.fn(),
      deletePhoto: jest.fn()
    };
    
    mockFileUtils = {
      validateFile: jest.fn(),
      fileToBase64: jest.fn(),
      getMimeType: jest.fn(),
      calculateFileSize: jest.fn()
    };
    
    mockErrorHandler = {
      handleError: jest.fn(),
      showUserError: jest.fn()
    };

    PhotoApiClient.mockImplementation(() => mockApiClient);
    FileUtils.mockImplementation(() => mockFileUtils);
    ErrorHandler.mockImplementation(() => mockErrorHandler);

    // Mock the static methods
    FileUtils.validateFile = jest.fn();
    FileUtils.fileToBase64 = jest.fn();
    FileUtils.getMimeType = jest.fn();
    FileUtils.calculateFileSize = jest.fn();
    ErrorHandler.handleError = jest.fn();

    photoManager = new PhotoManager(123, 'mock-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with eventId and authToken', () => {
      expect(photoManager.eventId).toBe(123);
      expect(photoManager.authToken).toBe('mock-token');
      expect(photoManager.photos).toEqual([]);
      expect(photoManager.isLoading).toBe(false);
    });
  });

  describe('loadPhotos', () => {
    test('should load photos successfully', async () => {
      const mockPhotos = [
        { id: 1, filename: 'photo1.jpg', description: 'Test photo 1' },
        { id: 2, filename: 'photo2.jpg', description: 'Test photo 2' }
      ];
      
      mockApiClient.getPhotos.mockResolvedValue({
        success: true,
        photos: mockPhotos
      });

      await photoManager.loadPhotos();

      expect(mockApiClient.getPhotos).toHaveBeenCalledWith(123);
      expect(photoManager.photos).toEqual(mockPhotos);
      expect(photoManager.isLoading).toBe(false);
    });

    test('should handle API errors when loading photos', async () => {
      const error = new Error('API Error');
      mockApiClient.getPhotos.mockRejectedValue(error);

      await photoManager.loadPhotos();

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(error, 'load_photos');
      expect(photoManager.photos).toEqual([]);
    });

    test('should set loading state during photo loading', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApiClient.getPhotos.mockReturnValue(promise);

      const loadPromise = photoManager.loadPhotos();
      expect(photoManager.isLoading).toBe(true);

      resolvePromise({ success: true, photos: [] });
      await loadPromise;

      expect(photoManager.isLoading).toBe(false);
    });
  });

  describe('uploadPhoto', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockBase64 = 'data:image/jpeg;base64,test';

    beforeEach(() => {
      FileUtils.validateFile.mockReturnValue(true);
      FileUtils.fileToBase64.mockResolvedValue(mockBase64);
      FileUtils.getMimeType.mockReturnValue('image/jpeg');
      FileUtils.calculateFileSize.mockReturnValue(100);
    });

    test('should upload photo successfully', async () => {
      const mockPhoto = { id: 3, filename: 'test.jpg', description: 'Test' };
      mockApiClient.uploadPhoto.mockResolvedValue({
        success: true,
        photo: mockPhoto
      });

      const result = await photoManager.uploadPhoto(mockFile, 'Test description', 'Test caption');

      expect(FileUtils.validateFile).toHaveBeenCalledWith(mockFile);
      expect(FileUtils.fileToBase64).toHaveBeenCalledWith(mockFile);
      expect(mockApiClient.uploadPhoto).toHaveBeenCalledWith(123, {
        filename: 'test.jpg',
        file_data: mockBase64,
        description: 'Test description',
        caption: 'Test caption'
      });
      expect(result).toEqual(mockPhoto);
      expect(photoManager.photos).toContain(mockPhoto);
    });

    test('should handle file validation errors', async () => {
      FileUtils.validateFile.mockReturnValue(false);

      await expect(photoManager.uploadPhoto(mockFile, 'Test', 'Test'))
        .rejects.toThrow('Invalid file type or size');

      expect(FileUtils.validateFile).toHaveBeenCalledWith(mockFile);
      expect(mockApiClient.uploadPhoto).not.toHaveBeenCalled();
    });

    test('should handle upload API errors', async () => {
      const error = new Error('Upload failed');
      mockApiClient.uploadPhoto.mockRejectedValue(error);

      await expect(photoManager.uploadPhoto(mockFile, 'Test', 'Test'))
        .rejects.toThrow('Upload failed');

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(error, 'upload_photo');
    });
  });

  describe('updatePhoto', () => {
    test('should update photo successfully', async () => {
      const mockUpdatedPhoto = { id: 1, description: 'Updated description' };
      mockApiClient.updatePhoto.mockResolvedValue({
        success: true,
        photo: mockUpdatedPhoto
      });

      const result = await photoManager.updatePhoto(1, 'Updated description', 'Updated caption');

      expect(mockApiClient.updatePhoto).toHaveBeenCalledWith(1, {
        description: 'Updated description',
        caption: 'Updated caption'
      });
      expect(result).toEqual(mockUpdatedPhoto);
    });

    test('should handle update API errors', async () => {
      const error = new Error('Update failed');
      mockApiClient.updatePhoto.mockRejectedValue(error);

      await expect(photoManager.updatePhoto(1, 'Test', 'Test'))
        .rejects.toThrow('Update failed');

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(error, 'update_photo');
    });
  });

  describe('deletePhoto', () => {
    test('should delete photo successfully', async () => {
      mockApiClient.deletePhoto.mockResolvedValue({
        success: true,
        message: 'Photo deleted'
      });

      const result = await photoManager.deletePhoto(1);

      expect(mockApiClient.deletePhoto).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
    });

    test('should handle delete API errors', async () => {
      const error = new Error('Delete failed');
      mockApiClient.deletePhoto.mockRejectedValue(error);

      await expect(photoManager.deletePhoto(1))
        .rejects.toThrow('Delete failed');

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(error, 'delete_photo');
    });
  });

  describe('capturePhoto', () => {
    let mockVideoElement;
    let mockCanvasElement;

    beforeEach(() => {
      mockVideoElement = {
        videoWidth: 640,
        videoHeight: 480
      };
      mockCanvasElement = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue({
          drawImage: jest.fn()
        }),
        toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,captured')
      };
    });

    test('should capture photo from video element', async () => {
      const mockPhoto = { id: 4, filename: 'captured.jpg' };
      mockApiClient.uploadPhoto.mockResolvedValue({
        success: true,
        photo: mockPhoto
      });

      // Mock FileUtils.base64ToBlob
      FileUtils.base64ToBlob = jest.fn().mockResolvedValue(new Blob(['mock'], { type: 'image/jpeg' }));
      
      // Mock File constructor to return a valid file
      const mockFile = new File(['mock'], 'camera-capture-123.jpg', { type: 'image/jpeg' });
      global.File = jest.fn().mockImplementation(() => mockFile);
      
      // Ensure FileUtils.validateFile returns true for the mock file
      FileUtils.validateFile.mockReturnValue(true);

      const result = await photoManager.capturePhoto(mockVideoElement, mockCanvasElement, 'Captured photo', 'Caption');

      expect(mockCanvasElement.width).toBe(640);
      expect(mockCanvasElement.height).toBe(480);
      expect(mockCanvasElement.getContext().drawImage).toHaveBeenCalledWith(mockVideoElement, 0, 0);
      expect(mockCanvasElement.toDataURL).toHaveBeenCalledWith('image/jpeg');
      expect(mockApiClient.uploadPhoto).toHaveBeenCalled();
    });
  });

  describe('validateFile', () => {
    test('should delegate to FileUtils.validateFile', () => {
      const mockFile = new File(['test'], 'test.jpg');
      photoManager.validateFile(mockFile);

      expect(FileUtils.validateFile).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('getAuthToken', () => {
    test('should return the stored auth token', () => {
      expect(photoManager.getAuthToken()).toBe('mock-token');
    });
  });

  describe('handleError', () => {
    test('should delegate to ErrorHandler.handleError', () => {
      const error = new Error('Test error');
      photoManager.handleError(error, 'test_operation');

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(error, 'test_operation');
    });
  });
});
