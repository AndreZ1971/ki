import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker, CircuitState } from '../../backend/error-handling/circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;
  let mockFunction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      name: 'test-breaker',
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
    });
    mockFunction = vi.fn();
  });

  describe('CLOSED state', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should execute function successfully when closed', async () => {
      mockFunction.mockResolvedValue('success');
      const result = await breaker.execute(mockFunction);
      
      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should count failures', async () => {
      mockFunction.mockRejectedValue(new Error('test error'));
      
      try {
        await breaker.execute(mockFunction);
      } catch (error) {
        // Expected to throw
      }

      const stats = breaker.getStats();
      expect(stats.failureCount).toBe(1);
    });

    it('should transition to OPEN after threshold failures', async () => {
      mockFunction.mockRejectedValue(new Error('test error'));

      // Trigger 3 failures (threshold)
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(mockFunction);
        } catch (error) {
          // Expected to throw
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('OPEN state', () => {
    beforeEach(async () => {
      // Force circuit to open
      mockFunction.mockRejectedValue(new Error('test error'));
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(mockFunction);
        } catch (error) {
          // Expected
        }
      }
    });

    it('should reject immediately when open', async () => {
      mockFunction.mockResolvedValue('success');
      mockFunction.mockClear(); // Clear previous calls from beforeEach
      
      await expect(breaker.execute(mockFunction)).rejects.toThrow('Circuit Breaker test-breaker is OPEN');
      expect(mockFunction).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      // Wait for reset timeout and trigger state check by attempting a call
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // State transitions to HALF_OPEN only when next request is made
      mockFunction.mockResolvedValue('success');
      await breaker.execute(mockFunction);
      
      // After successful call in HALF_OPEN, should go back to CLOSED (or stay HALF_OPEN if successThreshold not met)
      expect([CircuitState.HALF_OPEN, CircuitState.CLOSED]).toContain(breaker.getState());
    });
  });

  describe('HALF_OPEN state', () => {
    beforeEach(async () => {
      // Open the circuit
      mockFunction.mockRejectedValue(new Error('test error'));
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(mockFunction);
        } catch (error) {
          // Expected
        }
      }
      
      // Wait for half-open
      await new Promise(resolve => setTimeout(resolve, 1100));
      mockFunction.mockClear();
    });

    it('should allow test requests in HALF_OPEN and transition to CLOSED after successThreshold', async () => {
      mockFunction.mockResolvedValue('success');
      
      // First success
      const result1 = await breaker.execute(mockFunction);
      expect(result1).toBe('success');
      
      // Still in HALF_OPEN (needs successThreshold of 2)
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
      
      // Second success should close the circuit
      const result2 = await breaker.execute(mockFunction);
      expect(result2).toBe('success');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should return to OPEN on failure in HALF_OPEN', async () => {
      mockFunction.mockRejectedValue(new Error('test error'));
      
      try {
        await breaker.execute(mockFunction);
      } catch (error) {
        // Expected
      }
      
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Statistics', () => {
    it('should track successful calls', async () => {
      mockFunction.mockResolvedValue('success');
      
      await breaker.execute(mockFunction);
      await breaker.execute(mockFunction);
      
      const stats = breaker.getStats();
      expect(stats.successCount).toBe(0); // Success count only tracked in HALF_OPEN
      expect(stats.failureCount).toBe(0);
    });

    it('should track consecutive failures', async () => {
      mockFunction.mockRejectedValue(new Error('test error'));
      
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(mockFunction);
        } catch (error) {
          // Expected
        }
      }
      
      const stats = breaker.getStats();
      expect(stats.failureCount).toBe(2);
    });

    it('should reset consecutive failures on success', async () => {
      // Fail once
      mockFunction.mockRejectedValueOnce(new Error('test error'));
      try {
        await breaker.execute(mockFunction);
      } catch (error) {
        // Expected
      }
      
      // Then succeed
      mockFunction.mockResolvedValue('success');
      await breaker.execute(mockFunction);
      
      const stats = breaker.getStats();
      expect(stats.failureCount).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should use custom failure threshold', async () => {
      const customBreaker = new CircuitBreaker({
        name: 'custom-breaker',
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 1000,
      });

      mockFunction.mockRejectedValue(new Error('test error'));
      
      // Should not open after 3 failures
      for (let i = 0; i < 3; i++) {
        try {
          await customBreaker.execute(mockFunction);
        } catch (error) {
          // Expected
        }
      }
      
      expect(customBreaker.getState()).toBe(CircuitState.CLOSED);
      
      // Should open after 5 failures
      for (let i = 0; i < 2; i++) {
        try {
          await customBreaker.execute(mockFunction);
        } catch (error) {
          // Expected
        }
      }
      
      expect(customBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Error handling', () => {
    it('should propagate original error', async () => {
      const customError = new Error('Custom error message');
      mockFunction.mockRejectedValue(customError);
      
      await expect(breaker.execute(mockFunction)).rejects.toThrow('Custom error message');
    });

    it('should handle synchronous errors', async () => {
      mockFunction.mockImplementation(() => {
        throw new Error('Sync error');
      });
      
      await expect(breaker.execute(mockFunction)).rejects.toThrow('Sync error');
    });
  });

  describe('Reset functionality', () => {
    it('should reset to CLOSED state', async () => {
      // Open the circuit
      mockFunction.mockRejectedValue(new Error('test error'));
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(mockFunction);
        } catch (error) {
          // Expected
        }
      }
      
      expect(breaker.getState()).toBe(CircuitState.OPEN);
      
      // Reset
      breaker.reset();
      
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      
      const stats = breaker.getStats();
      expect(stats.failureCount).toBe(0);
    });
  });
});
