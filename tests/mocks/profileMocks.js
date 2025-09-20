/**
 * Mock data for profile management tests
 */

const mockProfileData = {
  validUser: {
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:00:00Z')
  },

  validAdmin: {
    username: 'admin',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    created_at: new Date('2024-01-01T10:00:00Z'),
    updated_at: new Date('2024-01-01T10:00:00Z')
  },

  invalidData: {
    invalidEmail: 'invalid-email',
    weakPassword: '123',
    emptyFields: {},
    tooLongEmail: 'a'.repeat(300) + '@example.com',
    specialCharactersUsername: 'user@#$%',
    emptyPassword: '',
    mismatchedPasswords: {
      new_password: 'password123',
      confirm_password: 'different123'
    }
  },

  validUpdateData: {
    email: 'updated@example.com',
    first_name: 'Updated',
    last_name: 'Name',
    current_password: 'password123'
  },

  validPasswordChange: {
    current_password: 'password123',
    new_password: 'newpassword456',
    confirm_password: 'newpassword456'
  },

  roleChangeData: {
    promoteToAdmin: { role: 'admin' },
    demoteToUser: { role: 'user' },
    invalidRole: { role: 'invalid-role' }
  }
};

const mockApiResponses = {
  success: {
    profileUpdate: {
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: 1,
        username: 'testuser',
        email: 'updated@example.com',
        first_name: 'Updated',
        last_name: 'Name',
        role: 'user',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T11:00:00Z'
      }
    },

    passwordChange: {
      success: true,
      message: 'Password changed successfully'
    },

    roleChange: {
      success: true,
      message: 'User role updated successfully',
      user: {
        id: 2,
        username: 'user',
        email: 'user@example.com',
        role: 'admin'
      }
    },

    getUserList: {
      success: true,
      users: [
        {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z'
        },
        {
          id: 2,
          username: 'user',
          email: 'user@example.com',
          first_name: 'Regular',
          last_name: 'User',
          role: 'user',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ]
    }
  },

  errors: {
    validationError: {
      success: false,
      error: 'Invalid email format'
    },

    authenticationError: {
      success: false,
      error: 'Invalid current password'
    },

    authorizationError: {
      success: false,
      error: 'Admin access required'
    },

    notFoundError: {
      success: false,
      message: 'User not found'
    },

    serverError: {
      success: false,
      error: 'Internal server error'
    },

    networkError: new Error('Network error'),

    timeoutError: new Error('Request timeout'),

    passwordMismatch: {
      success: false,
      error: 'Password confirmation does not match'
    },

    weakPassword: {
      success: false,
      error: 'Password must be at least 8 characters long'
    },

    missingPassword: {
      success: false,
      error: 'Current password is required'
    },

    selfRoleChange: {
      success: false,
      message: 'You cannot change your own role'
    },

    invalidRole: {
      success: false,
      error: 'Invalid role. Must be "admin" or "user"'
    }
  }
};

const mockJwtTokens = {
  validUser: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzA1MzI0MDAwLCJleHAiOjE3MDU0MTA0MDB9.mockSignature',
  
  validAdmin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDUzMjQwMDAsImV4cCI6MTcwNTQxMDQwMH0.mockSignature',
  
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzA1MzI0MDAwLCJleHAiOjE3MDUzMjQwMDB9.mockSignature',
  
  invalid: 'invalid.token.here'
};

const mockDatabaseStates = {
  empty: {
    users: []
  },

  withUsers: {
    users: [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        password_hash: '$2a$10$mockHash1',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        created_at: new Date('2024-01-01T10:00:00Z'),
        updated_at: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: 2,
        username: 'user',
        email: 'user@example.com',
        password_hash: '$2a$10$mockHash2',
        first_name: 'Regular',
        last_name: 'User',
        role: 'user',
        created_at: new Date('2024-01-15T10:00:00Z'),
        updated_at: new Date('2024-01-15T10:00:00Z')
      }
    ]
  },

  withMixedCaseUsernames: {
    users: [
      {
        id: 1,
        username: 'Admin',
        email: 'admin@example.com',
        password_hash: '$2a$10$mockHash1',
        role: 'admin',
        created_at: new Date('2024-01-01T10:00:00Z'),
        updated_at: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: 2,
        username: 'User',
        email: 'user@example.com',
        password_hash: '$2a$10$mockHash2',
        role: 'user',
        created_at: new Date('2024-01-15T10:00:00Z'),
        updated_at: new Date('2024-01-15T10:00:00Z')
      }
    ]
  }
};

const mockFrontendElements = {
  profilePage: `
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
        </div>
        <div class="account-settings">
          <h3>Account Settings</h3>
          <div class="setting-item">
            <label>Email Address:</label>
            <span id="current-email">test@example.com</span>
            <button onclick="openEditModal('email')" class="btn-edit">Edit</button>
          </div>
        </div>
      </div>
    </div>
  `,

  editModal: `
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
  `,

  passwordModal: `
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
  `
};

const mockValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255,
    required: true
  },

  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false
  },

  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/,
    caseInsensitive: true
  },

  name: {
    maxLength: 255,
    pattern: /^[a-zA-Z\s'-]+$/,
    required: false
  }
};

const mockErrorMessages = {
  validation: {
    email: {
      invalid: 'Invalid email format',
      required: 'Email is required',
      tooLong: 'Email is too long'
    },
    password: {
      tooShort: 'Password must be at least 8 characters long',
      tooLong: 'Password is too long',
      required: 'Password is required'
    },
    username: {
      invalid: 'Username contains invalid characters',
      tooShort: 'Username must be at least 3 characters long',
      tooLong: 'Username is too long',
      required: 'Username is required'
    },
    name: {
      invalid: 'Name contains invalid characters',
      tooLong: 'Name is too long'
    }
  },

  authentication: {
    invalidPassword: 'Invalid current password',
    tokenRequired: 'Access token required',
    tokenInvalid: 'Invalid token',
    tokenExpired: 'Token has expired'
  },

  authorization: {
    adminRequired: 'Admin access required',
    selfRoleChange: 'You cannot change your own role'
  },

  general: {
    notFound: 'User not found',
    serverError: 'Internal server error',
    networkError: 'Network error occurred',
    validationFailed: 'Validation failed'
  }
};

module.exports = {
  mockProfileData,
  mockApiResponses,
  mockJwtTokens,
  mockDatabaseStates,
  mockFrontendElements,
  mockValidationRules,
  mockErrorMessages
};
