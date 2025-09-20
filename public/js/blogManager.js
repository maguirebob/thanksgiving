/**
 * BlogManager - Handles all blog-related frontend functionality
 */
class BlogManager {
    constructor() {
        this.apiBase = '/api/v1/blog';
        this.currentPage = 1;
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.quillEditor = null;
        this.categories = [];
        this.tags = [];
        this.events = [];
    }

    /**
     * Initialize blog functionality for the main blog page
     */
    async init() {
        try {
            await this.loadCategories();
            await this.loadTags();
            await this.loadRecentPosts();
            await this.loadBlogPosts();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing blog:', error);
            this.showError('Failed to load blog content. Please refresh the page.');
        }
    }

    /**
     * Initialize blog detail page functionality
     */
    async initDetail() {
        try {
            await this.loadCategories();
            await this.loadTags();
            await this.loadRelatedPosts();
            this.setupDetailEventListeners();
        } catch (error) {
            console.error('Error initializing blog detail:', error);
        }
    }

    /**
     * Initialize blog create/edit page functionality
     */
    async initCreate() {
        try {
            await this.loadCategories();
            await this.loadEvents();
            this.initializeRichTextEditor();
            this.setupCreateEventListeners();
        } catch (error) {
            console.error('Error initializing blog create:', error);
        }
    }

