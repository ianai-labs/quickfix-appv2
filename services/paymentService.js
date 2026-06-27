const { snap } = require('../config/midtrans');
const { Transaction, Order, ServicePricing } = require('../models');

async function createTransaction(order, customer) {
  // Idempotency: prevent duplicate transactions
  const existing = await Transaction.findOne({ where: { order_id: order.id } });
  if (existing) return { transaction: existing, snapToken: existing.midtrans_token, amount: parseFloat(existing.amount), commission: parseFloat(existing.commission), netAmount: parseFloat(existing.net_amount), midtransError: null };

  const pricing = await ServicePricing.findOne({ where: { service_name: order.layanan, is_active: true } });
  const basePrice = pricing ? parseFloat(pricing.base_price) : 100000;
  const commissionRate = pricing ? parseFloat(pricing.commission_rate) : 0.10;

  const amount = basePrice;
  const commission = Math.round(amount * commissionRate);
  const netAmount = amount - commission;

  const orderId = `QF-${order.id}-${Date.now()}`;

  const midtransPayload = {
    transaction_details: { order_id: orderId, gross_amount: amount },
    customer_details: {
      first_name: customer.username || 'Customer',
      email: customer.email || 'customer@quickfix.local',
      phone: customer.no_hp || '08123456789',
    },
    item_details: [{
      id: order.layanan, price: amount, quantity: 1,
      name: `Jasa ${order.layanan}`, category: 'Home Repair',
    }],
  };

  let snapToken = null;
  let midtransError = null;

  try {
    const response = await snap.createTransaction(midtransPayload);
    snapToken = response.token;
  } catch (err) {
    midtransError = err.message;
    console.warn('[PAYMENT] Midtrans Snap failed:', err.message);
  }

  const transaction = await Transaction.create({
    order_id: order.id,
    amount,
    commission,
    net_amount: netAmount,
    midtrans_id: orderId,
    midtrans_token: snapToken,
    status: 'unpaid',
  });

  return {
    transaction,
    snapToken,
    amount,
    commission,
    netAmount,
    midtransError,
  };
}

async function getTransaction(orderId) {
  return Transaction.findOne({ where: { order_id: orderId } });
}

async function markAsPaid(orderId, paymentMethod, paymentChannel) {
  const txn = await Transaction.findOne({ where: { order_id: orderId } });
  if (!txn) return null;
  await txn.update({ status: 'paid', payment_method: paymentMethod, payment_channel: paymentChannel, paid_at: new Date() });
  return txn;
}

async function releasePayment(orderId) {
  const txn = await Transaction.findOne({ where: { order_id: orderId } });
  if (!txn || txn.status !== 'paid') return null;
  await txn.update({ status: 'released', released_at: new Date() });
  return txn;
}

async function refundPayment(orderId) {
  const txn = await Transaction.findOne({ where: { order_id: orderId } });
  if (!txn || txn.status === 'released') return null;
  await txn.update({ status: 'refunded' });
  return txn;
}

module.exports = { createTransaction, getTransaction, markAsPaid, releasePayment, refundPayment };
