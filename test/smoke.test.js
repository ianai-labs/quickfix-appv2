/**
 * Smoke Test — Quickfix App v2
 * Start server, hit health + login endpoints, verify JSON response.
 * Exit 0 on success, 1 on failure.
 */
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = 3099; // pakai port berbeda biar ga bentrok
const BASE = `http://localhost:${PORT}`;
const TIMEOUT = 20000;

let server;

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      timeout: 5000,
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (_) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

function waitForServer(retries = 15) {
  return new Promise((resolve, reject) => {
    function attempt(n) {
      if (n <= 0) return reject(new Error('Server tidak start dalam waktu yang ditentukan'));
      http.get(`${BASE}/health`, (res) => {
        if (res.statusCode === 200) return resolve();
        setTimeout(() => attempt(n - 1), 1000);
      }).on('error', () => setTimeout(() => attempt(n - 1), 1000));
    }
    attempt(retries);
  });
}

// ── Helper: login with demo seed users (handles device OTP automatically) ──
async function loginDemoUser(login, password) {
  const pwd = password || 'admin123';
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    body: { login: login, password: pwd },
  });
  if (!res.body.success) return null;
  if (res.body.data.require_otp) {
    const verify = await fetch(`${BASE}/api/auth/verify-device`, {
      method: 'POST',
      body: { temp_token: res.body.data.temp_token, code: res.body.data.dev_otp },
    });
    return (verify.body.success && verify.body.data.token) ? verify.body.data.token : null;
  }
  return res.body.data.token || null;
}

