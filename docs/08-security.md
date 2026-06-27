# 08 — Desain Keamanan

## Quickfix App v2

---

## 1. Arsitektur Keamanan (Ringkasan)

```
┌─────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                     │
├─────────────────────────────────────────────────────────┤
│  LAYER 1: Authentication (JWT)                          │
│  LAYER 2: Device Tracking + OTP Verification ⭐        │
│  LAYER 3: Authorization (Role-based Access)            │
│  LAYER 4: Input Validation & Sanitization              │
│  LAYER 5: Rate Limiting                                │
│  LAYER 6: Password Security (bcrypt)                   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Authentication — JWT

### Access Token & Refresh Token

| Token | Masa Berlaku | Disimpan di | Kegunaan |
|-------|:-----------:|-------------|----------|
| Access Token | 1 jam | Cookie (httpOnly) | Akses API endpoint |
| Refresh Token | 7 hari | Cookie (httpOnly) | Generate access token baru |

### Flow:
```
Login sukses → Issue access_token + refresh_token
API request → Verify access_token (middleware)
Access expired → Use refresh_token → Issue access_token baru
Refresh expired → User harus login ulang
```

### JWT Payload:
```json
{
  "user_id": 1,
  "username": "budi123",
  "email": "budi@email.com",
  "role": "customer",
  "device_id": "abc123...",
  "iat": 1719000000,
  "exp": 1719003600
}
```

---

## 3. Device Tracking + OTP ⭐ (Syarat Tugas)

### 3.1 Konsep
Sistem menyimpan **Device ID** (fingerprint perangkat) yang di-generate saat user pertama kali login dari suatu perangkat. Jika user login dari perangkat yang berbeda, sistem meminta **verifikasi OTP** untuk memastikan bahwa yang login adalah pemilik akun yang sah.

### 3.2 Device ID Generation

```javascript
// middleware/device.js
const crypto = require('crypto');

function generateDeviceId(req) {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || req.connection.remoteAddress;
  const secret = process.env.DEVICE_SECRET;

  return crypto
    .createHash('sha256')
    .update(`${userAgent}|${ip}|${secret}`)
    .digest('hex');
}

function getDeviceName(req) {
  const ua = req.headers['user-agent'] || '';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown';
}
```

### 3.3 Alur Verifikasi Device

#### First Login (Device Baru)
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  CLIENT   │     │  SERVER   │     │ DATABASE │     │  EMAIL   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │               │                │
     │ POST /login    │               │                │
     │ username+pass  │               │                │
     ├───────────────▶│               │                │
     │                │ Verify creds  │                │
     │                ├──────────────▶│                │
     │                │◀──────────────│                │
     │                │               │                │
     │                │ Generate device_id              │
     │                │ Cek devices table               │
     │                ├──────────────▶│                │
     │                │◀─ device NOT found              │
     │                │               │                │
     │                │ Insert device baru              │
     │                │ (is_verified=false)             │
     │                ├──────────────▶│                │
     │                │               │                │
     │                │ Generate OTP (6 digit)          │
     │                │ Simpan di otp_codes             │
     │                ├──────────────▶│                │
     │                │               │                │
     │                │ Kirim OTP via email             │
     │                ├────────────────────────────────▶│
     │                │               │                │
     │  { require_otp │               │                │
     │   : true,      │               │                │
     │   temp_token } │               │                │
     │◀───────────────│               │                │
     │                │               │                │
     │ POST /otp/verify               │                │
     │ temp_token+code│               │                │
     ├───────────────▶│               │                │
     │                │ Verifikasi OTP                 │
     │                ├──────────────▶│                │
     │                │ Update device (verified=true)  │
     │                ├──────────────▶│                │
     │  { JWT token } │               │                │
     │◀───────────────│               │                │
```

#### Subsequent Login (Device Dikenal)
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  CLIENT   │     │  SERVER   │     │ DATABASE │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │ POST /login     │               │
     ├────────────────▶│               │
     │                │ Verifikasi creds              │
     │                │ Generate device_id            │
     │                │ Cek devices table             │
     │                ├──────────────▶│               │
     │                │◀─ device FOUND + verified      │
     │                │               │               │
     │                │ Update last_login             │
     │                ├──────────────▶│               │
     │                │               │               │
     │  { JWT token } │               │               │
     │◀───────────────│               │               │
```

---

## 4. OTP System

### Spesifikasi

| Parameter | Nilai |
|-----------|-------|
| Panjang kode | 6 digit numerik |
| Masa berlaku | 5 menit (300 detik) |
| Maksimum percobaan | 3 kali per kode |
| Tipe | `device_verify`, `order_verify`, `reset_password` |

### OTP Generation
```javascript
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
  // Output: "472819"
}
```

### OTP dikirim via Nodemailer (Email)
```
Subject: [Quickfix] Kode Verifikasi Anda
Body:
  Kode verifikasi Anda: 472819
  Kode berlaku selama 5 menit.
  Jangan berikan kode ini kepada siapapun.
```

---

## 5. Authorization — Role-Based Access

| Role | Akses |
|------|-------|
| **customer** | `/customer/*`, `/api/orders` (create, read own), `/api/upload` |
| **technician** | `/technician/*`, `/api/orders` (read assigned, update), `/api/upload` |
| **admin** | `/admin/*`, `/api/technicians/*`, `/api/orders` (read all) |

### Middleware:
```javascript
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak'
      });
    }
    next();
  };
}
```

---

## 6. Password Security

- **Hashing**: bcrypt dengan salt rounds = 10
- **Minimum length**: 6 karakter
- **Tidak ada password plaintext** disimpan
- **Reset password**: token 64-char hex, masa berlaku 1 jam, invalid setelah digunakan

---

## 7. Rate Limiting

| Endpoint | Limit | Window |
|----------|:-----:|:------:|
| POST /api/auth/login | 10 | 1 menit |
| POST /api/auth/register | 5 | 1 menit |
| POST /api/auth/forgot-password | 3 | 1 menit |
| POST /api/otp/send | 3 | 5 menit |
| POST /api/otp/verify | 5 | 5 menit |

---

## 8. HTTP Security Headers

| Header | Value |
|--------|-------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| X-XSS-Protection | 1; mode=block |
| Strict-Transport-Security | (production only) |

---

## 9. CSRF Protection

Untuk halaman yang menggunakan form submission (non-API), diterapkan CSRF token:
- Token di-generate per session
- Disisipkan sebagai hidden input di setiap form
- Diverifikasi di server saat POST/PUT/DELETE request

---

## 10. Environment Variables

Semua kredensial sensitif **tidak pernah hardcoded** — disimpan di `.env`:
```
JWT_SECRET=
JWT_REFRESH_SECRET=
DEVICE_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_USER=
SMTP_PASS=
```
