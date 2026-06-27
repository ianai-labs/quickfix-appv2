# 10 — Rencana Pengujian

## Quickfix App v2

---

## 1. Strategi Pengujian

| Level | Tools | Cakupan |
|-------|-------|---------|
| **Unit Testing** | Jest | Services (algorithm, OTP), utility functions |
| **Integration Testing** | Supertest + Jest | API endpoints, middleware, database |
| **User Acceptance Testing** | Manual | Skenario end-to-end per role |

---

## 2. Unit Testing

### 2.1 Algorithm Service — `services/algorithm.js`

#### TC-A01: Semua teknisi online dengan spesialisasi cocok
```
Input:
  - Order: { layanan: "AC" }
  - Technicians: [
      { nama: "Andi", spesialisasi: "AC", is_premium: true, rating: 5.0, status: "online" },
      { nama: "Budi", spesialisasi: "AC", is_premium: false, rating: 5.0, status: "online" },
    ]

Expected:
  - Andi terpilih lebih sering dari Budi (sekitar 3:1 dalam 1000 iterasi)
  - Tidak ada teknisi lain yang terpilih
```

#### TC-A02: Teknisi offline tidak masuk pool
```
Input:
  - Order: { layanan: "Listrik" }
  - Technicians: [
      { nama: "Cici", spesialisasi: "Listrik", is_premium: false, rating: 5.0, status: "offline" },
    ]

Expected: return null (tidak ada teknisi tersedia)
```

#### TC-A03: Tidak ada teknisi dengan spesialisasi cocok
```
Expected: return null
```

#### TC-A04: Satu teknisi tersedia
```
Expected: Teknisi tersebut selalu terpilih (100% dalam 1000 iterasi)
```

#### TC-A05: Semua teknisi premium
```
Expected: Distribusi proporsional ke rating (semua punya 3.0 base × rating/5.0)
```

#### TC-A06: Semua teknisi rating 0
```
Expected: Tetap ada teknisi terpilih (gunakan minimum bobot 0.1)
System tidak crash / division by zero
```

---

### 2.2 OTP Service — `services/otpService.js`

#### TC-O01: Generate OTP menghasilkan 6 digit
```
Input: generateCode()
Expected: String 6 karakter numerik ("000000" - "999999")
```

#### TC-O02: OTP valid diverifikasi
```
Input:
  - Buat OTP: send(userId, email, 'device_verify')
  - Verify: verify(userId, code, 'device_verify')

Expected: return true
```

#### TC-O03: OTP expired tidak bisa diverifikasi
```
Input:
  - Buat OTP dengan expires_at = 5 menit lalu
  - Verify dengan kode yang benar

Expected: throw Error "Kode OTP sudah kadaluarsa"
```

#### TC-O04: OTP digunakan tidak bisa dipakai lagi
```
Input:
  - Verify pertama: success
  - Verify kedua dengan kode sama

Expected: throw Error "Kode OTP tidak valid"
```

#### TC-O05: OTP salah ditolak
```
Input:
  - Buat OTP: "123456"
  - Verify: "654321"

Expected: throw Error "Kode OTP tidak valid"
```

---

### 2.3 Device ID — `middleware/device.js`

#### TC-D01: Device ID konsisten
```
Input:
  - Request dengan user-agent dan IP yang sama
  - Panggil generateDeviceId() 2 kali

Expected: Hasil identik
```

#### TC-D02: Device ID berbeda untuk device berbeda
```
Input:
  - Request 1: user-agent "Chrome/Windows", IP "192.168.1.1"
  - Request 2: user-agent "Firefox/Android", IP "10.0.0.1"

Expected: Hasil berbeda
```

---

## 3. Integration Testing (API)

### 3.1 Auth Endpoints

#### TC-I-AUTH01: Register sukses
```
POST /api/auth/register
Body: { username: "testuser", email: "test@test.com", password: "123456", password_confirm: "123456", role: "customer" }
Expected: 201, success: true
```

#### TC-I-AUTH02: Register username duplikat
```
Expected: 400, "Username sudah digunakan"
```

#### TC-I-AUTH03: Register password tidak cocok
```
Body: { password: "123456", password_confirm: "654321" }
Expected: 400
```

#### TC-I-AUTH04: Login valid → device baru → minta OTP
```
POST /api/auth/login
Body: { login: "testuser", password: "123456" }
Expected: 200, require_otp: true, temp_token ada
```

#### TC-I-AUTH05: Login valid → device dikenal → langsung JWT
```
Expected: 200, token ada, user data ada
```

#### TC-I-AUTH06: Login password salah
```
Expected: 401, "Username/email atau password salah"
```

---

### 3.2 OTP Endpoints

#### TC-I-OTP01: Kirim OTP sukses
```
POST /api/otp/send
Headers: Authorization: Bearer <temp_token>
Expected: 200, expires_in: 300
```

#### TC-I-OTP02: Verifikasi OTP sukses
```
POST /api/otp/verify
Body: { token: "<temp_token>", code: "<valid_code>", type: "device_verify" }
Expected: 200, token (JWT) ada
```

#### TC-I-OTP03: Verifikasi OTP gagal (salah)
```
Expected: 400, "Kode OTP tidak valid"
```

