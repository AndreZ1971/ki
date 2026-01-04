// healthcheck.js - Docker Health Check (compiled to JS)
const http = require('http');

// Prefer backend logger (pino) if available; otherwise fall back to console.
let logger = console;

try {
  const loaded = require('./backend/dist/logger');
  if (loaded?.logger) {
    logger = loaded.logger;
  }
} catch (_err) {
  try {
    const loaded = require('./backend/logger');
    if (loaded?.logger) {
      logger = loaded.logger;
    }
  } catch (_err2) {
    // keep console fallback
  }
}

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  timeout: 2000,
  path: '/health'
};

const request = http.request(options, (res) => {
  logger.info({ status: res.statusCode }, 'Healthcheck response');
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  logger.error({ err }, 'Healthcheck error');
  process.exit(1);
});

request.end();
