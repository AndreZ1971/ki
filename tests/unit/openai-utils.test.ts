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

   