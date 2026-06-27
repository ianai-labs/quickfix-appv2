const multer = require('multer');
const path = require('path');
const { MAX_FILE_SIZE } = require('../config/constants');

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    cb(null, `temp_${unique}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Hanya file JPG, PNG, dan WEBP yang diizinkan.');
    err.statusCode = 400;
    cb(err, false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = upload;
