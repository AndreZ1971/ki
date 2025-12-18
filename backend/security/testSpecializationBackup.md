# Test Specialization Encrypted Backups

## Übersicht

Die Test-Specializations in `backend/data/test-specializations/` sind proprietäre KI-Prompts mit sensiblen Business-Logik. Um diese zu schützen, werden sie verschlüsselt als `.enc` Backups gespeichert.

## Struktur

```
backend/data/test-specializations/
├── beauty-kosmetik-test.json          (Original - Klartext für Development)
├── beauty-kosmetik-test.json.enc      (Encrypted Backup - AES-256-GCM)
├── fashion-mode-test.json
├── fashion-mode-test.json.enc
├── ...
└── wein-feinkost-test.json.enc
```

## Encryption Standard

- **Algorithm:** AES-256-GCM (Galois/Counter Mode)
- **Key Size:** 256 bits (32 bytes)
- **IV Length:** 12 bytes (96 bits)
- **Auth Tag:** 16 bytes (128 bits)
- **Integrity:** SHA-256 Hash (vor Verschlüsselung)

## Verschlüsselte Datei Format

```typescript
interface EncryptedBackup {
  version: string;              // "1.0"
  algorithm: string;            // "aes-256-gcm"
  timestamp: string;            // ISO 8601
  iv: string;                   // hex (24 chars)
  authTag: string;              // hex (32 chars)
  ciphertext: string;           // hex (encrypted JSON)
  integrity: {
    originalHash: string;       // SHA-256 hex
    originalSize: number;       // bytes
    originalFile: string;       // filename
  };
}
```

## Encryption Key Management

### Development Environment

```bash
# Test Key (deterministic, für local testing)
ts-node backend/scripts/encrypt-test-specializations.ts

# Mit Custom Key
PROMPT_ENCRYPTION_KEY=abc123def456... ts-node backend/scripts/encrypt-test-specializations.ts
```

### Production Environment

```typescript
// backend/security/keyVault.ts
async function getMasterKey(): Promise<Buffer> {
  // Option 1: HashiCorp Vault
  const vaultClient = new VaultClient(process.env.VAULT_ADDR);
  const secret = await vaultClient.read('secret/data/prompt-encryption-key');
  return Buffer.from(secret.data.data.key, 'hex');

  // Option 2: AWS KMS
  const kmsClient = new AWS.KMS();
  const result = await kmsClient.decrypt({
    CiphertextBlob: Buffer.from(process.env.ENCRYPTED_KEY),
  }).promise();
  return result.Plaintext as Buffer;
}
```

## Test Files (10 Spezialisierungen)

| Datei                        | Branche      | System Prompt Länge | Kategorie         |
| ---------------------------- | ------------ | ------------------- | ----------------- |
| beauty-kosmetik-test.json    | Kosmetik     | ~1500 chars         | Beauty & Wellness |
| digitale-kurse-test.json     | E-Learning   | ~1800 chars         | Bildung           |
| fashion-mode-test.json       | Mode         | ~1600 chars         | Lifestyle         |
| fitness-ernaehrung-test.json | Fitness      | ~1700 chars         | Gesundheit        |
| home-living-test.json        | Wohnen       | ~1400 chars         | Lifestyle         |
| immobilien-test.json         | Real Estate  | ~2000 chars         | Immobilien        |
| reisebuero-test.json         | Travel       | ~1550 chars         | Reisen            |
| technik-elektronik-test.json | Tech         | ~1650 chars         | Elektronik        |
| tierbedarf-test.json         | Pet Supplies | ~1400 chars         | Tiere             |
| wein-feinkost-test.json      | Gourmet      | ~1600 chars         | Gourmet           |

## Verwendung

### 1. Verschlüsselung (einmalig oder per CI/CD)

```bash
# Alle Test-Specializations verschlüsseln
npm run encrypt:test-specializations

# Oder direkt
ts-node backend/scripts/encrypt-test-specializations.ts
```

### 2. In Tests Laden

