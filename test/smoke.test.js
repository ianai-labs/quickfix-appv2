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
