/**
 * ProfileManager - Handles all profile-related functionality
 */
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.allUsers = [];
        this.isSubmitting = false;
        this.init();
    }

    /**
     * Initialize the profile manager
     */
    init() {
        this.setupEventListeners();
        this.loadCurrentUser();
    }

    /**
     * Set up event listeners for all profile functionality
     */
    setupEventListeners() {
        // Edit Profile buttons
        document.getElementById('editProfileBtn')?.addEventListener('click', () => this.openEditProfileModal());
        document.getElementById('editProfileBtnSidebar')?.addEventListener('click', () => this.openEditProfileModal());
        
        // Change Password buttons
        document.getElementById('changePasswordBtn')?.addEventListener('click', () => this.openChangePasswordModal());
        document.getElementById('changePasswordBtnSidebar')?.addEventListener('click', () => this.openChangePasswordModal());
        
        // Admin buttons
        document.getElementById('viewAllUsersBtn')?.addEventListener('click', () => this.openViewAllUsersModal());
        
        // Form submissions
        document.getElementById('editProfileForm')?.addEventListener('submit', (e) => this.handleEditProfile(e));
        document.getElementById('changePasswordForm')?.addEventListener('submit', (e) => this.handleChangePassword(e));
        document.getElementById('editUserRoleForm')?.addEventListener('submit', (e) => this.handleEditUserRole(e));
        
        // Password strength indicator
        document.getElementById('newPassword')?.addEventListener('input', (e) => this.updatePasswordStrength(e.target.value));
        document.getElementById('confirmPassword')?.addEventListener('input', (e) => this.validatePasswordMatch());
        
        // Modal events
        this.setupModalEvents();
    }

    /**
     * Set up modal-specific event listeners
     */
    setupModalEvents() {
        // Clear forms when modals are hidden and clean up backdrops
        document.getElementById('editProfileModal')?.addEventListener('hidden.bs.modal', () => {
            document.getElementById('editProfileForm').reset();
            this.clearFormErrors('editProfileForm');
            this.cleanupModalBackdrop();
        });
        
        document.getElementById('changePasswordModal')?.addEventListener('hidden.bs.modal', () => {
            document.getElementById('changePasswordForm').reset();
            this.clearFormErrors('changePasswordForm');
            this.hidePasswordStrength();
            this.cleanupModalBackdrop();
        });
        
        document.getElementById('editUserRoleModal')?.addEventListener('hidden.bs.modal', () => {
            document.getElementById('editUserRoleForm').reset();
            this.clearFormErrors('editUserRoleForm');
            this.cleanupModalBackdrop();
        });
        
        // Clean up modal backdrop for viewAllUsersModal
        document.getElementById('viewAllUsersModal')?.addEventListener('hidden.bs.modal', () => {
            this.cleanupModalBackdrop();
        });
    }

    /**
     * Load current user data
     */
    async loadCurrentUser() {
        try {
            const response = await this.makeAuthenticatedRequest('/api/v1/profile', 'GET');
            if (response.success) {
                this.currentUser = response.user;
                this.updateProfileDisplay();
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.showError('Failed to load profile information');
        }
    }

    /**
     * Update the profile display with current user data
     */
    updateProfileDisplay() {
        if (!this.currentUser) return;

        // Update profile information
        document.getElementById('profile-username').textContent = this.currentUser.username;
        document.getElementById('profile-email').textContent = this.currentUser.email;
        document.getElementById('profile-first-name').textContent = this.currentUser.first_name || 'Not set';
        document.getElementById('profile-last-name').textContent = this.currentUser.last_name || 'Not set';
        document.getElementById('profile-role').innerHTML = `
            <i class="fas fa-${this.currentUser.role === 'admin' ? 'crown' : 'user'} me-1"></i>
            ${this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1)}
        `;
        document.getElementById('profile-created-at').textContent = new Date(this.currentUser.created_at).toLocaleDateString();
        document.getElementById('profile-updated-at').textContent = new Date(this.currentUser.updated_at).toLocaleDateString();
        
        // Update stats
        const daysSinceJoin = Math.floor((new Date() - new Date(this.currentUser.created_at)) / (1000 * 60 * 60 * 24));
        document.getElementById('profile-days-since-join').textContent = daysSinceJoin;
        document.getElementById('profile-role-level').textContent = this.currentUser.role === 'admin' ? '5' : '1';
    }

    /**
     * Open edit profile modal
     */
    openEditProfileModal() {
        if (!this.currentUser) return;

        // Populate form with current data
        document.getElementById('editFirstName').value = this.currentUser.first_name || '';
        document.getElementById('editLastName').value = this.currentUser.last_name || '';
        document.getElementById('editEmail').value = this.currentUser.email;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        modal.show();
    }

    /**
     * Handle edit profile form submission
     */
    async handleEditProfile(event) {
        event.preventDefault();
        console.log('handleEditProfile called');
        
        // Prevent duplicate submissions
        if (this.isSubmitting) {
            console.log('Form already being submitted, ignoring duplicate');
            return;
        }
        
        this.isSubmitting = true;
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        console.log('Form data:', data);

        // Validate form
        if (!this.validateEditProfileForm(data)) {
            console.log('Form validation failed');
            this.isSubmitting = false;
            return;
        }

        try {
            console.log('Setting button loading to true');
            this.setButtonLoading('saveProfileBtn', true);
            
            console.log('Making API request');
            const response = await this.makeAuthenticatedRequest('/api/v1/profile', 'PUT', data);
            console.log('API response:', response);
            
            if (response.success) {
                console.log('Profile update successful');
                this.currentUser = response.user;
                this.updateProfileDisplay();
                console.log('Showing success message');
                this.showSuccess('Profile updated successfully!');
                
                // Close modal
                console.log('Closing modal');
                const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
                if (modal) {
                    modal.hide();
                    console.log('Modal hidden');
                    
                    // Force remove modal backdrop if it exists
                    setTimeout(() => {
                        this.cleanupModalBackdrop();
                    }, 100);
                } else {
                    console.log('Modal instance not found, trying to create new one');
                    const newModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
                    newModal.hide();
                }
            } else {
                console.log('Profile update failed:', response.error);
                this.showError(response.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showError('Failed to update profile. Please try again.');
        } finally {
            console.log('Setting button loading to false');
            this.setButtonLoading('saveProfileBtn', false);
            this.isSubmitting = false;
        }
    }

    /**
     * Validate edit profile form
     */
    validateEditProfileForm(data) {
        this.clearFormErrors('editProfileForm');
        let isValid = true;

        if (!data.current_password) {
            this.showFieldError('editCurrentPassword', 'Current password is required');
            isValid = false;
        }

        if (data.email && !this.isValidEmail(data.email)) {
            this.showFieldError('editEmail', 'Please enter a valid email address');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Open change password modal
     */
    openChangePasswordModal() {
        const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
        modal.show();
    }

    /**
     * Handle change password form submission
     */
    async handleChangePassword(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Validate form
        if (!this.validateChangePasswordForm(data)) {
            return;
        }

        try {
            this.setButtonLoading('savePasswordBtn', true);
            
            const response = await this.makeAuthenticatedRequest('/api/v1/profile/password', 'PUT', data);
            
            if (response.success) {
                this.showSuccess('Password changed successfully!');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                modal.hide();
            } else {
                this.showError(response.error || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.showError('Failed to change password. Please try again.');
        } finally {
            this.setButtonLoading('savePasswordBtn', false);
        }
    }

    /**
     * Validate change password form
     */
    validateChangePasswordForm(data) {
        this.clearFormErrors('changePasswordForm');
        let isValid = true;

        if (!data.current_password) {
            this.showFieldError('currentPassword', 'Current password is required');
            isValid = false;
        }

        if (!data.new_password) {
            this.showFieldError('newPassword', 'New password is required');
            isValid = false;
        } else if (data.new_password.length < 8) {
            this.showFieldError('newPassword', 'Password must be at least 8 characters long');
            isValid = false;
        }

        if (!data.confirm_password) {
            this.showFieldError('confirmPassword', 'Please confirm your new password');
            isValid = false;
        } else if (data.new_password !== data.confirm_password) {
            this.showFieldError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Open view all users modal (admin only)
     */
    async openViewAllUsersModal() {
        try {
            this.setButtonLoading('viewAllUsersBtn', true);
            
            const response = await this.makeAuthenticatedRequest('/api/v1/admin/users', 'GET');
            
            if (response.success) {
                this.allUsers = response.users;
                this.populateUsersTable();
                
                const modal = new bootstrap.Modal(document.getElementById('viewAllUsersModal'));
                modal.show();
            } else {
                this.showError(response.error || 'Failed to load users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users. Please try again.');
        } finally {
            this.setButtonLoading('viewAllUsersBtn', false);
        }
    }

    /**
     * Populate the users table
     */
    populateUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        this.allUsers.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.first_name || ''} ${user.last_name || ''}</td>
                <td>
                    <span class="role-badge">
                        <i class="fas fa-${user.role === 'admin' ? 'crown' : 'user'} me-1"></i>
                        ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                </td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-outline-primary btn-sm" onclick="profileManager.openEditUserRoleModal(${user.id})">
                        <i class="fas fa-edit me-1"></i>
                        Edit Role
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Open edit user role modal
     */
    openEditUserRoleModal(userId) {
        const user = this.allUsers.find(u => u.id === userId);
        if (!user) return;

        // Populate user info
        document.getElementById('editUserInfo').innerHTML = `
            <div class="user-name">${user.username}</div>
            <div class="user-details">${user.email} • ID: ${user.id}</div>
        `;

        // Set current role
        document.getElementById('editUserRole').value = user.role;

        // Store user ID for form submission
        document.getElementById('editUserRoleForm').dataset.userId = userId;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editUserRoleModal'));
        modal.show();
    }

    /**
     * Handle edit user role form submission
     */
    async handleEditUserRole(event) {
        event.preventDefault();
        
        const form = event.target;
        const userId = form.dataset.userId;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (!userId) {
            this.showError('Invalid user selected');
            return;
        }

        try {
            this.setButtonLoading('saveUserRoleBtn', true);
            
            const response = await this.makeAuthenticatedRequest(`/api/v1/admin/users/${userId}/role`, 'PUT', data);
            
            if (response.success) {
                // Update user in local array
                const userIndex = this.allUsers.findIndex(u => u.id === parseInt(userId));
                if (userIndex !== -1) {
                    this.allUsers[userIndex] = response.user;
                    this.populateUsersTable();
                }
                
                this.showSuccess('User role updated successfully!');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editUserRoleModal'));
                modal.hide();
            } else {
                this.showError(response.error || 'Failed to update user role');
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            this.showError('Failed to update user role. Please try again.');
        } finally {
            this.setButtonLoading('saveUserRoleBtn', false);
        }
    }

    /**
     * Update password strength indicator
     */
    updatePasswordStrength(password) {
        const strengthIndicator = document.getElementById('passwordStrength');
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');

        if (!password) {
            this.hidePasswordStrength();
            return;
        }

        strengthIndicator.style.display = 'block';

        let strength = 0;
        let strengthLabel = '';

        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;

        // Character variety checks
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        // Determine strength level
        if (strength <= 2) {
            strengthFill.className = 'strength-fill weak';
            strengthText.className = 'strength-text weak';
            strengthLabel = 'Weak';
        } else if (strength <= 4) {
            strengthFill.className = 'strength-fill fair';
            strengthText.className = 'strength-text fair';
            strengthLabel = 'Fair';
        } else if (strength <= 5) {
            strengthFill.className = 'strength-fill good';
            strengthText.className = 'strength-text good';
            strengthLabel = 'Good';
        } else {
            strengthFill.className = 'strength-fill strong';
            strengthText.className = 'strength-text strong';
            strengthLabel = 'Strong';
        }

        strengthText.textContent = strengthLabel;
    }

    /**
     * Hide password strength indicator
     */
    hidePasswordStrength() {
        const strengthIndicator = document.getElementById('passwordStrength');
        strengthIndicator.style.display = 'none';
    }

    /**
     * Validate password match
     */
    validatePasswordMatch() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (confirmPassword && newPassword !== confirmPassword) {
            this.showFieldError('confirmPassword', 'Passwords do not match');
        } else {
            this.clearFieldError('confirmPassword');
        }
    }

    /**
     * Make authenticated API request
     */
    async makeAuthenticatedRequest(url, method = 'GET', data = null) {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('No authentication token found');
        }

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        return await response.json();
    }

    /**
     * Show field error
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        field.classList.add('is-invalid');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    /**
     * Clear field error
     */
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        field.classList.remove('is-invalid');
        
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    /**
     * Clear all form errors
     */
    clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const invalidFields = form.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid');
        });

        const errorMessages = form.querySelectorAll('.invalid-feedback');
        errorMessages.forEach(message => {
            message.remove();
        });
    }

    /**
     * Set button loading state
     */
    setButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (loading) {
            // Store original content if not already stored
            if (!button.dataset.originalContent) {
                button.dataset.originalContent = button.innerHTML;
            }
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Loading...';
        } else {
            button.disabled = false;
            // Restore original button content
            const originalContent = button.dataset.originalContent;
            if (originalContent) {
                button.innerHTML = originalContent;
            }
        }
    }

    /**
     * Clean up modal backdrop elements
     */
    cleanupModalBackdrop() {
        console.log('Cleaning up modal backdrop');
        const backdrops = document.querySelectorAll('.modal-backdrop');
        console.log('Found backdrops:', backdrops.length);
        backdrops.forEach(backdrop => {
            console.log('Removing backdrop');
            backdrop.remove();
        });
        
        // Remove modal-open class from body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        console.log('Cleaned up modal classes');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        console.log('showSuccess called with message:', message);
        const toast = document.getElementById('successToast');
        const toastBody = document.getElementById('successToastBody');
        
        if (!toast) {
            console.error('Success toast element not found');
            return;
        }
        
        if (!toastBody) {
            console.error('Success toast body element not found');
            return;
        }
        
        toastBody.textContent = message;
        console.log('Toast body updated with message');
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        console.log('Toast shown');
    }

    /**
     * Show error message
     */
    showError(message) {
        const toast = document.getElementById('errorToast');
        const toastBody = document.getElementById('errorToastBody');
        
        toastBody.textContent = message;
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Make ProfileManager available globally
window.ProfileManager = ProfileManager;
