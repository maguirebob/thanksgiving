const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation rules for menu ID parameter
 */
const validateMenuId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Menu ID must be a positive integer')
    .toInt()
];

/**
 * Validation rules for year parameter
 */
const validateYear = [
  param('year')
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Year must be between 1900 and 2100')
    .toInt()
];

/**
 * Validation rules for query parameters
 */
const validateQueryParams = [
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort must be either "asc" or "desc"'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

/**
 * Validation rules for menu creation
 */
const validateMenuCreate = [
  body('year')
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Year must be between 1900 and 2100')
    .toInt(),
  body('title')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters')
    .trim(),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid date (YYYY-MM-DD)')
    .toDate(),
  body('location')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Location must be between 1 and 255 characters')
    .trim(),
  body('host')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Host must be between 1 and 255 characters')
    .trim(),
  body('menu_items')
    .optional()
    .isArray()
    .withMessage('Menu items must be an array')
];

/**
 * Validation rules for menu updates
 */
const validateMenuUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Menu ID must be a positive integer')
    .toInt(),
  body('year')
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Year must be between 1900 and 2100')
    .toInt(),
  body('title')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters')
    .trim(),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date (YYYY-MM-DD)')
    .toDate(),
  body('location')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Location must be between 1 and 255 characters')
    .trim(),
  body('host')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Host must be between 1 and 255 characters')
    .trim(),
  body('menu_items')
    .optional()
    .isArray()
    .withMessage('Menu items must be an array')
];

/**
 * Middleware to handle validation results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    
    // For API routes, return JSON error
    if (req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/')) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessages
      });
    }
    
    // For regular routes, render error page
    return res.status(400).render('error', {
      message: 'Invalid input',
      error: errorMessages.join(', '),
      statusCode: 400
    });
  }
  
  next();
};

module.exports = {
  validateMenuId,
  validateYear,
  validateQueryParams,
  validateMenuCreate,
  validateMenuUpdate,
  handleValidationErrors
};
