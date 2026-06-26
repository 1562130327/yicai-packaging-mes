module.exports = {
  apps: [
    {
      name: 'yicai-mes-server',
      script: 'server/src/index.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_PATH: 'D:/溢彩/data/production.db',
        CORS_ORIGIN: 'http://localhost:5173',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
    },
  ],
};
