const { Technician, User } = require('../models');
const { TECH_STATUS, USER_ROLES } = require('../config/constants');

const TECH_INCLUDES = [
  { model: User, attributes: ['id', 'username', 'email', 'avatar_url'] },
];

function buildTechResponse(tech) {
  return {
    id: tech.id,
    user_id: tech.user_id,
    nama: tech.User?.username || '-',
    email: tech.User?.email || '-',
    spesialisasi: tech.spesialisasi,
    rating: parseFloat(tech.rating),
    is_premium: tech.is_premium,
    status: tech.status,
    total_jobs: tech.total_jobs,
    no_hp: tech.no_hp,
    created_at: tech.created_at,
  };
}

/**
 * GET /api/technicians
 */
async function list(req, res, next) {
  try {
    const status = req.query.status || null;
    const where = {};
    if (status) where.status = status;

    const techs = await Technician.findAll({
      where,
      include: TECH_INCLUDES,
      order: [['is_premium', 'DESC'], ['rating', 'DESC']],
    });

    res.json({
      success: true,
      data: { technicians: techs.map(buildTechResponse) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/technicians/:id
 */
async function detail(req, res, next) {
  try {
    const tech = await Technician.findByPk(req.params.id, { include: TECH_INCLUDES });

    if (!tech) {
      return res.status(404).json({ success: false, message: 'Teknisi tidak ditemukan.' });
    }

    res.json({ success: true, data: { technician: buildTechResponse(tech) } });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/technicians/:id — Admin: update teknisi
 */
async function update(req, res, next) {
  try {
    const tech = await Technician.findByPk(req.params.id);
    if (!tech) {
      return res.status(404).json({ success: false, message: 'Teknisi tidak ditemukan.' });
    }

    const allowedFields = ['spesialisasi', 'rating', 'is_premium', 'no_hp'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // Validate rating range
        if (field === 'rating') {
          const rating = parseFloat(req.body.rating);
          if (isNaN(rating) || rating < 0 || rating > 5.0) {
            return res.status(400).json({
              success: false,
              message: 'Rating harus antara 0.0 dan 5.0.',
            });
          }
          updateData.rating = rating;
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data yang diupdate.' });
    }

    await tech.update(updateData);

    const updated = await Technician.findByPk(tech.id, { include: TECH_INCLUDES });

    res.json({
      success: true,
      message: 'Data teknisi berhasil diperbarui.',
      data: { technician: buildTechResponse(updated) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/technicians/:id/status — Technician: update own status
 */
async function updateStatus(req, res, next) {
  try {
    // Find technician profile for current user
    const tech = await Technician.findOne({ where: { user_id: req.user.user_id } });
    if (!tech) {
      return res.status(404).json({ success: false, message: 'Profil teknisi tidak ditemukan.' });
    }

    // Ensure only self or admin
    if (tech.id !== parseInt(req.params.id, 10) && req.user.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Tidak diizinkan.' });
    }

    const { status } = req.body;
    if (!Object.values(TECH_STATUS).includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }

    await tech.update({ status });

    res.json({
      success: true,
      message: `Status berhasil diubah ke ${status}.`,
      data: { technician: buildTechResponse({ ...tech.dataValues, status }) },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, detail, update, updateStatus };
