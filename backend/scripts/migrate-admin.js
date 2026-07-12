require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const sqlPath = path.join(__dirname, '..', 'database', 'admin_features.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await connection.query(sql);
  console.log('Admin feature tables ready.');
  await connection.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
