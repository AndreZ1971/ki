// src/monitoring/health-checks.ts

import http from 'http';

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/system/health',  // ✅ Korrekt!
  timeout: 2000,
};

const req = http.request(options, (res: http.IncomingMessage) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();