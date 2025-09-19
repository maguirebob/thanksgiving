/**
 * PhotoApiClient - Handles all API communication for photos
 * Browser-compatible version
 */
class PhotoApiClient {
  constructor(baseUrl, authToken) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get photo URL with authentication
   */
  getPhotoUrl(photoId) {
    return `${this.baseUrl}/photos/${photoId}?token=${this.authToken}`;
  }

  /**
   * Make API request
   */
  async makeRequest(url, options = {}) {
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Get photos for an event
   */
  async getPhotos(eventId) {
    return await this.makeRequest(`${this.baseUrl}/events/${eventId}/photos`);
  }

  /**
   * Upload a photo
   */
  async uploadPhoto(eventId, photoData) {
    return await this.makeRequest(`${this.baseUrl}/events/${eventId}/photos`, {
      method: 'POST',
      body: JSON.stringify(photoData)
    });
  }

  /**
   * Get photo binary data
   */
  async getPhoto(photoId) {
    const response = await fetch(`${this.baseUrl}/photos/${photoId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  }

  /**
   * Update photo metadata
   */
  async updatePhoto(photoId, updateData) {
    return await this.makeRequest(`${this.baseUrl}/photos/${photoId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  /**
   * Delete a photo
   */
  async deletePhoto(photoId) {
    return await this.makeRequest(`${this.baseUrl}/photos/${photoId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Handle API errors
   */
  handleApiError(error, response) {
    if (response.status === 400) {
      throw new Error('Bad request - please check your data');
    } else if (response.status === 401) {
      throw new Error('Unauthorized - please log in again');
    } else if (response.status === 404) {
      throw new Error('Photo not found');
    } else if (response.status === 500) {
      throw new Error('Server error - please try again later');
    } else {
      throw new Error(`API error: ${response.status}`);
    }
  }
}
