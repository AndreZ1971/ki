import { logger } from './logger';

// Redirect console output to pino logger for production visibility and consistency.
function toLogLevel(method: 'log' | 'info' | 'warn' | 'error' | 'debug'): 'info' | 'warn' | 'error' | 'debug' {
  if (method === 'log') return 'info';
  return method;
}

function wrap(method: 'log' | 'info' | 'warn' | 'error' | 'debug') {
  const level = toLogLevel(method);
  return (...args: unknown[]) => {
    if (args.length === 0) {
      logger[level]('');
      return;
    }
    if (args.length === 1) {
      logger[level](args[0] as any);
      return;
    }
    const [first, ...rest] = args;
    logger[level]({ msg: first as any, args: rest });
  };
}

console.log = wrap('log');
console.info = wrap('info');
console.warn = wrap('warn');
console.error = wrap('error');
console.debug = wrap('debug');
