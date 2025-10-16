/**
 * Journal Editor Component
 * Handles the admin journal editor functionality including drag-and-drop,
 * content management, and save/publish workflows.
 * Updated for JournalSection model with page break support.
 */
class JournalEditor {
    constructor() {
        this.currentEventId = null;
        this.currentYear = null;
        this.currentSectionId = null;
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
        // Year and section selection
        document.getElementById('yearSelect')?.addEventListener('change', (e) => this.handleYearChange(e));
        document.getElementById('sectionSelect')?.addEventListener('change', (e) => this.handleSectionChange(e));
        
        // Section management
        document.getElementById('createSectionBtn')?.addEventListener('click', () => this.createNewSection());
        document.getElementById('deleteSectionBtn')?.addEventListener('click', () => this.deleteCurrentSection());
        
        // Content addition
        document.getElementById('addTextBlockBtn')?.addEventListener('click', () => this.showAddTextBlockModal());
        document.getElementById('addHeadingBtn')?.addEventListener('click', () => this.showAddHeadingModal());
        
        // Modal handlers
        document.getElementById('saveTextBlockBtn')?.addEventListener('click', () => this.addTextBlock());
        document.getElementById('saveHeadingBtn')?.addEventListener('click', () => this.addHeading());
        
        // Save/Publish
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveDraft());
        document.getElementById('publishBtn')?.addEventListener('click', () => this.publishSection());
        document.getElementById('previewBtn')?.addEventListener('click', () => this.showPreview());
        
        // Section title/description changes
        document.getElementById('sectionTitle')?.addEventListener('input', () => this.markDirty());
        document.getElementById('sectionDescription')?.addEventListener('input', () => this.markDirty());
        
