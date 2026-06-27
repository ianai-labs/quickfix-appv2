# 02 — User Stories

## Quickfix App v2

---

## Customer (Pemilik Rumah / Pemesan Jasa)

### US-C01: Registrasi Akun
> Sebagai **calon customer**, saya ingin **mendaftar akun** dengan username, email, dan password agar **dapat menggunakan layanan Quickfix**.

**Acceptance Criteria:**
- Form registrasi: username (min 3 karakter), email (valid), password (min 6 karakter), konfirmasi password
- Password di-hash dengan bcrypt sebelum disimpan
- Email dan username bersifat unik (tidak boleh duplikat)
- Setelah berhasil registrasi, redirect ke halaman login dengan flash message sukses

---

### US-C02: Login ke Aplikasi
> Sebagai **customer**, saya ingin **login** ke aplikasi agar **dapat membuat dan memantau order perbaikan**.

**Acceptance Criteria:**
- Login dengan username/email + password
- Jika credentials valid → cek device ID
- Jika device dikenal → langsung masuk ke dashboard
- Jika device baru → kirim OTP ke email, user harus verifikasi sebelum masuk
- JWT token disimpan untuk autentikasi subsequent requests

---

### US-C03: Membuat Order Perbaikan
> Sebagai **customer**, saya ingin **membuat order perbaikan** dengan memilih jenis layanan, mengisi deskripsi, dan alamat agar **teknisi dapat dikirim ke lokasi saya**.

**Acceptance Criteria:**
- Form berisi: jenis layanan (dropdown), deskripsi masalah (textarea), alamat lengkap (textarea)
- Jenis layanan: Perbaikan AC, Instalasi Listrik, Perbaikan Pipa, Perbaikan Atap, Lainnya
- Order tersimpan dengan status `pending`
- Sistem otomatis mencari dan menugaskan teknisi (via algoritma)
- Customer mendapat notifikasi email saat teknisi di-assign

---

### US-C04: Melihat Status Order
> Sebagai **customer**, saya ingin **melihat status order** saya secara real-time agar **tahu perkembangan perbaikan**.

**Acceptance Criteria:**
- Dashboard menampilkan daftar order saya dengan status terbaru
- Status: pending → assigned → on_the_way → in_progress → done
- Warna berbeda untuk tiap status
- Klik order untuk melihat detail lengkap

---

### US-C05: Verifikasi Teknisi dengan OTP
> Sebagai **customer**, saya ingin **memverifikasi teknisi dengan kode OTP** saat teknisi tiba di lokasi agar **memastikan orang yang tepat yang melakukan perbaikan**.

**Acceptance Criteria:**
- Saat teknisi update status ke `on_the_way`, OTP dikirim ke email customer
- Customer memasukkan OTP di halaman detail order
- OTP berlaku 5 menit
- Setelah verifikasi berhasil, status berubah ke `in_progress`

---

### US-C06: Melihat Foto Hasil Pekerjaan
> Sebagai **customer**, saya ingin **melihat foto hasil pekerjaan** teknisi agar **dapat memastikan kualitas perbaikan**.

**Acceptance Criteria:**
- Teknisi upload foto ke Cloudinary
- Foto tampil di halaman detail order customer
- Foto memiliki keterangan (sebelum/sesudah)

---

## Technician (Teknisi / Tukang Perbaikan)

### US-T01: Mendaftar Sebagai Teknisi
> Sebagai **calon teknisi**, saya ingin **mendaftar** dan melengkapi profil teknisi (spesialisasi, nomor HP) agar **dapat menerima order**.

**Acceptance Criteria:**
- Registrasi teknisi via admin atau form khusus
- Data: spesialisasi, nomor HP, rating awal 5.0
- Admin yang menyetujui status premium teknisi

---

### US-T02: Menerima & Menolak Order
> Sebagai **teknisi**, saya ingin **melihat order yang masuk** dan dapat **menerima atau menolak** order tersebut.

**Acceptance Criteria:**
- Dashboard teknisi menampilkan daftar order yang di-assign ke saya
- Tombol "Terima" → status berubah ke `assigned`
- Tombol "Tolak" → sistem mencari teknisi lain (re-assign via algoritma)
- Notifikasi email untuk setiap order baru

---

### US-T03: Update Status Pekerjaan
> Sebagai **teknisi**, saya ingin **mengupdate status pengerjaan** (on the way, in progress, done) agar **customer mendapat informasi real-time**.

**Acceptance Criteria:**
- Tombol "On The Way" → status berubah, customer dapat notifikasi
- Tombol "Mulai Pekerjaan" → hanya aktif setelah OTP diverifikasi customer
- Tombol "Selesai" → status done, order complete

---

### US-T04: Upload Foto Pekerjaan
> Sebagai **teknisi**, saya ingin **mengupload foto sebelum dan sesudah perbaikan** sebagai dokumentasi hasil kerja.

**Acceptance Criteria:**
- Form upload foto di halaman detail job
- Foto di-upload ke Cloudinary
- Bisa upload multiple foto
- Foto tampil di gallery setelah upload

---

### US-T05: Set Status Ketersediaan
> Sebagai **teknisi**, saya ingin **set status online/offline** agar **hanya menerima order saat saya tersedia**.

**Acceptance Criteria:**
- Toggle online/offline di dashboard teknisi
- Saat offline, tidak masuk pool algoritma distribusi
- Saat busy (sedang mengerjakan order), otomatis tidak tersedia

---

## Admin (Pengelola Platform)

### US-A01: Dashboard Statistik
> Sebagai **admin**, saya ingin **melihat dashboard** dengan ringkasan data (total user, order, teknisi) agar **dapat memonitor platform**.

**Acceptance Criteria:**
- Statistik: total customer, total teknisi, total order hari ini, order selesai
- Grafik sederhana atau angka ringkasan

---

### US-A02: Kelola Data Teknisi
> Sebagai **admin**, saya ingin **mengelola data teknisi** dan **mengatur status premium** teknisi.

**Acceptance Criteria:**
- Tabel daftar teknisi (nama, spesialisasi, rating, status premium)
- Toggle premium status
- Lihat performa teknisi (total job selesai, rating)

---

### US-A03: Melihat Semua Order
> Sebagai **admin**, saya ingin **melihat semua order** di sistem untuk **monitoring dan penanganan masalah**.

**Acceptance Criteria:**
- Tabel semua order dengan filter (status, tanggal)
- Bisa melihat detail order
- Tidak bisa mengubah data order (read-only)

---

### US-A04: Kelola User
> Sebagai **admin**, saya ingin **melihat daftar semua user** dan dapat **menonaktifkan** user jika diperlukan.

**Acceptance Criteria:**
- Tabel user (username, email, role, status aktif)
- Toggle aktif/nonaktif user
