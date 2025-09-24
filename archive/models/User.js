const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 255],
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user'
    },
    first_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    last_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: (user) => {
        if (user.username) {
          user.username = user.username.toLowerCase();
        }
        user.updated_at = new Date();
      },
      beforeUpdate: (user) => {
        if (user.changed('username') && user.username) {
          user.username = user.username.toLowerCase();
        }
        user.updated_at = new Date();
      }
    }
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
  };

  User.prototype.getFullName = function() {
    if (this.first_name && this.last_name) {
      return `${this.first_name} ${this.last_name}`;
    }
    return this.username;
  };

  User.prototype.isAdmin = function() {
    return this.role === 'admin';
  };

  // Class methods
  User.hashPassword = async function(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  };

  User.findByCredentials = async function(username, password) {
    const user = await User.findOne({
      where: {
        username: username.toLowerCase()
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return user;
  };

  User.findByUsername = async function(username) {
    return await User.findOne({
      where: {
        username: username.toLowerCase()
      }
    });
  };

  User.usernameExists = async function(username) {
    const user = await User.findByUsername(username);
    return !!user;
  };

  // Profile management methods
  User.prototype.updateProfile = async function(updateData) {
    const allowedFields = ['email', 'first_name', 'last_name'];
    const filteredData = {};
    
    // Only allow specific fields to be updated
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }
    
    // Validate email if provided
    if (filteredData.email && !this.sequelize.Validator.isEmail(filteredData.email)) {
      throw new Error('Invalid email format');
    }
    
    // Update the user
    await this.update(filteredData);
    return this;
  };

  User.prototype.changePassword = async function(currentPassword, newPassword) {
    // Verify current password
    const isCurrentPasswordValid = await this.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Invalid current password');
    }
    
    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Hash and update password
    const hashedPassword = await User.hashPassword(newPassword);
    await this.update({ password_hash: hashedPassword });
    return this;
  };

  User.prototype.verifyPassword = async function(password) {
    return await this.validatePassword(password);
  };

  return User;
};


