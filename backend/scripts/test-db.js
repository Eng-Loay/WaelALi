require('dotenv').config();
const pool = require('../config/db');

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 as ok');
    const [grades] = await pool.query('SELECT COUNT(*) as count FROM grades');
    console.log('Database connected!');
    console.log(`Grades in DB: ${grades[0].count}`);
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
