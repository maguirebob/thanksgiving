/**
 * Blog Component - Handles blog post management functionality
 * Provides reusable components for blog creation, display, and management
 */

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

class BlogComponent {
    constructor(eventId, containerId) {
        this.eventId = eventId;
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.blogPosts = [];
        this.currentPage = 1;
        this.pageSize = 6;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.createBlogInterface();
        this.createBlogModal();
        this.bindEvents();
        this.loadBlogPosts();
    }

    createBlogInterface() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="blog-component">
                <!-- Blog Header -->
                <div class="blog-header mb-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">
                            <i class="fas fa-blog me-2"></i>Blog Posts
                        </h3>
                        <div class="blog-controls">
                            <button class="btn btn-info" id="createBlogPostBtn">
                                <i class="fas fa-plus me-2"></i>Write Post
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Search and Filter -->
                <div class="blog-search mb-3">
                    <div class="row">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="blogSearchInput" 
                                   placeholder="Search blog posts by title or content...">
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="blogStatusSelect">
                                <option value="">All Posts</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <button class="btn btn-outline-secondary" id="clearBlogFiltersBtn">
                                <i class="fas fa-times me-2"></i>Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Loading Indicator -->
                <div id="blogLoadingIndicator" class="text-center py-4" style="display: none;">
                    <div class="spinner-border text-info" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading blog posts...</p>
                </div>

                <!-- Blog Posts List -->
                <div id="blogPostsList" class="row">
                    <!-- Blog posts will be dynamically loaded here -->
                </div>

                <!-- No Blog Posts Message -->
                <div id="noBlogPostsMessage" class="text-center text-muted py-5" style="display: none;">
                    <i class="fas fa-blog fa-3x mb-3" style="color: #dee2e6;"></i>
                    <h4>No blog posts yet</h4>
                    <p>Share stories and memories from this Thanksgiving!</p>
                    <button class="btn btn-info" id="createFirstBlogPostBtn">
                        <i class="fas fa-plus me-2"></i>Write First Post
                    </button>
                </div>

