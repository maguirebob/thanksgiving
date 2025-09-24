/**
 * Application constants
 */
module.exports = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },

  // Error Messages
  ERROR_MESSAGES: {
    DATABASE_CONNECTION_FAILED: 'Database connection failed',
    TABLE_NOT_FOUND: 'Database table not found',
    MENU_NOT_FOUND: 'Menu not found',
    INVALID_INPUT: 'Invalid input provided',
    VALIDATION_FAILED: 'Validation failed',
    INTERNAL_ERROR: 'Internal server error'
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    MENU_RETRIEVED: 'Menu retrieved successfully',
    MENUS_RETRIEVED: 'Menus retrieved successfully',
    STATS_RETRIEVED: 'Statistics retrieved successfully'
  },

  // Query Defaults
  QUERY_DEFAULTS: {
    SORT: 'desc',
    LIMIT: null,
    PAGE: 1
  },

  // Validation Rules
  VALIDATION: {
    MIN_YEAR: 1900,
    MAX_YEAR: 2100,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1
  }
};
