/**
 * Journal Viewer Component
 * Handles the public journal viewer functionality
 */
class JournalViewer {
    constructor() {
        this.currentYear = null;
        this.currentPage = 0;
        this.journalData = null;
        this.years = [];
        
        this.init();
    }
    
    async init() {
        console.log('📖 Journal Viewer initialized');
        await this.loadYears();
        this.setupEventListeners();
    }
    
    async loadYears() {
        try {
            console.log('📅 Loading available years...');
            const response = await fetch('/api/journal/viewer/years');
            const result = await response.json();
            
            if (result.success) {
                this.years = result.data.years;
                this.renderYearSelector();
                console.log('✅ Years loaded:', this.years);
            } else {
                console.error('❌ Failed to load years:', result.message);
                this.showError('Failed to load available years');
            }
        } catch (error) {
            console.error('❌ Error loading years:', error);
            this.showError('Error loading available years');
        }
    }
    
    renderYearSelector() {
        const yearSelector = document.getElementById('yearSelector');
        
        if (this.years.length === 0) {
            yearSelector.innerHTML = `
                <div class="no-content">
                    <i class="fas fa-calendar-times fa-2x mb-2 text-muted"></i>
                    <p class="text-muted">No journal pages available</p>
                </div>
            `;
            return;
        }
        
        yearSelector.innerHTML = this.years.map(year => `
            <button class="year-btn" data-year="${year}" onclick="journalViewer.selectYear(${year})">
                <i class="fas fa-calendar me-2"></i>
                ${year}
            </button>
        `).join('');
    }
    
    async selectYear(year) {
        try {
            console.log(`📖 Selecting year: ${year}`);
            this.currentYear = year;
            this.currentPage = 0;
            
            // Update year button states
            document.querySelectorAll('.year-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.year == year) {
                    btn.classList.add('active');
                }
            });
            
            // Show loading
            this.showLoading();
            
