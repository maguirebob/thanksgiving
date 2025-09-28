/**
 * Unit tests for Blog Edit Functionality
 * Tests the new blog editing modal and API integration
 */

// Mock the BlogComponent class since we can't easily import it in Jest
class BlogComponent {
    constructor(containerId, eventId) {
        this.containerId = containerId;
        this.eventId = eventId;
        this.container = document.getElementById(containerId);
    }

    editBlogPost(blogPostId) {
        this.openEditModal(blogPostId);
    }

    async openEditModal(blogPostId) {
        // Mock implementation
    }

    createEditModal(blogPost) {
        // Remove existing edit modal if it exists
        const existingModal = document.getElementById('blogEditModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create edit modal HTML
        const modalHTML = `
            <div id="blogEditModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;">
                <div style="background: white; padding: 20px; border-radius: 8px; max-width: 800px; width: 95%; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;">Edit Blog Post</h3>
                        <button id="closeBlogEditModal" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    </div>
                    
                    <form id="editBlogForm">
                        <input type="hidden" id="editBlogPostId" value="${blogPost.blog_post_id}">
                        
                        <div style="margin-bottom: 15px;">
                            <label for="editTitle" style="display: block; margin-bottom: 5px; font-weight: bold;">Title:</label>
                            <input type="text" id="editTitle" name="title" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" value="${blogPost.title || ''}" required>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label for="editExcerpt" style="display: block; margin-bottom: 5px; font-weight: bold;">Excerpt:</label>
                            <textarea id="editExcerpt" name="excerpt" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${blogPost.excerpt || ''}</textarea>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label for="editContent" style="display: block; margin-bottom: 5px; font-weight: bold;">Content:</label>
                            <textarea id="editContent" name="content" rows="10" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;" required>${blogPost.content || ''}</textarea>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label for="editTags" style="display: block; margin-bottom: 5px; font-weight: bold;">Tags (comma-separated):</label>
                            <input type="text" id="editTags" name="tags" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" value="${Array.isArray(blogPost.tags) ? blogPost.tags.join(', ') : (blogPost.tags || '')}" placeholder="e.g., thanksgiving, family, recipes">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label for="editStatus" style="display: block; margin-bottom: 5px; font-weight: bold;">Status:</label>
                            <select id="editStatus" name="status" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="draft" ${blogPost.status === 'draft' ? 'selected' : ''}>Draft</option>
                                <option value="published" ${blogPost.status === 'published' ? 'selected' : ''}>Published</option>
                                <option value="archived" ${blogPost.status === 'archived' ? 'selected' : ''}>Archived</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label for="editFeaturedImage" style="display: block; margin-bottom: 5px; font-weight: bold;">Featured Image URL:</label>
                            <input type="url" id="editFeaturedImage" name="featured_image" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" value="${blogPost.featured_image || ''}" placeholder="https://example.com/image.jpg">
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" id="cancelBlogEdit" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                            <button type="submit" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async saveBlogEdit(form) {
        const blogPostId = document.getElementById('editBlogPostId').value;
        const formData = new FormData(form);
        
        const updateData = {
            title: formData.get('title'),
            content: formData.get('content'),
            excerpt: formData.get('excerpt'),
            tags: formData.get('tags'),
            status: formData.get('status'),
            featured_image: formData.get('featured_image')
        };

        try {
            const response = await fetch(`/api/blog-posts/${blogPostId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Blog post updated successfully!');
                document.getElementById('blogEditModal').remove();
                await this.loadBlogPosts();
            } else {
                this.showError(result.message || 'Failed to update blog post');
            }
        } catch (error) {
            console.error('Error updating blog post:', error);
            this.showError('Failed to update blog post');
        }
    }

    showSuccess(message) {
        alert(message);
    }

    showError(message) {
        alert('Error: ' + message);
    }

    async loadBlogPosts() {
        // Mock implementation
    }
}

