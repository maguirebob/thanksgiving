module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    event_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    event_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    event_type: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    event_location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    event_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    event_description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    menu_title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    menu_image_filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    tableName: 'Events',
    timestamps: false // Since we're not using created_at/updated_at
  });

  return Event;
};
