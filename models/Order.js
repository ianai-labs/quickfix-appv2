const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { ORDER_STATUS } = require('../config/constants');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id',
    },
  },
  technician_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'technicians',
      key: 'id',
    },
  },
  layanan: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  alamat: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  status: {
    type: DataTypes.ENUM(...Object.values(ORDER_STATUS)),
    allowNull: false,
    defaultValue: ORDER_STATUS.PENDING,
  },
  harga: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  otp_code: {
    type: DataTypes.STRING(6),
    allowNull: true,
  },
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
});

module.exports = Order;