```typescript
// backend/tests/specialization-encryption.test.ts
import fs from 'fs';
import { PromptEncryption } from '../security/promptEncryption';

describe('Test Specialization Encryption', () => {
  const encryption = new PromptEncryption();
  const encFilePath = './backend/data/test-specializations/beauty-kosmetik-test.json.enc';

  it('should decrypt encrypted specialization', () => {
    // 1. Read encrypted backup
    const encryptedBackup = JSON.parse(fs.readFileSync(encFilePath, 'utf-8'));

    // 2. Get key
    const masterKey = Buffer.from(process.env.TEST_ENCRYPTION_KEY, 'hex');

    // 3. Decrypt
    const decrypted = encryption.decrypt(encryptedBackup, masterKey);
    const original = JSON.parse(decrypted);

    expect(original.data.id).toBe('beauty-kosmetik');
    expect(original.data.name).toContain('Beauty & Kosmetik');
  });
});
```

### 3. Loading in Application

```typescript
// backend/services/specialization.service.ts
async function loadTestSpecialization(id: string): Promise<Specialization> {
  // 1. Prüfe ob .enc file existiert
  const encPath = `./data/test-specializations/${id}-test.json.enc`;
  
  if (fs.existsSync(encPath)) {
    // 2. Load encrypted version
    const encBackup = JSON.parse(fs.readFileSync(encPath, 'utf-8'));
    const masterKey = await getMasterKey();
    const decrypted = encryption.decrypt(encBackup, masterKey);
    return JSON.parse(decrypted);
  } else {
    // Fallback: Load plaintext (development)
    const jsonPath = `./data/test-specializations/${id}-test.json`;
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  }
}
```

## Security Best Practices

✅ **DO:**
- [ ] Encrypt bei jedem Test-Run (CI/CD Pipeline)
- [ ] Keys in Vault oder KMS speichern
- [ ] Separate Keys pro Environment (dev/staging/prod)
- [ ] Key Rotation alle 90 Tage
- [ ] Audit Logging für Key Access
- [ ] Backup Keys getrennt von Daten speichern

❌ **DON'T:**
- [ ] Keys in `.env` oder Code speichern
- [ ] Keys in Git committen
- [ ] Plaintext Prompts in Production
- [ ] Keys in Logs oder Error Messages
- [ ] Same Key für mehrere Environments

## Recovery & Notfall

### Key Lost Recovery

```typescript
// Wenn Master Key verloren geht:
// 1. Alte .enc Files behalten (unbrauchbar ohne Key)
// 2. Neue Key generieren
// 3. Neue .enc Files mit neuem Key erstellen
// 4. Alte .enc Files mit 30-Tage Aufbewahrung löschen

// Backup Strategy:
// - Key #1 in Vault (aktiv)
// - Key #2 in Vault (Backup, 30 Tage)
// - Encrypted Key Backup in Cold Storage
```

### Disaster Recovery Test

```bash
# Monatlich durchführen:
# 1. Random .enc file wählen
# 2. Decryption mit Backup Key testen
# 3. Hash verifikation durchführen
# 4. Dokumentieren

npm run test:specialization-recovery
```

## Monitoring & Audit

```typescript
// backend/monitoring/encryptionAudit.ts
logger.info('Test specialization loaded', {
  fileName: 'beauty-kosmetik-test.json',
  loadMethod: 'encrypted', // 'encrypted' | 'plaintext'
  timestamp: new Date(),
  environment: process.env.NODE_ENV,
  keyVersion: 'v1.0',
});
```

## Siehe auch

- [SPECIALIZATION_UPLOAD_ANALYSIS.md](../SPECIALIZATION_UPLOAD_ANALYSIS.md) - Upload Feature mit Encryption
- [promptEncryption.ts](./promptEncryption.ts) - Encryption Utility Klasse
- [keyVault.ts](./keyVault.ts) - Key Management

---

**Version:** 1.0
**Letzte Aktualisierung:** 2025-12-18
**Status:** Production Ready 🔒
