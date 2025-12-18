# Quick Start: Test Specialization Encryption

## 🚀 5-Minuten Setup

### 1. Generiere Encryption Key (optional, dev-only)

```bash
# Nutzt deterministischen Test-Key (DEV ONLY!)
npm run encrypt:test-specializations

# Oder mit Custom Key (Production)
PROMPT_ENCRYPTION_KEY=abc123def456... npm run encrypt:test-specializations
```

### 2. Verschlüssele alle Test-Spezialisierungen

```bash
cd backend
npm run encrypt:test-specializations
```

**Erwartete Ausgabe:**
```
🔐 Encrypting Test Specializations...

📂 Found 10 test files:

✅ beauty-kosmetik-test.json
   → Original: 4200 bytes
   → Encrypted: 4500 bytes (107.1%)
   → Hash: a3f4b2c1d5e6f7g8h9i0...

[... weitere 9 Dateien ...]

📊 Results: 10 encrypted, 0 failed

✨ All test specializations encrypted successfully!

💾 Encrypted backups location:
   ./data/test-specializations/*.json.enc
```

### 3. Verifiziere Backups

```bash
npm run verify:test-specializations
```

**Erwartete Ausgabe:**
```
🔍 Verifying Test Specialization Encrypted Backups...

✅ beauty-kosmetik
✅ digitale-kurse
...
✅ wein-feinkost

═══════════════════════════════════════════════════

📋 Summary:
  Total Specs: 10
  Verified: 10
  Failed: 0

✨ All encrypted backups verified successfully!
```

### 4. Teste die Unit Tests

```bash
npm run test:unit testSpecializationBackup.test.ts
```

### 5. Teste Integration

```bash
npm run test:integration testSpecializationEncryption.test.ts
```

---

## 📂 Was wurde erstellt?

### Backend Scripts
- **`backend/scripts/encrypt-test-specializations.ts`** - Verschlüsselt alle .json Dateien → .enc
- **`backend/scripts/verify-test-specializations.ts`** - Verifiziert alle encrypted Backups

### Security Utilities
- **`backend/security/testSpecializationBackupManager.ts`** - Manager-Klasse für Load/Save/Encrypt/Decrypt
- **`backend/security/testSpecializationBackup.md`** - Detaillierte Dokumentation

### Tests
- **`backend/tests/unit/testSpecializationBackup.test.ts`** - 30+ Unit Tests
- **`backend/tests/integration/testSpecializationEncryption.test.ts`** - Full Flow Tests

### Dokumentation
- **`docs/TEST_SPECIALIZATIONS_ANALYSIS.md`** - Analyse aller 10 Test-Specs mit Struktur
- **`QUICK_START_TEST_SPECIALIZATION_ENCRYPTION.md`** - Dieses Dokument

### Package.json Updates
```json
{
  "scripts": {
    "encrypt:test-specializations": "tsx scripts/encrypt-test-specializations.ts",
    "verify:test-specializations": "tsx scripts/verify-test-specializations.ts"
  }
}
```

---

## 🔐 Encryption Standard

| Aspekt        | Wert                |
| ------------- | ------------------- |
| **Algorithm** | AES-256-GCM         |
| **Key Size**  | 256 bits (32 bytes) |
| **IV Length** | 12 bytes (96 bits)  |
| **Auth Tag**  | 16 bytes (128 bits) |
| **Integrity** | SHA-256 Hash        |

---

## 📊 Dateistruktur nach Encryption

```
backend/data/test-specializations/
├── beauty-kosmetik-test.json              (Plaintext - DEV)
├── beauty-kosmetik-test.json.enc          (Encrypted - BACKUP)
├── digitale-kurse-test.json               (Plaintext - DEV)
├── digitale-kurse-test.json.enc           (Encrypted - BACKUP)
├── ... (weitere 8 Specs)
└── wein-feinkost-test.json.enc            (Encrypted - BACKUP)
```

**Encrypted File Format:**
```json
{
  "version": "1.0",
  "algorithm": "aes-256-gcm",
  "timestamp": "2025-12-18T10:30:00.000Z",
  "iv": "abc123def456...",              // hex, 24 chars
  "authTag": "fedcba987654...",         // hex, 32 chars
  "ciphertext": "xyz789abc123...",      // hex, encrypted JSON
  "integrity": {
    "originalHash": "sha256hash...",    // hex, 64 chars
    "originalSize": 4200,               // bytes
    "originalFile": "beauty-kosmetik-test.json"
  }
}
```

---

## 💻 Code Beispiele

### Load Specialization (Auto-Fallback)

```typescript
import { getTestSpecializationBackupManager } from './security/testSpecializationBackupManager';

const manager = getTestSpecializationBackupManager('./backend/data/test-specializations');

// Lädt automatisch .enc falls existent, sonst plaintext
const result = await manager.load('beauty-kosmetik');

console.log(result.data.data.name);  // "Beauty & Kosmetik - Der Haut-Experte"
console.log(result.source);          // "encrypted" oder "plaintext"
console.log(result.hash);            // SHA-256 hash
```

