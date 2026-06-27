const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;

const UPLOAD_OPTIONS = {
  resource_type: 'image',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [
    { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
  ],
};

async function uploadPhoto(filePath, orderId) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      ...UPLOAD_OPTIONS,
      folder: `quickfix/orders/order_${orderId}`,
      use_filename: true,
      unique_filename: true,
    });

    // Hapus file temporary setelah upload sukses
    await cleanupTempFile(filePath);

    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    await cleanupTempFile(filePath);
    console.error('[CLOUDINARY] Upload error:', error.message);
    throw new Error('Gagal mengupload foto ke cloud storage.');
  }
}

async function uploadAvatar(filePath, userId) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      ...UPLOAD_OPTIONS,
      folder: 'quickfix/avatars',
      public_id: `user_${userId}`,
      overwrite: true,
    });

    await cleanupTempFile(filePath);

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    await cleanupTempFile(filePath);
    console.error('[CLOUDINARY] Avatar upload error:', error.message);
    throw new Error('Gagal mengupload avatar.');
  }
}

async function deletePhoto(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`[CLOUDINARY] Deleted: ${publicId}`);
  } catch (error) {
    console.error('[CLOUDINARY] Delete error:', error.message);
  }
}

async function cleanupTempFile(filePath) {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch (_e) {
    // best-effort cleanup
  }
}

module.exports = { uploadPhoto, uploadAvatar, deletePhoto };
