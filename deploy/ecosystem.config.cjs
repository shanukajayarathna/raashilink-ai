module.exports = {
  apps: [
    {
      name: 'raashilink-api',
      script: 'server/app.js',
      cwd: '/var/www/raashilink.ai',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '700M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};