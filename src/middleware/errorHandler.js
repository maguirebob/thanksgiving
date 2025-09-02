/**
 * Centralized error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let message = 'Something went wrong!';
  let error = 'Internal server error';

  // Handle specific error types
  if (err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    
    switch (err.original?.code) {
      case '42P01': // Table doesn't exist
        message = 'Database table not found';
        error = 'The Events table does not exist. Please run the SQL script in admin/create_tables.sql to create the table and insert sample data.';
        break;
      case '23505': // Unique constraint violation
        message = 'Duplicate entry';
        error = 'A record with this information already exists.';
        statusCode = 409;
        break;
      case '23503': // Foreign key constraint violation
        message = 'Referenced record not found';
        error = 'The referenced record does not exist.';
        statusCode = 400;
        break;
      default:
        message = 'Database error';
        error = process.env.NODE_ENV === 'development' ? err.message : 'A database error occurred.';
    }
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation error';
    error = err.errors.map(e => e.message).join(', ');
  } else if (err.name === 'SequelizeConnectionError') {
    statusCode = 503;
    message = 'Database connection failed';
    error = 'Unable to connect to the database. Please try again later.';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    error = err.message;
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message || message;
    error = err.error || error;
  } else if (process.env.NODE_ENV === 'development') {
    error = err.message;
  }

  // For API routes, return JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      message: error,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // For regular routes, render error page
  res.status(statusCode).render('error', {
    message,
    error,
    statusCode
  });
};

/**
 * 404 handler for unmatched routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
  const message = 'Page not found';
  const error = 'The page you are looking for does not exist.';
  
  // For API routes, return JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: message,
      message: error
    });
  }

  // For regular routes, render error page
  res.status(404).render('error', {
    message,
    error,
    statusCode: 404
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