        // Page break management
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-page-break-btn')) {
                this.addPageBreak(e.target.dataset.itemId);
            }
            if (e.target.classList.contains('remove-page-break-btn')) {
                this.removePageBreak(e.target.dataset.itemId);
            }
        });
    }

    // Event and Section Management
    loadCurrentEvent() {
        console.log('=== LOAD CURRENT EVENT DEBUG ===');
        console.log('window.currentEventId:', window.currentEventId);
        
        if (window.currentEventId) {
            this.currentEventId = window.currentEventId;
            this.currentYear = new Date().getFullYear(); // Default to current year
            console.log('Journal Editor initialized for event:', this.currentEventId);
        } else {
            console.error('No current event ID found');
        }
        console.log('=== END LOAD CURRENT EVENT DEBUG ===');
    }

    async handleYearChange(event) {
        this.currentYear = parseInt(event.target.value);
        await this.loadJournalSections();
        await this.loadAvailableContent();
    }

    async handleSectionChange(event) {
        this.currentSectionId = parseInt(event.target.value);
        if (this.currentSectionId) {
            await this.loadSectionContent();
        } else {
            this.clearContentPanels();
        }
    }

    async loadJournalSections() {
        if (!this.currentEventId || !this.currentYear) return;

        try {
            const response = await fetch(`/api/journal?event_id=${this.currentEventId}&year=${this.currentYear}`);
            const result = await response.json();

            if (result.success) {
                this.populateSectionSelect(result.data.journal_sections);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error loading sections:', error);
        }
    }

    populateSectionSelect(sections) {
        const select = document.getElementById('sectionSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Select a section...</option>';
        
        sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.section_id;
            option.textContent = `Section ${section.section_order}${section.title ? ': ' + section.title : ''}`;
            select.appendChild(option);
        });
    }

    async loadSectionContent() {
        if (!this.currentSectionId) return;

        try {
            const response = await fetch(`/api/journal/${this.currentSectionId}`);
            const result = await response.json();

            if (result.success) {
                const section = result.data.journal_section;
                console.log('=== LOAD SECTION CONTENT DEBUG ===');
                console.log('Section data:', section);
                console.log('Content items from API:', section.content_items);
                
                this.contentItems = section.content_items || [];
                this.renderContentItems();
                this.updateSectionInfo(section);
            } else {
                console.error('Failed to load section content:', result.message);
            }
        } catch (error) {
            console.error('Error loading section content:', error);
        }
    }

    updateSectionInfo(section) {
        const titleInput = document.getElementById('sectionTitle');
        const descriptionInput = document.getElementById('sectionDescription');
        
        if (titleInput) titleInput.value = section.title || '';
        if (descriptionInput) descriptionInput.value = section.description || '';
    }

    // Section CRUD Operations
    async createNewSection() {
        if (!this.currentEventId || !this.currentYear) {
            alert('Please select an event and year first');
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
                    section_order: 1, // Will be auto-incremented
                    title: 'New Section',
                    description: ''
                })
            });

            const result = await response.json();
            if (result.success) {
                await this.loadJournalSections();
                // Select the new section
                this.currentSectionId = result.data.journal_section.section_id;
                document.getElementById('sectionSelect').value = this.currentSectionId;
                await this.loadSectionContent();
            } else {
                alert('Failed to create section: ' + result.message);
            }
        } catch (error) {
            console.error('Error creating section:', error);
            alert('Error creating section');
        }
    }

    async deleteCurrentSection() {
        if (!this.currentSectionId) {
            alert('No section selected');
            return;
        }

        if (!confirm('Are you sure you want to delete this section?')) {
            return;
        }

        try {
            const response = await fetch(`/api/journal/${this.currentSectionId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (result.success) {
                this.currentSectionId = null;
                document.getElementById('sectionSelect').value = '';
                this.clearContentPanels();
                await this.loadJournalSections();
            } else {
                alert('Failed to delete section: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting section:', error);
            alert('Error deleting section');
        }
    }

    // Page Break Management
    async addPageBreak(contentItemId) {
        try {
            const response = await fetch(`/api/journal/content-items/${contentItemId}/page-break`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    page_break_position: 1
                })
            });

            const result = await response.json();
            if (result.success) {
                // Reload section content to show updated page break
                await this.loadSectionContent();
                this.markDirty();
            } else {
                alert('Failed to add page break: ' + result.message);
            }
        } catch (error) {
            console.error('Error adding page break:', error);
            alert('Error adding page break');
        }
    }

    async removePageBreak(contentItemId) {
        try {
            const response = await fetch(`/api/journal/content-items/${contentItemId}/page-break`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (result.success) {
                // Reload section content to show updated page break
                await this.loadSectionContent();
                this.markDirty();
            } else {
                alert('Failed to remove page break: ' + result.message);
            }
        } catch (error) {
            console.error('Error removing page break:', error);
            alert('Error removing page break');
        }
    }

    // Content Management
    async loadAvailableContent() {
        if (!this.currentEventId || !this.currentYear) return;

        console.log('=== LOAD AVAILABLE CONTENT DEBUG ===');
        console.log('Current Event ID:', this.currentEventId);
        console.log('Current Year:', this.currentYear);

        try {
            const url = `/api/journal/available-content/${this.currentEventId}?year=${this.currentYear}`;
            console.log('Making request to:', url);
            
            const response = await fetch(url);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Response result:', result);
            
            if (result.success) {
                this.availableContent = result.data;
                console.log('Available content loaded:', this.availableContent);
                this.renderAvailableContent();
            } else {
                console.error('Failed to load available content:', result.message);
            }
        } catch (error) {
            console.error('Error loading available content:', error);
        }
    }

    renderAvailableContent() {
        this.renderContentList('menus', this.availableContent.menus || []);
        this.renderContentList('photos', this.availableContent.photos || []);
        this.renderContentList('pagePhotos', this.availableContent.page_photos || []);
        this.renderContentList('blogs', this.availableContent.blogs || []);
    }

    renderContentList(containerId, items) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = '<p class="text-muted">No content available</p>';
            return;
        }

        container.innerHTML = items.map(item => {
            let title, subtitle, imageUrl;
            
            if (containerId === 'menus') {
                title = item.menu_title;
                subtitle = new Date(item.event_date).getFullYear();
                imageUrl = item.menu_image_s3_url;
            } else if (containerId === 'photos' || containerId === 'pagePhotos') {
                title = item.original_filename || item.filename;
                subtitle = item.caption || item.description || 'No caption';
                imageUrl = item.s3_url;
            } else if (containerId === 'blogs') {
                title = item.title;
                subtitle = item.excerpt || 'No excerpt';
                imageUrl = item.featured_image;
            }

            const contentType = containerId === 'menus' ? 'menu' : 
                              containerId === 'photos' ? 'photo' : 
                              containerId === 'pagePhotos' ? 'page_photo' : 'blog';
            
            const contentId = containerId === 'menus' ? item.event_id : 
                             containerId === 'photos' || containerId === 'pagePhotos' ? item.photo_id : 
                             item.blog_post_id;

            return `
                <div class="content-item-card" 
                     draggable="true" 
                     data-content-type="${contentType}"
                     data-content-id="${contentId}"
                     data-content-data='${JSON.stringify(item).replace(/'/g, '&quot;')}'>
                    <div class="content-item-image">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${title}" loading="lazy">` : '<div class="no-image">No Image</div>'}
                    </div>
                    <div class="content-item-info">
                        <h6>${title}</h6>
                        <p class="text-muted small">${subtitle}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderContentItems() {
        const container = document.getElementById('contentItems');
        if (!container) return;

        if (this.contentItems.length === 0) {
            container.innerHTML = '<p class="text-muted">No content items. Drag items from the right panel to add content.</p>';
            return;
        }

        container.innerHTML = this.contentItems.map((item, index) => {
            const pageBreakIndicator = item.manual_page_break ? 
                `<div class="page-break-indicator">
                    <span class="badge bg-warning">Page Break</span>
                    <button class="btn btn-sm btn-outline-danger remove-page-break-btn" data-item-id="${item.content_item_id}">
                        Remove Break
                    </button>
                </div>` : 
                `<button class="btn btn-sm btn-outline-primary add-page-break-btn" data-item-id="${item.content_item_id}">
                    Add Page Break
                </button>`;

            return `
                <div class="content-item" 
                     data-item-id="${item.content_item_id}"
                     data-content-type="${item.content_type}"
                     data-display-order="${item.display_order}">
                    <div class="content-item-header">
                        <span class="content-type-badge">${item.content_type}</span>
                        <span class="display-order">#${item.display_order}</span>
                        ${pageBreakIndicator}
                        <button class="btn btn-sm btn-outline-danger delete-item-btn" data-item-id="${item.content_item_id}">
                            Delete
                        </button>
                    </div>
                    <div class="content-item-body">
                        ${this.getContentItemContent(item)}
                    </div>
                </div>
            `;
        }).join('');
    }

    getContentItemContent(item) {
        switch (item.content_type) {
            case 'text':
                return `<div class="text-content">${item.custom_text}</div>`;
            case 'heading':
                return `<h${item.heading_level || 1} class="heading-content">${item.custom_text}</h${item.heading_level || 1}>`;
            case 'menu':
                if (item.menu) {
                    return `
                        <div class="menu-content">
                            <h5>${item.menu.menu_title}</h5>
                            <p class="text-muted">${new Date(item.menu.event_date).getFullYear()}</p>
                            ${item.menu.menu_image_s3_url ? `<img src="${item.menu.menu_image_s3_url}" alt="Menu" class="menu-image">` : ''}
                        </div>
                    `;
                }
                return '<div class="text-muted">Menu content not available</div>';
            case 'photo':
                if (item.photo) {
                    return `
                        <div class="photo-content">
                            <h6>${item.photo.original_filename || item.photo.filename}</h6>
                            <p class="text-muted">${item.photo.caption || item.photo.description || 'No caption'}</p>
                            ${item.photo.s3_url ? `<img src="${item.photo.s3_url}" alt="Photo" class="photo-image">` : ''}
                        </div>
                    `;
                }
                return '<div class="text-muted">Photo content not available</div>';
            case 'page_photo':
                if (item.photo) {
                    return `
                        <div class="page-photo-content">
                            <h6>${item.photo.original_filename || item.photo.filename}</h6>
                            <p class="text-muted">${item.photo.caption || item.photo.description || 'No caption'}</p>
                            ${item.photo.s3_url ? `<img src="${item.photo.s3_url}" alt="Page Photo" class="page-photo-image">` : ''}
                        </div>
                    `;
                }
                return '<div class="text-muted">Page photo content not available</div>';
            case 'blog':
                if (item.blog_post) {
                    return `
                        <div class="blog-content">
                            <h6>${item.blog_post.title}</h6>
                            <p class="text-muted">${item.blog_post.excerpt || 'No excerpt'}</p>
                            ${item.blog_post.featured_image ? `<img src="${item.blog_post.featured_image}" alt="Blog Featured Image" class="blog-image">` : ''}
                            ${item.blog_post.images && item.blog_post.images.length > 0 ? 
                                item.blog_post.images.map(img => `<img src="${img}" alt="Blog Image" class="blog-image">`).join('') : ''}
                        </div>
                    `;
                }
                return '<div class="text-muted">Blog content not available</div>';
            default:
                return '<div class="text-muted">Unknown content type</div>';
        }
    }

    // Save and Publish
    async saveDraft() {
        if (!this.currentSectionId) {
            alert('No section selected');
            return;
        }

        try {
            // Update section info
            const titleInput = document.getElementById('sectionTitle');
            const descriptionInput = document.getElementById('sectionDescription');
            
            const sectionResponse = await fetch(`/api/journal/${this.currentSectionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: titleInput?.value || null,
                    description: descriptionInput?.value || null
                })
            });

            const sectionResult = await sectionResponse.json();
            if (!sectionResult.success) {
                throw new Error('Failed to update section: ' + sectionResult.message);
            }

            // Save content items
            await this.saveContentItems();
            
            this.isDirty = false;
            alert('Draft saved successfully');
        } catch (error) {
            console.error('Error saving draft:', error);
            alert('Error saving draft: ' + error.message);
        }
    }

    async publishSection() {
        if (!this.currentSectionId) {
            alert('No section selected');
            return;
        }

        try {
            // First save as draft
            await this.saveDraft();
            
            // Then publish
            const response = await fetch(`/api/journal/${this.currentSectionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    is_published: true
                })
            });

            const result = await response.json();
            if (result.success) {
                alert('Section published successfully');
            } else {
                alert('Failed to publish section: ' + result.message);
            }
        } catch (error) {
            console.error('Error publishing section:', error);
            alert('Error publishing section: ' + error.message);
        }
    }

    async saveContentItems() {
        if (!this.currentSectionId) return;

        try {
            // First, get existing content items to determine which ones to delete
            const existingResponse = await fetch(`/api/journal/${this.currentSectionId}`);
            const existingResult = await existingResponse.json();
            
            if (!existingResult.success) {
                throw new Error('Failed to get existing content items');
            }
            
            const existingItems = existingResult.data.journal_section.content_items || [];
            const existingIds = existingItems.map(item => item.content_item_id);
            const currentIds = this.contentItems.map(item => item.content_item_id).filter(id => id > 0);
            
            // Delete items that are no longer in the current list
            const itemsToDelete = existingIds.filter(id => !currentIds.includes(id));
            for (const itemId of itemsToDelete) {
                await fetch(`/api/journal/content-items/${itemId}`, {
                    method: 'DELETE'
                });
            }

            // Save current items
            for (const item of this.contentItems) {
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
                            is_visible: item.is_visible,
                            manual_page_break: item.manual_page_break,
                            page_break_position: item.page_break_position
                        })
                    });
                } else {
                    // Create new item
                    const response = await fetch(`/api/journal/${this.currentSectionId}/content-items`, {
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
                            is_visible: item.is_visible,
                            manual_page_break: item.manual_page_break,
                            page_break_position: item.page_break_position
                        })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        item.content_item_id = result.data.content_item.content_item_id;
                    }
                }
            }
        } catch (error) {
            console.error('Error saving content items:', error);
            throw error;
        }
    }

    // Utility Methods
    markDirty() {
        this.isDirty = true;
    }

    clearContentPanels() {
        this.contentItems = [];
        const container = document.getElementById('contentItems');
        if (container) {
            container.innerHTML = '<p class="text-muted">No content items. Drag items from the right panel to add content.</p>';
        }
    }

    // Drag and Drop (simplified version)
    initializeDragAndDrop() {
        // Implementation would go here
        // This is a simplified version focusing on the API updates
    }

    // Preview functionality
    showPreview() {
        // Implementation would go here
        // This would show a preview of the section with automatic pagination
    }

    // Text and heading modals (simplified)
    showAddTextBlockModal() {
        // Implementation would go here
    }

    showAddHeadingModal() {
        // Implementation would go here
    }

    addTextBlock() {
        // Implementation would go here
    }

    addHeading() {
        // Implementation would go here
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JournalEditor();
});
