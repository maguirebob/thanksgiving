const { User } = require('../../models');

// Middleware to check if user is authenticated
const requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        redirect: '/login'
      });
    }

    // Verify user still exists
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ 
        error: 'User not found',
        redirect: '/login'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to check if user has admin role
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        redirect: '/login'
      });
    }

    if (!req.user.isAdmin()) {
      return res.status(403).json({ 
        error: 'Admin access required',
        redirect: '/'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Authorization error' });
  }
};

// Middleware to check if user is authenticated (for views)
const requireAuthView = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.redirect('/auth/login');
    }

    // Verify user still exists
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect('/auth/login');
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth view middleware error:', error);
    res.redirect('/auth/login');
  }
};

// Middleware to check if user has admin role (for views)
const requireAdminView = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect('/auth/login');
    }

    if (!req.user.isAdmin()) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page.',
        error: { status: 403 }
      });
    }

    next();
  } catch (error) {
    console.error('Admin view middleware error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'An error occurred while checking permissions.',
      error: { status: 500 }
    });
  }
};

// Middleware to add user to locals for views (optional auth)
const addUserToLocals = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.findByPk(req.session.userId);
      if (user) {
        req.user = user; // Set user in request object
        res.locals.user = user;
        res.locals.isAuthenticated = true;
        res.locals.isAdmin = user.isAdmin();
      } else {
        req.session.destroy();
      }
    } else {
      res.locals.isAuthenticated = false;
      res.locals.isAdmin = false;
    }
    next();
  } catch (error) {
    console.error('Add user to locals error:', error);
    res.locals.isAuthenticated = false;
    res.locals.isAdmin = false;
    next();
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireAuthView,
  requireAdminView,
  addUserToLocals
};
