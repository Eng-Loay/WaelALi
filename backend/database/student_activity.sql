CREATE TABLE IF NOT EXISTS student_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  lesson_id INT NULL,
  activity_type ENUM(
    'open_course',
    'open_lesson',
    'watch_video',
    'read_text',
    'open_pdf',
    'open_record',
    'submit_assignment',
    'open_exam',
    'course_progress'
  ) NOT NULL,
  title_ar VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE SET NULL,
  INDEX idx_student_activity_student (student_id),
  INDEX idx_student_activity_course (course_id),
  INDEX idx_student_activity_created (created_at)
);
