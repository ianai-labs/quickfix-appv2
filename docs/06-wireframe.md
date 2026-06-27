# 06 — Wireframe & UI Design

## Quickfix App v2

**Tema**: Kuning (#f5b800) & Putih — diadaptasi dari Quickfix App v1

---

## 1. Design System

### Warna
| Nama | Hex | Penggunaan |
|------|-----|------------|
| Primary (Kuning) | `#f5b800` | Button, active nav, brand |
| Primary Hover | `#e0a800` | Button hover |
| Background | `#f5f6f8` | Body background |
| White | `#ffffff` | Card, navbar |
| Text Dark | `#222222` | Text body |
| Success | `#28a745` | Alert success, status done |
| Danger | `#dc3545` | Alert danger, button delete |
| Info | `#17a2b8` | Button info |
| Border | `#d0d5dd` | Input border, card border |

### Tipografi
- **Font**: Segoe UI, Tahoma, sans-serif
- **Heading**: 1.5rem - 2rem, bold
- **Body**: 1rem, regular
- **Small**: 0.875rem

### Komponen
| Komponen | Deskripsi |
|----------|-----------|
| `.navbar` | White, shadow, brand text kuning, nav links |
| `.card` | White, border-radius 8px, shadow |
| `.btn` | Full-width, border-radius 4px |
| `.btn-primary` | Kuning `#f5b800`, text hitam |
| `.btn-danger` | Merah |
| `.btn-success` | Hijau |
| `.btn-sm` | Kompak, padding kecil |
| `.form-group` | Spacing, label + input |
| `.form-control` | Input/select/textarea, border `#d0d5dd`, focus ring kuning |
| `.table` | Full-width, collapsed border, gray header, hover row |
| `.alert-success` | Green bg, white text |
| `.alert-danger` | Red bg, white text |
| `.pagination` | Centered flex, active state kuning |
| `.badge` | Status label (pending=gray, assigned=blue, done=green) |

---

## 2. Halaman & Layout

### 2.1 Layout Utama (`views/layouts/main.ejs`)

```
┌────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────┐ │
│  │  NAVBAR                                         │ │
│  │  [Quickfix]    Home  Orders   [User ▼] [Logout] │ │
│  │  (brand)       (nav links)     (dropdown)       │ │
│  └────────────────────────────────────────────────┘ │
│                                                    │
│  ┌────────────────────────────────────────────────┐ │
│  │  FLASH MESSAGE (alert-success / alert-danger)   │ │
│  └────────────────────────────────────────────────┘ │
│                                                    │
│  ┌────────────────────────────────────────────────┐ │
│  │                                                │ │
│  │  CONTENT (yield dari child view)               │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                    │
│  ┌────────────────────────────────────────────────┐ │
│  │  FOOTER  © 2026 Quickfix App                   │ │
│  └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

**Navbar berdasarkan role:**
- **Customer**: Home | Orders Saya | [Logout]
- **Technician**: Home | Job Queue | Upload | [Status Toggle] | [Logout]
- **Admin**: Home | Orders | Technicians | Users | [Logout]

---

### 2.2 Halaman Login (`/` atau `/login`)

```
┌──────────────────────────────────────────────┐
│           Background: Gradien + Foto         │
│                                              │
│   ┌──────────────────────────────────┐       │
│   │      🔧 Quickfix App             │       │
│   │     Layanan Perbaikan Rumah      │       │
│   │──────────────────────────────────│       │
│   │                                  │       │
│   │  Username/Email: [__________]    │       │
│   │  Password:       [__________]    │       │
│   │                                  │       │
│   │  Captcha: 7 + 3 = ?  [____]     │       │
│   │                                  │       │
│   │  [✓] Remember Me                │       │
│   │                                  │       │
│   │  [          LOGIN          ]     │       │
│   │                                  │       │
│   │  Belum punya akun? Register      │       │
│   │  Lupa password? Reset            │       │
│   └──────────────────────────────────┘       │
└──────────────────────────────────────────────┘
```

---

### 2.3 Customer Dashboard (`/customer/dashboard`)

```
┌──────────────────────────────────────────────────────────┐
│  NAVBAR: Quickfix | Orders Saya | [Budi ▼]               │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐│
│  │  Dashboard Customer            [ + Buat Order Baru ] ││
│  ├──────────────────────────────────────────────────────┤│
│  │  Filter: [Semua ▼]  Search: [____________] [Cari]   ││
│  ├──────────────────────────────────────────────────────┤│
│  │  ┌─────────────────────────────────────────────────┐ ││
│  │  │ #1 │ Perbaikan AC │ Assigned │ 27 Jun 10:00 │ → │ ││
│  │  ├─────────────────────────────────────────────────┤ ││
│  │  │ #2 │ Instalasi Listrik │ Done │ 25 Jun 14:30 │ → │ ││
│  │  ├─────────────────────────────────────────────────┤ ││
│  │  │ #3 │ Perbaikan Pipa │ Pending │ 27 Jun 09:00 │ → │ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  │                                                      ││
│  │            [Prev]  1  2  3  [Next]                   ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

---

### 2.4 Customer — Detail Order (`/customer/orders/:id`)

```
┌──────────────────────────────────────────────────────────┐
│  NAVBAR: ...                                             │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐│
│  │  Order #123 — Perbaikan AC                           ││
│  │  Status: [ASSIGNED] → [OTW] → [IN PROGRESS] → [DONE]││
│  ├──────────────────────────────────────────────────────┤│
│  │                                                      ││
│  │  📋 Detail Order                                     ││
│  │  ┌─────────────────────────────────────────────────┐ ││
│  │  │ Layanan: Perbaikan AC                           │ ││
│  │  │ Deskripsi: AC tidak dingin, bunyi berisik       │ ││
│  │  │ Alamat: Jl. Merdeka No. 123                     │ ││
│  │  │ Dibuat: 27 Juni 2026, 10:00                     │ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  │                                                      ││
│  │  👨‍🔧 Teknisi                                          ││
│  │  ┌─────────────────────────────────────────────────┐ ││
│  │  │ Nama: Andi         Rating: ⭐4.8                 │ ││
│  │  │ Spesialisasi: AC   No HP: 0812xxx               │ ││
│  │  │ Status: PREMIUM 🔥                              │ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  │                                                      ││
│  │  🔐 Verifikasi Teknisi (muncul saat status OTW)      ││
│  │  ┌─────────────────────────────────────────────────┐ ││
│  │  │ Masukkan kode OTP yang dikirim ke email Anda:   │ ││
│  │  │ [______] [Verifikasi]                           │ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  │                                                      ││
│  │  📸 Foto Pekerjaan                                   ││
│  │  ┌──────┐ ┌──────┐ ┌──────┐                        │ ││
│  │  │Sebelum│ │Sesudah│ │ ...  │                        │ ││
│  │  └──────┘ └──────┘ └──────┘                        │ ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

---

### 2.5 Technician Dashboard (`/technician/dashboard`)

```
┌──────────────────────────────────────────────────────────┐
│  NAVBAR: Quickfix | Job Queue | [Andi ▼]  [🟢 Online]  │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐│
│  │  Dashboard Teknisi — Rating: ⭐4.8 | Premium: 🔥     ││
│  │  Status: [🟢 Online] / [🔴 Offline]  (toggle)       ││
│  ├──────────────────────────────────────────────────────┤│
│  │  Order Masuk (Pending Assignment)                    ││
│  │  ┌─────────────────────────────────────────────────┐ ││
│  │  │ #1 │ Perbaikan AC │ Budi │ Jl. Merdeka         │ ││
│  │  │    │ [Terima] [Tolak]                           │ ││
│  │  ├─────────────────────────────────────────────────┤ ││
│  │  │ #2 │ Instalasi Listrik │ Siti │ Jl. Sudirman   │ ││
│  │  │    │ [Terima] [Tolak]                           │ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  │                                                      ││
│  │  Order Aktif (Sedang Dikerjakan)                     ││
│  │  ┌─────────────────────────────────────────────────┐ ││
│  │  │ #5 │ Perbaikan Pipa │ Dewi │ Status: Assigned   │ ││
│  │  │    │ [On The Way] [Detail]                      │ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  │                                                      ││
│  │  Riwayat (Selesai)                                   ││
│  │  ┌─────────────────────────────────────────────────┐ ││
│  │  │ #3 │ Perbaikan AC │ Rudi │ Done │ 25 Jun       │ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

---

### 2.6 Admin Dashboard (`/admin/dashboard`)

```
┌──────────────────────────────────────────────────────────┐
│  NAVBAR: Quickfix | Orders | Technicians | Users         │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐│
│  │  Admin Dashboard                                     ││
│  ├──────────────────────────────────────────────────────┤│
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐     ││
│  │  │  25    │ │  12    │ │  50    │ │   10     │     ││
│  │  │Customer│ │Teknisi │ │ Orders │ │Order Hari│     ││
│  │  │        │ │        │ │Total   │ │Ini       │     ││
│  │  └────────┘ └────────┘ └────────┘ └──────────┘     ││
│  │                                                      ││
│  │  Order Terbaru                                       ││
│  │  ┌─────────────────────────────────────────────────┐ ││
│  │  │ ID │ Layanan │ Customer │ Teknisi │ Status     │ ││
│  │  │ 1  │ AC      │ Budi     │ Andi    │ In Progress│ ││
│  │  │ 2  │ Listrik │ Siti     │ -       │ Pending    │ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

---

## 3. Alur Navigasi

```
/login ──────────────────────────────────────────────────────────────┐
  │                                                                  │
  ├── /register ──▶ /login                                           │
  ├── /forgot-password ──▶ /reset-password?token= ──▶ /login         │
  │                                                                  │
  ▼ (login sukses)                                                   │
  │                                                                  │
  ├── Customer ──▶ /customer/dashboard ──▶ /customer/orders/new      │
  │                 │                      └──▶ /customer/orders/:id │
  │                 └──▶ /customer/orders/:id                        │
  │                                                                  │
  ├── Technician ──▶ /technician/dashboard ──▶ /technician/jobs/:id  │
  │                                                                  │
  └── Admin ──▶ /admin/dashboard                                     │
                 ├──▶ /admin/technicians                             │
                 ├──▶ /admin/orders                                  │
                 └──▶ /admin/users                                   │
```
