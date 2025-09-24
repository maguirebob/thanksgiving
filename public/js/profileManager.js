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
            editBtn.addEventListener('click', () => this.toggleEditMode());
        }

        // Set up logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
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
}

// Make ProfileManager available globally
window.ProfileManager = ProfileManager;
