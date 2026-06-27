const { Router } = require('express');
const ctrl = require('../controllers/adminController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { USER_ROLES } = require('../config/constants');

const router = Router();
router.use(auth);
router.use(authorize(USER_ROLES.ADMIN));

router.get('/pricing', ctrl.listPricing);
router.put('/pricing/:id', ctrl.updatePricing);
router.get('/users', ctrl.listUsers);

module.exports = router;
