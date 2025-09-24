import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

// Admin dashboard
router.get('/', adminController.showDashboard);

// User management
router.get('/users', adminController.showUsers);
router.put('/users/:userId/role', adminController.updateUserRole);
router.delete('/users/:userId', adminController.deleteUser);

export default router;