            // Load journal data for the year
            await this.loadJournalData(year);
            
        } catch (error) {
            console.error('❌ Error selecting year:', error);
            this.showError('Error loading journal data');
        }
    }
    
    async loadJournalData(year) {
        try {
            console.log(`📖 Loading journal data for year: ${year}`);
            const response = await fetch(`/api/journal/viewer/data?year=${year}`);
            const result = await response.json();
            
            if (result.success) {
                this.journalData = result.data;
                this.renderJournalContent();
                console.log('✅ Journal data loaded:', this.journalData);
            } else {
                console.error('❌ Failed to load journal data:', result.message);
                this.showError('Failed to load journal data');
            }
        } catch (error) {
            console.error('❌ Error loading journal data:', error);
            this.showError('Error loading journal data');
        }
    }
    
    renderJournalContent() {
        const journalContent = document.getElementById('journalContent');
        
        if (!this.journalData || !this.journalData.pages || this.journalData.pages.length === 0) {
            journalContent.innerHTML = `
                <div class="no-content">
                    <i class="fas fa-book-open fa-3x mb-3 text-muted"></i>
                    <h4>No journal pages found for ${this.currentYear}</h4>
                    <p class="text-muted">There are no journal pages available for this year</p>
                </div>
            `;
            return;
        }
        
        // Render the current page
        this.renderCurrentPage();
    }
    
    renderCurrentPage() {
        const journalContent = document.getElementById('journalContent');
        const page = this.journalData.pages[this.currentPage];
        
        if (!page) {
            journalContent.innerHTML = `
                <div class="no-content">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3 text-muted"></i>
                    <h4>Page not found</h4>
                    <p class="text-muted">The requested page could not be found</p>
                </div>
            `;
            return;
        }
        
        // Generate page navigation
        const pageNav = this.journalData.pages.length > 1 ? this.generatePageNavigation() : '';
        
        // Generate content HTML
        const contentHtml = this.generateContentHtml(page.content_items);
        
        journalContent.innerHTML = `
            <div class="journal-page">
                <div class="text-center mb-4">
                    <h2 class="text-primary mb-2">
                        <i class="fas fa-calendar me-2"></i>
                        ${this.currentYear} - Page ${page.page_number}
                    </h2>
                    ${page.title ? `<h3 class="text-muted">${page.title}</h3>` : ''}
                    ${page.description ? `<p class="lead text-muted">${page.description}</p>` : ''}
                </div>
                
                <div class="journal-content">
                    ${contentHtml}
                </div>
                
                ${pageNav}
            </div>
        `;
    }
    
    generatePageNavigation() {
        const totalPages = this.journalData.pages.length;
        const currentPageNum = this.currentPage + 1;
        
        let navHtml = '<div class="page-nav">';
        
        // Previous page button
        if (this.currentPage > 0) {
            navHtml += `
                <button class="page-btn" onclick="journalViewer.goToPage(${this.currentPage - 1})">
                    <i class="fas fa-chevron-left me-2"></i>
                    Previous
                </button>
            `;
        }
        
        // Page numbers
        for (let i = 0; i < totalPages; i++) {
            const pageNum = i + 1;
            const isActive = i === this.currentPage ? 'active' : '';
            navHtml += `
                <button class="page-btn ${isActive}" onclick="journalViewer.goToPage(${i})">
                    Page ${pageNum}
                </button>
            `;
        }
        
        // Next page button
        if (this.currentPage < totalPages - 1) {
            navHtml += `
                <button class="page-btn" onclick="journalViewer.goToPage(${this.currentPage + 1})">
                    Next
                    <i class="fas fa-chevron-right ms-2"></i>
                </button>
            `;
        }
        
        navHtml += '</div>';
        return navHtml;
    }
    
    goToPage(pageIndex) {
        if (pageIndex >= 0 && pageIndex < this.journalData.pages.length) {
            this.currentPage = pageIndex;
            this.renderCurrentPage();
        }
    }
    
    generateContentHtml(contentItems) {
        if (!contentItems || contentItems.length === 0) {
            return `
                <div class="no-content">
                    <i class="fas fa-file-alt fa-2x mb-2 text-muted"></i>
                    <p class="text-muted">No content items on this page</p>
                </div>
            `;
        }
        
        return contentItems.map(item => this.generateContentItemHtml(item)).join('');
    }
    
    generateContentItemHtml(item) {
        const baseClasses = `content-item ${item.content_type}`;
        
        switch (item.content_type) {
            case 'text':
                return `
                    <div class="${baseClasses}">
                        <div class="text-content">${item.custom_text}</div>
                    </div>
                `;
                
            case 'heading':
                return `
                    <div class="${baseClasses}">
                        <h${item.heading_level || 1} class="journal-heading">${item.custom_text}</h${item.heading_level || 1}>
                    </div>
                `;
                
            case 'menu':
                const menuImage = item.menu?.menu_image_s3_url ? 
                    `<img src="${item.menu.menu_image_s3_url}" alt="${item.menu.menu_title}" class="journal-image menu-image">` : 
                    `<div class="bg-light rounded p-3 mb-2 text-center"><i class="fas fa-utensils fa-2x text-muted"></i></div>`;
                return `
                    <div class="${baseClasses}">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <i class="fas fa-utensils me-2"></i>
                                    ${item.menu?.menu_title || 'Unknown Menu'}
                                </h5>
                                <p class="card-text text-muted">
                                    ${new Date(item.menu?.event_date).toLocaleDateString()}
                                </p>
                                ${menuImage}
                            </div>
                        </div>
                    </div>
                `;
                
            case 'photo':
                const photoImage = item.photo?.s3_url ? 
                    `<img src="${item.photo.s3_url}" alt="${item.photo.original_filename || item.photo.filename}" class="journal-image photo-image">` : 
                    `<div class="bg-light rounded p-3 mb-2 text-center"><i class="fas fa-image fa-2x text-muted"></i></div>`;
                return `
                    <div class="${baseClasses}">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">
                                    <i class="fas fa-image me-2"></i>
                                    ${item.photo?.original_filename || item.photo?.filename || 'Unknown Photo'}
                                </h6>
                                ${item.photo?.caption ? `<p class="card-text">${item.photo.caption}</p>` : ''}
                                ${photoImage}
                            </div>
                        </div>
                    </div>
                `;
                
            case 'page_photo':
                const pagePhotoImage = item.photo?.s3_url ? 
                    `<img src="${item.photo.s3_url}" alt="${item.photo.original_filename || item.photo.filename}" class="journal-image page-photo-image">` : 
                    `<div class="bg-light rounded p-3 mb-2 text-center"><i class="fas fa-file-image fa-2x text-muted"></i></div>`;
                return `
                    <div class="${baseClasses}">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">
                                    <i class="fas fa-file-image me-2"></i>
                                    ${item.photo?.original_filename || item.photo?.filename || 'Unknown Page'}
                                </h6>
                                ${item.photo?.caption ? `<p class="card-text">${item.photo.caption}</p>` : ''}
                                ${pagePhotoImage}
                            </div>
                        </div>
                    </div>
                `;
                
            case 'blog':
                const blogImages = this.generateBlogImages(item.blog_post);
                const blogExcerpt = item.blog_post?.excerpt || (item.blog_post?.content ? item.blog_post.content.substring(0, 150) + '...' : '');
                return `
                    <div class="${baseClasses}">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <i class="fas fa-blog me-2"></i>
                                    ${item.blog_post?.title || 'Unknown Blog'}
                                </h5>
                                ${blogExcerpt ? `<p class="card-text">${blogExcerpt}</p>` : ''}
                                ${blogImages}
                            </div>
                        </div>
                    </div>
                `;
                
            default:
                return `
                    <div class="${baseClasses}">
                        <div class="text-muted">
                            <i class="fas fa-question-circle me-2"></i>
                            Unknown content type: ${item.content_type}
                        </div>
                    </div>
                `;
        }
    }
    
    generateBlogImages(blogPost) {
        if (!blogPost) return '';
        
        const allImages = [];
        
        // Add featured image if it exists
        if (blogPost.featured_image) {
            allImages.push(blogPost.featured_image);
        }
        
        // Add images from the images array
        if (blogPost.images && Array.isArray(blogPost.images)) {
            allImages.push(...blogPost.images);
        }
        
        if (allImages.length === 0) {
            return '<div class="bg-light rounded p-3 mb-2 text-center"><i class="fas fa-blog fa-2x text-muted"></i></div>';
        }
        
        return allImages.map(imageUrl => `
            <img src="${imageUrl}" alt="${blogPost.title}" class="journal-image blog-image mb-2">
        `).join('');
    }
    
    showLoading() {
        const journalContent = document.getElementById('journalContent');
        journalContent.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
                <h4>Loading journal pages...</h4>
                <p class="text-muted">Please wait while we load the content for ${this.currentYear}</p>
            </div>
        `;
    }
    
    showError(message) {
        const journalContent = document.getElementById('journalContent');
        journalContent.innerHTML = `
            <div class="no-content">
                <i class="fas fa-exclamation-triangle fa-3x mb-3 text-danger"></i>
                <h4>Error</h4>
                <p class="text-muted">${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh me-2"></i>
                    Try Again
                </button>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Add any additional event listeners here
        console.log('📖 Event listeners setup complete');
    }
}

// Initialize the journal viewer when the page loads
let journalViewer;
document.addEventListener('DOMContentLoaded', () => {
    journalViewer = new JournalViewer();
});
