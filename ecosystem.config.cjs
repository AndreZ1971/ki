// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'ki-api',
      script: './dist/server.js',
      interpreter: 'node',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'ki-jobs',
      script: './dist/agent/jobs/index.js',
      interpreter: 'node',
      env: { NODE_ENV: 'production' }
    }
  ]
};