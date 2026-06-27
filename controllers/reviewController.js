const { Review, Order, Technician, User } = require('../models');

async function create(req, res, next) {
  try {
    const { order_id, rating, comment } = req.body;
    const reviewerId = req.user.user_id;

    if (!order_id || !rating) return res.status(400).json({ success: false, message: 'Order ID dan rating wajib diisi.' });
    if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating harus antara 1-5.' });

    const order = await Order.findByPk(order_id);
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
    if (order.status !== 'done') return res.status(400).json({ success: false, message: 'Review hanya bisa diberikan setelah order selesai.' });

    // Determine reviewee
    let revieweeId;
    if (order.customer_id) {
      const { Customer } = require('../models');
      const cust = await Customer.findByPk(order.customer_id);
      if (cust && cust.user_id === reviewerId) {
        // Customer reviews technician
        const tech = order.technician_id ? await Technician.findByPk(order.technician_id) : null;
        if (!tech) return res.status(400).json({ success: false, message: 'Teknisi tidak ditemukan.' });
        revieweeId = tech.user_id;
      }
    }
    if (!revieweeId && order.technician_id) {
      const tech = await Technician.findByPk(order.technician_id);
      if (tech && tech.user_id === reviewerId) {
        // Technician reviews customer
        const { Customer } = require('../models');
        const cust = await Customer.findByPk(order.customer_id);
        if (!cust) return res.status(400).json({ success: false, message: 'Customer tidak ditemukan.' });
        revieweeId = cust.user_id;
      }
    }
    if (!revieweeId) return res.status(400).json({ success: false, message: 'Tidak dapat menentukan penerima review.' });

    // Prevent duplicate
    const existing = await Review.findOne({ where: { order_id, reviewer_id: reviewerId } });
    if (existing) return res.status(400).json({ success: false, message: 'Anda sudah memberikan review untuk order ini.' });

    const review = await Review.create({ order_id, reviewer_id: reviewerId, reviewee_id: revieweeId, rating, comment });

    // Update technician avg rating
    const tech = await Technician.findOne({ where: { user_id: revieweeId } });
    if (tech) {
      const { avg } = await Review.findOne({
        where: { reviewee_id: revieweeId },
        attributes: [[require('sequelize').fn('AVG', require('sequelize').col('rating')), 'avg']],
        raw: true,
      }) || {};
      if (avg) await tech.update({ rating: Math.round(parseFloat(avg) * 10) / 10 });
    }

    res.status(201).json({ success: true, message: 'Review berhasil disimpan.', data: { review } });
  } catch (error) { next(error); }
}

async function listByOrder(req, res, next) {
  try {
    const reviews = await Review.findAll({
      where: { order_id: req.params.id },
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'username'] },
        { model: User, as: 'reviewee', attributes: ['id', 'username'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: { reviews } });
  } catch (error) { next(error); }
}

module.exports = { create, listByOrder };
