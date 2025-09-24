/**
 * ErrorHandler - Centralized error handling and user feedback
 */
class ErrorHandler {
  // Error Types
  static ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    AUTHENTICATION: 'AUTH_ERROR',
    PERMISSION: 'PERMISSION_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
  };

  /**
   * Handle error with context
   */
  static handleError(error, context) {
    console.error(`${this.getContextName(context)} error:`, error);
    
    // Log error for debugging
    this.logError(error, context);
    
    // Show user-friendly error message
    this.showUserError(error, context);
  }

  /**
   * Log error for debugging
   */
  static logError(error, context) {
    console.error(`[${context}] Error:`, error.message, error.stack);
  }

  /**
   * Show user-friendly error message
   */
  static showUserError(error, context) {
    const message = this.getErrorMessage(error);
    const contextName = this.getContextName(context);
    
    alert(`Error ${contextName}: ${message}`);
  }

  /**
   * Get error message from error object
   */
  static getErrorMessage(error) {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && error.message) {
      return error.message;
    }
    
    return 'Unknown error occurred';
  }

  /**
   * Get user-friendly context name
   */
  static getContextName(context) {
    const contextNames = {
      'load_photos': 'loading photos',
      'upload_photo': 'uploading photo',
      'update_photo': 'updating photo',
      'delete_photo': 'deleting photo',
      'capture_photo': 'capturing photo',
      'file_validation': 'validating file',
      'api_request': 'making API request',
      'camera_access': 'accessing camera',
      'file_processing': 'processing file'
    };
    
    return contextNames[context] || context.replace(/_/g, ' ');
  }

  /**
   * Show success message
   */
  static showSuccess(message) {
    alert(message);
  }

  /**
   * Show warning message
   */
  static showWarning(message) {
    alert(`Warning: ${message}`);
  }

  /**
   * Show info message
   */
  static showInfo(message) {
    alert(`Info: ${message}`);
  }

  /**
   * Handle network errors specifically
   */
  static handleNetworkError(error, context) {
    console.error('Network error:', error);
    this.showUserError(new Error('Network connection failed. Please check your internet connection.'), context);
  }

  /**
   * Handle validation errors specifically
   */
  static handleValidationError(error, context) {
    console.error('Validation error:', error);
    this.showUserError(error, context);
  }

  /**
   * Handle authentication errors specifically
   */
  static handleAuthError(error, context) {
    console.error('Authentication error:', error);
    this.showUserError(new Error('Authentication failed. Please log in again.'), context);
  }

  /**
   * Handle permission errors specifically
   */
  static handlePermissionError(error, context) {
    console.error('Permission error:', error);
    this.showUserError(new Error('You do not have permission to perform this action.'), context);
  }

  /**
   * Check if error is network related
   */
  static isNetworkError(error) {
    return error.message && (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('timeout')
    );
  }

  /**
   * Check if error is validation related
   */
  static isValidationError(error) {
    return error.message && (
      error.message.includes('invalid') ||
      error.message.includes('validation') ||
      error.message.includes('file type') ||
      error.message.includes('file size')
    );
  }

  /**
   * Check if error is authentication related
   */
  static isAuthError(error) {
    return error.message && (
      error.message.includes('unauthorized') ||
      error.message.includes('authentication') ||
      error.message.includes('token') ||
      error.message.includes('login')
    );
  }

  /**
   * Check if error is permission related
   */
  static isPermissionError(error) {
    return error.message && (
      error.message.includes('permission') ||
      error.message.includes('forbidden') ||
      error.message.includes('access denied')
    );
  }

  /**
   * Get error type from error
   */
  static getErrorType(error) {
    if (this.isNetworkError(error)) {
      return this.ERROR_TYPES.NETWORK;
    }
    
    if (this.isValidationError(error)) {
      return this.ERROR_TYPES.VALIDATION;
    }
    
    if (this.isAuthError(error)) {
      return this.ERROR_TYPES.AUTHENTICATION;
    }
    
    if (this.isPermissionError(error)) {
      return this.ERROR_TYPES.PERMISSION;
    }
    
    return this.ERROR_TYPES.UNKNOWN;
  }

  /**
   * Handle error based on type
   */
  static handleErrorByType(error, context) {
    const errorType = this.getErrorType(error);
    
    switch (errorType) {
      case this.ERROR_TYPES.NETWORK:
        this.handleNetworkError(error, context);
        break;
      case this.ERROR_TYPES.VALIDATION:
        this.handleValidationError(error, context);
        break;
      case this.ERROR_TYPES.AUTHENTICATION:
        this.handleAuthError(error, context);
        break;
      case this.ERROR_TYPES.PERMISSION:
        this.handlePermissionError(error, context);
        break;
      default:
        this.handleError(error, context);
    }
  }
}

module.exports = { ErrorHandler };
