# 09 — Integrasi Eksternal

## Quickfix App v2

Sesuai syarat tugas, aplikasi harus memiliki **minimal satu** integrasi sistem. Quickfix App v2 mengimplementasikan **tiga integrasi** sekaligus.

---

## 1. Cloudinary — Cloud File Storage

### 1.1 Mengapa Cloudinary?
- **Free tier** cukup (25GB storage, 25GB bandwidth/bulan)
- REST API sederhana
- SDK Node.js resmi (`cloudinary`)
- Transformasi gambar on-the-fly (resize, crop, optimize)
- CDN global

### 1.2 Konfigurasi

```javascript
// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
```

### 1.3 Folder Structure di Cloudinary

```
quickfix/
├── avatars/          # Foto profil user
│   └── user_1.jpg
├── orders/           # Foto pekerjaan
│   ├── order_1/
│   │   ├── before_1.jpg
│   │   └── after_1.jpg
│   └── order_2/
│       └── before_1.jpg
```

### 1.4 Service Upload

```javascript
// services/cloudinaryService.js
const cloudinary = require('../config/cloudinary');

async function uploadPhoto(filePath, orderId, description) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `quickfix/orders/order_${orderId}`,
      use_filename: true,
      unique_filename: true,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
      ]
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Gagal mengupload foto ke cloud storage');
  }
}

async function deletePhoto(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
}

module.exports = { uploadPhoto, deletePhoto };
```

### 1.5 Keamanan Upload

- **Multer middleware** memvalidasi tipe file (MIME) dan ukuran (max 5MB)
- Hanya ekstensi: jpg, jpeg, png, webp
- File temporary dihapus setelah upload ke Cloudinary
- URL Cloudinary disimpan di database (`order_photos.photo_url`)

```javascript
// middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `temp_${Date.now()}_${Math.random().toString(36).substr(2, 8)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file JPG, PNG, dan WEBP yang diizinkan'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
```

---

## 2. Nodemailer — Email Service

### 2.1 Mengapa Nodemailer?
- Library Node.js paling populer untuk email
- Support berbagai SMTP provider
- Gratis (pakai Gmail SMTP)
- Support HTML template & attachment

### 2.2 Konfigurasi

```javascript
// config/nodemailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verifikasi koneksi saat startup
transporter.verify()
  .then(() => console.log('✅ SMTP Email siap'))
  .catch(err => console.error('❌ SMTP Error:', err.message));

module.exports = transporter;
```

### 2.3 Template Email

```javascript
// services/emailService.js
const transporter = require('../config/nodemailer');

async function sendOTP(email, code, type) {
  const subjects = {
    device_verify: '[Quickfix] Verifikasi Device Baru',
    order_verify: '[Quickfix] Kode Verifikasi Teknisi',
    reset_password: '[Quickfix] Reset Password',
  };

  const messages = {
    device_verify: `Device baru terdeteksi pada akun Anda.`,
    order_verify: `Teknisi telah tiba di lokasi. Gunakan kode berikut untuk verifikasi.`,
    reset_password: `Gunakan kode berikut untuk mereset password Anda.`,
  };

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: subjects[type],
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #f5b800;">🔧 Quickfix App</h2>
        <p>${messages[type]}</p>
        <div style="background: #f5f6f8; padding: 20px; text-align: center; border-radius: 8px;">
          <h1 style="letter-spacing: 8px; color: #222;">${code}</h1>
        </div>
        <p style="color: #888; font-size: 0.875rem;">
          Kode berlaku selama <strong>5 menit</strong>. Jangan berikan kode ini kepada siapapun.
        </p>
      </div>
    `,
  });
}

async function sendOrderNotification(email, order, technician) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: '[Quickfix] Teknisi Telah Di-assign',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #f5b800;">🔧 Quickfix App</h2>
        <p>Order <strong>#${order.id}</strong> (${order.layanan}) telah di-assign ke teknisi:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td>Nama</td><td><strong>${technician.nama}</strong></td></tr>
          <tr><td>Spesialisasi</td><td>${technician.spesialisasi}</td></tr>
          <tr><td>No HP</td><td>${technician.no_hp}</td></tr>
          <tr><td>Rating</td><td>⭐ ${technician.rating}</td></tr>
        </table>
        <p>Teknisi akan segera menuju lokasi Anda.</p>
      </div>
    `,
  });
}

module.exports = { sendOTP, sendOrderNotification };
```

---

## 3. OTP System

### 3.1 Alur Integrasi OTP

Email Service (Nodemailer) adalah **transport** untuk mengirim OTP. OTP sendiri adalah sistem independen:

```
Generate OTP (6-digit) → Simpan di otp_codes (DB) → Kirim via Nodemailer → User input → Verify
```

### 3.2 Service Lengkap

```javascript
// services/otpService.js
const { OtpCode } = require('../models');
const { sendOTP } = require('./emailService');

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function send(userId, email, type) {
  // Invalidasi kode lama yang belum digunakan
  await OtpCode.update(
    { used: true },
    { where: { user_id: userId, type, used: false } }
  );

  // Generate kode baru
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

  await OtpCode.create({
    user_id: userId,
    code,
    type,
    expires_at: expiresAt,
  });

  // Kirim via email
  await sendOTP(email, code, type);

  return { expires_in: 300 };
}

async function verify(userId, code, type) {
  const otp = await OtpCode.findOne({
    where: {
      user_id: userId,
      code,
      type,
      used: false,
    },
  });

  if (!otp) {
    throw new Error('Kode OTP tidak valid');
  }

  if (new Date() > otp.expires_at) {
    otp.used = true;
    await otp.save();
    throw new Error('Kode OTP sudah kadaluarsa');
  }

  // Tandai digunakan
  otp.used = true;
  await otp.save();

  return true;
}

module.exports = { send, verify };
```

---

## 4. Flow Integrasi Gabungan

### Contoh: Customer Login dari Device Baru
```
1. User login → credentials valid
2. Server deteksi device baru → buat device (is_verified=false)
3. OTP Service: generate code → OtpCode.create()
4. Email Service: sendOTP(email, code, 'device_verify')
5. User cek email → dapat kode
6. User input kode → POST /api/otp/verify
7. OTP Service: verify() → valid
8. Device: is_verified = true
9. Issue JWT → user masuk aplikasi
```

### Contoh: Teknisi Tiba di Lokasi
```
1. Teknisi update status → 'on_the_way'
2. Server generate OTP untuk order
3. Email Service: kirim OTP ke customer
4. Teknisi tiba → customer masukkan OTP di halaman order
5. OTP Service: verify()
6. Status order → 'in_progress'
```

---

## 5. Fallback & Error Handling

| Layanan | Error | Handling |
|---------|-------|----------|
| Cloudinary | Upload gagal | Flash message error, retry |
| Nodemailer | SMTP timeout | Log error, OTP tetap tersimpan (user bisa request kirim ulang) |
| OTP | Expired | User request OTP baru via "Kirim Ulang" |

---

## 6. Environment Variables Terkait

```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# SMTP / Nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="Quickfix App <noreply@quickfix.local>"
```
