/**
 * Utility helper functions
 */

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format date for API response
 * @param {Date|string} date - Date to format
 * @returns {string} ISO date string
 */
const formatDateForAPI = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Extract year from date
 * @param {Date|string} date - Date to extract year from
 * @returns {number} Year
 */
const extractYear = (date) => {
  if (!date) return null;
  return new Date(date).getFullYear();
};

/**
 * Validate and sanitize query parameters
 * @param {Object} query - Query object from request
 * @returns {Object} Sanitized query object
 */
const sanitizeQuery = (query) => {
  const sanitized = {};
  
  if (query.sort && ['asc', 'desc'].includes(query.sort.toLowerCase())) {
    sanitized.sort = query.sort.toLowerCase();
  }
  
  if (query.limit) {
    const limit = parseInt(query.limit);
    if (limit > 0 && limit <= 100) {
      sanitized.limit = limit;
    }
  }
  
  return sanitized;
};

/**
 * Create standardized API response
 * @param {boolean} success - Whether the operation was successful
 * @param {*} data - Response data
 * @param {string} message - Response message
 * @param {Object} meta - Additional metadata
 * @returns {Object} Standardized response object
 */
const createAPIResponse = (success, data = null, message = null, meta = {}) => {
  const response = { success };
  
  if (data !== null) response.data = data;
  if (message) response.message = message;
  if (Object.keys(meta).length > 0) response.meta = meta;
  
  return response;
};

/**
 * Create error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} details - Additional error details
 * @returns {Object} Error response object
 */
const createErrorResponse = (message, statusCode = 500, details = null) => {
  const error = {
    success: false,
    error: message,
    statusCode
  };
  
  if (details) error.details = details;
  
  return error;
};

/**
 * Check if request is for API endpoint
 * @param {string} path - Request path
 * @returns {boolean} True if API request
 */
const isAPIRequest = (path) => {
  return path.startsWith('/api/');
};

module.exports = {
  formatDate,
  formatDateForAPI,
  extractYear,
  sanitizeQuery,
  createAPIResponse,
  createErrorResponse,
  isAPIRequest
};
