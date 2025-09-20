const { test, expect } = require('@playwright/test');

test.describe('Profile Page', () => {
  let page;
  let authToken;

  test.beforeAll(async ({ browser }) => {
    // Create a new browser context
    const context = await browser.newContext();
    page = await context.newPage();

    // Login to get authentication token
    await page.goto('/auth/login');
    
    // Fill login form
    await page.fill('input[name="username"]', 'bob');
    await page.fill('input[name="password"]', 'newpassword123'); // Updated password from our test
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for redirect and get token
    await page.waitForURL('/');
    
    // Get the auth token from localStorage
    authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    
    // Set the token in cookie for Vercel authentication
    await page.context().addCookies([{
      name: 'authToken',
      value: authToken,
      domain: 'thanksgiving-djr9yxm63-maguirebobs-projects.vercel.app',
      path: '/',
      httpOnly: false, // Allow JavaScript access for testing
      secure: true,
      sameSite: 'None'
    }]);
    
    // Also set in localStorage for API calls
    await page.addInitScript((token) => {
      localStorage.setItem('authToken', token);
    }, authToken);
  });

  test('should load profile page successfully', async () => {
    await page.goto('/auth/profile');
    
    // Check if profile page loads
    await expect(page).toHaveTitle(/User Profile/);
    
    // Check for main profile elements
    await expect(page.locator('.profile-title')).toBeVisible();
    await expect(page.locator('.profile-title')).toContainText('User Profile');
    
    // Check for profile information card
    await expect(page.locator('.profile-card')).toBeVisible();
    await expect(page.locator('.card-title')).toContainText('Profile Information');
  });

  test('should display user information correctly', async () => {
    await page.goto('/auth/profile');
    
    // Check username display
    await expect(page.locator('#profile-username')).toBeVisible();
    
    // Check email display
    await expect(page.locator('#profile-email')).toBeVisible();
    
    // Check role display
    await expect(page.locator('#profile-role')).toBeVisible();
    
    // Check member since date
    await expect(page.locator('#profile-created-at')).toBeVisible();
  });

  test('should open edit profile modal', async () => {
    await page.goto('/auth/profile');
    
    // Click edit profile button
    await page.click('#editProfileBtn');
    
    // Check if modal opens
    await expect(page.locator('#editProfileModal')).toBeVisible();
    await expect(page.locator('#editProfileModalLabel')).toContainText('Edit Profile');
    
    // Check if form fields are present
    await expect(page.locator('#editFirstName')).toBeVisible();
    await expect(page.locator('#editLastName')).toBeVisible();
    await expect(page.locator('#editEmail')).toBeVisible();
    await expect(page.locator('#editCurrentPassword')).toBeVisible();
  });

  test('should open change password modal', async () => {
    await page.goto('/auth/profile');
    
    // Click change password button
    await page.click('#changePasswordBtn');
    
    // Check if modal opens
    await expect(page.locator('#changePasswordModal')).toBeVisible();
    await expect(page.locator('#changePasswordModalLabel')).toContainText('Change Password');
    
    // Check if form fields are present
    await expect(page.locator('#currentPassword')).toBeVisible();
    await expect(page.locator('#newPassword')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
  });

  test('should validate edit profile form', async () => {
    await page.goto('/auth/profile');
    
    // Open edit profile modal
    await page.click('#editProfileBtn');
    
    // Try to submit without current password
    await page.fill('#editFirstName', 'Test');
    await page.fill('#editEmail', 'test@example.com');
    await page.click('#saveProfileBtn');
    
    // Check for validation error
    await expect(page.locator('.invalid-feedback')).toBeVisible();
    await expect(page.locator('.invalid-feedback')).toContainText('Current password is required');
  });

  test('should validate change password form', async () => {
    await page.goto('/auth/profile');
    
    // Open change password modal
    await page.click('#changePasswordBtn');
    
    // Try to submit with mismatched passwords
    await page.fill('#currentPassword', 'wrongpassword');
    await page.fill('#newPassword', 'newpassword123');
    await page.fill('#confirmPassword', 'differentpassword');
    await page.click('#savePasswordBtn');
    
    // Check for validation error
    await expect(page.locator('.invalid-feedback')).toBeVisible();
    await expect(page.locator('.invalid-feedback')).toContainText('Passwords do not match');
  });

  test('should show password strength indicator', async () => {
    await page.goto('/auth/profile');
    
    // Open change password modal
    await page.click('#changePasswordBtn');
    
    // Type in new password field
    await page.fill('#newPassword', 'weak');
    
    // Check if password strength indicator appears
    await expect(page.locator('#passwordStrength')).toBeVisible();
    
    // Type a stronger password
    await page.fill('#newPassword', 'StrongPassword123!');
    
    // Check if strength indicator updates
    await expect(page.locator('#strengthText')).toBeVisible();
  });

  test('should close modals when cancel is clicked', async () => {
    await page.goto('/auth/profile');
    
    // Test edit profile modal
    await page.click('#editProfileBtn');
    await expect(page.locator('#editProfileModal')).toBeVisible();
    await page.click('button[data-bs-dismiss="modal"]');
    await expect(page.locator('#editProfileModal')).not.toBeVisible();
    
    // Test change password modal
    await page.click('#changePasswordBtn');
    await expect(page.locator('#changePasswordModal')).toBeVisible();
    await page.click('button[data-bs-dismiss="modal"]');
    await expect(page.locator('#changePasswordModal')).not.toBeVisible();
  });

  test('should be responsive on mobile', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/profile');
    
    // Check if profile page is still accessible
    await expect(page.locator('.profile-title')).toBeVisible();
    
    // Check if sidebar is properly stacked
    await expect(page.locator('.profile-sidebar')).toBeVisible();
    
    // Check if buttons are still clickable
    await page.click('#editProfileBtn');
    await expect(page.locator('#editProfileModal')).toBeVisible();
  });

  test('should show admin features for admin users', async () => {
    await page.goto('/auth/profile');
    
    // Check if admin actions are visible (assuming user is admin)
    const adminSection = page.locator('.sidebar-card').filter({ hasText: 'Admin Actions' });
    
    if (await adminSection.isVisible()) {
      // Check admin panel link
      await expect(page.locator('a[href="/admin"]')).toBeVisible();
      
      // Check view all users button
      await expect(page.locator('#viewAllUsersBtn')).toBeVisible();
    }
  });

  test('should handle API errors gracefully', async () => {
    // Mock API to return error
    await page.route('**/api/v1/profile', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' })
      });
    });

    await page.goto('/auth/profile');
    
    // Check if error is handled (this would depend on your error handling implementation)
    // The page should still load but might show an error message
    await expect(page.locator('.profile-title')).toBeVisible();
  });

  test('should logout successfully', async () => {
    await page.goto('/auth/profile');
    
    // Click logout button
    await page.click('#logoutBtn');
    
    // Should redirect to login page
    await page.waitForURL('/auth/login');
    await expect(page).toHaveTitle(/Login/);
  });
});

