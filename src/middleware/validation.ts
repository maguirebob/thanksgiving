import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    if (req.headers.accept?.includes('application/json')) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input and try again.',
        errors: errors.array()
      });
    } else {
      // For view routes, redirect back with error message
      // Note: flash messages require express-flash middleware
      // For now, we'll just redirect back
      res.redirect('back');
    }
    return;
  }
  
  next();
};

/**
 * Validation rules for menu ID parameter
 */
export const validateMenuId = [
  param('id').isInt({ min: 1 }).withMessage('Menu ID must be a positive integer'),
  handleValidationErrors
];

/**
 * Validation rules for year parameter
 */
export const validateYear = [
  param('year').isInt({ min: 1990, max: 2030 }).withMessage('Year must be between 1990 and 2030'),
  handleValidationErrors
];

/**
 * Validation rules for query parameters
 */
export const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

/**
 * Validation rules for user registration
 */
export const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
export const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Validation rules for photo upload
 */
export const validatePhotoUpload = [
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('caption')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Caption must be less than 200 characters'),
  handleValidationErrors
];

/**
 * Validation rules for event creation/update
 */
export const validateEvent = [
  body('event_name')
    .isLength({ min: 1, max: 255 })
    .withMessage('Event name must be between 1 and 255 characters'),
  body('event_type')
    .isLength({ min: 1, max: 255 })
    .withMessage('Event type must be between 1 and 255 characters'),
  body('event_location')
    .isLength({ min: 1, max: 255 })
    .withMessage('Event location must be between 1 and 255 characters'),
  body('event_date')
    .isISO8601()
    .withMessage('Event date must be a valid date'),
  body('event_description')
    .isLength({ min: 1 })
    .withMessage('Event description is required'),
  body('menu_title')
    .isLength({ min: 1, max: 255 })
    .withMessage('Menu title must be between 1 and 255 characters'),
  body('menu_image_filename')
    .isLength({ min: 1, max: 255 })
    .withMessage('Menu image filename must be between 1 and 255 characters'),
  handleValidationErrors
];
