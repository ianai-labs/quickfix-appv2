const { Router } = require('express');
const ctrl = require('../controllers/uploadController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = Router();

router.use(auth);
router.post('/', upload.single('photo'), ctrl.upload);

module.exports = router;
