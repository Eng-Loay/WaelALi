require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return rows[0].c > 0;
}

async function tableExists(connection, table) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table],
  );
  return rows[0].c > 0;
}

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wael_ali_math',
    multipleStatements: true,
  });

  const alters = [
    ['courses', 'pdf_url', 'ALTER TABLE courses ADD COLUMN pdf_url VARCHAR(500) NULL AFTER video_url'],
    ['courses', 'link_url', 'ALTER TABLE courses ADD COLUMN link_url VARCHAR(500) NULL AFTER pdf_url'],
    ['assignments', 'grade_id', 'ALTER TABLE assignments ADD COLUMN grade_id INT NULL AFTER course_id'],
    ['assignments', 'image_url', 'ALTER TABLE assignments ADD COLUMN image_url VARCHAR(500) NULL AFTER description_ar'],
    ['assignments', 'delivery_mode', "ALTER TABLE assignments ADD COLUMN delivery_mode ENUM('pdf','manual') NOT NULL DEFAULT 'manual' AFTER status"],
    ['exams', 'grade_id', 'ALTER TABLE exams ADD COLUMN grade_id INT NULL AFTER course_id'],
    ['exams', 'image_url', 'ALTER TABLE exams ADD COLUMN image_url VARCHAR(500) NULL AFTER description_ar'],
    ['assignment_questions', 'question_type', "ALTER TABLE assignment_questions ADD COLUMN question_type ENUM('text','true_false','multiple_choice') NOT NULL DEFAULT 'text' AFTER question_text"],
    ['assignment_questions', 'options', 'ALTER TABLE assignment_questions ADD COLUMN options JSON NULL AFTER pdf_url'],
    ['assignment_questions', 'correct_answer', 'ALTER TABLE assignment_questions ADD COLUMN correct_answer TEXT NULL AFTER options'],
    ['exam_questions', 'question_type', "ALTER TABLE exam_questions ADD COLUMN question_type ENUM('text','true_false','multiple_choice') NOT NULL DEFAULT 'text' AFTER question_text"],
    ['exam_questions', 'options', 'ALTER TABLE exam_questions ADD COLUMN options JSON NULL AFTER pdf_url'],
    ['exam_questions', 'correct_answer', 'ALTER TABLE exam_questions ADD COLUMN correct_answer TEXT NULL AFTER options'],
    ['subscribers', 'parent_phone', 'ALTER TABLE subscribers ADD COLUMN parent_phone VARCHAR(20) NULL AFTER phone'],
    ['subscribers', 'governorate', 'ALTER TABLE subscribers ADD COLUMN governorate VARCHAR(80) NULL AFTER parent_phone'],
    ['subscribers', 'address', 'ALTER TABLE subscribers ADD COLUMN address TEXT NULL AFTER governorate'],
    ['students', 'governorate', 'ALTER TABLE students ADD COLUMN governorate VARCHAR(80) NULL AFTER parent_phone'],
    ['students', 'address', 'ALTER TABLE students ADD COLUMN address TEXT NULL AFTER governorate'],
  ];

  for (const [table, column, sql] of alters) {
    if (!(await columnExists(connection, table, column))) {
      await connection.query(sql);
      console.log(`Added ${table}.${column}`);
    }
  }

  try {
    await connection.query('ALTER TABLE subscribers MODIFY email VARCHAR(200) NULL');
    console.log('Updated subscribers.email to allow NULL');
  } catch (err) {
    if (!String(err.message).includes('Duplicate')) console.log('subscribers.email:', err.message);
  }

  const sqlPath = path.join(__dirname, '..', 'database', 'content_features.sql');
  const raw = fs.readFileSync(sqlPath, 'utf8').replace(/USE [\w_]+;\s*/gi, '');
  await connection.query(raw);

  if (!(await tableExists(connection, 'course_lessons'))) {
    const lessonsSql = fs
      .readFileSync(path.join(__dirname, '..', 'database', 'course_lessons.sql'), 'utf8')
      .replace(/USE [\w_]+;\s*/gi, '');
    await connection.query(lessonsSql);
    console.log('Created course_lessons table');
  }

  if (!(await tableExists(connection, 'assignment_submissions'))) {
    const deliverySql = fs
      .readFileSync(path.join(__dirname, '..', 'database', 'assignment_delivery.sql'), 'utf8')
      .replace(/USE [\w_]+;\s*/gi, '');
    await connection.query(deliverySql);
    console.log('Created assignment_submissions table');
  }

  if (!(await tableExists(connection, 'student_activity'))) {
    const activitySql = fs
      .readFileSync(path.join(__dirname, '..', 'database', 'student_activity.sql'), 'utf8')
      .replace(/USE [\w_]+;\s*/gi, '');
    await connection.query(activitySql);
    console.log('Created student_activity table');
  }

  if (!(await tableExists(connection, 'course_attendance'))) {
    const attendanceSql = fs
      .readFileSync(path.join(__dirname, '..', 'database', 'course_attendance.sql'), 'utf8')
      .replace(/USE [\w_]+;\s*/gi, '');
    await connection.query(attendanceSql);
    console.log('Created course_attendance table');
  }

  if (!(await tableExists(connection, 'exam_submissions'))) {
    const examSubsSql = fs
      .readFileSync(path.join(__dirname, '..', 'database', 'exam_submissions.sql'), 'utf8')
      .replace(/USE [\w_]+;\s*/gi, '');
    await connection.query(examSubsSql);
    console.log('Created exam_submissions table');
  }

  // Backfill: rows with a PDF file become pdf mode
  if (await columnExists(connection, 'assignments', 'delivery_mode')) {
    await connection.query(`
      UPDATE assignments
      SET delivery_mode = 'pdf'
      WHERE file_url IS NOT NULL AND file_url != ''
    `);
  }

  console.log('Content features migration complete.');
  await connection.end();
}

migrate().catch((err) => {
  console.error('Content migration failed:', err.message);
  process.exit(1);
});