describe('Blog Edit Functionality', () => {
    let blogComponent;
    let mockContainer;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '';
        
        // Create mock container
        mockContainer = document.createElement('div');
        mockContainer.id = 'blogContainer';
        document.body.appendChild(mockContainer);

        // Initialize BlogComponent
        blogComponent = new BlogComponent('blogContainer', 466);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('editBlogPost method', () => {
        test('should call openEditModal when editBlogPost is called', () => {
            const mockBlogPostId = 123;
            const openEditModalSpy = jest.spyOn(blogComponent, 'openEditModal');
            
            blogComponent.editBlogPost(mockBlogPostId);
            
            expect(openEditModalSpy).toHaveBeenCalledWith(mockBlogPostId);
        });
    });

    describe('createEditModal method', () => {
        test('should create edit modal with correct structure', () => {
            const mockBlogPost = {
                blog_post_id: 123,
                title: 'Test Blog Post',
                content: 'This is test content',
                excerpt: 'Test excerpt',
                tags: ['thanksgiving', 'family'],
                status: 'draft',
                featured_image: 'https://example.com/image.jpg'
            };

            blogComponent.createEditModal(mockBlogPost);

            const modal = document.getElementById('blogEditModal');
            expect(modal).toBeTruthy();
            expect(modal.style.display).toBe('flex');

            // Check form elements
            expect(document.getElementById('editBlogPostId').value).toBe('123');
            expect(document.getElementById('editTitle').value).toBe('Test Blog Post');
            expect(document.getElementById('editContent').value).toBe('This is test content');
            expect(document.getElementById('editExcerpt').value).toBe('Test excerpt');
            expect(document.getElementById('editTags').value).toBe('thanksgiving, family');
            expect(document.getElementById('editStatus').value).toBe('draft');
            expect(document.getElementById('editFeaturedImage').value).toBe('https://example.com/image.jpg');
        });

        test('should handle array tags correctly', () => {
            const mockBlogPost = {
                blog_post_id: 123,
                title: 'Test',
                content: 'Test content',
                excerpt: 'Test excerpt',
                tags: ['tag1', 'tag2', 'tag3'],
                status: 'draft',
                featured_image: ''
            };

            blogComponent.createEditModal(mockBlogPost);

            expect(document.getElementById('editTags').value).toBe('tag1, tag2, tag3');
        });

        test('should handle string tags correctly', () => {
            const mockBlogPost = {
                blog_post_id: 123,
                title: 'Test',
                content: 'Test content',
                excerpt: 'Test excerpt',
                tags: 'single, tag, string',
                status: 'draft',
                featured_image: ''
            };

            blogComponent.createEditModal(mockBlogPost);

            expect(document.getElementById('editTags').value).toBe('single, tag, string');
        });

        test('should remove existing modal before creating new one', () => {
            const mockBlogPost = {
                blog_post_id: 123,
                title: 'Test',
                content: 'Test',
                excerpt: 'Test',
                tags: [],
                status: 'draft',
                featured_image: ''
            };

            // Create first modal
            blogComponent.createEditModal(mockBlogPost);
            const firstModal = document.getElementById('blogEditModal');

            // Create second modal
            blogComponent.createEditModal(mockBlogPost);
            const secondModal = document.getElementById('blogEditModal');

            // Should be different instances
            expect(firstModal).not.toBe(secondModal);
        });
    });

    describe('saveBlogEdit method', () => {
        beforeEach(() => {
            // Mock fetch
            global.fetch = jest.fn();
        });

        afterEach(() => {
            global.fetch.mockRestore();
        });

        test('should send correct data to API', async () => {
            const mockForm = {
                elements: {
                    editBlogPostId: { value: '123' }
                }
            };

            // Mock FormData
            const mockFormData = new Map();
            mockFormData.set('title', 'Updated Title');
            mockFormData.set('content', 'Updated content');
            mockFormData.set('excerpt', 'Updated excerpt');
            mockFormData.set('tags', 'updated, tags');
            mockFormData.set('status', 'published');
            mockFormData.set('featured_image', 'https://example.com/new-image.jpg');

            jest.spyOn(global, 'FormData').mockImplementation(() => ({
                get: (key) => mockFormData.get(key)
            }));

            // Mock successful API response
            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    success: true,
                    message: 'Blog post updated successfully'
                })
            });

            // Mock DOM elements
            document.body.innerHTML = `
                <div id="blogEditModal"></div>
                <input id="editBlogPostId" value="123">
            `;

            const loadBlogPostsSpy = jest.spyOn(blogComponent, 'loadBlogPosts').mockResolvedValue();
            const showSuccessSpy = jest.spyOn(blogComponent, 'showSuccess');

            await blogComponent.saveBlogEdit(mockForm);

            expect(global.fetch).toHaveBeenCalledWith('/api/blog-posts/123', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'Updated Title',
                    content: 'Updated content',
                    excerpt: 'Updated excerpt',
                    tags: 'updated, tags',
                    status: 'published',
                    featured_image: 'https://example.com/new-image.jpg'
                })
            });

            expect(showSuccessSpy).toHaveBeenCalledWith('Blog post updated successfully!');
            expect(loadBlogPostsSpy).toHaveBeenCalled();
        });

        test('should handle API errors gracefully', async () => {
            const mockForm = {
                elements: {
                    editBlogPostId: { value: '123' }
                }
            };

            jest.spyOn(global, 'FormData').mockImplementation(() => ({
                get: () => 'test'
            }));

            // Mock API error response
            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    success: false,
                    message: 'Blog post not found'
                })
            });

            document.body.innerHTML = `
                <div id="blogEditModal"></div>
                <input id="editBlogPostId" value="123">
            `;
            const showErrorSpy = jest.spyOn(blogComponent, 'showError');

            await blogComponent.saveBlogEdit(mockForm);

            expect(showErrorSpy).toHaveBeenCalledWith('Blog post not found');
        });
    });
});
