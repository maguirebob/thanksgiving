/**
 * Unit tests for Journal Editor Component
 */
describe('JournalEditor', () => {
    let journalEditor;
    let mockElement;

    beforeEach(() => {
        // Mock DOM elements
        document.body.innerHTML = `
            <div id="yearSelect">
                <option value="">Select Year</option>
                <option value="2023">2023</option>
            </div>
            <div id="pageSelect">
                <option value="">Select Page</option>
            </div>
            <div id="journalContentContainer"></div>
            <div id="menusList"></div>
            <div id="photosList"></div>
            <div id="pagePhotosList"></div>
            <div id="blogsList"></div>
            <div id="pageTitle"></div>
            <div id="pageDescription"></div>
        `;

        // Mock fetch
        global.fetch = jest.fn();

        // Create journal editor instance
        journalEditor = new JournalEditor();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(journalEditor.currentEventId).toBeNull();
            expect(journalEditor.currentYear).toBeNull();
            expect(journalEditor.currentPageId).toBeNull();
            expect(journalEditor.contentItems).toEqual([]);
            expect(journalEditor.isDirty).toBe(false);
        });

        it('should load current event on initialization', () => {
            expect(journalEditor.currentEventId).toBeDefined();
        });
    });

    describe('Year Selection', () => {
        it('should handle year change', async () => {
            const mockResponse = {
                success: true,
                data: {
                    menus: [],
                    photos: [],
                    page_photos: [],
                    blogs: []
                }
            };

            fetch.mockResolvedValueOnce({
                json: () => Promise.resolve(mockResponse)
            });

            const event = { target: { value: '2023' } };
            await journalEditor.handleYearChange(event);

            expect(journalEditor.currentYear).toBe(2023);
            expect(fetch).toHaveBeenCalledWith('/api/journal/available-content?event_id=474&year=2023');
        });

        it('should clear content when no year selected', async () => {
            const event = { target: { value: '' } };
            await journalEditor.handleYearChange(event);

            expect(journalEditor.currentYear).toBeNull();
        });
    });

    describe('Content Management', () => {
        it('should add content item', () => {
            const contentData = {
                content_type: 'text',
                custom_text: 'Test content'
            };

            journalEditor.currentPageId = 1;
            journalEditor.addContentItem(contentData);

            expect(journalEditor.contentItems).toHaveLength(1);
            expect(journalEditor.contentItems[0].content_type).toBe('text');
            expect(journalEditor.contentItems[0].custom_text).toBe('Test content');
            expect(journalEditor.isDirty).toBe(true);
        });

        it('should not add content item without page selected', () => {
            const contentData = {
                content_type: 'text',
                custom_text: 'Test content'
            };

            journalEditor.addContentItem(contentData);

            expect(journalEditor.contentItems).toHaveLength(0);
        });
    });

    describe('Photo Type Management', () => {
        it('should change photo type', async () => {
            const mockResponse = {
                success: true,
                data: {
                    photo: { photo_id: 1, photo_type: 'page' },
                    photo_type: 'page'
                }
            };

            fetch.mockResolvedValueOnce({
                json: () => Promise.resolve(mockResponse)
            });

            await journalEditor.changePhotoType(1, 'page');

            expect(fetch).toHaveBeenCalledWith('/api/photos/1/type', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    photo_type: 'page'
                })
            });
        });

        it('should handle photo type change error', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            await journalEditor.changePhotoType(1, 'page');

            expect(journalEditor.showError).toHaveBeenCalledWith('Failed to change photo type');
        });
    });

    describe('Page Management', () => {
        it('should create new page', async () => {
            const mockResponse = {
                success: true,
                data: {
                    journal_page: {
                        journal_page_id: 1,
                        title: 'New Page',
                        year: 2023
                    }
                }
            };

            fetch.mockResolvedValueOnce({
                json: () => Promise.resolve(mockResponse)
            });

            journalEditor.currentEventId = 474;
            journalEditor.currentYear = 2023;

            await journalEditor.createNewPage();

            expect(fetch).toHaveBeenCalledWith('/api/journal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_id: 474,
                    year: 2023,
                    title: 'Page 1',
                    description: ''
                })
            });
        });

        it('should delete current page', async () => {
            const mockResponse = {
                success: true,
                message: 'Page deleted successfully'
            };

            fetch.mockResolvedValueOnce({
                json: () => Promise.resolve(mockResponse)
            });

            journalEditor.currentPageId = 1;

            // Mock confirm to return true
            global.confirm = jest.fn(() => true);

            await journalEditor.deleteCurrentPage();

            expect(fetch).toHaveBeenCalledWith('/api/journal/1', {
                method: 'DELETE'
            });
            expect(journalEditor.currentPageId).toBeNull();
        });
    });

    describe('Save Functionality', () => {
        it('should save page as draft', async () => {
            const pageResponse = {
                success: true,
                data: { journal_page: { journal_page_id: 1 } }
            };

            const contentResponse = {
                success: true,
                data: { content_item: { content_item_id: 1 } }
            };

            fetch
                .mockResolvedValueOnce({
                    json: () => Promise.resolve(pageResponse)
                })
                .mockResolvedValueOnce({
                    json: () => Promise.resolve({ success: true, data: { journal_page: { content_items: [] } } })
                });

            journalEditor.currentPageId = 1;
            journalEditor.contentItems = [
                {
                    content_item_id: 0,
                    content_type: 'text',
                    custom_text: 'Test content',
                    display_order: 1
                }
            ];

            // Mock DOM elements
            document.getElementById('pageTitle').value = 'Test Page';
            document.getElementById('pageDescription').value = 'Test Description';

            await journalEditor.saveDraft();

            expect(fetch).toHaveBeenCalledWith('/api/journal/1', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'Test Page',
                    description: 'Test Description',
                    is_published: false
                })
            });
        });

        it('should publish page', async () => {
            const pageResponse = {
                success: true,
                data: { journal_page: { journal_page_id: 1 } }
            };

            fetch
                .mockResolvedValueOnce({
                    json: () => Promise.resolve(pageResponse)
                })
                .mockResolvedValueOnce({
                    json: () => Promise.resolve({ success: true, data: { journal_page: { content_items: [] } } })
                });

            journalEditor.currentPageId = 1;
            journalEditor.contentItems = [];

            document.getElementById('pageTitle').value = 'Test Page';
            document.getElementById('pageDescription').value = 'Test Description';

            await journalEditor.publishPage();

            expect(fetch).toHaveBeenCalledWith('/api/journal/1', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'Test Page',
                    description: 'Test Description',
                    is_published: true
                })
            });
        });
    });

    describe('Content Preview', () => {
        it('should generate correct preview for menu content', () => {
            const menuItem = {
                menu_title: 'Thanksgiving 2023',
                event_date: '2023-11-23'
            };

            const preview = journalEditor.getContentPreview(menuItem, 'menu');

            expect(preview).toContain('Thanksgiving 2023');
            expect(preview).toContain('fas fa-utensils');
        });

        it('should generate correct preview for photo content', () => {
            const photoItem = {
                filename: 'test.jpg',
                original_filename: 'original.jpg',
                caption: 'Test caption'
            };

            const preview = journalEditor.getContentPreview(photoItem, 'photo');

            expect(preview).toContain('original.jpg');
            expect(preview).toContain('Test caption');
            expect(preview).toContain('fas fa-image');
        });

        it('should generate correct preview for blog content', () => {
            const blogItem = {
                title: 'My Blog Post',
                excerpt: 'Blog excerpt'
            };

            const preview = journalEditor.getContentPreview(blogItem, 'blog');

            expect(preview).toContain('My Blog Post');
            expect(preview).toContain('Blog excerpt');
            expect(preview).toContain('fas fa-blog');
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const event = { target: { value: '2023' } };
            await journalEditor.handleYearChange(event);

            expect(journalEditor.showError).toHaveBeenCalledWith('Failed to load available content');
        });

        it('should validate required fields', async () => {
            journalEditor.currentPageId = null;

            await journalEditor.saveDraft();

            expect(journalEditor.showError).toHaveBeenCalledWith('Please select a page to save');
        });
    });
});

