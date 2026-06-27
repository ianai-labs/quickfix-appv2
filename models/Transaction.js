const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'orders', key: 'id' } },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  commission: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  net_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  payment_method: { type: DataTypes.STRING(50), allowNull: true },
  payment_channel: { type: DataTypes.STRING(50), allowNull: true },
  midtrans_id: { type: DataTypes.STRING(100), allowNull: true },
  midtrans_token: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.ENUM('unpaid', 'paid', 'released', 'refunded'), defaultValue: 'unpaid' },
  paid_at: { type: DataTypes.DATE, allowNull: true },
  released_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'transactions', timestamps: true, underscored: true,
});

module.exports = Transaction;
