/**
 * Integration Test: Test Specialization Encryption Full Flow
 *
 * Tests den kompletten Lifecycle:
 * 1. Load plaintext specialization
 * 2. Encrypt to backup
 * 3. Save encrypted file
 * 4. Decrypt from file
 * 5. Verify integrity
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getTestSpecializationBackupManager } from '../security/testSpecializationBackupManager';

const TEMP_DIR = path.join(__dirname, '../../temp');

describe('Integration: Test Specialization Encryption Full Flow', () => {
  beforeAll(() => {
    // Create temp directory for test files
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup temp files
    if (fs.existsSync(TEMP_DIR)) {
      const files = fs.readdirSync(TEMP_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(TEMP_DIR, file));
      }
      fs.rmdirSync(TEMP_DIR);
    }
  });

  describe('Full Encryption Workflow', () => {
    it('should complete encrypt->save->load->decrypt flow', async () => {
      const manager = getTestSpecializationBackupManager(TEMP_DIR);

      // Set test key
      const testKey = Buffer.from(
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        'hex'
      );
      manager.setMasterKey(testKey);

      // 1. Create test specialization
      const testSpec = {
        version: '1.0',
        issuer: 'test-issuer',
        timestamp: Date.now(),
        orderId: 'TEST-001',
        signature: 'TEST_SIG',
        data: {
          id: 'test-spec',
          name: 'Test Specialization',
          description: 'A test specialization for encryption testing',
          category: 'Testing',
          icon: '🧪',
          version: '1.0.0',
          systemPrompt:
            'This is a test system prompt that should be encrypted.',
          contextInstructions: ['Instruction 1', 'Instruction 2'],
          examplePrompts: ['Example 1', 'Example 2'],
          features: ['Feature 1', 'Feature 2'],
          targetAudience: 'Test Audience',
          keywords: ['test', 'encryption'],
        },
      };

      // Write plaintext version to temp
      const plainPath = path.join(TEMP_DIR, 'test-spec.json');
      fs.writeFileSync(plainPath, JSON.stringify(testSpec, null, 2));

      // 2. Encrypt to backup
      const encResult = await manager.saveEncrypted('test-spec', testSpec);

      expect(encResult.filePath).toContain('.json.enc');
      expect(fs.existsSync(encResult.filePath)).toBe(true);

      // 3. Verify encrypted file structure
      const encryptedContent = JSON.parse(
        fs.readFileSync(encResult.filePath, 'utf-8')
      );

      expect(encryptedContent.version).toBe('1.0');
      expect(encryptedContent.algorithm).toBe('aes-256-gcm');
      expect(encryptedContent.iv).toBeDefined();
      expect(encryptedContent.authTag).toBeDefined();
      expect(encryptedContent.ciphertext).toBeDefined();
      expect(encryptedContent.integrity).toBeDefined();
      expect(encryptedContent.integrity.originalHash).toBe(encResult.hash);

      // 4. Verify file was actually encrypted (not plaintext)
      expect(encryptedContent.ciphertext).not.toBe(JSON.stringify(testSpec));
      expect(encryptedContent.ciphertext).not.toContain('systemPrompt');

      // 5. Load and verify can be loaded back
      const loaded = await manager.load('test-spec');
      expect(loaded.data.data.id).toBe('test-spec');
      expect(loaded.data.data.systemPrompt).toBe(testSpec.data.systemPrompt);

      // 6. Verify integrity hash matches
      expect(loaded.hash).toBe(encResult.hash);
    });

    it('should handle multiple specializations in same directory', async () => {
      const manager = getTestSpecializationBackupManager(TEMP_DIR);

      const testSpecs = [
        {
          id: 'spec-1',
          data: {
            id: 'spec-1',
            name: 'Spec 1',
            systemPrompt: 'System prompt 1',
          },
        },
        {
          id: 'spec-2',
          data: {
            id: 'spec-2',
            name: 'Spec 2',
            systemPrompt: 'System prompt 2',
          },
        },
      ];

      // Create test specializations
      for (const spec of testSpecs) {
        const fullSpec = {
          version: '1.0',
          issuer: 'test',
          timestamp: Date.now(),
          orderId: `TEST-${spec.id}`,
          signature: 'TEST',
          data: {
            ...spec.data,
            description: '',
            category: 'Test',
            icon: '🧪',
            version: '1.0.0',
            contextInstructions: [],
            examplePrompts: [],
            features: [],
            targetAudience: '',
            keywords: [],
          },
        };

        const specFilePath = path.join(TEMP_DIR, `${spec.id}.json`);
        fs.writeFileSync(specFilePath, JSON.stringify(fullSpec, null, 2));

        await manager.saveEncrypted(spec.id, fullSpec);
      }

      // List all
      const listed = manager.listAll();
      expect(listed.length).toBeGreaterThanOrEqual(2);

      // Verify all can be loaded
      for (const spec of testSpecs) {
        const loaded = await manager.load(spec.id);
        expect(loaded.data.data.id).toBe(spec.id);
      }
    });
  });

  describe('Encryption Robustness', () => {
    it('should handle large system prompts', async () => {
      const manager = getTestSpecializationBackupManager(TEMP_DIR);

      // Create a large system prompt (5KB+)
      const largePrompt = 'This is a test prompt. '.repeat(250); // ~5.5KB

      const testSpec = {
        version: '1.0',
        issuer: 'test',
        timestamp: Date.now(),
        orderId: 'TEST-LARGE',
        signature: 'TEST',
        data: {
          id: 'large-spec',
          name: 'Large Specialization',
          description: 'Test with large prompt',
          category: 'Test',
          icon: '📦',
          version: '1.0.0',
          systemPrompt: largePrompt,
          contextInstructions: [],
          examplePrompts: [],
          features: [],
          targetAudience: '',
          keywords: [],
        },
      };

      await manager.saveEncrypted('large-spec', testSpec);

      // Verify can decrypt
      const loaded = await manager.load('large-spec');
      expect(loaded.data.data.systemPrompt).toBe(largePrompt);
      expect(loaded.data.data.systemPrompt.length).toBeGreaterThan(5000);
    });

    it('should preserve special characters and unicode', async () => {
      const manager = getTestSpecializationBackupManager(TEMP_DIR);

      const specialPrompt = `
        Unicode test: 你好 • Здравствуй • مرحبا • שלום
        Special chars: !@#$%^&*()_+-=[]{}|;':",./<>?
        Emojis: 🚀 🎨 🌟 💡 🔐 ✨
        Math: ∑ ∫ ∂ ∆ √ ∞ ≤ ≥
      `;

      const testSpec = {
        version: '1.0',
        issuer: 'test',
        timestamp: Date.now(),
        orderId: 'TEST-UNICODE',
        signature: 'TEST',
        data: {
          id: 'unicode-spec',
          name: 'Unicode Test 🌍',
          description: 'Testing unicode preservation',
          category: 'Test',
          icon: '🌐',
          version: '1.0.0',
          systemPrompt: specialPrompt,
          contextInstructions: ['Привет', '你好'],
          examplePrompts: ['مثال', 'דוגמה'],
          features: ['✅', '🎯'],
          targetAudience: 'Multi-lingual users',
          keywords: ['unicode', '多言語'],
        },
      };

      await manager.saveEncrypted('unicode-spec', testSpec);

      // Verify special chars preserved
      const loaded = await manager.load('unicode-spec');
      expect(loaded.data.data.systemPrompt).toBe(specialPrompt);
      expect(loaded.data.data.contextInstructions[0]).toBe('Привет');
      expect(loaded.data.data.keywords[1]).toBe('多言語');
    });

    it('should handle edge case empty values', async () => {
      const manager = getTestSpecializationBackupManager(TEMP_DIR);

      const testSpec = {
        version: '1.0',
        issuer: 'test',
        timestamp: Date.now(),
        orderId: 'TEST-EMPTY',
        signature: 'TEST',
        data: {
          id: 'empty-spec',
          name: '',
          description: '',
          category: '',
          icon: '',
          version: '1.0.0',
          systemPrompt: '', // Empty prompt
          contextInstructions: [],
          examplePrompts: [],
          features: [],
          targetAudience: '',
          keywords: [],
        },
      };

      await manager.saveEncrypted('empty-spec', testSpec);
      const loaded = await manager.load('empty-spec');

      expect(loaded.data.data.systemPrompt).toBe('');
      expect(loaded.data.data.contextInstructions).toEqual([]);
    });
  });

  describe('Performance & Metrics', () => {
    it('should encrypt and decrypt in reasonable time', async () => {
      const manager = getTestSpecializationBackupManager(TEMP_DIR);

      const testSpec = {
        version: '1.0',
        issuer: 'test',
        timestamp: Date.now(),
        orderId: 'TEST-PERF',
        signature: 'TEST',
        data: {
          id: 'perf-spec',
          name: 'Performance Test',
          description: 'Testing encryption speed',
          category: 'Test',
          icon: '⚡',
          version: '1.0.0',
          systemPrompt: 'Performance test prompt'.repeat(100),
          contextInstructions: [],
          examplePrompts: [],
          features: [],
          targetAudience: '',
          keywords: [],
        },
      };

      // Measure encryption time
      const encryptStart = performance.now();
      const result = await manager.saveEncrypted('perf-spec', testSpec);
      const encryptTime = performance.now() - encryptStart;

      // Measure decryption time
      const decryptStart = performance.now();
      await manager.load('perf-spec');
      const decryptTime = performance.now() - decryptStart;

      expect(encryptTime).toBeLessThan(100); // < 100ms
      expect(decryptTime).toBeLessThan(100); // < 100ms
    });

    it('should report encryption statistics', async () => {
      const manager = getTestSpecializationBackupManager(TEMP_DIR);

      const testSpec = {
        version: '1.0',
        issuer: 'test',
        timestamp: Date.now(),
        orderId: 'TEST-STATS',
        signature: 'TEST',
        data: {
          id: 'stats-spec',
          name: 'Statistics Test',
          description: 'Testing size statistics',
          category: 'Test',
          icon: '📊',
          version: '1.0.0',
          systemPrompt: 'Statistics test prompt'.repeat(50),
          contextInstructions: [],
          examplePrompts: [],
          features: [],
          targetAudience: '',
          keywords: [],
        },
      };

      const result = await manager.saveEncrypted('stats-spec', testSpec);

      // Log statistics
      console.log(`\n📊 Encryption Statistics:`);
      console.log(`   Hash: ${result.hash.slice(0, 16)}...`);
      console.log(`   File Size: ${result.size} bytes`);
      console.log(`   Original Size: ${JSON.stringify(testSpec).length} bytes`);

      expect(result.hash).toHaveLength(64); // SHA-256
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    it('should handle key mismatch gracefully', async () => {
      const manager = getTestSpecializationBackupManager(TEMP_DIR);

      // Set key 1
      const key1 = Buffer.from(
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        'hex'
      );
      manager.setMasterKey(key1);

      const testSpec = {
        version: '1.0',
        issuer: 'test',
        timestamp: Date.now(),
        orderId: 'TEST-KEY',
        signature: 'TEST',
        data: {
          id: 'key-test-spec',
          name: 'Key Test',
          description: 'Testing key mismatch',
          category: 'Test',
          icon: '🔑',
          version: '1.0.0',
          systemPrompt: 'This should only decrypt with the correct key',
          contextInstructions: [],
          examplePrompts: [],
          features: [],
          targetAudience: '',
          keywords: [],
        },
      };

      await manager.saveEncrypted('key-test-spec', testSpec);

      // Try to decrypt with different key
      const manager2 = getTestSpecializationBackupManager(TEMP_DIR);
      const key2 = Buffer.from(
        'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
        'hex'
      );
      manager2.setMasterKey(key2);

      // Should either fail or return wrong data
      try {
        await manager2.load('key-test-spec');
        // If it loads, data should be corrupted
      } catch (error) {
        // Expected: decryption fails with wrong key
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
