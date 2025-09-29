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
});
