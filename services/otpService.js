const crypto = require('crypto');
const { Op } = require('sequelize');
const { OtpCode } = require('../models');
const { sendOTP } = require('./emailService');
const { OTP_EXPIRY_SECONDS } = require('../config/constants');

function generateCode() { return String(Math.floor(100000 + Math.random() * 900000)); }
function hashCode(code) { return crypto.createHash('sha256').update(code).digest('hex'); }

async function send(userId, email, type) {
  await OtpCode.update({ used: true }, { where: { user_id: userId, type, used: false } });
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
  await OtpCode.create({ user_id: userId, code: hashCode(code), type, expires_at: expiresAt });
  const sent = await sendOTP(email, code, type);
  if (!sent) console.warn(`[OTP] Email not sent for user ${userId}`);
  // Show OTP in response if dev mode, demo mode, or SMTP not configured
  const isDemo = process.env.NODE_ENV === 'development'
    || process.env.DEMO_MODE === 'true'
    || (!process.env.SMTP_USER || !process.env.SMTP_PASS);
  return { success: true, expires_in: OTP_EXPIRY_SECONDS, ...(isDemo ? { _code: code } : {}) };
}

async function verify(userId, code, type) {
  const hashed = hashCode(code);
  const otp = await OtpCode.findOne({ where: { user_id: userId, code: hashed, type, used: false }, order: [['created_at', 'DESC']] });
  if (!otp) { const error = new Error('Kode OTP tidak valid.'); error.statusCode = 400; throw error; }
  if (new Date() > new Date(otp.expires_at)) { otp.used = true; await otp.save(); const error = new Error('Kode OTP sudah kadaluarsa.'); error.statusCode = 400; throw error; }
  otp.used = true; await otp.save();
  return true;
}

// also export generateCode for dev mode OTP display
module.exports = { send, verify, generateCode };
