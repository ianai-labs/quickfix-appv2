const transporter = require('../config/nodemailer');

const FROM = process.env.SMTP_FROM || '"Quickfix App" <noreply@quickfix.local>';

const SUBJECTS = {
  device_verify: '[Quickfix] Verifikasi Device Baru',
  order_verify: '[Quickfix] Kode Verifikasi Teknisi',
  reset_password: '[Quickfix] Reset Password',
};

const MESSAGES = {
  device_verify: 'Device baru terdeteksi pada akun Anda.',
  order_verify: 'Teknisi telah tiba di lokasi. Gunakan kode berikut untuk verifikasi.',
  reset_password: 'Gunakan kode berikut untuk mereset password Anda.',
};

async function sendOTP(email, code, type) {

  const subject = SUBJECTS[type] || '[Quickfix] Kode Verifikasi';
  const message = MESSAGES[type] || 'Gunakan kode berikut:';

  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject,
      html: buildOTPHtml(code, message),
    });
    console.log(`[EMAIL] OTP sent to ${email} — type: ${type}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send OTP to ${email}:`, error.message);
    return false;
  }
}

async function sendOrderNotification(email, order, technician) {

  try {
    await transporter.sendMail({
      from: FROM,
      subject: '[Quickfix] Teknisi Telah Di-assign',
      to: email,
      html: buildOrderHtml(order, technician),
    });
    console.log(`[EMAIL] Order notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send notification to ${email}:`, error.message);
    return false;
  }
}

async function sendResetLink(email, token) {

  const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: '[Quickfix] Reset Password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #f5b800;">&#x1F527; Quickfix App</h2>
          <p>Klik tombol di bawah untuk mereset password Anda:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="background: #f5b800; color: #222; padding: 12px 24px;
              text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #888; font-size: 0.875rem;">
            Link berlaku selama <strong>1 jam</strong>.
            Jika Anda tidak meminta reset password, abaikan email ini.
          </p>
        </div>
      `,
    });
    console.log(`[EMAIL] Reset link sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send reset link to ${email}:`, error.message);
    return false;
  }
}

// ── Private HTML builders ──

function buildOTPHtml(code, message) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #f5b800;">&#x1F527; Quickfix App</h2>
      <p>${message}</p>
      <div style="background: #f5f6f8; padding: 20px; text-align: center; border-radius: 8px;">
        <h1 style="letter-spacing: 8px; color: #222; font-size: 2rem;">${code}</h1>
      </div>
      <p style="color: #888; font-size: 0.875rem;">
        Kode berlaku selama <strong>5 menit</strong>. Jangan berikan kode ini kepada siapapun.
      </p>
    </div>
  `;
}

function buildOrderHtml(order, technician) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #f5b800;">&#x1F527; Quickfix App</h2>
      <p>Order <strong>#${order.id}</strong> (${order.layanan}) telah di-assign ke teknisi:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 4px 0;">Nama</td><td style="padding: 4px 0;"><strong>${technician.User?.username || technician.nama || '-'}</strong></td></tr>
        <tr><td style="padding: 4px 0;">Spesialisasi</td><td style="padding: 4px 0;">${technician.spesialisasi || '-'}</td></tr>
        <tr><td style="padding: 4px 0;">No HP</td><td style="padding: 4px 0;">${technician.no_hp || '-'}</td></tr>
        <tr><td style="padding: 4px 0;">Rating</td><td style="padding: 4px 0;">&#x2B50; ${technician.rating}</td></tr>
      </table>
      <p>Teknisi akan segera menuju lokasi Anda.</p>
    </div>
  `;
}

module.exports = { sendOTP, sendOrderNotification, sendResetLink };
