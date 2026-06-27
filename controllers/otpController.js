const jwt = require('jsonwebtoken');
const { User, Device } = require('../models');
const otpService = require('../services/otpService');
const { OTP_TYPES } = require('../config/constants');

/**
 * POST /api/otp/send — Resend OTP
 */
async function send(req, res, next) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token verifikasi diperlukan.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_e) {
      return res.status(400).json({ success: false, message: 'Token tidak valid atau kadaluarsa.' });
    }

    const user = await User.findByPk(decoded.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    const result = await otpService.send(user.id, user.email, OTP_TYPES.DEVICE_VERIFY);

    res.json({ success: true, message: 'Kode OTP telah dikirim ulang.', data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/otp/verify — Generic OTP verification
 */
async function verify(req, res, next) {
  try {
    const { token, code, type } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Kode OTP wajib diisi.' });
    }

    const otpType = type || OTP_TYPES.DEVICE_VERIFY;

    // If token provided, decode user_id from it
    let userId;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.user_id;
      } catch (_e) {
        return res.status(400).json({ success: false, message: 'Token tidak valid.' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Token verifikasi diperlukan.' });
    }

    await otpService.verify(userId, code, otpType);

    res.json({ success: true, message: 'OTP berhasil diverifikasi.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { send, verify };
