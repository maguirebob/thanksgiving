/**
 * PhotoApiClient - Handles all API communication with proper error handling and authentication
 */
class PhotoApiClient {
  constructor(baseUrl, authToken) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Make API request
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        await this.handleApiError(response);
      }

      // Handle different response types
      if (options.responseType === 'blob') {
        return await response.blob();
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Handle API errors
   */
  async handleApiError(response) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { error: 'Unknown error' };
    }

    throw new Error(`API request failed: ${response.status} - ${errorData.error || errorData.message || 'Unknown error'}`);
  }

  /**
   * Get photos for an event
   */
  async getPhotos(eventId) {
    return await this.makeRequest(`/events/${eventId}/photos`);
  }

  /**
   * Upload photo
   */
  async uploadPhoto(eventId, photoData) {
    return await this.makeRequest(`/events/${eventId}/photos`, {
      method: 'POST',
      body: JSON.stringify(photoData)
    });
  }

  /**
   * Get photo binary data
   */
  async getPhoto(photoId) {
    return await this.makeRequest(`/photos/${photoId}`, {
      method: 'GET',
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });
  }

  /**
   * Update photo metadata
   */
  async updatePhoto(photoId, updateData) {
    return await this.makeRequest(`/photos/${photoId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  /**
   * Delete photo
   */
  async deletePhoto(photoId) {
    return await this.makeRequest(`/photos/${photoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });
  }
}

module.exports = { PhotoApiClient };
