const { Op } = require('sequelize');
const { OtpCode } = require('../models');
const { sendOTP } = require('./emailService');
const { OTP_EXPIRY_SECONDS } = require('../config/constants');

/**
 * Generate a random 6-digit OTP code.
 */
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Send OTP to user. Invalidates any unused OTP of the same type first.
 * Returns { success, expires_in }.
 */
async function send(userId, email, type) {
  // Invalidate previous unused codes of same type
  await OtpCode.update(
    { used: true },
    { where: { user_id: userId, type, used: false } }
  );

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

  await OtpCode.create({
    user_id: userId,
    code,
    type,
    expires_at: expiresAt,
  });

  const sent = await sendOTP(email, code, type);

  if (!sent) {
    console.warn(`[OTP] Email not sent, but code stored for user ${userId}`);
  }

  return { success: true, expires_in: OTP_EXPIRY_SECONDS };
}

/**
 * Verify OTP. On success, marks the code as used.
 * Throws on invalid/expired code.
 */
async function verify(userId, code, type) {
  const otp = await OtpCode.findOne({
    where: {
      user_id: userId,
      code,
      type,
      used: false,
    },
    order: [['created_at', 'DESC']],
  });

  if (!otp) {
    const error = new Error('Kode OTP tidak valid.');
    error.statusCode = 400;
    throw error;
  }

  if (new Date() > new Date(otp.expires_at)) {
    otp.used = true;
    await otp.save();
    const error = new Error('Kode OTP sudah kadaluarsa.');
    error.statusCode = 400;
    throw error;
  }

  otp.used = true;
  await otp.save();

  return true;
}

/**
 * Cleanup expired OTP codes older than 24 hours.
 */
async function cleanup() {
  const deleted = await OtpCode.destroy({
    where: {
      created_at: {
        [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });
  if (deleted > 0) console.log(`[OTP] Cleaned up ${deleted} expired codes`);
}

module.exports = { send, verify, generateCode, cleanup };
