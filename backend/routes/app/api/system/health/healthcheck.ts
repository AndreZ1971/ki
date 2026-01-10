import http from 'http';
import process from 'process';
import { logger } from '../../../../../logger';

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  timeout: 2000,
  path: '/system/health'  // ✅ Korrekt!
};

const request = http.request(options, (res: http.IncomingMessage) => {
  logger.info({ status: res.statusCode }, 'Health check response');
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err: Error) => {
  logger.error({ error: err }, 'Health check failed');
  process.exit(1);
});

request.end();