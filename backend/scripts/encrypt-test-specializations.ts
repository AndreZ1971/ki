#!/usr/bin/env node

/**
 * Encrypt Test Specializations für Backup
 *
 * Erstellt für jede test-specializations/*.json eine verschlüsselte .enc Datei
 * - Klartext: test-specializations/beauty-kosmetik-test.json
 * - Verschlüsselt: test-specializations/beauty-kosmetik-test.json.enc
 *
 * Verwendung:
 *   ts-node encrypt-test-specializations.ts
 *
 * Mit Vault Key:
 *   PROMPT_ENCRYPTION_KEY=abc123... ts-node encrypt-test-specializations.ts
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface EncryptedBackup {
  version: string;
  algorithm: string;
  timestamp: string;
  iv: string; // hex
  authTag: string; // hex
  ciphertext: string; // hex
  integrity: {
    originalHash: string; // SHA-256
    originalSize: number;
    originalFile: string;
  };
}

class SpecializationEncryption {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 12;
  private readonly TAG_LENGTH = 16;
  private readonly dataDir = path.join(
    __dirname,
    '../data/test-specializations'
  );

  /**
   * Erstelle Encryption Key aus Environment
   * In Production: Von Vault laden!
   */
  private getMasterKey(): Buffer {
    const keyHex = process.env.PROMPT_ENCRYPTION_KEY;

    if (keyHex) {
      console.log('✅ Using PROMPT_ENCRYPTION_KEY from environment');
      return Buffer.from(keyHex, 'hex');
    }

    // For local testing: Generate deterministic key from hostname
    console.log(
      '⚠️  PROMPT_ENCRYPTION_KEY not set - using test key (DEV ONLY!)'
    );
    const testKey = crypto
      .createHash('sha256')
      .update('test-specializations-backup-key')
      .digest();
    return testKey;
  }

  /**
   * Encrypt JSON content mit AES-256-GCM
   */
  private encrypt(plaintext: string, masterKey: Buffer): EncryptedBackup {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, masterKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Calculate original hash für integrity check
    const originalHash = crypto
      .createHash('sha256')
      .update(plaintext)
      .digest('hex');

    return {
      version: '1.0',
      algorithm: 'aes-256-gcm',
      timestamp: new Date().toISOString(),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      ciphertext: encrypted,
      integrity: {
        originalHash,
        originalSize: plaintext.length,
        originalFile: '',
      },
    };
  }

  /**
   * Decrypt für Verification
   */
  private decrypt(backup: EncryptedBackup, masterKey: Buffer): string {
    const iv = Buffer.from(backup.iv, 'hex');
    const authTag = Buffer.from(backup.authTag, 'hex');

    const decipher = crypto.createDecipheriv(this.ALGORITHM, masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(backup.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Encrypt alle Test-Specializations
   */
  async encryptAll(): Promise<void> {
    console.log('\n🔐 Encrypting Test Specializations...\n');

    const files = fs
      .readdirSync(this.dataDir)
      .filter((f) => f.endsWith('-test.json'))
      .sort();

    if (files.length === 0) {
      console.error('❌ No test specialization files found in', this.dataDir);
      process.exit(1);
    }

    console.log(`📂 Found ${files.length} test files:\n`);

    const masterKey = this.getMasterKey();
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        const filePath = path.join(this.dataDir, file);
        const encFilePath = `${filePath}.enc`;

        // 1. Read original JSON
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsedJson = JSON.parse(content); // Validate JSON

        // 2. Encrypt
        const encrypted = this.encrypt(content, masterKey);
        encrypted.integrity.originalFile = file;

        // 3. Save encrypted backup
        fs.writeFileSync(encFilePath, JSON.stringify(encrypted, null, 2));

        // 4. Verify decryption works
        const decrypted = this.decrypt(encrypted, masterKey);
        const verifyHash = crypto
          .createHash('sha256')
          .update(decrypted)
          .digest('hex');

        if (verifyHash !== encrypted.integrity.originalHash) {
          throw new Error('Verification failed: Hash mismatch');
        }

        // 5. Calculate sizes
        const origSize = fs.statSync(filePath).size;
        const encSize = fs.statSync(encFilePath).size;
        const ratio = ((encSize / origSize) * 100).toFixed(1);

        console.log(`✅ ${file}`);
        console.log(`   → Original: ${origSize} bytes`);
        console.log(`   → Encrypted: ${encSize} bytes (${ratio}%)`);
        console.log(
          `   → Hash: ${encrypted.integrity.originalHash.slice(0, 16)}...`
        );
        console.log('');

        successCount++;
      } catch (error) {
        console.error(`❌ ${file}`);
        console.error(
          `   Error: ${error instanceof Error ? error.message : String(error)}\n`
        );
        errorCount++;
      }
    }

    // Summary
    console.log('═'.repeat(60));
    console.log(
      `\n📊 Results: ${successCount} encrypted, ${errorCount} failed\n`
    );

    if (errorCount === 0) {
      console.log('✨ All test specializations encrypted successfully!');
      console.log('\n💾 Encrypted backups location:');
      console.log(`   ${this.dataDir}/*.json.enc\n`);
      console.log('🔑 Key Management:');
      console.log('   - Production: Load from HashiCorp Vault or AWS KMS');
      console.log(
        '   - Development: Set PROMPT_ENCRYPTION_KEY environment variable\n'
      );
    } else {
      process.exit(1);
    }
  }
}

// Main
const encryptor = new SpecializationEncryption();
encryptor.encryptAll().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
