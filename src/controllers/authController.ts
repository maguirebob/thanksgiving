import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthController {
  // Show login page
  showLogin = (req: Request, res: Response) => {
    res.render('auth/login', {
      title: 'Login - Thanksgiving Menu Collection',
      error: req.query['error'] || null,
      success: req.query['success'] || null
    });
  };

  // Handle login
  login = async (req: Request, res: Response) => {
    console.log('🔐 LOGIN ATTEMPT:', {
      method: req.method,
      path: req.path,
      body: { username: req.body.username, hasPassword: !!req.body.password },
      sessionId: req.sessionID
    });
    
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.redirect('/auth/login?error=Username and password are required');
      }

      // Find user by username or email
      console.log('🔐 Searching for user:', username);
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: username }
          ]
        }
      });

      if (!user) {
        console.log('❌ User not found:', username);
        return res.redirect('/auth/login?error=Invalid username or password');
      }

      console.log('✅ User found:', { id: user.user_id, username: user.username, email: user.email });

      // Check password
      console.log('🔐 Checking password...');
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        console.log('❌ Invalid password for user:', username);
        return res.redirect('/auth/login?error=Invalid username or password');
      }

      console.log('✅ Password valid for user:', username);

      // Set session
      console.log('🔐 Setting session data:', { userId: user.user_id, role: user.role });
      req.session.userId = user.user_id;
      req.session.userRole = user.role;
      
      console.log('✅ Session set successfully:', { 
        sessionId: req.sessionID, 
        userId: req.session.userId, 
        userRole: req.session.userRole 
      });
      
      // Redirect to profile or home
      const redirectTo = req.session.returnTo || '/auth/profile';
      delete req.session.returnTo;
      res.redirect(redirectTo);

    } catch (error) {
      console.error('Login error:', error);
      res.redirect('/auth/login?error=An error occurred during login');
    }
  };

  // Show register page
  showRegister = (req: Request, res: Response) => {
    res.render('auth/register', {
      title: 'Register - Thanksgiving Menu Collection',
      error: req.query['error'] || null,
      success: req.query['success'] || null
    });
  };

  // Handle registration
  register = async (req: Request, res: Response) => {
    try {
      const { username, email, password, confirmPassword, first_name, last_name } = req.body;

      // Validation
      if (!username || !email || !password || !confirmPassword) {
        return res.redirect('/auth/register?error=All fields are required');
      }

      if (password !== confirmPassword) {
        return res.redirect('/auth/register?error=Passwords do not match');
      }

      if (password.length < 6) {
        return res.redirect('/auth/register?error=Password must be at least 6 characters');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: email }
          ]
        }
      });

      if (existingUser) {
        return res.redirect('/auth/register?error=Username or email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password_hash: passwordHash,
          first_name: first_name || null,
          last_name: last_name || null,
          role: 'user' as const
        }
      });

      // Set session
      req.session.userId = newUser.user_id;
      req.session.userRole = newUser.role;

      res.redirect('/auth/profile');

    } catch (error) {
      console.error('Registration error:', error);
      res.redirect('/auth/register?error=An error occurred during registration');
    }
  };

  // Handle logout
  logout = (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ success: false, message: 'Logout failed' });
      }
      return res.json({ success: true, message: 'Logged out successfully' });
    });
  };

  // Show profile page
  showProfile = async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.redirect('/auth/login');
      }

      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          username: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!user) {
        return res.redirect('/auth/login');
      }

      res.render('auth/profile', {
        title: 'Profile - Thanksgiving Menu Collection',
        user: user
      });

    } catch (error) {
      console.error('Profile error:', error);
      res.redirect('/auth/login');
    }
  };

  // Change password
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { current_password, new_password, confirm_password } = req.body;

      // Validation
      if (!current_password || !new_password || !confirm_password) {
        res.status(400).json({ 
          success: false, 
          error: 'All password fields are required' 
        });
        return;
      }

      if (new_password !== confirm_password) {
        res.status(400).json({ 
          success: false, 
          error: 'New passwords do not match' 
        });
        return;
      }

      if (new_password.length < 8) {
        res.status(400).json({ 
          success: false, 
          error: 'Password must be at least 8 characters long' 
        });
        return;
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { user_id: userId }
      });

      if (!user) {
        res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
      if (!isCurrentPasswordValid) {
        res.status(400).json({ 
          success: false, 
          error: 'Current password is incorrect' 
        });
        return;
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(new_password, 12);

      // Update password
      await prisma.user.update({
        where: { user_id: userId },
        data: { 
          password_hash: passwordHash,
          updated_at: new Date()
        }
      });

      res.json({ 
        success: true, 
        message: 'Password changed successfully' 
      });

    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to change password' 
      });
    }
  };
}
