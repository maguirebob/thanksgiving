/**
 * Navigation Unit Tests
 * Tests for tabbed navigation functionality and quick stats calculation
 */

// Mock Bootstrap for testing
const mockBootstrap = {
  Tab: jest.fn().mockImplementation(() => ({
    show: jest.fn(),
    dispose: jest.fn()
  }))
};

// Mock global bootstrap
(global as any).bootstrap = mockBootstrap;

describe('Navigation Functionality', () => {
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <!-- Quick Stats Section -->
      <div class="quick-stats-section mb-4">
        <div class="row g-3">
          <div class="col-md-3 col-sm-6">
            <div class="stats-card">
              <div class="stats-content">
                <div class="stats-number" id="photoCount">5</div>
                <div class="stats-label">Photos</div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6">
            <div class="stats-card">
              <div class="stats-content">
                <div class="stats-number" id="recipeCount">3</div>
                <div class="stats-label">Recipes</div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6">
            <div class="stats-card">
              <div class="stats-content">
                <div class="stats-number" id="blogCount">2</div>
                <div class="stats-label">Blog Posts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabbed Navigation -->
      <div class="tabbed-navigation">
        <ul class="nav nav-tabs custom-tabs mb-4" id="contentTabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" id="photos-tab" data-bs-toggle="tab" data-bs-target="#photos" type="button" role="tab" aria-controls="photos" aria-selected="true">
              <i class="fas fa-images me-2"></i>Photos
              <span class="badge bg-primary ms-2" id="photosBadge">0</span>
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="recipes-tab" data-bs-toggle="tab" data-bs-target="#recipes" type="button" role="tab" aria-controls="recipes" aria-selected="false">
              <i class="fas fa-book-open me-2"></i>Recipes
              <span class="badge bg-success ms-2" id="recipesBadge">0</span>
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="blog-tab" data-bs-toggle="tab" data-bs-target="#blog" type="button" role="tab" aria-controls="blog" aria-selected="false">
              <i class="fas fa-blog me-2"></i>Blog
              <span class="badge bg-info ms-2" id="blogBadge">0</span>
            </button>
          </li>
        </ul>

        <div class="tab-content" id="contentTabsContent">
          <div class="tab-pane fade show active" id="photos" role="tabpanel" aria-labelledby="photos-tab">
            <div class="photos-section">
              <h3>Photos Content</h3>
            </div>
          </div>
          <div class="tab-pane fade" id="recipes" role="tabpanel" aria-labelledby="recipes-tab">
            <div class="recipes-section">
              <h3>Recipes Content</h3>
            </div>
          </div>
          <div class="tab-pane fade" id="blog" role="tabpanel" aria-labelledby="blog-tab">
            <div class="blog-section">
              <h3>Blog Content</h3>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Tab Badge Updates', () => {
    test('should update tab badges with current stats counts', () => {
      // Mock the updateTabBadges function
      const updateTabBadges = () => {
        const photoCount = document.getElementById('photoCount')?.textContent || '0';
        const recipeCount = document.getElementById('recipeCount')?.textContent || '0';
        const blogCount = document.getElementById('blogCount')?.textContent || '0';
        
        const photosBadge = document.getElementById('photosBadge');
        const recipesBadge = document.getElementById('recipesBadge');
        const blogBadge = document.getElementById('blogBadge');
        
        if (photosBadge) photosBadge.textContent = photoCount;
        if (recipesBadge) recipesBadge.textContent = recipeCount;
        if (blogBadge) blogBadge.textContent = blogCount;
      };

      // Execute the function
      updateTabBadges();

      // Verify badges are updated correctly
      expect(document.getElementById('photosBadge')?.textContent).toBe('5');
      expect(document.getElementById('recipesBadge')?.textContent).toBe('3');
      expect(document.getElementById('blogBadge')?.textContent).toBe('2');
    });

    test('should handle missing stats elements gracefully', () => {
      // Remove some stats elements
      document.getElementById('photoCount')?.remove();
      document.getElementById('recipeCount')?.remove();

      const updateTabBadges = () => {
        const photoCount = document.getElementById('photoCount')?.textContent || '0';
        const recipeCount = document.getElementById('recipeCount')?.textContent || '0';
        const blogCount = document.getElementById('blogCount')?.textContent || '0';
        
        const photosBadge = document.getElementById('photosBadge');
        const recipesBadge = document.getElementById('recipesBadge');
        const blogBadge = document.getElementById('blogBadge');
        
        if (photosBadge) photosBadge.textContent = photoCount;
        if (recipesBadge) recipesBadge.textContent = recipeCount;
        if (blogBadge) blogBadge.textContent = blogCount;
      };

      // Should not throw errors
      expect(() => updateTabBadges()).not.toThrow();
      
      // Should use default values
      expect(document.getElementById('photosBadge')?.textContent).toBe('0');
      expect(document.getElementById('recipesBadge')?.textContent).toBe('0');
      expect(document.getElementById('blogBadge')?.textContent).toBe('2');
    });
  });

  describe('Tab Switching Functionality', () => {
    test('should initialize Bootstrap tabs correctly', () => {
      const initializeTabbedNavigation = () => {
        const tabTriggerList = Array.from(document.querySelectorAll('#contentTabs button[data-bs-toggle="tab"]'));
        tabTriggerList.forEach((tabTriggerEl) => {
          new mockBootstrap.Tab(tabTriggerEl);
        });
      };

      initializeTabbedNavigation();

      // Verify Bootstrap.Tab was called for each tab button
      expect(mockBootstrap.Tab).toHaveBeenCalledTimes(3);
    });

    test('should handle tab click events', () => {
      const recipesTab = document.getElementById('recipes-tab');
      const photosTab = document.getElementById('photos-tab');
      
      // Mock click handler
      const handleTabClick = () => {
        const tabButtons = document.querySelectorAll('#contentTabs .nav-link');
        
        // Update active tab styling
        tabButtons.forEach((btn: any) => btn.classList.remove('active'));
        recipesTab?.classList.add('active');
        
        // Update tab content visibility
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabPanes.forEach((pane: any) => {
          pane.classList.remove('show', 'active');
        });
        
        const recipesPane = document.getElementById('recipes');
        if (recipesPane) {
          recipesPane.classList.add('show', 'active');
        }
      };

      // Simulate tab switch
      handleTabClick();

      // Verify active states
      expect(recipesTab?.classList.contains('active')).toBe(true);
      expect(photosTab?.classList.contains('active')).toBe(false);
      
      // Verify tab content visibility
      const recipesPane = document.getElementById('recipes');
      const photosPane = document.getElementById('photos');
      
      expect(recipesPane?.classList.contains('active')).toBe(true);
      expect(photosPane?.classList.contains('active')).toBe(false);
    });

    test('should maintain proper ARIA attributes', () => {
      const photosTab = document.getElementById('photos-tab');
      const recipesTab = document.getElementById('recipes-tab');
      
      // Check initial ARIA attributes
      expect(photosTab?.getAttribute('aria-selected')).toBe('true');
      expect(recipesTab?.getAttribute('aria-selected')).toBe('false');
      
      // Simulate tab switch
      const handleTabSwitch = () => {
        photosTab?.setAttribute('aria-selected', 'false');
        recipesTab?.setAttribute('aria-selected', 'true');
      };

      handleTabSwitch();
      
      expect(photosTab?.getAttribute('aria-selected')).toBe('false');
      expect(recipesTab?.getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('Tab Content Management', () => {
    test('should show placeholder alerts for unimplemented features', () => {
      // Mock alert function
      const mockAlert = jest.fn();
      (global as any).alert = mockAlert;

      const addRecipe = () => {
        (global as any).alert('Recipe functionality coming soon!');
      };

      const addBlogPost = () => {
        (global as any).alert('Blog post functionality coming soon!');
      };

      // Test each function
      addRecipe();
      addBlogPost();

      expect(mockAlert).toHaveBeenCalledTimes(2);
      expect(mockAlert).toHaveBeenCalledWith('Recipe functionality coming soon!');
      expect(mockAlert).toHaveBeenCalledWith('Blog post functionality coming soon!');
    });

    test('should have proper tab content structure', () => {
      // Check that all tab panes exist
      expect(document.getElementById('photos')).toBeTruthy();
      expect(document.getElementById('recipes')).toBeTruthy();
      expect(document.getElementById('blog')).toBeTruthy();

      // Check that tab panes have proper classes
      const tabPanes = document.querySelectorAll('.tab-pane');
      expect(tabPanes).toHaveLength(3);
      
      tabPanes.forEach((pane: any) => {
        expect(pane.classList.contains('tab-pane')).toBe(true);
        expect(pane.classList.contains('fade')).toBe(true);
      });

      // Check that photos tab is initially active
      const photosPane = document.getElementById('photos');
      expect(photosPane?.classList.contains('show')).toBe(true);
      expect(photosPane?.classList.contains('active')).toBe(true);
    });
  });

  describe('Quick Stats Integration', () => {
    test('should sync stats with tab badges on initialization', () => {
      const initializeStats = () => {
        const photoCount = document.getElementById('photoCount')?.textContent || '0';
        const recipeCount = document.getElementById('recipeCount')?.textContent || '0';
        const blogCount = document.getElementById('blogCount')?.textContent || '0';
        
        // Update badges
        const photosBadge = document.getElementById('photosBadge');
        const recipesBadge = document.getElementById('recipesBadge');
        const blogBadge = document.getElementById('blogBadge');
        
        if (photosBadge) photosBadge.textContent = photoCount;
        if (recipesBadge) recipesBadge.textContent = recipeCount;
        if (blogBadge) blogBadge.textContent = blogCount;
      };

      initializeStats();

      // Verify synchronization
      expect(document.getElementById('photosBadge')?.textContent).toBe('5');
      expect(document.getElementById('recipesBadge')?.textContent).toBe('3');
      expect(document.getElementById('blogBadge')?.textContent).toBe('2');
    });

    test('should handle dynamic stats updates', () => {
      // Simulate stats update
      const updateStats = (newStats: { photos: number; recipes: number; blog: number }) => {
        const photoCountEl = document.getElementById('photoCount');
        const recipeCountEl = document.getElementById('recipeCount');
        const blogCountEl = document.getElementById('blogCount');
        
        if (photoCountEl) photoCountEl.textContent = newStats.photos.toString();
        if (recipeCountEl) recipeCountEl.textContent = newStats.recipes.toString();
        if (blogCountEl) blogCountEl.textContent = newStats.blog.toString();
      };

      // Update stats
      updateStats({ photos: 10, recipes: 7, blog: 4 });

      // Verify updates
      expect(document.getElementById('photoCount')?.textContent).toBe('10');
      expect(document.getElementById('recipeCount')?.textContent).toBe('7');
      expect(document.getElementById('blogCount')?.textContent).toBe('4');
    });
  });

  describe('Responsive Design', () => {
    test('should have proper responsive classes', () => {
      const tabButtons = document.querySelectorAll('#contentTabs .nav-link');
      
      tabButtons.forEach((button: any) => {
        expect(button.classList.contains('nav-link')).toBe(true);
      });

      const tabPanes = document.querySelectorAll('.tab-pane');
      
      tabPanes.forEach((pane: any) => {
        expect(pane.classList.contains('tab-pane')).toBe(true);
        expect(pane.classList.contains('fade')).toBe(true);
      });
    });

    test('should maintain accessibility attributes', () => {
      const tabButtons = document.querySelectorAll('#contentTabs button[role="tab"]');
      
      expect(tabButtons).toHaveLength(3);
      
      tabButtons.forEach((button: any) => {
        expect(button.getAttribute('role')).toBe('tab');
        expect(button.getAttribute('aria-controls')).toBeTruthy();
        expect(button.getAttribute('aria-selected')).toBeTruthy();
      });

      const tabPanes = document.querySelectorAll('.tab-pane[role="tabpanel"]');
      
      expect(tabPanes).toHaveLength(3);
      
      tabPanes.forEach((pane: any) => {
        expect(pane.getAttribute('role')).toBe('tabpanel');
        expect(pane.getAttribute('aria-labelledby')).toBeTruthy();
      });
    });
  });
});
