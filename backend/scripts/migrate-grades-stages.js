require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const GRADES = [
  { id: 1, name_ar: 'الصف الأول الثانوي', name_en: 'Grade 10', description_ar: 'كورسات الصف الأول الثانوي', icon: '🚀', color: '#1D3557', stage: 'secondary', year_order: 1, sort_order: 1 },
  { id: 2, name_ar: 'الصف الثاني الثانوي', name_en: 'Grade 11', description_ar: 'كورسات الصف الثاني الثانوي', icon: '⭐', color: '#E63946', stage: 'secondary', year_order: 2, sort_order: 2 },
  { id: 3, name_ar: 'الصف الثالث الثانوي', name_en: 'Grade 12', description_ar: 'كورسات الصف الثالث الثانوي', icon: '🎯', color: '#1D3557', stage: 'secondary', year_order: 3, sort_order: 3 },
  { id: 4, name_ar: 'الصف الأول الإعدادي', name_en: 'Grade 7', description_ar: 'كورسات الصف الأول الإعدادي', icon: '📘', color: '#E63946', stage: 'preparatory', year_order: 1, sort_order: 4 },
  { id: 5, name_ar: 'الصف الثاني الإعدادي', name_en: 'Grade 8', description_ar: 'كورسات الصف الثاني الإعدادي', icon: '📗', color: '#1D3557', stage: 'preparatory', year_order: 2, sort_order: 5 },
  { id: 6, name_ar: 'الصف الثالث الإعدادي', name_en: 'Grade 9', description_ar: 'كورسات الصف الثالث الإعدادي', icon: '📙', color: '#E63946', stage: 'preparatory', year_order: 3, sort_order: 6 },
];

async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
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

  if (!(await columnExists(connection, 'grades', 'stage'))) {
    await connection.query(
      "ALTER TABLE grades ADD COLUMN stage ENUM('secondary','preparatory') NOT NULL DEFAULT 'secondary' AFTER sort_order",
    );
  }
  if (!(await columnExists(connection, 'grades', 'year_order'))) {
    await connection.query('ALTER TABLE grades ADD COLUMN year_order INT NOT NULL DEFAULT 1 AFTER stage');
  }
  if (!(await columnExists(connection, 'students', 'parent_phone'))) {
    await connection.query('ALTER TABLE students ADD COLUMN parent_phone VARCHAR(20) NULL AFTER phone');
  }

  for (const grade of GRADES) {
    const [existing] = await connection.query('SELECT id FROM grades WHERE id = ? LIMIT 1', [grade.id]);
    if (existing.length) {
      await connection.query(
        `UPDATE grades SET name_ar=?, name_en=?, description_ar=?, icon=?, color=?, sort_order=?, stage=?, year_order=?
         WHERE id=?`,
        [grade.name_ar, grade.name_en, grade.description_ar, grade.icon, grade.color, grade.sort_order, grade.stage, grade.year_order, grade.id],
      );
    } else {
      await connection.query(
        `INSERT INTO grades (id, name_ar, name_en, description_ar, icon, color, sort_order, stage, year_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [grade.id, grade.name_ar, grade.name_en, grade.description_ar, grade.icon, grade.color, grade.sort_order, grade.stage, grade.year_order],
      );
    }
  }

  console.log('Grades stages + parent_phone migration complete.');
  await connection.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
