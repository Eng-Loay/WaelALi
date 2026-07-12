CREATE DATABASE IF NOT EXISTS wael_ali_math CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wael_ali_math;

CREATE TABLE IF NOT EXISTS grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  description_ar TEXT,
  icon VARCHAR(50) DEFAULT '📚',
  color VARCHAR(20) DEFAULT '#E63946',
  sort_order INT DEFAULT 0,
  stage ENUM('secondary', 'preparatory') NOT NULL DEFAULT 'secondary',
  year_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grade_id INT NOT NULL,
  title_ar VARCHAR(200) NOT NULL,
  title_en VARCHAR(200),
  description_ar TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  lessons_count INT DEFAULT 0,
  image_url VARCHAR(500),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_ar VARCHAR(150) NOT NULL,
  description_ar TEXT NOT NULL,
  icon VARCHAR(50) DEFAULT '✨',
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_name VARCHAR(100) NOT NULL,
  content_ar TEXT NOT NULL,
  rating INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscribers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  phone VARCHAR(20),
  grade_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE SET NULL
);

INSERT INTO grades (name_ar, name_en, description_ar, icon, color, sort_order, stage, year_order) VALUES
('الصف الأول الثانوي', 'Grade 10', 'كورسات الصف الأول الثانوي', '🚀', '#1D3557', 1, 'secondary', 1),
('الصف الثاني الثانوي', 'Grade 11', 'كورسات الصف الثاني الثانوي', '⭐', '#E63946', 2, 'secondary', 2),
('الصف الثالث الثانوي', 'Grade 12', 'كورسات الصف الثالث الثانوي', '🎯', '#1D3557', 3, 'secondary', 3),
('الصف الأول الإعدادي', 'Grade 7', 'كورسات الصف الأول الإعدادي', '📘', '#E63946', 4, 'preparatory', 1),
('الصف الثاني الإعدادي', 'Grade 8', 'كورسات الصف الثاني الإعدادي', '📗', '#1D3557', 5, 'preparatory', 2),
('الصف الثالث الإعدادي', 'Grade 9', 'كورسات الصف الثالث الإعدادي', '📙', '#E63946', 6, 'preparatory', 3);

INSERT INTO courses (grade_id, title_ar, description_ar, price, lessons_count, is_featured) VALUES
(6, 'الجبر والهندسة - الترم الأول', 'شرح شامل لمنهج الجبر والهندسة مع تدريبات وامتحانات', 500.00, 24, TRUE),
(6, 'الإحصاء والاحتمالات', 'أساسيات الإحصاء والاحتمالات بطريقة مبسطة', 450.00, 18, TRUE),
(1, 'التفاضل والتكامل - مقدمة', 'بناء أساس قوي في التفاضل والتكامل', 600.00, 30, TRUE),
(1, 'المثلثات والدوال', 'شرح تفصيلي للمثلثات والدوال المثلثية', 550.00, 22, TRUE),
(2, 'التفاضل والتكامل - متقدم', 'منهج متكامل للتفاضل والتكامل للصف الثاني الثانوي', 700.00, 35, TRUE),
(2, 'الهندسة التحليلية', 'الهندسة التحليلية بأسلوب عملي ومبسط', 600.00, 28, TRUE);

INSERT INTO features (title_ar, description_ar, icon, sort_order) VALUES
('روقنا عليك', 'منصة متكاملة للطالب ولوحة تحكم يقدر يقيم بيها نفسه', '🎓', 1),
('هتحس بالفرق', 'تدريبات وامتحانات عشان ندربك تحل المعادلات ببساطة وسرعة', '⚡', 2),
('متابعة دورية', 'معاك دايماً في رحلتك التعليمية هنتابع كل مشاكلك ونروقهالك', '📊', 3);

INSERT INTO testimonials (student_name, content_ar, rating) VALUES
('عمر', 'مستر وائل شرحه واضح جداً والمنصة سهلة الاستخدام. درجاتي اتحسنت بشكل ملحوظ!', 5),
('إياد', 'أفضل مدرس ماث جربته. الطريقة بتاعته بتخلي المادة سهلة وممتعة.', 5),
('سارة', 'التدريبات والامتحانات ساعدتني أفهم كل درس كويس. شكراً مستر وائل!', 5);
