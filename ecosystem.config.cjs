module.exports = {
  apps: [
    {
      name: 'cevichapp',
      script: 'server/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        DATABASE_PROVIDER: 'local'
      }
    }
  ]
};
