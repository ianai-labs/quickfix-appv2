# 03 — Entity Relationship Diagram (ERD)

## Quickfix App v2

---

## Diagram Relasi

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────────┐
│     users       │       │    devices       │       │    otp_codes        │
├─────────────────┤       ├──────────────────┤       ├─────────────────────┤
│ id (PK)         │──┐    │ id (PK)          │       │ id (PK)             │
│ username        │  │    │ user_id (FK) ────┼───────│ user_id (FK)        │
│ email           │  ├───▶│ device_id        │       │ code                │
│ password        │  │    │ device_name      │       │ type                │
│ role            │  │    │ is_verified      │       │ expires_at          │
│ avatar_url      │  │    │ first_login      │       │ used                │
│ reset_token     │  │    │ last_login       │       │ created_at          │
│ reset_expires   │  │    └──────────────────┘       └─────────────────────┘
│ created_at      │  │
└─────────────────┘  │
        │            │
        │            │       ┌──────────────────┐       ┌─────────────────────┐
        │            │       │   technicians    │       │     orders          │
        │            │       ├──────────────────┤       ├─────────────────────┤
        │            │       │ id (PK)          │       │ id (PK)             │
        │            └──────▶│ user_id (FK)     │◀──────│ technician_id (FK)  │
        │                    │ spesialisasi     │       │ customer_id (FK)    │──┐
        │                    │ rating           │       │ layanan             │  │
        │                    │ is_premium       │       │ deskripsi           │  │
        │                    │ status           │       │ alamat              │  │
        │                    │ total_jobs       │       │ status              │  │
        │                    │ no_hp            │       │ harga               │  │
        │                    │ created_at       │       │ otp_code            │  │
        │                    └──────────────────┘       │ created_at          │  │
        │                                               │ updated_at          │  │
        │                                               └─────────────────────┘  │
        │                    ┌──────────────────┐                │              │
        │                    │   customers      │                │              │
        │                    ├──────────────────┤                │              │
        │                    │ id (PK)          │                │              │
        └───────────────────▶│ user_id (FK)     │◀───────────────┘              │
                             │ alamat           │                               │
                             │ no_hp            │        ┌─────────────────────┐ │
                             │ created_at       │        │   order_photos      │ │
                             └──────────────────┘        ├─────────────────────┤ │
                                                          │ id (PK)             │ │
                                                          │ order_id (FK) ──────┼─┘
                                                          │ photo_url           │
                                                          │ uploaded_by (FK) ───┤──▶ users.id
                                                          │ description         │
                                                          │ uploaded_at         │
                                                          └─────────────────────┘
```

---

## Deskripsi Entitas & Relasi

### 1. `users` — Data Autentikasi
Menyimpan kredensial dan informasi dasar semua pengguna (customer, technician, admin).

**Primary Key**: `id`
**Unique**: `username`, `email`

---

### 2. `devices` — Tracking Device Login 🔐
Menyimpan perangkat yang pernah digunakan untuk login oleh setiap user.

| Relasi | Tipe |
|--------|------|
| `users` 1 : N `devices` | One-to-Many |

**Foreign Key**: `user_id` → `users.id`

---

### 3. `otp_codes` — Kode Verifikasi 🔐
Menyimpan kode OTP yang dikirim ke user untuk verifikasi (device baru, order, reset password).

| Relasi | Tipe |
|--------|------|
| `users` 1 : N `otp_codes` | One-to-Many |

**Foreign Key**: `user_id` → `users.id`

---

### 4. `customers` — Profil Customer
Menyimpan data tambahan customer setelah registrasi.

| Relasi | Tipe |
|--------|------|
| `users` 1 : 1 `customers` | One-to-One |

**Foreign Key**: `user_id` → `users.id`

---

### 5. `technicians` — Profil Teknisi
Menyimpan data profesional teknisi, rating, dan status premium.

| Relasi | Tipe |
|--------|------|
| `users` 1 : 1 `technicians` | One-to-One |

**Foreign Key**: `user_id` → `users.id`

---

### 6. `orders` — Order Perbaikan
Menyimpan data pemesanan jasa perbaikan.

| Relasi | Tipe |
|--------|------|
| `customers` 1 : N `orders` | One-to-Many |
| `technicians` 1 : N `orders` | One-to-Many (nullable, diisi setelah assign) |

**Foreign Keys**:
- `customer_id` → `customers.id`
- `technician_id` → `technicians.id` (nullable)

---

### 7. `order_photos` — Foto Pekerjaan
Menyimpan URL foto yang di-upload ke Cloudinary.

| Relasi | Tipe |
|--------|------|
| `orders` 1 : N `order_photos` | One-to-Many |
| `users` 1 : N `order_photos` | One-to-Many (uploaded_by) |

**Foreign Keys**:
- `order_id` → `orders.id`
- `uploaded_by` → `users.id`

---

## Ringkasan Relasi

| Entitas A | Kardinalitas | Entitas B |
|-----------|:---:|-----------|
| users | 1 : N | devices |
| users | 1 : N | otp_codes |
| users | 1 : 1 | customers |
| users | 1 : 1 | technicians |
| customers | 1 : N | orders |
| technicians | 1 : N | orders |
| orders | 1 : N | order_photos |
| users | 1 : N | order_photos |
