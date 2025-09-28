const { test, expect } = require('@playwright/test');

test.describe('Photo Component Debug', () => {
  test('should debug PhotoComponent initialization', async ({ page }) => {
    // Navigate to detail page
    await page.goto('http://localhost:3000/menu/466');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if PhotoComponent container exists
    const containerExists = await page.locator('#photoComponentContainer').count();
    console.log('Container exists:', containerExists > 0);
    
    // Check if PhotoComponent is defined
    const photoComponentDefined = await page.evaluate(() => typeof PhotoComponent);
    console.log('PhotoComponent defined:', photoComponentDefined);
    
    // Check if photoComponent instance exists
    const photoComponentInstance = await page.evaluate(() => typeof window.photoComponent);
    console.log('photoComponent instance:', photoComponentInstance);
    
    // Check container content
    const containerContent = await page.locator('#photoComponentContainer').innerHTML();
    console.log('Container content:', containerContent);
    
    // Check if upload button exists
    const uploadButtonExists = await page.locator('button:has-text("Upload Photo")').count();
    console.log('Upload button exists:', uploadButtonExists > 0);
    
    // Check console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000);
    
    console.log('Console logs:', consoleLogs);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-photo-component.png' });
  });
});
