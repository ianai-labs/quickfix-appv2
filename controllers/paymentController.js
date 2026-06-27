const { Order, Customer, Technician } = require('../models');
const { createTransaction, getTransaction, releasePayment: releasePmt, markAsPaid, refundPayment } = require('../services/paymentService');
const { USER_ROLES } = require('../config/constants');

async function checkout(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Customer, include: [{ model: User, attributes: ['username', 'email'] }] }],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });

    // Only the order's customer can checkout
    const customer = order.Customer;
    if (!customer || customer.user_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Hanya pemilik order yang dapat melakukan pembayaran.' });
    }

    const user = customer.User;

    const result = await createTransaction(order, { username: user?.username, email: user?.email, no_hp: customer?.no_hp });

    res.json({
      success: true,
      data: {
        transaction_id: result.transaction.id,
        snap_token: result.snapToken,
        amount: result.amount,
        commission: result.commission,
        net_amount: result.netAmount,
        midtrans_error: result.midtransError || null,
      },
    });
  } catch (error) { next(error); }
}

async function status(req, res, next) {
  try {
    const txn = await getTransaction(req.params.id);
    if (!txn) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    // Only return non-sensitive fields for non-owner
    const order = await Order.findByPk(txn.order_id, { include: [{ model: Customer, attributes: ['user_id'] }] });
    const isOwner = order?.Customer?.user_id === req.user.user_id;
    const isAdmin = req.user.role === USER_ROLES.ADMIN;
    res.json({ success: true, data: { transaction: { id: txn.id, order_id: txn.order_id, amount: txn.amount, status: txn.status, payment_method: txn.payment_method, ...(isOwner || isAdmin ? { commission: txn.commission, net_amount: txn.net_amount, midtrans_id: txn.midtrans_id, paid_at: txn.paid_at, released_at: txn.released_at } : {}) } } });
  } catch (error) { next(error); }
}

async function release(req, res, next) {
  try {
    const txn = await releasePmt(req.params.id);
    if (!txn) return res.status(400).json({ success: false, message: 'Transaksi tidak dapat di-release.' });
    res.json({ success: true, message: 'Pembayaran berhasil dilepas ke teknisi.', data: { transaction: txn } });
  } catch (error) { next(error); }
}

// Simulated webhook — production: verify Midtrans signature
async function webhook(req, res, next) {
  try {
    const { order_id, transaction_status, payment_type, va_numbers, bank } = req.body || {};

    if (!order_id) return res.status(400).json({ success: false, message: 'Missing order_id' });

    const parts = order_id.split('-');
    const orderId = parseInt(parts[1], 10);
    if (!orderId) return res.status(400).json({ success: false, message: 'Invalid order_id format' });

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      const channel = payment_type === 'bank_transfer' ? (va_numbers?.[0]?.bank || bank || 'bank_transfer') : payment_type;
      await markAsPaid(orderId, payment_type, channel || payment_type);
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      await refundPayment(orderId);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) { next(error); }
}

module.exports = { checkout, status, release, webhook };
