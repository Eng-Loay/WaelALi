USE wael_ali_math;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS video_url VARCHAR(500) NULL AFTER image_url;

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) NULL AFTER description_ar;

ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) NULL AFTER description_ar;
