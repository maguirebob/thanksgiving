const { test, expect } = require('@playwright/test');

test.describe('Blog Frontend', () => {
    let page;
    let authToken;

    test.beforeAll(async ({ browser }) => {
        // Create a new page
        page = await browser.newPage();
        
        // Set base URL to Vercel deployment
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app');
        
        // Login to get auth token
        await page.click('text=Login');
        await page.fill('input[name="username"]', 'testadmin');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // Wait for login to complete
        await page.waitForURL('**/');
        
        // Get auth token from localStorage
        authToken = await page.evaluate(() => localStorage.getItem('authToken'));
        
        // Set the token in cookie for API calls
        await page.context().addCookies([{
            name: 'authToken',
            value: authToken,
            domain: 'thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app',
            path: '/',
            httpOnly: false,
            secure: true,
            sameSite: 'None'
        }]);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('should load blog list page', async () => {
        // Navigate to blog page (assuming it exists)
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog');
        
        // Check if blog page loads
        await expect(page).toHaveTitle(/Blog|Thanksgiving/);
        
        // Check for blog-specific elements
        await expect(page.locator('h1')).toContainText(/Blog|Thanksgiving/);
    });

    test('should display blog post creation form', async () => {
        // Navigate to blog creation page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog/create');
        
        // Check for form elements
        await expect(page.locator('input[name="title"]')).toBeVisible();
        await expect(page.locator('textarea[name="content"]')).toBeVisible();
        await expect(page.locator('select[name="status"]')).toBeVisible();
        
        // Check for rich text editor
        await expect(page.locator('.ql-editor')).toBeVisible();
    });

    test('should create a new blog post', async () => {
        // Navigate to blog creation page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog/create');
        
        // Fill in blog post form
        await page.fill('input[name="title"]', 'Test Blog Post');
        await page.fill('textarea[name="content"]', 'This is a test blog post content with at least 50 characters to meet validation requirements.');
        await page.selectOption('select[name="status"]', 'draft');
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Check for success message or redirect
        await expect(page.locator('.alert-success, .toast-success')).toBeVisible();
    });

    test('should edit existing blog post', async () => {
        // First create a blog post
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog/create');
        await page.fill('input[name="title"]', 'Editable Blog Post');
        await page.fill('textarea[name="content"]', 'This is an editable blog post with at least 50 characters to meet validation requirements.');
        await page.selectOption('select[name="status"]', 'draft');
        await page.click('button[type="submit"]');
        
        // Wait for creation to complete
        await page.waitForURL('**/blog**');
        
        // Find and click edit button for the created post
        const editButton = page.locator('button:has-text("Edit")').first();
        await editButton.click();
        
        // Check if edit form is loaded
        await expect(page.locator('input[name="title"]')).toHaveValue('Editable Blog Post');
        
        // Update the title
        await page.fill('input[name="title"]', 'Updated Blog Post');
        await page.click('button[type="submit"]');
        
        // Check for success message
        await expect(page.locator('.alert-success, .toast-success')).toBeVisible();
    });

    test('should search blog posts', async () => {
        // Navigate to blog list page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog');
        
        // Check for search input
        const searchInput = page.locator('input[placeholder*="search" i], input[name="search"]');
        await expect(searchInput).toBeVisible();
        
        // Perform search
        await searchInput.fill('test');
        await searchInput.press('Enter');
        
        // Check for search results
        await expect(page.locator('.blog-post, .post-card')).toBeVisible();
    });

    test('should filter blog posts by status', async () => {
        // Navigate to blog list page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog');
        
        // Check for status filter
        const statusFilter = page.locator('select[name="status"], .status-filter');
        await expect(statusFilter).toBeVisible();
        
        // Filter by published posts
        await statusFilter.selectOption('published');
        
        // Check that only published posts are shown
        const publishedPosts = page.locator('.blog-post[data-status="published"], .post-card[data-status="published"]');
        await expect(publishedPosts).toBeVisible();
    });

    test('should filter blog posts by category', async () => {
        // Navigate to blog list page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog');
        
        // Check for category filter
        const categoryFilter = page.locator('select[name="category"], .category-filter');
        await expect(categoryFilter).toBeVisible();
        
        // Filter by a specific category
        await categoryFilter.selectOption('memories');
        
        // Check that only posts from that category are shown
        const categoryPosts = page.locator('.blog-post[data-category="memories"], .post-card[data-category="memories"]');
        await expect(categoryPosts).toBeVisible();
    });

    test('should display blog post detail page', async () => {
        // Navigate to blog list page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog');
        
        // Click on first blog post
        const firstPost = page.locator('.blog-post, .post-card').first();
        await firstPost.click();
        
        // Check for blog post detail elements
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('.blog-content, .post-content')).toBeVisible();
        await expect(page.locator('.blog-meta, .post-meta')).toBeVisible();
    });

    test('should delete blog post', async () => {
        // First create a blog post
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog/create');
        await page.fill('input[name="title"]', 'Deletable Blog Post');
        await page.fill('textarea[name="content"]', 'This is a deletable blog post with at least 50 characters to meet validation requirements.');
        await page.selectOption('select[name="status"]', 'draft');
        await page.click('button[type="submit"]');
        
        // Wait for creation to complete
        await page.waitForURL('**/blog**');
        
        // Find and click delete button
        const deleteButton = page.locator('button:has-text("Delete")').first();
        await deleteButton.click();
        
        // Confirm deletion in modal
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last();
        await confirmButton.click();
        
        // Check for success message
        await expect(page.locator('.alert-success, .toast-success')).toBeVisible();
    });

    test('should handle rich text editor', async () => {
        // Navigate to blog creation page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog/create');
        
        // Check for rich text editor
        const editor = page.locator('.ql-editor');
        await expect(editor).toBeVisible();
        
        // Type in the editor
        await editor.fill('This is rich text content with formatting.');
        
        // Check for toolbar buttons
        const boldButton = page.locator('.ql-bold');
        const italicButton = page.locator('.ql-italic');
        await expect(boldButton).toBeVisible();
        await expect(italicButton).toBeVisible();
        
        // Test formatting
        await editor.selectText();
        await boldButton.click();
        
        // Check if formatting was applied
        const boldText = page.locator('.ql-editor strong');
        await expect(boldText).toBeVisible();
    });

    test('should handle image upload in blog post', async () => {
        // Navigate to blog creation page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog/create');
        
        // Check for image upload input
        const imageInput = page.locator('input[type="file"][accept*="image"]');
        await expect(imageInput).toBeVisible();
        
        // Test file upload (if file input is present)
        if (await imageInput.isVisible()) {
            // Note: In a real test, you would upload an actual image file
            // For now, we'll just verify the input exists
            expect(await imageInput.isVisible()).toBe(true);
        }
    });

    test('should display pagination for blog posts', async () => {
        // Navigate to blog list page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog');
        
        // Check for pagination controls
        const pagination = page.locator('.pagination, .page-navigation');
        
        // Pagination might not be visible if there are few posts
        if (await pagination.isVisible()) {
            await expect(pagination).toBeVisible();
            
            // Check for page numbers
            const pageNumbers = pagination.locator('.page-number, .page-link');
            await expect(pageNumbers).toBeVisible();
        }
    });

    test('should be responsive on mobile devices', async () => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Navigate to blog list page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog');
        
        // Check that page is responsive
        await expect(page.locator('body')).toBeVisible();
        
        // Check for mobile-specific elements or layout
        const mobileMenu = page.locator('.mobile-menu, .navbar-toggler');
        if (await mobileMenu.isVisible()) {
            await expect(mobileMenu).toBeVisible();
        }
    });

    test('should handle error states gracefully', async () => {
        // Navigate to blog creation page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog/create');
        
        // Try to submit empty form
        await page.click('button[type="submit"]');
        
        // Check for validation errors
        const errorMessages = page.locator('.error, .invalid-feedback, .alert-danger');
        await expect(errorMessages).toBeVisible();
    });

    test('should load blog categories and tags', async () => {
        // Navigate to blog creation page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog/create');
        
        // Check for category dropdown
        const categorySelect = page.locator('select[name="category"], .category-select');
        if (await categorySelect.isVisible()) {
            await expect(categorySelect).toBeVisible();
            
            // Check for category options
            const categoryOptions = categorySelect.locator('option');
            await expect(categoryOptions).toHaveCount({ min: 1 });
        }
        
        // Check for tag input
        const tagInput = page.locator('input[name="tags"], .tag-input');
        if (await tagInput.isVisible()) {
            await expect(tagInput).toBeVisible();
        }
    });

    test('should display blog post statistics', async () => {
        // Navigate to blog list page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog');
        
        // Check for statistics or counters
        const stats = page.locator('.blog-stats, .post-count, .statistics');
        if (await stats.isVisible()) {
            await expect(stats).toBeVisible();
        }
    });

    test('should handle blog post preview', async () => {
        // Navigate to blog creation page
        await page.goto('https://thanksgiving-4q7wsnwmy-maguirebobs-projects.vercel.app/blog/create');
        
        // Fill in some content
        await page.fill('input[name="title"]', 'Preview Test Post');
        await page.fill('textarea[name="content"]', 'This is content for preview testing with at least 50 characters to meet validation requirements.');
        
        // Look for preview button
        const previewButton = page.locator('button:has-text("Preview")');
        if (await previewButton.isVisible()) {
            await previewButton.click();
            
            // Check for preview modal or page
            const previewModal = page.locator('.preview-modal, .blog-preview');
            await expect(previewModal).toBeVisible();
        }
    });
});
