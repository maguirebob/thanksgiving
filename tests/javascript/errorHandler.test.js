const { ErrorHandler } = require('../../src/javascript/errorHandler');

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the static methods
    ErrorHandler.logError = jest.fn();
  });

  describe('ERROR_TYPES', () => {
    test('should have correct error type constants', () => {
      expect(ErrorHandler.ERROR_TYPES.NETWORK).toBe('NETWORK_ERROR');
      expect(ErrorHandler.ERROR_TYPES.VALIDATION).toBe('VALIDATION_ERROR');
      expect(ErrorHandler.ERROR_TYPES.AUTHENTICATION).toBe('AUTH_ERROR');
      expect(ErrorHandler.ERROR_TYPES.PERMISSION).toBe('PERMISSION_ERROR');
      expect(ErrorHandler.ERROR_TYPES.UNKNOWN).toBe('UNKNOWN_ERROR');
    });
  });

  describe('handleError', () => {
    test('should handle network errors', () => {
      const error = new Error('Network request failed');
      const context = 'photo_upload';
      
      ErrorHandler.handleError(error, context);
      
      expect(console.error).toHaveBeenCalledWith('photo upload error:', error);
      expect(ErrorHandler.logError).toHaveBeenCalledWith(error, context);
    });

    test('should handle validation errors', () => {
      const error = new Error('Invalid file type');
      const context = 'file_validation';
      
      ErrorHandler.handleError(error, context);
      
      expect(console.error).toHaveBeenCalledWith('validating file error:', error);
    });

    test('should handle authentication errors', () => {
      const error = new Error('Unauthorized');
      const context = 'api_request';
      
      ErrorHandler.handleError(error, context);
      
      expect(console.error).toHaveBeenCalledWith('making API request error:', error);
    });

    test('should handle unknown errors', () => {
      const error = new Error('Something went wrong');
      const context = 'unknown_operation';
      
      ErrorHandler.handleError(error, context);
      
      expect(console.error).toHaveBeenCalledWith('unknown operation error:', error);
    });
  });

  describe('logError', () => {
    test('should log error with context', () => {
      const error = new Error('Test error');
      const context = 'test_context';
      
      ErrorHandler.logError(error, context);
      
      expect(console.error).toHaveBeenCalledWith(
        `[${context}] Error:`,
        error.message,
        error.stack
      );
    });

    test('should handle errors without stack trace', () => {
      const error = { message: 'Simple error' };
      const context = 'test_context';
      
      ErrorHandler.logError(error, context);
      
      expect(console.error).toHaveBeenCalledWith(
        `[${context}] Error:`,
        error.message,
        undefined
      );
    });
  });

  describe('showUserError', () => {
    beforeEach(() => {
      // Mock alert
      global.alert = jest.fn();
    });

    test('should show user-friendly error message', () => {
      const error = new Error('Network request failed');
      const context = 'photo_upload';
      
      ErrorHandler.showUserError(error, context);
      
      expect(global.alert).toHaveBeenCalledWith(
        'Error photo upload: Network request failed'
      );
    });

    test('should show generic error message for unknown errors', () => {
      const error = new Error('Something went wrong');
      const context = 'unknown_operation';
      
      ErrorHandler.showUserError(error, context);
      
      expect(global.alert).toHaveBeenCalledWith(
        'Error unknown operation: Something went wrong'
      );
    });

    test('should handle errors without message', () => {
      const error = {};
      const context = 'test_context';
      
      ErrorHandler.showUserError(error, context);
      
      expect(global.alert).toHaveBeenCalledWith(
        'Error test context: Unknown error occurred'
      );
    });
  });

  describe('getErrorMessage', () => {
    test('should return error message for Error objects', () => {
      const error = new Error('Test error message');
      
      expect(ErrorHandler.getErrorMessage(error)).toBe('Test error message');
    });

    test('should return string for string errors', () => {
      const error = 'String error message';
      
      expect(ErrorHandler.getErrorMessage(error)).toBe('String error message');
    });

    test('should return message property for objects with message', () => {
      const error = { message: 'Object error message' };
      
      expect(ErrorHandler.getErrorMessage(error)).toBe('Object error message');
    });

    test('should return default message for unknown error types', () => {
      const error = { someProperty: 'value' };
      
      expect(ErrorHandler.getErrorMessage(error)).toBe('Unknown error occurred');
    });

    test('should return default message for null/undefined', () => {
      expect(ErrorHandler.getErrorMessage(null)).toBe('Unknown error occurred');
      expect(ErrorHandler.getErrorMessage(undefined)).toBe('Unknown error occurred');
    });
  });

  describe('showSuccess', () => {
    beforeEach(() => {
      global.alert = jest.fn();
    });

    test('should show success message', () => {
      ErrorHandler.showSuccess('Photo uploaded successfully');
      
      expect(global.alert).toHaveBeenCalledWith('Photo uploaded successfully');
    });
  });

  describe('showWarning', () => {
    beforeEach(() => {
      global.alert = jest.fn();
    });

    test('should show warning message', () => {
      ErrorHandler.showWarning('File size is large');
      
      expect(global.alert).toHaveBeenCalledWith('Warning: File size is large');
    });
  });

  describe('showInfo', () => {
    beforeEach(() => {
      global.alert = jest.fn();
    });

    test('should show info message', () => {
      ErrorHandler.showInfo('Processing photo...');
      
      expect(global.alert).toHaveBeenCalledWith('Info: Processing photo...');
    });
  });

  describe('Error Type Detection', () => {
    test('should detect network errors', () => {
      const networkError = new Error('fetch failed');
      const context = 'api_request';
      
      ErrorHandler.handleError(networkError, context);
      
      expect(console.error).toHaveBeenCalledWith('making API request error:', networkError);
    });

    test('should detect validation errors', () => {
      const validationError = new Error('Invalid file type');
      const context = 'file_validation';
      
      ErrorHandler.handleError(validationError, context);
      
      expect(console.error).toHaveBeenCalledWith('validating file error:', validationError);
    });

    test('should detect authentication errors', () => {
      const authError = new Error('Unauthorized');
      const context = 'api_request';
      
      ErrorHandler.handleError(authError, context);
      
      expect(console.error).toHaveBeenCalledWith('making API request error:', authError);
    });
  });
});
