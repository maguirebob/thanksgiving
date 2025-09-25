/**
 * Search Component - Reusable search and filter functionality
 * Provides common search patterns for photos, blogs, and other content
 */

class SearchComponent {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            placeholder: 'Search...',
            debounceMs: 300,
            showFilters: true,
            showSort: true,
            onSearch: null,
            onFilter: null,
            onSort: null,
            ...options
        };
        
        this.currentSearch = '';
        this.currentFilters = {};
        this.currentSort = 'newest';
        
        this.init();
    }

    init() {
        this.createSearchInterface();
        this.bindEvents();
    }

    createSearchInterface() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="search-component">
                <div class="row">
                    <div class="col-md-6">
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                            <input type="text" class="form-control" id="searchInput" 
                                   placeholder="${this.options.placeholder}">
                            <button class="btn btn-outline-secondary" type="button" id="clearSearchBtn">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    ${this.options.showSort ? `
                        <div class="col-md-3">
                            <select class="form-select" id="sortSelect">
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="name">Name A-Z</option>
                                <option value="relevance">Most Relevant</option>
                            </select>
                        </div>
                    ` : ''}
                    ${this.options.showFilters ? `
                        <div class="col-md-3">
                            <button class="btn btn-outline-secondary w-100" id="filtersBtn">
                                <i class="fas fa-filter me-2"></i>Filters
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Advanced Filters Panel -->
                <div id="filtersPanel" class="mt-3" style="display: none;">
                    <div class="card">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <label class="form-label">Date Range</label>
                                    <div class="row">
                                        <div class="col-6">
                                            <input type="date" class="form-control form-control-sm" id="dateFrom">
                                        </div>
                                        <div class="col-6">
                                            <input type="date" class="form-control form-control-sm" id="dateTo">
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Status</label>
                                    <select class="form-select form-select-sm" id="statusFilter">
                                        <option value="">All</option>
                                        <option value="active">Active</option>
                                        <option value="draft">Draft</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Type</label>
                                    <select class="form-select form-select-sm" id="typeFilter">
                                        <option value="">All Types</option>
                                        <option value="image">Images</option>
                                        <option value="text">Text</option>
                                        <option value="mixed">Mixed</option>
                                    </select>
                                </div>
                            </div>
                            <div class="mt-3">
                                <button class="btn btn-primary btn-sm me-2" id="applyFiltersBtn">
                                    <i class="fas fa-check me-1"></i>Apply Filters
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" id="clearFiltersBtn">
                                    <i class="fas fa-times me-1"></i>Clear All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Search input events
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        const sortSelect = document.getElementById('sortSelect');
        const filtersBtn = document.getElementById('filtersBtn');
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');

        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => this.handleSearch(), this.options.debounceMs));
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => this.clearSearch());
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.handleSort());
        }

        if (filtersBtn) {
            filtersBtn.addEventListener('click', () => this.toggleFilters());
        }

        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
    }

    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        this.currentSearch = searchInput ? searchInput.value.trim() : '';
        
        if (this.options.onSearch) {
            this.options.onSearch(this.currentSearch);
        }
    }

    handleSort() {
        const sortSelect = document.getElementById('sortSelect');
        this.currentSort = sortSelect ? sortSelect.value : 'newest';
        
        if (this.options.onSort) {
            this.options.onSort(this.currentSort);
        }
    }

    applyFilters() {
        const dateFrom = document.getElementById('dateFrom')?.value || '';
        const dateTo = document.getElementById('dateTo')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        const type = document.getElementById('typeFilter')?.value || '';

        this.currentFilters = {
            dateFrom,
            dateTo,
            status,
            type
        };

        if (this.options.onFilter) {
            this.options.onFilter(this.currentFilters);
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            this.currentSearch = '';
            
            if (this.options.onSearch) {
                this.options.onSearch('');
            }
        }
    }

    clearFilters() {
        // Clear filter inputs
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const statusFilter = document.getElementById('statusFilter');
        const typeFilter = document.getElementById('typeFilter');

        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        if (statusFilter) statusFilter.value = '';
        if (typeFilter) typeFilter.value = '';

        this.currentFilters = {};

        if (this.options.onFilter) {
            this.options.onFilter({});
        }
    }

    toggleFilters() {
        const filtersPanel = document.getElementById('filtersPanel');
        const filtersBtn = document.getElementById('filtersBtn');
        
        if (filtersPanel && filtersBtn) {
            const isVisible = filtersPanel.style.display !== 'none';
            filtersPanel.style.display = isVisible ? 'none' : 'block';
            
            const icon = filtersBtn.querySelector('i');
            if (icon) {
                icon.className = isVisible ? 'fas fa-filter me-2' : 'fas fa-filter me-2 fa-flip-horizontal';
            }
        }
    }

    getSearchParams() {
        return {
            search: this.currentSearch,
            sort: this.currentSort,
            filters: this.currentFilters
        };
    }

    setSearchValue(value) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = value;
            this.currentSearch = value;
        }
    }

    setSortValue(value) {
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.value = value;
            this.currentSort = value;
        }
    }

    setFilters(filters) {
        this.currentFilters = { ...filters };
        
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const statusFilter = document.getElementById('statusFilter');
        const typeFilter = document.getElementById('typeFilter');

        if (dateFrom && filters.dateFrom) dateFrom.value = filters.dateFrom;
        if (dateTo && filters.dateTo) dateTo.value = filters.dateTo;
        if (statusFilter && filters.status) statusFilter.value = filters.status;
        if (typeFilter && filters.type) typeFilter.value = filters.type;
    }

    reset() {
        this.clearSearch();
        this.clearFilters();
        this.setSortValue('newest');
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
    module.exports = SearchComponent;
}
