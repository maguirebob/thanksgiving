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
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.redirect('/auth/login?error=Username and password are required');
      }

      // Find user by username or email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: username }
          ]
        }
      });

      if (!user) {
        return res.redirect('/auth/login?error=Invalid username or password');
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.redirect('/auth/login?error=Invalid username or password');
      }

      // Set session
      req.session.userId = user.user_id;
      req.session.userRole = user.role;
      
      console.log('Login successful:', {
        userId: user.user_id,
        username: user.username,
        role: user.role,
        sessionId: req.sessionID
      });

      // Redirect to profile or home
      const redirectTo = req.session.returnTo || '/auth/profile';
      delete req.session.returnTo;
      console.log('Redirecting to:', redirectTo);
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
          created_at: true
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
}
