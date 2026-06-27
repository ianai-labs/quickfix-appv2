// Enum & Constants — No magic numbers/strings across the codebase

const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  ON_THE_WAY: 'on_the_way',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  CANCELLED: 'cancelled',
});

const USER_ROLES = Object.freeze({
  CUSTOMER: 'customer',
  TECHNICIAN: 'technician',
  ADMIN: 'admin',
});

const OTP_TYPES = Object.freeze({
  DEVICE_VERIFY: 'device_verify',
  ORDER_VERIFY: 'order_verify',
  RESET_PASSWORD: 'reset_password',
});

const TECH_STATUS = Object.freeze({
  ONLINE: 'online',
  OFFLINE: 'offline',
  BUSY: 'busy',
});

const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
});

const OTP_EXPIRY_SECONDS = 300; // 5 menit
const RESET_TOKEN_EXPIRY_HOURS = 1;
const BCRYPT_SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;
const MIN_USERNAME_LENGTH = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

module.exports = {
  ORDER_STATUS,
  USER_ROLES,
  OTP_TYPES,
  TECH_STATUS,
  PAGINATION,
  OTP_EXPIRY_SECONDS,
  RESET_TOKEN_EXPIRY_HOURS,
  BCRYPT_SALT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
  MAX_FILE_SIZE,
};
