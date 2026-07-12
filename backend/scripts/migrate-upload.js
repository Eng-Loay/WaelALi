require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const statements = [
  `ALTER TABLE courses ADD COLUMN video_url VARCHAR(500) NULL AFTER image_url`,
  `ALTER TABLE assignments ADD COLUMN file_url VARCHAR(500) NULL AFTER description_ar`,
  `ALTER TABLE exams ADD COLUMN file_url VARCHAR(500) NULL AFTER description_ar`,
];

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wael_ali_math',
    multipleStatements: true,
  });

  for (const sql of statements) {
    try {
      await conn.query(sql);
      console.log('OK:', sql.split('\n')[0]);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('SKIP (exists):', sql.split('\n')[0]);
      } else {
        throw err;
      }
    }
  }

  const uploadDirs = ['images', 'videos', 'pdfs'];
  uploadDirs.forEach((dir) => {
    fs.mkdirSync(path.join(__dirname, '../uploads', dir), { recursive: true });
  });

  await conn.end();
  console.log('Upload migration done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
