import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// Public routes
router.get('/login', authController.showLogin);
router.post('/login', authController.login);

router.get('/register', authController.showRegister);
router.post('/register', authController.register);

router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', requireAuth, authController.showProfile);
router.put('/profile/password', requireAuth, authController.changePassword);

export default router;
