/**
 * Journal Editor Component
 * Handles the admin journal editor functionality including drag-and-drop,
 * content management, and save/publish workflows.
 */
class JournalEditor {
    constructor() {
        this.currentEventId = null;
        this.currentYear = null;
        this.currentPageId = null;
        this.availableContent = {
            menus: [],
            photos: [],
            page_photos: [],
            blogs: []
        };
        this.contentItems = [];
        this.isDirty = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeDragAndDrop();
        this.loadCurrentEvent();
    }

    bindEvents() {
        // Year and page selection
        document.getElementById('yearSelect')?.addEventListener('change', (e) => this.handleYearChange(e));
        document.getElementById('pageSelect')?.addEventListener('change', (e) => this.handlePageChange(e));
        
        // Page management
        document.getElementById('createPageBtn')?.addEventListener('click', () => this.createNewPage());
        document.getElementById('deletePageBtn')?.addEventListener('click', () => this.deleteCurrentPage());
        
        // Content addition
        document.getElementById('addTextBlockBtn')?.addEventListener('click', () => this.showAddTextBlockModal());
        document.getElementById('addHeadingBtn')?.addEventListener('click', () => this.showAddHeadingModal());
        
        // Modal handlers
        document.getElementById('saveTextBlockBtn')?.addEventListener('click', () => this.addTextBlock());
        document.getElementById('saveHeadingBtn')?.addEventListener('click', () => this.addHeading());
        
        // Save/Publish
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveDraft());
        document.getElementById('publishBtn')?.addEventListener('click', () => this.publishPage());
        document.getElementById('previewBtn')?.addEventListener('click', () => this.showPreview());
        
        // Page title/description changes
        document.getElementById('pageTitle')?.addEventListener('input', () => this.markDirty());
        document.getElementById('pageDescription')?.addEventListener('input', () => this.markDirty());
        
