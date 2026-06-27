# 12 — Alur Program Lengkap

## Quickfix App v2 — User Flow, Business Flow & System Flow

---

## 1. User Flow — Navigasi Per Role

### Customer (Pemilik Rumah)

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│   REGISTER   │────▶│     LOGIN        │────▶│  CUSTOMER DASHBOARD  │
│ /register    │     │ / (index)        │     │ /customer/dashboard  │
│              │     │ + OTP jika       │     │                      │
│              │     │   device baru    │     │  ┌─────────────────┐ │
└──────────────┘     └─────────────────┘     │  │ List Orders Saya│ │
                                              │  │ Filter by status│ │
                                              │  └────────┬────────┘ │
                                              │           │          │
                                              │  ┌────────▼────────┐ │
                                              │  │ Klik "Detail"   │ │
                                              │  └────────┬────────┘ │
                                              │           │          │
                                              └───────────┼──────────┘
                                                          │
                        ┌─────────────────────────────────┤
                        ▼                                ▼
              ┌──────────────────┐           ┌──────────────────────┐
              │  BUAT ORDER      │           │   DETAIL ORDER        │
              │ /customer/orders │           │ /customer/orders/:id  │
              │   /new           │           │                       │
              │                  │           │  - Status tracking    │
              │ Pilih layanan   │           │  - Info teknisi       │
              │ Deskripsi       │           │  - OTP verification   │
              │ Alamat          │           │  - Foto pekerjaan     │
              │ [Submit]        │           │                       │
              └──────────────────┘           └───────────────────────┘
```

### Technician (Tukang Perbaikan)

```
┌──────────────┐     ┌─────────────────┐     ┌────────────────────────┐
│    LOGIN     │────▶│    DASHBOARD     │────▶│     JOB DETAIL         │
│              │     │ /technician/     │     │ /technician/jobs/:id   │
│              │     │   dashboard      │     │                        │
└──────────────┘     │                  │     │  ┌──────────────────┐  │
                     │ ┌──────────────┐ │     │  │ Update Status:   │  │
                     │ │ Order Masuk  │ │     │  │ [On The Way]     │  │
                     │ │ [Terima]     │ │     │  │ [Mulai Pekerjaan]│  │
                     │ │ [Tolak]      │ │     │  │ [Selesai]        │  │
                     │ └──────────────┘ │     │  └──────────────────┘  │
                     │                  │     │                        │
                     │ ┌──────────────┐ │     │  ┌──────────────────┐  │
                     │ │ Order Aktif  │ │     │  │ Upload Foto      │  │
                     │ │ [Detail]     │ │     │  │ (Cloudinary)     │  │
                     │ └──────────────┘ │     │  └──────────────────┘  │
                     │                  │     │                        │
                     │ [🟢 Online/Offline]│   └────────────────────────┘
                     └──────────────────┘
```

### Admin (Pengelola Platform)

```
┌──────────────┐     ┌─────────────────┐
│    LOGIN     │────▶│ ADMIN DASHBOARD │
│              │     │ /admin/dashboard│
└──────────────┘     │                 │
                     │ ┌─────────────┐ │     ┌──────────────────┐
                     │ │ Statistik   │ │────▶│ KELOLA TEKNISI    │
                     │ └─────────────┘ │     │ /admin/technicians│
                     │                 │     │ - Set Premium    │
                     │ ┌─────────────┐ │     │ - Lihat performa │
                     │ │ Orders      │ │     └──────────────────┘
                     │ │ Terbaru     │ │
                     │ └─────────────┘ │     ┌──────────────────┐
                     │                 │────▶│ KELOLA USERS      │
                     │                 │     │ /admin/users      │
                     └─────────────────┘     └──────────────────┘
