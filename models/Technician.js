const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { TECH_STATUS } = require('../config/constants');

const Technician = sequelize.define('Technician', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  spesialisasi: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: false,
    defaultValue: 5.0,
    validate: {
      min: 0,
      max: 5.0,
    },
  },
  is_premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(TECH_STATUS)),
    allowNull: false,
    defaultValue: TECH_STATUS.OFFLINE,
  },
  total_jobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  no_hp: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
}, {
  tableName: 'technicians',
  timestamps: true,
  underscored: true,
});

module.exports = Technician;
