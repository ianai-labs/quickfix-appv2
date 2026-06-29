# Quickfix App v2

[![CI/CD Pipeline](https://github.com/ianai-labs/quickfix-appv2/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/ianai-labs/quickfix-appv2/actions/workflows/ci-cd.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-✓-2496ED?logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-ISC-blue)](./LICENSE)

**Platform Layanan Perbaikan Rumah On-Demand** — Menghubungkan pemilik rumah dengan teknisi profesional secara cepat, aman, dan transparan. Dibangun dengan **Node.js + Express + MySQL + Docker**.

---

## Demo

| Mode | URL | Status |
|------|-----|--------|
| **Railway (Production)** | [quickfix-appv2.up.railway.app](https://quickfix-appv2.up.railway.app) | Live |
| **Local (Docker)** | `http://localhost:3000` | `docker compose up -d` |

### Akun Demo

| Pengguna | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin — Kelola platform |
| `budi` | `admin123` | Customer — Pencari jasa |
| `andi` | `admin123` | Technician — Premium, Rating 5.0 |
| `rudi` | `admin123` | Technician — Rating 4.8 |
| `dewi` | `admin123` | Technician — Rating 4.5 |

**Demo Mode:** Kode OTP ditampilkan langsung di modal — tidak perlu konfigurasi email.

---

## Fitur

### Core

- **Landing Page** — Hero section, value proposition, CTA, feature cards
- **3 Role Auth** — Customer, Technician, Admin dengan hak akses berbeda
- **JWT Dual Token** — Access (1 jam) + Refresh (7 hari) + auto-refresh transparan
- **Device ID + OTP** — SHA256 fingerprint device, OTP 6-digit via email (5 menit)

### Bisnis

- **Booking Order** — Customer pilih layanan, sistem auto-assign teknisi terbaik
- **Algoritma WRTA** — Weighted Random Technician Assignment — premium 3× prioritas
- **Order State Machine** — 6 status: pending → assigned → on_the_way → in_progress → done
- **Payment Escrow** — Midtrans Snap, dana ditahan sampai pekerjaan selesai
- **Two-Way Review** — Customer & teknisi saling rating ⭐ 1-5 + komentar
- **Cloud Storage** — Upload foto pekerjaan ke Cloudinary dengan auto-resize

### UI/UX

- **Dashboard per Role** — Ringkasan data, statistik, chart, filter & pagination
- **Dark Mode** — Toggle light/dark, dipersistensi via localStorage
- **Responsive** — Mobile-friendly dengan sidebar collapsible
- **Toast Notifications** — Sukses/error/info, auto-dismiss

### DevOps

- **Docker** — 3-container stack: App + MySQL + phpMyAdmin
- **CI/CD** — GitHub Actions: Lint → Smoke Test (5 case) → Docker Build
- **Auto-Seed** — Data demo otomatis pada deploy pertama
- **Railway Deploy** — Production dengan health check + auto-restart

---

## Tech Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Runtime | Node.js (Alpine) | 22 |
| Framework | Express.js | 4.21 |
| Template | EJS + express-ejs-layouts | 3.1 |
| ORM | Sequelize | 6.37 |
| Database | MySQL | 8.0 |
| Auth | JWT (jsonwebtoken) + bcryptjs | 9.0 / 2.4 |
| Payment | Midtrans Snap (midtrans-client) | 1.4 |
| Upload | Multer → Cloudinary | 1.4 / 2.3 |
| Email | Nodemailer (SMTP) | 6.9 |
| Security | Helmet + express-rate-limit | 8.2 / 7.4 |
| Container | Docker + Docker Compose | 24+ |
| CI/CD | GitHub Actions | — |
| Deploy | Railway | — |

---

## Quick Start

### Prasyarat

- Docker & Docker Compose v2
- Git

### 1. Clone & Setup

```bash
git clone git@github.com:ianai-labs/quickfix-appv2.git
cd quickfix-appv2
cp .env.example .env
```

### 2. Jalankan

```bash
docker compose up -d
```

Tunggu ~30 detik hingga MySQL siap dan app berjalan.

### 3. Akses

| Service | URL | Kredensial |
|---------|-----|-----------|
| Aplikasi | http://localhost:3000 | Akun demo di atas |
| Health Check | http://localhost:3000/health | — |
| phpMyAdmin | http://localhost:8081 | `root` / `rootpassword` |
| Debug | http://localhost:3000/debug/check | — |

---

## API

### Ringkasan

| Modul | Endpoint | Deskripsi |
|-------|----------|-----------|
| Auth | 11 | Register, login, device verify, reset password, refresh, profile |
| Orders | 5 | CRUD order, update status state machine, reassign teknisi |
| Technicians | 4 | List, detail, update profil, toggle online/offline |
| Upload | 1 | Upload foto ke Cloudinary (multipart, max 5 MB) |
| OTP | 2 | Kirim ulang & verifikasi kode OTP |
| Payment | 4 | Checkout Midtrans, cek status, lepas escrow, webhook |
| Reviews | 2 | Buat & lihat ulasan two-way |
| Admin | 5 | Statistik, kelola user, kelola pricing |

**Total: 41 endpoint REST API** — respons JSON konsisten, HTTP status codes, pagination terstandar.

### Contoh Request

```http
POST /api/auth/login
Content-Type: application/json

{ "login": "budi", "password": "admin123" }
```

```json
{
  "success": true,
  "message": "Device baru terdeteksi.",
  "data": {
    "require_otp": true,
    "temp_token": "eyJ...",
    "dev_otp": "469995"
  }
}
```

> Dokumentasi lengkap: `docs/05-api-spec.md`

---

## Algoritma — WRTA

```
weight = 1.0 × (is_premium ? 3.0 : 1.0) × max(rating / 5.0, 0.1)
```

**Weighted Random Technician Assignment** — Algoritma penugasan teknisi dengan pembobotan:

- Teknisi **premium** mendapat bobot **3×** — peluang 3 kali lebih besar
- **Rating** dinormalisasi (0.0–1.0) sebagai faktor pengali
- Teknisi **baru** tetap dapat peluang (bobot minimum 0.1)
- Kompleksitas **O(n)** — single pass filtering + weighted random
- Terinspirasi sistem distribusi order **Gojek/Grab**

> Detail: `docs/07-algorithm.md`

---

## Keamanan

| Fitur | Implementasi |
|-------|-------------|
| Password | bcrypt, salt rounds 10 |
| JWT | Access (1h) + Refresh (7d), httpOnly cookie, auto-refresh |
| Device Tracking | SHA256(user-agent + IP + DEVICE_SECRET) |
| OTP | 6-digit, SHA256 hashed, 5 menit expiry, max 3 attempts |
| Rate Limiting | Global 200/15m, Login 10/min, Register 5/min, OTP 5/5min |
| Helmet | X-Frame-Options, X-Content-Type, X-XSS, HSTS |
| Input Validation | Server-side di semua endpoint (regex, length, enum, type) |
| RBAC | 3 role, middleware authorization di setiap route |

> Detail: `docs/08-security.md`

---

## Arsitektur

```
Browser (EJS + CSS + JS)
    │
    ▼
Express.js Server
├── 9 Routes (REST API + View)
├── 5 Middleware (Auth, Device, Role, Upload, Error)
├── 8 Controllers (Business Logic)
├── 5 Services (Algorithm, Email, OTP, Cloudinary, Payment)
├── 10 Sequelize Models
    │
    ▼
MySQL 8.0 Database (10 tabel, 78 kolom, 11 relasi)

External: Cloudinary │ Nodemailer │ Midtrans
```

> Detail: `docs/04-architecture.md`

---

## CI/CD Pipeline

```
Push → GitHub Actions
    ├── Lint (ESLint)
    ├── Smoke Test (5 test case + MySQL container)
    ├── Docker Build (cache GitHub Actions)
    └── Deploy Railway (auto dari main branch)
```

---

## Struktur Proyek

```
quickfix-appv2/
├── config/          # DB, Seed, Cloudinary, Midtrans, Nodemailer, Constants
├── models/          # Sequelize — User, Customer, Technician, Order, dll (10)
├── middleware/       # Auth JWT, Device, Role, Upload, ErrorHandler
├── services/        # Algorithm WRTA, Email, OTP, Cloudinary, Payment
├── controllers/     # Auth, Order, Technician, Admin, OTP, Payment, Review, Upload
├── routes/          # authRoutes ~ viewRoutes (9 file)
├── views/           # EJS — auth, customer, technician, admin (18 halaman)
├── public/          # CSS design system + JavaScript helpers
├── docs/            # Dokumentasi lengkap (12 file)
├── test/            # Smoke test (5 case, CI-ready)
├── database/        # SQL schema referensi
├── .github/         # CI/CD workflow
├── server.js        # Entry point
├── Dockerfile
├── docker-compose.yml
└── railway.json     # Deployment config
```

---

## Dokumentasi

| # | Dokumen | Isi |
|---|---------|-----|
| 1 | `docs/01-prd.md` | Product Requirement Document |
| 2 | `docs/02-user-story.md` | User Stories + Acceptance Criteria |
| 3 | `docs/03-erd.md` | Entity Relationship Diagram (10 tabel) |
| 4 | `docs/04-architecture.md` | Arsitektur MVC + Docker + Request Flow |
| 5 | `docs/05-api-spec.md` | Spesifikasi 41 endpoint API |
| 6 | `docs/06-wireframe.md` | Wireframe & UI Design System |
| 7 | `docs/07-algorithm.md` | Algoritma WRTA — detail, pseudocode, analisis |
| 8 | `docs/08-security.md` | Desain Keamanan 6 layer |
| 9 | `docs/09-integration.md` | Integrasi Cloudinary, Nodemailer, Midtrans |
| 10 | `docs/10-testing.md` | Rencana Pengujian (20+ test case) |
| 11 | `docs/11-setup-guide.md` | Panduan Menjalankan + Troubleshooting |
| 12 | `docs/12-program-flow.md` | Alur Program — decision tree, state diagram |

---

## Lisensi

ISC — Proyek tugas mata kuliah **Pemrograman Fullstack**.  
Dosen: Irfan Nurdiansyah, S.Kom., M.Kom.