```

---

## 2. Business Flow — Siklus Bisnis End-to-End

```
CUSTOMER          SYSTEM                TECHNICIAN           EMAIL
   │                │                      │                   │
   │ 1. Buat Order  │                      │                   │
   ├───────────────▶│                      │                   │
   │                │ 2. Algoritma WRTA    │                   │
   │                │    Assign teknisi    │                   │
   │                ├─────────────────────▶│                   │
   │                │                      │ 3. Notifikasi     │
   │                │                      │    Order baru     │
   │                │                      ├──────────────────▶│
   │                │                      │                   │
   │ 4. Notifikasi  │                      │                   │
   │    Teknisi     │                      │                   │
   │◀───────────────┼──────────────────────┼───────────────────│
   │                │                      │                   │
   │                │                      │ 5. Accept Order   │
   │                │◀─────────────────────┤                   │
   │                │    Status: assigned  │                   │
   │                │                      │                   │
   │                │                      │ 6. On The Way     │
   │                │◀─────────────────────┤                   │
   │                │  Status: on_the_way  │                   │
   │                │  Generate OTP ──────────────────────────▶│
   │                │                      │                   │
   │ 7. Terima OTP  │                      │                   │
   │◀───────────────┼──────────────────────┼───────────────────│
   │                │                      │                   │
   │ 8. Verifikasi  │                      │                   │
   │    OTP         │                      │                   │
   ├───────────────▶│                      │                   │
   │                │  Status: in_progress │                   │
   │                ├─────────────────────▶│                   │
   │                │                      │                   │
   │                │                      │ 9. Kerjakan       │
   │                │                      │    Perbaikan      │
   │                │                      │    Upload foto    │
   │                │                      │    (Cloudinary)   │
   │                │                      │                   │
   │                │                      │ 10. Selesai       │
   │                │◀─────────────────────┤                   │
   │                │   Status: done       │                   │
   │                │   Update tech stats  │                   │
   │                │                      │                   │
   │ 11. Lihat Foto │                      │                   │
   │    Hasil       │                      │                   │
   │◀───────────────┤                      │                   │
   │                │                      │                   │
```

---

## 3. System Flow — Request Lifecycle

Setiap HTTP request yang masuk melalui pipeline berikut:

```
HTTP REQUEST
    │
    ▼
