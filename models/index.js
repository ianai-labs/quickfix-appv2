const User = require('./User');
const Device = require('./Device');
const Customer = require('./Customer');
const Technician = require('./Technician');
const Order = require('./Order');
const OrderPhoto = require('./OrderPhoto');
const OtpCode = require('./OtpCode');

// ── User → Device (1:N) ──
User.hasMany(Device, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Device.belongsTo(User, { foreignKey: 'user_id' });

// ── User → Customer (1:1) ──
User.hasOne(Customer, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Customer.belongsTo(User, { foreignKey: 'user_id' });

// ── User → Technician (1:1) ──
User.hasOne(Technician, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Technician.belongsTo(User, { foreignKey: 'user_id' });

// ── Customer → Order (1:N) ──
Customer.hasMany(Order, { foreignKey: 'customer_id', onDelete: 'CASCADE' });
Order.belongsTo(Customer, { foreignKey: 'customer_id' });

// ── Technician → Order (1:N) ──
Technician.hasMany(Order, { foreignKey: 'technician_id', onDelete: 'SET NULL' });
Order.belongsTo(Technician, { foreignKey: 'technician_id' });

// ── Order → OrderPhoto (1:N) ──
Order.hasMany(OrderPhoto, { foreignKey: 'order_id', onDelete: 'CASCADE' });
OrderPhoto.belongsTo(Order, { foreignKey: 'order_id' });

// ── User → OrderPhoto (1:N) ──
User.hasMany(OrderPhoto, { foreignKey: 'uploaded_by', onDelete: 'CASCADE' });
OrderPhoto.belongsTo(User, { foreignKey: 'uploaded_by' });

// ── User → OtpCode (1:N) ──
User.hasMany(OtpCode, { foreignKey: 'user_id', onDelete: 'CASCADE' });
OtpCode.belongsTo(User, { foreignKey: 'user_id' });

const Transaction = require('./Transaction');
const Review = require('./Review');
const ServicePricing = require('./ServicePricing');

// ── Order → Transaction (1:1) ──
Order.hasOne(Transaction, { foreignKey: 'order_id', onDelete: 'CASCADE' });
Transaction.belongsTo(Order, { foreignKey: 'order_id' });

// ── Order → Review (1:N) ──
Order.hasMany(Review, { foreignKey: 'order_id', onDelete: 'CASCADE' });
Review.belongsTo(Order, { foreignKey: 'order_id' });

// ── User → Review (as reviewer) ──
User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'givenReviews' });
Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });

// ── User → Review (as reviewee) ──
User.hasMany(Review, { foreignKey: 'reviewee_id', as: 'receivedReviews' });
Review.belongsTo(User, { foreignKey: 'reviewee_id', as: 'reviewee' });

module.exports = {
  User, Device, Customer, Technician, Order, OrderPhoto, OtpCode,
  Transaction, Review, ServicePricing,
};
