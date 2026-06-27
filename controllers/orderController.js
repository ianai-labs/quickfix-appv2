const { Op } = require('sequelize');
const { Order, Customer, Technician, User, OrderPhoto, sequelize } = require('../models');
const { assignTechnician } = require('../services/algorithm');
const { sendOrderNotification } = require('../services/emailService');
const { send: sendOTP } = require('../services/otpService');
const {
  ORDER_STATUS,
  USER_ROLES,
  OTP_TYPES,
  PAGINATION,
} = require('../config/constants');

// Valid status transitions
const VALID_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.ASSIGNED]: [ORDER_STATUS.ON_THE_WAY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.ON_THE_WAY]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.DONE, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DONE]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

// ── Helpers ──

function buildOrderResponse(order) {
  return {
    id: order.id,
    layanan: order.layanan,
    deskripsi: order.deskripsi,
    alamat: order.alamat,
    status: order.status,
    harga: order.harga,
    customer: order.Customer
      ? {
          id: order.Customer.id,
          nama: order.Customer.User?.username || '-',
          no_hp: order.Customer.no_hp || '-',
        }
      : null,
    technician: order.Technician
      ? {
          id: order.Technician.id,
          nama: order.Technician.User?.username || '-',
          spesialisasi: order.Technician.spesialisasi,
          rating: parseFloat(order.Technician.rating),
          no_hp: order.Technician.no_hp || '-',
          is_premium: order.Technician.is_premium,
        }
      : null,
    photos: (order.OrderPhotos || []).map((p) => ({
      id: p.id,
      url: p.photo_url,
      description: p.description,
    })),
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

const ORDER_INCLUDES = [
  {
    model: Customer,
    attributes: ['id', 'no_hp'],
    include: [{ model: User, attributes: ['username'] }],
  },
  {
    model: Technician,
    attributes: ['id', 'spesialisasi', 'rating', 'no_hp', 'is_premium'],
    include: [{ model: User, attributes: ['username'] }],
  },
  { model: OrderPhoto, attributes: ['id', 'photo_url', 'description'] },
];

// ── Controllers ──

/**
 * GET /api/orders
 * List orders — filtered by role:
 *   customer: only own orders
 *   technician: only assigned orders
 *   admin: all orders
 */
async function list(req, res, next) {
  try {
    const { role, user_id } = req.user;
    const page = Math.max(1, parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * limit;
    const status = req.query.status || null;

    const where = {};
    if (status) where.status = status;

    // Filter by role
    if (role === USER_ROLES.CUSTOMER) {
      const customer = await Customer.findOne({ where: { user_id } });
      where.customer_id = customer ? customer.id : 0;
    } else if (role === USER_ROLES.TECHNICIAN) {
      const technician = await Technician.findOne({ where: { user_id } });
      where.technician_id = technician ? technician.id : 0;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: ORDER_INCLUDES,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        orders: rows.map(buildOrderResponse),
        pagination: {
          page,
          limit,
          total_items: count,
          total_pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders/:id
 */
async function detail(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: ORDER_INCLUDES,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
    }

    // Authorization: customer hanya bisa lihat order sendiri
    if (req.user.role === USER_ROLES.CUSTOMER) {
      const customer = await Customer.findOne({ where: { user_id: req.user.user_id } });
      if (!customer || order.customer_id !== customer.id) {
        return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke order ini.' });
      }
    }

    res.json({ success: true, data: { order: buildOrderResponse(order) } });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/orders — Customer: create new order + auto-assign technician
 */
async function create(req, res, next) {
  try {
    if (req.user.role !== USER_ROLES.CUSTOMER) {
      return res.status(403).json({ success: false, message: 'Hanya customer yang dapat membuat order.' });
    }

    const { layanan, deskripsi, alamat } = req.body;

    if (!layanan || !alamat) {
      return res.status(400).json({
        success: false,
        message: 'Layanan dan alamat wajib diisi.',
      });
    }

    const customer = await Customer.findOne({ where: { user_id: req.user.user_id } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Profil customer tidak ditemukan.' });
    }

    // Create order
    const order = await Order.create({
      customer_id: customer.id,
      layanan,
      deskripsi: deskripsi || null,
      alamat,
      status: ORDER_STATUS.PENDING,
    });

    // ⭐ Algorithm: Auto-assign technician
    const tech = await assignTechnician(order);
    let assignedTech = null;

    if (tech) {
      await order.update({
        technician_id: tech.id,
        status: ORDER_STATUS.ASSIGNED,
      });

      assignedTech = await Technician.findByPk(tech.id, {
        include: [{ model: User, attributes: ['username', 'email'] }],
      });

      // Send notification to customer
      const user = await User.findByPk(req.user.user_id);
      if (user) {
        await sendOrderNotification(user.email, order, assignedTech);
      }
    }

    // Reload with includes
    const fullOrder = await Order.findByPk(order.id, { include: ORDER_INCLUDES });

    res.status(201).json({
      success: true,
      message: assignedTech ? 'Order berhasil dibuat dan teknisi telah di-assign.' : 'Order dibuat. Menunggu teknisi tersedia.',
      data: {
        order: buildOrderResponse(fullOrder),
        assigned_by_algorithm: !!assignedTech,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/orders/:id — Update order status with state machine validation.
 * Only assigned technician or admin can update.
 */
async function update(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
    }

    const { role, user_id } = req.user;
    const { status, harga, otp_code: _otpCode } = req.body;

    // Authorization: only admin or assigned technician can update
    const isAdmin = role === USER_ROLES.ADMIN;
    let isAssignedTech = false;

    if (role === USER_ROLES.TECHNICIAN) {
      const tech = await Technician.findOne({ where: { user_id } });
      isAssignedTech = tech && tech.id === order.technician_id;
    }

    if (!isAdmin && !isAssignedTech) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk mengupdate order ini.',
      });
    }

    // State machine validation
    if (status && !isAdmin) {
      const allowed = VALID_TRANSITIONS[order.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Tidak dapat mengubah status dari "${order.status}" ke "${status}".`,
        });
      }
    }

    // Build update data
    const updateData = {};

    if (status) {
      updateData.status = status;

      // Send OTP when technician goes on_the_way
      if (status === ORDER_STATUS.ON_THE_WAY && isAssignedTech) {
        const customer = await Customer.findByPk(order.customer_id);
        if (customer) {
          const customerUser = await User.findByPk(customer.user_id);
          if (customerUser) {
            await sendOTP(customerUser.id, customerUser.email, OTP_TYPES.ORDER_VERIFY);
          }
        }
      }

      // Increment total_jobs only on first transition to DONE
      if (status === ORDER_STATUS.DONE && order.status !== ORDER_STATUS.DONE && order.technician_id) {
        await Technician.increment('total_jobs', {
          where: { id: order.technician_id },
        });
      }
    }

    // Only admin can set harga, with validation
    if (harga !== undefined) {
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Hanya admin yang dapat mengatur harga.',
        });
      }
      const hargaNum = parseFloat(harga);
      if (isNaN(hargaNum) || hargaNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'Harga harus berupa angka positif.',
        });
      }
      updateData.harga = hargaNum;
    }

    await order.update(updateData);

    const fullOrder = await Order.findByPk(order.id, { include: ORDER_INCLUDES });

    res.json({
      success: true,
      message: 'Order berhasil diperbarui.',
      data: { order: buildOrderResponse(fullOrder) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/orders/:id/assign — Re-assign technician (after reject)
 */
async function reassign(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
    }

    // Exclude current technician from pool
    const tech = await assignTechnician(order);
    if (!tech || tech.id === order.technician_id) {
      return res.json({
        success: true,
        message: 'Tidak ada teknisi lain yang tersedia saat ini.',
        data: { technician: null },
      });
    }

    await order.update({ technician_id: tech.id, status: ORDER_STATUS.ASSIGNED });

    const fullTech = await Technician.findByPk(tech.id, {
      include: [{ model: User, attributes: ['username'] }],
    });

    res.json({
      success: true,
      message: 'Teknisi baru berhasil di-assign.',
      data: { technician: { id: fullTech.id, nama: fullTech.User?.username, spesialisasi: fullTech.spesialisasi } },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, detail, create, update, reassign };
