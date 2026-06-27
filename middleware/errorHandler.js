/**
 * Global error handler middleware — Express 4 signature.
 * Standardizes all error responses to { success, message, errors }.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log full error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${statusCode} — ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Terjadi kesalahan pada server.' : message,
    ...(process.env.NODE_ENV === 'development' && { errors: [err.message] }),
  });
}

module.exports = errorHandler;
