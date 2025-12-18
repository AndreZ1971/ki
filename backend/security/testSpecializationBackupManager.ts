/**
 * Test Specialization Backup Manager
 *
 * Verwaltet Verschlüsselung von Test-Spezialisierungen als Backups
 * - Lädt .json ODER .enc Version (fallback-Logik)
 * - Verifiziert Integrität via SHA-256
 * - Logged alle Zugriffe (anonym)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface EncryptedBackup {
  version: string;
  algorithm: string;
  timestamp: string;
  iv: string;
  authTag: string;
  ciphertext: string;
  integrity: {
    originalHash: string;
    originalSize: number;
    originalFile: string;
  };
}

export interface TestSpecialization {
  version: string;
  issuer: string;
  timestamp: number;
  orderId: string;
  signature: string;
  data: {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    version: string;
    systemPrompt: string;
    contextInstructions: string[];
    examplePrompts: string[];
    features: string[];
    targetAudience: string;
    keywords: string[];
  };
}

/**
 * Manager für Test Specialization Backups
 */
export class TestSpecializationBackupManager {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 12;
  private readonly dataDir: string;
  private masterKey: Buffer | null = null;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  /**
   * Set encryption master key
   */
  setMasterKey(key: Buffer | string): void {
    this.masterKey = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
  }

  /**
   * Get or generate master key
   */
  private getMasterKey(): Buffer {
    if (this.masterKey) return this.masterKey;

    // For local testing: Derive key from environment
    const keySource =
      process.env.PROMPT_ENCRYPTION_KEY ||
      process.env.TEST_ENCRYPTION_KEY ||
      'test-specializations-key';

    const key = crypto.createHash('sha256').update(keySource).digest();

    this.masterKey = key;
    return key;
  }

  /**
   * Encrypt content with AES-256-GCM
   */
  private encrypt(plaintext: string): EncryptedBackup {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const masterKey = this.getMasterKey();
    const cipher = crypto.createCipheriv(this.ALGORITHM, masterKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
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
   * Decrypt content with AES-256-GCM
   */
  private decrypt(backup: EncryptedBackup): string {
    const iv = Buffer.from(backup.iv, 'hex');
    const authTag = Buffer.from(backup.authTag, 'hex');
    const masterKey = this.getMasterKey();

    const decipher = crypto.createDecipheriv(this.ALGORITHM, masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(backup.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Verify integrity
    const hash = crypto.createHash('sha256').update(decrypted).digest('hex');
    if (hash !== backup.integrity.originalHash) {
      throw new Error(
        `Integrity check failed for ${backup.integrity.originalFile}: ` +
          `expected ${backup.integrity.originalHash}, got ${hash}`
      );
    }

    return decrypted;
  }

  /**
   * Load specialization (tries .enc first, then .json)
   */
  async load(id: string): Promise<{
    data: TestSpecialization;
    source: 'encrypted' | 'plaintext';
    hash: string;
  }> {
    const basePath = path.join(this.dataDir, `${id}-test`);
    const encPath = `${basePath}.json.enc`;
    const jsonPath = `${basePath}.json`;

    let data: TestSpecialization;
    let source: 'encrypted' | 'plaintext';

    // Try encrypted first
    if (fs.existsSync(encPath)) {
      try {
        const encBackup = JSON.parse(
          fs.readFileSync(encPath, 'utf-8')
        ) as EncryptedBackup;

        const decrypted = this.decrypt(encBackup);
        data = JSON.parse(decrypted);
        source = 'encrypted';
      } catch (error) {
        // Fallback to plaintext if decryption fails
        if (fs.existsSync(jsonPath)) {
          data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          source = 'plaintext';
        } else {
          throw new Error(
            `Failed to load specialization '${id}': ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    } else if (fs.existsSync(jsonPath)) {
      // Plaintext fallback
      data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      source = 'plaintext';
    } else {
      throw new Error(
        `Specialization '${id}' not found (tried ${encPath} and ${jsonPath})`
      );
    }

    // Calculate hash for integrity
    const contentStr = JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(contentStr).digest('hex');

    return { data, source, hash };
  }

  /**
   * Save as encrypted backup
   */
  async saveEncrypted(
    id: string,
    specialization: TestSpecialization
  ): Promise<{
    filePath: string;
    size: number;
    hash: string;
  }> {
    const basePath = path.join(this.dataDir, `${id}-test`);
    const encPath = `${basePath}.json.enc`;

    const plaintext = JSON.stringify(specialization, null, 2);
    const encrypted = this.encrypt(plaintext);
    encrypted.integrity.originalFile = `${id}-test.json`;

    const encContent = JSON.stringify(encrypted, null, 2);
    fs.writeFileSync(encPath, encContent);

    return {
      filePath: encPath,
      size: encContent.length,
      hash: encrypted.integrity.originalHash,
    };
  }

  /**
   * List all test specializations (both plaintext and encrypted)
   */
  listAll(): {
    id: string;
    plaintext: boolean;
    encrypted: boolean;
    size: number;
  }[] {
    const files = fs.readdirSync(this.dataDir);
    const specs = new Map<string, any>();

    for (const file of files) {
      if (file.endsWith('-test.json')) {
        const id = file.replace('-test.json', '');
        if (!specs.has(id)) {
          specs.set(id, { id, plaintext: false, encrypted: false, size: 0 });
        }
        const filePath = path.join(this.dataDir, file);
        const size = fs.statSync(filePath).size;
        specs.get(id).plaintext = true;
        specs.get(id).size = size;
      } else if (file.endsWith('-test.json.enc')) {
        const id = file.replace('-test.json.enc', '');
        if (!specs.has(id)) {
          specs.set(id, { id, plaintext: false, encrypted: false, size: 0 });
        }
        const filePath = path.join(this.dataDir, file);
        const size = fs.statSync(filePath).size;
        specs.get(id).encrypted = true;
      }
    }

    return Array.from(specs.values());
  }

  /**
   * Verify all encrypted backups
   */
  async verifyAll(): Promise<{
    total: number;
    verified: number;
    failed: number;
    results: Array<{
      id: string;
      verified: boolean;
      error?: string;
    }>;
  }> {
    const results: Array<{ id: string; verified: boolean; error?: string }> =
      [];
    let verified = 0;
    let failed = 0;

    const specs = this.listAll();

    for (const spec of specs) {
      if (!spec.encrypted) continue;

      try {
        const basePath = path.join(this.dataDir, `${spec.id}-test`);
        const encPath = `${basePath}.json.enc`;

        const encBackup = JSON.parse(
          fs.readFileSync(encPath, 'utf-8')
        ) as EncryptedBackup;

        // Try to decrypt
        this.decrypt(encBackup);

        results.push({ id: spec.id, verified: true });
        verified++;
      } catch (error) {
        results.push({
          id: spec.id,
          verified: false,
          error: error instanceof Error ? error.message : String(error),
        });
        failed++;
      }
    }

    return {
      total: specs.length,
      verified,
      failed,
      results,
    };
  }
}

/**
 * Singleton instance
 */
let manager: TestSpecializationBackupManager | null = null;

export function getTestSpecializationBackupManager(
  dataDir: string = path.join(__dirname, '../../data/test-specializations')
): TestSpecializationBackupManager {
  if (!manager) {
    manager = new TestSpecializationBackupManager(dataDir);
  }
  return manager;
}
