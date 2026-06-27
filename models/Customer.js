const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
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
  alamat: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  no_hp: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
}, {
  tableName: 'customers',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Customer;
