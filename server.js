require('dotenv').config();

const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const { sequelize, connectWithRetry } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const viewRoutes = require('./routes/viewRoutes');

// ── App Init ──
const app = express();
const PORT = process.env.PORT || 3000;

// ── View Engine ──
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.use(expressLayouts);

// ── Security ──
app.use(helmet({ contentSecurityPolicy: false }));
app.set('trust proxy', 1);

// ── Body Parsing ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Static Assets ──
app.use(express.static(path.join(__dirname, 'public')));

// ── Session + Flash ──
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(flash());

// ── Rate Limiting (API only) ──
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Terlalu banyak request. Coba lagi nanti.' },
}));

// ── JWT Decode (views only, non-blocking) ──
app.use((req, _res, next) => {
  req.user = null;
  if (req.cookies?.token) {
    try { req.user = jwt.verify(req.cookies.token, process.env.JWT_SECRET); }
    catch (_e) { /* token invalid — user stays null */ }
  }
  next();
});

// ── Health Check ──
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Quickfix App v2 running', timestamp: new Date().toISOString() });
});

// ── API Routes ──
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/technicians', require('./routes/technicianRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/otp', require('./routes/otpRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ── View Routes ──
app.use('/', viewRoutes());

// ── 404 ──
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' });
  }
  res.status(404).render('error', { title: '404', message: 'Halaman tidak ditemukan.' });
});

// ── Error Handler ──
app.use(errorHandler);

// ── Start ──
async function start() {
  try {
    await connectWithRetry();

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync();
      console.log('✅ Database synced');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Quickfix App v2 → http://localhost:${PORT}`);
      console.log(`📋 ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
}

start();

module.exports = app;
