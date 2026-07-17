const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/orderController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { USER_ROLES } = require('../config/constants');

const resendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => String(req.user?.user_id ?? req.ip),
  message: { success: false, message: 'Terlalu banyak permintaan OTP. Coba lagi 5 menit.' },
});

const router = Router();

router.use(auth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.detail);
router.post('/', authorize(USER_ROLES.CUSTOMER), ctrl.create);
router.put('/:id', ctrl.update);
router.put('/:id/assign', authorize(USER_ROLES.ADMIN, USER_ROLES.TECHNICIAN), ctrl.reassign);
router.post('/:id/resend-otp', resendLimiter, ctrl.resendOtp);

module.exports = router;