┌─────────────────────────────────────────────┐
│ 1. GLOBAL MIDDLEWARE                        │
│    - express.json()         Parse body JSON │
│    - express.urlencoded()   Parse form data │
│    - cookieParser()         Parse cookies   │
│    - express-session()      Session handler │
│    - rateLimit()            Rate limiting   │
│    - JWT decode (views)     User dari cookie│
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ 2. ROUTER                                   │
│    - Cocokkan URL pattern                   │
│    - API: /api/auth, /api/orders, ...       │
│    - Web: /customer/*, /admin/*, ...        │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ 3. ROUTE-SPECIFIC MIDDLEWARE                │
│    - auth()             JWT verification    │
│    - authorize(roles)   Role check          │
│    - deviceInfo()       Device ID attach    │
│    - upload.single()    Multer file parse   │
│    - loginLimiter       Rate limit login    │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ 4. CONTROLLER                               │
│    - Validasi input                         │
│    - Business logic                         │
│    - Panggil Service                        │
│    - Response JSON / render view            │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ 5. SERVICE LAYER                            │
│    - algorithm.js     Assign teknisi        │
│    - otpService.js    Generate & verify OTP │
│    - emailService.js  Kirim email           │
│    - cloudinarySvc.js Upload ke cloud       │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ 6. MODEL LAYER (Sequelize)                  │
│    - Query database                         │
│    - Relasi & eager loading                 │
│    - Validasi data                          │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ 7. MySQL 8.0                                │
└─────────────────────────────────────────────┘
                     │
                     ▼
              HTTP RESPONSE
         { success, message, data }
           atau HTML (EJS rendered)
```

---

## 4. Authentication Flow

### First Login (Device Baru)

```
POST /api/auth/login
    │
    ▼
┌──────────────────────┐
│ 1. Validasi input    │  login + password wajib
└──────┬───────────────┘
       ▼
┌──────────────────────┐
│ 2. Cari user         │  WHERE username = ? OR email = ?
└──────┬───────────────┘
       ▼
┌──────────────────────┐
│ 3. Verifikasi pass   │  bcrypt.compare()
└──────┬───────────────┘
       ▼
┌──────────────────────┐
│ 4. Generate device   │  SHA256(user-agent + IP + secret)
│    ID dari request   │
└──────┬───────────────┘
       ▼
┌──────────────────────┐
│ 5. Cek tabel devices │  WHERE user_id AND device_id
└──────┬───────────────┘
       ▼
   ┌───┴───┐
   │ FOUND?│
   └───┬───┘
       │
   ┌───┴────────────────────────────┐
   │ NO                             │ YES + verified
   ▼                                ▼
┌──────────────────┐         ┌──────────────────┐
│ Insert Device    │         │ Issue JWT        │
│ is_verified=0    │         │ Set cookie       │
│                  │         │ Return token     │
│ Generate OTP     │         └──────────────────┘
│ Kirim via email  │
│                  │
│ Return:          │
│ { require_otp,   │
│   temp_token }   │
└──────┬───────────┘
       ▼
┌──────────────────────┐
│ User input OTP       │  POST /api/auth/verify-device
│ + temp_token         │
└──────┬───────────────┘
       ▼
┌──────────────────────┐
│ Verifikasi OTP code  │  Cek di tabel otp_codes
│ + expiry + used      │
└──────┬───────────────┘
       ▼
┌──────────────────────┐
│ Device.is_verified=1 │
│ Issue JWT + cookies  │
│ Return full token    │
└──────────────────────┘

SUBSEQUENT LOGIN: Device FOUND + verified → Langsung JWT (tanpa OTP)
```

---

## 5. Order Lifecycle

```
pending ──────▶ assigned ──────▶ on_the_way ──────▶ in_progress ──────▶ done
  │                │                │                   │                │
  │                │                │                   │                │
  ▼                ▼                ▼                   ▼                ▼
Customer        Algoritma        Technician          Customer         Technician
buat order      assign           klik               verifikasi        klik
                teknisi          "On The Way"       OTP              "Selesai"
                                                   (OTP di-         Update
                Customer         OTP dikirim        kirim via        tech stats
                dapat            ke customer        email)           (total_jobs
                notifikasi                                             +1)
                email
```

### Status Transitions

| Dari | Ke | Actor | Trigger |
|------|----|-------|---------|
| — | `pending` | System | Customer POST /api/orders |
| `pending` | `assigned` | System | Algoritma assignTechnician() |
| `assigned` | `assigned` | Tech | Accept order |
| `assigned` | `on_the_way` | Tech | PUT status=on_the_way → OTP dikirim |
| `on_the_way` | `in_progress` | Customer | OTP verified |
| `in_progress` | `done` | Tech | PUT status=done → tech stats++ |
| `assigned` | `pending` | System | Tech reject → re-assign |

---

## 6. Algorithm Flow — WRTA

```
Order masuk
    │
    ▼
┌──────────────────────────────────┐
│ 1. TRIGGER                       │
│    orderController.create()      │
│    orderController.reassign()    │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│ 2. FILTER TECHNICIANS            │
│    WHERE status = 'online'       │
│    AND spesialisasi LIKE         │
│        '%keyword_order%'         │
│                                  │
│    extractKeyword():             │
│    "Perbaikan AC" → "AC"         │
│    "Instalasi Listrik"→"Listrik" │
└──────────────┬───────────────────┘
               ▼
          ┌────┴────┐
          │ n == 0? │──▶ return null (tidak ada teknisi)
          └────┬────┘
               │ n > 0
               ▼
┌──────────────────────────────────┐
│ 3. CALCULATE WEIGHTS             │
│    for each technician:          │
│                                  │
│    weight = 1.0                  │
│    if is_premium: weight *= 3.0  │
│    weight *= max(rating/5, 0.1)  │
│                                  │
│    Simpan di weighted[] array    │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│ 4. RANDOM SELECTION              │
│    total = sum(weights)          │
│    random = Math.random()*total  │
│    cumulative walk:              │
│      cumulative += weight        │
│      if random <= cumulative     │
│        → RETURN technician       │
└──────────────┬───────────────────┘
               ▼
         Teknisi terpilih
         → Update order.technician_id
         → Update order.status = 'assigned'
```

---

## 7. Device + OTP Flow

```
┌─────────────────────────────────────────────────────────┐
│                     LOGIN ATTEMPT                       │
└────────────────────────┬────────────────────────────────┘
                         ▼
              ┌─────────────────────┐
              │ Generate Device ID  │
              │ SHA256(UA + IP +    │
              │   DEVICE_SECRET)    │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ SELECT FROM devices │
              │ WHERE user_id AND   │
              │   device_id         │
              └──────────┬──────────┘
                         ▼
                    ┌────┴────┐
                    │  FOUND?  │
                    └────┬────┘
                         │
          ┌──────────────┴──────────────┐
          │ NOT FOUND                   │ FOUND
          ▼                             ▼
┌──────────────────────┐      ┌──────────────────────┐
│ INSERT new device    │      │ is_verified?         │
│ is_verified = false  │      └──────────┬───────────┘
│                      │                 │
│ GENERATE OTP (6 dig) │      ┌──────────┴──────────┐
│ SAVE to otp_codes    │      │ YES        │ NO     │
│ SEND via email       │      ▼            ▼        │
│                      │ ┌──────────┐ ┌───────────┐ │
│ RESPONSE:            │ │ ISSUE   │ │ OTP FLOW  │ │
│ { require_otp: true, │ │ JWT     │ │ (seperti  │ │
│   temp_token }       │ │ DIRECT  │ │ device    │ │
└──────────┬───────────┘ └──────────┘ │ baru)     │ │
           │                          └───────────┘ │
           ▼                                         │
┌──────────────────────┐                             │
│ USER INPUT OTP       │                             │
│ POST /verify-device  │                             │
└──────────┬───────────┘                             │
           ▼                                         │
┌──────────────────────┐                             │
│ VERIFY:              │                             │
│ - Code match         │                             │
│ - Not used           │                             │
│ - Not expired (5min) │                             │
└──────────┬───────────┘                             │
           ▼                                         │
┌──────────────────────┐                             │
│ Device verified = 1  │                             │
│ ISSUE JWT + cookies  │                             │
└──────────────────────┘                             │
```

---

## 8. Email Notification Flow

| Event | Trigger | Penerima | Isi |
|-------|---------|----------|-----|
| **OTP Device Verify** | Login dari device baru | User yang login | Kode OTP 6-digit, expired 5 menit |
| **OTP Order Verify** | Teknisi klik "On The Way" | Customer | Kode OTP untuk verifikasi teknisi |
| **Reset Password** | Forgot password | User (email terdaftar) | Link reset + token, expired 1 jam |
| **Order Assigned** | Algoritma assign teknisi | Customer | Info teknisi (nama, rating, no HP) |
| **New Order** | Customer buat order | Technician (yang di-assign) | Info order (layanan, alamat) |

### Fallback: Jika SMTP tidak dikonfigurasi
- Email TIDAK dikirim (warning di log)
- OTP tetap tersimpan di database
- Untuk development: cek OTP langsung di phpMyAdmin → tabel `otp_codes`
- Untuk production: selalu konfigurasi SMTP

---

## 9. Folder Structure & Responsibility

```
quickfix-appv2/
├── server.js                 # Express entry, middleware global, start server
│
├── config/                   # Konfigurasi environment-dependent
│   ├── constants.js          # Enum & magic number elimination
│   ├── database.js           # Sequelize + connection retry
│   ├── cloudinary.js         # Cloudinary SDK init
│   └── nodemailer.js         # SMTP transporter
│
├── models/                   # Database schema definition
│   ├── index.js              # Associations (hasMany, belongsTo)
│   ├── User.js, Device.js, Customer.js
│   ├── Technician.js, Order.js, OrderPhoto.js, OtpCode.js
│
├── middleware/                # Request pipeline
│   ├── auth.js               # JWT verification
│   ├── role.js               # Role-based authorization
│   ├── device.js             # Device ID generator + detector
│   ├── upload.js             # Multer config
│   └── errorHandler.js       # Global error handler
│
├── services/                 # Business services
│   ├── algorithm.js          # WRTA — weighted assignment
│   ├── otpService.js         # OTP generate, send, verify
│   ├── emailService.js       # Email templates + send
│   └── cloudinaryService.js  # Upload/delete to Cloudinary
│
├── controllers/              # Request handlers
│   ├── authController.js     # Register, login, forgot/reset, verify-device
│   ├── orderController.js    # CRUD + algorithm trigger
│   ├── technicianController.js
│   ├── uploadController.js
│   └── otpController.js
│
├── routes/                   # URL definitions
│   ├── authRoutes.js
│   ├── orderRoutes.js
│   ├── technicianRoutes.js
│   ├── uploadRoutes.js
│   └── otpRoutes.js
│
├── views/                    # EJS templates
│   ├── layouts/main.ejs      # Layout wrapper (navbar + flash + footer)
│   ├── partials/             # Reusable components
│   ├── auth/                 # Login, register, forgot, reset
│   ├── customer/             # Dashboard, create order, detail
│   ├── technician/           # Dashboard, job detail
│   └── admin/                # Dashboard, technicians, users
│
├── public/                   # Static assets
│   ├── css/style.css         # Tema kuning-putih
│   └── js/main.js            # Helper functions
│
├── database/
│   └── quickfix_v2.sql       # Schema + seed data
│
├── docs/                     # Dokumentasi (12 file)
│   ├── 01-prd.md             # Product Requirement
│   ├── 02-user-story.md      # User Stories
│   ├── 03-erd.md             # Entity Diagram
│   ├── 04-architecture.md    # Arsitektur MVC
│   ├── 05-api-spec.md        # API Specification
│   ├── 06-wireframe.md       # UI Design
│   ├── 07-algorithm.md       # Algoritma WRTA
│   ├── 08-security.md        # Desain Keamanan
│   ├── 09-integration.md     # Integrasi Eksternal
│   ├── 10-testing.md         # Rencana Pengujian
│   ├── 11-setup-guide.md     # Panduan Menjalankan
│   └── 12-program-flow.md    # Alur Program (file ini)
│
├── docker-compose.yml        # Docker orchestration
├── Dockerfile                # App container
├── .env.example              # Template environment
└── README.md                 # Project overview
```
