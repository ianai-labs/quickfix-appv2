const { Router } = require('express');
const ctrl = require('../controllers/technicianController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { USER_ROLES } = require('../config/constants');

const router = Router();

router.use(auth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.detail);
router.put('/:id', authorize(USER_ROLES.ADMIN), ctrl.update);
router.put('/:id/status', authorize(USER_ROLES.TECHNICIAN, USER_ROLES.ADMIN), ctrl.updateStatus);

module.exports = router;
