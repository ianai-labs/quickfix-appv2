const { Router } = require('express');
const ctrl = require('../controllers/authController');
const auth = require('../middleware/auth');
const { deviceInfo } = require('../middleware/device');

// Rate limiters — ketat untuk endpoint sensitif
const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV === 'development';

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 100 : 10,
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi 1 menit.' },
});

const registerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 50 : 5,
  message: { success: false, message: 'Terlalu banyak registrasi. Coba lagi 1 menit.' },
});

const forgotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Terlalu banyak request. Coba lagi 1 menit.' },
});

const router = Router();

// ── Public ──
router.post('/register', registerLimiter, ctrl.register);
router.post('/login', loginLimiter, deviceInfo, ctrl.login);
router.post('/forgot-password', forgotLimiter, ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
router.post('/verify-device', ctrl.verifyDevice);

// ── Protected ──
router.get('/me', auth, ctrl.me);
router.put('/change-password', auth, ctrl.changePassword);
router.post('/refresh', ctrl.refreshToken);
router.get('/logout', ctrl.logout);
router.post('/logout', auth, ctrl.logout);

module.exports = router;
