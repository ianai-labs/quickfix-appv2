# 11 — Panduan Setup & Menjalankan

## Quickfix App v2 — Step-by-Step Guide

---

## A. Prasyarat

Pastikan sudah terinstall di komputer:

| Software | Versi Minimal | Cek Instalasi |
|----------|:------------:|---------------|
| **Docker** | 24+ | `docker --version` |
| **Docker Compose** | v2+ | `docker compose version` |
| **Git** | 2.30+ | `git --version` |
| **Node.js** (opsional) | 20+ | `node --version` |

> **Windows Users**: Gunakan [Docker Desktop](https://www.docker.com/products/docker-desktop/) + WSL2.
> **Mac Users**: Docker Desktop atau [OrbStack](https://orbstack.dev/).
> **Linux Users**: Docker Engine + Docker Compose plugin.

---

## B. Clone Repository

```bash
git clone <repository-url> quickfix-appv2
cd quickfix-appv2
```

---

## C. Konfigurasi Environment

### 1. Salin `.env.example` ke `.env`

```bash
# Linux / Mac
cp .env.example .env

# Windows (Command Prompt)
copy .env.example .env
```

### 2. Edit `.env` — minimal ubah `JWT_SECRET`

```bash
# Generate random secret (Linux/Mac):
openssl rand -hex 32

# Atau pakai Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Buka file `.env` dengan text editor, ganti `JWT_SECRET`:

```env
JWT_SECRET=hasil-random-hex-di-atas
JWT_REFRESH_SECRET=random-string-lain
DEVICE_SECRET=random-string-lain-lagi
```

> **Minimal**: cukup `JWT_SECRET` yang diubah. Yang lain bisa pakai default untuk development.

### 3. Konfigurasi Opsional

#### Cloudinary (untuk upload foto)
1. Daftar gratis di https://cloudinary.com
2. Dapatkan credentials dari dashboard
3. Isi di `.env`:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc123xyz
```

#### SMTP Email (untuk kirim OTP via email)
1. Gunakan Gmail App Password (https://myaccount.google.com/apppasswords)
2. Isi di `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email-anda@gmail.com
SMTP_PASS=16-digit-app-password
SMTP_FROM="Quickfix App <noreply@quickfix.local>"
```

> **Tanpa Cloudinary & SMTP**: Aplikasi tetap berjalan. OTP bisa dilihat langsung di database (phpMyAdmin), dan upload file akan menampilkan error yang jelas.

---

## D. Menjalankan Aplikasi

### 1. Build & Start

```bash
docker compose up -d
```

Tunggu proses download image (pertama kali ~2-5 menit, tergantung koneksi).

Cek status container:
```bash
docker compose ps
```

Harus muncul 3 container dengan status **Up** / **healthy**:
```
NAME                 STATUS
quickfix_mysql       Up X minutes (healthy)
quickfix_phpmyadmin  Up X minutes
quickfix_app         Up X minutes
```

### 2. Akses Aplikasi

| Service | URL | Kegunaan |
|---------|-----|----------|
| **Aplikasi** | http://localhost:3000 | Web utama |
| **phpMyAdmin** | http://localhost:8081 | Manajemen database |
| **Health Check** | http://localhost:3000/health | Cek status server |

### 3. Login

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin — kelola teknisi & lihat semua order |
| `budi` | `admin123` | Customer — booking perbaikan |
| `siti` | `admin123` | Customer — booking perbaikan |
| `andi` | `admin123` | Teknisi AC/Listrik (PREMIUM ⭐) |
| `rudi` | `admin123` | Teknisi Pipa/Atap |
| `dewi` | `admin123` | Teknisi AC/Pipa |

> **Pertama login**: Akan diminta OTP karena device baru. Cek kode OTP di phpMyAdmin → tabel `otp_codes`.

### 4. Cek OTP untuk Development

Karena SMTP belum tentu dikonfigurasi, OTP bisa dilihat langsung:

1. Buka http://localhost:8080
2. Login phpMyAdmin:
   - **Server**: `mysql`
   - **Username**: `root`
   - **Password**: `rootpassword`
3. Buka database `quickfix_v2` → tabel `otp_codes`
4. Cari kode dengan `used = 0` — itu kode OTP aktif

---

## E. Perintah Docker Sehari-hari

```bash
# Start semua container
docker compose up -d

# Stop semua container
docker compose down

# Restart app (setelah edit kode)
docker compose restart app

# Lihat log app (real-time)
docker compose logs -f app

# Lihat log MySQL
docker compose logs mysql

# Masuk ke container app
docker compose exec app sh

# Reset database (hapus semua data)
docker compose down -v
docker compose up -d
```

---

## F. Development Mode

Saat mengedit kode, server otomatis **hot-reload** berkat nodemon. Cukup:
1. Edit file `.js` / `.ejs` / `.css` di host
2. Nodemon mendeteksi perubahan → auto-restart
3. Refresh browser

> **Volume mount**: Folder proyek di-mount ke container. Edit di host langsung ter-reflect di container.

### Install dependencies baru

```bash
# Masuk container
docker compose exec app sh

# Install package
npm install nama-package

# Atau dari host (restart container setelahnya)
docker compose restart app
```

---

## G. Troubleshooting

### "Port 3000 already in use"
```bash
# Cek apa yang pakai port 3000
sudo lsof -i :3000

# Ganti port di docker-compose.yml:
#   ports:
#     - "3001:3000"   # akses via localhost:3001

# Atau di .env:
#   PORT=3001
```

### "ECONNREFUSED — MySQL not ready"
Ini normal saat pertama kali start. MySQL butuh beberapa detik untuk inisialisasi. App akan retry otomatis 5x dengan jeda 3 detik. Tunggu sampai log muncul `✅ Database connected successfully`.

### "Token tidak valid" saat login
1. Cek `.env` — JWT_SECRET sudah diisi?
2. Coba restart app: `docker compose restart app`
3. Clear cookie browser

### "Gagal mengupload foto"
Cloudinary belum dikonfigurasi. Isi `CLOUDINARY_*` di `.env` atau skip fitur upload untuk sekarang.

### "OTP tidak terkirim"
SMTP belum dikonfigurasi. Cek OTP langsung di database via phpMyAdmin.

### Reset total (hapus semua data + volume)
```bash
docker compose down -v
docker compose up -d --build
```

---

## H. Struktur Port

| Port | Service | Keterangan |
|:----:|---------|------------|
| 3000 | Express App | Aplikasi web |
| 3307 | MySQL | Database (di-mapping dari 3306 container) |
| 8081 | phpMyAdmin | Database GUI |

> MySQL menggunakan port **3307** (bukan 3306) untuk menghindari konflik dengan MySQL lokal.

---

## I. Daftar Perintah Cepat

```bash
# Clone & Setup
git clone <url> && cd quickfix-appv2 && cp .env.example .env

# Edit .env — ganti JWT_SECRET
nano .env

# Run
docker compose up -d

# Cek
curl http://localhost:3000/health

# Buka browser
# http://localhost:3000          → Aplikasi
# http://localhost:8080          → phpMyAdmin

# Stop
docker compose down

# Reset
docker compose down -v && docker compose up -d --build
```
