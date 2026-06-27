const { Router } = require('express');

module.exports = function viewRoutes() {
  const router = Router();

  // Redirect logged-in users to their dashboard, otherwise show login
  function guestOnly(req, res, next) {
    if (req.user) {
      const dash = { admin: '/admin/dashboard', technician: '/technician/dashboard', customer: '/customer/dashboard' };
      return res.redirect(dash[req.user.role] || '/customer/dashboard');
    }
    next();
  }

  // Redirect to login if no JWT cookie
  function requireAuth(req, res, next) {
    if (!req.user) return res.redirect('/');
    next();
  }

  // ── Public (guest only) ──
  router.get('/', guestOnly, (_req, res) => {
    res.render('auth/login', { title: 'Login — Quickfix', user: null, message: null, captcha: null });
  });

  router.get('/register', guestOnly, (_req, res) => {
    res.render('auth/register', { title: 'Register — Quickfix', user: null, message: null });
  });

  router.get('/forgot-password', guestOnly, (_req, res) => {
    res.render('auth/forgot-password', { title: 'Lupa Password — Quickfix', user: null, message: null });
  });

  router.get('/reset-password', guestOnly, (req, res) => {
    res.render('auth/reset-password', {
      title: 'Reset Password — Quickfix',
      user: null, message: null,
      token: req.query.token || '',
    });
  });

  // ── Customer ──
  router.get('/customer/dashboard', requireAuth, (req, res) => {
    res.render('customer/dashboard', { title: 'Dashboard — Quickfix', user: req.user, active: 'dashboard', message: null });
  });

  router.get('/customer/orders/new', requireAuth, (req, res) => {
    res.render('customer/create-order', { title: 'Buat Order — Quickfix', user: req.user, active: 'new-order', message: null });
  });

  router.get('/customer/orders/:id', requireAuth, (req, res) => {
    res.render('customer/order-detail', { title: 'Detail Order — Quickfix', user: req.user, active: 'dashboard', message: null });
  });

  // ── Technician ──
  router.get('/technician/dashboard', requireAuth, (req, res) => {
    res.render('technician/dashboard', { title: 'Job Queue — Quickfix', user: req.user, active: 'dashboard', message: null });
  });

  router.get('/technician/jobs/:id', requireAuth, (req, res) => {
    res.render('technician/job-detail', { title: 'Detail Job — Quickfix', user: req.user, active: 'dashboard', message: null });
  });

  router.get('/technician/profile', requireAuth, (req, res) => {
    res.render('technician/profile', { title: 'Profil Teknisi — Quickfix', user: req.user, active: 'profile', message: null });
  });

  router.get('/customer/profile', requireAuth, (req, res) => {
    res.render('customer/profile', { title: 'Profil Saya — Quickfix', user: req.user, active: 'profile', message: null });
  });

  // ── Admin ──
  router.get('/admin/dashboard', requireAuth, (req, res) => {
    res.render('admin/dashboard', { title: 'Dashboard Admin — Quickfix', user: req.user, active: 'dashboard', message: null });
  });

  router.get('/admin/orders', requireAuth, (req, res) => {
    res.render('admin/orders', { title: 'Semua Orders — Quickfix', user: req.user, active: 'orders', message: null });
  });

  router.get('/admin/technicians', requireAuth, (req, res) => {
    res.render('admin/technicians', { title: 'Kelola Teknisi — Quickfix', user: req.user, active: 'technicians', message: null });
  });

  router.get('/admin/users', requireAuth, (req, res) => {
    res.render('admin/users', { title: 'Kelola Users — Quickfix', user: req.user, active: 'users', message: null });
  });

  router.get('/admin/pricing', requireAuth, (req, res) => {
    res.render('admin/pricing', { title: 'Harga Layanan — Quickfix', user: req.user, active: 'pricing', message: null });
  });

  return router;
};
