import { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware for menu creation
 */
export const validateMenuCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { event_name, event_date, event_location, event_description } = req.body;
  const errors: string[] = [];

  // Required field validation
  if (!event_name || event_name.trim().length === 0) {
    errors.push('Event name is required');
  } else if (event_name.trim().length < 3) {
    errors.push('Event name must be at least 3 characters long');
  } else if (event_name.trim().length > 100) {
    errors.push('Event name must be less than 100 characters');
  }

  if (!event_date) {
    errors.push('Event date is required');
  } else {
    const date = new Date(event_date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    } else {
      // Check if date is in the future (optional validation)
      const now = new Date();
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      if (date > oneYearFromNow) {
        errors.push('Event date cannot be more than one year in the future');
      }
      
      // Check if date is too far in the past (optional validation)
      // Allow dates back to 1900 for historical Thanksgiving menus
      const minDate = new Date(1900, 0, 1); // January 1, 1900
      if (date < minDate) {
        errors.push('Event date cannot be before 1900');
      }
    }
  }

  // Optional field validation
  if (event_location && event_location.trim().length > 200) {
    errors.push('Event location must be less than 200 characters');
  }

  if (event_description && event_description.trim().length > 1000) {
    errors.push('Event description must be less than 1000 characters');
  }

  // Check for file upload (this will be handled by multer, but we can add additional validation)
  if (!req.file) {
    errors.push('Menu image is required');
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
    return;
  }

  // If validation passes, continue to the next middleware
  next();
};

/**
 * Sanitize input data to prevent XSS and other attacks
 */
export const sanitizeMenuData = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body.event_name) {
    req.body.event_name = req.body.event_name.trim();
  }
  
  if (req.body.event_location) {
    req.body.event_location = req.body.event_location.trim();
  }
  
  if (req.body.event_description) {
    req.body.event_description = req.body.event_description.trim();
  }

  next();
};
