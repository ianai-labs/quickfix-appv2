const jwt = require('jsonwebtoken');

/**
 * Middleware: Verify JWT access token from Cookie or Authorization header.
 * On success, attaches `req.user` with { user_id, username, email, role }.
 */
function auth(req, res, next) {
  let token = null;

  // 1. Cek cookie dulu
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Cek Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Silakan login terlebih dahulu.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      user_id: decoded.user_id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesi telah berakhir. Silakan login kembali.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid.',
    });
  }
}

module.exports = auth;
