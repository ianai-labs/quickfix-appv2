const { Router } = require('express');
const ctrl = require('../controllers/adminController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { USER_ROLES } = require('../config/constants');

const router = Router();

// Pricing list is public (read-only, needed by create-order page)
router.get('/pricing', ctrl.listPricing);

// Admin-only routes
router.use(auth);
router.use(authorize(USER_ROLES.ADMIN));
router.put('/pricing/:id', ctrl.updatePricing);
router.get('/users', ctrl.listUsers);
router.get('/stats', ctrl.stats);

module.exports = router;
