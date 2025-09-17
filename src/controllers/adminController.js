const db = require('../../models');

/**
 * Show admin dashboard
 */
const showDashboard = async (req, res) => {
  try {
    // Get statistics for the dashboard
    const totalUsers = await db.User.count();
    const totalEvents = await db.Event.count();
    const totalPhotos = await db.Photo.count();
    
    // Get recent events
    const recentEvents = await db.Event.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [{
        model: db.Photo,
        as: 'photos',
        limit: 1
      }]
    });

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
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
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

/**
 * Show user management page
 */
const showUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({
      order: [['created_at', 'DESC']],
      attributes: ['user_id', 'username', 'email', 'role', 'first_name', 'last_name', 'created_at']
    });

    res.render('admin/users', {
      title: 'User Management',
      users
    });
  } catch (error) {
    console.error('Error loading users:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load users',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

/**
 * Update user role
 */
const updateUserRole = async (req, res) => {
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
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from demoting themselves
    if (user.user_id === req.user.user_id && role === 'user') {
      return res.status(400).json({
        success: false,
        error: 'Cannot demote yourself from admin role'
      });
    }

    // Update user role
    await user.update({ role });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        userId: user.user_id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
};

/**
 * Delete user
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user.user_id === req.user.user_id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Delete user (cascade will handle related records)
    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
};

module.exports = {
  showDashboard,
  showUsers,
  updateUserRole,
  deleteUser
};
