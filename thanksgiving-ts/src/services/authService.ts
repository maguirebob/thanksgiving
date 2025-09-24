import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { config } from '../lib/config';
import { AppError } from '../middleware/errorHandler';

export interface User {
  user_id: number;
  username: string;
  email: string;
  role: string;
  first_name?: string | null;
  last_name?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

/**
 * Service class for authentication operations
 */
export class AuthService {
  /**
   * Authenticate user with username and password
   */
  static async authenticateUser(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { username, password } = credentials;

      // Find user by username (case-insensitive)
      const user = await prisma.user.findFirst({
        where: {
          username: {
            equals: username,
            mode: 'insensitive' as const
          }
        }
      });

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error authenticating user:', error);
      throw new AppError('Authentication failed', 500);
    }
  }

  /**
   * Register new user
   */
  static async registerUser(userData: RegisterData): Promise<AuthResult> {
    try {
      const { username, email, password, firstName, lastName } = userData;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: username, mode: 'insensitive' as const } },
            { email: { equals: email, mode: 'insensitive' as const } }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.username.toLowerCase() === username.toLowerCase()) {
          throw new AppError('Username already exists', 400);
        }
        if (existingUser.email.toLowerCase() === email.toLowerCase()) {
          throw new AppError('Email already exists', 400);
        }
      }

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password_hash,
          first_name: firstName || null,
          last_name: lastName || null,
          role: 'user'
        }
      });

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error registering user:', error);
      throw new AppError('Registration failed', 500);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: number): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { user_id: id }
      });

      if (!user) {
        return null;
      }

      return {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw new AppError('Failed to fetch user', 500);
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(id: number, updateData: Partial<RegisterData>): Promise<User> {
    try {
      const { username, email, firstName, lastName } = updateData;

      // Check if username or email already exists (excluding current user)
      if (username || email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            AND: [
              { user_id: { not: id } },
              {
                OR: [
                  ...(username ? [{ username: { equals: username, mode: 'insensitive' as const } }] : []),
                  ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : [])
                ]
              }
            ]
          }
        });

        if (existingUser) {
          if (existingUser.username.toLowerCase() === username?.toLowerCase()) {
            throw new AppError('Username already exists', 400);
          }
          if (existingUser.email.toLowerCase() === email?.toLowerCase()) {
            throw new AppError('Email already exists', 400);
          }
        }
      }

      const user = await prisma.user.update({
        where: { user_id: id },
        data: {
          ...(username && { username }),
          ...(email && { email }),
          ...(firstName && { first_name: firstName }),
          ...(lastName && { last_name: lastName })
        }
      });

      return {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error updating user profile:', error);
      throw new AppError('Failed to update profile', 500);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { user_id: id }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      // Hash new password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { user_id: id },
        data: { password_hash }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error changing password:', error);
      throw new AppError('Failed to change password', 500);
    }
  }

  /**
   * Generate JWT token for user
   */
  private static generateToken(user: any): string {
    return jwt.sign(
      {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      config.getConfig().jwtSecret,
      { expiresIn: config.getConfig().jwtExpiresIn } as jwt.SignOptions
    );
  }
}
