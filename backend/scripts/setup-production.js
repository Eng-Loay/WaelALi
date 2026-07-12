require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { hashPassword } = require('../utils/password');

const DB = process.env.DB_NAME || 'adminanmkavps_waelali';
const base = path.join(__dirname, '..', 'database');

function adaptSql(sql) {
  return sql
    .replace(/CREATE DATABASE IF NOT EXISTS [\w_]+;\s*/gi, '')
    .replace(/USE [\w_]+;\s*/gi, '')
    .replace(/wael_ali_math\./gi, '')
    .replace(/\bwael_ali_math\b/gi, DB);
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: DB,
    multipleStatements: true,
  });

  const [tables] = await connection.query("SHOW TABLES LIKE 'grades'");
  if (!tables.length) {
    console.log('Initializing database schema + seed data...');
    const schema = fs.readFileSync(path.join(base, 'schema.sql'), 'utf8');
    await connection.query(adaptSql(schema));
  } else {
    console.log('Database already initialized, running migrations only...');
  }

  const migrationFiles = ['admin_features.sql', 'student_features.sql', 'upload_fields.sql', 'content_features.sql'];
  for (const file of migrationFiles) {
    const full = path.join(base, file);
    if (!fs.existsSync(full)) continue;
    console.log('Running', file);
    try {
      await connection.query(adaptSql(fs.readFileSync(full, 'utf8')));
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      console.log('SKIP (exists):', file);
    }
  }

  const [existing] = await connection.query(
    "SELECT id FROM students WHERE email = 'student@waelalimath.com' LIMIT 1",
  );
  if (!existing.length) {
    const password_hash = hashPassword('student123');
    const [result] = await connection.query(
      `INSERT INTO students (name, email, phone, password_hash, grade_id)
       VALUES (?, ?, ?, ?, ?)`,
      ['طالب تجريبي', 'student@waelalimath.com', '01000000000', password_hash, 1],
    );
    await connection.query(
      `INSERT IGNORE INTO enrollments (student_id, course_id, progress, status)
       SELECT ?, id, CASE WHEN id % 2 = 0 THEN 65 ELSE 25 END, 'active'
       FROM courses LIMIT 4`,
      [result.insertId],
    );
    console.log('Demo student: student@waelalimath.com / student123');
  }

  const [grades] = await connection.query('SELECT COUNT(*) AS c FROM grades');
  const [courses] = await connection.query('SELECT COUNT(*) AS c FROM courses');
  console.log(`Ready: ${grades[0].c} grades, ${courses[0].c} courses`);
  await connection.end();

  const { spawnSync } = require('child_process');
  const migrateGrades = spawnSync(process.execPath, [path.join(__dirname, 'migrate-grades-stages.js')], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: process.env,
  });
  if (migrateGrades.status !== 0) process.exit(migrateGrades.status || 1);

  const migrateContent = spawnSync(process.execPath, [path.join(__dirname, 'migrate-content.js')], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: process.env,
  });
  if (migrateContent.status !== 0) process.exit(migrateContent.status || 1);
}

run().catch((err) => {
  console.error('Production setup failed:', err.message);
  process.exit(1);
});
