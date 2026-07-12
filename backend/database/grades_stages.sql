USE wael_ali_math;

ALTER TABLE grades
  ADD COLUMN IF NOT EXISTS stage ENUM('secondary', 'preparatory') NOT NULL DEFAULT 'secondary' AFTER sort_order,
  ADD COLUMN IF NOT EXISTS year_order INT NOT NULL DEFAULT 1 AFTER stage;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20) NULL AFTER phone;
