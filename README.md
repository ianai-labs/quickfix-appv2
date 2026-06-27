# Quickfix App v2

Platform layanan **handyman / perbaikan rumah** on-demand.  
Dibangun dengan **Node.js + Express + MySQL + Docker** untuk tugas mata kuliah **Pemrograman Fullstack**.

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Autentikasi** | Register, login, JWT, bcrypt password hashing |
| **Device ID + OTP** | Deteksi device baru saat login → verifikasi OTP via email |
| **Booking Order** | Customer membuat order perbaikan (AC, listrik, pipa, atap) |
| **Algoritma WRTA** | Weighted Random — teknisi premium 3x prioritas |
| **Tracking Real-time** | Status order: pending → assigned → otw → in_progress → done |
| **OTP Verifikasi** | Customer verifikasi teknisi dengan OTP saat teknisi tiba |
| **Cloud Storage** | Upload foto pekerjaan ke Cloudinary |
| **Email Service** | Nodemailer — OTP, notifikasi order, reset password |
| **Role-based Access** | Customer, Technician, Admin dashboard |

---

## Teknologi

| Layer | Teknologi |
|-------|-----------|
| Runtime | Node.js 20 (Alpine) |
| Framework | Express.js 4.21 |
| Template | EJS 3.1 |
| ORM | Sequelize 6.37 |
| Database | MySQL 8.0 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Upload | Multer → Cloudinary |
| Email | Nodemailer (SMTP) |
| Container | Docker + Docker Compose |

---

## Quick Start

### Prasyarat
- Docker & Docker Compose v2
- Node.js 20+ (opsional, untuk development lokal)

### 1. Clone & Setup
```bash
git clone <repo-url> quickfix-appv2
cd quickfix-appv2
cp .env.example .env
# Edit .env — minimal isi JWT_SECRET dengan string random
```

### 2. Jalankan dengan Docker
```bash
docker compose up -d
```

Tunggu hingga MySQL healthy, lalu buka:

| Service | URL |
|---------|-----|
| **Aplikasi** | http://localhost:3000 |
| **phpMyAdmin** | http://localhost:8080 |

### 3. Login
| User | Password | Role |
|------|----------|------|
| `admin` | `admin123` | Admin |
| `budi` | `admin123` | Customer |
| `andi` | `admin123` | Technician |
| `rudi` | `admin123` | Technician |
| `dewi` | `admin123` | Technician |

> **Catatan**: Login pertama kali akan meminta OTP. Di development, OTP bisa dilihat langsung di database (tabel `otp_codes`) karena SMTP belum dikonfigurasi.

---

## Struktur Proyek

```
quickfix-appv2/
├── config/          # Database, Cloudinary, Nodemailer, Constants
├── models/          # Sequelize models (7 tabel)
├── middleware/       # Auth JWT, Role, Device ID, Upload, Error handler
├── services/        # Algorithm, Email, OTP, Cloudinary
├── controllers/     # Business logic
├── routes/          # Express route definitions
├── views/           # EJS templates (layouts, partials, auth, customer, technician, admin)
├── public/          # CSS, JS, assets
├── docs/            # Dokumentasi (PRD, User Stories, ERD, API Spec, dll)
├── database/        # SQL schema + seed data
├── docker-compose.yml
├── Dockerfile
└── server.js        # Entry point
```

---

## API Endpoints

| Method | URL | Auth | Deskripsi |
|--------|-----|:----:|-----------|
| POST | `/api/auth/register` | — | Registrasi |
| POST | `/api/auth/login` | — | Login + device check |
| POST | `/api/auth/verify-device` | — | Verifikasi OTP device baru |
| POST | `/api/auth/forgot-password` | — | Request reset password |
| POST | `/api/auth/reset-password` | — | Reset password |
| GET | `/api/auth/me` | JWT | Info user |
| GET | `/api/auth/logout` | — | Logout |
| POST | `/api/otp/send` | — | Kirim ulang OTP |
| POST | `/api/otp/verify` | — | Verifikasi OTP |
| GET | `/api/orders` | JWT | List orders |
| POST | `/api/orders` | JWT | Buat order + auto-assign teknisi |
| GET | `/api/orders/:id` | JWT | Detail order |
| PUT | `/api/orders/:id` | JWT | Update status |
| PUT | `/api/orders/:id/assign` | JWT | Re-assign teknisi |
| GET | `/api/technicians` | JWT | List teknisi |
| PUT | `/api/technicians/:id` | JWT | Update teknisi (admin) |
| PUT | `/api/technicians/:id/status` | JWT | Update status (technician) |
| POST | `/api/upload` | JWT | Upload foto ke Cloudinary |

> Detail lengkap: `docs/05-api-spec.md`

---

## Integrasi Eksternal

| Layanan | File | Environment Variables |
|---------|------|----------------------|
| **Cloudinary** | `services/cloudinaryService.js` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **Nodemailer** | `services/emailService.js` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |

> **Development**: Tanpa konfigurasi SMTP/Cloudinary, aplikasi tetap berjalan. OTP disimpan di database (bisa dicek manual), dan upload file dinonaktifkan dengan error yang jelas.

---

## Algoritma — Weighted Random Technician Assignment

```
weight = 1.0 × (is_premium ? 3.0 : 1.0) × (rating / 5.0)
```

- Teknisi premium mendapat **bobot 3x lipat** — peluang 3x lebih besar
- Rating teknisi dinormalisasi sebagai faktor pengali
- Minimum bobot 0.1 untuk teknisi baru (rating 0)
- Kompleksitas: **O(n)** — single pass

> Detail lengkap: `docs/07-algorithm.md`

---

## Keamanan

| Fitur | Implementasi |
|-------|-------------|
| **Password** | bcrypt, salt rounds 10 |
| **JWT** | Access token (1 jam) + Refresh token (7 hari) |
| **Device Tracking** | Device ID = SHA256(user-agent + IP + secret) |
| **OTP** | 6-digit, 5 menit expiry, max 3 percobaan |
| **Rate Limiting** | Login 10/min, Register 5/min, Forgot 3/min |
| **CSRF** | Cookie httpOnly + sameSite |
| **No Enumeration** | Forgot password — response identik untuk email ada/tidak |

> Detail lengkap: `docs/08-security.md`

---

## Testing

```bash
# Unit + integration (coming soon)
npm test

# Manual E2E test (bash)
# Lihat docs/10-testing.md untuk daftar test case lengkap
```

---

## Dokumentasi

| Dokumen | Isi |
|---------|-----|
| `docs/01-prd.md` | Product Requirement Document |
| `docs/02-user-story.md` | User Stories + Acceptance Criteria |
| `docs/03-erd.md` | Entity Relationship Diagram |
| `docs/04-architecture.md` | Arsitektur MVC + Docker |
| `docs/05-api-spec.md` | API Specification lengkap |
| `docs/06-wireframe.md` | Wireframe & UI Design |
| `docs/07-algorithm.md` | Penjelasan Algoritma WRTA |
| `docs/08-security.md` | Desain Keamanan |
| `docs/09-integration.md` | Integrasi Cloudinary & Email |
| `docs/10-testing.md` | Rencana Pengujian |

---

## Lisensi

ISC — Proyek pembelajaran untuk mata kuliah Pemrograman Fullstack.
