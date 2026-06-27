const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'orders', key: 'id' } },
  reviewer_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
  reviewee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
  rating: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'reviews', timestamps: true, underscored: true, createdAt: 'created_at', updatedAt: false,
});

module.exports = Review;
