const { User } = require('../../models');
const bcrypt = require('bcryptjs');

class ProfileController {
  /**
   * Get current user profile
   * GET /api/v1/profile
   */
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
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
      console.error('Profile retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/profile
   */
  async updateProfile(req, res) {
    try {
      const { email, first_name, last_name, current_password } = req.body;

      // Validate required fields
      if (!current_password) {
        return res.status(400).json({
          success: false,
          error: 'Current password is required'
        });
      }

      // Get current user
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Verify current password
      const isPasswordValid = await user.verifyPassword(current_password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid current password'
        });
      }

      // Prepare update data
      const updateData = {};
      if (email !== undefined) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid email format'
          });
        }
        updateData.email = email;
      }
      if (first_name !== undefined) {
        updateData.first_name = first_name;
      }
      if (last_name !== undefined) {
        updateData.last_name = last_name;
      }

      // Update profile
      await user.updateProfile(updateData);

      // Return updated user data
      const updatedUser = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash'] }
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          role: updatedUser.role,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Change user password
   * PUT /api/v1/profile/password
   */
  async changePassword(req, res) {
    try {
      const { current_password, new_password, confirm_password } = req.body;

      // Validate required fields
      if (!current_password) {
        return res.status(400).json({
          success: false,
          error: 'Current password is required'
        });
      }

      if (!new_password) {
        return res.status(400).json({
          success: false,
          error: 'New password is required'
        });
      }

      if (!confirm_password) {
        return res.status(400).json({
          success: false,
          error: 'Password confirmation is required'
        });
      }

      // Validate password confirmation
      if (new_password !== confirm_password) {
        return res.status(400).json({
          success: false,
          error: 'Password confirmation does not match'
        });
      }

      // Validate password strength
      if (new_password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long'
        });
      }

      // Get current user
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Change password
      await user.changePassword(current_password, new_password);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Password change error:', error);
      
      if (error.message === 'Invalid current password') {
        return res.status(401).json({
          success: false,
          error: 'Invalid current password'
        });
      }

      if (error.message.includes('Password must be at least')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new ProfileController();
