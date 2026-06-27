const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');

const { User, Device, Customer, Technician } = require('../models');
const { generateDeviceId, getDeviceName } = require('../middleware/device');
const otpService = require('../services/otpService');
const { sendResetLink } = require('../services/emailService');
const {
  BCRYPT_SALT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
  RESET_TOKEN_EXPIRY_HOURS,
  USER_ROLES,
  OTP_TYPES,
} = require('../config/constants');

// ── Helpers ──

function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { user_id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

function setTokenCookies(res, accessToken, refreshToken) {
  const cookieOpts = {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
  res.cookie('token', accessToken, { ...cookieOpts, maxAge: 60 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

// ── Controllers ──

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { username, email, password, password_confirm, role } = req.body;

    // Validation
    if (!username || username.length < MIN_USERNAME_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Username minimal ${MIN_USERNAME_LENGTH} karakter.`,
      });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid.',
      });
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`,
      });
    }
    if (password !== password_confirm) {
      return res.status(400).json({
        success: false,
        message: 'Password dan konfirmasi password tidak cocok.',
      });
    }

    const userRole = role === USER_ROLES.TECHNICIAN ? USER_ROLES.TECHNICIAN : USER_ROLES.CUSTOMER;

    // Check duplicates
    const existing = await User.findOne({
      where: { email },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah digunakan.',
      });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan.',
      });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: userRole,
    });

    // Auto-create profile based on role
    if (userRole === USER_ROLES.CUSTOMER) {
      await Customer.create({ user_id: user.id });
    } else if (userRole === USER_ROLES.TECHNICIAN) {
      await Technician.create({ user_id: user.id, spesialisasi: '(isi nanti)' });
    }

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Silakan login.',
      data: {
        user_id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Flow: credentials → device check → OTP if new device → JWT
 */
async function login(req, res, next) {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email dan password wajib diisi.',
      });
    }

    // Find user by username OR email
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: login },
          { email: login },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username/email atau password salah.',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Akun dinonaktifkan. Hubungi admin.',
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Username/email atau password salah.',
      });
    }

    // ⭐ Device Tracking
    const deviceId = generateDeviceId(req);
    const deviceName = getDeviceName(req);

    const existingDevice = await Device.findOne({
      where: { user_id: user.id, device_id: deviceId },
    });

    if (existingDevice && existingDevice.is_verified) {
      // Known device — straight to JWT
      await existingDevice.update({ last_login: new Date() });

      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);
      setTokenCookies(res, accessToken, refreshToken);

      return res.json({
        success: true,
        message: 'Login berhasil.',
        data: {
          token: accessToken,
          refresh_token: refreshToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
          },
        },
      });
    }

    // New device — require OTP
    if (!existingDevice) {
      await Device.create({
        user_id: user.id,
        device_id: deviceId,
        device_name: deviceName,
        is_verified: false,
      });
    }

    // Send OTP
    const otpResult = await otpService.send(user.id, user.email, OTP_TYPES.DEVICE_VERIFY);

    // Issue a temp token for OTP verification
    const tempToken = jwt.sign(
      { user_id: user.id, device_id: deviceId, purpose: 'otp_verify' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    // Dev mode: include raw OTP code
    let devOtpCode = process.env.NODE_ENV === 'development' ? otpResult._code : null;

    return res.json({
      success: true,
      message: 'Device baru terdeteksi. Silakan verifikasi OTP yang dikirim ke email Anda.',
      data: {
        require_otp: true,
        temp_token: tempToken,
        device_name: deviceName,
        ...(devOtpCode && { dev_otp: devOtpCode }),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email wajib diisi.',
      });
    }

    // Prevent user enumeration — same response regardless
    const user = await User.findOne({ where: { email } });

    if (user && user.is_active) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      await user.update({
        reset_token: token,
        reset_expires: expires,
      });

      await sendResetLink(email, token);
    }

    return res.json({
      success: true,
      message: 'Jika email terdaftar, link reset password telah dikirim.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { token, password, password_confirm } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token reset tidak ditemukan.',
      });
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`,
      });
    }

    if (password !== password_confirm) {
      return res.status(400).json({
        success: false,
        message: 'Password dan konfirmasi password tidak cocok.',
      });
    }

    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token tidak valid atau sudah kadaluarsa.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    await user.update({
      password: hashedPassword,
      reset_token: null,
      reset_expires: null,
    });

    return res.json({
      success: true,
      message: 'Password berhasil direset. Silakan login.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/verify-device — verify OTP for new device
 */
async function verifyDevice(req, res, next) {
  try {
    const { temp_token, code } = req.body;

    if (!temp_token || !code) {
      return res.status(400).json({
        success: false,
        message: 'Token dan kode OTP wajib diisi.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(temp_token, process.env.JWT_SECRET);
    } catch (_e) {
      return res.status(400).json({
        success: false,
        message: 'Token verifikasi tidak valid atau kadaluarsa.',
      });
    }

    if (decoded.purpose !== 'otp_verify') {
      return res.status(400).json({
        success: false,
        message: 'Token tidak sesuai untuk verifikasi OTP.',
      });
    }

    // Verify OTP
    await otpService.verify(decoded.user_id, code, OTP_TYPES.DEVICE_VERIFY);

    // Mark device as verified
    await Device.update(
      { is_verified: true, last_login: new Date() },
      {
        where: {
          user_id: decoded.user_id,
          device_id: decoded.device_id,
        },
      }
    );

    // Get user and issue full JWT
    const user = await User.findByPk(decoded.user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    setTokenCookies(res, accessToken, refreshToken);

    return res.json({
      success: true,
      message: 'Verifikasi berhasil.',
      data: {
        token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me — current user info
 */
async function me(req, res, next) {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: ['id', 'username', 'email', 'role', 'avatar_url', 'created_at'],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    return res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/logout
 */
async function logout(req, res) {
  const clearOpts = { path: '/', sameSite: 'lax' };
  res.clearCookie('token', clearOpts);
  res.clearCookie('refreshToken', clearOpts);
  req.session?.destroy?.();

  // Browser request → redirect. API request → JSON.
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({ success: true, message: 'Logout berhasil.' });
  }
  return res.redirect('/');
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password, new_password_confirm } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi.' });
    if (new_password.length < MIN_PASSWORD_LENGTH) return res.status(400).json({ success: false, message: `Password minimal ${MIN_PASSWORD_LENGTH} karakter.` });
    if (new_password !== new_password_confirm) return res.status(400).json({ success: false, message: 'Password baru tidak cocok.' });

    const user = await User.findByPk(req.user.user_id);
    const valid = await bcrypt.compare(current_password, user.password);
    if (!valid) return res.status(400).json({ success: false, message: 'Password lama salah.' });

    user.password = await bcrypt.hash(new_password, BCRYPT_SALT_ROUNDS);
    await user.save();
    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (error) { next(error); }
}

async function refreshToken(req, res, next) {
  try {
    const refresh = req.cookies?.refreshToken;
    if (!refresh) return res.status(401).json({ success: false, message: 'Refresh token tidak ditemukan.', code: 'NO_REFRESH' });

    let decoded;
    try { decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET); }
    catch (_e) { return res.status(401).json({ success: false, message: 'Refresh token kadaluarsa.', code: 'REFRESH_EXPIRED' }); }

    const user = await User.findByPk(decoded.user_id);
    if (!user || !user.is_active) return res.status(401).json({ success: false, message: 'User tidak ditemukan.' });

    const accessToken = generateToken(user);
    const newRefresh = generateRefreshToken(user);
    setTokenCookies(res, accessToken, newRefresh);

    res.json({ success: true, message: 'Token diperbarui.', data: { token: accessToken } });
  } catch (error) { next(error); }
}

module.exports = { register, login, forgotPassword, resetPassword, verifyDevice, me, logout, changePassword, refreshToken };
