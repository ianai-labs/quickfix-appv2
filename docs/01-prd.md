# 01 — Product Requirement Document (PRD)

## Quickfix App v2 — Platform Layanan Handyman

---

## 1. Latar Belakang

### 1.1 Masalah
- Pemilik rumah sering kesulitan mencari teknisi (AC, listrik, pipa) yang terpercaya dan tersedia cepat
- Teknisi lepas (freelance) kesulitan mendapat pelanggan secara konsisten
- Tidak ada transparansi status pengerjaan — customer tidak tahu kapan teknisi datang
- Tidak ada sistem verifikasi yang memastikan teknisi yang datang adalah orang yang tepat

### 1.2 Solusi
Quickfix App v2 adalah **platform on-demand** yang mempertemukan customer dengan teknisi perbaikan rumah secara cepat, transparan, dan aman. Sistem secara otomatis menugaskan teknisi terbaik berdasarkan ketersediaan dan kualitas (premium & rating), dengan verifikasi OTP untuk keamanan.

---

## 2. Tujuan Produk

1. **Mempertemukan** customer dengan teknisi perbaikan rumah secara efisien
2. **Mengotomatisasi** distribusi order dengan algoritma yang adil dan insentif
3. **Menjamin keamanan** melalui Device ID tracking dan OTP verification
4. **Menyediakan tracking** status order secara real-time
5. **Mendokumentasikan** hasil pekerjaan dengan foto (cloud storage)

---

## 3. Target Pengguna

| Role | Deskripsi |
|------|-----------|
| **Customer** | Pemilik rumah/penghuni yang membutuhkan jasa perbaikan |
| **Technician** | Tukang/teknisi profesional yang menyediakan jasa perbaikan |
| **Admin** | Pengelola platform yang memonitor dan mengelola sistem |

---

## 4. Fitur Utama

### 4.1 Autentikasi & Keamanan
| Fitur | Prioritas | Keterangan |
|-------|-----------|------------|
| Register & Login | P0 — Must | Username/email + password (bcrypt) |
| JWT Authentication | P0 — Must | Access token + refresh token |
| Device ID Tracking | P0 — Must | Deteksi device saat login, catat device baru |
| OTP Verification | P0 — Must | Verifikasi login dari device berbeda |
| Forgot/Reset Password | P1 — Should | Token via email, masa berlaku 1 jam |

### 4.2 Customer
| Fitur | Prioritas | Keterangan |
|-------|-----------|------------|
| Buat Order | P0 — Must | Pilih layanan, deskripsi, alamat |
| Tracking Status | P0 — Must | Lihat status order real-time |
| OTP Verifikasi Teknisi | P0 — Must | Verifikasi teknisi saat tiba di lokasi |
| Lihat Foto Hasil | P1 — Should | Foto sebelum & sesudah perbaikan |
| Riwayat Order | P1 — Should | Daftar order yang pernah dibuat |

### 4.3 Technician
| Fitur | Prioritas | Keterangan |
|-------|-----------|------------|
| Notifikasi Order Baru | P0 — Must | Via email |
| Accept / Reject Order | P0 — Must | Teknisi bisa terima atau tolak |
| Update Status | P0 — Must | On the way, in progress, done |
| Upload Foto | P1 — Should | Sebelum & sesudah perbaikan ke Cloudinary |
| Set Status Online/Offline | P1 — Should | Ketersediaan teknisi |

### 4.4 Admin
| Fitur | Prioritas | Keterangan |
|-------|-----------|------------|
| Dashboard Statistik | P1 — Should | Total order, teknisi, customer |
| Kelola User | P1 — Should | Lihat, nonaktifkan user |
| Kelola Teknisi | P1 — Should | Set status premium, lihat performa |
| Lihat Semua Order | P1 — Should | Monitoring seluruh order |

### 4.5 Algoritma (Nilai Plus)
| Fitur | Prioritas | Keterangan |
|-------|-----------|------------|
| Weighted Random Assignment | P0 — Must | Teknisi premium + rating tinggi prioritas |

### 4.6 Integrasi
| Fitur | Prioritas | Keterangan |
|-------|-----------|------------|
| Cloud File Storage | P0 — Must | Cloudinary untuk foto pekerjaan |
| Email Service | P0 — Must | Nodemailer untuk OTP & notifikasi |
| OTP System | P0 — Must | Generate & verifikasi kode OTP |

---

## 5. Batasan (Constraints)

- **Platform**: Web-based (Frontend + Backend)
- **Backend**: Node.js dengan Express.js
- **Database**: MySQL 8.0
- **Deployment**: Docker Compose (development)
- **Bahasa**: Indonesia (UI)
- **Target**: Minimal 3 user role dapat berfungsi penuh

---

## 6. Kriteria Sukses

1. ✅ Semua user role (customer, technician, admin) dapat login dan menggunakan fitur
2. ✅ Algoritma distribusi order berfungsi — teknisi premium mendapat lebih banyak order
3. ✅ OTP terkirim via email dan dapat diverifikasi
4. ✅ Device ID tracking berfungsi — login dari device baru memicu OTP
5. ✅ Foto dapat di-upload ke Cloudinary dan tampil di halaman order
6. ✅ Aplikasi berjalan penuh dengan `docker compose up -d`

---

## 7. Lingkup Pengembangan

| Area | Cakupan |
|------|---------|
| **Backend** | RESTful API, autentikasi, bisnis logic, algoritma |
| **Frontend** | Server-rendered (EJS), mobile-responsive, tema kuning-putih |
| **Database** | 7 tabel dengan relasi, seed data untuk demo |
| **Integrasi** | Cloudinary (cloud storage), Nodemailer (email), OTP |
| **Dokumentasi** | PRD, User Story, ERD, Arsitektur, API Spec, Wireframe, Algoritma, Security, Integrasi, Testing |
