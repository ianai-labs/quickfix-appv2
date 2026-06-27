# Quickfix App v2

Platform layanan **handyman / perbaikan rumah** on-demand.  
Dibangun dengan **Node.js + Express + MySQL + Docker** untuk tugas mata kuliah **Pemrograman Fullstack**.

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Landing Page** | Hero section, value proposition, stock photo, login CTA |
| **Role-based Auth** | 3 role: Pencari Jasa (Customer), Penyedia Jasa (Technician), Admin |
| **JWT + Refresh Token** | Access token 1 jam + refresh token 7 hari + auto-refresh |
| **Device ID + OTP** | SHA256 device fingerprint, OTP verification untuk device baru |
| **Booking Order** | Customer membuat order dengan estimasi harga real-time |
| **Algoritma WRTA** | Weighted Random Technician Assignment — premium 3x prioritas |
| **Payment + Escrow** | Midtrans Snap (sandbox) + demo fallback, dana ditahan sampai selesai |
| **Two-Way Reviews** | Customer & teknisi saling rating ⭐ + komentar setelah order done |
| **Cloud Storage** | Upload foto pekerjaan ke Cloudinary |
| **Email Service** | Nodemailer — OTP, reset password, notifikasi order |
| **Pagination** | Semua list view dengan Previous/Next |
| **Dark Mode** | Toggle dark/light, localStorage persisted |
| **Sidebar Dashboard** | Dark theme, collapsible, breadcrumb navigation |
| **Toast Notification** | Success/error/info, auto-dismiss |
| **Admin Charts** | Order status bar chart, revenue summary |
| **Real-time Badge** | Pending job count di sidebar teknisi |

---

## Teknologi

| Layer | Teknologi |
|-------|-----------|
| Runtime | Node.js 20 (Alpine) |
| Framework | Express.js 4.21 |
| Template | EJS 3.1 + express-ejs-layouts |
| ORM | Sequelize 6.37 |
| Database | MySQL 8.0 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Payment | Midtrans Snap (midtrans-client) |
| Upload | Multer → Cloudinary |
| Email | Nodemailer (SMTP) |
| Security | Helmet, rate limiting, OTP SHA256 hashed |
| Container | Docker + Docker Compose |

---

## Quick Start

### Prasyarat
- Docker & Docker Compose v2
- Git

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

| Service | URL |
|---------|-----|
| **Aplikasi** | http://localhost:3000 |
| **phpMyAdmin** | http://localhost:8081 |

### 3. Login Demo

| User | Password | Role |
|------|----------|------|
| `admin` | `admin123` | Admin |
| `budi` | `admin123` | Customer (Pencari Jasa) |
| `andi` | `admin123` | Technician (Penyedia Jasa, Premium) |
| `rudi` | `admin123` | Technician |
| `dewi` | `admin123` | Technician |

> **Demo Mode**: OTP code ditampilkan langsung di modal. Midtrans key tidak perlu dikonfigurasi — payment otomatis sukses.

---

## Struktur Proyek

```
quickfix-appv2/
├── config/          # Database, Cloudinary, Nodemailer, Midtrans, Constants
├── models/          # Sequelize models (10 tabel)
├── middleware/       # Auth JWT, Role, Device ID, Upload, Error handler
├── services/        # Algorithm, Email, OTP, Cloudinary, Payment
├── controllers/     # Business logic (8 controllers)
├── routes/          # Express routes (9 route files)
├── views/           # EJS templates (18 pages)
├── public/          # CSS, JS
├── docs/            # Dokumentasi (12 file)
├── database/        # SQL schema + seed data
├── docker-compose.yml
├── Dockerfile
├── server.js        # Entry point
└── README.md
```

---

## API Endpoints (26)

