import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DeadLetterQueue, DeadLetterMessage } from '../../backend/error-handling/dead-letter-queue';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module
vi.mock('fs/promises');

describe('Dead Letter Queue (DLQ)', () => {
  let dlq: DeadLetterQueue;
  const testStoragePath = path.join(process.cwd(), 'data', 'dlq-test');

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fs operations
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue('{}');
    vi.mocked(fs.unlink).mockResolvedValue(undefined);

    dlq = new DeadLetterQueue({
      storagePath: testStoragePath,
      maxRetries: 3,
      retryDelay: 1000,
      autoRetry: false, // Disable auto-retry for tests
    });
  });

  afterEach(async () => {
    if (dlq) {
      await dlq.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should create storage directory on init', async () => {
      await new Promise(resolve => setTimeout(resolve, 50)); // Wait for init

      expect(fs.mkdir).toHaveBeenCalledWith(testStoragePath, { recursive: true });
    });

    it('should handle initialization errors gracefully', async () => {
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Permission denied'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const newDlq = new DeadLetterQueue({
        storagePath: '/invalid/path',
        autoRetry: false,
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      await newDlq.shutdown();
    });
  });

  describe('Adding messages', () => {
    it('should add failed job to queue', async () => {
      const jobType = 'test-job';
      const payload = { data: 'test' };
      const error = new Error('Test error');

      const id = await dlq.add(jobType, payload, error);

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should store error details correctly', async () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      (error as any).code = 'TEST_ERROR';

      const id = await dlq.add('test-job', { data: 'test' }, error);

      const message = await dlq.get(id);
      
      expect(message).toBeDefined();
      expect(message?.error.message).toBe('Test error');
      expect(message?.error.stack).toBe('Error stack trace');
      expect(message?.error.code).toBe('TEST_ERROR');
    });

    it('should include metadata if provided', async () => {
      const metadata = { userId: '123', requestId: 'abc' };
      
      const id = await dlq.add('test-job', {}, new Error('Test'), metadata);
      const message = await dlq.get(id);

      expect(message?.metadata).toEqual(metadata);
    });

    it('should set timestamps correctly', async () => {
      const beforeAdd = Date.now();
      const id = await dlq.add('test-job', {}, new Error('Test'));
      const afterAdd = Date.now();

      const message = await dlq.get(id);

      expect(message).toBeDefined();
      const firstFailedTime = new Date(message!.firstFailedAt).getTime();
      expect(firstFailedTime).toBeGreaterThanOrEqual(beforeAdd);
      expect(firstFailedTime).toBeLessThanOrEqual(afterAdd);
    });

    it('should calculate next retry time', async () => {
      const retryDelay = 5000;
      const dlqWithDelay = new DeadLetterQueue({
        retryDelay,
        autoRetry: false,
      });

      const beforeAdd = Date.now();
      const id = await dlqWithDelay.add('test-job', {}, new Error('Test'));
      
      const message = await dlqWithDelay.get(id);
            const nextRetryTime = new Date(message!.nextRetryAt ?? 0);
          });
        });
      });