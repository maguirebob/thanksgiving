/**
 * Photo Carousel Component
 * Handles photo display, automatic rotation, and basic controls
 */

class PhotoCarousel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.photos = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.rotationSpeed = 3000; // 3 seconds per photo
    this.rotationTimer = null;
    this.isLoading = false;
    this.currentPage = 1;
    this.hasMorePhotos = true;
    this.photosPerPage = 50;
    this.kenBurnsEnabled = true; // Ken Burns effect enabled by default
    
    // Auto-hide controls
    this.controlsVisible = true;
    this.hideControlsTimer = null;
    this.hideControlsDelay = 3000; // 3 seconds

    // DOM elements
    this.photoDisplay = null;
    this.controls = null;
    this.metadata = null;
    this.progressBar = null;

    // Initialize carousel
    this.init();
  }

  /**
   * Initialize the carousel
   */
  async init() {
    try {
      this.createCarouselHTML();
      this.bindEvents();
      await this.loadPhotos();
      this.startRotation();
    } catch (error) {
      console.error('Error initializing carousel:', error);
      this.showError('Failed to initialize photo carousel');
    }
  }

  /**
   * Create the carousel HTML structure
   */
  createCarouselHTML() {
    this.container.innerHTML = `
      <div class="carousel-container">
        <!-- Photo Display Area -->
        <div class="carousel-photo-display" id="carousel-photo-display">
          <div class="carousel-loading" id="carousel-loading">
            <div class="spinner"></div>
            <p>Loading photos...</p>
          </div>
          <div class="carousel-photo-container" id="carousel-photo-container" style="display: none;">
            <img id="carousel-current-photo" src="" alt="" class="carousel-photo">
            <div class="carousel-photo-overlay">
              <div class="carousel-photo-info" id="carousel-photo-info">
                <h3 id="carousel-photo-title"></h3>
              </div>
            </div>
          </div>
        </div>

        <!-- Control Panel -->
        <div class="carousel-controls" id="carousel-controls">
          <div class="carousel-control-group">
            <button id="carousel-prev" class="carousel-btn" title="Previous Photo">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="carousel-play-pause" class="carousel-btn carousel-btn-primary" title="Play/Pause">
              <i class="fas fa-play" id="carousel-play-icon"></i>
            </button>
            <button id="carousel-next" class="carousel-btn" title="Next Photo">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          
          <div class="carousel-control-group">
            <button id="carousel-fullscreen" class="carousel-btn" title="Fullscreen">
              <i class="fas fa-expand"></i>
            </button>
            <button id="carousel-ken-burns" class="carousel-btn carousel-btn-active" title="Toggle Ken Burns Effect">
              <i class="fas fa-film"></i>
            </button>
            <div class="carousel-speed-control">
              <label for="carousel-speed">Speed:</label>
              <select id="carousel-speed">
                <option value="1000">Fast</option>
                <option value="3000" selected>Normal</option>
                <option value="5000">Slow</option>
                <option value="10000">Very Slow</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="carousel-progress" id="carousel-progress">
          <div class="carousel-progress-bar" id="carousel-progress-bar"></div>
          <div class="carousel-progress-text" id="carousel-progress-text">Photo 1 of 6</div>
        </div>

        <!-- Photo Information -->
        <div class="carousel-metadata" id="carousel-metadata" style="display: none;">
          <div class="carousel-metadata-content" id="carousel-metadata-content">
            <!-- Photo metadata will be populated here -->
          </div>
        </div>
      </div>
    `;

    // Get DOM references
    this.photoDisplay = document.getElementById('carousel-photo-display');
    this.photoContainer = document.getElementById('carousel-photo-container');
    this.currentPhoto = document.getElementById('carousel-current-photo');
    this.photoInfo = document.getElementById('carousel-photo-info');
    this.photoTitle = document.getElementById('carousel-photo-title');
    this.controls = document.getElementById('carousel-controls');
    this.progressBar = document.getElementById('carousel-progress-bar');
    this.progressText = document.getElementById('carousel-progress-text');
    this.metadata = document.getElementById('carousel-metadata-content');
    this.loading = document.getElementById('carousel-loading');
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Control buttons
    document.getElementById('carousel-prev').addEventListener('click', () => this.previousPhoto());
    document.getElementById('carousel-next').addEventListener('click', () => this.nextPhoto());
    document.getElementById('carousel-play-pause').addEventListener('click', () => this.togglePlayPause());
    document.getElementById('carousel-fullscreen').addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('carousel-ken-burns').addEventListener('click', () => this.toggleKenBurns());
    
    // Speed control
    document.getElementById('carousel-speed').addEventListener('change', (e) => {
      this.rotationSpeed = parseInt(e.target.value);
      if (this.isPlaying) {
        this.stopRotation();
        this.startRotation();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Touch/swipe support
    this.photoDisplay.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.photoDisplay.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    
    // Auto-hide controls on mouse movement
    this.photoDisplay.addEventListener('mousemove', () => this.showControls());
    this.photoDisplay.addEventListener('mouseleave', () => this.startHideControlsTimer());
    
    // Start the auto-hide timer
    this.startHideControlsTimer();
  }

  /**
   * Load photos from API
   */
  async loadPhotos() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoading(true);

    try {
      const response = await fetch(`/api/carousel/photos?page=${this.currentPage}&limit=${this.photosPerPage}`);
      const data = await response.json();

      if (data.success) {
        this.photos = [...this.photos, ...data.data.photos];
        this.hasMorePhotos = data.data.pagination.hasNextPage;
        this.currentPage++;

        if (this.photos.length > 0 && this.currentIndex === 0) {
          this.displayCurrentPhoto();
          this.updateProgress();
        }
      } else {
        throw new Error(data.message || 'Failed to load photos');
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      this.showError('Failed to load photos');
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  /**
   * Display the current photo with fade transition
   */
  displayCurrentPhoto() {
    if (this.photos.length === 0) return;

    const photo = this.photos[this.currentIndex];
    
    // Start fade out
    this.currentPhoto.style.opacity = '0';
    
    // After fade out completes, change the image
    setTimeout(() => {
      // Remove any existing Ken Burns classes
      this.currentPhoto.classList.remove('ken-burns', 'ken-burns-alt', 'ken-burns-diag');
      
      // Update photo image
      this.currentPhoto.src = photo.previewUrl || photo.s3Url || '';
      this.currentPhoto.alt = photo.caption || photo.originalFilename || 'Photo';

      // Update photo information - only show title
      this.photoTitle.textContent = photo.caption || photo.originalFilename || 'Untitled Photo';

      // Apply Ken Burns effect after image loads
      this.currentPhoto.onload = () => {
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
          this.applyKenBurnsEffect();
          // Fade in the new image
          this.currentPhoto.style.opacity = '1';
        }, 100);
      };

      // Show photo container
      this.photoContainer.style.display = 'block';
    }, 300); // Wait for fade out to complete

    // Load more photos if we're near the end
    if (this.currentIndex >= this.photos.length - 5 && this.hasMorePhotos) {
      this.loadPhotos();
    }
  }

  /**
   * Apply Ken Burns effect to current photo
   */
  applyKenBurnsEffect() {
    if (!this.currentPhoto || !this.kenBurnsEnabled) return;

    // Randomly choose one of three Ken Burns effects
    const effects = ['ken-burns', 'ken-burns-alt', 'ken-burns-diag'];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
    
    // Apply the effect
    this.currentPhoto.classList.add(randomEffect);
  }

  /**
   * Toggle Ken Burns effect on/off
   */
  toggleKenBurns() {
    this.kenBurnsEnabled = !this.kenBurnsEnabled;
    const kenBurnsBtn = document.getElementById('carousel-ken-burns');
    
    if (this.kenBurnsEnabled) {
      kenBurnsBtn.classList.add('carousel-btn-active');
      kenBurnsBtn.title = 'Disable Ken Burns Effect';
      // Apply effect to current photo
      this.applyKenBurnsEffect();
    } else {
      kenBurnsBtn.classList.remove('carousel-btn-active');
      kenBurnsBtn.title = 'Enable Ken Burns Effect';
      // Remove effect from current photo
      this.currentPhoto.classList.remove('ken-burns', 'ken-burns-alt', 'ken-burns-diag');
    }
  }

  /**
   * Move to next photo
   */
  nextPhoto() {
    if (this.photos.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % this.photos.length;
    this.displayCurrentPhoto();
    this.updateProgress();
  }

  /**
   * Move to previous photo
   */
  previousPhoto() {
    if (this.photos.length === 0) return;

    this.currentIndex = this.currentIndex === 0 ? this.photos.length - 1 : this.currentIndex - 1;
    this.displayCurrentPhoto();
    this.updateProgress();
  }

  /**
   * Toggle play/pause
   */
  togglePlayPause() {
    if (this.isPlaying) {
      this.stopRotation();
    } else {
      this.startRotation();
    }
  }

  /**
   * Start automatic rotation
   */
  startRotation() {
    if (this.photos.length === 0) return;

    this.isPlaying = true;
    this.rotationTimer = setInterval(() => {
      this.nextPhoto();
    }, this.rotationSpeed);

    // Update play/pause button
    const playIcon = document.getElementById('carousel-play-icon');
    playIcon.className = 'fas fa-pause';
  }

  /**
   * Stop automatic rotation
   */
  stopRotation() {
    this.isPlaying = false;
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }

    // Update play/pause button
    const playIcon = document.getElementById('carousel-play-icon');
    playIcon.className = 'fas fa-play';
  }

  /**
   * Update progress bar and text
   */
  updateProgress() {
    if (this.photos.length === 0) return;

    const progress = ((this.currentIndex + 1) / this.photos.length) * 100;
    this.progressBar.style.width = `${progress}%`;
    this.progressText.textContent = `Photo ${this.currentIndex + 1} of ${this.photos.length}`;
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboard(e) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.previousPhoto();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.nextPhoto();
        break;
      case ' ':
        e.preventDefault();
        this.togglePlayPause();
        break;
      case 'Escape':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        break;
    }
  }

  /**
   * Handle touch events for swipe navigation
   */
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
  }

  handleTouchEnd(e) {
    if (!this.touchStartX) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = this.touchStartX - touchEndX;

    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) {
        this.nextPhoto();
      } else {
        this.previousPhoto();
      }
    }

    this.touchStartX = null;
  }

  /**
   * Show/hide loading indicator
   */
  showLoading(show) {
    this.loading.style.display = show ? 'flex' : 'none';
  }

  /**
   * Show error message
   */
  showError(message) {
    this.container.innerHTML = `
      <div class="carousel-error">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" class="carousel-btn">Retry</button>
      </div>
    `;
  }

  /**
   * Show controls and reset hide timer
   */
  showControls() {
    if (!this.controlsVisible) {
      this.controls.style.opacity = '1';
      this.controls.style.transform = 'translateY(0)';
      this.controlsVisible = true;
    }
    this.startHideControlsTimer();
  }

  /**
   * Hide controls
   */
  hideControls() {
    if (this.controlsVisible) {
      this.controls.style.opacity = '0';
      this.controls.style.transform = 'translateY(20px)';
      this.controlsVisible = false;
    }
  }

  /**
   * Start the timer to hide controls
   */
  startHideControlsTimer() {
    // Clear existing timer
    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
    }
    
    // Set new timer
    this.hideControlsTimer = setTimeout(() => {
      this.hideControls();
    }, this.hideControlsDelay);
  }

  /**
   * Destroy carousel and clean up
   */
  destroy() {
    this.stopRotation();
    // Clear auto-hide timer
    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
    }
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyboard);
  }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const carouselContainer = document.getElementById('photo-carousel');
  if (carouselContainer) {
    window.photoCarousel = new PhotoCarousel('photo-carousel');
  }
});
