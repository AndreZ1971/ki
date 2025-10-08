/* eslint-env node */
/* global module, __dirname */

module.exports = {
  apps: [
    {
      name: 'ki-api',
      script: 'npm',
      args: 'run api',
      cwd: __dirname,
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'ki-jobs',
      script: 'npm',
      args: 'run jobs',
      cwd: __dirname,
      env: { NODE_ENV: 'production' }
    }
  ]
};

