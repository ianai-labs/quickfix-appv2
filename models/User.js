const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { USER_ROLES } = require('../config/constants');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50],
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM(...Object.values(USER_ROLES)),
    allowNull: false,
    defaultValue: USER_ROLES.CUSTOMER,
  },
  avatar_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  reset_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

module.exports = User;
