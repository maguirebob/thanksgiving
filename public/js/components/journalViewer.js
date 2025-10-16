/**
 * Page-Based Scrapbook Journal Viewer
 * Handles the public journal viewer functionality with page-based layout
 */
class JournalViewer {
    constructor() {
        this.currentYear = null;
        this.currentPageIndex = 0;
        this.journalData = null;
        this.years = [];
        this.pages = []; // Array of page objects with content
        this.PAGE_HEIGHT = 820; // Fixed page height in pixels
        
        this.init();
    }
    
    async init() {
        console.log('📖 Page-Based Scrapbook Journal Viewer initialized');
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
                    <i class="fas fa-calendar-times fa-2x mb-2" style="color: var(--scrapbook-text-light);"></i>
                    <p class="scrapbook-text">No journal sections available</p>
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
    
    setupEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousPage();
            } else if (e.key === 'ArrowRight') {
                this.nextPage();
            } else if (e.key === 'Escape') {
                this.exitFullscreen();
            } else if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
            }
        });
    }
    
    async selectYear(year) {
        console.log(`📅 Selected year: ${year}`);
        this.currentYear = year;
        this.currentPageIndex = 0;
        
        // Clear existing content immediately to prevent display issues
        const journalContent = document.getElementById('journalContent');
        journalContent.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Loading journal...</p></div>';
        
        // Reset all state
        this.journalData = null;
        this.pages = [];
        
        // Update active year button
        document.querySelectorAll('.year-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-year="${year}"]`).classList.add('active');
        
        await this.loadJournalData();
    }
    
    async loadJournalData() {
        try {
            console.log(`📖 Loading journal data for year: ${this.currentYear}`);
            const response = await fetch(`/api/journal/viewer/data?year=${this.currentYear}`);
            const result = await response.json();
            
            if (result.success) {
                this.journalData = result.data;
                this.generatePages();
                this.renderCurrentPage();
                console.log('✅ Journal data loaded and pages generated');
            } else {
                console.error('❌ Failed to load journal data:', result.message);
                this.showError('Failed to load journal data');
            }
        } catch (error) {
            console.error('❌ Error loading journal data:', error);
            this.showError('Error loading journal data');
        }
    }
    
    generatePages() {
        console.log('📄 Generating pages from journal data...');
        this.pages = [];
        
        if (!this.journalData || !this.journalData.journal_sections || this.journalData.journal_sections.length === 0) {
            console.log('⚠️ No journal sections found');
            return;
        }
        
        // Create cover page
        this.pages.push(this.createCoverPage());
        
        // Process all content items from all sections
        const allContentItems = [];
        this.journalData.journal_sections.forEach(section => {
            if (section.content_items && section.content_items.length > 0) {
                allContentItems.push(...section.content_items);
            }
        });
        
        // Distribute content across pages
        this.distributeContentAcrossPages(allContentItems);
        
        console.log(`✅ Generated ${this.pages.length} pages`);
    }
    
    createCoverPage() {
        return {
            type: 'cover',
            pageNumber: 1,
            content: {
                year: this.currentYear,
                title: 'Thanksgiving Journal',
                subtitle: 'Our Family Memories'
            }
        };
    }
    
    distributeContentAcrossPages(contentItems) {
        let currentPage = this.createContentPage(2); // Start with page 2 (after cover)
        let pageNumber = 2;
        
        for (let i = 0; i < contentItems.length; i++) {
            const item = contentItems[i];
            
            // Check for manual page break
            if (item.manual_page_break) {
                // Save current page and start new one
                if (currentPage.content.length > 0) {
                    this.pages.push(currentPage);
                    pageNumber++;
                }
                currentPage = this.createContentPage(pageNumber);
            }
            
            // Distribute content based on type
            switch (item.content_type) {
                case 'menu':
                case 'page_photo':
                    // These get their own page
                    if (currentPage.content.length > 0) {
                        this.pages.push(currentPage);
                        pageNumber++;
                        currentPage = this.createContentPage(pageNumber);
                    }
                    currentPage.content.push(item);
                    this.pages.push(currentPage);
                    pageNumber++;
                    currentPage = this.createContentPage(pageNumber);
                    break;
                    
                case 'blog':
                    // Check if we can fit this blog on the current page
                    if (currentPage.content.length > 0 && !this.canAddBlogToPage(currentPage, item)) {
                        this.pages.push(currentPage);
                        pageNumber++;
                        currentPage = this.createContentPage(pageNumber);
                    }
                    currentPage.content.push(item);
                    
                    // If this blog has images, try to add another blog to the same page
                    if (item.blog_post && (item.blog_post.featured_image || (item.blog_post.images && item.blog_post.images.length > 0))) {
                        // Look for the next blog item
                        for (let j = i + 1; j < contentItems.length; j++) {
                            const nextItem = contentItems[j];
                            if (nextItem.content_type === 'blog' && 
                                nextItem.blog_post && 
                                (nextItem.blog_post.featured_image || (nextItem.blog_post.images && nextItem.blog_post.images.length > 0)) &&
                                this.canAddBlogToPage(currentPage, nextItem)) {
                                currentPage.content.push(nextItem);
                                i = j; // Skip this item in the main loop
                                break;
                            }
                        }
                    }
                    
                    this.pages.push(currentPage);
                    pageNumber++;
                    currentPage = this.createContentPage(pageNumber);
                    break;
                    
                case 'photo':
                    // Photos can share pages
                    if (!this.canAddPhotoToPage(currentPage)) {
                        this.pages.push(currentPage);
                        pageNumber++;
                        currentPage = this.createContentPage(pageNumber);
                    }
                    currentPage.content.push(item);
                    break;
                    
                case 'text':
                case 'heading':
                    // Text can be added to current page or span pages
                    if (!this.canAddTextToPage(currentPage, item)) {
                        this.pages.push(currentPage);
                        pageNumber++;
                        currentPage = this.createContentPage(pageNumber);
                    }
                    currentPage.content.push(item);
                    break;
                    
                default:
                    // Unknown content type - add to current page
                    currentPage.content.push(item);
                    break;
            }
        }
        
        // Add the last page if it has content
        if (currentPage.content.length > 0) {
            this.pages.push(currentPage);
        }
    }
    
    createContentPage(pageNumber) {
        return {
            type: 'content',
            pageNumber: pageNumber,
            content: [],
            estimatedHeight: 0
        };
    }
    
    canAddPhotoToPage(page) {
        // Count existing photos on page
        const photoCount = page.content.filter(item => item.content_type === 'photo').length;
        const maxPhotosPerPage = 4; // Allow up to 4 photos per page
        
        return photoCount < maxPhotosPerPage;
    }
    
    canAddTextToPage(page, textItem) {
        // Estimate if text will fit on page
        const estimatedTextHeight = this.estimateTextHeight(textItem);
        const currentHeight = this.estimatePageHeight(page);
        const maxPageHeight = this.PAGE_HEIGHT - 200; // Leave margin
        
        return (currentHeight + estimatedTextHeight) <= maxPageHeight;
    }
    
    canAddBlogToPage(page, blogItem) {
        // Estimate if blog will fit on page
        const estimatedBlogHeight = this.estimateBlogHeight(blogItem);
        const currentHeight = this.estimatePageHeight(page);
        const maxPageHeight = this.PAGE_HEIGHT - 200; // Leave margin
        
        return (currentHeight + estimatedBlogHeight) <= maxPageHeight;
    }
    
    estimateTextHeight(textItem) {
        // Rough estimation of text height
        const textLength = textItem.custom_text ? textItem.custom_text.length : 0;
        const baseHeight = textItem.content_type === 'heading' ? 60 : 40;
        const additionalHeight = Math.ceil(textLength / 100) * 20; // ~20px per 100 chars
        
        return baseHeight + additionalHeight;
    }
    
    estimateBlogHeight(blogItem) {
        // Estimate blog height including content and images
        let height = 100; // Base padding and title
        
        // Add content height
        if (blogItem.blog_post && blogItem.blog_post.content) {
            const contentLength = blogItem.blog_post.content.length;
            height += Math.ceil(contentLength / 100) * 20; // ~20px per 100 chars
        }
        
        // Add image height
        if (blogItem.blog_post) {
            let imageCount = 0;
            if (blogItem.blog_post.featured_image) imageCount++;
            if (blogItem.blog_post.images && blogItem.blog_post.images.length > 0) {
                imageCount += blogItem.blog_post.images.length;
            }
            height += imageCount * 200; // ~200px per image
        }
        
        return height;
    }
    
    estimatePageHeight(page) {
        let height = 100; // Base padding
        
        page.content.forEach(item => {
            switch (item.content_type) {
                case 'heading':
                    height += 60;
                    break;
                case 'text':
                    height += this.estimateTextHeight(item);
                    break;
                case 'photo':
                    height += 300; // Estimated photo height
                    break;
                case 'menu':
                case 'page_photo':
                    height += 400; // These are typically larger
                    break;
                case 'blog':
                    height += this.estimateBlogHeight(item);
                    break;
            }
        });
        
        return height;
    }
    
    renderCurrentPage() {
        const journalContent = document.getElementById('journalContent');
        
        // Ensure we have valid state
        if (!this.pages || this.pages.length === 0) {
            journalContent.innerHTML = `
                <div class="no-content">
                    <i class="fas fa-book-open fa-3x mb-3" style="color: var(--scrapbook-text-light);"></i>
                    <h4 class="scrapbook-subtitle">No journal pages found for ${this.currentYear}</h4>
                    <p class="scrapbook-text">There are no journal pages available for this year</p>
                </div>
            `;
            return;
        }
        
        // Ensure currentPageIndex is within bounds
        if (this.currentPageIndex < 0 || this.currentPageIndex >= this.pages.length) {
            console.warn(`⚠️ Page index ${this.currentPageIndex} out of bounds, resetting to 0`);
            this.currentPageIndex = 0;
        }
        
        const currentPage = this.pages[this.currentPageIndex];
        if (!currentPage) {
            console.error('❌ Current page not found');
            return;
        }
        
        // Generate page HTML
        const pageHtml = this.generatePageHtml(currentPage);
        
        // Generate navigation
        const navigationHtml = this.generatePageNavigation();
        
        journalContent.innerHTML = `
            <div class="scrapbook-page-container">
                ${pageHtml}
                ${navigationHtml}
            </div>
        `;
    }
    
    generatePageHtml(page) {
        if (page.type === 'cover') {
            return this.generateCoverPageHtml(page);
        } else {
            return this.generateContentPageHtml(page);
        }
    }
    
    generateCoverPageHtml(page) {
        return `
            <div class="scrapbook-page scrapbook-cover-page">
                <div class="scrapbook-cover-content">
                    <h1 class="scrapbook-cover-title">${page.content.title}</h1>
                    <p class="scrapbook-cover-subtitle">${page.content.subtitle}</p>
                    <div class="scrapbook-cover-year">${page.content.year}</div>
                </div>
            </div>
        `;
    }
    
    generateContentPageHtml(page) {
        // Group content items and handle photos specially
        let contentHtml = '';
        let photoItems = [];
        
        for (let i = 0; i < page.content.length; i++) {
            const item = page.content[i];
            
            if (item.content_type === 'photo') {
                photoItems.push(item);
            } else {
                // If we have accumulated photos, render them in a grid first
                if (photoItems.length > 0) {
                    contentHtml += this.generatePhotoGridHtml(photoItems);
                    photoItems = [];
                }
                // Render the non-photo item
                contentHtml += this.generateContentItemHtml(item);
            }
        }
        
        // Handle any remaining photos at the end
        if (photoItems.length > 0) {
            contentHtml += this.generatePhotoGridHtml(photoItems);
        }
        
        return `
            <div class="scrapbook-page scrapbook-content-page">
                <div class="scrapbook-page-content">
                    ${contentHtml}
                </div>
            </div>
        `;
    }
    
    generatePhotoGridHtml(photoItems) {
        const photoHtml = photoItems.map(item => this.generateContentItemHtml(item)).join('');
        return `<div class="scrapbook-photo-container">${photoHtml}</div>`;
    }
    
    generateContentItemHtml(item) {
        const baseClasses = `scrapbook-content-item ${item.content_type}`;
        
        switch (item.content_type) {
            case 'text':
                return `
                    <div class="${baseClasses}">
                        <div class="scrapbook-text">${item.custom_text}</div>
                    </div>
                `;
                
            case 'heading':
                return `
                    <div class="${baseClasses}">
                        <h${item.heading_level || 1} class="scrapbook-subtitle">${item.custom_text}</h${item.heading_level || 1}>
                    </div>
                `;
                
            case 'menu':
                const menuImage = item.menu?.menu_image_s3_url ? 
                    `<img src="${item.menu.menu_image_s3_url}" alt="${item.menu.menu_title}" class="scrapbook-image menu-image">` : 
                    `<div class="text-center"><i class="fas fa-utensils fa-2x" style="color: var(--scrapbook-text-light);"></i></div>`;
                return `
                    <div class="${baseClasses}">
                        ${menuImage}
                    </div>
                `;
                
            case 'photo':
                const photoImage = item.photo?.s3_url ? 
                    `<img src="${item.photo.s3_url}" alt="${item.photo.original_filename || item.photo.filename}" class="scrapbook-image photo-image">` : 
                    `<div class="text-center"><i class="fas fa-image fa-2x" style="color: var(--scrapbook-text-light);"></i></div>`;
                return `
                    <div class="${baseClasses}">
                        ${item.photo?.caption ? `<p class="scrapbook-caption">${item.photo.caption}</p>` : ''}
                        ${photoImage}
                    </div>
                `;
                
            case 'page_photo':
                const pagePhotoImage = item.photo?.s3_url ? 
                    `<img src="${item.photo.s3_url}" alt="${item.photo.original_filename || item.photo.filename}" class="scrapbook-image page-photo-image">` : 
                    `<div class="text-center"><i class="fas fa-file-image fa-2x" style="color: var(--scrapbook-text-light);"></i></div>`;
                return `
                    <div class="${baseClasses}">
                        ${pagePhotoImage}
                    </div>
                `;
                
            case 'blog':
                const blogImages = this.generateBlogImages(item.blog_post);
                const blogContent = item.blog_post?.content || '';
                return `
                    <div class="${baseClasses}">
                        <div class="scrapbook-border">
                            <h5 class="scrapbook-subtitle">
                                <i class="fas fa-blog me-2"></i>
                                ${item.blog_post?.title || 'Unknown Blog'}
                            </h5>
                            ${blogContent ? `<div class="scrapbook-text">${blogContent}</div>` : ''}
                            ${blogImages}
                        </div>
                    </div>
                `;
                
            default:
                return `
                    <div class="${baseClasses}">
                        <div class="scrapbook-text" style="color: var(--scrapbook-text-light);">
                            <i class="fas fa-question-circle me-2"></i>
                            Unknown content type: ${item.content_type}
                        </div>
                    </div>
                `;
        }
    }
    
    generateBlogImages(blogPost) {
        if (!blogPost) return '';
        
        let images = [];
        
        // Collect all images
        if (blogPost.featured_image) {
            images.push(blogPost.featured_image);
        }
        
        if (blogPost.images && blogPost.images.length > 0) {
            images.push(...blogPost.images);
        }
        
        if (images.length === 0) return '';
        
        // Generate images HTML
        const imagesHtml = images.map((imageUrl, index) => 
            `<img src="${imageUrl}" alt="Blog Image ${index + 1}" class="scrapbook-image blog-image">`
        ).join('');
        
        return `<div class="blog-images-container">${imagesHtml}</div>`;
    }
    
    generatePageNavigation() {
        if (this.pages.length <= 1) return '';
        
        const currentPageNum = this.currentPageIndex + 1;
        const totalPages = this.pages.length;
        
        let navHtml = '<div class="scrapbook-page-navigation">';
        
        // Previous page button
        if (this.currentPageIndex > 0) {
            navHtml += `
                <button class="scrapbook-button page-nav-btn" onclick="journalViewer.previousPage()">
                    <i class="fas fa-chevron-left me-2"></i>
                    Previous
                </button>
            `;
        }
        
        // Page indicator
        navHtml += `
            <div class="page-indicator">
                Page ${currentPageNum} of ${totalPages}
            </div>
        `;
        
        // Next page button
        if (this.currentPageIndex < this.pages.length - 1) {
            navHtml += `
                <button class="scrapbook-button page-nav-btn" onclick="journalViewer.nextPage()">
                    Next
                    <i class="fas fa-chevron-right ms-2"></i>
                </button>
            `;
        }
        
        // Fullscreen button
        navHtml += `
            <button class="scrapbook-button page-nav-btn fullscreen-btn" onclick="journalViewer.toggleFullscreen()" title="Toggle Fullscreen (F11)">
                <i class="fas fa-expand"></i>
            </button>
        `;
        
        navHtml += '</div>';
        return navHtml;
    }
    
    previousPage() {
        if (this.currentPageIndex > 0) {
            this.currentPageIndex--;
            this.renderCurrentPage();
        }
    }
    
    nextPage() {
        if (this.currentPageIndex < this.pages.length - 1) {
            this.currentPageIndex++;
            this.renderCurrentPage();
        }
    }
    
    showError(message) {
        const journalContent = document.getElementById('journalContent');
        journalContent.innerHTML = `
            <div class="no-content">
                <i class="fas fa-exclamation-triangle fa-3x mb-3" style="color: var(--scrapbook-text-light);"></i>
                <h4 class="scrapbook-subtitle">Error</h4>
                <p class="scrapbook-text">${message}</p>
            </div>
        `;
    }
    
    // Fullscreen functionality
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    
    enterFullscreen() {
        const journalViewer = document.querySelector('.journal-viewer');
        if (journalViewer) {
            journalViewer.requestFullscreen().then(() => {
                journalViewer.classList.add('fullscreen');
                console.log('📖 Journal viewer entered fullscreen');
            }).catch(err => {
                console.error('Error entering fullscreen:', err);
            });
        }
    }
    
    exitFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen().then(() => {
                const journalViewer = document.querySelector('.journal-viewer');
                if (journalViewer) {
                    journalViewer.classList.remove('fullscreen');
                }
                console.log('📖 Journal viewer exited fullscreen');
            }).catch(err => {
                console.error('Error exiting fullscreen:', err);
            });
        }
    }
}

// Initialize the journal viewer when the page loads
let journalViewer;
document.addEventListener('DOMContentLoaded', () => {
    journalViewer = new JournalViewer();
});