/**
 * Tabbed Navigation JavaScript - Task 1.2
 * Handles tab switching, stats updates, and content management
 */

class TabbedNavigationManager {
    constructor() {
        this.currentTab = 'photos';
        this.stats = {
            photos: 0,
            recipes: 0,
            blog: 0,
            comments: 0
        };
        this.filters = {
            photos: { search: '', filter: '' },
            recipes: { search: '', filter: '' },
            blog: { search: '', filter: '' },
            comments: { search: '', filter: '' }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeTabs();
        this.updateStats();
        this.loadInitialContent();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (event) => {
                this.handleTabSwitch(event.target);
            });
        });

        // Search functionality
        this.setupSearchListeners();
        
        // Filter functionality
        this.setupFilterListeners();
        
        // Clear filter buttons
        this.setupClearFilterListeners();
    }

    setupSearchListeners() {
        const searchInputs = {
            photos: document.getElementById('photoSearch'),
            recipes: document.getElementById('recipeSearch'),
            blog: document.getElementById('blogSearch'),
            comments: document.getElementById('commentSearch')
        };

        Object.entries(searchInputs).forEach(([tab, input]) => {
            if (input) {
                input.addEventListener('input', (e) => {
                    this.filters[tab].search = e.target.value;
                    this.filterContent(tab);
                });
            }
        });
    }

    setupFilterListeners() {
        const filterSelects = {
            photos: document.getElementById('photoFilter'),
            recipes: document.getElementById('recipeFilter'),
            blog: document.getElementById('blogFilter'),
            comments: document.getElementById('commentFilter')
        };

        Object.entries(filterSelects).forEach(([tab, select]) => {
            if (select) {
                select.addEventListener('change', (e) => {
                    this.filters[tab].filter = e.target.value;
                    this.filterContent(tab);
                });
            }
        });
    }

    setupClearFilterListeners() {
        const clearButtons = {
            photos: () => this.clearPhotoFilters(),
            recipes: () => this.clearRecipeFilters(),
            blog: () => this.clearBlogFilters(),
            comments: () => this.clearCommentFilters()
        };

        // These functions will be called from the HTML onclick handlers
        window.clearPhotoFilters = clearButtons.photos;
        window.clearRecipeFilters = clearButtons.recipes;
        window.clearBlogFilters = clearButtons.blog;
        window.clearCommentFilters = clearButtons.comments;
    }

    initializeTabs() {
        // Initialize Bootstrap tabs
        if (typeof bootstrap !== 'undefined' && bootstrap.Tab) {
            const triggerTabList = [].slice.call(document.querySelectorAll('#contentTabs button'));
            triggerTabList.forEach(function (triggerEl) {
                const tabTrigger = new bootstrap.Tab(triggerEl);
                triggerEl.addEventListener('click', function (event) {
                    event.preventDefault();
                    tabTrigger.show();
                });
            });
        }
    }

    handleTabSwitch(tabElement) {
        const tabId = tabElement.getAttribute('data-bs-target').replace('#', '');
        this.currentTab = tabId;
        
        // Update active state
        this.updateActiveTab(tabId);
        
        // Load content for the active tab
        this.loadTabContent(tabId);
        
        // Update URL hash (optional)
        window.location.hash = tabId;
    }

    updateActiveTab(tabId) {
        // Remove active class from all tabs
        document.querySelectorAll('#contentTabs .nav-link').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to current tab
        const currentTab = document.querySelector(`[data-bs-target="#${tabId}"]`);
        if (currentTab) {
            currentTab.classList.add('active');
        }
        
        // Update tab content visibility
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('show', 'active');
        });
        
        const currentPane = document.getElementById(tabId);
        if (currentPane) {
            currentPane.classList.add('show', 'active');
        }
    }

    loadTabContent(tabId) {
        // Show loading state
        this.showLoading(tabId);
        
        // Simulate content loading (replace with actual API calls)
        setTimeout(() => {
            this.hideLoading(tabId);
            this.displayTabContent(tabId);
        }, 300);
    }

    displayTabContent(tabId) {
        const contentContainer = this.getContentContainer(tabId);
        const emptyMessage = this.getEmptyMessage(tabId);
        
        if (this.stats[tabId] === 0) {
            this.showEmptyState(tabId);
        } else {
            this.hideEmptyState(tabId);
            this.renderContent(tabId);
        }
    }

    getContentContainer(tabId) {
        const containers = {
            photos: document.getElementById('photosGrid'),
            recipes: document.getElementById('recipesGrid'),
            blog: document.getElementById('blogGrid'),
            comments: document.getElementById('commentsList')
        };
        return containers[tabId];
    }

    getEmptyMessage(tabId) {
        const messages = {
            photos: document.getElementById('noPhotosMessage'),
            recipes: document.getElementById('noRecipesMessage'),
            blog: document.getElementById('noBlogMessage'),
            comments: document.getElementById('noCommentsMessage')
        };
        return messages[tabId];
    }

    showEmptyState(tabId) {
        const container = this.getContentContainer(tabId);
        const message = this.getEmptyMessage(tabId);
        
        if (container) container.style.display = 'none';
        if (message) message.style.display = 'block';
    }

    hideEmptyState(tabId) {
        const container = this.getContentContainer(tabId);
        const message = this.getEmptyMessage(tabId);
        
        if (container) container.style.display = 'block';
        if (message) message.style.display = 'none';
    }

    renderContent(tabId) {
        // This will be implemented in later phases
        // For now, just show placeholder content
        const container = this.getContentContainer(tabId);
        if (container) {
            container.innerHTML = `<div class="text-center text-muted py-3">
                <i class="fas fa-spinner fa-spin me-2"></i>
                Loading ${tabId} content...
            </div>`;
        }
    }

    filterContent(tabId) {
        const searchTerm = this.filters[tabId].search.toLowerCase();
        const filterValue = this.filters[tabId].filter;
        
        // This will be implemented when we have actual content
        console.log(`Filtering ${tabId}: search="${searchTerm}", filter="${filterValue}"`);
        
        // For now, just update the display
        this.displayTabContent(tabId);
    }

    clearPhotoFilters() {
        this.clearFilters('photos');
    }

    clearRecipeFilters() {
        this.clearFilters('recipes');
    }

    clearBlogFilters() {
        this.clearFilters('blog');
    }

    clearCommentFilters() {
        this.clearFilters('comments');
    }

    clearFilters(tabId) {
        this.filters[tabId] = { search: '', filter: '' };
        
        // Clear form inputs
        const searchInput = document.getElementById(`${tabId}Search`);
        const filterSelect = document.getElementById(`${tabId}Filter`);
        
        if (searchInput) searchInput.value = '';
        if (filterSelect) filterSelect.value = '';
        
        // Re-filter content
        this.filterContent(tabId);
    }

    updateStats() {
        // Update stats numbers
        Object.keys(this.stats).forEach(tabId => {
            const countElement = document.getElementById(`${tabId}Count`);
            const badgeElement = document.getElementById(`${tabId}Badge`);
            
            if (countElement) countElement.textContent = this.stats[tabId];
            if (badgeElement) badgeElement.textContent = this.stats[tabId];
        });
    }

    loadInitialContent() {
        // Load content for the active tab
        this.loadTabContent(this.currentTab);
    }

    showLoading(tabId) {
        const container = this.getContentContainer(tabId);
        if (container) {
            container.classList.add('loading');
        }
    }

    hideLoading(tabId) {
        const container = this.getContentContainer(tabId);
        if (container) {
            container.classList.remove('loading');
        }
    }

    // Public methods for external use
    switchToTab(tabId) {
        const tabElement = document.querySelector(`[data-bs-target="#${tabId}"]`);
        if (tabElement) {
            tabElement.click();
        }
    }

    updateTabStats(tabId, count) {
        this.stats[tabId] = count;
        this.updateStats();
        this.displayTabContent(tabId);
    }

    refreshTab(tabId) {
        this.loadTabContent(tabId);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabbed navigation
    window.tabbedNavigation = new TabbedNavigationManager();
    
    // Handle URL hash for direct tab access
    if (window.location.hash) {
        const tabId = window.location.hash.substring(1);
        if (['photos', 'recipes', 'blog', 'comments'].includes(tabId)) {
            setTimeout(() => {
                window.tabbedNavigation.switchToTab(tabId);
            }, 100);
        }
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TabbedNavigationManager;
}

