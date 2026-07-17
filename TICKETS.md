# TICKETS — Quickfix App v2

## 🟡 In Progress

## 🟢 Done

### T-001: OTP verify gagal — "Token verifikasi diperlukan" padahal user login
- Domain: ⚙️ backend
- Assignee: backend-specialist
- Priority: 🔴 high
- Root cause: cookie `token` httpOnly (`authController.js:44`) → `getCookie('token')` di browser selalu null → `POST /api/otp/verify` (body-token-only) balas 400 "Token verifikasi diperlukan."
- Fix: `otpController.js` — token fallback `req.body.token || req.cookies.token` (body prioritas, login device-verify flow aman). Bonus: `send()` terima `type` dari body (whitelist `OTP_TYPES`, default `DEVICE_VERIFY`).
- Test: smoke test #15 (cookie-only token) + #16 (no token → 400). Catatan: smoke test butuh MySQL — belum bisa dijalankan di WSL ini (docker mati), jalankan via `docker compose up` + `npm run test:smoke`.
- Review: cavecrew-reviewer pass (1 bug + 2 risk ditemukan, semua di-fix round 1)

### T-002: Panel teknisi buta status OTP — tak bisa tahu kapan boleh mulai kerja
- Domain: 📋 fullstack (backend → frontend sequential)
- Assignee: backend-specialist → frontend-specialist
- Priority: 🔴 high
- Fix:
  - ⚙️ `orderController.js` `detail()`: `otp_verified` sekarang juga untuk teknisi assigned saat `on_the_way`. `otp_demo` tetap customer-only. Authz aman — guard `order.technician_id !== tech.id` sudah ada sebelum branch.
  - 🎨 `job-detail.ejs`: tombol "Mulai Pekerjaan" disabled + note amber "⏳ Menunggu customer memverifikasi kedatangan kamu" saat belum verified; note hijau + tombol aktif setelah verified; tombol "🔄 Cek Status" → `loadJob()` re-fetch tanpa reload.
- Review: cavecrew-reviewer 0 bug, 1 risk (redundant `Customer.findByPk` — dibacklog ke T-003)
- Catatan verifikasi: server tak bisa jalan di env ini (docker WSL off) — syntax + lint + logic-trace pass; tes manual dibutuhkan.

## 📋 Backlog

### T-003: Hilangkan query redundant di `detail()`
- Domain: ⚙️ backend
- Priority: 🟢 low
- Deskripsi: Technician branch `detail()` panggil `Customer.findByPk` padahal Customer sudah eager-loaded. Tambah `user_id` ke attributes Customer di `ORDER_INCLUDES`, pakai `order.Customer.user_id`. Hati-hati: `ORDER_INCLUDES` dipakai `list()` juga.
- Dependency: none
