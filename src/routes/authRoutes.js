const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { requireAuthView, addUserToLocals } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const registerValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Username must be between 3 and 255 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  body('first_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('First name must be less than 255 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Last name must be less than 255 characters')
];

const profileValidation = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('First name must be less than 255 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Last name must be less than 255 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
];

// Public routes
router.get('/login', authController.showLogin);
router.post('/login', loginValidation, authController.login);

router.get('/register', authController.showRegister);
router.post('/register', registerValidation, authController.register);

router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', requireAuthView, authController.showProfile);
router.post('/profile', requireAuthView, profileValidation, authController.updateProfile);

module.exports = router;


