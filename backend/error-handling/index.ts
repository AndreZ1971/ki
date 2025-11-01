// backend/error-handling/index.ts
/**
 * Error Handling System - Central Exports
 * 
 * Verwendungsbeispiele:
 * 
 * 1. Circuit Breaker:
 *    const result = await wooCommerceBreaker.execute(() => api.call());
 * 
 * 2. Retry Strategy:
 *    const result = await standardRetry.execute(() => api.call());
 * 
 * 3. Dead Letter Queue:
 *    await deadLetterQueue.add('createProduct', data, error);
 * 
 * 4. Alerting:
 *    await alertError('API Failed', 'WooCommerce API down', 'WooCommerceClient', error);
 */

// Circuit Breaker
export {
  CircuitBreaker,
  CircuitBreakerManager,
  CircuitState,
  circuitBreakerManager,
  wooCommerceBreaker,
  wordPressBreaker,
  openAIBreaker,
  type CircuitBreakerOptions
} from './circuit-breaker';

// Retry Strategies
export {
  RetryStrategy,
  aggressiveRetry,
  standardRetry,
  conservativeRetry,
  openAIRetry,
  retryWithCircuitBreaker,
  withTimeout,
  retryOn,
  batchRetry,
  type RetryOptions
} from './retry-strategies';

// Dead Letter Queue
export {
  DeadLetterQueue,
  deadLetterQueue,
  type DeadLetterMessage,
  type DLQOptions
} from './dead-letter-queue';

// Alerting
export {
  AlertingService,
  AlertSeverity,
  alerting,
  alertInfo,
  alertWarning,
  alertError,
  alertCritical,
  type Alert,
  type AlertingOptions,
  type AlertChannel
} from './alerting';

// Imports für interne Verwendung
import { circuitBreakerManager, CircuitBreaker, CircuitState } from './circuit-breaker';
import { standardRetry, RetryStrategy } from './retry-strategies';
import { deadLetterQueue } from './dead-letter-queue';
import { alertError } from './alerting';

/**
 * Komplettes Error-Handling Setup
 */
export function setupErrorHandling() {
  console.log('🔧 Initializing Error Handling System...');
  
  // Circuit Breaker Status Logging
  setInterval(() => {
    const stats = circuitBreakerManager.getAllStats();
    const openCircuits = Object.entries(stats).filter(([_, s]) => s.state === CircuitState.OPEN);
    
    if (openCircuits.length > 0) {
      console.warn(`⚠️  Open Circuit Breakers: ${openCircuits.map(([name]) => name).join(', ')}`);
    }
  }, 300000); // Check alle 5 Minuten

  // DLQ Stats Logging
  setInterval(() => {
    const stats = deadLetterQueue.getStats();
    if (stats.total > 0) {
      console.log(`📬 DLQ Stats: ${stats.total} messages, ${stats.readyForRetry} ready for retry`);
    }
  }, 300000);

  console.log('✅ Error Handling System initialized');
}

/**
 * Helper: Kombiniert Circuit Breaker + Retry + DLQ
 */
export async function executeWithFullProtection<T>(
  fn: () => Promise<T>,
  options: {
    circuitBreaker: CircuitBreaker;
    retryStrategy?: RetryStrategy;
    jobType?: string;
    payload?: any;
    alertOnFailure?: boolean;
  }
): Promise<T> {
  const {
    circuitBreaker,
    retryStrategy = standardRetry,
    jobType = 'unknown',
    payload,
    alertOnFailure = true
  } = options;

  try {
    return await retryStrategy.execute(() => circuitBreaker.execute(fn));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    // In DLQ speichern
    if (payload) {
      await deadLetterQueue.add(jobType, payload, err);
    }

    // Alert senden
    if (alertOnFailure) {
      await alertError(
        'Operation Failed',
        `Failed to execute ${jobType} after all retries`,
        'ErrorHandling',
        err,
        { jobType, hasPayload: !!payload }
      );
    }

    throw err;
  }
}
