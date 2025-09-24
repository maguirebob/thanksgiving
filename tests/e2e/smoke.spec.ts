import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - End-to-End', () => {
  test('homepage should load and display menus', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Thanksgiving Menu Collection/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Thanksgiving Menu Collection');
    
    // Check subtitle (use first lead element)
    await expect(page.locator('.lead').first()).toContainText('A collection of Thanksgiving menus from 1994 to today');
    
    // Check that menu cards are displayed
    const menuCards = page.locator('.menu-card');
    await expect(menuCards).toHaveCount(1);
    
    // Check that at least one menu card has expected content
    const firstCard = menuCards.first();
    await expect(firstCard.locator('h3')).toBeVisible();
    await expect(firstCard.locator('img')).toBeVisible();
  });

  test('should navigate to menu detail page', async ({ page }) => {
    await page.goto('/');
    
    // Click on the first "View Details" button (using btn-view-details class)
    const firstViewDetailsButton = page.locator('.btn-view-details').first();
    await expect(firstViewDetailsButton).toBeVisible();
    await firstViewDetailsButton.click();
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/menu\/\d+/);
    
    // Check detail page content
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.enhanced-detail-container')).toBeVisible();
  });

  test('version API should return correct response', async ({ page }) => {
    const response = await page.request.get('/api/v1/version/display');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      data: {
        version: '2.0.0',
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
    
    // Check that Grandma's image is visible
    const grandmaImage = page.locator('img[src*="Grandma80s"]');
    await expect(grandmaImage).toBeVisible();
    
    // Check that the stats section layout is correct (use first one)
    const statsSection = page.locator('.stats-section').first();
    await expect(statsSection).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that page loads without horizontal scroll
    const body = page.locator('body');
    const boundingBox = await body.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
    
    // Check that menu cards stack vertically
    const menuCards = page.locator('.menu-card');
    await expect(menuCards.first()).toBeVisible();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/nonexistent-page');
    expect(response?.status()).toBe(404);
    
    // Check that error page is displayed
    await expect(page.locator('h1')).toContainText('Error');
  });

  test('should load all required CSS and JavaScript', async ({ page }) => {
    await page.goto('/');
    
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
    
    // Check viewport meta tag (accept both 1 and 1.0)
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width, initial-scale=1\.?0?/);
    
    // Check charset
    const charset = page.locator('meta[charset]');
    await expect(charset).toHaveAttribute('charset', 'utf-8');
  });
});
