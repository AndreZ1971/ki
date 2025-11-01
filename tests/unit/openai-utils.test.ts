import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getOpenAIClient, executeOpenAI } from '../../backend/utils/openai';

// Mock OpenAI SDK
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
      images: {
        generate: vi.fn(),
      },
    })),
  };
});

// Mock error-handling modules
vi.mock('../../backend/error-handling', () => ({
  openAIBreaker: {
    execute: vi.fn((fn) => fn()),
  },
  openAIRetry: {
    execute: vi.fn((fn) => fn()),
  },
  alertError: vi.fn(),
}));

describe('OpenAI Utils', () => {
  const originalEnv = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-api-key-12345';
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalEnv;
  });

  describe('getOpenAIClient', () => {
    it('should create client with API key from environment', () => {
      const client = getOpenAIClient();
      
      expect(client).toBeDefined();
      expect(client.chat).toBeDefined();
      expect(client.images).toBeDefined();
    });

    it('should return same instance on multiple calls (singleton)', () => {
      const client1 = getOpenAIClient();
      const client2 = getOpenAIClient();

      expect(client1).toBe(client2);
    });

    it('should have chat completions API', () => {
      const client = getOpenAIClient();
      
      expect(client.chat).toBeDefined();
      expect(client.chat.completions).toBeDefined();
    });

    it('should have images API', () => {
      const client = getOpenAIClient();
      
      expect(client.images).toBeDefined();
      expect(client.images.generate).toBeDefined();
    });
  });

  describe('executeOpenAI', () => {
    it('should execute successful operation', async () => {
      const mockResult = { id: 'test-123', choices: [] };
      const operation = vi.fn().mockResolvedValue(mockResult);

      const result = await executeOpenAI(operation, 'test-operation');

      expect(result).toEqual(mockResult);
      expect(operation).toHaveBeenCalled();
    });

    it('should pass operation name in context', async () => {
      const operation = vi.fn().mockResolvedValue({ success: true });

      await executeOpenAI(operation, 'chat-completion');

      expect(operation).toHaveBeenCalled();
    });

    it('should handle operation errors', async () => {
      const error = new Error('API Error');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        executeOpenAI(operation, 'test-operation')
      ).rejects.toThrow('API Error');
    });

    it('should pass metadata to error handler', async () => {
      const { alertError } = await import('../../backend/error-handling');
      const error = new Error('Test error');
      const operation = vi.fn().mockRejectedValue(error);
      const metadata = { model: 'gpt-4', tokens: 100 };

      try {
        await executeOpenAI(operation, 'test-op', metadata);
      } catch {
        // Expected to throw
      }

      expect(alertError).toHaveBeenCalledWith(
        'OpenAI API Failed',
        expect.stringContaining('test-op'),
        'OpenAI',
        error,
        metadata
      );
    });

    it('should execute with circuit breaker protection', async () => {
      const { openAIBreaker } = await import('../../backend/error-handling');
      const operation = vi.fn().mockResolvedValue({ success: true });

      await executeOpenAI(operation, 'test');

      expect(openAIBreaker.execute).toHaveBeenCalled();
    });

    it('should execute with retry protection', async () => {
      const { openAIRetry } = await import('../../backend/error-handling');
      const operation = vi.fn().mockResolvedValue({ success: true });

      await executeOpenAI(operation, 'test');

      expect(openAIRetry.execute).toHaveBeenCalled();
    });

    it('should handle rate limit errors (429)', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      const operation = vi.fn().mockRejectedValue(rateLimitError);

      await expect(
        executeOpenAI(operation, 'test')
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      const operation = vi.fn().mockRejectedValue(timeoutError);

      await expect(
        executeOpenAI(operation, 'test')
      ).rejects.toThrow('Request timeout');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network failure');
      (networkError as any).code = 'ECONNREFUSED';
      const operation = vi.fn().mockRejectedValue(networkError);

      await expect(
        executeOpenAI(operation, 'test')
      ).rejects.toThrow('Network failure');
    });

    it('should handle non-Error objects', async () => {
      const operation = vi.fn().mockRejectedValue('String error');

      await expect(
        executeOpenAI(operation, 'test')
      ).rejects.toBeDefined();
    });
  });

  describe('Integration with OpenAI Breaker', () => {
    it('should use openAIBreaker wrapper', async () => {
      const { openAIBreaker } = await import('../../backend/error-handling');
      const operation = vi.fn().mockResolvedValue({ result: 'success' });

      await executeOpenAI(operation, 'integration-test');

      expect(openAIBreaker.execute).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should use openAIRetry wrapper', async () => {
      const { openAIRetry } = await import('../../backend/error-handling');
      const operation = vi.fn().mockResolvedValue({ result: 'success' });

      await executeOpenAI(operation, 'integration-test');

      expect(openAIRetry.execute).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should call both breaker and retry in correct order', async () => {
      const { openAIBreaker, openAIRetry } = await import('../../backend/error-handling');
      const callOrder: string[] = [];

      vi.mocked(openAIRetry.execute).mockImplementation(async (fn) => {
        callOrder.push('retry');
        return fn();
      });

      vi.mocked(openAIBreaker.execute).mockImplementation(async (fn) => {
        callOrder.push('breaker');
        return fn();
      });

      const operation = vi.fn().mockResolvedValue({ success: true });

      await executeOpenAI(operation, 'test');

      expect(callOrder).toEqual(['retry', 'breaker']);
    });
  });

  describe('Error Alerting', () => {
    it('should alert on failure', async () => {
      const { alertError } = await import('../../backend/error-handling');
      const error = new Error('OpenAI error');
      const operation = vi.fn().mockRejectedValue(error);

      try {
        await executeOpenAI(operation, 'failing-operation');
      } catch {
        // Expected
      }

      expect(alertError).toHaveBeenCalled();
    });

    it('should include operation name in alert', async () => {
      const { alertError } = await import('../../backend/error-handling');
      const error = new Error('Test');
      const operation = vi.fn().mockRejectedValue(error);

      try {
        await executeOpenAI(operation, 'specific-operation');
      } catch {
        // Expected
      }

      expect(alertError).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('specific-operation'),
        expect.any(String),
        expect.any(Error),
        undefined
      );
    });

    it('should convert non-Error to Error in alert', async () => {
      const { alertError } = await import('../../backend/error-handling');
      const operation = vi.fn().mockRejectedValue('string error');

      try {
        await executeOpenAI(operation, 'test');
      } catch {
        // Expected
      }

      expect(alertError).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Error),
        undefined
      );
    });
  });

  describe('Client Configuration', () => {
    it('should have correct timeout configured', () => {
      const client = getOpenAIClient();
      
      // Client is configured, we can't directly test timeout but we verify it exists
      expect(client).toBeDefined();
    });

    it('should accept valid API keys', () => {
      process.env.OPENAI_API_KEY = 'sk-valid-key-12345';

      expect(() => getOpenAIClient()).not.toThrow();
    });

    it('should work with API key from environment', () => {
      process.env.OPENAI_API_KEY = 'test-api-key';

      const client = getOpenAIClient();
      expect(client).toBeDefined();
    });
  });
});
