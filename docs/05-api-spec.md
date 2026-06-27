# 05 — API Specification

## Quickfix App v2

**Base URL**: `http://localhost:3000/api`
**Format**: JSON
**Auth**: JWT Bearer Token (via Cookie atau Authorization header)

---

## Response Standar

### Success
```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Pesan error",
  "errors": ["detail error 1", "detail error 2"]
}
```

---

## 1. Auth Module — `/api/auth`

### `POST /api/auth/register`
Registrasi user baru.

**Body:**
```json
{
  "username": "budi123",
  "email": "budi@email.com",
  "password": "rahasia123",
  "password_confirm": "rahasia123",
  "role": "customer"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registrasi berhasil, silakan login",
  "data": { "user_id": 1, "username": "budi123" }
}
```

**Error (400):** Username/email sudah digunakan, password tidak cocok, validasi gagal.

---

### `POST /api/auth/login`
Login user. Cek device ID, trigger OTP jika device baru.

**Body:**
```json
{
  "login": "budi123 atau budi@email.com",
  "password": "rahasia123"
}
```

**Response (200) — Device dikenal:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": 1, "username": "budi123", "email": "...", "role": "customer" }
  }
}
```

**Response (200) — Device baru (perlu OTP):**
```json
{
  "success": true,
  "message": "Device baru terdeteksi, silakan verifikasi OTP",
  "data": {
    "require_otp": true,
    "temp_token": "eyJhbGciOi...",
    "device_name": "Chrome / Windows"
  }
}
```

---

### `POST /api/auth/forgot-password`
Kirim link reset password ke email.

**Body:**
```json
{
  "email": "budi@email.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Jika email terdaftar, link reset password telah dikirim"
}
```

---

### `POST /api/auth/reset-password`
Reset password dengan token.

**Body:**
```json
{
  "token": "abc123...",
  "password": "passwordbaru",
  "password_confirm": "passwordbaru"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password berhasil direset, silakan login"
}
```

---

## 2. OTP Module — `/api/otp`

### `POST /api/otp/send`
Kirim ulang OTP.

**Headers:** `Authorization: Bearer <temp_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Kode OTP telah dikirim ke email Anda",
  "data": { "expires_in": 300 }
}
```

---

### `POST /api/otp/verify`
Verifikasi OTP (untuk device baru, order, dll).

**Body:**
```json
{
  "token": "<temp_token atau order_token>",
  "code": "123456",
  "type": "device_verify | order_verify | reset_password"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP berhasil diverifikasi",
  "data": { "token": "eyJhbGciOi..." }
}
```

---

## 3. Orders Module — `/api/orders` 🔒

*Semua endpoint memerlukan JWT auth.*

### `GET /api/orders`
List orders (filter by role).

**Query:** `?status=pending&page=1&limit=10`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "layanan": "Perbaikan AC",
        "status": "assigned",
        "customer": { "nama": "Budi" },
        "technician": { "nama": "Andi", "spesialisasi": "AC" },
        "created_at": "2026-06-27T10:00:00Z"
      }
    ],
    "pagination": { "page": 1, "totalPages": 3, "totalItems": 25 }
  }
}
```

---

### `POST /api/orders`
Buat order baru (customer only).

**Headers:** `Authorization: Bearer <jwt_token>`

**Body:**
```json
{
  "layanan": "Perbaikan AC",
  "deskripsi": "AC tidak dingin, ada bunyi berisik",
  "alamat": "Jl. Merdeka No. 123, Jakarta Pusat"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order berhasil dibuat",
  "data": {
    "order": {
      "id": 1,
      "layanan": "Perbaikan AC",
      "status": "assigned",
      "technician": { "nama": "Andi", "no_hp": "0812..." }
    }
  }
}
```

---

### `GET /api/orders/:id`
Detail order.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "layanan": "Perbaikan AC",
      "deskripsi": "AC tidak dingin",
      "alamat": "Jl. Merdeka No. 123",
      "status": "in_progress",
      "customer": { "nama": "Budi", "no_hp": "0813..." },
      "technician": { "nama": "Andi", "no_hp": "0812...", "rating": 4.8 },
      "photos": [
        { "id": 1, "photo_url": "https://res.cloudinary.com/...", "description": "Sebelum perbaikan" }
      ],
      "created_at": "2026-06-27T10:00:00Z",
      "updated_at": "2026-06-27T10:30:00Z"
    }
  }
}
```

---

### `PUT /api/orders/:id`
Update status order (technician / customer).

**Body:**
```json
{
  "status": "on_the_way | in_progress | done | cancelled"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Status order diperbarui",
  "data": { "order": { ... } }
}
```

---

### `PUT /api/orders/:id/assign`
Re-assign teknisi (trigger algoritma ulang). Untuk case teknisi reject.

**Response (200):**
```json
{
  "success": true,
  "message": "Teknisi baru berhasil di-assign",
  "data": { "technician": { "nama": "Rudi", ... } }
}
```

---

## 4. Technicians Module — `/api/technicians` 🔒

### `GET /api/technicians`
List teknisi (admin).

**Query:** `?status=online&spesialisasi=AC&page=1`

---

### `GET /api/technicians/:id`
Detail teknisi + performa.

---

### `PUT /api/technicians/:id`
Update teknisi (admin: set premium, dll).

**Body:**
```json
{
  "is_premium": true,
  "spesialisasi": "AC,Listrik"
}
```

---

### `PUT /api/technicians/:id/status`
Update status ketersediaan (technician sendiri).

**Body:**
```json
{
  "status": "online | offline"
}
```

---

## 5. Upload Module — `/api/upload` 🔒

### `POST /api/upload`
Upload foto ke Cloudinary.

**Headers:** `Content-Type: multipart/form-data`

**Form:**
| Field | Type | Keterangan |
|-------|------|------------|
| `photo` | File | Gambar (jpg, png, max 5MB) |
| `order_id` | Integer | ID order |
| `description` | String | "Sebelum perbaikan" |

**Response (201):**
```json
{
  "success": true,
  "message": "Foto berhasil diupload",
  "data": {
    "photo": {
      "id": 1,
      "photo_url": "https://res.cloudinary.com/demo/image/upload/v1/quickfix/orders/...",
      "description": "Sebelum perbaikan"
    }
  }
}
```

---

## Daftar Kode HTTP

| Kode | Keterangan |
|:----:|------------|
| 200 | OK — request berhasil |
| 201 | Created — data berhasil dibuat |
| 400 | Bad Request — validasi gagal |
| 401 | Unauthorized — tidak ada token / token invalid |
| 403 | Forbidden — role tidak diizinkan |
| 404 | Not Found — data tidak ditemukan |
| 429 | Too Many Requests — rate limit tercapai |
| 500 | Internal Server Error |
