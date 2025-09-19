/**
 * ErrorHandler - Centralized error handling and user feedback
 * Browser-compatible version
 */
class ErrorHandler {
  static ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    AUTHENTICATION: 'AUTHENTICATION_ERROR',
    PERMISSION: 'PERMISSION_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
  };

  /**
   * Handle errors with context
   */
  static handleError(error, context) {
    console.error(`${context} error:`, error);
    this.logError(error, context);
    this.showUserError(error, context);
  }

  /**
   * Log error with context
   */
  static logError(error, context) {
    console.error(`[${context}] Error:`, this.getErrorMessage(error), error.stack);
  }

  /**
   * Show user-friendly error message
   */
  static showUserError(error, context) {
    const message = this.getUserFriendlyMessage(error, context);
    this.showError(message);
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error, context) {
    const errorType = this.detectErrorType(error);
    
    switch (errorType) {
      case this.ERROR_TYPES.NETWORK:
        return 'Network error. Please check your connection and try again.';
      case this.ERROR_TYPES.VALIDATION:
        return 'Please check your input and try again.';
      case this.ERROR_TYPES.AUTHENTICATION:
        return 'Please log in again to continue.';
      case this.ERROR_TYPES.PERMISSION:
        return 'You do not have permission to perform this action.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  /**
   * Detect error type
   */
  static detectErrorType(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return this.ERROR_TYPES.NETWORK;
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return this.ERROR_TYPES.VALIDATION;
    }
    if (message.includes('unauthorized') || message.includes('authentication') || message.includes('token')) {
      return this.ERROR_TYPES.AUTHENTICATION;
    }
    if (message.includes('permission') || message.includes('forbidden')) {
      return this.ERROR_TYPES.PERMISSION;
    }
    
    return this.ERROR_TYPES.UNKNOWN;
  }

  /**
   * Get error message
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
    return 'An unknown error occurred';
  }

  /**
   * Show error message to user
   */
  static showError(message) {
    // Simple alert for now - could be enhanced with a toast notification
    alert('Error: ' + message);
  }

  /**
   * Show success message
   */
  static showSuccess(message) {
    // Simple alert for now - could be enhanced with a toast notification
    alert('Success: ' + message);
  }

  /**
   * Show warning message
   */
  static showWarning(message) {
    // Simple alert for now - could be enhanced with a toast notification
    alert('Warning: ' + message);
  }

  /**
   * Show info message
   */
  static showInfo(message) {
    // Simple alert for now - could be enhanced with a toast notification
    alert('Info: ' + message);
  }
}
