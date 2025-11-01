// backend/error-handling/retry-strategies.ts
/**
 * Retry Strategies für robuste API-Calls
 * Implementiert verschiedene Retry-Strategien mit exponential backoff
 */

export interface RetryOptions {
  maxAttempts: number;           // Maximale Anzahl Versuche
  initialDelay: number;          // Start-Delay in ms
  maxDelay: number;              // Maximales Delay in ms
  factor: number;                // Multiplikator für exponential backoff
  jitter: boolean;               // Zufälliges Jitter hinzufügen
  retryableErrors?: string[];    // Liste von retry-baren Error-Codes
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

export class RetryStrategy {
  private readonly options: Required<RetryOptions>;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = {
      maxAttempts: options.maxAttempts || 3,
      initialDelay: options.initialDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      factor: options.factor || 2,
      jitter: options.jitter !== undefined ? options.jitter : true,
      retryableErrors: options.retryableErrors || [
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNREFUSED',
        'EHOSTUNREACH',
        'ENETUNREACH',
        'EAI_AGAIN'
      ],
      onRetry: options.onRetry || (() => {})
    };
  }

  /**
   * Führt Funktion mit Retry-Logik aus
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (_error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Letzter Versuch oder nicht retry-bar
        if (attempt === this.options.maxAttempts || !this.isRetryable(lastError)) {
          throw lastError;
        }

        // Berechne Delay
        const delay = this.calculateDelay(attempt);
        this.options.onRetry(attempt, lastError, delay);
        
        console.log(`[Retry] Attempt ${attempt}/${this.options.maxAttempts} failed. Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Berechnet Delay mit exponential backoff und optionalem Jitter
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.options.initialDelay * Math.pow(this.options.factor, attempt - 1),
      this.options.maxDelay
    );

    if (this.options.jitter) {
      // Füge zufälliges Jitter hinzu (0-100% des Delays)
      return Math.floor(exponentialDelay * (0.5 + Math.random() * 0.5));
    }

    return exponentialDelay;
  }

  /**
   * Prüft ob Error retry-bar ist
   */
  private isRetryable(error: Error): boolean {
    // Rate Limit Errors (429, 503)
    if ('statusCode' in error) {
      const statusCode = (error as any).statusCode;
      if ([429, 503, 504].includes(statusCode)) {
        return true;
      }
    }

    // Network Errors
    if ('code' in error) {
      return this.options.retryableErrors.includes((error as any).code);
    }

    // Timeout Errors
    if (error.message.toLowerCase().includes('timeout')) {
      return true;
    }

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Vordefinierte Retry-Strategien
 */

// Aggressive Retry (schnell, viele Versuche)
export const aggressiveRetry = new RetryStrategy({
  maxAttempts: 5,
  initialDelay: 500,
  maxDelay: 10000,
  factor: 2,
  jitter: true
});

// Standard Retry (balanced)
export const standardRetry = new RetryStrategy({
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  jitter: true
});

// Conservative Retry (langsam, wenige Versuche)
export const conservativeRetry = new RetryStrategy({
  maxAttempts: 2,
  initialDelay: 2000,
  maxDelay: 60000,
  factor: 3,
  jitter: true
});

// OpenAI Spezial (für Rate Limits optimiert)
export const openAIRetry = new RetryStrategy({
  maxAttempts: 4,
  initialDelay: 2000,
  maxDelay: 120000, // 2 Minuten
  factor: 3,
  jitter: true,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT'],
  onRetry: (attempt, error, delay) => {
    console.log(`[OpenAI Retry] Rate limit hit. Waiting ${delay}ms before attempt ${attempt + 1}`);
  }
});

/**
 * Retry mit Circuit Breaker kombinieren
 */
export async function retryWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  circuitBreaker: any, // CircuitBreaker type
  retryStrategy: RetryStrategy = standardRetry
): Promise<T> {
  return retryStrategy.execute(() => circuitBreaker.execute(fn));
}

/**
 * Utility: Timeout für Promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

/**
 * Utility: Retry nur für spezifische Fehler
 */
export async function retryOn<T>(
  fn: () => Promise<T>,
  errorCondition: (error: Error) => boolean,
  maxAttempts = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (_error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts || !errorCondition(lastError)) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw lastError!;
}

/**
 * Batch Retry - führt mehrere Operationen mit Retry aus
 */
export async function batchRetry<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  retryStrategy: RetryStrategy = standardRetry,
  concurrency = 3
): Promise<{ succeeded: T[]; failed: Array<{ item: T; error: Error }> }> {
  const succeeded: T[] = [];
  const failed: Array<{ item: T; error: Error }> = [];
  
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    chunks.push(items.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(item => 
        retryStrategy.execute(() => fn(item))
          .then(() => ({ item, success: true as const }))
          .catch(error => ({ item, success: false as const, error }))
      )
    );

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          succeeded.push(result.value.item);
        } else {
          failed.push({ item: result.value.item, error: result.value.error });
        }
      }
    });
  }

  return { succeeded, failed };
}
