const { Router } = require('express');
const ctrl = require('../controllers/otpController');
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Terlalu banyak percobaan OTP. Coba lagi 5 menit.' },
});

const router = Router();

router.post('/send', otpLimiter, ctrl.send);
router.post('/verify', otpLimiter, ctrl.verify);

module.exports = router;
