const crypto = require('crypto');

/**
 * Generate a unique Device ID from request metadata.
 * Formula: SHA256(user-agent + client-IP + secret)
 */
function generateDeviceId(req) {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
  const secret = process.env.DEVICE_SECRET;

  if (!secret) {
    console.warn('[DEVICE] DEVICE_SECRET not set — device IDs will use fallback');
    return crypto.createHash('sha256').update(`${userAgent}|${ip}`).digest('hex');
  }

  return crypto
    .createHash('sha256')
    .update(`${userAgent}|${ip}|${secret}`)
    .digest('hex');
}

/**
 * Return a human-readable device name from user-agent.
 */
function getDeviceName(req) {
  const ua = (req.headers['user-agent'] || '').toLowerCase();

  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os') || ua.includes('macintosh')) return 'MacOS';
  if (ua.includes('linux')) return 'Linux';
  return 'Unknown';
}

/**
 * Middleware: Attach device info to request (does NOT block).
 * Always runs — actual device check logic is in authController.login().
 */
function deviceInfo(req, res, next) {
  req.deviceId = generateDeviceId(req);
  req.deviceName = getDeviceName(req);
  next();
}

module.exports = { generateDeviceId, getDeviceName, deviceInfo };
