/**
 * PhotoUIController - Manages all UI interactions and updates
 */
class PhotoUIController {
  constructor(photoManager) {
    this.photoManager = photoManager;
    this.uploadModal = null;
    this.cameraModal = null;
    this.editModal = null;
    this.photosGrid = null;
    this.noPhotosMessage = null;
  }

  /**
   * Initialize UI elements and event listeners
   */
  initializeUI() {
    this.uploadModal = document.getElementById('photoUploadModal');
    this.cameraModal = document.getElementById('cameraModal');
    this.editModal = document.getElementById('photoEditModal');
    this.photosGrid = document.getElementById('photosGrid');
    this.noPhotosMessage = document.getElementById('noPhotosMessage');
    
    this.setupEventListeners();
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Photo upload form
    const uploadForm = document.getElementById('photoUploadForm');
    if (uploadForm) {
      uploadForm.addEventListener('submit', (e) => this.handleFileUpload(e));
    }

    // Photo edit form
    const editForm = document.getElementById('photoEditForm');
    if (editForm) {
      editForm.addEventListener('submit', (e) => this.handlePhotoEdit(e));
    }

    // Camera controls
    const startCameraBtn = document.getElementById('startCameraBtn');
    if (startCameraBtn) {
      startCameraBtn.addEventListener('click', () => this.startCamera());
    }

    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
      captureBtn.addEventListener('click', () => this.capturePhoto());
    }

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCapturedPhoto());
    }
  }

  /**
   * Display photos in the grid
   */
  displayPhotos(photos) {
    if (!this.photosGrid || !this.noPhotosMessage) return;

    if (photos.length === 0) {
      this.photosGrid.innerHTML = '';
      this.noPhotosMessage.style.display = 'block';
      return;
    }

    this.noPhotosMessage.style.display = 'none';
    this.photosGrid.innerHTML = '';

    photos.forEach(photo => {
      const photoCard = this.createPhotoCard(photo);
      this.photosGrid.appendChild(photoCard);
    });
  }

  /**
   * Create a photo card element
   */
  createPhotoCard(photo) {
    const photoDiv = document.createElement('div');
    photoDiv.className = 'col-md-4 col-lg-3 mb-4';

    const imageUrl = `/api/v1/photos/${photo.id}`;
    const caption = photo.caption || 'Photo';
    const description = photo.description || '';
    const photoId = photo.id;
    const takenDate = new Date(photo.created_at).toLocaleDateString();

    // Create card container
    const card = document.createElement('div');
    card.className = 'card h-100';
    card.style.cssText = 'border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s ease;';
    card.onmouseover = () => card.style.transform = 'translateY(-2px)';
    card.onmouseout = () => card.style.transform = 'translateY(0)';

    // Create image container
    const imgContainer = document.createElement('div');
    imgContainer.className = 'position-relative';
    imgContainer.style.cssText = 'height: 200px; overflow: hidden;';

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = caption;
    img.className = 'card-img-top photo-view-trigger';
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; cursor: pointer;';
    img.setAttribute('data-file-data', imageUrl);
    img.setAttribute('data-description', description);
    img.setAttribute('data-caption', caption);
    img.setAttribute('data-photo-id', photoId);
    img.onclick = () => this.viewPhoto(photo);

    imgContainer.appendChild(img);

    // Create card body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body d-flex flex-column p-3';

    // Photo info
    const photoInfo = document.createElement('div');
    photoInfo.className = 'mb-2';
    photoInfo.innerHTML = `
      <h6 class="card-title mb-1" style="font-size: 0.9rem; color: var(--primary-black);">${caption}</h6>
      <small class="text-muted">${takenDate}</small>
    `;

    // Action buttons
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'd-flex gap-1 mt-auto';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-light photo-edit-trigger';
    editBtn.setAttribute('data-photo-id', photoId);
    editBtn.setAttribute('data-description', description);
    editBtn.setAttribute('data-caption', caption);
    editBtn.setAttribute('title', 'Edit');
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = () => this.editPhoto(photo);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-danger photo-delete-trigger';
    deleteBtn.setAttribute('data-photo-id', photoId);
    deleteBtn.setAttribute('title', 'Delete');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = () => this.deletePhoto(photo);

    buttonGroup.appendChild(editBtn);
    buttonGroup.appendChild(deleteBtn);

    cardBody.appendChild(photoInfo);
    cardBody.appendChild(buttonGroup);

    card.appendChild(imgContainer);
    card.appendChild(cardBody);
    photoDiv.appendChild(card);

    return photoDiv;
  }

  /**
   * Show upload modal
   */
  showUploadModal() {
    if (this.uploadModal) {
      this.uploadModal.style.display = 'flex';
    }
  }

  /**
   * Hide upload modal
   */
  hideUploadModal() {
    if (this.uploadModal) {
      this.uploadModal.style.display = 'none';
      document.getElementById('photoUploadForm').reset();
    }
  }

  /**
   * Show camera modal
   */
  showCameraModal() {
    if (this.cameraModal) {
      this.cameraModal.style.display = 'flex';
    }
  }

  /**
   * Hide camera modal
   */
  hideCameraModal() {
    if (this.cameraModal) {
      this.cameraModal.style.display = 'none';
      this.stopCamera();
    }
  }

  /**
   * Show edit modal
   */
  showEditModal(photo) {
    if (this.editModal) {
      document.getElementById('editDescription').value = photo.description || '';
      document.getElementById('editCaption').value = photo.caption || '';
      this.editModal.setAttribute('data-photo-id', photo.id);
      this.editModal.style.display = 'flex';
    }
  }

  /**
   * Hide edit modal
   */
  hideEditModal() {
    if (this.editModal) {
      this.editModal.style.display = 'none';
      this.editModal.removeAttribute('data-photo-id');
    }
  }

  /**
   * Handle file upload
   */
  async handleFileUpload(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('photoFile');
    const description = document.getElementById('photoDescription').value;
    const caption = document.getElementById('photoCaption').value;

    if (!fileInput.files[0]) {
      ErrorHandler.showWarning('Please select a photo to upload');
      return;
    }

    try {
      await this.photoManager.uploadPhoto(fileInput.files[0], description, caption);
      this.hideUploadModal();
      ErrorHandler.showSuccess('Photo uploaded successfully!');
    } catch (error) {
      ErrorHandler.handleError(error, 'photo_upload');
    }
  }

  /**
   * Handle photo edit
   */
  async handlePhotoEdit(event) {
    event.preventDefault();
    
    const photoId = this.editModal.getAttribute('data-photo-id');
    const description = document.getElementById('editDescription').value;
    const caption = document.getElementById('editCaption').value;

    if (!photoId) {
      ErrorHandler.showWarning('No photo selected for editing');
      return;
    }

    try {
      await this.photoManager.updatePhoto(photoId, description, caption);
      this.hideEditModal();
      ErrorHandler.showSuccess('Photo updated successfully!');
    } catch (error) {
      ErrorHandler.handleError(error, 'photo_edit');
    }
  }

  /**
   * Start camera
   */
  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.getElementById('cameraVideo');
      video.srcObject = stream;
      
      document.getElementById('startCameraBtn').style.display = 'none';
      document.getElementById('captureBtn').style.display = 'inline-block';
    } catch (error) {
      ErrorHandler.handleError(error, 'camera_access');
    }
  }

  /**
   * Capture photo from camera
   */
  capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const preview = document.getElementById('capturedImagePreview');
    
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    preview.src = imageData;
    preview.style.display = 'block';
    video.style.display = 'none';
    
    document.getElementById('captureBtn').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'inline-block';
  }

  /**
   * Save captured photo
   */
  async saveCapturedPhoto() {
    const canvas = document.getElementById('cameraCanvas');
    const description = document.getElementById('captureDescription').value;
    const caption = document.getElementById('captureCaption').value;

    try {
      const blob = await this.canvasToBlob(canvas, 'image/jpeg', 0.8);
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      await this.photoManager.uploadPhoto(file, description, caption);
      this.hideCameraModal();
      ErrorHandler.showSuccess('Photo captured and saved successfully!');
    } catch (error) {
      ErrorHandler.handleError(error, 'photo_capture');
    }
  }

  /**
   * Stop camera
   */
  stopCamera() {
    const video = document.getElementById('cameraVideo');
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    
    document.getElementById('startCameraBtn').style.display = 'inline-block';
    document.getElementById('captureBtn').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'none';
    
    const preview = document.getElementById('capturedImagePreview');
    preview.style.display = 'none';
    video.style.display = 'block';
  }

  /**
   * View photo (full screen or modal)
   */
  viewPhoto(photo) {
    // Simple implementation - could be enhanced with a lightbox
    window.open(`/api/v1/photos/${photo.id}`, '_blank');
  }

  /**
   * Edit photo
   */
  editPhoto(photo) {
    this.showEditModal(photo);
  }

  /**
   * Delete photo
   */
  async deletePhoto(photo) {
    if (!confirm(`Are you sure you want to delete this photo?`)) {
      return;
    }

    try {
      await this.photoManager.deletePhoto(photo.id);
      ErrorHandler.showSuccess('Photo deleted successfully!');
    } catch (error) {
      ErrorHandler.handleError(error, 'photo_delete');
    }
  }

  /**
   * Convert canvas to blob
   */
  canvasToBlob(canvas, mimeType = 'image/jpeg', quality = 0.8) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, mimeType, quality);
    });
  }

  /**
   * Open upload modal (public method)
   */
  openUploadModal() {
    this.showUploadModal();
  }

  /**
   * Close upload modal (public method)
   */
  closeUploadModal() {
    this.hideUploadModal();
  }

  /**
   * Open camera modal (public method)
   */
  openCameraModal() {
    this.showCameraModal();
  }

  /**
   * Close camera modal (public method)
   */
  closeCameraModal() {
    this.hideCameraModal();
  }

  /**
   * Close edit modal (public method)
   */
  closeEditModal() {
    this.hideEditModal();
  }
}

module.exports = { PhotoUIController };
