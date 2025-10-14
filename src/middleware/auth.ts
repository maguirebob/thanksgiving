import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

// Middleware to require authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Only log authentication failures, not every check
  if (!req.session || !req.session.userId) {
    logger.debug('Authentication required, redirecting to login', {
      hasSession: !!req.session,
      userId: req.session?.userId,
      sessionId: req.sessionID,
      originalUrl: req.originalUrl
    });
    
    // Store the original URL to redirect back after login (only if session exists)
    if (req.session) {
      req.session.returnTo = req.originalUrl;
    }
    return res.redirect('/auth/login');
  }
  next();
};

// Middleware to add user info to locals for templates
export const addUserToLocals = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.userId) {
    res.locals['user'] = {
      id: req.session.userId,
      role: req.session.userRole
    };
  } else {
    res.locals['user'] = null;
  }
  next();
};

// Middleware to require admin role
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/auth/login');
  }
  
  if (req.session.userRole !== 'admin') {
    return res.status(403).render('error', {
      title: 'Access Denied',
      message: 'You do not have permission to access this page.'
    });
  }
  
  next();
};