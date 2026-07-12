require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function setup() {
  const password = process.argv[2] || process.env.DB_PASSWORD || '';

  console.log('Connecting to MySQL...');

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3307', 10),
      user: process.env.DB_USER || 'root',
      password,
      multipleStatements: true,
    });

    console.log('Connected successfully!');

    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Creating database and tables...');
    await connection.query(schema);

    const [grades] = await connection.query('SELECT COUNT(*) as count FROM wael_ali_math.grades');
    const [courses] = await connection.query('SELECT COUNT(*) as count FROM wael_ali_math.courses');
    const [features] = await connection.query('SELECT COUNT(*) as count FROM wael_ali_math.features');

    console.log('\nDatabase setup complete!');
    console.log(`  Grades: ${grades[0].count}`);
    console.log(`  Courses: ${courses[0].count}`);
    console.log(`  Features: ${features[0].count}`);
    console.log('\nUpdate backend/.env with your MySQL password, then restart the server.');
  } catch (error) {
    console.error('\nSetup failed:', error.message);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nWrong MySQL password. Run:');
      console.error('  node scripts/setup-db.js YOUR_PASSWORD');
    }

    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setup();
