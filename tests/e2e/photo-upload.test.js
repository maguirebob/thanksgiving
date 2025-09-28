const { test, expect } = require('@playwright/test');

test.describe('Photo Upload Functionality - Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to detail page
    await page.goto('http://localhost:3000/menu/466');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Clear console errors
    await page.evaluate(() => {
      console.clear();
    });
  });

  test('should upload single photo successfully', async ({ page }) => {
    // Check that page loads without errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Handle alert dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Photo uploaded successfully!');
      await dialog.accept();
    });

    // Click upload button
    await page.click('button:has-text("Upload Photo")');
    
    // Wait for modal to open
    await page.waitForSelector('#photoUploadModal', { state: 'visible' });
    
    // Select photo file
    const fileInput = page.locator('#photoFile');
    await fileInput.setInputFiles('tests/fixtures/test-photo-1.jpg');
    
    // Fill description and caption
    await page.fill('#photoDescription', 'Test Photo 1');
    await page.fill('#photoCaption', 'First Upload Test');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for modal to close (after alert is accepted)
    await page.waitForSelector('#photoUploadModal', { state: 'hidden' });
    
    // Verify photo appears in grid
    await page.waitForSelector('#photosGrid .photo-card');
    
    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
    
    // Verify photo count updates (should be at least 1, could be more from previous tests)
    const photoCount = await page.textContent('#photosBadge');
    expect(parseInt(photoCount)).toBeGreaterThanOrEqual(1);
  });

  test('should upload multiple photos successfully', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Handle alert dialogs for success messages
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Photo uploaded successfully!');
      await dialog.accept();
    });

    // Upload first photo
    await page.click('button:has-text("Upload Photo")');
    await page.waitForSelector('#photoUploadModal', { state: 'visible' });
    
    const fileInput1 = page.locator('#photoFile');
    await fileInput1.setInputFiles('tests/fixtures/test-photo-1.jpg');
    
    await page.fill('#photoDescription', 'Test Photo 1');
    await page.fill('#photoCaption', 'First Upload Test');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('#photoUploadModal', { state: 'hidden' });
    
    // Verify first photo appears
    await page.waitForSelector('#photosGrid .photo-card');
    let photoCount = await page.textContent('#photosBadge');
    expect(parseInt(photoCount)).toBeGreaterThanOrEqual(1);
    
    // Upload second photo
    await page.click('button:has-text("Upload Photo")');
    await page.waitForSelector('#photoUploadModal', { state: 'visible' });
    
    const fileInput2 = page.locator('#photoFile');
    await fileInput2.setInputFiles('tests/fixtures/test-photo-2.jpg');
    
    await page.fill('#photoDescription', 'Test Photo 2');
    await page.fill('#photoCaption', 'Second Upload Test');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('#photoUploadModal', { state: 'hidden' });
    
    // Verify both photos appear
    const photoCards = await page.locator('#photosGrid .photo-card').count();
    expect(photoCards).toBeGreaterThanOrEqual(2);
    
    photoCount = await page.textContent('#photosBadge');
    expect(parseInt(photoCount)).toBeGreaterThanOrEqual(2);
    
    // Verify no Bootstrap errors
    const bootstrapErrors = consoleErrors.filter(error => 
      error.includes('Illegal invocation') || 
      error.includes('selector-engine') ||
      error.includes('Bootstrap')
    );
    expect(bootstrapErrors).toHaveLength(0);
    
    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    // Handle alert dialog for error message
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Error: Please select a photo to upload');
      await dialog.accept();
    });

    // Test with no file selected
    await page.click('button:has-text("Upload Photo")');
    await page.waitForSelector('#photoUploadModal', { state: 'visible' });
    
    await page.fill('#photoDescription', 'Test without file');
    await page.click('button[type="submit"]');
    
    // Modal should still be open after error
    await page.waitForSelector('#photoUploadModal', { state: 'visible' });
  });

  test('should display photos correctly after upload', async ({ page }) => {
    // Handle alert dialog for success message
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Photo uploaded successfully!');
      await dialog.accept();
    });

    // Upload a photo
    await page.click('button:has-text("Upload Photo")');
    await page.waitForSelector('#photoUploadModal', { state: 'visible' });
    
    const fileInput = page.locator('#photoFile');
    await fileInput.setInputFiles('tests/fixtures/test-photo-1.jpg');
    
    await page.fill('#photoDescription', 'Test Photo Display');
    await page.fill('#photoCaption', 'Display Test');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('#photoUploadModal', { state: 'hidden' });
    
    // Verify photo card elements
    const photoCard = page.locator('#photosGrid .photo-card').first();
    await expect(photoCard).toBeVisible();
    
    // Verify photo image
    const photoImage = photoCard.locator('img');
    await expect(photoImage).toBeVisible();
    
    // Verify caption
    const caption = photoCard.locator('.card-title');
    await expect(caption).toHaveText('Display Test');
    
    // Verify description
    const description = photoCard.locator('.card-text');
    await expect(description).toHaveText('Test Photo Display');
    
    // Verify action buttons
    const viewBtn = photoCard.locator('button:has-text("View")');
    const editBtn = photoCard.locator('button:has-text("Edit")');
    const deleteBtn = photoCard.locator('button:has-text("Delete")');
    
    await expect(viewBtn).toBeVisible();
    await expect(editBtn).toBeVisible();
    await expect(deleteBtn).toBeVisible();
  });

  test('should handle photo viewing without accessibility errors', async ({ page }) => {
    // Handle alert dialog for success message
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Photo uploaded successfully!');
      await dialog.accept();
    });

    // Upload a photo first
    await page.click('button:has-text("Upload Photo")');
    await page.waitForSelector('#photoUploadModal', { state: 'visible' });
    
    const fileInput = page.locator('#photoFile');
    await fileInput.setInputFiles('tests/fixtures/test-photo-1.jpg');
    
    await page.fill('#photoDescription', 'Photo to View');
    await page.fill('#photoCaption', 'View Test');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('#photoUploadModal', { state: 'hidden' });
    
    // Wait for photo to appear
    await page.waitForSelector('#photosGrid .photo-card');
    
    // Click view button
    await page.click('button:has-text("View")');
    
    // Wait for photo viewer modal
    await page.waitForSelector('#photoViewerModal', { state: 'visible' });
    
    // Check for accessibility errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('aria-hidden')) {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a moment for any errors to appear
    await page.waitForTimeout(1000);
    
    // Should have no accessibility errors
    expect(consoleErrors).toHaveLength(0);
    
    // Close modal
    await page.click('button:has-text("Close")');
    await page.waitForSelector('#photoViewerModal', { state: 'hidden' });
  });

  test('should handle photo deletion', async ({ page }) => {
    // Handle alert dialogs for upload success and deletion success
    page.on('dialog', async dialog => {
      if (dialog.message() === 'Photo uploaded successfully!') {
        await dialog.accept();
      } else if (dialog.message() === 'Photo deleted successfully!') {
        await dialog.accept();
      } else {
        // Handle any other dialogs (like confirmation dialogs)
        await dialog.accept();
      }
    });

    // Upload a photo first
    await page.click('button:has-text("Upload Photo")');
    await page.waitForSelector('#photoUploadModal', { state: 'visible' });
    
    const fileInput = page.locator('#photoFile');
    await fileInput.setInputFiles('tests/fixtures/test-photo-1.jpg');
    
    await page.fill('#photoDescription', 'Photo to Delete');
    await page.fill('#photoCaption', 'Delete Test');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('#photoUploadModal', { state: 'hidden' });
    
    // Verify photo appears
    await page.waitForSelector('#photosGrid .photo-card');
    let photoCount = await page.textContent('#photosBadge');
    const initialCount = parseInt(photoCount);
    expect(initialCount).toBeGreaterThanOrEqual(1);
    
    // Delete photo
    await page.click('button:has-text("Delete")');
    
    // Wait for photo to be removed (count should decrease)
    await page.waitForTimeout(1000);
    
    // Verify photo count updates
    photoCount = await page.textContent('#photosBadge');
    const finalCount = parseInt(photoCount);
    expect(finalCount).toBeLessThan(initialCount);
  });

  test('should not have Bootstrap errors during multiple uploads', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Handle alert dialogs for success messages
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Photo uploaded successfully!');
      await dialog.accept();
    });

    // Upload 3 photos in sequence
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("Upload Photo")');
      await page.waitForSelector('#photoUploadModal', { state: 'visible' });
      
      const fileInput = page.locator('#photoFile');
      await fileInput.setInputFiles(`tests/fixtures/test-photo-${i}.jpg`);
      
      await page.fill('#photoDescription', `Test Photo ${i}`);
      await page.fill('#photoCaption', `Upload Test ${i}`);
      
      await page.click('button[type="submit"]');
      await page.waitForSelector('#photoUploadModal', { state: 'hidden' });
      
      // Wait for photo to appear
      await page.waitForTimeout(500);
    }
    
    // Verify all photos appear
    const photoCards = await page.locator('#photosGrid .photo-card').count();
    expect(photoCards).toBeGreaterThanOrEqual(3);
    
    // Verify no Bootstrap errors
    const bootstrapErrors = consoleErrors.filter(error => 
      error.includes('Illegal invocation') || 
      error.includes('selector-engine') ||
      error.includes('Bootstrap')
    );
    expect(bootstrapErrors).toHaveLength(0);
    
    // Verify photo count
    const photoCount = await page.textContent('#photosBadge');
    expect(parseInt(photoCount)).toBeGreaterThanOrEqual(3);
  });

  test('should handle search functionality', async ({ page }) => {
    // Handle alert dialog for success message
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Photo uploaded successfully!');
      await dialog.accept();
    });

    // Upload a photo first
    await page.click('button:has-text("Upload Photo")');
    await page.waitForSelector('#photoUploadModal', { state: 'visible' });
    
    const fileInput = page.locator('#photoFile');
    await fileInput.setInputFiles('tests/fixtures/test-photo-1.jpg');
    
    await page.fill('#photoDescription', 'Searchable photo');
    await page.fill('#photoCaption', 'Search Test');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('#photoUploadModal', { state: 'hidden' });
    
    // Wait for photo to appear
    await page.waitForSelector('#photosGrid .photo-card');
    
    // Test search
    const searchInput = page.locator('#photoSearchInput');
    await searchInput.fill('Search');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Verify photo is still visible
    const photoCards = await page.locator('#photosGrid .photo-card').count();
    expect(photoCards).toBeGreaterThanOrEqual(1);
  });

  test('should handle sort functionality', async ({ page }) => {
    // Handle alert dialogs for success messages
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Photo uploaded successfully!');
      await dialog.accept();
    });

    // Upload multiple photos
    for (let i = 1; i <= 2; i++) {
      await page.click('button:has-text("Upload Photo")');
      await page.waitForSelector('#photoUploadModal', { state: 'visible' });
      
      const fileInput = page.locator('#photoFile');
      await fileInput.setInputFiles(`tests/fixtures/test-photo-${i}.jpg`);
      
      await page.fill('#photoDescription', `Photo ${i}`);
      await page.fill('#photoCaption', `Caption ${i}`);
      
      await page.click('button[type="submit"]');
      await page.waitForSelector('#photoUploadModal', { state: 'hidden' });
      
      await page.waitForTimeout(500);
    }
    
    // Test sort
    const sortSelect = page.locator('#photoSortSelect');
    await sortSelect.selectOption('oldest');
    
    // Wait for sort to apply
    await page.waitForTimeout(500);
    
    // Verify photos are still visible
    const photoCards = await page.locator('#photosGrid .photo-card').count();
    expect(photoCards).toBeGreaterThanOrEqual(2);
  });

  test('should handle clear filters functionality', async ({ page }) => {
    // Handle alert dialog for success message
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Photo uploaded successfully!');
      await dialog.accept();
    });

    // Upload a photo first
    await page.click('button:has-text("Upload Photo")');
    await page.waitForSelector('#photoUploadModal', { state: 'visible' });
    
    const fileInput = page.locator('#photoFile');
    await fileInput.setInputFiles('tests/fixtures/test-photo-1.jpg');
    
    await page.fill('#photoDescription', 'Filter test photo');
    await page.fill('#photoCaption', 'Filter Test');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('#photoUploadModal', { state: 'hidden' });
    
    // Wait for photo to appear
    await page.waitForSelector('#photosGrid .photo-card');
    
    // Apply some filters
    const searchInput = page.locator('#photoSearchInput');
    await searchInput.fill('test');
    
    const sortSelect = page.locator('#photoSortSelect');
    await sortSelect.selectOption('oldest');
    
    // Clear filters
    await page.click('button:has-text("Clear Filters")');
    
    // Wait for filters to clear
    await page.waitForTimeout(500);
    
    // Verify photo is still visible
    const photoCards = await page.locator('#photosGrid .photo-card').count();
    expect(photoCards).toBeGreaterThanOrEqual(1);
  });
});
