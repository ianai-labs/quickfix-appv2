const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  device_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  device_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  first_login: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  last_login: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'devices',
  timestamps: false,
});

module.exports = Device;
