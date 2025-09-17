const { User } = require('../../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Show login form
const showLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Login',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// Handle login
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Please check your input and try again.',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    try {
      const user = await User.findByCredentials(username, password);
      
      // Create session
      req.session.userId = user.user_id;
      req.session.username = user.username;
      req.session.role = user.role;
      
      console.log(`User ${user.username} logged in successfully`);
      
      // Redirect based on role or return URL
      const returnUrl = req.query.return || '/';
      res.redirect(returnUrl);
    } catch (error) {
      console.log(`Login failed for username: ${username}`);
      res.render('auth/login', {
        title: 'Login',
        error: 'Invalid username or password',
        success: null
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login',
      error: 'An error occurred during login. Please try again.',
      success: null
    });
  }
};

// Show register form
const showRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Register',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// Handle registration
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'Please check your input and try again.',
        errors: errors.array()
      });
    }

    const { username, email, password, first_name, last_name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'Username or email already exists',
        success: null
      });
    }

    // Hash password and create user
    const password_hash = await User.hashPassword(password);
    const user = await User.create({
      username,
      email,
      password_hash,
      first_name: first_name || null,
      last_name: last_name || null,
      role: 'user' // Default role
    });

    console.log(`New user registered: ${user.username}`);
    
    res.redirect('/auth/login?success=Registration successful. Please log in.');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', {
      title: 'Register',
      error: 'An error occurred during registration. Please try again.',
      success: null
    });
  }
};

// Handle logout
const logout = (req, res) => {
  const username = req.session.username || 'Unknown';
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    
    console.log(`User ${username} logged out`);
    res.redirect('/auth/login?success=You have been logged out successfully.');
  });
};

// Show profile
const showProfile = (req, res) => {
  res.render('auth/profile', {
    title: 'Profile',
    user: req.user,
    error: null,
    success: null
  });
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth/profile', {
        title: 'Profile',
        user: req.user,
        error: 'Please check your input and try again.',
        errors: errors.array()
      });
    }

    const { first_name, last_name, email } = req.body;
    const user = req.user;

    // Check if email is being changed and if it's already taken
    if (email !== user.email) {
      const existingUser = await User.findOne({
        where: { email: email }
      });
      
      if (existingUser) {
        return res.render('auth/profile', {
          title: 'Profile',
          user: user,
          error: 'Email already exists'
        });
      }
    }

    // Update user
    await user.update({
      first_name: first_name || null,
      last_name: last_name || null,
      email: email
    });

    console.log(`User ${user.username} updated their profile`);
    res.render('auth/profile', {
      title: 'Profile',
      user: user,
      success: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.render('auth/profile', {
      title: 'Profile',
      user: req.user,
      error: 'An error occurred while updating your profile.'
    });
  }
};

module.exports = {
  showLogin,
  login,
  showRegister,
  register,
  logout,
  showProfile,
  updateProfile
};
