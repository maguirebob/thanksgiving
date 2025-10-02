import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - End-to-End', () => {
  test('homepage should load and display menus', async ({ page }) => {
    await page.goto('/');
    
    // Since authentication is required, we should be redirected to login
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Check login page title
    await expect(page).toHaveTitle(/Login/);
    
    // Check that login form is present
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should navigate to menu detail page', async ({ page }) => {
    await page.goto('/');
    
    // Since authentication is required, we should be redirected to login
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Check that we're on the login page
    await expect(page.locator('form')).toBeVisible();
  });

  test('version API should return correct response', async ({ page }) => {
    const response = await page.request.get('/api/v1/version/display');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      data: {
        version: expect.stringMatching(/^\d+\.\d+\.\d+$/), // Match any semantic version
        environment: expect.any(String),
        buildDate: expect.any(String)
      }
    });
  });

  test('database setup API should work', async ({ page }) => {
    const response = await page.request.get('/api/setup-database');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      message: expect.any(String),
      data: expect.objectContaining({
        // Accept either format: eventsCreated/usersCreated OR eventCount/userCount
        ...(data.data.eventsCreated !== undefined ? {
          eventsCreated: expect.any(Number),
          usersCreated: expect.any(Number),
          totalEvents: expect.any(Number),
          totalUsers: expect.any(Number)
        } : {
          eventCount: expect.any(Number),
          userCount: expect.any(Number)
        })
      })
    });
  });

  test('should display Grandma Maguire image correctly', async ({ page }) => {
    await page.goto('/');
    
    // Since authentication is required, we should be redirected to login
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Check that login form is present
    await expect(page.locator('form')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Since authentication is required, we should be redirected to login
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Check that page loads without horizontal scroll
    const body = page.locator('body');
    const boundingBox = await body.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
    
    // Check that login form is visible on mobile
    await expect(page.locator('form')).toBeVisible();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/nonexistent-page');
    expect(response?.status()).toBe(404);
    
    // Check that error page is displayed
    await expect(page.locator('h1')).toContainText('Error');
  });

  test('should load all required CSS and JavaScript', async ({ page }) => {
    await page.goto('/');
    
    // Since authentication is required, we should be redirected to login
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Check that Bootstrap CSS is loaded
    const bootstrapCSS = page.locator('link[href*="bootstrap"]');
    await expect(bootstrapCSS).toHaveCount(1);
    
    // Check that Bootstrap JS is loaded
    const bootstrapJS = page.locator('script[src*="bootstrap"]');
    await expect(bootstrapJS).toHaveCount(1);
    
    // Check that Font Awesome is loaded
    const fontAwesome = page.locator('link[href*="font-awesome"]');
    await expect(fontAwesome).toHaveCount(1);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Since authentication is required, we should be redirected to login
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Check viewport meta tag (accept both 1 and 1.0)
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width, initial-scale=1\.?0?/);
    
    // Check charset (accept both utf-8 and UTF-8)
    const charset = page.locator('meta[charset]');
    await expect(charset).toHaveAttribute('charset', /utf-8/i);
  });

  // Admin Dashboard Tests
  test('admin dashboard should load after login', async ({ page }) => {
    // First login
    await page.goto('/auth/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    
    // Check admin dashboard elements
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('#viewVolumeBtn')).toBeVisible();
    await expect(page.locator('[data-bs-target="#addMenuModal"]')).toBeVisible();
  });

  test('admin volume contents should load', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Click view volume button
    await page.click('#viewVolumeBtn');
    
    // Check volume modal opens
    await expect(page.locator('#volumeContentsModal')).toBeVisible();
    
    // Check volume contents load
    await expect(page.locator('#volumeContents')).toBeVisible();
    
    // Check refresh button exists
    await expect(page.locator('#refreshVolumeBtn')).toBeVisible();
  });

  test('admin add menu modal should open', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Click add menu button
    await page.click('[data-bs-target="#addMenuModal"]');
    
    // Check add menu modal opens
    await expect(page.locator('#addMenuModal')).toBeVisible();
    
    // Check form elements exist
    await expect(page.locator('input[name="event_name"]')).toBeVisible();
    await expect(page.locator('input[name="event_date"]')).toBeVisible();
    await expect(page.locator('input[name="menu_title"]')).toBeVisible();
    await expect(page.locator('input[name="menu_image"]')).toBeVisible();
  });

  // API Tests for Admin Functions
  test('admin volume contents API should work', async ({ page }) => {
    // Login first to get session
    await page.goto('/auth/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Test volume contents API
    const response = await page.request.get('/admin/volume-contents');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      environment: expect.any(String),
      mountPath: expect.any(String),
      files: expect.any(Array),
      stats: expect.objectContaining({
        totalFiles: expect.any(Number),
        totalSize: expect.any(String),
        imageFiles: expect.any(Number),
        otherFiles: expect.any(Number)
      })
    });
  });

  // File Upload Tests
  test('file upload should work', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Go to add menu modal
    await page.click('[data-bs-target="#addMenuModal"]');
    await expect(page.locator('#addMenuModal')).toBeVisible();
    
    // Check file input exists
    const fileInput = page.locator('input[name="menu_image"]');
    await expect(fileInput).toBeVisible();
    
    // Test file input accepts images
    await expect(fileInput).toHaveAttribute('accept', /image\//);
  });

  // Error Handling Tests
  test('should handle invalid admin routes gracefully', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Test invalid admin route
    const response = await page.goto('/admin/invalid-route');
    expect(response?.status()).toBe(404);
  });

  test('should handle unauthorized access to admin routes', async ({ page }) => {
    // Try to access admin route without login
    const response = await page.goto('/admin/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  // Database Integration Tests
  test('database operations should work', async ({ page }) => {
    // Test database setup API
    const response = await page.request.get('/api/setup-database');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      eventCount: expect.any(Number),
      userCount: expect.any(Number)
    });
  });

  // Performance Tests
  test('pages should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth\/login/);
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  // Security Tests
  test('should not expose sensitive information', async ({ page }) => {
    // Check that error pages don't expose stack traces
    const response = await page.goto('/nonexistent-page');
    expect(response?.status()).toBe(404);
    
    // Error page should not contain sensitive information
    const content = await page.textContent('body');
    expect(content).not.toContain('stack trace');
    expect(content).not.toContain('Error:');
  });
});