---

### 3.3 Order Endpoints

#### TC-I-ORDER01: Buat order (customer)
```
POST /api/orders
Headers: Authorization: Bearer <jwt_customer>
Body: { layanan: "Perbaikan AC", deskripsi: "AC rusak", alamat: "Jl. Test 123" }
Expected: 201, order.status = "assigned" atau "pending", technician terisi
```

#### TC-I-ORDER02: Buat order tanpa auth
```
Expected: 401
```

#### TC-I-ORDER03: Buat order dengan role technician
```
Expected: 403
```

#### TC-I-ORDER04: Lihat daftar order (customer — hanya order sendiri)
```
GET /api/orders
Expected: 200, orders hanya milik customer tersebut
```

#### TC-I-ORDER05: Update status order (technician)
```
PUT /api/orders/:id
Body: { status: "on_the_way" }
Expected: 200, status berubah
```

#### TC-I-ORDER06: Re-assign teknisi (setelah reject)
```
PUT /api/orders/:id/assign
Expected: 200, technician_id baru berbeda dari sebelumnya
```

---

### 3.4 Upload Endpoints

#### TC-I-UPLOAD01: Upload foto sukses
```
POST /api/upload
Form: photo=<file_jpg>, order_id=1, description="Sebelum"
Expected: 201, response.data.photo.photo_url valid (Cloudinary URL)
```

#### TC-I-UPLOAD02: Upload file non-gambar
```
Form: photo=<file.exe>
Expected: 400
```

#### TC-I-UPLOAD03: Upload file > 5MB
```
Expected: 400
```

---

## 4. User Acceptance Testing (Manual)

### 4.1 Skenario Customer

| Step | Action | Expected |
|:----:|--------|----------|
| C1 | Buka `/register`, isi form, submit | Redirect ke login, flash message sukses |
| C2 | Login dengan credential baru | Redirect ke customer dashboard |
| C3 | Klik "Buat Order Baru" | Form booking tampil |
| C4 | Isi form, pilih "Perbaikan AC", deskripsi, alamat, submit | Redirect ke detail order, status order tampil |
| C5 | Jika device baru → cek email untuk OTP | Email berisi 6-digit OTP |
| C6 | Masukkan OTP di halaman verifikasi | Login sukses, masuk dashboard |
| C7 | Cek status order di dashboard | Order tampil dengan status terkini |
| C8 | Saat teknisi OTW → cek email untuk OTP verifikasi | Email berisi OTP order |
| C9 | Masukkan OTP di halaman detail order | Status berubah ke in_progress |
| C10 | Setelah done, lihat foto hasil pekerjaan | Foto tampil di halaman detail |

### 4.2 Skenario Technician

| Step | Action | Expected |
|:----:|--------|----------|
| T1 | Login sebagai teknisi | Dashboard teknisi tampil |
| T2 | Set status Online | Toggle berubah ke hijau |
| T3 | Order masuk → cek email | Notifikasi email diterima |
| T4 | Klik "Terima" pada order | Status order berubah ke assigned |
| T5 | Klik "On The Way" | Status order berubah ke on_the_way |
| T6 | Klik "Mulai Pekerjaan" | Hanya aktif jika OTP sudah diverifikasi customer |
| T7 | Upload foto (sebelum & sesudah) | Foto sukses terupload, tampil di halaman |
| T8 | Klik "Selesai" | Status order berubah ke done |

### 4.3 Skenario Admin

| Step | Action | Expected |
|:----:|--------|----------|
| A1 | Login sebagai admin | Admin dashboard tampil dengan statistik |
| A2 | Klik menu "Technicians" | Daftar teknisi tampil |
| A3 | Toggle premium pada teknisi | Status premium berubah |
| A4 | Klik menu "Orders" | Semua order tampil |
| A5 | Filter order berdasarkan status | Hanya order dengan status tersebut tampil |
| A6 | Klik menu "Users" | Daftar user tampil |

### 4.4 Skenario Device Tracking + OTP

| Step | Action | Expected |
|:----:|--------|----------|
| D1 | Login di Chrome (PC) | Device terdeteksi, OTP dikirim, verifikasi → masuk |
| D2 | Logout | Session clear |
| D3 | Login lagi di Chrome (PC) | Langsung masuk tanpa OTP (device dikenal) |
| D4 | Login di Firefox (PC lain / private mode) | OTP diminta (device baru) |
| D5 | Cek email, masukkan OTP | Masuk dengan device baru terdaftar |

---

## 5. Checklist Pengujian Produksi

- [ ] Semua unit test pass (algorithm, OTP, device)
- [ ] Semua integration test pass (API endpoints)
- [ ] Semua skenario UAT pass (customer, technician, admin)
- [ ] Device tracking berfungsi (device baru = OTP, device dikenal = langsung)
- [ ] OTP dikirim via email dan verifikasi berfungsi
- [ ] Algoritma distribusi proporsional (verifikasi dengan 1000 iterasi)
- [ ] Upload foto ke Cloudinary berfungsi
- [ ] Rate limiting aktif di endpoint sensitif
- [ ] Error handling tidak mengekspos detail database
- [ ] `.env` tidak di-commit ke repository
