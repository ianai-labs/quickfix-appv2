const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ServicePricing = sequelize.define('ServicePricing', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  service_name: { type: DataTypes.STRING(100), allowNull: false },
  base_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  commission_rate: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0.10 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'service_pricing', timestamps: true, underscored: true,
});

module.exports = ServicePricing;