### Auth
| Method | URL | Auth | Deskripsi |
|--------|-----|:---:|-----------|
| POST | `/api/auth/register` | — | Registrasi |
| POST | `/api/auth/login` | — | Login + device check |
| POST | `/api/auth/verify-device` | — | Verifikasi OTP device baru |
| POST | `/api/auth/forgot-password` | — | Request reset password |
| POST | `/api/auth/reset-password` | — | Reset password |
| POST | `/api/auth/refresh` | — | Refresh access token |
| GET | `/api/auth/me` | JWT | Info user |
| GET/POST | `/api/auth/logout` | — | Logout |
| PUT | `/api/auth/change-password` | JWT | Ganti password |
| PUT | `/api/auth/profile` | JWT | Edit profil customer |

### Orders & Technicians
| Method | URL | Auth | Deskripsi |
|--------|-----|:---:|-----------|
| GET | `/api/orders` | JWT | List orders (paginated, filterable) |
| POST | `/api/orders` | JWT | Buat order + auto-assign teknisi |
| GET | `/api/orders/:id` | JWT | Detail order |
| PUT | `/api/orders/:id` | JWT | Update status (state machine) |
| PUT | `/api/orders/:id/assign` | JWT | Re-assign teknisi |
| GET | `/api/technicians` | JWT | List teknisi |
| PUT | `/api/technicians/:id` | JWT | Update teknisi (admin) |
| PUT | `/api/technicians/:id/status` | JWT | Update status online/offline |

### Payment, Upload, OTP, Reviews, Admin
| Method | URL | Auth | Deskripsi |
|--------|-----|:---:|-----------|
| POST | `/api/payment/checkout/:id` | JWT | Buat transaksi pembayaran |
| GET | `/api/payment/status/:id` | JWT | Status transaksi |
| POST | `/api/payment/release/:id` | Admin | Lepas dana ke teknisi |
| POST | `/api/payment/webhook` | — | Midtrans callback |
| POST | `/api/upload` | JWT | Upload foto ke Cloudinary |
| POST | `/api/otp/send` | — | Kirim ulang OTP |
| POST | `/api/otp/verify` | — | Verifikasi OTP |
| POST | `/api/reviews` | JWT | Buat review |
| GET | `/api/reviews/order/:id` | JWT | List review per order |
| GET | `/api/admin/users` | Admin | List semua customer |
| PUT | `/api/admin/users/:id/toggle` | Admin | Aktif/nonaktif user |
| GET | `/api/admin/pricing` | Public | List harga layanan |
| PUT | `/api/admin/pricing/:id` | Admin | Update harga |
| GET | `/api/admin/stats` | Admin | Statistik agregat |

---

## Algoritma — Weighted Random Technician Assignment

```
weight = 1.0 × (is_premium ? 3.0 : 1.0) × (rating / 5.0)
```

- Teknisi premium: **3x bobot** — peluang 3x lebih besar
- Rating dinormalisasi sebagai faktor pengali
- Minimum bobot 0.1 untuk teknisi baru
- Kompleksitas: **O(n)** — single pass

> Detail: `docs/07-algorithm.md`

---

## Keamanan

| Fitur | Implementasi |
|-------|-------------|
| Password | bcrypt, salt rounds 10 |
| JWT | Access (1h) + Refresh (7d) + auto-refresh |
| Device Tracking | SHA256(user-agent + IP + secret) |
| OTP | 6-digit, SHA256 hashed, 5 menit expiry |
| Rate Limiting | Login 10/min, Register 5/min (dev: 100/50) |
| XSS | esc() HTML entity sanitizer |
| Helmet | X-Frame-Options, X-Content-Type, X-XSS |
| RBAC | Role-based access di setiap route |

> Detail: `docs/08-security.md`

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
| `docs/07-algorithm.md` | Algoritma WRTA detail |
| `docs/08-security.md` | Desain Keamanan |
| `docs/09-integration.md` | Integrasi Eksternal |
| `docs/10-testing.md` | Rencana Pengujian |
| `docs/11-setup-guide.md` | Panduan Menjalankan |
| `docs/12-program-flow.md` | Alur Program Lengkap |

---

## Lisensi

ISC — Proyek pembelajaran untuk mata kuliah Pemrograman Fullstack.
