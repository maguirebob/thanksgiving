/**
 * Photo Component - Handles photo management functionality
 * Provides reusable components for photo upload, display, and management
 */

class PhotoComponent {
    constructor(eventId, containerId) {
        this.eventId = eventId;
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.photos = [];
        this.currentPage = 1;
        this.pageSize = 12;
        this.isLoading = false;
        this.eventsBound = false; // Flag to prevent duplicate event binding
        
        this.init();
    }

    init() {
        console.log('PhotoComponent: Initializing...', { eventId: this.eventId, containerId: this.containerId });
        console.log('PhotoComponent: Container found:', !!this.container);
        
        this.createPhotoGrid();
        this.createUploadModal();
        
        // Wait for DOM to be ready before binding events
        setTimeout(() => {
            console.log('PhotoComponent: Binding events...');
            this.bindEvents();
        }, 100);
        
        this.loadPhotos();
    }

    createPhotoGrid() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="photo-component">
                <!-- Photo Header -->
                <div class="photo-header mb-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">
                            <i class="fas fa-images me-2"></i>Photos
                        </h3>
                        <div class="photo-controls">
                            <button class="btn btn-primary me-2" id="uploadPhotoBtn">
                                <i class="fas fa-upload me-2"></i>Upload Photo
                            </button>
                            <button class="btn btn-success" id="takePhotoBtn">
                                <i class="fas fa-camera me-2"></i>Take Photo
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Search and Filter -->
                <div class="photo-search mb-3">
                    <div class="row">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="photoSearchInput" 
                                   placeholder="Search photos by caption or description...">
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="photoSortSelect">
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="filename">Filename A-Z</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <button class="btn btn-outline-secondary" id="clearFiltersBtn">
                                <i class="fas fa-times me-2"></i>Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Loading Indicator -->
                <div id="photoLoadingIndicator" class="text-center py-4" style="display: none;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading photos...</p>
                </div>

                <!-- Photos Grid -->
                <div id="photosGrid" class="row">
                    <!-- Photos will be dynamically loaded here -->
                </div>

                <!-- No Photos Message -->
                <div id="noPhotosMessage" class="text-center text-muted py-5" style="display: none;">
                    <i class="fas fa-images fa-3x mb-3" style="color: #dee2e6;"></i>
                    <h4>No photos yet</h4>
                    <p>Upload some memories from this Thanksgiving!</p>
                    <button class="btn btn-primary" id="uploadFirstPhotoBtn">
                        <i class="fas fa-upload me-2"></i>Upload First Photo
                    </button>
                </div>

                <!-- Pagination -->
                <div id="photoPagination" class="d-flex justify-content-center mt-4" style="display: none;">
                    <nav aria-label="Photo pagination">
                        <ul class="pagination" id="photoPaginationList">
                            <!-- Pagination buttons will be generated here -->
                        </ul>
                    </nav>
                </div>
            </div>
        `;
    }

    createUploadModal() {
        // Create modal if it doesn't exist
        if (document.getElementById('photoUploadModal')) return;

        const modalHTML = `
            <div id="photoUploadModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;">
                <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 600px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                    <h3 style="color: var(--primary-black); margin-bottom: 1rem; font-family: 'Playfair Display', Georgia, serif;">
                        <i class="fas fa-upload me-2"></i>Upload Photo
                    </h3>
                    
                    <form id="photoUploadForm" enctype="multipart/form-data">
                        <div class="mb-3">
                            <label for="photoFile" class="form-label">Select Photo</label>
                            <input type="file" class="form-control" id="photoFile" accept="image/*" required>
                            <div class="form-text">Supported formats: JPEG, PNG, GIF, WebP (Max 10MB)</div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="photoCaption" class="form-label">Caption</label>
                            <input type="text" class="form-control" id="photoCaption" 
                                   placeholder="Short caption for this photo">
                        </div>
                        
                        <div class="mb-3">
                            <label for="photoDescription" class="form-label">Description</label>
                            <textarea class="form-control" id="photoDescription" rows="3" 
                                      placeholder="Describe this photo..."></textarea>
                        </div>

