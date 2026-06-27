# 04 — Arsitektur Sistem

## Quickfix App v2

---

## 1. Pola Arsitektur: MVC (Model-View-Controller)

Quickfix App v2 mengadopsi **arsitektur monolitik** dengan pola **MVC**, cocok untuk skala project pembelajaran dan tim 3 orang.

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                    │
│                    EJS Rendered HTML + CSS               │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTP Request / Response
                       ▼
┌──────────────────────────────────────────────────────────┐
│                   EXPRESS.JS SERVER                      │
│                                                          │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  ROUTES   │───▶│ CONTROLLERS  │───▶│   SERVICES    │  │
│  │           │    │              │    │               │  │
│  │ auth      │    │ authCtrl     │    │ algorithm     │  │
│  │ orders    │    │ orderCtrl    │    │ emailService  │  │
│  │ tech      │    │ techCtrl     │    │ otpService    │  │
│  │ upload    │    │ uploadCtrl   │    │ cloudinarySvc │  │
│  │ otp       │    │ otpCtrl      │    │               │  │
│  └──────────┘    └──────┬───────┘    └───────┬───────┘  │
│                         │                    │           │
│                         ▼                    ▼           │
│                    ┌──────────────┐    ┌───────────┐    │
│                    │   MODELS     │    │ EXTERNAL   │    │
│                    │  (Sequelize) │    │  SERVICES  │    │
│                    │              │    │           │    │
│                    │ User         │    │ Cloudinary │    │
│                    │ Device       │    │ Nodemailer │    │
│                    │ Customer     │    │            │    │
│                    │ Technician   │    │            │    │
│                    │ Order        │    │            │    │
│                    │ OrderPhoto   │    │            │    │
│                    │ OtpCode      │    │            │    │
│                    └──────┬───────┘    └───────────┘    │
│                           │                              │
└───────────────────────────┼──────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   MySQL 8.0  │
                    │  (Docker)    │
                    └──────────────┘
```

---

## 2. Middleware Pipeline

Request yang masuk melewati pipeline middleware sebelum mencapai controller:

```
REQUEST
  │
  ├── express.json()            # Parse JSON body
  ├── express.urlencoded()      # Parse form body
  ├── cookieParser()            # Parse cookies
  ├── express-session()         # Session management
  ├── connect-flash()           # Flash messages
  │
  ├── [Public Routes]           # /, /login, /register, /api/auth/*
  │   └── No auth check
  │
  ├── [Protected Routes]        # /customer/*, /technician/*, /admin/*, /api/*
  │   ├── authMiddleware.js     # Verify JWT token
  │   ├── deviceMiddleware.js   # Check device ID ⭐
  │   └── roleMiddleware.js     # Check user role
  │
  ▼
CONTROLLER
```

---

## 3. Flow Request-Response (Contoh: Customer Buat Order)

```
1. Customer submit form → POST /api/orders
2. authMiddleware verifikasi JWT dari cookie/header
3. roleMiddleware pastikan role = 'customer'
4. orderController.create()
   ├── Validasi input (layanan, deskripsi, alamat)
   ├── Simpan order ke database (status = 'pending')
   ├── Panggil algorithmService.assignTechnician()
   │   ├── Query teknisi online + spesialisasi cocok
   │   ├── Hitung bobot (premium, rating)
   │   └── Random weighted select → return teknisi
   ├── Update order dengan technician_id
   ├── Kirim email notifikasi ke teknisi via emailService
   └── Return response JSON (order + teknisi)
5. Customer redirect ke halaman detail order
```

---

## 4. Docker Container Architecture

```
┌─────────────────────────────────────────────────┐
│               Docker Network                     │
│             (quickfix_network)                   │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐             │
│  │   mysql      │  │  phpmyadmin  │             │
│  │   MySQL 8.0  │  │  (port 8080) │             │
│  │  (port 3307) │  │              │             │
│  └──────┬───────┘  └──────────────┘             │
│         │                                        │
│         ▼                                        │
│  ┌──────────────┐                                │
│  │    app       │  Node.js 20 Alpine             │
│  │  (port 3000) │  Express + EJS + Sequelize     │
│  │              │  Nodemon hot-reload            │
│  └──────────────┘                                │
│                                                  │
│  Volumes:                                        │
│  ├── mysql_data (DB persistent)                  │
│  └── .:/app (source code live sync)              │
└─────────────────────────────────────────────────┘
```

---

## 5. Struktur Direktori & Tanggung Jawab

| Direktori | Tanggung Jawab | Dependency |
|-----------|---------------|------------|
| `config/` | Koneksi database, Cloudinary, Nodemailer | `.env` |
| `models/` | Definisi Sequelize models & relasi | `config/database.js` |
| `routes/` | Definisi route + middleware binding | `controllers/`, `middleware/` |
| `controllers/` | Business logic, request handling | `models/`, `services/` |
| `services/` | Algoritma, integrasi eksternal | `config/`, `models/` |
| `middleware/` | Auth, device check, role, upload | `models/`, `services/` |
| `views/` | Template EJS (UI rendering) | `controllers/` |
| `public/` | Static assets (CSS, JS, images) | — |

---

## 6. Technology Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Runtime | Node.js | 20 (Alpine) |
| Framework | Express.js | 4.21 |
| Template Engine | EJS | 3.1 |
| ORM | Sequelize | 6.37 |
| Database | MySQL | 8.0 |
| Auth | JWT (jsonwebtoken) | 9.0 |
| Password | bcryptjs | 2.4 |
| File Upload | Multer | 1.4 |
| Cloud Storage | Cloudinary | 2.3 |
| Email | Nodemailer | 6.9 |
| Container | Docker + Docker Compose | — |
