import pino from 'pino';

function makeTransport() {
  // Nur in Non-Prod und nur wenn pino-pretty installiert ist
  if (process.env.NODE_ENV === 'production') return undefined;
  try {
    // pino v10 erwartet target-Name; vorhanden, wenn Paket installiert ist
    return { target: 'pino-pretty', options: { colorize: true } } as const;
  } catch {
    return undefined;
  }
}

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: makeTransport(),
});