                <!-- Pagination -->
                <div id="blogPagination" class="d-flex justify-content-center mt-4" style="display: none;">
                    <nav aria-label="Blog pagination">
                        <ul class="pagination" id="blogPaginationList">
                            <!-- Pagination buttons will be generated here -->
                        </ul>
                    </nav>
                </div>
            </div>
        `;
    }

    createBlogModal() {
        // Create modal if it doesn't exist
        if (document.getElementById('blogPostModal')) return;

        const modalHTML = `
            <div id="blogPostModal" class="modal fade" tabindex="-1" aria-labelledby="blogPostModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="blogPostModalLabel">
                                <i class="fas fa-blog me-2"></i>Create Blog Post
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="blogPostForm">
                                <div class="row">
                                    <div class="col-md-8">
                                        <div class="mb-3">
                                            <label for="blogTitle" class="form-label">Title *</label>
                                            <input type="text" class="form-control" id="blogTitle" required
                                                   placeholder="Enter blog post title...">
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="blogContent" class="form-label">Content *</label>
                                            <textarea class="form-control" id="blogContent" rows="10" required
                                                      placeholder="Write your blog post content here..."></textarea>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="blogExcerpt" class="form-label">Excerpt</label>
                                            <textarea class="form-control" id="blogExcerpt" rows="3"
                                                      placeholder="Brief summary of your post..."></textarea>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="blogTags" class="form-label">Tags</label>
                                            <input type="text" class="form-control" id="blogTags"
                                                   placeholder="tag1, tag2, tag3">
                                            <div class="form-text">Separate tags with commas</div>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="blogStatus" class="form-label">Status</label>
                                            <select class="form-select" id="blogStatus">
                                                <option value="draft">Draft</option>
                                                <option value="published">Published</option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="blogFeaturedImage" class="form-label">Featured Image URL</label>
                                            <input type="url" class="form-control" id="blogFeaturedImage"
                                                   placeholder="https://example.com/image.jpg">
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-info" id="saveBlogPostBtn">
                                <i class="fas fa-save me-2"></i>Save Post
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    bindEvents() {
        // Create button events
        const createBtn = document.getElementById('createBlogPostBtn');
        const createFirstBtn = document.getElementById('createFirstBlogPostBtn');
        
        if (createBtn) createBtn.addEventListener('click', () => this.openCreateModal());
        if (createFirstBtn) createFirstBtn.addEventListener('click', () => this.openCreateModal());

        // Search and filter events
        const searchInput = document.getElementById('blogSearchInput');
        const statusSelect = document.getElementById('blogStatusSelect');
        const clearFiltersBtn = document.getElementById('clearBlogFiltersBtn');

        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => this.handleSearch(), 300));
        }
        if (statusSelect) {
            statusSelect.addEventListener('change', () => this.handleFilter());
        }
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Form events
        const saveBtn = document.getElementById('saveBlogPostBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }
    }

    async loadBlogPosts(page = 1) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);

        try {
            const searchTerm = document.getElementById('blogSearchInput')?.value || '';
            const status = document.getElementById('blogStatusSelect')?.value || '';
            
            let url = `/api/events/${this.eventId}/blog-posts?page=${page}&limit=${this.pageSize}`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (status) url += `&status=${status}`;

            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                this.blogPosts = result.data.blogPosts;
                this.currentPage = page;
                this.displayBlogPosts();
                this.updatePagination(result.data.pagination);
                this.updateBlogCount(result.data.blogPosts.length);
            } else {
                this.showError('Failed to load blog posts: ' + result.message);
            }
        } catch (error) {
            console.error('Error loading blog posts:', error);
            this.showError('Error loading blog posts: ' + error.message);
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    displayBlogPosts() {
        const blogPostsList = document.getElementById('blogPostsList');
        const noBlogPostsMessage = document.getElementById('noBlogPostsMessage');
        
        if (!blogPostsList) return;

        if (this.blogPosts.length === 0) {
            blogPostsList.innerHTML = '';
            if (noBlogPostsMessage) noBlogPostsMessage.style.display = 'block';
            return;
        }

        if (noBlogPostsMessage) noBlogPostsMessage.style.display = 'none';

        blogPostsList.innerHTML = this.blogPosts.map(post => this.createBlogPostCard(post)).join('');
    }

    createBlogPostCard(post) {
        const excerpt = post.excerpt || this.truncateText(post.content, 150);
        const publishedDate = post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft';
        const author = post.user ? `${post.user.first_name} ${post.user.last_name}` : 'Unknown Author';
        const statusBadge = this.getStatusBadge(post.status);

        return `
            <div class="col-md-6 mb-4">
                <div class="card blog-post-card h-100">
                    ${post.featured_image ? `
                        <img src="${post.featured_image}" class="card-img-top" 
                             style="height: 200px; object-fit: cover;" alt="${post.title}">
                    ` : ''}
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title">${post.title}</h5>
                            ${statusBadge}
                        </div>
                        <p class="card-text text-muted">${excerpt}</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">
                                    <i class="fas fa-user me-1"></i>${author}<br>
                                    <i class="fas fa-calendar me-1"></i>${publishedDate}
                                </small>
                                <div class="btn-group btn-group-sm" role="group">
                                    <button type="button" class="btn btn-outline-primary" 
                                            onclick="blogComponent.viewBlogPost('${post.blog_post_id}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" 
                                            onclick="blogComponent.editBlogPost('${post.blog_post_id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-danger" 
                                            onclick="blogComponent.deleteBlogPost('${post.blog_post_id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            ${post.tags && post.tags.length > 0 ? `
                                <div class="mt-2">
                                    ${post.tags.map(tag => `<span class="badge bg-light text-dark me-1">${tag}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusBadge(status) {
        const badges = {
            'published': '<span class="badge bg-success">Published</span>',
            'draft': '<span class="badge bg-warning text-dark">Draft</span>',
            'archived': '<span class="badge bg-secondary">Archived</span>'
        };
        return badges[status] || '<span class="badge bg-light text-dark">Unknown</span>';
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    updatePagination(pagination) {
        const paginationContainer = document.getElementById('blogPagination');
        const paginationList = document.getElementById('blogPaginationList');
        
        if (!paginationContainer || !paginationList) return;

        if (pagination.pages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        
        let paginationHTML = '';
        
        // Previous button
        if (pagination.page > 1) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="blogComponent.loadBlogPosts(${pagination.page - 1})">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                </li>
            `;
        }

        // Page numbers
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === pagination.page ? 'active' : ''}">
                    <button class="page-link" onclick="blogComponent.loadBlogPosts(${i})">${i}</button>
                </li>
            `;
        }

        // Next button
        if (pagination.page < pagination.pages) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="blogComponent.loadBlogPosts(${pagination.page + 1})">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </li>
            `;
        }

        paginationList.innerHTML = paginationHTML;
    }

    openCreateModal() {
        const modal = new bootstrap.Modal(document.getElementById('blogPostModal'));
        modal.show();
    }

    async handleSave() {
        const title = document.getElementById('blogTitle').value.trim();
        const content = document.getElementById('blogContent').value.trim();
        const excerpt = document.getElementById('blogExcerpt').value.trim();
        const tags = document.getElementById('blogTags').value.trim();
        const status = document.getElementById('blogStatus').value;
        const featuredImage = document.getElementById('blogFeaturedImage').value.trim();
        const saveBtn = document.getElementById('saveBlogPostBtn');

        if (!title || !content) {
            this.showError('Title and content are required');
            return;
        }

        // Disable save button
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
        }

        try {
            const postData = {
                title,
                content,
                status
            };

            if (excerpt) postData.excerpt = excerpt;
            if (tags) postData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            if (featuredImage) postData.featured_image = featuredImage;

            const response = await fetch(`/api/events/${this.eventId}/blog-posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Blog post created successfully!');
                this.closeCreateModal();
                this.loadBlogPosts(this.currentPage);
            } else {
                this.showError('Save failed: ' + result.message);
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showError('Save failed: ' + error.message);
        } finally {
            // Re-enable save button
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Post';
            }
        }
    }

    closeCreateModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('blogPostModal'));
        if (modal) modal.hide();

        // Reset form
        document.getElementById('blogPostForm').reset();
    }

    viewBlogPost(blogPostId) {
        // Create and show blog post viewer modal
        const post = this.blogPosts.find(p => p.blog_post_id == blogPostId);
        if (!post) return;

        const modalHTML = `
            <div class="modal fade" id="blogViewerModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${post.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${post.featured_image ? `
                                <img src="${post.featured_image}" class="img-fluid mb-3" alt="${post.title}">
                            ` : ''}
                            <div class="blog-content">
                                ${this.formatBlogContent(post.content)}
                            </div>
                            ${post.tags && post.tags.length > 0 ? `
                                <div class="mt-3">
                                    <strong>Tags:</strong>
                                    ${post.tags.map(tag => `<span class="badge bg-light text-dark me-1">${tag}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="blogComponent.editBlogPost('${blogPostId}')">
                                <i class="fas fa-edit me-2"></i>Edit
                            </button>
                            <button type="button" class="btn btn-danger" onclick="blogComponent.deleteBlogPost('${blogPostId}')">
                                <i class="fas fa-trash me-2"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('blogViewerModal');
        if (existingModal) existingModal.remove();

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('blogViewerModal'));
        modal.show();

        // Clean up when modal is hidden
        document.getElementById('blogViewerModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('blogViewerModal').remove();
        });
    }

    formatBlogContent(content) {
        // Simple formatting - convert line breaks to HTML
        return content.replace(/\n/g, '<br>');
    }

    editBlogPost(blogPostId) {
        this.openEditModal(blogPostId);
    }

    async openEditModal(blogPostId) {
        try {
            // Fetch blog post data
            const response = await fetch(`/api/blog-posts/${blogPostId}`);
            const result = await response.json();
            
            if (!result.success) {
                this.showError('Failed to load blog post data');
                return;
            }
            
            const blogPost = result.data;
            this.createEditModal(blogPost);
        } catch (error) {
            console.error('Error fetching blog post:', error);
            this.showError('Failed to load blog post data');
        }
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

        // Bind events
        this.bindEditModalEvents();
    }

    bindEditModalEvents() {
        const modal = document.getElementById('blogEditModal');
        const closeBtn = document.getElementById('closeBlogEditModal');
        const cancelBtn = document.getElementById('cancelBlogEdit');
        const form = document.getElementById('editBlogForm');

        // Close modal events
        const closeModal = () => {
            modal.remove();
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveBlogEdit(form);
        });
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
                // Reload blog posts to show updated data
                await this.loadBlogPosts();
            } else {
                this.showError(result.message || 'Failed to update blog post');
            }
        } catch (error) {
            console.error('Error updating blog post:', error);
            this.showError('Failed to update blog post');
        }
    }

    async deleteBlogPost(blogPostId) {
        if (!confirm('Are you sure you want to delete this blog post?')) return;

        try {
            const response = await fetch(`/api/blog-posts/${blogPostId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Blog post deleted successfully!');
                this.loadBlogPosts(this.currentPage);
            } else {
                this.showError('Delete failed: ' + result.message);
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showError('Delete failed: ' + error.message);
        }
    }

    handleSearch() {
        this.loadBlogPosts(1);
    }

    handleFilter() {
        this.loadBlogPosts(1);
    }

    clearFilters() {
        document.getElementById('blogSearchInput').value = '';
        document.getElementById('blogStatusSelect').value = '';
        this.loadBlogPosts(1);
    }

    updateBlogCount(count) {
        // Update global blog count if function exists
        if (typeof updateBlogCount === 'function') {
            updateBlogCount(count);
        }
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('blogLoadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        // Simple error display - could be enhanced with toast notifications
        alert('Error: ' + message);
    }

    showSuccess(message) {
        // Simple success display - could be enhanced with toast notifications
        alert(message);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogComponent;
}
