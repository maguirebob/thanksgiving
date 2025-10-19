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
        
        this.init().catch(console.error);
    }

    async init() {
        this.bindEvents();
        this.initializeDragAndDrop();
        await this.loadCurrentEvent();
        await this.loadAvailableContent();
        await this.loadJournalSections();
    }

    bindEvents() {
        // Year and section selection
        document.getElementById('yearSelect')?.addEventListener('change', (e) => this.handleYearChange(e));
        document.getElementById('sectionSelect')?.addEventListener('change', (e) => this.handleSectionChange(e));
        
        // Section management
        document.getElementById('createSectionBtn')?.addEventListener('click', () => this.createNewSection());
        document.getElementById('deleteSectionBtn')?.addEventListener('click', () => this.deleteCurrentSection());
        document.getElementById('clearPageBtn')?.addEventListener('click', () => this.clearPage());
        
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
        document.getElementById('generateScrapbookBtn')?.addEventListener('click', () => this.generateScrapbook());
        
        // Section title/description changes
        document.getElementById('sectionTitle')?.addEventListener('input', () => this.markDirty());
        document.getElementById('sectionDescription')?.addEventListener('input', () => this.markDirty());
        
        // Page break management and content item deletion
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-page-break-btn')) {
                this.addPageBreak(e.target.dataset.itemId);
            }
            if (e.target.classList.contains('remove-page-break-btn')) {
                this.removePageBreak(e.target.dataset.itemId);
            }
            if (e.target.classList.contains('delete-item-btn')) {
                this.deleteContentItem(e.target.dataset.itemId);
            }
        });
    }

    // Event and Section Management
    async loadCurrentEvent() {
        console.log('=== LOAD CURRENT EVENT DEBUG ===');
        console.log('Available events:', window.events);
        
        // Since we removed hardcoding, start with no event selected
        this.currentEventId = null;
        this.currentYear = null;
        
        // Set default year to current year
        this.currentYear = new Date().getFullYear();
        console.log('Default year set to:', this.currentYear);
        
        // Try to find an event for the current year
        await this.findEventForYear(this.currentYear);
        
        console.log('=== END LOAD CURRENT EVENT DEBUG ===');
    }

    // Find event for a specific year
    async findEventForYear(year) {
        console.log(`Looking for event for year: ${year}`);
        
        // Find event that matches the year
        const eventForYear = window.events.find(event => {
            const eventYear = new Date(event.event_date).getFullYear();
            return eventYear === year;
        });
        
        if (eventForYear) {
            this.currentEventId = eventForYear.event_id;
            console.log(`Found event for year ${year}:`, eventForYear.event_name, `(ID: ${eventForYear.event_id})`);
            
            // Update the UI to show current event
            this.updateCurrentEventDisplay(eventForYear);
            
            // Set the year selector value
            const yearSelect = document.getElementById('yearSelect');
            if (yearSelect) {
                yearSelect.value = this.currentYear;
            }
            
            // Enable create button since we have event and year
            const createBtn = document.getElementById('createSectionBtn');
            if (createBtn) createBtn.disabled = false;
            
            // Load journal sections and available content
            await this.loadJournalSections();
            await this.loadAvailableContent();
        } else {
            console.log(`No event found for year ${year}`);
            this.currentEventId = null;
            this.hideCurrentEventDisplay();
        }
    }

    // Update the current event display in the UI
    updateCurrentEventDisplay(event) {
        const display = document.getElementById('currentEventDisplay');
        const nameSpan = document.getElementById('currentEventName');
        const idSpan = document.getElementById('currentEventId');
        
        if (display && nameSpan && idSpan) {
            nameSpan.textContent = event.event_name;
            idSpan.textContent = event.event_id;
            display.style.display = 'block';
        }
    }

    // Hide the current event display
    hideCurrentEventDisplay() {
        const display = document.getElementById('currentEventDisplay');
        if (display) {
            display.style.display = 'none';
        }
    }

    async handleYearChange(event) {
        this.currentYear = parseInt(event.target.value);
        
        // Find the event for the selected year
        await this.findEventForYear(this.currentYear);
    }

    async handleSectionChange(event) {
        this.currentSectionId = parseInt(event.target.value);
        if (this.currentSectionId) {
            await this.loadSectionContent();
            this.enableSectionButtons();
        } else {
            this.clearContentPanels();
            this.disableSectionButtons();
        }
    }

    enableSectionButtons() {
        const createBtn = document.getElementById('createSectionBtn');
        const deleteBtn = document.getElementById('deleteSectionBtn');
        if (createBtn) createBtn.disabled = false;
        if (deleteBtn) deleteBtn.disabled = false;
    }

    disableSectionButtons() {
        const createBtn = document.getElementById('createSectionBtn');
        const deleteBtn = document.getElementById('deleteSectionBtn');
        if (createBtn) createBtn.disabled = true;
        if (deleteBtn) deleteBtn.disabled = true;
    }

    updateClearPageButton() {
        const clearBtn = document.getElementById('clearPageBtn');
        if (clearBtn) {
            clearBtn.disabled = !this.currentSectionId || this.contentItems.length === 0;
        }
    }

    async loadJournalSections() {
        if (!this.currentEventId || !this.currentYear) return;

        try {
            const response = await fetch(`/api/journal?event_id=${this.currentEventId}&year=${this.currentYear}`, {
                credentials: 'include'
            });
            const result = await response.json();

            if (result.success) {
                this.populateSectionSelect(result.data.journal_sections);
                
                // Enable section selector if sections exist
                const sectionSelect = document.getElementById('sectionSelect');
                if (sectionSelect) {
                    sectionSelect.disabled = result.data.journal_sections.length === 0;
                }
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
            const response = await fetch(`/api/journal/${this.currentSectionId}`, {
                credentials: 'include'
            });
            const result = await response.json();

            if (result.success) {
                const section = result.data.journal_section;
                console.log('=== LOAD SECTION CONTENT DEBUG ===');
                console.log('Section data:', section);
                console.log('Content items from API:', section.content_items);
                
                this.contentItems = section.content_items || [];
                this.renderContentItems();
                this.updateSectionInfo(section);
                this.updateClearPageButton();
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
        console.log('🔍 === CREATE NEW SECTION DEBUG START ===');
        console.log('📊 Frontend data:');
        console.log('   currentEventId:', this.currentEventId, '(type:', typeof this.currentEventId, ')');
        console.log('   currentYear:', this.currentYear, '(type:', typeof this.currentYear, ')');
        console.log('🌍 Environment:', window.location.hostname);
        console.log('📅 Timestamp:', new Date().toISOString());
        
        if (!this.currentEventId || !this.currentYear) {
            console.log('❌ Validation failed: Missing event or year');
            alert('Please select an event and year first');
            return;
        }

        const requestData = {
            event_id: this.currentEventId,
            year: this.currentYear,
            section_order: 1, // Will be auto-incremented
            title: 'New Section',
            description: ''
        };
        
        console.log('📋 Request data being sent:', JSON.stringify(requestData, null, 2));
        console.log('🔗 Making request to:', '/api/journal');

        try {
            const response = await fetch('/api/journal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(requestData)
            });
            
            console.log('📡 Response received:');
            console.log('   Status:', response.status);
            console.log('   Status Text:', response.statusText);
            console.log('   Headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                console.log('❌ Response not OK, status:', response.status);
                const errorText = await response.text();
                console.log('📄 Error response body:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('📋 Response JSON:', JSON.stringify(result, null, 2));
            
            if (result.success) {
                console.log('✅ Section created successfully:', result.data.journal_section);
                await this.loadJournalSections();
                // Select the new section
                this.currentSectionId = result.data.journal_section.section_id;
                document.getElementById('sectionSelect').value = this.currentSectionId;
                await this.loadSectionContent();
                console.log('🎉 === CREATE NEW SECTION DEBUG END - SUCCESS ===');
            } else {
                console.log('❌ API returned success: false');
                console.log('📄 Error message:', result.message);
                alert('Failed to create section: ' + result.message);
                console.log('❌ === CREATE NEW SECTION DEBUG END - API ERROR ===');
            }
        } catch (error) {
            console.log('❌ === CREATE NEW SECTION DEBUG END - EXCEPTION ===');
            console.error('💥 Error creating section:', error);
            console.error('🔍 Error details:');
            console.error('   Error name:', error.name);
            console.error('   Error message:', error.message);
            console.error('   Error stack:', error.stack);
            alert('Error creating section: ' + error.message);
        }
    }

    async deleteCurrentSection() {
        console.log('=== DELETE SECTION DEBUG ===');
        console.log('currentSectionId:', this.currentSectionId);
        
        if (!this.currentSectionId) {
            alert('No section selected');
            return;
        }

        if (!confirm('Are you sure you want to delete this section?')) {
            return;
        }

        try {
            const response = await fetch(`/api/journal/${this.currentSectionId}`, {
                method: 'DELETE',
                credentials: 'include'
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
        // Check if this is a temporary content item (negative ID)
        if (contentItemId < 0) {
            alert('Please save the section first before adding page breaks to new content items.');
            return;
        }

        try {
            const response = await fetch(`/api/journal/content-items/${contentItemId}/page-break`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
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
        // Check if this is a temporary content item (negative ID)
        if (contentItemId < 0) {
            alert('Please save the section first before removing page breaks from new content items.');
            return;
        }

        try {
            const response = await fetch(`/api/journal/content-items/${contentItemId}/page-break`, {
                method: 'DELETE',
                credentials: 'include'
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

    async deleteContentItem(contentItemId) {
        // Check if this is a temporary content item (negative ID)
        if (contentItemId < 0) {
            // Remove from local content items array
            this.contentItems = this.contentItems.filter(item => item.content_item_id !== contentItemId);
            this.renderContentItems();
            this.markDirty();
            return;
        }

        // Confirm deletion
        if (!confirm('Are you sure you want to delete this content item?')) {
            return;
        }

        try {
            const response = await fetch(`/api/journal/content-items/${contentItemId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();
            if (result.success) {
                // Remove from local content items array
                this.contentItems = this.contentItems.filter(item => item.content_item_id !== contentItemId);
                this.renderContentItems();
                this.markDirty();
            } else {
                alert('Failed to delete content item: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting content item:', error);
            alert('Error deleting content item');
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
            
            const response = await fetch(url, {
                credentials: 'include'
            });
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
                subtitle = item.content ? item.content.substring(0, 100) + (item.content.length > 100 ? '...' : '') : 'No content';
                // Use featured_image if available, otherwise use first image from images array
                imageUrl = item.featured_image || (item.images && item.images.length > 0 ? item.images[0] : null);
            }

            const contentType = containerId === 'menus' ? 'menu' : 
                              containerId === 'photos' ? 'photo' : 
                              containerId === 'pagePhotos' ? 'page_photo' : 'blog';
            
            const contentId = containerId === 'menus' ? item.event_id : 
                             containerId === 'photos' || containerId === 'pagePhotos' ? item.photo_id : 
                             item.blog_post_id;

            // Create a unique ID for this content item
            const contentItemId = `content-${contentType}-${contentId}`;
            
            // Store the content data in a global object to avoid JSON escaping issues
            if (!window.contentItemData) {
                window.contentItemData = {};
            }
            window.contentItemData[contentItemId] = {...item, content_type: contentType, content_id: contentId};
            
            return `
                <div class="content-item content-item-card" 
                     draggable="true" 
                     data-content-type="${contentType}"
                     data-content-id="${contentId}"
                     data-content-item-id="${contentItemId}">
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
                            <div class="blog-text-content">${item.blog_post.content || 'No content'}</div>
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
                credentials: 'include',
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
                credentials: 'include',
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

    async generateScrapbook() {
        if (!this.currentYear) {
            alert('Please select a year first');
            return;
        }

        if (!this.currentSectionId) {
            alert('Please select a section first');
            return;
        }

        try {
            // First save any pending changes
            await this.saveDraft();
            
            // Convert journal content to scrapbook content
            const response = await fetch(`/api/scrapbook/convert-from-journal/${this.currentYear}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            const convertResult = await response.json();
            
            if (!response.ok || !convertResult.success) {
                // Display the actual error message from the server
                alert(convertResult.message || 'Failed to convert journal content');
                return;
            }

            // Generate the scrapbook HTML
            const generateResponse = await fetch(`/api/scrapbook/generate/${this.currentYear}`, {
                method: 'POST',
                credentials: 'include'
            });

            const generateResult = await generateResponse.json();
            
            if (!generateResponse.ok || !generateResult.success) {
                // Display the actual error message from the server
                alert(generateResult.message || 'Failed to generate scrapbook');
                return;
            }

            alert(`Scrapbook generated successfully!\n\nYou can view it at: ${generateResult.url}`);
            
            // Optionally open the scrapbook in a new tab
            if (confirm('Would you like to open the scrapbook now?')) {
                window.open(generateResult.url, '_blank');
            }
            
        } catch (error) {
            console.error('Error generating scrapbook:', error);
            alert('Error generating scrapbook: ' + error.message);
        }
    }

    async saveContentItems() {
        if (!this.currentSectionId) return;

        try {
            // First, get existing content items to determine which ones to delete
            const existingResponse = await fetch(`/api/journal/${this.currentSectionId}`, {
                credentials: 'include'
            });
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
                        method: 'DELETE',
                        credentials: 'include'
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
                        credentials: 'include',
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
                        credentials: 'include',
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

    clearPage() {
        if (!this.currentSectionId) {
            alert('No section selected');
            return;
        }

        if (!confirm('Are you sure you want to clear all content from this section?')) {
            return;
        }

        this.contentItems = [];
        this.renderContentItems();
        this.markDirty();
        this.updateClearPageButton();
    }

    // Drag and Drop
    initializeDragAndDrop() {
        // Use event delegation for drag events on the document body
        document.addEventListener('dragstart', (e) => {
            console.log('=== DRAG START EVENT ===');
            console.log('Target element:', e.target);
            console.log('Target classes:', e.target.className);
            
            // Find the content item element (could be the target or a parent)
            let contentItem = e.target;
            while (contentItem && !contentItem.classList.contains('content-item')) {
                contentItem = contentItem.parentElement;
            }
            
            console.log('Found content item:', contentItem);
            console.log('Has content-item class:', !!contentItem);
            
            if (contentItem && contentItem.classList.contains('content-item')) {
                console.log('✅ Content item detected');
                console.log('Content type:', contentItem.dataset.contentType);
                console.log('Content ID:', contentItem.dataset.contentId);
                console.log('Content item ID:', contentItem.dataset.contentItemId);
                
                const contentItemId = contentItem.dataset.contentItemId;
                if (!contentItemId) {
                    console.error('❌ No content item ID found on element');
                    return;
                }
                
                // Get content data from global storage
                const contentData = window.contentItemData?.[contentItemId];
                if (!contentData) {
                    console.error('❌ No content data found in global storage for ID:', contentItemId);
                    console.log('Available content item IDs:', Object.keys(window.contentItemData || {}));
                    return;
                }
                
                console.log('✅ Content data retrieved successfully:', contentData);
                e.dataTransfer.setData('application/json', JSON.stringify(contentData));
                e.dataTransfer.effectAllowed = 'copy';
                console.log('✅ Drag data set successfully');
            } else {
                console.log('❌ Not a content item - ignoring drag');
            }
            console.log('=== END DRAG START EVENT ===');
        });

        // Make layout panel a drop zone
        const layoutPanel = document.getElementById('contentItems');
        if (layoutPanel) {
            layoutPanel.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            });

            layoutPanel.addEventListener('drop', (e) => {
                e.preventDefault();
                console.log('=== DROP DEBUG ===');
                try {
                    const contentData = JSON.parse(e.dataTransfer.getData('application/json'));
                    console.log('Dropped content data:', contentData);
                    this.addContentItemToLayout(contentData);
                    console.log('✅ Content item added to layout');
                } catch (error) {
                    console.error('❌ Error parsing dropped content:', error);
                }
                console.log('=== END DROP DEBUG ===');
            });
        }
    }

    addContentItemToLayout(contentData) {
        if (!this.currentSectionId) {
            alert('Please select a section first');
            return;
        }

        // Add to content items array
        const newItem = {
            content_item_id: -(Date.now()), // Temporary negative ID
            content_type: contentData.content_type,
            content_id: contentData.content_id,
            custom_text: null,
            heading_level: 1,
            display_order: this.contentItems.length + 1,
            is_visible: true,
            manual_page_break: false,
            page_break_position: 1
        };

        // Add the actual content data based on content type
        if (contentData.content_type === 'menu') {
            newItem.menu = contentData;
        } else if (contentData.content_type === 'photo' || contentData.content_type === 'page_photo') {
            newItem.photo = contentData;
        } else if (contentData.content_type === 'blog') {
            newItem.blog_post = contentData;
        }

        this.contentItems.push(newItem);
        this.renderContentItems();
        this.markDirty();
        this.updateClearPageButton();
    }

    // Preview functionality
    showPreview() {
        if (this.contentItems.length === 0) {
            alert('No content to preview. Add some content items first.');
            return;
        }

        // Create preview modal content
        const previewContent = this.contentItems.map((item, index) => {
            const pageBreakClass = item.manual_page_break ? 'page-break' : '';
            return `
                <div class="preview-item ${pageBreakClass}" data-display-order="${item.display_order}">
                    ${this.getContentItemContent(item)}
                </div>
            `;
        }).join('');

        // Create and show modal
        const modalHtml = `
            <div class="modal fade" id="previewModal" tabindex="-1" aria-labelledby="previewModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="previewModalLabel">Journal Section Preview</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="preview-container">
                                <div class="preview-content">
                                    ${previewContent}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if present
        const existingModal = document.getElementById('previewModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('previewModal'));
        modal.show();

        // Add preview-specific CSS
        this.addPreviewStyles();
    }

    addPreviewStyles() {
        const styleId = 'preview-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            <style id="${styleId}">
                .preview-container {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                }
                .preview-content {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .preview-item {
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #eee;
                }
                .preview-item:last-child {
                    border-bottom: none;
                }
                .preview-item.page-break {
                    border-top: 3px dashed #ffc107;
                    margin-top: 30px;
                    padding-top: 30px;
                }
                .preview-item.page-break::before {
                    content: "📄 Page Break";
                    display: block;
                    text-align: center;
                    color: #ffc107;
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                .preview-item .menu-image,
                .preview-item .photo-image,
                .preview-item .page-photo-image {
                    width: 100%;
                    max-width: 600px;
                    height: auto;
                    border-radius: 8px;
                    margin: 10px 0;
                }
                .preview-item .blog-image {
                    width: 100%;
                    max-width: 600px;
                    height: auto;
                    border-radius: 8px;
                    margin: 10px 0;
                }
                .preview-item h1, .preview-item h2, .preview-item h3, 
                .preview-item h4, .preview-item h5, .preview-item h6 {
                    color: #333;
                    margin-top: 20px;
                    margin-bottom: 10px;
                }
                .preview-item .text-content {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #555;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // Text and heading modals (simplified)
    showAddTextBlockModal() {
        if (!this.currentSectionId) {
            alert('Please select a section first');
            return;
        }

        const modalHtml = `
            <div class="modal fade" id="addTextBlockModal" tabindex="-1" aria-labelledby="addTextBlockModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="addTextBlockModalLabel">Add Text Block</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="textBlockContent" class="form-label">Text Content</label>
                                <textarea class="form-control" id="textBlockContent" rows="4" placeholder="Enter your text content..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="saveTextBlockBtn">Add Text Block</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if present
        const existingModal = document.getElementById('addTextBlockModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Add event listener for save button
        document.getElementById('saveTextBlockBtn')?.addEventListener('click', () => {
            const content = document.getElementById('textBlockContent')?.value;
            if (content && content.trim()) {
                this.addTextBlock(content.trim());
                const modal = bootstrap.Modal.getInstance(document.getElementById('addTextBlockModal'));
                modal.hide();
            } else {
                alert('Please enter some text content');
            }
        });

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addTextBlockModal'));
        modal.show();
    }

    showAddHeadingModal() {
        if (!this.currentSectionId) {
            alert('Please select a section first');
            return;
        }

        const modalHtml = `
            <div class="modal fade" id="addHeadingModal" tabindex="-1" aria-labelledby="addHeadingModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="addHeadingModalLabel">Add Heading</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="headingText" class="form-label">Heading Text</label>
                                <input type="text" class="form-control" id="headingText" placeholder="Enter heading text...">
                            </div>
                            <div class="mb-3">
                                <label for="headingLevel" class="form-label">Heading Level</label>
                                <select class="form-select" id="headingLevel">
                                    <option value="1">H1 - Main Title</option>
                                    <option value="2" selected>H2 - Section Title</option>
                                    <option value="3">H3 - Subsection</option>
                                    <option value="4">H4 - Minor Heading</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="saveHeadingBtn">Add Heading</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if present
        const existingModal = document.getElementById('addHeadingModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Add event listener for save button
        document.getElementById('saveHeadingBtn')?.addEventListener('click', () => {
            const text = document.getElementById('headingText')?.value;
            const level = parseInt(document.getElementById('headingLevel')?.value || '2');
            
            if (text && text.trim()) {
                this.addHeading(text.trim(), level);
                const modal = bootstrap.Modal.getInstance(document.getElementById('addHeadingModal'));
                modal.hide();
            } else {
                alert('Please enter heading text');
            }
        });

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addHeadingModal'));
        modal.show();
    }

    addTextBlock(content) {
        if (!this.currentSectionId) {
            alert('Please select a section first');
            return;
        }

        const newItem = {
            content_item_id: -(Date.now()), // Temporary negative ID
            content_type: 'text',
            content_id: null,
            custom_text: content,
            heading_level: null,
            display_order: this.contentItems.length + 1,
            is_visible: true,
            manual_page_break: false,
            page_break_position: 1
        };

        this.contentItems.push(newItem);
        this.renderContentItems();
        this.markDirty();
        this.updateClearPageButton();
    }

    addHeading(text, level) {
        if (!this.currentSectionId) {
            alert('Please select a section first');
            return;
        }

        const newItem = {
            content_item_id: -(Date.now()), // Temporary negative ID
            content_type: 'heading',
            content_id: null,
            custom_text: text,
            heading_level: level,
            display_order: this.contentItems.length + 1,
            is_visible: true,
            manual_page_break: false,
            page_break_position: 1
        };

        this.contentItems.push(newItem);
        this.renderContentItems();
        this.markDirty();
        this.updateClearPageButton();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JournalEditor();
});
