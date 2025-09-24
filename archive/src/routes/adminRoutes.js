const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin, addUserToLocals } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(addUserToLocals);
router.use(requireAuth);
router.use(requireAdmin);

// Admin dashboard
router.get('/', adminController.showDashboard);

// User management
router.get('/users', adminController.showUsers);
router.put('/users/:userId/role', adminController.updateUserRole);
router.delete('/users/:userId', adminController.deleteUser);

module.exports = router;

