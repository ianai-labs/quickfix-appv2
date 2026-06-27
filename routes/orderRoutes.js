const { Router } = require('express');
const ctrl = require('../controllers/orderController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { USER_ROLES } = require('../config/constants');

const router = Router();

router.use(auth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.detail);
router.post('/', authorize(USER_ROLES.CUSTOMER), ctrl.create);
router.put('/:id', authorize(USER_ROLES.ADMIN, USER_ROLES.TECHNICIAN), ctrl.update);
router.put('/:id/assign', authorize(USER_ROLES.ADMIN, USER_ROLES.TECHNICIAN), ctrl.reassign);

module.exports = router;
