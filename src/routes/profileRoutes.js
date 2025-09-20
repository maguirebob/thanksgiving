const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const adminProfileController = require('../controllers/adminProfileController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Profile management routes
router.get('/profile', requireAuth, profileController.getProfile);
router.put('/profile', requireAuth, profileController.updateProfile);
router.put('/profile/password', requireAuth, profileController.changePassword);

// Admin routes
router.get('/admin/users', requireAuth, requireAdmin, adminProfileController.getAllUsers);
router.put('/admin/users/:userId/role', requireAuth, requireAdmin, adminProfileController.updateUserRole);

module.exports = router;
