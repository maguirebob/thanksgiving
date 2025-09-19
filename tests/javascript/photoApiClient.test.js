const { PhotoApiClient } = require('../../src/javascript/photoApiClient');

// Mock fetch
global.fetch = jest.fn();

describe('PhotoApiClient', () => {
  let apiClient;
  const baseUrl = 'https://api.example.com';
  const authToken = 'mock-jwt-token';

  beforeEach(() => {
    apiClient = new PhotoApiClient(baseUrl, authToken);
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with baseUrl and authToken', () => {
      expect(apiClient.baseUrl).toBe(baseUrl);
      expect(apiClient.authToken).toBe(authToken);
    });
  });

  describe('getAuthHeaders', () => {
    test('should return proper authorization headers', () => {
      const headers = apiClient.getAuthHeaders();
      
      expect(headers).toEqual({
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      });
    });
  });

  describe('makeRequest', () => {
    test('should make successful API request', async () => {
      const mockResponse = { success: true, data: 'test' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.makeRequest('/test', {
        method: 'GET'
      });

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/test`, {
        method: 'GET',
        headers: apiClient.getAuthHeaders()
      });
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      });

      await expect(apiClient.makeRequest('/test', { method: 'GET' }))
        .rejects.toThrow('API request failed: 404');
    });

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.makeRequest('/test', { method: 'GET' }))
        .rejects.toThrow('Network error');
    });
  });

  describe('getPhotos', () => {
    test('should fetch photos for event', async () => {
      const mockPhotos = [
        { id: 1, filename: 'photo1.jpg' },
        { id: 2, filename: 'photo2.jpg' }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, photos: mockPhotos })
      });

      const result = await apiClient.getPhotos(123);

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/events/123/photos`, {
        headers: apiClient.getAuthHeaders()
      });
      expect(result).toEqual({ success: true, photos: mockPhotos });
    });
  });

  describe('uploadPhoto', () => {
    test('should upload photo successfully', async () => {
      const photoData = {
        filename: 'test.jpg',
        file_data: 'base64data',
        description: 'Test photo',
        caption: 'Test caption'
      };
      
      const mockResponse = { success: true, photo: { id: 3, ...photoData } };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.uploadPhoto(123, photoData);

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/events/123/photos`, {
        method: 'POST',
        headers: apiClient.getAuthHeaders(),
        body: JSON.stringify(photoData)
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPhoto', () => {
    test('should fetch photo binary data', async () => {
      const mockBlob = new Blob(['binary data'], { type: 'image/jpeg' });
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      });

      const result = await apiClient.getPhoto(123);

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/photos/123`, {
        method: 'GET',
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      expect(result).toBe(mockBlob);
    });
  });

  describe('updatePhoto', () => {
    test('should update photo metadata', async () => {
      const updateData = {
        description: 'Updated description',
        caption: 'Updated caption'
      };
      
      const mockResponse = { success: true, photo: { id: 123, ...updateData } };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.updatePhoto(123, updateData);

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/photos/123`, {
        method: 'PUT',
        headers: apiClient.getAuthHeaders(),
        body: JSON.stringify(updateData)
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deletePhoto', () => {
    test('should delete photo successfully', async () => {
      const mockResponse = { success: true, message: 'Photo deleted' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.deletePhoto(123);

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/photos/123`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('handleApiError', () => {
    test('should handle 400 errors', async () => {
      const response = {
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad request' })
      };

      await expect(apiClient.handleApiError(response))
        .rejects.toThrow('API request failed: 400');
    });

    test('should handle 401 errors', async () => {
      const response = {
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      };

      await expect(apiClient.handleApiError(response))
        .rejects.toThrow('API request failed: 401');
    });

    test('should handle 404 errors', async () => {
      const response = {
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      };

      await expect(apiClient.handleApiError(response))
        .rejects.toThrow('API request failed: 404');
    });

    test('should handle 500 errors', async () => {
      const response = {
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' })
      };

      await expect(apiClient.handleApiError(response))
        .rejects.toThrow('API request failed: 500');
    });
  });
});
