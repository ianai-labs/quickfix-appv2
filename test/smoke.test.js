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

    // ── Test 2: Login admin ──
    console.log('2. POST /api/auth/login (admin) ...');
    try {
      const login = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        body: { login: 'admin', password: 'admin123' },
      });
      if (login.status === 200 && login.body.success && login.body.data.token) {
        console.log('   ✅ PASS — JWT token diterima, role:', login.body.data.user.role);
        passed++;
      } else {
        console.log('   ❌ FAIL —', login.body.message || 'unexpected');
        failed++;
      }
    } catch (e) {
      console.log('   ❌ FAIL —', e.message);
      failed++;
    }

    // ── Test 3: Unauthorized access ──
    console.log('3. GET /api/auth/me (no token) ...');
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
