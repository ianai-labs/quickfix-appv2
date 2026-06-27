const { Router } = require('express');
const ctrl = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const router = Router();

const authorize = require('../middleware/role');
const { USER_ROLES } = require('../config/constants');

router.post('/checkout/:id', auth, ctrl.checkout);
router.get('/status/:id', auth, ctrl.status);
router.post('/release/:id', auth, authorize(USER_ROLES.ADMIN), ctrl.release);
router.post('/webhook', ctrl.webhook);

module.exports = router;
