const { PhotoApiClient } = require('./photoApiClient');
const { FileUtils } = require('./fileUtils');
const { ErrorHandler } = require('./errorHandler');
const { PhotoUIController } = require('./photoUIController');

/**
 * PhotoManager - Central module for managing all photo operations
 */
class PhotoManager {
  constructor(eventId, authToken) {
    this.eventId = eventId;
    this.authToken = authToken;
    this.photos = [];
    this.isLoading = false;
    this.apiClient = new PhotoApiClient('/api/v1', authToken);
    this.uiController = null;
  }

  /**
   * Initialize with UI controller
   */
  initializeUI() {
    this.uiController = new PhotoUIController(this);
    this.uiController.initializeUI();
  }

  /**
   * Load photos for the current event
   */
  async loadPhotos() {
    try {
      this.isLoading = true;
      const response = await this.apiClient.getPhotos(this.eventId);
      
      if (response.success) {
        this.photos = response.photos;
        // Update UI if controller is available
        if (this.uiController) {
          this.uiController.displayPhotos(this.photos);
        }
      } else {
        throw new Error(response.message || 'Failed to load photos');
      }
    } catch (error) {
      this.handleError(error, 'load_photos');
      this.photos = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Upload a photo
   */
  async uploadPhoto(file, description = '', caption = '') {
    try {
      // Validate file
      if (!this.validateFile(file)) {
        throw new Error('Invalid file type or size');
      }

      // Convert file to base64
      const fileData = await FileUtils.fileToBase64(file);
      
      // Prepare photo data
      const photoData = {
        filename: file.name,
        file_data: fileData,
        description: description,
        caption: caption
      };

      // Upload photo
      const response = await this.apiClient.uploadPhoto(this.eventId, photoData);
      
      if (response.success) {
        // Add photo to local array
        this.photos.unshift(response.photo);
        // Update UI if controller is available
        if (this.uiController) {
          this.uiController.displayPhotos(this.photos);
        }
        return response.photo;
      } else {
        throw new Error(response.message || 'Failed to upload photo');
      }
    } catch (error) {
      this.handleError(error, 'upload_photo');
      throw error;
    }
  }

  /**
   * Update photo metadata
   */
  async updatePhoto(photoId, description = '', caption = '') {
    try {
      const updateData = {
        description: description,
        caption: caption
      };

      const response = await this.apiClient.updatePhoto(photoId, updateData);
      
      if (response.success) {
        // Update local photo array
        const photoIndex = this.photos.findIndex(photo => photo.id === photoId);
        if (photoIndex !== -1) {
          this.photos[photoIndex] = { ...this.photos[photoIndex], ...response.photo };
        }
        // Update UI if controller is available
        if (this.uiController) {
          this.uiController.displayPhotos(this.photos);
        }
        return response.photo;
      } else {
        throw new Error(response.message || 'Failed to update photo');
      }
    } catch (error) {
      this.handleError(error, 'update_photo');
      throw error;
    }
  }

  /**
   * Delete a photo
   */
  async deletePhoto(photoId) {
    try {
      const response = await this.apiClient.deletePhoto(photoId);
      
      if (response.success) {
        // Remove photo from local array
        this.photos = this.photos.filter(photo => photo.id !== photoId);
        // Update UI if controller is available
        if (this.uiController) {
          this.uiController.displayPhotos(this.photos);
        }
        return response;
      } else {
        throw new Error(response.message || 'Failed to delete photo');
      }
    } catch (error) {
      this.handleError(error, 'delete_photo');
      throw error;
    }
  }

  /**
   * Capture photo from camera
   */
  async capturePhoto(videoElement, canvasElement, description = '', caption = '') {
    try {
      // Set canvas dimensions to match video
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvasElement.getContext('2d');
      ctx.drawImage(videoElement, 0, 0);
      
      // Convert canvas to base64
      const base64Data = canvasElement.toDataURL('image/jpeg');
      
      // Create a file-like object from the base64 data
      const blob = await FileUtils.base64ToBlob(base64Data, 'image/jpeg');
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Upload the captured photo
      return await this.uploadPhoto(file, description, caption);
    } catch (error) {
      this.handleError(error, 'capture_photo');
      throw error;
    }
  }

  /**
   * Validate file
   */
  validateFile(file) {
    return FileUtils.validateFile(file);
  }

  /**
   * Get authentication token
   */
  getAuthToken() {
    return this.authToken;
  }

  /**
   * Handle errors
   */
  handleError(error, operation) {
    ErrorHandler.handleError(error, operation);
  }

  /**
   * Get photos array
   */
  getPhotos() {
    return this.photos;
  }

  /**
   * Get loading state
   */
  isLoading() {
    return this.isLoading;
  }

  /**
   * Get photo by ID
   */
  getPhotoById(id) {
    return this.photos.find(photo => photo.id === id);
  }

  // UI Controller Methods (delegated to UI controller)
  
  /**
   * Open upload modal
   */
  openUploadModal() {
    if (this.uiController) {
      this.uiController.openUploadModal();
    }
  }

  /**
   * Close upload modal
   */
  closeUploadModal() {
    if (this.uiController) {
      this.uiController.closeUploadModal();
    }
  }

  /**
   * Open camera modal
   */
  openCameraModal() {
    if (this.uiController) {
      this.uiController.openCameraModal();
    }
  }

  /**
   * Close camera modal
   */
  closeCameraModal() {
    if (this.uiController) {
      this.uiController.closeCameraModal();
    }
  }

  /**
   * Close edit modal
   */
  closeEditModal() {
    if (this.uiController) {
      this.uiController.closeEditModal();
    }
  }

  /**
   * Handle file upload (delegated to UI controller)
   */
  async handleFileUpload(event) {
    if (this.uiController) {
      return await this.uiController.handleFileUpload(event);
    }
  }

  /**
   * Handle photo edit (delegated to UI controller)
   */
  async handlePhotoEdit(event) {
    if (this.uiController) {
      return await this.uiController.handlePhotoEdit(event);
    }
  }
}

module.exports = { PhotoManager };
