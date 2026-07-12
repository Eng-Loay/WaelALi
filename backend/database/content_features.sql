USE wael_ali_math;

CREATE TABLE IF NOT EXISTS course_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title_ar VARCHAR(200) NOT NULL,
  description_ar TEXT,
  image_url VARCHAR(500),
  pdf_url VARCHAR(500),
  link_url VARCHAR(500),
  video_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignment_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  question_text TEXT NOT NULL,
  image_url VARCHAR(500),
  pdf_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  question_text TEXT NOT NULL,
  image_url VARCHAR(500),
  pdf_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);
