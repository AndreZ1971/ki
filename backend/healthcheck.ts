import http from 'http';
import process from 'process';

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  timeout: 2000,
  path: '/system/health'  // ✅ Korrekt!
};

const request = http.request(options, (res: http.IncomingMessage) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err: Error) => {
  console.log('ERROR', err);
  process.exit(1);
});

request.end();