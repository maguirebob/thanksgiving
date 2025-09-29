import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminController {
  // Show admin dashboard
  showDashboard = async (_req: Request, res: Response) => {
    try {
      // Get statistics for the dashboard
      const totalUsers = await prisma.user.count();
      const totalEvents = await prisma.event.count();
      const totalPhotos = await prisma.photo.count();
      
      // Get recent events
      const rawEvents = await prisma.event.findMany({
        orderBy: { event_date: 'desc' },
        take: 5,
        include: {
          photos: {
            take: 1
          }
        }
      });

      // Transform events to match frontend expectations
      const recentEvents = rawEvents.map(event => ({
        id: event.event_id,
        event_name: event.event_name,
        event_type: event.event_type,
        event_location: event.event_location,
        event_date: event.event_date,
        event_description: event.event_description,
        menu_title: event.menu_title,
        menu_image_filename: event.menu_image_filename,
        created_at: event.event_date, // Use event_date as created_at since we don't have created_at in the model
        photos: event.photos
      }));

      res.render('admin/dashboard', {
        title: 'Admin Dashboard - Thanksgiving Menu Collection',
        stats: {
          totalUsers,
          totalEvents,
          totalPhotos
        },
        recentEvents
      });
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load admin dashboard',
        error: process.env['NODE_ENV'] === 'development' ? error : {}
      });
    }
  };

  // Show user management page
  showUsers = async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { created_at: 'desc' },
        select: {
          user_id: true,
          username: true,
          email: true,
          role: true,
          first_name: true,
          last_name: true,
          created_at: true
        }
      });

      // Get current user info for the template
      const currentUser = await prisma.user.findUnique({
        where: { user_id: req.session.userId! },
        select: {
          user_id: true,
          username: true,
          role: true
        }
      });

      res.render('admin/users', {
        title: 'User Management - Thanksgiving Menu Collection',
        users,
        currentUser
      });
    } catch (error) {
      console.error('Error loading users:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load users',
        error: process.env['NODE_ENV'] === 'development' ? error : {}
      });
    }
  };

  // Update user role
  updateUserRole = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      // Validate role
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role. Must be "user" or "admin"'
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { user_id: parseInt(userId || '0') }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Prevent admin from demoting themselves
      if (user.user_id === req.session.userId && role === 'user') {
        return res.status(400).json({
          success: false,
          error: 'Cannot demote yourself from admin role'
        });
      }

      // Update user role
      const updatedUser = await prisma.user.update({
        where: { user_id: parseInt(userId || '0') },
        data: { role: role as 'user' | 'admin' }
      });

      return res.json({
        success: true,
        message: 'User role updated successfully',
        data: {
          userId: updatedUser.user_id,
          username: updatedUser.username,
          role: updatedUser.role
        }
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update user role'
      });
    }
  };

  // Delete user
  deleteUser = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { user_id: parseInt(userId || '0') }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Prevent admin from deleting themselves
      if (user.user_id === req.session.userId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete your own account'
        });
      }

      // Delete user (cascade will handle related records)
      await prisma.user.delete({
        where: { user_id: parseInt(userId || '0') }
      });

      return res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete user'
      });
    }
  };
}
