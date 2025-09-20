const { User } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Create a test user for profile tests
 * @param {Object} userData - User data to override defaults
 * @returns {Promise<Object>} Created user and auth token
 */
const createTestUser = async (userData = {}) => {
  const defaultUserData = {
    username: 'testuser',
    email: 'test@example.com',
    password_hash: await bcrypt.hash('password123', 10),
    first_name: 'Test',
    last_name: 'User',
    role: 'user'
  };

  const user = await User.create({ ...defaultUserData, ...userData });

  const authToken = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'thanksgiving-menu-jwt-secret-key-change-in-production',
    { expiresIn: '24h' }
  );

  return { user, authToken };
};

/**
 * Create a test admin user for admin tests
 * @param {Object} userData - User data to override defaults
 * @returns {Promise<Object>} Created admin user and auth token
 */
const createTestAdmin = async (userData = {}) => {
  const defaultAdminData = {
    username: 'admin',
    email: 'admin@example.com',
    password_hash: await bcrypt.hash('admin123', 10),
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin'
  };

  const user = await User.create({ ...defaultAdminData, ...userData });

  const authToken = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'thanksgiving-menu-jwt-secret-key-change-in-production',
    { expiresIn: '24h' }
  );

  return { user, authToken };
};

/**
 * Create multiple test users for testing
 * @param {number} count - Number of users to create
 * @returns {Promise<Array>} Array of created users
 */
const createMultipleTestUsers = async (count = 3) => {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const userData = {
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      password_hash: await bcrypt.hash('password123', 10),
      first_name: `User${i + 1}`,
      last_name: 'Test',
      role: 'user'
    };

    const user = await User.create(userData);
    users.push(user);
  }

  return users;
};

/**
 * Clean up test data after tests
 * @returns {Promise<void>}
 */
const cleanupTestData = async () => {
  await User.destroy({ where: {}, force: true });
};

/**
 * Generate test profile update data
 * @param {string} type - Type of update data to generate
 * @returns {Object} Test data object
 */
const generateTestProfileData = (type = 'valid') => {
  const testData = {
    valid: {
      email: 'updated@example.com',
      first_name: 'Updated',
      last_name: 'Name',
      current_password: 'password123'
    },
    invalidEmail: {
      email: 'invalid-email',
      current_password: 'password123'
    },
    invalidPassword: {
      email: 'valid@example.com',
      current_password: 'wrongpassword'
    },
    missingPassword: {
      email: 'valid@example.com'
    },
    partialUpdate: {
      first_name: 'OnlyFirst',
      current_password: 'password123'
    },
    passwordChange: {
      current_password: 'password123',
      new_password: 'newpassword456',
      confirm_password: 'newpassword456'
    },
    passwordMismatch: {
      current_password: 'password123',
      new_password: 'newpassword456',
      confirm_password: 'differentpassword'
    },
    weakPassword: {
      current_password: 'password123',
      new_password: '123',
      confirm_password: '123'
    }
  };

  return testData[type] || testData.valid;
};

/**
 * Generate test admin role change data
 * @param {string} role - Role to change to
 * @returns {Object} Role change data
 */
const generateRoleChangeData = (role = 'admin') => {
  return { role };
};

/**
 * Mock API responses for testing
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} responseData - Response data to return
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Mock response object
 */
const mockApiResponse = (endpoint, method, responseData, statusCode = 200) => {
  return {
    url: endpoint,
    method: method.toUpperCase(),
    status: statusCode,
    data: responseData,
    headers: {
      'Content-Type': 'application/json'
    }
  };
};

/**
 * Generate test user statistics
 * @param {Object} user - User object
 * @returns {Object} User statistics
 */
const generateUserStats = (user) => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
    member_since: user.created_at.toLocaleDateString(),
    days_since_joined: Math.floor((new Date() - user.created_at) / (1000 * 60 * 60 * 24))
  };
};

/**
 * Validate user profile data structure
 * @param {Object} user - User object to validate
 * @returns {Object} Validation result
 */
const validateUserProfile = (user) => {
  const requiredFields = ['id', 'username', 'email', 'role', 'created_at', 'updated_at'];
  const optionalFields = ['first_name', 'last_name'];
  
  const missingFields = requiredFields.filter(field => !(field in user));
  const hasOptionalFields = optionalFields.some(field => field in user);
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    hasOptionalFields,
    hasPasswordHash: 'password_hash' in user,
    shouldNotHavePassword: !('password_hash' in user) // For API responses
  };
};

/**
 * Generate test error scenarios
 * @returns {Object} Error test scenarios
 */
const generateErrorScenarios = () => {
  return {
    networkError: new Error('Network error'),
    timeoutError: new Error('Request timeout'),
    validationError: {
      success: false,
      error: 'Validation failed',
      details: ['Email format is invalid', 'Password is too weak']
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
      error: 'User not found'
    },
    serverError: {
      success: false,
      error: 'Internal server error'
    }
  };
};

/**
 * Create test database state for integration tests
 * @returns {Promise<Object>} Test database state
 */
const createTestDatabaseState = async () => {
  // Create admin user
  const { user: admin, authToken: adminToken } = await createTestAdmin();
  
  // Create regular users
  const { user: user1, authToken: user1Token } = await createTestUser({
    username: 'user1',
    email: 'user1@example.com'
  });
  
  const { user: user2, authToken: user2Token } = await createTestUser({
    username: 'user2',
    email: 'user2@example.com'
  });

  return {
    admin: { user: admin, token: adminToken },
    users: [
      { user: user1, token: user1Token },
      { user: user2, token: user2Token }
    ],
    allUsers: [admin, user1, user2]
  };
};

module.exports = {
  createTestUser,
  createTestAdmin,
  createMultipleTestUsers,
  cleanupTestData,
  generateTestProfileData,
  generateRoleChangeData,
  mockApiResponse,
  generateUserStats,
  validateUserProfile,
  generateErrorScenarios,
  createTestDatabaseState
};
