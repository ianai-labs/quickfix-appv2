const nodemailer = require('nodemailer');

const hasSMTP = process.env.SMTP_USER && process.env.SMTP_PASS;

// Stub transporter — returns success tanpa kirim apa2 (buat demo mode)
const stubTransporter = {
  sendMail: () => Promise.resolve({ messageId: 'demo-' + Date.now() }),
  verify: () => Promise.resolve(),
  __isStub: true,
};

const transporter = hasSMTP
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,
      connectionTimeout: 5000,   // max 5 detik
      greetingTimeout: 5000,
      socketTimeout: 5000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : stubTransporter;

// Verify connection on startup (non-blocking)
if (hasSMTP) {
  transporter
    .verify()
    .then(() => console.log('✅ SMTP email service ready'))
    .catch((err) =>
      console.warn('⚠️  SMTP connection failed — email disabled:', err.message)
    );
} else {
  console.log('📦 Demo mode — email skipped, OTP shown in response');
}

module.exports = transporter;