                        <!-- Image Preview -->
                        <div id="photoPreview" class="mb-3" style="display: none;">
                            <label class="form-label">Preview</label>
                            <div class="text-center">
                                <img id="photoPreviewImg" class="img-thumbnail" style="max-width: 200px; max-height: 200px;">
                            </div>
                        </div>
                        
                        <div class="d-flex gap-2 justify-content-end">
                            <button type="button" class="btn-view-details" style="background-color: var(--secondary-gray);" onclick="photoComponent.closeUploadModal()">
                                <i class="fas fa-times me-2"></i>
                                Cancel
                            </button>
                            <button type="submit" class="btn-view-details" id="uploadPhotoSubmitBtn">
                                <i class="fas fa-upload me-2"></i>
                                Upload Photo
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    bindEvents() {
        if (this.eventsBound) {
            console.log('PhotoComponent: Events already bound, skipping...');
            return;
        }
        
        console.log('PhotoComponent: Starting bindEvents...');
        
        // Upload button events - find buttons created by this component
        const uploadBtn = document.getElementById('uploadPhotoBtn');
        const uploadFirstBtn = document.getElementById('uploadFirstPhotoBtn');
        const takePhotoBtn = document.getElementById('takePhotoBtn');
        
        console.log('PhotoComponent: Buttons found:', {
            uploadBtn: !!uploadBtn,
            uploadFirstBtn: !!uploadFirstBtn,
            takePhotoBtn: !!takePhotoBtn
        });
        
        if (uploadBtn) {
            console.log('PhotoComponent: Binding uploadBtn');
            uploadBtn.addEventListener('click', () => this.openUploadModal());
        }
        if (uploadFirstBtn) {
            console.log('PhotoComponent: Binding uploadFirstBtn');
            uploadFirstBtn.addEventListener('click', () => this.openUploadModal());
        }
        if (takePhotoBtn) {
            console.log('PhotoComponent: Binding takePhotoBtn');
            takePhotoBtn.addEventListener('click', () => this.openCameraCapture());
        }

        // Form submission handling
        const uploadForm = document.getElementById('photoUploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Photo upload form submitted');
                
                const formData = new FormData();
                const fileInput = document.getElementById('photoFile');
                const descriptionInput = document.getElementById('photoDescription');
                const captionInput = document.getElementById('photoCaption');
                
                if (!fileInput.files[0]) {
                    alert('Please select a photo file');
                    return;
                }
                
                formData.append('photo', fileInput.files[0]);
                formData.append('description', descriptionInput.value || '');
                formData.append('caption', captionInput.value || '');
                
                try {
                    const response = await fetch(`/api/events/${this.eventId}/photos`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('Photo uploaded successfully!');
                        this.closeUploadModal();
                        this.loadPhotos(); // Refresh photo list
                    } else {
                        alert('Upload failed: ' + result.message);
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    alert('Upload failed: ' + error.message);
                }
            });
        }

        // Search and filter events
        const searchInput = document.getElementById('photoSearchInput');
        const sortSelect = document.getElementById('photoSortSelect');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');

        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => this.handleSearch(), 300));
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.handleSort());
        }
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Upload form events
        const photoFile = document.getElementById('photoFile');
        const uploadSubmitBtn = document.getElementById('uploadPhotoSubmitBtn');

        if (photoFile) {
            photoFile.addEventListener('change', (e) => this.handleFilePreview(e));
        }
        if (uploadSubmitBtn) {
            uploadSubmitBtn.addEventListener('click', () => this.handleUpload());
        }
        
        this.eventsBound = true;
        console.log('PhotoComponent: Events bound successfully');
    }

    async loadPhotos(page = 1) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);

        try {
            const searchTerm = document.getElementById('photoSearchInput')?.value || '';
            const sortBy = document.getElementById('photoSortSelect')?.value || 'newest';
            
            let url = `/api/events/${this.eventId}/photos?page=${page}&limit=${this.pageSize}`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                this.photos = result.data.photos;
                this.currentPage = page;
                this.displayPhotos();
                this.updatePagination(result.data.pagination);
                this.updatePhotoCount(result.data.photos.length);
                // Events are already bound during initialization - no need to rebind
            } else {
                this.showError('Failed to load photos: ' + result.message);
            }
        } catch (error) {
            console.error('Error loading photos:', error);
            this.showError('Error loading photos: ' + error.message);
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    displayPhotos() {
        const photosGrid = document.getElementById('photosGrid');
        const noPhotosMessage = document.getElementById('noPhotosMessage');
        
        if (!photosGrid) return;

        if (this.photos.length === 0) {
            photosGrid.innerHTML = '';
            if (noPhotosMessage) noPhotosMessage.style.display = 'block';
            return;
        }

        if (noPhotosMessage) noPhotosMessage.style.display = 'none';

        const sortedPhotos = this.sortPhotos([...this.photos]);
        
        photosGrid.innerHTML = sortedPhotos.map(photo => this.createPhotoCard(photo)).join('');
    }

    createPhotoCard(photo) {
        const caption = photo.caption || photo.original_filename || 'Photo';
        const description = photo.description || '';
        const takenDate = new Date(photo.taken_date || photo.created_at).toLocaleDateString();

        return `
            <div class="col-md-4 col-sm-6 mb-3">
                <div class="card photo-card h-100">
                    <img src="/api/photos/${photo.photo_id}/file" 
                         class="card-img-top" 
                         alt="${caption}"
                         style="height: 200px; object-fit: cover; cursor: pointer;"
                         onclick="photoComponent.viewPhoto('${photo.photo_id}', '${caption}', '${description}')"
                         loading="lazy">
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title">${caption}</h6>
                        ${description ? `<p class="card-text text-muted small">${description}</p>` : ''}
                        <div class="mt-auto">
                            <small class="text-muted">${takenDate}</small>
                            <div class="btn-group btn-group-sm mt-2 w-100" role="group">
                                <button type="button" class="btn btn-outline-primary" 
                                        onclick="photoComponent.viewPhoto('${photo.photo_id}', '${caption}', '${description}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button type="button" class="btn btn-outline-secondary" 
                                        onclick="photoComponent.editPhoto('${photo.photo_id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button type="button" class="btn btn-outline-danger" 
                                        onclick="photoComponent.deletePhoto('${photo.photo_id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    sortPhotos(photos) {
        const sortBy = document.getElementById('photoSortSelect')?.value || 'newest';
        
        switch (sortBy) {
            case 'oldest':
                return photos.sort((a, b) => new Date(a.taken_date || a.created_at) - new Date(b.taken_date || b.created_at));
            case 'filename':
                return photos.sort((a, b) => (a.original_filename || '').localeCompare(b.original_filename || ''));
            case 'newest':
            default:
                return photos.sort((a, b) => new Date(b.taken_date || b.created_at) - new Date(a.taken_date || a.created_at));
        }
    }

    updatePagination(pagination) {
        const paginationContainer = document.getElementById('photoPagination');
        const paginationList = document.getElementById('photoPaginationList');
        
        if (!paginationContainer || !paginationList) return;

        if (pagination.pages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        
        let paginationHTML = '';
        
        // Previous button
        if (pagination.page > 1) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="photoComponent.loadPhotos(${pagination.page - 1})">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                </li>
            `;
        }

        // Page numbers
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === pagination.page ? 'active' : ''}">
                    <button class="page-link" onclick="photoComponent.loadPhotos(${i})">${i}</button>
                </li>
            `;
        }

        // Next button
        if (pagination.page < pagination.pages) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="photoComponent.loadPhotos(${pagination.page + 1})">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </li>
            `;
        }

        paginationList.innerHTML = paginationHTML;
    }

    openUploadModal() {
        // Use custom modal instead of Bootstrap modal to prevent conflicts
        const modal = document.getElementById('photoUploadModal');
        if (modal) {
            modal.style.display = 'flex';
        } else {
            console.error('Photo upload modal not found');
        }
    }

    openCameraCapture() {
        // For now, just open the upload modal
        // In a real implementation, this would access the camera
        this.openUploadModal();
    }

    handleFilePreview(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('photoPreview');
        const previewImg = document.getElementById('photoPreviewImg');

        if (file && preview && previewImg) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    async handleUpload() {
        const fileInput = document.getElementById('photoFile');
        const captionInput = document.getElementById('photoCaption');
        const descriptionInput = document.getElementById('photoDescription');
        const submitBtn = document.getElementById('uploadPhotoSubmitBtn');

        if (!fileInput.files[0]) {
            this.showError('Please select a photo to upload');
            return;
        }

        const formData = new FormData();
        formData.append('photo', fileInput.files[0]);
        if (captionInput.value) formData.append('caption', captionInput.value);
        if (descriptionInput.value) formData.append('description', descriptionInput.value);

        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Uploading...';
        }

        try {
            const response = await fetch(`/api/events/${this.eventId}/photos`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Photo uploaded successfully!');
                this.closeUploadModal();
                this.loadPhotos(this.currentPage);
            } else {
                this.showError('Upload failed: ' + result.message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Upload failed: ' + error.message);
        } finally {
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Upload Photo';
            }
        }
    }

    closeUploadModal() {
        // Use custom modal instead of Bootstrap modal
        const modal = document.getElementById('photoUploadModal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Reset form
        document.getElementById('photoUploadForm').reset();
        document.getElementById('photoPreview').style.display = 'none';
    }

    viewPhoto(photoId, caption, description) {
        // Create and show photo viewer modal
        const photo = this.photos.find(p => p.photo_id == photoId);
        if (!photo) return;

        const modalHTML = `
            <div id="photoViewerModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.8); z-index: 10000; align-items: center; justify-content: center;">
                <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 90%; max-height: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3); overflow: auto;">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin: 0; color: var(--primary-black); font-family: 'Playfair Display', Georgia, serif;">${caption}</h3>
                        <button type="button" class="btn-close" onclick="photoComponent.closePhotoViewer()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    <div style="text-align: center;">
                        <img src="/api/photos/${photoId}/file" style="max-width: 100%; max-height: 70vh; object-fit: contain;" alt="${caption}">
                        ${description ? `<p style="margin-top: 1rem; color: var(--secondary-gray);">${description}</p>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                        <button type="button" class="btn-view-details" style="background-color: var(--secondary-gray);" onclick="photoComponent.closePhotoViewer()">
                            <i class="fas fa-times me-2"></i>Close
                        </button>
                        <button type="button" class="btn-view-details" onclick="photoComponent.editPhoto('${photoId}')">
                            <i class="fas fa-edit me-2"></i>Edit
                        </button>
                        <button type="button" class="btn-view-details" style="background-color: #dc3545;" onclick="photoComponent.deletePhoto('${photoId}')">
                            <i class="fas fa-trash me-2"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('photoViewerModal');
        if (existingModal) existingModal.remove();

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = document.getElementById('photoViewerModal');
        if (modal) {
            modal.style.display = 'flex';
        }

        // Clean up when modal is closed
        const closeBtn = modal.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closePhotoViewer();
            });
        }
        
        // Also close when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePhotoViewer();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePhotoViewer();
            }
        });
    }

    closePhotoViewer() {
        const modal = document.getElementById('photoViewerModal');
        if (modal) {
            modal.remove();
        }
    }

    editPhoto(photoId) {
        // For now, just show an alert
        // In a real implementation, this would open an edit modal
        alert('Edit photo functionality coming soon!');
    }

    async deletePhoto(photoId) {
        if (!confirm('Are you sure you want to delete this photo?')) return;

        try {
            const response = await fetch(`/api/photos/${photoId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Photo deleted successfully!');
                this.loadPhotos(this.currentPage);
            } else {
                this.showError('Delete failed: ' + result.message);
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showError('Delete failed: ' + error.message);
        }
    }

    handleSearch() {
        this.loadPhotos(1);
    }

    handleSort() {
        this.displayPhotos();
    }

    clearFilters() {
        document.getElementById('photoSearchInput').value = '';
        document.getElementById('photoSortSelect').value = 'newest';
        this.loadPhotos(1);
    }

    updatePhotoCount(count) {
        // Update global photo count if function exists
        if (typeof updatePhotoCount === 'function') {
            updatePhotoCount(count);
        }
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('photoLoadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        // Simple error display - could be enhanced with toast notifications
        alert('Error: ' + message);
    }

    showSuccess(message) {
        // Simple success display - could be enhanced with toast notifications
        alert(message);
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhotoComponent;
}
