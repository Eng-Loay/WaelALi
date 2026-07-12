require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { hashPassword } = require('../utils/password');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const sqlPath = path.join(__dirname, '..', 'database', 'student_features.sql');
  await connection.query(fs.readFileSync(sqlPath, 'utf8'));

  const [existing] = await connection.query(
    "SELECT id FROM wael_ali_math.students WHERE email = 'student@waelalimath.com' LIMIT 1",
  );

  let studentId;
  if (!existing.length) {
    const password_hash = hashPassword('student123');
    const [result] = await connection.query(
      `INSERT INTO wael_ali_math.students (name, email, phone, password_hash, grade_id)
       VALUES (?, ?, ?, ?, ?)`,
      ['طالب تجريبي', 'student@waelalimath.com', '01000000000', password_hash, 1],
    );
    studentId = result.insertId;
    console.log('Demo student created: student@waelalimath.com / student123');
  } else {
    studentId = existing[0].id;
    console.log('Demo student already exists');
  }

  await connection.query(
    `INSERT IGNORE INTO wael_ali_math.enrollments (student_id, course_id, progress, status)
     SELECT ?, id, CASE WHEN id % 2 = 0 THEN 65 ELSE 25 END, 'active'
     FROM wael_ali_math.courses
     LIMIT 4`,
    [studentId],
  );

  console.log('Student feature tables ready.');
  await connection.end();
}

migrate().catch((err) => {
  console.error('Student migration failed:', err.message);
  process.exit(1);
});