    /**
     * Load blog posts from the API
     */
    async loadBlogPosts() {
        this.showLoading(true);
        
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: 10,
                filter: this.currentFilter,
                search: this.searchQuery
            });

            const response = await fetch(`${this.apiBase}/posts?${params}`);
            const data = await response.json();

            if (data.success) {
                this.renderBlogPosts(data.data);
                this.renderPagination(data.pagination);
            } else {
                throw new Error(data.message || 'Failed to load blog posts');
            }
        } catch (error) {
            console.error('Error loading blog posts:', error);
            this.showError('Failed to load blog posts. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Render blog posts in the container
     */
    renderBlogPosts(posts) {
        const container = document.getElementById('blogPostsContainer');
        
        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-blog fa-3x text-muted mb-3"></i>
                    <h4>No blog posts found</h4>
                    <p class="text-muted">Try adjusting your search or filter criteria.</p>
                </div>
            `;
            return;
        }

        const postsHtml = posts.map(post => this.createPostCard(post)).join('');
        container.innerHTML = postsHtml;
    }

    /**
     * Create HTML for a blog post card
     */
    createPostCard(post) {
        const publishedDate = new Date(post.published_at).toLocaleDateString();
        const excerpt = post.excerpt || this.truncateText(post.content, 150);
        
        return `
            <article class="blog-post-card">
                <div class="row">
                    <div class="col-md-4">
                        ${post.featured_image_url ? 
                            `<img src="${post.featured_image_url}" alt="${post.title}" class="post-image">` :
                            `<div class="post-image-placeholder"><i class="fas fa-image"></i></div>`
                        }
                    </div>
                    <div class="col-md-8">
                        <div class="post-content">
                            <div class="post-meta">
                                <span class="post-date">
                                    <i class="fas fa-calendar me-1"></i>
                                    ${publishedDate}
                                </span>
                                <span class="post-author">
                                    <i class="fas fa-user me-1"></i>
                                    ${post.author.first_name} ${post.author.last_name}
                                </span>
                                ${post.is_featured ? '<span class="featured-badge"><i class="fas fa-star me-1"></i>Featured</span>' : ''}
                            </div>
                            
                            <h3 class="post-title">
                                <a href="/blog/${post.id}">${post.title}</a>
                            </h3>
                            
                            <p class="post-excerpt">${excerpt}</p>
                            
                            <div class="post-footer">
                                ${post.category ? 
                                    `<span class="category-badge" style="background-color: ${post.category.color}">${post.category.name}</span>` : 
                                    ''
                                }
                                
                                <div class="post-stats">
                                    <span class="view-count">
                                        <i class="fas fa-eye me-1"></i>
                                        ${post.view_count} views
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * Load categories from the API
     */
    async loadCategories() {
        try {
            const response = await fetch(`${this.apiBase}/categories`);
            const data = await response.json();
            
            if (data.success) {
                this.categories = data.data;
                this.renderCategories();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    /**
     * Render categories in the sidebar
     */
    renderCategories() {
        const container = document.getElementById('categoriesList');
        if (!container) return;

        const categoriesHtml = this.categories.map(category => `
            <a href="#" class="category-link" data-category-id="${category.id}">
                <span class="category-color" style="background-color: ${category.color}"></span>
                ${category.name}
                <span class="category-count">(${category.post_count || 0})</span>
            </a>
        `).join('');

        container.innerHTML = categoriesHtml;
    }

    /**
     * Load tags from the API
     */
    async loadTags() {
        try {
            const response = await fetch(`${this.apiBase}/tags`);
            const data = await response.json();
            
            if (data.success) {
                this.tags = data.data;
                this.renderTags();
            }
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }

    /**
     * Render tags in the sidebar
     */
    renderTags() {
        const container = document.getElementById('tagsList');
        if (!container) return;

        const tagsHtml = this.tags.slice(0, 10).map(tag => `
            <span class="tag-badge" data-tag-id="${tag.id}">
                <i class="fas fa-tag me-1"></i>
                ${tag.name}
            </span>
        `).join('');

        container.innerHTML = tagsHtml;
    }

    /**
     * Load recent posts for sidebar
     */
    async loadRecentPosts() {
        try {
            const response = await fetch(`${this.apiBase}/posts/recent?limit=5`);
            const data = await response.json();
            
            if (data.success) {
                this.renderRecentPosts(data.data);
            }
        } catch (error) {
            console.error('Error loading recent posts:', error);
        }
    }

    /**
     * Render recent posts in sidebar
     */
    renderRecentPosts(posts) {
        const container = document.getElementById('recentPostsList');
        if (!container) return;

        const postsHtml = posts.map(post => `
            <div class="recent-post">
                <h6><a href="/blog/${post.id}">${post.title}</a></h6>
                <small class="text-muted">
                    <i class="fas fa-calendar me-1"></i>
                    ${new Date(post.published_at).toLocaleDateString()}
                </small>
            </div>
        `).join('');

        container.innerHTML = postsHtml;
    }

    /**
     * Load events for create/edit form
     */
    async loadEvents() {
        try {
            const response = await fetch('/api/v1/events');
            const data = await response.json();
            
            if (data.success) {
                this.events = data.data;
                this.renderEvents();
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    /**
     * Render events in select dropdown
     */
    renderEvents() {
        const select = document.getElementById('postEvent');
        if (!select) return;

        const options = this.events.map(event => `
            <option value="${event.id}">${event.event_name} (${new Date(event.event_date).getFullYear()})</option>
        `).join('');

        select.innerHTML = '<option value="">Select an event (optional)</option>' + options;
    }

    /**
     * Initialize rich text editor
     */
    initializeRichTextEditor() {
        const editorContainer = document.getElementById('postContentEditor');
        if (!editorContainer) return;

        this.quillEditor = new Quill(editorContainer, {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['blockquote', 'code-block'],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });

        // Update hidden input when editor content changes
        this.quillEditor.on('text-change', () => {
            const content = this.quillEditor.root.innerHTML;
            document.getElementById('postContent').value = content;
            this.updatePreview();
        });
    }

    /**
     * Setup event listeners for main blog page
     */
    setupEventListeners() {
        // Filter navigation
        document.querySelectorAll('[data-filter]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentFilter = e.target.dataset.filter;
                this.currentPage = 1;
                this.updateActiveFilter(e.target);
                this.loadBlogPosts();
            });
        });

        // Search functionality
        const searchInput = document.getElementById('blogSearch');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        // Category filtering
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-link')) {
                e.preventDefault();
                // Implement category filtering
            }
        });
    }

    /**
     * Setup event listeners for detail page
     */
    setupDetailEventListeners() {
        // Like button
        const likeBtn = document.getElementById('likeBtn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                this.toggleLike();
            });
        }

        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.sharePost();
            });
        }
    }

    /**
     * Setup event listeners for create/edit page
     */
    setupCreateEventListeners() {
        const form = document.getElementById('blogPostForm');
        if (!form) return;

        // Auto-generate slug from title
        const titleInput = document.getElementById('postTitle');
        const slugInput = document.getElementById('postSlug');
        
        if (titleInput && slugInput) {
            titleInput.addEventListener('input', () => {
                if (!slugInput.value) {
                    slugInput.value = this.generateSlug(titleInput.value);
                }
                this.updatePreview();
            });
        }

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitPost();
        });

        // Save draft button
        const saveDraftBtn = document.getElementById('saveDraftBtn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => {
                this.saveDraft();
            });
        }

        // Real-time preview updates
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updatePreview();
            });
        });
    }

    /**
     * Perform search
     */
    performSearch() {
        const searchInput = document.getElementById('blogSearch');
        if (searchInput) {
            this.searchQuery = searchInput.value.trim();
            this.currentPage = 1;
            this.loadBlogPosts();
        }
    }

    /**
     * Update active filter in navigation
     */
    updateActiveFilter(activeLink) {
        document.querySelectorAll('[data-filter]').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    /**
     * Generate URL slug from title
     */
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    /**
     * Update post preview
     */
    updatePreview() {
        const preview = document.getElementById('postPreview');
        if (!preview) return;

        const title = document.getElementById('postTitle')?.value || '';
        const excerpt = document.getElementById('postExcerpt')?.value || '';
        const content = this.quillEditor ? this.quillEditor.getText() : '';

        if (title || excerpt || content) {
            preview.innerHTML = `
                <h6>${title || 'Untitled Post'}</h6>
                <p class="text-muted">${excerpt || 'No excerpt provided'}</p>
                <small class="text-muted">${content.length} characters</small>
            `;
        } else {
            preview.innerHTML = '<p class="text-muted">Start typing to see a preview of your post...</p>';
        }
    }

    /**
     * Submit blog post form
     */
    async submitPost() {
        const form = document.getElementById('blogPostForm');
        const formData = new FormData(form);
        
        // Get content from Quill editor
        if (this.quillEditor) {
            formData.set('content', this.quillEditor.root.innerHTML);
        }

        // Process tags
        const tagsInput = document.getElementById('postTags');
        if (tagsInput && tagsInput.value) {
            const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
            formData.set('tags', JSON.stringify(tags));
        }

        try {
            const response = await fetch(`${this.apiBase}/posts`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Blog post created successfully!');
                window.location.href = `/blog/${data.data.id}`;
            } else {
                throw new Error(data.message || 'Failed to create blog post');
            }
        } catch (error) {
            console.error('Error creating blog post:', error);
            this.showError('Failed to create blog post. Please try again.');
        }
    }

    /**
     * Save as draft
     */
    saveDraft() {
        const statusSelect = document.getElementById('postStatus');
        if (statusSelect) {
            statusSelect.value = 'draft';
        }
        this.submitPost();
    }

    /**
     * Toggle like on a post
     */
    async toggleLike() {
        // Implement like functionality
        console.log('Toggle like');
    }

    /**
     * Share post
     */
    sharePost() {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                url: window.location.href
            });
        } else {
            // Fallback to copying URL
            navigator.clipboard.writeText(window.location.href);
            this.showSuccess('Post URL copied to clipboard!');
        }
    }

    /**
     * Show loading indicator
     */
    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Implement error notification
        console.error(message);
        alert(message); // Temporary - replace with proper notification system
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // Implement success notification
        console.log(message);
        alert(message); // Temporary - replace with proper notification system
    }

    /**
     * Truncate text to specified length
     */
    truncateText(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length).trim() + '...';
    }

    /**
     * Render pagination
     */
    renderPagination(pagination) {
        const container = document.getElementById('blogPagination');
        if (!container || !pagination) return;

        const { page, pages, total } = pagination;
        
        if (pages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHtml = '';
        
        // Previous button
        if (page > 1) {
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${page - 1}">Previous</a>
                </li>
            `;
        }

        // Page numbers
        for (let i = 1; i <= pages; i++) {
            const isActive = i === page;
            paginationHtml += `
                <li class="page-item ${isActive ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // Next button
        if (page < pages) {
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${page + 1}">Next</a>
                </li>
            `;
        }

        container.innerHTML = paginationHtml;

        // Add click event listeners
        container.querySelectorAll('a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage = parseInt(e.target.dataset.page);
                this.loadBlogPosts();
            });
        });
    }
}
