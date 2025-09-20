const { User } = require('../../models');

class AdminProfileController {
  /**
   * Get all users (admin only)
   * GET /api/v1/admin/users
   */
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password_hash'] },
        order: [['created_at', 'ASC']]
      });

      res.json({
        success: true,
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        }))
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update user role (admin only)
   * PUT /api/v1/admin/users/:userId/role
   */
  async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      // Validate required fields
      if (!role) {
        return res.status(400).json({
          success: false,
          error: 'Role is required'
        });
      }

      // Validate role value
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role. Must be "admin" or "user"'
        });
      }

      // Validate user ID
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
      }

      // Check if user exists
      const user = await User.findByPk(userIdNum);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent admin from changing their own role
      if (user.id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot change your own role'
        });
      }

      // Update user role
      await user.update({ role });

      res.json({
        success: true,
        message: 'User role updated successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new AdminProfileController();
