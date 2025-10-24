/* eslint-env node */
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'ki-api',
      script: './dist/server.js',
      interpreter: 'node',
      watch: false,
      env: { NODE_ENV: 'production' },
      autorestart: true,
      min_uptime: '5s',
      max_restarts: 10,
    },
    {
      name: 'ki-jobs',
      script: './dist/agent/jobs/index.js',
      interpreter: 'node',
      watch: false,
      env: { NODE_ENV: 'production' },
      autorestart: true,
      min_uptime: '5s',
      max_restarts: 10,
    },
  ],
};
