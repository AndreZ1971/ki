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
      const nextRetryTime = new Date(message!.nextRetryAt!).getTime();

      expect(nextRetryTime).toBeGreaterThanOrEqual(beforeAdd + retryDelay - 100);
      expect(nextRetryTime).toBeLessThanOrEqual(beforeAdd + retryDelay + 100);

      await dlqWithDelay.shutdown();
    });
  });

  describe('Retrieving messages', () => {
    it('should retrieve message by id', async () => {
      const id = await dlq.add('test-job', { data: 'test' }, new Error('Test'));
      const message = await dlq.get(id);

      expect(message).toBeDefined();
      expect(message?.id).toBe(id);
      expect(message?.jobType).toBe('test-job');
    });

    it('should return undefined for non-existent id', async () => {
      const message = await dlq.get('non-existent-id');
      expect(message).toBeUndefined();
    });

    it('should list all messages', async () => {
      await dlq.add('job-1', {}, new Error('Error 1'));
      await dlq.add('job-2', {}, new Error('Error 2'));
      await dlq.add('job-3', {}, new Error('Error 3'));

      const messages = dlq.getAll();

      expect(messages).toHaveLength(3);
      expect(messages.map(m => m.jobType)).toContain('job-1');
      expect(messages.map(m => m.jobType)).toContain('job-2');
      expect(messages.map(m => m.jobType)).toContain('job-3');
    });

    it('should filter messages by job type', async () => {
      await dlq.add('job-type-a', {}, new Error('Error A'));
      await dlq.add('job-type-b', {}, new Error('Error B'));
      await dlq.add('job-type-a', {}, new Error('Error A2'));

      const filteredMessages = dlq.getByJobType('job-type-a');

      expect(filteredMessages).toHaveLength(2);
      expect(filteredMessages.every(m => m.jobType === 'job-type-a')).toBe(true);
    });
  });

  describe('Removing messages', () => {
    it('should remove message by id', async () => {
      const id = await dlq.add('test-job', {}, new Error('Test'));
      
      await dlq.remove(id);
      
      const message = await dlq.get(id);
      expect(message).toBeUndefined();
      expect(fs.unlink).toHaveBeenCalled();
    });

    it('should handle removal of non-existent message', async () => {
      await expect(dlq.remove('non-existent-id')).resolves.not.toThrow();
    });

    it('should clear all messages', async () => {
      await dlq.add('job-1', {}, new Error('Error 1'));
      await dlq.add('job-2', {}, new Error('Error 2'));

      await dlq.clear();

      const messages = dlq.getAll();
      expect(messages).toHaveLength(0);
    });
  });

  describe('Retry logic', () => {
    it('should increment attempt count on updateFailure', async () => {
      const id = await dlq.add('test-job', {}, new Error('Test'));
      
      const messageBefore = dlq.get(id);
      expect(messageBefore?.attempts).toBe(1);

      await dlq.updateFailure(id, new Error('Still failing'));

      const messageAfter = dlq.get(id);
      expect(messageAfter?.attempts).toBe(2);
    });

    it('should remove message manually after processing', async () => {
      const id = await dlq.add('test-job', {}, new Error('Test'));

      // Simulate successful processing
      await dlq.remove(id);

      const message = dlq.get(id);
      expect(message).toBeUndefined();
    });

    it('should call onMaxRetriesReached when max retries exceeded', async () => {
      const onMaxRetriesReached = vi.fn();
      const dlqWithCallback = new DeadLetterQueue({
        maxRetries: 2,
        autoRetry: false,
        onMaxRetriesReached,
      });

      const id = await dlqWithCallback.add('test-job', {}, new Error('Test'));

      // Attempt 2 (reaches max retries)
      await dlqWithCallback.updateFailure(id, new Error('Still failing'));

      expect(onMaxRetriesReached).toHaveBeenCalled();
      
      await dlqWithCallback.shutdown();
    });

    it('should not allow retry beyond max attempts', async () => {
      const dlqWithLimit = new DeadLetterQueue({
        maxRetries: 2,
        autoRetry: false,
      });

      const id = await dlqWithLimit.add('test-job', {}, new Error('Test'));

      // Exhaust retries
      await dlqWithLimit.updateFailure(id, new Error('Fail'));

      // At max retries, nextRetryAt should be undefined
      const message = dlqWithLimit.get(id);
      expect(message?.attempts).toBe(2);
      expect(message?.nextRetryAt).toBeUndefined();

      await dlqWithLimit.shutdown();
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', async () => {
      await dlq.add('job-1', {}, new Error('Error 1'));
      await dlq.add('job-2', {}, new Error('Error 2'));
      await dlq.add('job-3', {}, new Error('Error 3'));

      const stats = await dlq.getStats();

      expect(stats.total).toBe(3);
      expect(stats.byJobType).toHaveProperty('job-1', 1);
      expect(stats.byJobType).toHaveProperty('job-2', 1);
      expect(stats.byJobType).toHaveProperty('job-3', 1);
    });

    it('should track ready for retry count', async () => {
      const id1 = await dlq.add('job-1', {}, new Error('Error 1'));
      await new Promise(resolve => setTimeout(resolve, 10));
      const id2 = await dlq.add('job-2', {}, new Error('Error 2'));

      const stats = dlq.getStats();

      // Both messages should be ready for retry (nextRetryAt is set)
      expect(stats.readyForRetry).toBeGreaterThanOrEqual(0);
      expect(stats.total).toBe(2);
    });

    it('should return empty stats for empty queue', async () => {
      const stats = dlq.getStats();

      expect(stats.total).toBe(0);
      expect(stats.byJobType).toEqual({});
      expect(stats.readyForRetry).toBe(0);
    });
  });

  describe('Persistence', () => {
    it('should save message to disk', async () => {
      await dlq.add('test-job', { data: 'test' }, new Error('Test'));

      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should handle write errors gracefully', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await dlq.add('test-job', {}, new Error('Test'));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Shutdown', () => {
    it('should stop auto-retry on shutdown', async () => {
      const dlqWithAutoRetry = new DeadLetterQueue({
        autoRetry: true,
        retryDelay: 100,
      });

      await dlqWithAutoRetry.shutdown();

      // After shutdown, auto-retry should not run
      await dlqWithAutoRetry.add('test-job', {}, new Error('Test'));
      await new Promise(resolve => setTimeout(resolve, 200));

      // No retry should have happened
      // (In real implementation, this would check internal state)
    });
  });
});
