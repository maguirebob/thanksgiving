/**
 * ProfileManager - Simple profile management functionality
 */
class ProfileManager {
    constructor() {
        this.isEditing = false;
        this.originalData = {};
    }

    init() {
        console.log('ProfileManager initialized');
        
        // Set up edit profile button
        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) {
            console.log('Found edit profile button');
            editBtn.addEventListener('click', () => this.toggleEditMode());
        } else {
            console.log('Edit profile button not found');
        }

        // Set up edit profile button (sidebar)
        const editBtnSidebar = document.getElementById('editProfileBtnSidebar');
        if (editBtnSidebar) {
            console.log('Found edit profile button (sidebar)');
            editBtnSidebar.addEventListener('click', () => this.toggleEditMode());
        } else {
            console.log('Edit profile button (sidebar) not found');
        }

        // Set up change password buttons
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            console.log('Found change password button');
            changePasswordBtn.addEventListener('click', () => this.showChangePasswordModal());
        } else {
            console.log('Change password button not found');
        }

        const changePasswordBtnSidebar = document.getElementById('changePasswordBtnSidebar');
        if (changePasswordBtnSidebar) {
            console.log('Found change password button (sidebar)');
            changePasswordBtnSidebar.addEventListener('click', () => this.showChangePasswordModal());
        } else {
            console.log('Change password button (sidebar) not found');
        }

        // Set up change password form
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            console.log('Found change password form');
            changePasswordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        } else {
            console.log('Change password form not found');
        }

        // Set up logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            console.log('Found logout button');
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        } else {
            console.log('Logout button not found');
        }

        // Set up save/cancel buttons if they exist
        const saveBtn = document.getElementById('saveProfileBtn');
        const cancelBtn = document.getElementById('cancelProfileBtn');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveProfile());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelEdit());
        }
    }

    toggleEditMode() {
        if (this.isEditing) {
            this.cancelEdit();
        } else {
            this.startEdit();
        }
    }

    startEdit() {
        this.isEditing = true;
        
        // Store original data
        this.originalData = {
            username: document.getElementById('profile-username')?.textContent || '',
            email: document.getElementById('profile-email')?.textContent || '',
            firstName: document.getElementById('profile-first-name')?.textContent || '',
            lastName: document.getElementById('profile-last-name')?.textContent || ''
        };

        // Convert spans to input fields
        this.convertToInputs();
        
        // Update button
        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-times me-1"></i>Cancel';
            editBtn.className = 'btn btn-outline-danger btn-sm';
        }

        // Show save button
        this.showSaveButton();
    }

    cancelEdit() {
        this.isEditing = false;
        
        // Convert inputs back to spans
        this.convertToSpans();
        
        // Update button
        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-edit me-1"></i>Edit Profile';
            editBtn.className = 'btn btn-outline-primary btn-sm';
        }

        // Hide save button
        this.hideSaveButton();
    }

    convertToInputs() {
        const fields = ['profile-username', 'profile-email', 'profile-first-name', 'profile-last-name'];
        
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                const value = element.textContent.trim();
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-control form-control-sm';
                input.value = value;
                input.id = fieldId + '-input';
                
                element.parentNode.replaceChild(input, element);
            }
        });
    }

    convertToSpans() {
        const fields = ['profile-username', 'profile-email', 'profile-first-name', 'profile-last-name'];
        
        fields.forEach(fieldId => {
            const input = document.getElementById(fieldId + '-input');
            if (input) {
                const span = document.createElement('span');
                span.id = fieldId;
                span.textContent = input.value || this.originalData[fieldId.replace('profile-', '').replace('-', '')];
                
                input.parentNode.replaceChild(span, input);
            }
        });
    }

    showSaveButton() {
        let saveBtn = document.getElementById('saveProfileBtn');
        if (!saveBtn) {
            saveBtn = document.createElement('button');
            saveBtn.id = 'saveProfileBtn';
            saveBtn.className = 'btn btn-success btn-sm me-2';
            saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Save Changes';
            
            const editBtn = document.getElementById('editProfileBtn');
            if (editBtn && editBtn.parentNode) {
                editBtn.parentNode.insertBefore(saveBtn, editBtn);
            }
        }
        saveBtn.style.display = 'inline-block';
    }

    hideSaveButton() {
        const saveBtn = document.getElementById('saveProfileBtn');
        if (saveBtn) {
            saveBtn.style.display = 'none';
        }
    }

    async saveProfile() {
        try {
            // Get form data
            const formData = {
                username: document.getElementById('profile-username-input')?.value || '',
                email: document.getElementById('profile-email-input')?.value || '',
                first_name: document.getElementById('profile-first-name-input')?.value || '',
                last_name: document.getElementById('profile-last-name-input')?.value || ''
            };

            // For now, just show a success message
            // In a real implementation, you'd send this to the server
            alert('Profile updated successfully! (This is a demo - changes are not saved)');
            
            this.cancelEdit();
            
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Error saving profile. Please try again.');
        }
    }

    async handleLogout(e) {
        e.preventDefault();
        
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Clear any stored tokens
                localStorage.removeItem('authToken');
                
                // Redirect to login page
                window.location.href = '/auth/login';
            } else {
                console.error('Logout failed:', data.message);
                // Still redirect to login page even if logout fails
                window.location.href = '/auth/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect to login page even if logout fails
            window.location.href = '/auth/login';
        }
    }

    // Password change functionality
    showChangePasswordModal() {
        console.log('showChangePasswordModal called');
        const modalElement = document.getElementById('changePasswordModal');
        console.log('Modal element:', modalElement);
        
        if (!modalElement) {
            console.error('Change password modal not found!');
            return;
        }
        
        const modal = new bootstrap.Modal(modalElement);
        console.log('Bootstrap modal instance:', modal);
        modal.show();
        
        // Clear form when modal opens
        const form = document.getElementById('changePasswordForm');
        if (form) {
            form.reset();
            console.log('Form reset');
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const currentPassword = formData.get('current_password');
        const newPassword = formData.get('new_password');
        const confirmPassword = formData.get('confirm_password');

        // Client-side validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showToast('All fields are required', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showToast('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.showToast('Password must be at least 8 characters long', 'error');
            return;
        }

        try {
            // Disable submit button to prevent double submission
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Changing...';

            const response = await fetch('/auth/profile/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Password changed successfully!', 'success');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                if (modal) {
                    modal.hide();
                }
                
                // Clear form
                form.reset();
            } else {
                this.showToast(data.error || 'Failed to change password', 'error');
            }

        } catch (error) {
            console.error('Password change error:', error);
            this.showToast('Network error occurred. Please try again.', 'error');
        } finally {
            // Re-enable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-key me-1"></i>Change Password';
        }
    }

    // Toast notification system
    showToast(message, type) {
        const toastId = type === 'success' ? 'successToast' : 'errorToast';
        const toastBodyId = type === 'success' ? 'successToastBody' : 'errorToastBody';
        
        const toastElement = document.getElementById(toastId);
        const toastBody = document.getElementById(toastBodyId);
        
        if (toastElement && toastBody) {
            toastBody.textContent = message;
            const toast = new bootstrap.Toast(toastElement);
            toast.show();
        } else {
            // Fallback to alert if toast system not available
            alert(type === 'success' ? `Success: ${message}` : `Error: ${message}`);
        }
    }
}

// Make ProfileManager available globally
window.ProfileManager = ProfileManager;
