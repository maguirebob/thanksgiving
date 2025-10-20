import { Request, Response } from 'express';
import { Router } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { emailService } from '../services/emailService';
import { TokenService, RateLimitService } from '../services/tokenService';

const router = Router();

/**
 * Show forgot password form
 * GET /auth/forgot-password
 */
router.get('/forgot-password', (req: Request, res: Response) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password - Thanksgiving Menu Collection',
    error: req.query['error'] || null,
    success: req.query['success'] || null
  });
});

/**
 * Handle forgot password request
 * POST /auth/forgot-password
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  console.log('🔐 FORGOT PASSWORD ATTEMPT:', {
    username: req.body.username,
    sessionId: req.sessionID
  });
  
  try {
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.redirect('/auth/forgot-password?error=Username is required');
    }

    // Check rate limiting
    if (RateLimitService.isRateLimited(username)) {
      return res.redirect('/auth/forgot-password?error=Too many requests. Please try again later.');
    }

    // Find user by username or email
    console.log('🔐 Searching for user:', username.trim());
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: username.trim() }
        ]
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        first_name: true
      }
    });

    // Always show success message to prevent username enumeration
    // But only send email if user exists
    if (user) {
      console.log('✅ User found:', { id: user.user_id, username: user.username, email: user.email });
      
      // Invalidate any existing reset tokens for this user
      console.log('🔐 Invalidating existing tokens...');
      await prisma.passwordResetToken.updateMany({
        where: {
          user_id: user.user_id,
          used: false
        },
        data: {
          used: true
        }
      });

      // Create new reset token
      console.log('🔐 Creating new reset token...');
      const tokenData = TokenService.createTokenData();
      await prisma.passwordResetToken.create({
        data: {
          user_id: user.user_id,
          token: tokenData.token,
          expires_at: tokenData.expiresAt
        }
      });

      console.log('✅ Reset token created:', { token: tokenData.token.substring(0, 8) + '...', expiresAt: tokenData.expiresAt });

      // Generate reset URL
      const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${tokenData.token}`;
      console.log('🔐 Reset URL generated:', resetUrl);

      // Send email
      console.log('📧 Sending password reset email...');
      const emailData: { firstName?: string; username: string; resetUrl: string } = {
        username: user.username,
        resetUrl
      };
      if (user.first_name) {
        emailData.firstName = user.first_name;
      }
      await emailService.sendPasswordReset(user.email, emailData);

      console.log(`🔐 Password reset requested for user: ${user.username} (${user.email})`);
    } else {
      console.log(`🔐 Password reset requested for non-existent user: ${username}`);
    }

    // Record attempt for rate limiting
    RateLimitService.recordAttempt(username);

    // Always redirect to success page to prevent enumeration
    res.redirect('/auth/forgot-password?success=If an account with that username exists, we have sent password reset instructions to the registered email address.');

  } catch (error) {
    console.error('❌ Error in forgot password:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      username: req.body.username
    });
    res.redirect('/auth/forgot-password?error=An error occurred. Please try again.');
  }
});

/**
 * Show reset password form
 * GET /auth/reset-password/:token
 */
router.get('/reset-password/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || !TokenService.isValidTokenFormat(token)) {
      return res.render('auth/reset-password', {
        title: 'Invalid Reset Link - Thanksgiving Menu Collection',
        error: 'Invalid reset link format',
        valid: false
      });
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: token },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!resetToken || resetToken.used || TokenService.isTokenExpired(resetToken.expires_at)) {
      return res.render('auth/reset-password', {
        title: 'Invalid Reset Link - Thanksgiving Menu Collection',
        error: 'Reset link is invalid or has expired',
        valid: false
      });
    }

    res.render('auth/reset-password', {
      title: 'Reset Password - Thanksgiving Menu Collection',
      token: token,
      username: resetToken.user.username,
      valid: true,
      error: req.query['error'] || null
    });

  } catch (error) {
    console.error('Error loading reset password form:', error);
    res.render('auth/reset-password', {
      title: 'Error - Thanksgiving Menu Collection',
      error: 'An error occurred loading the reset form',
      valid: false
    });
  }
});

/**
 * Handle password reset
 * POST /auth/reset-password/:token
 */
router.post('/reset-password/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
      return res.redirect('/auth/login?error=Invalid reset link');
    }

    // Validate input
    if (!password || !confirmPassword) {
      return res.redirect(`/auth/reset-password/${token}?error=Password and confirmation are required`);
    }

    if (password !== confirmPassword) {
      return res.redirect(`/auth/reset-password/${token}?error=Passwords do not match`);
    }

    if (password.length < 6) {
      return res.redirect(`/auth/reset-password/${token}?error=Password must be at least 6 characters`);
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: token },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!resetToken || resetToken.used || TokenService.isTokenExpired(resetToken.expires_at)) {
      return res.redirect('/auth/login?error=Reset link is invalid or has expired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { user_id: resetToken.user_id },
        data: { password_hash: passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ]);

    console.log(`🔐 Password reset completed for user: ${resetToken.user.username}`);

    res.redirect('/auth/login?success=Password reset successfully. You can now login with your new password.');

  } catch (error) {
    console.error('Error resetting password:', error);
    const token = req.params['token'];
    res.redirect(`/auth/reset-password/${token}?error=An error occurred. Please try again.`);
  }
});

/**
 * Show forgot username form
 * GET /auth/forgot-username
 */
router.get('/forgot-username', (req: Request, res: Response) => {
  res.render('auth/forgot-username', {
    title: 'Forgot Username - Thanksgiving Menu Collection',
    error: req.query['error'] || null,
    success: req.query['success'] || null
  });
});

/**
 * Handle forgot username request
 * POST /auth/forgot-username
 */
router.post('/forgot-username', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.redirect('/auth/forgot-username?error=Email address is required');
    }

    // Check rate limiting
    if (RateLimitService.isRateLimited(email)) {
      return res.redirect('/auth/forgot-username?error=Too many requests. Please try again later.');
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        user_id: true,
        username: true,
        email: true,
        first_name: true
      }
    });

    // Always show success message to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Generate login URL
      const loginUrl = `${req.protocol}://${req.get('host')}/auth/login`;

      // Send email
      const emailData: { firstName?: string; username: string; loginUrl: string } = {
        username: user.username,
        loginUrl
      };
      if (user.first_name) {
        emailData.firstName = user.first_name;
      }
      await emailService.sendUsernameRecovery(user.email, emailData);

      console.log(`🔐 Username recovery requested for email: ${user.email}`);
    } else {
      console.log(`🔐 Username recovery requested for non-existent email: ${email}`);
    }

    // Record attempt for rate limiting
    RateLimitService.recordAttempt(email);

    // Always redirect to success page to prevent enumeration
    res.redirect('/auth/forgot-username?success=If an account with that email exists, we have sent your username to that email address.');

  } catch (error) {
    console.error('Error in forgot username:', error);
    res.redirect('/auth/forgot-username?error=An error occurred. Please try again.');
  }
});

export default router;