### Encrypt & Save

```typescript
const manager = getTestSpecializationBackupManager('./backend/data/test-specializations');

// Set encryption key
manager.setMasterKey(Buffer.from('...', 'hex'));

const specialization = { /* ... */ };
const result = await manager.saveEncrypted('my-spec', specialization);

console.log(result.filePath);  // "/path/to/my-spec.json.enc"
console.log(result.size);      // 4500 bytes
console.log(result.hash);      // SHA-256 for integrity
```

### List & Verify All

```typescript
const manager = getTestSpecializationBackupManager('./backend/data/test-specializations');

// List all specializations
const all = manager.listAll();
console.log(all);
// [
//   { id: 'beauty-kosmetik', plaintext: true, encrypted: true, size: 4200 },
//   { id: 'fashion-mode', plaintext: true, encrypted: true, size: 4300 },
//   ...
// ]

// Verify all encrypted backups
const verification = await manager.verifyAll();
console.log(verification.verified);  // 10
console.log(verification.failed);    // 0
```

---

## 🔑 Key Management

### Development (Local Testing)

```bash
# Option 1: Deterministic Test Key (automatically derived)
npm run encrypt:test-specializations

# Option 2: Custom Environment Variable
PROMPT_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef \
npm run encrypt:test-specializations

# Option 3: In Code
const testKey = Buffer.from('0123456789abcdef...', 'hex');
manager.setMasterKey(testKey);
```

### Production (HashiCorp Vault / AWS KMS)

```typescript
// In production, load from secure vault:
async function getMasterKey(): Promise<Buffer> {
  // Option 1: HashiCorp Vault
  const vaultClient = new VaultClient(process.env.VAULT_ADDR);
  const secret = await vaultClient.read('secret/data/prompt-encryption-key');
  return Buffer.from(secret.data.data.key, 'hex');

  // Option 2: AWS KMS
  const kms = new AWS.KMS();
  const result = await kms.decrypt({
    CiphertextBlob: Buffer.from(process.env.ENCRYPTED_KEY),
  }).promise();
  return result.Plaintext as Buffer;
}
```

---

## ✅ Checklist: Nach der Verschlüsselung

- [ ] `npm run encrypt:test-specializations` erfolgreich
- [ ] `npm run verify:test-specializations` zeigt 10/10 verified
- [ ] `.enc` Dateien existieren in `backend/data/test-specializations/`
- [ ] Unit Tests passen: `npm run test:unit testSpecializationBackup.test.ts`
- [ ] Integration Tests passen: `npm run test:integration testSpecializationEncryption.test.ts`
- [ ] Manager können beide Formate laden (plaintext + encrypted)
- [ ] Backup-Dateien sind nicht lesbar (encrypted)
- [ ] Hash-Integrität wird verifiziert

---

## 🐛 Troubleshooting

### "Cannot find module 'crypto'"
```bash
# Stelle sicher, dass Node.js >= 14.0 installiert ist
node --version
```

### "PROMPT_ENCRYPTION_KEY not set"
```bash
# Das ist OK - es wird ein deterministischer Test-Key verwendet
# Oder setze einen Custom Key:
export PROMPT_ENCRYPTION_KEY=abc123...
npm run encrypt:test-specializations
```

### "Verification failed: Hash mismatch"
```bash
# Die .enc Datei ist corrupted oder wurde mit anderem Key encrypted
# Lösung: Neu verschlüsseln
npm run encrypt:test-specializations
npm run verify:test-specializations
```

### "File not found: test-specializations/"
```bash
# Stelle sicher, dass du im backend/ Directory bist
cd backend
npm run encrypt:test-specializations
```

---

## 📚 Weitere Ressourcen

- [TEST_SPECIALIZATIONS_ANALYSIS.md](../docs/TEST_SPECIALIZATIONS_ANALYSIS.md) - Detaillierte Analyse aller 10 Specs
- [SPECIALIZATION_UPLOAD_ANALYSIS.md](../docs/SPECIALIZATION_UPLOAD_ANALYSIS.md) - Upload Feature mit Encryption
- [testSpecializationBackup.md](./backend/security/testSpecializationBackup.md) - Technische Dokumentation
- [testSpecializationBackupManager.ts](./backend/security/testSpecializationBackupManager.ts) - Source Code

---

## 🎯 Nächste Schritte

### Phase 1: Test Data Encryption ✅ DONE
- Alle 10 Test-Spezialisierungen verschlüsselt
- Backup-Dateien mit SHA-256 Integrität
- Unit + Integration Tests

### Phase 2: Production Upload Feature (TODO)
1. Frontend File Parsing & Encryption
2. Backend API Endpoint (`POST /api/settings/specialization/upload`)
3. Database mit TDE
4. Audit Logging (anonymisiert)

### Phase 3: CI/CD Integration (TODO)
- Auto-Encryption im GitHub Actions Workflow
- Pre-deployment Verification

---

**Version:** 1.0
**Status:** ✅ Abgeschlossen
**Letzte Änderung:** 2025-12-18
