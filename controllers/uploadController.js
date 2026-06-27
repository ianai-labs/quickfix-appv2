const { Order, OrderPhoto, Customer, Technician } = require('../models');
const { uploadPhoto } = require('../services/cloudinaryService');
const { USER_ROLES } = require('../config/constants');

/**
 * POST /api/upload — Upload foto ke Cloudinary
 * Only: order's customer, assigned technician, or admin
 */
async function upload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File tidak ditemukan. Pilih file gambar (JPG/PNG/WEBP).',
      });
    }

    const { order_id, description } = req.body;

    if (!order_id || !/^\d+$/.test(order_id)) {
      return res.status(400).json({
        success: false,
        message: 'ID order tidak valid.',
      });
    }

    const order = await Order.findByPk(parseInt(order_id, 10));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
    }

    // Authorization: order owner, assigned tech, or admin
    const { role, user_id } = req.user;
    let authorized = role === USER_ROLES.ADMIN;

    if (role === USER_ROLES.CUSTOMER) {
      const customer = await Customer.findOne({ where: { user_id } });
      authorized = customer && customer.id === order.customer_id;
    } else if (role === USER_ROLES.TECHNICIAN) {
      const tech = await Technician.findOne({ where: { user_id } });
      authorized = tech && tech.id === order.technician_id;
    }

    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk mengupload foto ke order ini.',
      });
    }

    const result = await uploadPhoto(req.file.path, order.id);

    const photo = await OrderPhoto.create({
      order_id: order.id,
      photo_url: result.url,
      uploaded_by: user_id,
      description: description || null,
    });

    res.status(201).json({
      success: true,
      message: 'Foto berhasil diupload.',
      data: {
        photo: {
          id: photo.id,
          url: photo.photo_url,
          description: photo.description,
          uploaded_at: photo.uploaded_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { upload };
