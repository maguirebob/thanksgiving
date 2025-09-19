/**
 * PhotoManager - Central module for managing all photo operations
 * Browser-compatible version
 */
class PhotoManager {
  constructor(eventId, authToken) {
    this.eventId = eventId;
    this.authToken = authToken;
    this.photos = [];
    this.isLoading = false;
    this.apiClient = new PhotoApiClient(window.location.origin + '/api/v1', authToken);
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
      console.log('PhotoManager: Loading photos for event', this.eventId, 'Stack trace:', new Error().stack);
      this.isLoading = true;
      const response = await this.apiClient.getPhotos(this.eventId);
      
      console.log('PhotoManager: API response:', response);
      
      if (response.success) {
        this.photos = response.photos;
        console.log('PhotoManager: Loaded', this.photos.length, 'photos');
        // Update UI if controller is available
        if (this.uiController) {
          console.log('PhotoManager: Updating UI with photos');
          this.uiController.displayPhotos(this.photos);
        } else {
          console.error('PhotoManager: UI controller not available!');
        }
      } else {
        throw new Error(response.message || 'Failed to load photos');
      }
    } catch (error) {
      console.error('PhotoManager: Error loading photos:', error);
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
      const mimeType = FileUtils.getMimeType(file.name);
      const fileSize = FileUtils.calculateFileSize(fileData);

      const photoData = {
        filename: file.name,
        file_data: fileData,
        description: description,
        caption: caption,
        mime_type: mimeType,
        file_size: fileSize
      };

      // Upload photo
      const response = await this.apiClient.uploadPhoto(this.eventId, photoData);
      
      if (response.success) {
        // Reload photos from server to get the complete data
        await this.loadPhotos();
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
      const canvas = canvasElement;
      const video = videoElement;
      
      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      });
      
      // Create file from blob
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
   * Handle errors
   */
  handleError(error, context) {
    ErrorHandler.handleError(error, context);
  }

  /**
   * Get auth token
   */
  getAuthToken() {
    return this.authToken;
  }

  /**
   * Check if loading
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
