-- Extra admin tables for Wael Ali Math (run after schema.sql)
USE wael_ali_math;

CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  max_uses INT DEFAULT 0,
  used_count INT DEFAULT 0,
  expires_at DATETIME NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NULL,
  title_ar VARCHAR(200) NOT NULL,
  description_ar TEXT,
  due_date DATE NULL,
  status ENUM('draft', 'published', 'closed') DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NULL,
  title_ar VARCHAR(200) NOT NULL,
  description_ar TEXT,
  questions_count INT DEFAULT 10,
  duration_minutes INT DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subscriber_id INT NULL,
  course_id INT NULL,
  coupon_id INT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  method VARCHAR(50) DEFAULT 'cash',
  status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'paid',
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE SET NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_ar VARCHAR(200) NOT NULL,
  link_url VARCHAR(500),
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_ar VARCHAR(200) NOT NULL,
  body_ar TEXT NOT NULL,
  audience ENUM('all', 'subscribers', 'admins') DEFAULT 'all',
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO coupons (code, discount_type, discount_value, max_uses, is_active)
SELECT 'WAEL10', 'percent', 10, 100, TRUE
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'WAEL10');

INSERT INTO coupons (code, discount_type, discount_value, max_uses, is_active)
SELECT 'MATH50', 'fixed', 50, 50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'MATH50');
