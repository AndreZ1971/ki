import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  RetryStrategy,
  standardRetry,
  aggressiveRetry,
  conservativeRetry,
  openAIRetry,
} from '../../backend/error-handling/retry-strategies';

describe('Retry Strategies', () => {
  let mockFunction: ReturnType<typeof vi.fn>;
  let strategy: RetryStrategy;

  beforeEach(() => {
    mockFunction = vi.fn();
    vi.clearAllTimers();
    vi.useFakeTimers();
    strategy = new RetryStrategy({
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 1000,
      factor: 2,
      jitter: false, // Disable jitter for predictable tests
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('RetryStrategy Class', () => {
    it('should return result on first success', async () => {
      mockFunction.mockResolvedValue('success');

      const result = await strategy.execute(mockFunction);

      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const error1 = new Error('Connection reset') as any;
      error1.code = 'ECONNRESET';
      const error2 = new Error('Timeout') as any;
      error2.code = 'ETIMEDOUT';
      
      mockFunction
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2)
        .mockResolvedValue('success');

      const promise = strategy.execute(mockFunction);
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const error = new Error('Timeout') as any;
      error.code = 'ETIMEDOUT';
      mockFunction.mockRejectedValue(error);

      const promise = strategy.execute(mockFunction);
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Timeout');
      expect(mockFunction).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      // Create strategy with specific retryable errors
      const customStrategy = new RetryStrategy({
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 1000,
        factor: 2,
        jitter: false,
        retryableErrors: ['ECONNRESET'],
      });

      const error = new Error('Not retryable') as any;
      error.code = 'NOT_RETRYABLE';
      mockFunction.mockRejectedValue(error);

      await expect(customStrategy.execute(mockFunction)).rejects.toThrow('Not retryable');
      expect(mockFunction).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should handle sync errors', async () => {
      mockFunction.mockImplementation(() => {
        throw new Error('Sync error');
      });

      await expect(strategy.execute(mockFunction)).rejects.toThrow('Sync error');
    });
  });

  describe('Standard Retry Strategy', () => {
    it('should be instance of RetryStrategy', () => {
      expect(standardRetry).toBeInstanceOf(RetryStrategy);
    });

    it('should successfully retry and succeed', async () => {
      const error = new Error('Connection reset') as any;
      error.code = 'ECONNRESET';
      mockFunction
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const promise = standardRetry.execute(mockFunction);
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('Aggressive Retry Strategy', () => {
    it('should be instance of RetryStrategy', () => {
      expect(aggressiveRetry).toBeInstanceOf(RetryStrategy);
    });

    it('should handle multiple failures', async () => {
      const error = new Error('Timeout') as any;
      error.code = 'ETIMEDOUT';
      mockFunction
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const promise = aggressiveRetry.execute(mockFunction);
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('Conservative Retry Strategy', () => {
    it('should be instance of RetryStrategy', () => {
      expect(conservativeRetry).toBeInstanceOf(RetryStrategy);
    });

    it('should work with fewer retries', async () => {
      const error = new Error('Connection refused') as any;
      error.code = 'ECONNREFUSED';
      mockFunction
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const promise = conservativeRetry.execute(mockFunction);
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('OpenAI Retry Strategy', () => {
    it('should be instance of RetryStrategy', () => {
      expect(openAIRetry).toBeInstanceOf(RetryStrategy);
    });

    it('should handle rate limit scenarios', async () => {
      const error = new Error('Timeout') as any;
      error.code = 'ETIMEDOUT';
      mockFunction
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const promise = openAIRetry.execute(mockFunction);
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('Custom Retry Options', () => {
    it('should respect custom maxAttempts', async () => {
      const customStrategy = new RetryStrategy({
        maxAttempts: 2,
        initialDelay: 10,
        maxDelay: 100,
        factor: 2,
        jitter: false,
      });

      const error = new Error('Connection reset') as any;
      error.code = 'ECONNRESET';
      mockFunction.mockRejectedValue(error);

      const promise = customStrategy.execute(mockFunction);
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Connection reset');
      expect(mockFunction).toHaveBeenCalledTimes(2);
    });

    it('should work with maxAttempts of 1', async () => {
      const customStrategy = new RetryStrategy({
        maxAttempts: 1,
        initialDelay: 10,
        maxDelay: 100,
        factor: 2,
        jitter: false,
      });

      const error = new Error('Connection reset') as any;
      error.code = 'ECONNRESET';
      mockFunction.mockRejectedValue(error);

      await expect(customStrategy.execute(mockFunction)).rejects.toThrow('Connection reset');
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    it('should handle immediate success without retry', async () => {
      mockFunction.mockResolvedValue('immediate success');

      const result = await strategy.execute(mockFunction);

      expect(result).toBe('immediate success');
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Propagation', () => {
    it('should preserve original error message', async () => {
      const customError = new Error('Custom error with ETIMEDOUT') as any;
      customError.code = 'ETIMEDOUT';
      mockFunction.mockRejectedValue(customError);

      const promise = strategy.execute(mockFunction);
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Custom error with ETIMEDOUT');
    });

    it('should handle non-Error objects', async () => {
      mockFunction.mockRejectedValue('string error');

      const promise = strategy.execute(mockFunction);
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
    });
  });
});
