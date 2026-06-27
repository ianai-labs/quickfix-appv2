const { Router } = require('express');
const ctrl = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const router = Router();

router.post('/', auth, ctrl.create);
router.get('/order/:id', auth, ctrl.listByOrder);

module.exports = router;
