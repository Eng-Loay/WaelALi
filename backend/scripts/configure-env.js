const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const envPath = path.join(__dirname, '..', '.env');
const password = process.argv[2] ?? '';
const portArg = process.argv[3] ? parseInt(process.argv[3], 10) : null;

const portsToTry = portArg ? [portArg] : [3306, 3307];

function upsertEnvValue(content, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  if (pattern.test(content)) return content.replace(pattern, line);
  return `${content.trim()}\n${line}\n`;
}

function saveEnv(updates) {
  const examplePath = path.join(__dirname, '..', '.env.example');
  let content = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, 'utf8')
    : fs.readFileSync(examplePath, 'utf8');

  Object.entries(updates).forEach(([key, value]) => {
    content = upsertEnvValue(content, key, value);
  });

  fs.writeFileSync(envPath, content, 'utf8');
}

async function findWorkingPort() {
  for (const port of portsToTry) {
    try {
      const connection = await mysql.createConnection({
        host: 'localhost',
        port,
        user: 'root',
        password,
        connectTimeout: 8000,
      });
      await connection.query('SELECT 1');
      await connection.end();
      return port;
    } catch (error) {
      console.log(`Port ${port}: ${error.code || error.message}`);
    }
  }
  return null;
}

async function main() {
  if (!process.argv[2] && process.argv[2] !== '') {
    console.log('Usage: node scripts/configure-env.js YOUR_MYSQL_PASSWORD [PORT]');
    console.log('Example: node scripts/configure-env.js mypassword 3306');
    process.exit(1);
  }

  console.log('Testing MySQL connection...');
  const port = await findWorkingPort();

  if (!port) {
    console.error('\nCould not connect to MySQL on ports:', portsToTry.join(', '));
    console.error('Check that MySQL is running and the password is correct.');
    process.exit(1);
  }

  saveEnv({
    DB_HOST: 'localhost',
    DB_PORT: String(port),
    DB_USER: 'root',
    DB_PASSWORD: password,
    DB_NAME: 'wael_ali_math',
  });

  console.log(`\nSaved backend/.env (port ${port}, password set).`);
  console.log('Now run: npm run test-db');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
