-- ============================================
-- Quickfix App v2 — Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS quickfix_v2
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quickfix_v2;

-- -------------------------------------------
-- Tabel: users
-- -------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'technician', 'admin') NOT NULL DEFAULT 'customer',
  avatar_url VARCHAR(255) DEFAULT NULL,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_expires DATETIME DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------
-- Tabel: devices (⭐ Fitur Keamanan)
-- -------------------------------------------
CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(100) DEFAULT NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  first_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------
-- Tabel: customers
-- -------------------------------------------
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  alamat TEXT DEFAULT NULL,
  no_hp VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------
-- Tabel: technicians
-- -------------------------------------------
CREATE TABLE technicians (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  spesialisasi VARCHAR(100) NOT NULL,
  rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  is_premium TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('online', 'offline', 'busy') NOT NULL DEFAULT 'offline',
  total_jobs INT NOT NULL DEFAULT 0,
  no_hp VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------
-- Tabel: orders
-- -------------------------------------------
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  technician_id INT DEFAULT NULL,
  layanan VARCHAR(100) NOT NULL,
  deskripsi TEXT DEFAULT NULL,
  alamat TEXT NOT NULL,
  status ENUM('pending', 'assigned', 'on_the_way', 'in_progress', 'done', 'cancelled') NOT NULL DEFAULT 'pending',
  harga DECIMAL(10,2) DEFAULT NULL,
  otp_code VARCHAR(6) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -------------------------------------------
-- Tabel: order_photos
-- -------------------------------------------
CREATE TABLE order_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  photo_url VARCHAR(255) NOT NULL,
  uploaded_by INT NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------
-- Tabel: otp_codes
-- -------------------------------------------
CREATE TABLE otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  code VARCHAR(6) NOT NULL,
  type ENUM('device_verify', 'order_verify', 'reset_password') NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Seed Data
-- ============================================

-- Admin user (password: admin123)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@quickfix.local', '$2a$10$j0NCYRIQubOX1szzwd/uheU8yGvb9MuQc5d9K57IoaNt3bb..zaIC', 'admin');

-- Sample customers
INSERT INTO users (username, email, password, role) VALUES
('budi', 'budi@email.com', '$2a$10$j0NCYRIQubOX1szzwd/uheU8yGvb9MuQc5d9K57IoaNt3bb..zaIC', 'customer'),
('siti', 'siti@email.com', '$2a$10$j0NCYRIQubOX1szzwd/uheU8yGvb9MuQc5d9K57IoaNt3bb..zaIC', 'customer');

INSERT INTO customers (user_id, alamat, no_hp) VALUES
(2, 'Jl. Merdeka No. 123, Jakarta Pusat', '081311112222'),
(3, 'Jl. Sudirman No. 456, Bandung', '081322223333');

-- Sample technicians
INSERT INTO users (username, email, password, role) VALUES
('andi', 'andi@email.com', '$2a$10$j0NCYRIQubOX1szzwd/uheU8yGvb9MuQc5d9K57IoaNt3bb..zaIC', 'technician'),
('rudi', 'rudi@email.com', '$2a$10$j0NCYRIQubOX1szzwd/uheU8yGvb9MuQc5d9K57IoaNt3bb..zaIC', 'technician'),
('dewi', 'dewi@email.com', '$2a$10$j0NCYRIQubOX1szzwd/uheU8yGvb9MuQc5d9K57IoaNt3bb..zaIC', 'technician');

INSERT INTO technicians (user_id, spesialisasi, rating, is_premium, status, no_hp) VALUES
(4, 'AC,Listrik', 5.0, 1, 'online', '081233334444'),
(5, 'Pipa,Atap', 4.5, 0, 'online', '081244445555'),
(6, 'AC,Pipa', 3.0, 0, 'online', '081255556666');

-- Service pricing seed
INSERT INTO service_pricing (service_name, base_price, commission_rate) VALUES
('Perbaikan AC', 250000, 0.15), ('Instalasi Listrik', 200000, 0.12), ('Perbaikan Pipa', 180000, 0.12), ('Perbaikan Atap', 350000, 0.15), ('Lainnya', 150000, 0.10);

-- Generate transactions for done orders (for demo data)
INSERT INTO transactions (order_id, amount, commission, net_amount, status, payment_method, paid_at, created_at, updated_at)
SELECT o.id, COALESCE(o.harga, 200000), ROUND(COALESCE(o.harga, 200000)*0.15), COALESCE(o.harga, 200000)-ROUND(COALESCE(o.harga, 200000)*0.15), 'released', 'demo', o.updated_at, o.created_at, o.updated_at
FROM orders o LEFT JOIN transactions t ON t.order_id = o.id
WHERE o.status = 'done' AND t.id IS NULL;
