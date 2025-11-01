// backend/error-handling/circuit-breaker.ts
/**
 * Circuit Breaker Pattern Implementation
 * Schützt externe Services (WooCommerce, WordPress, OpenAI) vor Überlastung
 * 
 * States:
 * - CLOSED: Normal operation, alle Requests durchgelassen
 * - OPEN: Circuit offen, alle Requests werden blockiert
 * - HALF_OPEN: Test-Phase, limitierte Requests erlaubt
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold: number;      // Anzahl Fehler bis Circuit öffnet
  successThreshold: number;       // Anzahl Erfolge in HALF_OPEN zum Schließen
  timeout: number;                // Zeit in ms bis HALF_OPEN Versuch
  resetTimeout?: number;          // Zeit bis automatischer Reset (optional)
  name?: string;                  // Name für Logging
  onStateChange?: (state: CircuitState, name: string) => void;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions) {
    this.options = {
      failureThreshold: options.failureThreshold,
      successThreshold: options.successThreshold,
      timeout: options.timeout,
      resetTimeout: options.resetTimeout || options.timeout * 2,
      name: options.name || 'CircuitBreaker',
      onStateChange: options.onStateChange || (() => {})
    };
  }

  /**
   * Führt Funktion mit Circuit Breaker Protection aus
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit Breaker ${this.options.name} is OPEN`);
      }
      // Wechsel zu HALF_OPEN für Test
      this.setState(CircuitState.HALF_OPEN);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (_error) {
      this.onFailure();
      throw _error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.setState(CircuitState.CLOSED);
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.setState(CircuitState.OPEN);
      this.nextAttempt = Date.now() + this.options.timeout;
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.setState(CircuitState.OPEN);
      this.nextAttempt = Date.now() + this.options.timeout;
    }
  }

  private setState(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    
    if (oldState !== newState) {
      console.log(`[${this.options.name}] Circuit Breaker: ${oldState} → ${newState}`);
      this.options.onStateChange(newState, this.options.name);
    }
  }

  /**
   * Gibt aktuellen Status zurück
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Gibt Statistiken zurück
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.state === CircuitState.OPEN 
        ? new Date(this.nextAttempt).toISOString() 
        : null
    };
  }

  /**
   * Manueller Reset des Circuit Breakers
   */
  reset(): void {
    this.setState(CircuitState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }
}

/**
 * Circuit Breaker Manager für mehrere Services
 */
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Registriert neuen Circuit Breaker
   */
  register(name: string, options: Omit<CircuitBreakerOptions, 'name'>): CircuitBreaker {
    const breaker = new CircuitBreaker({ ...options, name });
    this.breakers.set(name, breaker);
    return breaker;
  }

  /**
   * Holt Circuit Breaker für Service
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Gibt Status aller Circuit Breakers zurück
   */
  getAllStats() {
    const stats: Record<string, ReturnType<CircuitBreaker['getStats']>> = {};
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  /**
   * Reset aller Circuit Breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

// Globale Circuit Breaker Instanzen
export const circuitBreakerManager = new CircuitBreakerManager();

// Standard Circuit Breakers für häufig genutzte Services
export const wooCommerceBreaker = circuitBreakerManager.register('WooCommerce', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 Minute
});

export const wordPressBreaker = circuitBreakerManager.register('WordPress', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
});

export const openAIBreaker = circuitBreakerManager.register('OpenAI', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 120000, // 2 Minuten (Rate Limits)
});
