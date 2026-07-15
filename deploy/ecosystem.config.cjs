/**
 * Important: do NOT overwrite server .env on each deploy.
 * JWT_SECRET must stay the same forever or all logins invalidate after restart.
 * Prefer setting JWT_SECRET (and JWT_EXPIRES_HOURS) inside the preserved .env next to server.js.
 */
module.exports = {
  apps: [
    {
      name: 'wael-ali-api',
      cwd: '/home/adminanmkavps/web/wael-ali.anmka.com/nodejs',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 5091,
      },
    },
  ],
};
