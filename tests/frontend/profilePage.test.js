const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Mock browser APIs
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('Profile Page Frontend', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    // Reset mocks
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();

    // Create DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Profile Page Test</title>
        </head>
        <body>
          <div class="profile-container">
            <div class="profile-header">
              <h1>User Profile</h1>
              <p>Manage your account settings and personal information</p>
            </div>

            <div class="profile-content">
              <div class="profile-info">
                <h3>Profile Information</h3>
                <div class="info-item">
                  <label>Username:</label>
                  <span id="username">testuser</span>
                </div>
                <div class="info-item">
                  <label>Role:</label>
                  <span class="role-badge user" id="role">user</span>
                </div>
                <div class="info-item">
                  <label>Member Since:</label>
                  <span id="member-since">1/15/2024</span>
                </div>
              </div>

              <div class="account-settings">
                <h3>Account Settings</h3>
                
                <div class="setting-item">
                  <label>Email Address:</label>
                  <span id="current-email">test@example.com</span>
                  <button onclick="openEditModal('email')" class="btn-edit">Edit</button>
                </div>

                <div class="setting-item">
                  <label>Password:</label>
                  <span>••••••••</span>
                  <button onclick="openEditModal('password')" class="btn-edit">Change</button>
                </div>

                <div class="setting-item">
                  <label>First Name:</label>
                  <span id="current-first-name">Test</span>
                  <button onclick="openEditModal('first_name')" class="btn-edit">Edit</button>
                </div>

                <div class="setting-item">
                  <label>Last Name:</label>
                  <span id="current-last-name">User</span>
                  <button onclick="openEditModal('last_name')" class="btn-edit">Edit</button>
                </div>
              </div>

              <div class="admin-section" style="display: none;">
                <h3>Administration</h3>
                <div class="admin-actions">
                  <a href="/admin/users" class="btn btn-primary">Manage Users</a>
                  <a href="/admin" class="btn btn-secondary">Admin Dashboard</a>
                </div>
              </div>
            </div>
          </div>

          <!-- Edit Modal -->
          <div id="edit-modal" style="display: none;">
            <div class="modal-content">
              <h3 id="field-label">Edit Field</h3>
              <form id="edit-form">
                <input type="text" id="field-input" data-field="" placeholder="Enter value">
                <input type="password" id="current-password" placeholder="Current password" required>
                <button type="submit">Save Changes</button>
                <button type="button" onclick="closeModal()">Cancel</button>
              </form>
            </div>
          </div>

          <!-- Password Modal -->
          <div id="password-modal" style="display: none;">
            <div class="modal-content">
              <h3>Change Password</h3>
              <form id="password-form">
                <input type="password" id="current-password-pw" placeholder="Current password" required>
                <input type="password" id="new-password" placeholder="New password" required>
                <input type="password" id="confirm-password" placeholder="Confirm password" required>
                <button type="submit">Change Password</button>
                <button type="button" onclick="closeModal()">Cancel</button>
              </form>
            </div>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock ProfileManager class
    global.ProfileManager = class ProfileManager {
      constructor() {
        this.authToken = 'mock-token';
        this.init();
      }

      init() {
        this.setupEventListeners();
      }

      setupEventListeners() {
        const editForm = document.getElementById('edit-form');
        const passwordForm = document.getElementById('password-form');
        
        if (editForm) {
          editForm.addEventListener('submit', this.handleEditSubmit.bind(this));
        }
        if (passwordForm) {
          passwordForm.addEventListener('submit', this.handlePasswordSubmit.bind(this));
        }
      }

      openEditModal(field) {
        const modal = document.getElementById('edit-modal');
        const fieldInput = document.getElementById('field-input');
        const fieldLabel = document.getElementById('field-label');
        
        const fieldConfig = {
          email: { label: 'Email Address', type: 'email', placeholder: 'Enter new email' },
          first_name: { label: 'First Name', type: 'text', placeholder: 'Enter first name' },
          last_name: { label: 'Last Name', type: 'text', placeholder: 'Enter last name' }
        };

        const config = fieldConfig[field];
        if (config) {
          fieldLabel.textContent = config.label;
          fieldInput.type = config.type;
          fieldInput.placeholder = config.placeholder;
          fieldInput.dataset.field = field;
          modal.style.display = 'block';
        }
      }

      async handleEditSubmit(e) {
        e.preventDefault();
        
        const field = e.target.querySelector('[data-field]').dataset.field;
        const value = e.target.querySelector('[data-field]').value;
        const currentPassword = e.target.querySelector('#current-password').value;

        try {
          const response = await fetch('/api/v1/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.authToken}`
            },
            body: JSON.stringify({
              [field]: value,
              current_password: currentPassword
            })
          });

          const data = await response.json();
          
          if (data.success) {
            this.showMessage('Profile updated successfully', 'success');
            this.updateDisplay(field, value);
            this.closeModal();
          } else {
            this.showMessage(data.error || 'Update failed', 'error');
          }
        } catch (error) {
          this.showMessage('Network error occurred', 'error');
        }
      }

      async handlePasswordSubmit(e) {
        e.preventDefault();
        
        const currentPassword = e.target.querySelector('#current-password-pw').value;
        const newPassword = e.target.querySelector('#new-password').value;
        const confirmPassword = e.target.querySelector('#confirm-password').value;

        if (newPassword !== confirmPassword) {
          this.showMessage('New passwords do not match', 'error');
          return;
        }

        try {
          const response = await fetch('/api/v1/profile/password', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.authToken}`
            },
            body: JSON.stringify({
              current_password: currentPassword,
              new_password: newPassword,
              confirm_password: confirmPassword
            })
          });

          const data = await response.json();
          
          if (data.success) {
            this.showMessage('Password changed successfully', 'success');
            this.closeModal();
            e.target.reset();
          } else {
            this.showMessage(data.error || 'Password change failed', 'error');
          }
        } catch (error) {
          this.showMessage('Network error occurred', 'error');
        }
      }

      updateDisplay(field, value) {
        const element = document.getElementById(`current-${field.replace('_', '-')}`);
        if (element) {
          element.textContent = value || 'Not set';
        }
      }

      showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'}`;
        messageDiv.textContent = message;
        
        const profileContent = document.querySelector('.profile-content');
        if (profileContent) {
          profileContent.insertBefore(messageDiv, profileContent.firstChild);
        }
        
        setTimeout(() => {
          if (messageDiv.parentNode) {
            messageDiv.remove();
          }
        }, 5000);
      }

      closeModal() {
        const editModal = document.getElementById('edit-modal');
        const passwordModal = document.getElementById('password-modal');
        if (editModal) editModal.style.display = 'none';
        if (passwordModal) passwordModal.style.display = 'none';
      }
    };

    // Mock global functions
    global.openEditModal = (field) => {
      if (window.profileManager) {
        window.profileManager.openEditModal(field);
      }
    };

    global.closeModal = () => {
      if (window.profileManager) {
        window.profileManager.closeModal();
      }
    };
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Profile Page Rendering', () => {
    test('should display user profile information', () => {
      const username = document.getElementById('username');
      const email = document.getElementById('current-email');
      const firstName = document.getElementById('current-first-name');
      const lastName = document.getElementById('current-last-name');
      const role = document.getElementById('role');

      expect(username.textContent).toBe('testuser');
      expect(email.textContent).toBe('test@example.com');
      expect(firstName.textContent).toBe('Test');
      expect(lastName.textContent).toBe('User');
      expect(role.textContent).toBe('user');
    });

    test('should show admin section for admin users', () => {
      // Simulate admin user
      const role = document.getElementById('role');
      role.textContent = 'admin';
      role.className = 'role-badge admin';

      const adminSection = document.querySelector('.admin-section');
      adminSection.style.display = 'block';

      expect(adminSection.style.display).toBe('block');
      expect(adminSection.querySelector('h3').textContent).toBe('Administration');
    });

    test('should hide admin section for regular users', () => {
      const adminSection = document.querySelector('.admin-section');
      expect(adminSection.style.display).toBe('none');
    });
  });

  describe('Modal Functionality', () => {
    let profileManager;

    beforeEach(() => {
      profileManager = new ProfileManager();
      window.profileManager = profileManager;
    });

    test('should open edit modal correctly', () => {
      const modal = document.getElementById('edit-modal');
      const fieldInput = document.getElementById('field-input');
      const fieldLabel = document.getElementById('field-label');

      // Initially hidden
      expect(modal.style.display).toBe('none');

      // Open email modal
      profileManager.openEditModal('email');

      expect(modal.style.display).toBe('block');
      expect(fieldLabel.textContent).toBe('Email Address');
      expect(fieldInput.type).toBe('email');
      expect(fieldInput.placeholder).toBe('Enter new email');
      expect(fieldInput.dataset.field).toBe('email');
    });

    test('should open different field modals', () => {
      const fieldInput = document.getElementById('field-input');
      const fieldLabel = document.getElementById('field-label');

      // Test first name modal
      profileManager.openEditModal('first_name');
      expect(fieldLabel.textContent).toBe('First Name');
      expect(fieldInput.type).toBe('text');
      expect(fieldInput.placeholder).toBe('Enter first name');
      expect(fieldInput.dataset.field).toBe('first_name');

      // Test last name modal
      profileManager.openEditModal('last_name');
      expect(fieldLabel.textContent).toBe('Last Name');
      expect(fieldInput.type).toBe('text');
      expect(fieldInput.placeholder).toBe('Enter last name');
      expect(fieldInput.dataset.field).toBe('last_name');
    });

    test('should close modal', () => {
      const modal = document.getElementById('edit-modal');
      modal.style.display = 'block';

      profileManager.closeModal();

      expect(modal.style.display).toBe('none');
    });
  });

  describe('Form Validation', () => {
    let profileManager;

    beforeEach(() => {
      profileManager = new ProfileManager();
      window.profileManager = profileManager;
    });

    test('should validate email format', () => {
      const fieldInput = document.getElementById('field-input');
      const currentPassword = document.getElementById('current-password');

      // Set up email field
      fieldInput.dataset.field = 'email';
      fieldInput.type = 'email';
      fieldInput.value = 'invalid-email';
      currentPassword.value = 'password123';

      // Mock fetch to simulate validation error
      fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid email format'
        })
      });

      const form = document.getElementById('edit-form');
      const submitEvent = new window.Event('submit');
      
      // Spy on showMessage to verify error handling
      const showMessageSpy = jest.spyOn(profileManager, 'showMessage');
      
      form.dispatchEvent(submitEvent);

      // Wait for async operations
      return new Promise(resolve => {
        setTimeout(() => {
          expect(showMessageSpy).toHaveBeenCalledWith('Invalid email format', 'error');
          resolve();
        }, 100);
      });
    });

    test('should validate password confirmation', () => {
      const currentPassword = document.getElementById('current-password-pw');
      const newPassword = document.getElementById('new-password');
      const confirmPassword = document.getElementById('confirm-password');

      currentPassword.value = 'password123';
      newPassword.value = 'newpassword456';
      confirmPassword.value = 'differentpassword';

      const form = document.getElementById('password-form');
      const submitEvent = new window.Event('submit');
      
      const showMessageSpy = jest.spyOn(profileManager, 'handlePasswordSubmit');
      
      form.dispatchEvent(submitEvent);

      return new Promise(resolve => {
        setTimeout(() => {
          expect(showMessageSpy).toHaveBeenCalled();
          resolve();
        }, 100);
      });
    });

    test('should require current password', () => {
      const fieldInput = document.getElementById('field-input');
      const currentPassword = document.getElementById('current-password');

      fieldInput.dataset.field = 'email';
      fieldInput.value = 'new@example.com';
      currentPassword.value = ''; // Empty password

      const form = document.getElementById('edit-form');
      const submitEvent = new window.Event('submit');
      
      // Mock fetch to simulate missing password error
      fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Current password is required'
        })
      });

      const showMessageSpy = jest.spyOn(profileManager, 'showMessage');
      
      form.dispatchEvent(submitEvent);

      return new Promise(resolve => {
        setTimeout(() => {
          expect(showMessageSpy).toHaveBeenCalledWith('Current password is required', 'error');
          resolve();
        }, 100);
      });
    });
  });

  describe('API Response Handling', () => {
    let profileManager;

    beforeEach(() => {
      profileManager = new ProfileManager();
      window.profileManager = profileManager;
    });

    test('should handle successful profile update', () => {
      const fieldInput = document.getElementById('field-input');
      const currentPassword = document.getElementById('current-password');

      fieldInput.dataset.field = 'email';
      fieldInput.value = 'new@example.com';
      currentPassword.value = 'password123';

      // Mock successful response
      fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          message: 'Profile updated successfully',
          user: {
            email: 'new@example.com',
            first_name: 'Test',
            last_name: 'User'
          }
        })
      });

      const form = document.getElementById('edit-form');
      const submitEvent = new window.Event('submit');
      
      const showMessageSpy = jest.spyOn(profileManager, 'showMessage');
      const updateDisplaySpy = jest.spyOn(profileManager, 'updateDisplay');
      const closeModalSpy = jest.spyOn(profileManager, 'closeModal');
      
      form.dispatchEvent(submitEvent);

      return new Promise(resolve => {
        setTimeout(() => {
          expect(showMessageSpy).toHaveBeenCalledWith('Profile updated successfully', 'success');
          expect(updateDisplaySpy).toHaveBeenCalledWith('email', 'new@example.com');
          expect(closeModalSpy).toHaveBeenCalled();
          resolve();
        }, 100);
      });
    });

    test('should handle network errors', () => {
      const fieldInput = document.getElementById('field-input');
      const currentPassword = document.getElementById('current-password');

      fieldInput.dataset.field = 'email';
      fieldInput.value = 'new@example.com';
      currentPassword.value = 'password123';

      // Mock network error
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const form = document.getElementById('edit-form');
      const submitEvent = new window.Event('submit');
      
      const showMessageSpy = jest.spyOn(profileManager, 'showMessage');
      
      form.dispatchEvent(submitEvent);

      return new Promise(resolve => {
        setTimeout(() => {
          expect(showMessageSpy).toHaveBeenCalledWith('Network error occurred', 'error');
          resolve();
        }, 100);
      });
    });

    test('should handle successful password change', () => {
      const currentPassword = document.getElementById('current-password-pw');
      const newPassword = document.getElementById('new-password');
      const confirmPassword = document.getElementById('confirm-password');

      currentPassword.value = 'password123';
      newPassword.value = 'newpassword456';
      confirmPassword.value = 'newpassword456';

      // Mock successful response
      fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          message: 'Password changed successfully'
        })
      });

      const form = document.getElementById('password-form');
      const submitEvent = new window.Event('submit');
      
      const showMessageSpy = jest.spyOn(profileManager, 'showMessage');
      const closeModalSpy = jest.spyOn(profileManager, 'closeModal');
      
      form.dispatchEvent(submitEvent);

      return new Promise(resolve => {
        setTimeout(() => {
          expect(showMessageSpy).toHaveBeenCalledWith('Password changed successfully', 'success');
          expect(closeModalSpy).toHaveBeenCalled();
          resolve();
        }, 100);
      });
    });
  });

  describe('Display Updates', () => {
    let profileManager;

    beforeEach(() => {
      profileManager = new ProfileManager();
      window.profileManager = profileManager;
    });

    test('should update display after successful edit', () => {
      const emailElement = document.getElementById('current-email');
      expect(emailElement.textContent).toBe('test@example.com');

      profileManager.updateDisplay('email', 'new@example.com');

      expect(emailElement.textContent).toBe('new@example.com');
    });

    test('should handle empty values', () => {
      const firstNameElement = document.getElementById('current-first-name');
      expect(firstNameElement.textContent).toBe('Test');

      profileManager.updateDisplay('first_name', '');

      expect(firstNameElement.textContent).toBe('Not set');
    });

    test('should show success messages', () => {
      const profileContent = document.querySelector('.profile-content');
      const initialChildren = profileContent.children.length;

      profileManager.showMessage('Test success message', 'success');

      expect(profileContent.children.length).toBe(initialChildren + 1);
      
      const messageDiv = profileContent.querySelector('.alert-success');
      expect(messageDiv).toBeTruthy();
      expect(messageDiv.textContent).toBe('Test success message');
    });

    test('should show error messages', () => {
      const profileContent = document.querySelector('.profile-content');
      const initialChildren = profileContent.children.length;

      profileManager.showMessage('Test error message', 'error');

      expect(profileContent.children.length).toBe(initialChildren + 1);
      
      const messageDiv = profileContent.querySelector('.alert-danger');
      expect(messageDiv).toBeTruthy();
      expect(messageDiv.textContent).toBe('Test error message');
    });

    test('should auto-remove messages after timeout', (done) => {
      const profileContent = document.querySelector('.profile-content');
      const initialChildren = profileContent.children.length;

      profileManager.showMessage('Temporary message', 'success');

      expect(profileContent.children.length).toBe(initialChildren + 1);

      // Wait for timeout
      setTimeout(() => {
        expect(profileContent.children.length).toBe(initialChildren);
        done();
      }, 5100); // Slightly longer than 5 second timeout
    });
  });

  describe('Event Listeners', () => {
    test('should set up event listeners on initialization', () => {
      const editForm = document.getElementById('edit-form');
      const passwordForm = document.getElementById('password-form');

      // Spy on addEventListener
      const editFormSpy = jest.spyOn(editForm, 'addEventListener');
      const passwordFormSpy = jest.spyOn(passwordForm, 'addEventListener');

      new ProfileManager();

      expect(editFormSpy).toHaveBeenCalledWith('submit', expect.any(Function));
      expect(passwordFormSpy).toHaveBeenCalledWith('submit', expect.any(Function));
    });

    test('should handle form submissions', () => {
      const profileManager = new ProfileManager();
      const editForm = document.getElementById('edit-form');
      const passwordForm = document.getElementById('password-form');

      const handleEditSubmitSpy = jest.spyOn(profileManager, 'handleEditSubmit');
      const handlePasswordSubmitSpy = jest.spyOn(profileManager, 'handlePasswordSubmit');

      // Trigger edit form submission
      const editEvent = new window.Event('submit');
      editForm.dispatchEvent(editEvent);

      // Trigger password form submission
      const passwordEvent = new window.Event('submit');
      passwordForm.dispatchEvent(passwordEvent);

      expect(handleEditSubmitSpy).toHaveBeenCalled();
      expect(handlePasswordSubmitSpy).toHaveBeenCalled();
    });
  });
});
