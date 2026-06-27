const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderPhoto = sequelize.define('OrderPhoto', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id',
    },
  },
  photo_url: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  uploaded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'order_photos',
  timestamps: false,
});

module.exports = OrderPhoto;