async function run() {
  console.log('🔍 Smoke Test — Quickfix App v2\n');

  // ── Start server ──
  console.log('📦 Starting server...');
  server = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'development' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', () => {}); // silent
  server.stderr.on('data', () => {});

  let passed = 0;
  let failed = 0;

  try {
    await waitForServer();
    console.log('✅ Server started\n');

    // ── Test 1: Health check ──
    console.log('1. GET /health ...');
    try {
      const h = await fetch(`${BASE}/health`);
      if (h.status === 200 && h.body.success) {
        console.log('   ✅ PASS —', h.body.message);
        passed++;
      } else {
        console.log('   ❌ FAIL — unexpected response');
        failed++;
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 2: Register test user ──
    console.log('2. POST /api/auth/register ...');
    const TEST_USER = 'smoke_test_' + Date.now();
    const TEST_PASS = 'test123456';
    try {
      const reg = await fetch(`${BASE}/api/auth/register`, {
        method: 'POST',
        body: { username: TEST_USER, email: TEST_USER + '@test.local', password: TEST_PASS, password_confirm: TEST_PASS, role: 'customer' },
      });
      if (reg.status === 201 && reg.body.success) {
        console.log('   ✅ PASS — User registered:', reg.body.data.username);
        passed++;
      } else {
        console.log('   ❌ FAIL —', reg.body.message || 'unexpected status: ' + reg.status);
        failed++;
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 3: Login (new device → expect OTP) ──
    console.log('3. POST /api/auth/login (device tracking) ...');
    let jwtToken = null;
    try {
      const login = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        body: { login: TEST_USER, password: TEST_PASS },
      });
      if (!login.body.success) {
        console.log('   ❌ FAIL —', login.body.message);
        failed++;
      } else if (login.body.data.require_otp) {
        // Device baru → verifikasi OTP dulu
        console.log('   📱 Device baru terdeteksi, verifikasi OTP...');
        const otpCode = login.body.data.dev_otp;
        const tempToken = login.body.data.temp_token;

        if (!otpCode || !tempToken) {
          console.log('   ❌ FAIL — OTP code/token tidak tersedia');
          failed++;
        } else {
          const verify = await fetch(`${BASE}/api/auth/verify-device`, {
            method: 'POST',
            body: { temp_token: tempToken, code: otpCode },
          });
          if (verify.body.success && verify.body.data.token) {
            jwtToken = verify.body.data.token;
            console.log('   ✅ PASS — Device verified, JWT didapat, role:', verify.body.data.user.role);
            passed++;
          } else {
            console.log('   ❌ FAIL —', verify.body.message || 'verifikasi gagal');
            failed++;
          }
        }
      } else if (login.body.data.token) {
        jwtToken = login.body.data.token;
        console.log('   ✅ PASS — JWT langsung (device dikenal)');
        passed++;
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 4: Authorized access with JWT ──
    console.log('4. GET /api/auth/me (with JWT) ...');
    try {
      if (!jwtToken) {
        console.log('   ⚠️ SKIP — no JWT from previous test');
      } else {
        const me = await fetch(`${BASE}/api/auth/me`, {
          headers: { 'Authorization': 'Bearer ' + jwtToken },
        });
        if (me.status === 200 && me.body.success) {
          console.log('   ✅ PASS — Authenticated as:', me.body.data.user.username);
          passed++;
        } else {
          console.log('   ❌ FAIL — expected 200, got', me.status);
          failed++;
        }
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 5: Unauthorized access ──
    console.log('5. GET /api/auth/me (no token) ...');
    try {
      const me = await fetch(`${BASE}/api/auth/me`);
      if (me.status === 401) {
        console.log('   ✅ PASS — 401 Unauthorized (security OK)');
        passed++;
      } else {
        console.log('   ❌ FAIL — expected 401, got', me.status);
        failed++;
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ═══════════════════════════════════════════════════════════════
    // OTP Flow Tests (memerlukan seed data: admin/budi/andi/rudi/dewi)
    // ═══════════════════════════════════════════════════════════════

    const tokens = {};

    // ── Test 6: Login as seed demo users ──
    console.log('6. Login as demo users (admin, budi, andi) ...');
    try {
      const [adminToken, budiToken, andiToken] = await Promise.all([
        loginDemoUser('admin'),
        loginDemoUser('budi'),
        loginDemoUser('andi'),
      ]);
      if (adminToken && budiToken && andiToken) {
        tokens.admin = adminToken;
        tokens.budi = budiToken;
        tokens.andi = andiToken;
        console.log('   ✅ PASS — Semua demo user terautentikasi');
        passed++;
      } else {
        const failedLogins = [];
        if (!adminToken) failedLogins.push('admin');
        if (!budiToken) failedLogins.push('budi');
        if (!andiToken) failedLogins.push('andi');
        console.log('   ❌ FAIL — Login gagal:', failedLogins.join(', '));
        failed++;
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 7: Customer creates order (auto-assign tech) ──
    console.log('7. POST /api/orders (budi) ...');
    let orderId = null;
    let techUsername = null;
    try {
      if (!tokens.budi) {
        console.log('   ⚠️ SKIP — no budi token from test 6');
      } else {
        const create = await fetch(`${BASE}/api/orders`, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + tokens.budi },
          body: { layanan: 'Perbaikan AC', alamat: 'Jl. Smoke Test No. 1' },
        });
        if (create.status === 201 && create.body.success && create.body.data.order.technician) {
          orderId = create.body.data.order.id;
          techUsername = create.body.data.order.technician.nama;
          console.log('   ✅ PASS — Order #' + orderId + ' dibuat, teknisi: ' + techUsername);
          passed++;
        } else {
          console.log('   ❌ FAIL —', create.body.message || (create.body.data?.order ? 'order status: ' + create.body.data.order.status : 'no technician assigned'));
          failed++;
        }
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 8: Technician sets status to on_the_way ──
    console.log('8. PUT on_the_way by tech ...');
    try {
      if (!orderId) {
        console.log('   ⚠️ SKIP — no order from test 7');
      } else {
        // Login as the actual assigned tech
        const actualTech = techUsername && techUsername !== 'andi'
          ? await loginDemoUser(techUsername)
          : tokens.andi;
        tokens.tech = actualTech;
        if (!tokens.tech) {
          console.log('   ❌ FAIL — Tidak bisa login sebagai ' + techUsername);
          failed++;
        } else {
          const update = await fetch(BASE + '/api/orders/' + orderId, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + tokens.tech },
            body: { status: 'on_the_way' },
          });
          if (update.status === 200 && update.body.success) {
            console.log('   ✅ PASS — Status berubah ke on_the_way');
            passed++;
          } else {
            console.log('   ❌ FAIL —', update.body.message || 'HTTP ' + update.status);
            failed++;
          }
        }
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 9: Customer detail → otp_demo + otp_verified=false ──
    console.log('9. GET detail (budi) → otp_demo + otp_verified=false ...');
    let currentOtpCode = null;
    try {
      if (!orderId || !tokens.budi) {
        console.log('   ⚠️ SKIP — no order/budi token');
      } else {
        const detail = await fetch(BASE + '/api/orders/' + orderId, {
          headers: { 'Authorization': 'Bearer ' + tokens.budi },
        });
        if (detail.status === 200 && detail.body.success) {
          const o = detail.body.data.order;
          if (o.otp_demo && /^\d{6}$/.test(o.otp_demo) && o.otp_verified === false) {
            currentOtpCode = o.otp_demo;
            console.log('   ✅ PASS — otp_demo=' + currentOtpCode + ', otp_verified=false');
            passed++;
          } else {
            console.log('   ❌ FAIL — expected 6-digit otp_demo + otp_verified=false, got:',
              JSON.stringify({ otp_demo: o.otp_demo, otp_verified: o.otp_verified }));
            failed++;
          }
        } else {
          console.log('   ❌ FAIL —', detail.body.message || 'HTTP ' + detail.status);
          failed++;
        }
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 10: Technician detail — no otp_demo ──
    console.log('10. GET detail (tech) → no otp_demo ...');
    try {
      if (!orderId || !tokens.tech) {
        console.log('   ⚠️ SKIP — no order/tech token');
      } else {
        const detail = await fetch(BASE + '/api/orders/' + orderId, {
          headers: { 'Authorization': 'Bearer ' + tokens.tech },
        });
        if (detail.status === 200 && detail.body.success) {
          const o = detail.body.data.order;
          if (o.otp_demo === undefined && o.otp_verified === undefined) {
            console.log('   ✅ PASS — otp_demo tidak bocor ke teknisi');
            passed++;
          } else {
            console.log('   ❌ FAIL — otp_demo/otp_verified terlihat teknisi:',
              JSON.stringify({ otp_demo: o.otp_demo, otp_verified: o.otp_verified }));
            failed++;
          }
        } else {
          console.log('   ❌ FAIL —', detail.body.message || 'HTTP ' + detail.status);
          failed++;
        }
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 11: Customer resend OTP ──
    console.log('11. POST resend-otp (budi) ...');
    try {
      if (!orderId || !tokens.budi) {
        console.log('   ⚠️ SKIP — no order/budi token');
      } else {
        const resend = await fetch(BASE + '/api/orders/' + orderId + '/resend-otp', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + tokens.budi },
        });
        if (resend.status === 200 && resend.body.success && resend.body.data && resend.body.data.otp_demo) {
          const newCode = resend.body.data.otp_demo;
          if (newCode !== currentOtpCode && /^\d{6}$/.test(newCode)) {
            currentOtpCode = newCode;
            console.log('   ✅ PASS — OTP baru: ' + newCode);
            passed++;
          } else {
            console.log('   ❌ FAIL — OTP tidak berubah atau tidak valid:', newCode);
            failed++;
          }
        } else {
          console.log('   ❌ FAIL —', resend.body.message || 'HTTP ' + resend.status);
          failed++;
        }
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 12: Customer verifikasi OTP ──
    console.log('12. POST /api/otp/verify (budi) ...');
    try {
      if (!currentOtpCode || !tokens.budi) {
        console.log('   ⚠️ SKIP — no OTP code or budi token');
      } else {
        const verifyRes = await fetch(BASE + '/api/otp/verify', {
          method: 'POST',
          body: { token: tokens.budi, code: currentOtpCode, type: 'order_verify' },
        });
        if (verifyRes.status === 200 && verifyRes.body.success) {
          console.log('   ✅ PASS — OTP berhasil diverifikasi');
          passed++;
        } else {
          console.log('   ❌ FAIL —', verifyRes.body.message || 'HTTP ' + verifyRes.status);
          failed++;
        }
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 13: Customer detail → otp_verified=true ──
    console.log('13. GET detail (budi) → otp_verified=true ...');
    try {
      if (!orderId || !tokens.budi) {
        console.log('   ⚠️ SKIP — no order/budi token');
      } else {
        const detail = await fetch(BASE + '/api/orders/' + orderId, {
          headers: { 'Authorization': 'Bearer ' + tokens.budi },
        });
        if (detail.status === 200 && detail.body.success) {
          const v = detail.body.data.order.otp_verified;
          if (v === true) {
            console.log('   ✅ PASS — otp_verified = true');
            passed++;
          } else {
            console.log('   ❌ FAIL — expected true, got:', v);
            failed++;
          }
        } else {
          console.log('   ❌ FAIL —', detail.body.message || 'HTTP ' + detail.status);
          failed++;
        }
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 14: Technician starts in_progress ──
    console.log('14. PUT in_progress by tech ...');
    try {
      if (!orderId || !tokens.tech) {
        console.log('   ⚠️ SKIP — no order/tech token');
      } else {
        const update = await fetch(BASE + '/api/orders/' + orderId, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + tokens.tech },
          body: { status: 'in_progress' },
        });
        if (update.status === 200 && update.body.success) {
          console.log('   ✅ PASS — Status berubah ke in_progress');
          passed++;
        } else {
          console.log('   ❌ FAIL —', update.body.message || 'HTTP ' + update.status);
          failed++;
        }
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 15: OTP verify with cookie-only token (no body token) ──
    console.log('15. POST /api/otp/verify (cookie-only token, invalid code) ...');
    try {
      if (!tokens.budi) {
        console.log('   ⚠️ SKIP — no budi token');
      } else {
        const verifyRes = await fetch(BASE + '/api/otp/verify', {
          method: 'POST',
          headers: { 'Cookie': 'token=' + tokens.budi },
          body: { code: '000000', type: 'order_verify' }, // no body token
        });
        // Token resolved from cookie → code validation runs → "Kode OTP tidak valid."
        // NOT "Token verifikasi diperlukan."
        // Why: no order_verify OTP record exists in DB for user budi at this point,
        // so otpService.verify() always returns "Kode OTP tidak valid." — this is the
        // expected failure that proves the token WAS resolved from the cookie. Under
        // the old code (body-only token), this request would never reach the OTP lookup
        // and would instead return "Token verifikasi diperlukan." at line 61.
        if (verifyRes.status === 400 && verifyRes.body.message === 'Kode OTP tidak valid.') {
          console.log('   ✅ PASS — token accepted from cookie, code rejected as expected');
          passed++;
        } else if (verifyRes.body.message === 'Token verifikasi diperlukan.') {
          console.log('   ❌ FAIL — token not resolved from cookie');
          failed++;
        } else {
          console.log('   ❌ FAIL — unexpected response:', JSON.stringify(verifyRes.body));
          failed++;
        }
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 16: OTP verify with NO token at all ──
    console.log('16. POST /api/otp/verify (no token anywhere) ...');
    try {
      const verifyRes = await fetch(BASE + '/api/otp/verify', {
        method: 'POST',
        body: { code: '000000', type: 'order_verify' }, // no body token, no Cookie
      });
      if (verifyRes.status === 400 && verifyRes.body.message === 'Token verifikasi diperlukan.') {
        console.log('   ✅ PASS — 400 "Token verifikasi diperlukan."');
        passed++;
      } else {
        console.log('   ❌ FAIL — expected 400 "Token verifikasi diperlukan.", got:',
          JSON.stringify({ status: verifyRes.status, message: verifyRes.body.message }));
        failed++;
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

  } catch (e) {
    console.log('❌ FATAL —', e.message);
    failed++;
  } finally {
    if (server) { server.kill('SIGTERM'); server.unref(); }
  }

  // ── Summary ──
  console.log(`\n${'═'.repeat(40)}`);
  console.log(`  Passed: ${passed}  |  Failed: ${failed}`);
  console.log(`${'═'.repeat(40)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run();