        // Clear page
        document.getElementById('clearPageBtn')?.addEventListener('click', () => this.clearPage());
    }

    initializeDragAndDrop() {
        const container = document.getElementById('journalContentContainer');
        if (!container) return;

        // Enable drop zone
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
        });

        container.addEventListener('dragleave', (e) => {
            if (!container.contains(e.relatedTarget)) {
                container.classList.remove('drag-over');
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            const data = e.dataTransfer.getData('text/plain');
            if (data) {
                try {
                    const contentData = JSON.parse(data);
                    this.addContentItem(contentData);
                } catch (error) {
                    console.error('Error parsing dropped content:', error);
                }
            }
        });
    }

    async loadCurrentEvent() {
        try {
            console.log('=== LOAD CURRENT EVENT DEBUG ===');
            console.log('window.currentEventId:', window.currentEventId);
            
            // Get the current event from the page context
            // This would typically come from the server-side rendered page
            const eventId = window.currentEventId || 15; // Default to 2013 event for testing
            this.currentEventId = eventId;
            
            console.log('Journal Editor initialized for event:', eventId);
            console.log('=== END LOAD CURRENT EVENT DEBUG ===');
        } catch (error) {
            console.error('Error loading current event:', error);
            this.showError('Failed to load current event');
        }
    }

    async handleYearChange(event) {
        const year = parseInt(event.target.value);
        if (!year) {
            this.currentYear = null;
            this.clearContentPanels();
            this.disablePageControls();
            return;
        }

        this.currentYear = year;
        await this.loadAvailableContent();
        await this.loadPagesForYear();
        this.enablePageControls();
    }

    async loadAvailableContent() {
        console.log('=== LOAD AVAILABLE CONTENT DEBUG ===');
        console.log('Current Event ID:', this.currentEventId);
        console.log('Current Year:', this.currentYear);
        
        if (!this.currentEventId || !this.currentYear) {
            console.log('Missing event ID or year, returning early');
            return;
        }

        try {
            const url = `/api/journal/available-content/${this.currentEventId}?year=${this.currentYear}`;
            console.log('Making request to:', url);
            
            const response = await fetch(url);
            console.log('Response status:', response.status);
            
            const result = await response.json();
            console.log('Response result:', result);

            if (result.success) {
                this.availableContent = result.data;
                console.log('Available content loaded:', this.availableContent);
                this.renderAvailableContent();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error loading available content:', error);
            this.showError('Failed to load available content');
        }
    }

    renderAvailableContent() {
        this.renderContentList('menus', this.availableContent.menus, 'menu');
        this.renderContentList('photos', this.availableContent.photos, 'photo');
        this.renderContentList('pagePhotos', this.availableContent.page_photos, 'page_photo');
        this.renderContentList('blogs', this.availableContent.blogs, 'blog');
    }

    renderContentList(containerId, items, contentType) {
        const container = document.getElementById(`${containerId}List`);
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = '<div class="text-muted text-center py-3">No content available</div>';
            return;
        }

        container.innerHTML = items.map(item => {
            const preview = this.getContentPreview(item, contentType);
            
            // Set the correct content_id based on content type
            let contentId = null;
            switch (contentType) {
                case 'menu':
                    contentId = item.event_id;
                    break;
                case 'photo':
                case 'page_photo':
                    contentId = item.photo_id;
                    break;
                case 'blog':
                    contentId = item.blog_post_id;
                    break;
            }
            
            const contentData = JSON.stringify({
                ...item, 
                content_type: contentType,
                content_id: contentId,
                // Preserve the full menu object for menus
                menu: contentType === 'menu' ? item : null,
                // Preserve the full photo object for photos
                photo: (contentType === 'photo' || contentType === 'page_photo') ? item : null,
                // Preserve the full blog object for blogs
                blog_post: contentType === 'blog' ? item : null
            });
            
            return `
                <div class="content-item-preview" draggable="true" 
                     data-content="${contentData.replace(/"/g, '&quot;')}">
                    ${preview}
                </div>
            `;
        }).join('');

        // Add drag event listeners
        container.querySelectorAll('.content-item-preview').forEach(element => {
            element.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.content);
                e.target.style.opacity = '0.5';
            });

            element.addEventListener('dragend', (e) => {
                e.target.style.opacity = '1';
            });
        });
    }

    getContentPreview(item, contentType) {
        switch (contentType) {
            case 'menu':
                return `
                    <div class="d-flex align-items-center">
                        <div class="me-2">
                            <i class="fas fa-utensils text-primary"></i>
                        </div>
                        <div>
                            <div class="fw-bold">${item.menu_title}</div>
                            <small class="text-muted">${new Date(item.event_date).toLocaleDateString()}</small>
                        </div>
                    </div>
                `;
            case 'photo':
                return `
                    <div class="d-flex align-items-center">
                        <div class="me-2">
                            <i class="fas fa-image text-info"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="fw-bold">${item.original_filename || item.filename}</div>
                            <small class="text-muted">${item.caption || 'No caption'}</small>
                        </div>
                        <div class="ms-2">
                            <button type="button" class="btn btn-sm btn-outline-secondary" 
                                    onclick="journalEditor.changePhotoType(${item.photo_id}, 'page')" 
                                    title="Convert to Page Photo">
                                <i class="fas fa-file-image"></i>
                            </button>
                        </div>
                    </div>
                `;
            case 'page_photo':
                return `
                    <div class="d-flex align-items-center">
                        <div class="me-2">
                            <i class="fas fa-file-image text-warning"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="fw-bold">${item.original_filename || item.filename}</div>
                            <small class="text-muted">Complete Page</small>
                        </div>
                        <div class="ms-2">
                            <button type="button" class="btn btn-sm btn-outline-secondary" 
                                    onclick="journalEditor.changePhotoType(${item.photo_id}, 'individual')" 
                                    title="Convert to Individual Photo">
                                <i class="fas fa-image"></i>
                            </button>
                        </div>
                    </div>
                `;
            case 'blog':
                return `
                    <div class="d-flex align-items-center">
                        <div class="me-2">
                            <i class="fas fa-blog text-success"></i>
                        </div>
                        <div>
                            <div class="fw-bold">${item.title}</div>
                            <small class="text-muted">${item.excerpt || 'No excerpt'}</small>
                        </div>
                    </div>
                `;
            default:
                return `<div class="fw-bold">${item.title || 'Unknown Content'}</div>`;
        }
    }

    async loadPagesForYear() {
        if (!this.currentEventId || !this.currentYear) return;

        try {
            const response = await fetch(`/api/journal?event_id=${this.currentEventId}&year=${this.currentYear}`);
            const result = await response.json();

            if (result.success) {
                this.populatePageSelect(result.data.journal_pages);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error loading pages:', error);
            this.showError('Failed to load journal pages');
        }
    }

    populatePageSelect(pages) {
        const pageSelect = document.getElementById('pageSelect');
        if (!pageSelect) return;

        pageSelect.innerHTML = '<option value="">Select Page</option>';
        
        pages.forEach(page => {
            const option = document.createElement('option');
            option.value = page.journal_page_id;
            option.textContent = `Page ${page.page_number}${page.title ? ` - ${page.title}` : ''}`;
            pageSelect.appendChild(option);
        });

        pageSelect.disabled = false;
    }

    async handlePageChange(event) {
        const pageId = parseInt(event.target.value);
        if (!pageId) {
            this.currentPageId = null;
            this.clearJournalContent();
            this.disablePageActions();
            return;
        }

        this.currentPageId = pageId;
        await this.loadPageContent();
        this.enablePageActions();
    }

    async loadPageContent() {
        if (!this.currentPageId) return;

        try {
            const response = await fetch(`/api/journal/${this.currentPageId}`);
            const result = await response.json();

            if (result.success) {
                const page = result.data.journal_page;
                console.log('=== LOAD PAGE CONTENT DEBUG ===');
                console.log('Page data:', page);
                console.log('Content items from API:', page.content_items);
                this.loadPageData(page);
                this.contentItems = page.content_items || []; // Update the contentItems array
                this.renderContentItems(this.contentItems);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error loading page content:', error);
            this.showError('Failed to load page content');
        }
    }

    loadPageData(page) {
        document.getElementById('pageTitle').value = page.title || '';
        document.getElementById('pageDescription').value = page.description || '';
        this.isDirty = false;
    }

    renderContentItems(items) {
        const container = document.getElementById('journalContentContainer');
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <p>Drag content from the left panel to build your journal page</p>
                </div>
            `;
            return;
        }

        // Sort by display order
        items.sort((a, b) => a.display_order - b.display_order);

        container.innerHTML = items.map(item => this.renderContentItem(item)).join('');
        this.contentItems = items;

        // Add drag and drop handlers for reordering
        this.initializeItemDragAndDrop();
    }

    renderContentItem(item) {
        const content = this.getContentItemContent(item);
        return `
            <div class="content-item" data-item-id="${item.content_item_id}">
                <div class="content-item-controls">
                    <button type="button" class="btn btn-sm btn-outline-secondary me-1" onclick="journalEditor.editContentItem(${item.content_item_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="journalEditor.removeContentItem(${item.content_item_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                ${content}
            </div>
        `;
    }

    getContentItemContent(item) {
        switch (item.content_type) {
            case 'text':
                return `<div class="text-content">${item.custom_text}</div>`;
            case 'heading':
                return `<h${item.heading_level || 1} class="journal-heading">${item.custom_text}</h${item.heading_level || 1}>`;
            case 'menu':
                console.log('Rendering menu - S3 URL:', item.menu?.menu_image_s3_url);
                const menuImage = item.menu?.menu_image_s3_url ? 
                    `<img src="${item.menu.menu_image_s3_url}" alt="${item.menu.menu_title}" class="img-fluid rounded mb-2" style="width: 100%; height: auto;">` : 
                    `<div class="bg-light rounded p-3 mb-2 text-center"><i class="fas fa-utensils fa-2x text-muted"></i></div>`;
                return `<div class="menu-content">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title"><i class="fas fa-utensils me-2"></i>${item.menu?.menu_title || 'Unknown Menu'}</h5>
                            <p class="card-text text-muted">${new Date(item.menu?.event_date).toLocaleDateString()}</p>
                            ${menuImage}
                        </div>
                    </div>
                </div>`;
            case 'photo':
                console.log('Rendering photo - S3 URL:', item.photo?.s3_url);
                const photoImage = item.photo?.s3_url ? 
                    `<img src="${item.photo.s3_url}" alt="${item.photo.original_filename || item.photo.filename}" class="img-fluid rounded mb-2" style="width: 33.33%; height: auto;">` : 
                    `<div class="bg-light rounded p-3 mb-2 text-center"><i class="fas fa-image fa-2x text-muted"></i></div>`;
                return `<div class="photo-content">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title"><i class="fas fa-image me-2"></i>${item.photo?.original_filename || item.photo?.filename || 'Unknown Photo'}</h6>
                            ${item.photo?.caption ? `<p class="card-text">${item.photo.caption}</p>` : ''}
                            ${photoImage}
                        </div>
                    </div>
                </div>`;
            case 'page_photo':
                console.log('Rendering page_photo - S3 URL:', item.photo?.s3_url);
                const pagePhotoImage = item.photo?.s3_url ? 
                    `<img src="${item.photo.s3_url}" alt="${item.photo.original_filename || item.photo.filename}" class="img-fluid rounded mb-2" style="width: 100%; height: auto;">` : 
                    `<div class="bg-light rounded p-3 mb-2 text-center"><i class="fas fa-file-image fa-2x text-muted"></i></div>`;
                return `<div class="page-photo-content">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title"><i class="fas fa-file-image me-2"></i>${item.photo?.original_filename || item.photo?.filename || 'Unknown Page'}</h6>
                            ${item.photo?.caption ? `<p class="card-text">${item.photo.caption}</p>` : ''}
                            ${pagePhotoImage}
                        </div>
                    </div>
                </div>`;
            case 'blog':
                console.log('Rendering blog - featured_image:', item.blog_post?.featured_image);
                console.log('Rendering blog - images array:', item.blog_post?.images);
                
                // Collect all blog images (featured_image + images array)
                const allBlogImages = [];
                
                // Add featured image if it exists
                if (item.blog_post?.featured_image) {
                    allBlogImages.push(item.blog_post.featured_image);
                }
                
                // Add images from the images array
                if (item.blog_post?.images && Array.isArray(item.blog_post.images)) {
                    allBlogImages.push(...item.blog_post.images);
                }
                
                console.log('All blog images collected:', allBlogImages);
                
                // Render all images at full width
                const blogImagesHtml = allBlogImages.length > 0 ? 
                    allBlogImages.map(imageUrl => 
                        `<img src="${imageUrl}" alt="${item.blog_post?.title || 'Blog Image'}" class="img-fluid rounded mb-2" style="width: 100%; height: auto;">`
                    ).join('') : 
                    `<div class="bg-light rounded p-3 mb-2 text-center"><i class="fas fa-blog fa-2x text-muted"></i></div>`;
                
                const blogExcerpt = item.blog_post?.excerpt || (item.blog_post?.content ? item.blog_post.content.substring(0, 150) + '...' : '');
                return `<div class="blog-content">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title"><i class="fas fa-blog me-2"></i>${item.blog_post?.title || 'Unknown Blog'}</h5>
                            ${blogExcerpt ? `<p class="card-text">${blogExcerpt}</p>` : ''}
                            ${blogImagesHtml}
                        </div>
                    </div>
                </div>`;
            default:
                return `<div class="unknown-content">Unknown content type: ${item.content_type}</div>`;
        }
    }

    initializeItemDragAndDrop() {
        const container = document.getElementById('journalContentContainer');
        if (!container) return;

        container.querySelectorAll('.content-item').forEach(item => {
            item.draggable = true;
            
            item.addEventListener('dragstart', (e) => {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.itemId);
            });

            item.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });
        });

        // Handle reordering
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragging = container.querySelector('.dragging');
            if (dragging) {
                const afterElement = this.getDragAfterElement(container, e.clientY);
                if (afterElement == null) {
                    container.appendChild(dragging);
                } else {
                    container.insertBefore(dragging, afterElement);
                }
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.content-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    addContentItem(contentData) {
        if (!this.currentPageId) {
            this.showError('Please select a page first');
            return;
        }

        // Create a temporary content item for immediate UI feedback
        const tempItem = {
            content_item_id: -(this.contentItems.length + 1), // Temporary negative ID
            content_type: contentData.content_type,
            content_id: contentData.content_id || null,
            custom_text: contentData.custom_text || null,
            heading_level: contentData.heading_level || null,
            display_order: this.contentItems.length + 1,
            is_visible: true,
            // Preserve the full related data for preview
            menu: contentData.menu || null,
            photo: contentData.photo || null,
            blog_post: contentData.blog_post || null,
            ...contentData
        };

        this.contentItems.push(tempItem);
        this.renderContentItems(this.contentItems);
        this.markDirty();
    }

    async createNewPage() {
        if (!this.currentEventId || !this.currentYear) {
            this.showError('Please select a year first');
            return;
        }

        try {
            const response = await fetch('/api/journal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_id: this.currentEventId,
                    year: this.currentYear,
                    title: `Page ${this.contentItems.length + 1}`,
                    description: ''
                })
            });

            const result = await response.json();
            if (result.success) {
                await this.loadPagesForYear();
                this.showSuccess('New page created successfully');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error creating new page:', error);
            this.showError('Failed to create new page');
        }
    }

    async deleteCurrentPage() {
        if (!this.currentPageId) return;

        if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/journal/${this.currentPageId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (result.success) {
                this.currentPageId = null;
                this.clearJournalContent();
                await this.loadPagesForYear();
                this.showSuccess('Page deleted successfully');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error deleting page:', error);
            this.showError('Failed to delete page');
        }
    }

    showAddTextBlockModal() {
        const modalElement = document.getElementById('addTextBlockModal');
        const modal = new bootstrap.Modal(modalElement);
        
        // Fix accessibility issue by removing aria-hidden when modal is shown
        modalElement.addEventListener('shown.bs.modal', () => {
            modalElement.removeAttribute('aria-hidden');
        });
        
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.setAttribute('aria-hidden', 'true');
        });
        
        modal.show();
    }

    showAddHeadingModal() {
        const modal = new bootstrap.Modal(document.getElementById('addHeadingModal'));
        modal.show();
    }

    addTextBlock() {
        const content = document.getElementById('textBlockContent').value.trim();
        if (!content) {
            this.showError('Please enter text content');
            return;
        }

        this.addContentItem({
            content_type: 'text',
            custom_text: content
        });

        // Close modal and clear form
        bootstrap.Modal.getInstance(document.getElementById('addTextBlockModal')).hide();
        document.getElementById('textBlockContent').value = '';
    }

    addHeading() {
        const text = document.getElementById('headingText').value.trim();
        const level = parseInt(document.getElementById('headingLevel').value);

        if (!text) {
            this.showError('Please enter heading text');
            return;
        }

        this.addContentItem({
            content_type: 'heading',
            custom_text: text,
            heading_level: level
        });

        // Close modal and clear form
        bootstrap.Modal.getInstance(document.getElementById('addHeadingModal')).hide();
        document.getElementById('headingText').value = '';
        document.getElementById('headingLevel').value = '1';
    }

    async saveDraft() {
        await this.savePage(false);
    }

    async publishPage() {
        await this.savePage(true);
    }

    async savePage(isPublished = false) {
        if (!this.currentPageId) {
            this.showError('Please select a page to save');
            return;
        }

        try {
            // Save page data
            const pageData = {
                title: document.getElementById('pageTitle').value,
                description: document.getElementById('pageDescription').value,
                is_published: isPublished
            };

            const pageResponse = await fetch(`/api/journal/${this.currentPageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pageData)
            });

            const pageResult = await pageResponse.json();
            if (!pageResult.success) {
                throw new Error(pageResult.message);
            }

            // Save content items
            await this.saveContentItems();

            this.isDirty = false;
            this.showSuccess(isPublished ? 'Page published successfully' : 'Page saved as draft');
        } catch (error) {
            console.error('Error saving page:', error);
            this.showError('Failed to save page');
        }
    }

    async saveContentItems() {
        if (!this.currentPageId) return;

        console.log('=== SAVE CONTENT ITEMS DEBUG ===');
        console.log('Current page ID:', this.currentPageId);
        console.log('Content items to save:', this.contentItems);

        try {
            // First, get existing content items to determine which ones to delete
            const existingResponse = await fetch(`/api/journal/${this.currentPageId}`);
            const existingResult = await existingResponse.json();
            
            if (existingResult.success) {
                const existingItems = existingResult.data.journal_page.content_items || [];
                const existingIds = existingItems.map(item => item.content_item_id);
                const currentIds = this.contentItems.map(item => item.content_item_id).filter(id => id > 0);
                
                // Delete items that are no longer in the current content
                const itemsToDelete = existingIds.filter(id => !currentIds.includes(id));
                for (const itemId of itemsToDelete) {
                    await fetch(`/api/journal/content-items/${itemId}`, {
                        method: 'DELETE'
                    });
                }
            }

            // Save or update current content items
            for (let i = 0; i < this.contentItems.length; i++) {
                const item = this.contentItems[i];
                item.display_order = i + 1;

                console.log(`Processing item ${i}:`, {
                    content_item_id: item.content_item_id,
                    content_type: item.content_type,
                    display_order: item.display_order
                });

                if (item.content_item_id > 0) {
                    // Update existing item
                    await fetch(`/api/journal/content-items/${item.content_item_id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            content_type: item.content_type,
                            content_id: item.content_id,
                            custom_text: item.custom_text,
                            heading_level: item.heading_level,
                            display_order: item.display_order,
                            is_visible: item.is_visible
                        })
                    });
                } else {
                    // Create new item
                    const response = await fetch(`/api/journal/${this.currentPageId}/content-items`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            content_type: item.content_type,
                            content_id: item.content_id,
                            custom_text: item.custom_text,
                            heading_level: item.heading_level,
                            display_order: item.display_order,
                            is_visible: item.is_visible
                        })
                    });

                    const result = await response.json();
                    if (result.success) {
                        // Update the temporary ID with the real ID
                        item.content_item_id = result.data.content_item.content_item_id;
                    }
                }
            }
        } catch (error) {
            console.error('Error saving content items:', error);
            throw error;
        }
    }

    showPreview() {
        const previewContent = document.getElementById('previewContent');
        if (!previewContent) return;

        // Generate preview HTML
        const title = document.getElementById('pageTitle').value || 'Untitled Page';
        const description = document.getElementById('pageDescription').value;
        
        console.log('=== PREVIEW DEBUG ===');
        console.log('Content items:', this.contentItems);
        
        let contentHtml = '';
        this.contentItems.forEach((item, index) => {
            console.log(`Item ${index}:`, item);
            console.log(`Item ${index} content_type:`, item.content_type);
            console.log(`Item ${index} photo:`, item.photo);
            console.log(`Item ${index} menu:`, item.menu);
            console.log(`Item ${index} blog_post:`, item.blog_post);
            
            // Debug S3 URLs specifically
            if (item.content_type === 'menu' && item.menu) {
                console.log(`Item ${index} menu S3 URL:`, item.menu.menu_image_s3_url);
            }
            if ((item.content_type === 'photo' || item.content_type === 'page_photo') && item.photo) {
                console.log(`Item ${index} photo S3 URL:`, item.photo.s3_url);
            }
            if (item.content_type === 'blog' && item.blog_post) {
                console.log(`Item ${index} blog featured image:`, item.blog_post.featured_image);
                console.log(`Item ${index} blog images array:`, item.blog_post.images);
            }
            
            contentHtml += this.getContentItemContent(item);
        });

        previewContent.innerHTML = `
            <div class="journal-page-preview" style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div class="text-center mb-4">
                    <h1 class="display-4 text-primary mb-3">${title}</h1>
                    ${description ? `<p class="lead text-muted">${description}</p>` : ''}
                </div>
                <div class="journal-content">
                    ${contentHtml}
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('previewModal'));
        modal.show();
    }

    clearPage() {
        if (!confirm('Are you sure you want to clear all content from this page?')) {
            return;
        }

        this.contentItems = [];
        this.renderContentItems([]);
        this.markDirty();
    }

    clearJournalContent() {
        const container = document.getElementById('journalContentContainer');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <p>Drag content from the left panel to build your journal page</p>
                </div>
            `;
        }
        this.contentItems = [];
    }

    clearContentPanels() {
        ['menus', 'photos', 'pagePhotos', 'blogs'].forEach(type => {
            const container = document.getElementById(`${type}List`);
            if (container) {
                container.innerHTML = '<div class="text-muted text-center py-3">Select a year to load content</div>';
            }
        });
    }

    enablePageControls() {
        document.getElementById('createPageBtn').disabled = false;
    }

    disablePageControls() {
        document.getElementById('createPageBtn').disabled = true;
        document.getElementById('pageSelect').disabled = true;
    }

    enablePageActions() {
        document.getElementById('deletePageBtn').disabled = false;
        document.getElementById('clearPageBtn').disabled = false;
    }

    disablePageActions() {
        document.getElementById('deletePageBtn').disabled = true;
        document.getElementById('clearPageBtn').disabled = true;
    }

    markDirty() {
        this.isDirty = true;
    }

    async changePhotoType(photoId, newType) {
        try {
            const response = await fetch(`/api/photos/${photoId}/type`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    photo_type: newType
                })
            });

            const result = await response.json();
            if (result.success) {
                this.showSuccess(`Photo converted to ${newType} photo`);
                // Reload available content to reflect the change
                await this.loadAvailableContent();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error changing photo type:', error);
            this.showError('Failed to change photo type');
        }
    }

    showSuccess(message) {
        // You can implement a toast notification system here
        alert(message); // Temporary implementation
    }

    showError(message) {
        // You can implement a toast notification system here
        alert('Error: ' + message); // Temporary implementation
    }
}

// Initialize the journal editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.journalEditor = new JournalEditor();
});
