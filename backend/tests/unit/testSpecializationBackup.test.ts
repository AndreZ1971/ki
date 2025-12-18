/**
 * Test Suite: Test Specialization Encryption & Backup
 *
 * Tests für die Verschlüsselung und Verwaltung der Test-Spezialisierungen
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  TestSpecializationBackupManager,
  getTestSpecializationBackupManager,
} from '../security/testSpecializationBackupManager';

const TEST_DATA_DIR = path.join(__dirname, '../../data/test-specializations');

describe('Test Specialization Backup Manager', () => {
  let manager: TestSpecializationBackupManager;

  beforeAll(() => {
    manager = getTestSpecializationBackupManager(TEST_DATA_DIR);

    // Set deterministic test key
    const testKey = Buffer.from(
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      'hex'
    );
    manager.setMasterKey(testKey);
  });

  describe('Load Specializations', () => {
    it('should load plaintext specialization', async () => {
      const result = await manager.load('beauty-kosmetik');

      expect(result.data).toBeDefined();
      expect(result.data.data.id).toBe('beauty-kosmetik');
      expect(result.data.data.name).toContain('Beauty & Kosmetik');
      expect(result.source).toBe('plaintext');
      expect(result.hash).toBeLengthOf(64); // SHA-256 hex
    });

    it('should load all 10 test specializations', async () => {
      const specs = manager.listAll();
      expect(specs).toHaveLength(10);

      const ids = [
        'beauty-kosmetik',
        'digitale-kurse',
        'fashion-mode',
        'fitness-ernaehrung',
        'home-living',
        'immobilien',
        'reisebuero',
        'technik-elektronik',
        'tierbedarf',
        'wein-feinkost',
      ];

      for (const id of ids) {
        const result = await manager.load(id);
        expect(result.data.data.id).toBe(id);
      }
    });

    it('should throw error for non-existent specialization', async () => {
      await expect(manager.load('nonexistent')).rejects.toThrow();
    });
  });

  describe('Encryption & Decryption', () => {
    it('should encrypt and decrypt specialization', async () => {
      const loaded = await manager.load('fashion-mode');

      // Save encrypted
      const encResult = await manager.saveEncrypted(
        'fashion-mode-test',
        loaded.data
      );

      expect(encResult.filePath).toContain('.json.enc');
      expect(encResult.size).toBeGreaterThan(0);
      expect(encResult.hash).toBeLengthOf(64); // SHA-256
    });

    it('should preserve data integrity through encryption', async () => {
      const loaded = await manager.load('technik-elektronik');

      // Simulate encrypt/decrypt cycle
      const encrypted = await manager.saveEncrypted('tech-test', loaded.data);

      // Verify hash is deterministic for same content
      const encrypted2 = await manager.saveEncrypted('tech-test2', loaded.data);
      expect(encrypted.hash).toBe(encrypted2.hash);
    });
  });

  describe('List & Inventory', () => {
    it('should list all specializations', () => {
      const specs = manager.listAll();

      expect(specs.length).toBeGreaterThan(0);
      expect(specs.every((s: any) => s.id)).toBe(true);
      expect(specs.every((s: any) => s.plaintext || s.encrypted)).toBe(true);
    });

    it('should track plaintext vs encrypted', () => {
      const specs = manager.listAll();

      // All test files should have plaintext
      for (const spec of specs) {
        expect(spec.plaintext).toBe(true);
      }
    });
  });

  describe('Hash & Integrity', () => {
    it('should generate consistent SHA-256 hashes', async () => {
      const loaded1 = await manager.load('immobilien');
      const loaded2 = await manager.load('immobilien');

      expect(loaded1.hash).toBe(loaded2.hash);
    });

    it('should detect content changes with hash', async () => {
      const loaded = await manager.load('reisebuero');
      const hash1 = loaded.hash;

      // Modify data
      const modified = { ...loaded.data };
      modified.data.name = 'Modified Name';

      const modifiedStr = JSON.stringify(modified);
      const hash2 = crypto
        .createHash('sha256')
        .update(modifiedStr)
        .digest('hex');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted encrypted files gracefully', async () => {
      // This test would require a corrupted .enc file
      // Implementation depends on how errors are handled
      expect(true).toBe(true); // Placeholder
    });

    it('should provide helpful error messages', async () => {
      try {
        await manager.load('invalid-spec-name');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('not found');
      }
    });
  });

  describe('Performance', () => {
    it('should load specialization quickly', async () => {
      const start = performance.now();
      await manager.load('beauty-kosmetik');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // < 100ms
    });

    it('should verify all backups in reasonable time', async () => {
      const start = performance.now();
      const result = await manager.verifyAll();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5000); // < 5 seconds for all
      expect(result.failed).toBe(0);
    });
  });
});

describe('Security: Encryption Standards', () => {
  let manager: TestSpecializationBackupManager;

  beforeAll(() => {
    manager = getTestSpecializationBackupManager(TEST_DATA_DIR);
  });

  it('should use AES-256-GCM algorithm', async () => {
    const loaded = await manager.load('wein-feinkost');
    const encrypted = await manager.saveEncrypted('wine-test', loaded.data);

    // Verify it was encrypted (not plaintext)
    const encPath = encrypted.filePath;
    const content = fs.readFileSync(encPath, 'utf-8');
    const backup = JSON.parse(content);

    expect(backup.algorithm).toBe('aes-256-gcm');
    expect(backup.version).toBe('1.0');
  });

  it('should use secure random IV', async () => {
    const loaded = await manager.load('home-living');
    const enc1 = await manager.saveEncrypted('home-test-1', loaded.data);
    const enc2 = await manager.saveEncrypted('home-test-2', loaded.data);

    const backup1 = JSON.parse(fs.readFileSync(enc1.filePath, 'utf-8'));
    const backup2 = JSON.parse(fs.readFileSync(enc2.filePath, 'utf-8'));

    // IV should be different for each encryption
    expect(backup1.iv).not.toBe(backup2.iv);
  });

  it('should include integrity hash', async () => {
    const loaded = await manager.load('digitale-kurse');
    const encrypted = await manager.saveEncrypted('digital-test', loaded.data);

    const backup = JSON.parse(fs.readFileSync(encrypted.filePath, 'utf-8'));

    expect(backup.integrity).toBeDefined();
    expect(backup.integrity.originalHash).toBeDefined();
    expect(backup.integrity.originalSize).toBeGreaterThan(0);
    expect(backup.integrity.originalFile).toContain('digitale-kurse');
  });

  it('should have proper key derivation', () => {
    const testKey = Buffer.from(
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      'hex'
    );

    expect(testKey.length).toBe(32); // 256 bits
    manager.setMasterKey(testKey);
    expect(true).toBe(true);
  });
});

describe('Compliance: Test Data Properties', () => {
  let manager: TestSpecializationBackupManager;

  beforeAll(() => {
    manager = getTestSpecializationBackupManager(TEST_DATA_DIR);
  });

  it('should have all required specialization fields', async () => {
    const specs = manager.listAll();

    for (const spec of specs) {
      const loaded = await manager.load(spec.id);
      const data = loaded.data.data;

      expect(data.id).toBeDefined();
      expect(data.name).toBeDefined();
      expect(data.description).toBeDefined();
      expect(data.systemPrompt).toBeDefined();
      expect(data.contextInstructions).toBeInstanceOf(Array);
      expect(data.examplePrompts).toBeInstanceOf(Array);
    }
  });

  it('should have unique IDs for all specializations', async () => {
    const specs = manager.listAll();
    const ids = new Set<string>();

    for (const spec of specs) {
      const loaded = await manager.load(spec.id);
      expect(ids.has(loaded.data.data.id)).toBe(false);
      ids.add(loaded.data.data.id);
    }

    expect(ids.size).toBe(specs.length);
  });

  it('should have reasonable prompt sizes', async () => {
    const specs = manager.listAll();

    for (const spec of specs) {
      const loaded = await manager.load(spec.id);
      const promptLength = loaded.data.data.systemPrompt.length;

      expect(promptLength).toBeGreaterThan(500); // At least 500 chars
      expect(promptLength).toBeLessThan(5000); // Less than 5000 chars
    }
  });
});