test.describe('Profile Page - Admin Features', () => {
  let page;
  let authToken;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="username"]', 'bob');
    await page.fill('input[name="password"]', 'newpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    await page.addInitScript((token) => {
      localStorage.setItem('authToken', token);
    }, authToken);
  });

  test('should open view all users modal', async () => {
    await page.goto('/auth/profile');
    
    // Click view all users button
    await page.click('#viewAllUsersBtn');
    
    // Check if modal opens
    await expect(page.locator('#viewAllUsersModal')).toBeVisible();
    await expect(page.locator('#viewAllUsersModalLabel')).toContainText('All Users');
    
    // Check if users table is present
    await expect(page.locator('#usersTable')).toBeVisible();
  });

  test('should display users in table', async () => {
    await page.goto('/auth/profile');
    
    // Open users modal
    await page.click('#viewAllUsersBtn');
    
    // Wait for users to load
    await page.waitForSelector('#usersTableBody tr:not(:has(.spinner-border))');
    
    // Check if users are displayed
    const userRows = page.locator('#usersTableBody tr');
    await expect(userRows).toHaveCountGreaterThan(0);
    
    // Check if table headers are present
    await expect(page.locator('th:has-text("Username")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
  });

  test('should open edit user role modal', async () => {
    await page.goto('/auth/profile');
    
    // Open users modal
    await page.click('#viewAllUsersBtn');
    await page.waitForSelector('#usersTableBody tr:not(:has(.spinner-border))');
    
    // Click edit role button for first user
    const editButtons = page.locator('button:has-text("Edit Role")');
    if (await editButtons.count() > 0) {
      await editButtons.first().click();
      
      // Check if edit role modal opens
      await expect(page.locator('#editUserRoleModal')).toBeVisible();
      await expect(page.locator('#editUserRoleModalLabel')).toContainText('Edit User Role');
    }
  });
});
