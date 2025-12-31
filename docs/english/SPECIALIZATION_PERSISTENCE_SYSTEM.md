# 🔐 Specialization Persistence & Auto-Load System

**Version:** 2.1  
**Date:** December 31, 2025  
**Status:** ✅ Production (ARI/.enc, Auto-load activated)  
**Author:** System Architecture Team

---

## 📋 Overview

The Specialization Persistence & Auto-Load System is a comprehensive solution for secure, persistent storage and automatic management of AI specializations. Es kombiniert Filesystem-based persistence mit In-Memory-Caching, Verschlüsselung und umfassenden Fault tolerance-Mechanismen.

### Kernfunktionen

- ✅ **Filesystem-Persistierung** with structured organization
- ✅ **AES-256-GCM Encryption** for sensitive data
- ✅ **SHA-256 Integrity Checks** for all stored files
- ✅ **In-memory cache** for fast access
- ✅ **Auto-load on server startup** with fallback mechanisms
- ✅ **CRUD operations** for complete management
- ✅ **Fault tolerance** with graceful degradation
- ✅ **Comprehensive test suite** (148 tests passed)

---

## 🏗️ Architecture

### Komponenten-Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Server Startup                        │
│  await SpecializationPersistenceManager.initialize()    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│           SpecializationPersistenceManager              │
│  - initialize()                                          │
│  - persistSpecialization()                               │
│  - loadSpecialization()                                  │
│  - setActiveSpecialization()                             │
│  - getActiveSpecialization()                             │
│  - listSpecializations()                                 │
│  - validateIntegrity()                                   │
│  - deleteSpecialization()                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│          SpecializationAutoLoad (Cache Layer)           │
│  - initializeSpecializationAutoLoad()                   │
│  - activateSpecialization()                              │
│  - getActiveSpecialization()                             │
│  - getLoadingState()                                     │
│  - reloadSpecialization()                                │
│  - validateAllSpecializations()                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│              Filesystem Storage                          │
│  data/specializations/                                   │
│  ├── index.json                                          │
│  ├── active.json                                         │
│  ├── fallback.json                                       │
│  └── {userId}/                                           │
│      ├── metadata.json                                   │
│      ├── {specId}.enc                                    │
│      └── {specId}.meta.json (optional/historisch)        │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Filesystem Structure

### Directory Layout

```
data/specializations/
│
├── index.json              # Global inventory of all specializations
│   {
│     "specs": [
│       {
│         "id": "beauty-001",
│         "userId": "user-123",
│         "name": "Beauty Expert",
│         "createdAt": 1702920000000,
│         "updatedAt": 1702920000000
│       }
│     ]
│   }
│
├── active.json             # Active specializations per user
│   {
│     "user-123": "beauty-001",
│     "user-456": "tech-002"
│   }
│
├── fallback.json          # Fallback specializations
│   {
│     "user-123": "default-001"
│   }
│
└── {userId}/              # User-specific directory
    │
    ├── {specId}.json      # Specialization data
    │   {
    │     "id": "beauty-001",
    │     "name": "Beauty Expert",
    │     "description": "...",
    │     "systemPrompt": "...",
    │     "contextInstructions": [...],
    │     "metadata": {
    │       "category": "beauty",
    │       "version": "1.0.0",
    │       "author": "user-123"
    │     }
    │   }
    │
    └── {specId}.meta.json # Metadata & checksums
        {
          "checksum": "sha256-hash",
          "size": 4096,
          "createdAt": 1702920000000,
          "lastValidated": 1702920000000
        }
```

---

## 🔐 Security & Encryption

### AES-256-GCM Encryption

**Usage:** Test specializations and backups

```typescript
// Encryption format
{
  "version": "1.0",
  "algorithm": "aes-256-gcm",
  "iv": "hex-encoded-initialization-vector",
  "authTag": "hex-encoded-authentication-tag",
  "ciphertext": "hex-encoded-encrypted-data",
  "integrity": {
    "originalHash": "sha256-hash-of-plaintext",
    "originalSize": 1234,
    "originalFile": "spec-name.json",
    "encryptedAt": 1702920000000
  }
}
```

**Features:**
- 256-bit key for maximum security
- Unique IV per encryption (prevents pattern recognition)
- Authentication tag for tamper detection
- Original hash preservation for integrity checks

### SHA-256 Integrity Checks

Each stored specialization receives a SHA-256 hash:

```typescript
const checksum = crypto
  .createHash('sha256')
  .update(JSON.stringify(specialization))
  .digest('hex');
```

**Usage:**
- Corruption detection on load
- Comparison before/after updates
- Audit trail for changes

---

## 🚀 API & Usage

### Persistence Manager API

#### Initialization

```typescript
import { SpecializationPersistenceManager } from './services/specializationPersistenceManager';

// On server startup
await SpecializationPersistenceManager.initialize();
```

#### Persist specialization

```typescript
const result = await SpecializationPersistenceManager.persistSpecialization(
  specialization,  // SpecializationContext
  userId           // string
);

// Returns:
{
  success: true,
  id: "spec-001",
  fallbackReady: true
}
```

#### Load specialization

```typescript
const spec = await SpecializationPersistenceManager.loadSpecialization(
  specId,   // string
  userId    // string
);

// Returns: SpecializationContext | null
```

#### Set active specialization

```typescript
const success = await SpecializationPersistenceManager.setActiveSpecialization(
  specId,   // string
  userId    // string
);

// Returns: boolean
```

#### Get active specialization

```typescript
const result = await SpecializationPersistenceManager.getActiveSpecialization(
  userId    // string
);

// Returns:
{
  specialization: SpecializationContext | null,
  source: 'active' | 'fallback' | 'default'
}
```

#### List all specializations

```typescript
const list = await SpecializationPersistenceManager.listSpecializations(
  userId    // string
);

// Returns: Array<{id, name, createdAt, updatedAt}>
```

#### Validate integrity

```typescript
const validation = await SpecializationPersistenceManager.validateIntegrity(
  userId    // string
);

// Returns:
{
  valid: 15,
  corrupted: 0,
  missing: 1
}
```

#### Delete specialization

```typescript
const success = await SpecializationPersistenceManager.deleteSpecialization(
  specId,   // string
  userId    // string
);

// Returns: boolean
```

---

### Auto-Load API

#### Initialization & Cache laden

```typescript
import { 
  initializeSpecializationAutoLoad,
  getActiveSpecialization,
  getLoadingState 
} from './services/specializationAutoLoad';

// Start auto-load
const spec = await initializeSpecializationAutoLoad(userId);

// Returns: SpecializationContext | null
```

#### Get active specialization from cache

```typescript
const cached = getActiveSpecialization();

// Returns: SpecializationContext | null (synchronous!)
```

#### Check loading state

```typescript
const state = getLoadingState();

// Returns: 'not-started' | 'loading' | 'loaded' | 'failed'
```

#### Activate specialization

```typescript
const success = await activateSpecialization(specId, userId);

// Returns: boolean
// Side-effect: Updates cache & disk
```

#### Reload cache

```typescript
const spec = await reloadSpecialization(userId);

// Returns: SpecializationContext | null
// Side-effect: Cache invalidated & reloaded
```

#### Validate all

```typescript
const validation = await validateAllSpecializations(userId);

// Returns:
{
  valid: 15,
  corrupted: 0,
  missing: 1
}
```

#### List available

```typescript
const list = await listAvailableSpecializations(userId);

// Returns: Array<{id, name, createdAt, updatedAt}>
```

---

## 🔄 State Management

### Loading States

```
┌─────────────┐
│ not-started │ ← Initial state
└──────┬──────┘
       │ initializeSpecializationAutoLoad()
       ↓
┌─────────────┐
│   loading   │ ← Loading from disk
└──────┬──────┘
       │
       ├─ Success → ┌────────┐
       │             │ loaded │
       │             └────────┘
       │
       └─ Error ──→ ┌────────┐
                     │ failed │
                     └────────┘
```

### Cache Invalidation

The cache is invalidated by:
- `reloadSpecialization()` - Explicit reload
- `activateSpecialization()` - New activation
- Server-Restart - Completely reloaded

---

## 🧪 Testing

### Test-Suite Overview

**Total:** 148 passed, 28 skipped, 0 failed

#### 1. Persistence Tests (20 Tests)

**File:** `tests/integration/specialization-persistence.test.ts`

**Coverage:**
- ✅ Initialization & Setup
- ✅ Persist & load operations
- ✅ Active/fallback mechanisms
- ✅ Listing & inventory
- ✅ Integrity validation
- ✅ Delete operations
- ✅ Corruption recovery
- ✅ Error handling

#### 2. Auto-Load Tests (in Persistence suite)

**Coverage:**
- ✅ Cache functionality
- ✅ State transitions
- ✅ Activation & reload
- ✅ Validation
- ✅ Missing data handling

#### 3. Backup Manager Tests (20 Tests)

**File:** `backend/tests/unit/testSpecializationBackup.test.ts`

**Coverage:**
- ✅ Load & list operations
- ✅ Encryption & decryption
- ✅ Hash generation & consistency
- ✅ Integrity checks
- ✅ Error recovery
- ✅ Performance (< 100ms per operation)

#### 4. Encryption Flow Tests (8 Tests)

**File:** `backend/tests/integration/testSpecializationEncryption.test.ts`

**Coverage:**
- ✅ Encrypt → save → load → decrypt
- ✅ Unicode & special characters
- ✅ Large prompts (5KB+)
- ✅ Edge cases (empty values)
- ✅ Performance & statistics

### Test Execution

```bash
# All tests
npm run test

# Persistence only
npm run test -- -t "Persistence"

# Auto-load only
npm run test -- -t "Auto-Load"

# Encryption only
npm run test -- -t "Encryption"
```

---

## 📊 Performance

### Benchmarks

**Setup:** 15 Specializations, Windows 11, Node.js 24

| Operation                     | Average | Maximum |
| ----------------------------- | ------------ | ------- |
| Load single                   | 2-5ms        | 15ms    |
| Persist                       | 7-10ms       | 25ms    |
| List all                      | 1-3ms        | 10ms    |
| Validate integrity (15 specs) | 25-30ms      | 60ms    |
| Auto-load initialize          | 3-6ms        | 20ms    |
| Cache hit                     | < 1ms        | < 1ms   |
| Encryption                    | 2-4ms        | 10ms    |
| Decryption                    | 2-4ms        | 10ms    |

### Optimizations

- **In-memory cache:** Avoids repeated disk reads
- **Lazy loading:** Metadata loaded only when needed
- **Batch operations:** Validation uses Promise.all
- **Async file I/O:** Does not block the event loop

---

## 🔧 Troubleshooting

### Problem: Specialization not found

**Symptom:**
```
⚠️ Specialization not found: spec-001
```

**Solution:**
1. Prüfe ob File existiert: `data/specializations/{userId}/{specId}.json`
2. Validate index.json: `validateIntegrity(userId)`
3. Check logs for corruption warnings

### Problem: Corrupted file

**Symptom:**
```
⚠️ Fehler beim Laden von spec-001: Unexpected token
```

**Solution:**
1. Check `.meta.json` checksum
2. Restore from fallback: `getActiveSpecialization()` automatically uses fallback
3. Recreate if necessary: `persistSpecialization()`

### Problem: Cache out-of-sync

**Symptom:**
Cache shows old data after update

**Solution:**
```typescript
await reloadSpecialization(userId);
```

### Problem: Auto-load failed state

**Symptom:**
```
getLoadingState() === 'failed'
```

**Solution:**
1. Check logs for root cause
2. Retry with: `await initializeSpecializationAutoLoad(userId)`
3. Check fallback: `getActiveSpecialization()` always returns something

---

## 🎯 Best Practices

### 1. Always call initialize()

```typescript
// ✅ Good
await SpecializationPersistenceManager.initialize();
const spec = await persistSpecialization(...);

// ❌ Bad
const spec = await persistSpecialization(...); // Can fail!
```

### 2. Handle errors gracefully

```typescript
// ✅ Good
const spec = await loadSpecialization(id, userId);
if (!spec) {
  logger.warn('Spec not found, using fallback');
  const fallback = await getActiveSpecialization(userId);
  return fallback.specialization;
}

// ❌ Bad
const spec = await loadSpecialization(id, userId);
spec.systemPrompt; // Can crash!
```

### 3. Use cache for frequent access

```typescript
// ✅ Good - Cache hit
const spec = getActiveSpecialization(); // Synchronous, fast

// ⚠️ OK - But slower
const result = await getActiveSpecialization(userId); // Disk read
```

### 4. Validate regularly

```typescript
// Daily or before critical operations
const validation = await validateIntegrity(userId);
if (validation.corrupted > 0) {
  await alertAdmin('Corrupted specs detected!');
}
```

### 5. Define fallbacks

```typescript
// During setup
await persistSpecialization(defaultSpec, userId);
// Automatically used as fallback if active fails
```

---

## 📚 Related Documentation

- [SPECIALIZATION_UPLOAD_ANALYSIS.md](./SPECIALIZATION_UPLOAD_ANALYSIS.md) - Upload & security
- [TEST_SPECIALIZATIONS_ANALYSIS.md](./TEST_SPECIALIZATIONS_ANALYSIS.md) - Test data
- [SECURITY_AI_FEATURES.md](./SECURITY_AI_FEATURES.md) - Security overview
- [architecture.md](./architecture.md) - System-Architecture

---

## 📞 Support

For questions or problems:

1. Check logs: `backend/logs/`
2. Validate system: `validateIntegrity()`
3. Consult this documentation
4. Contact development team

---

**Last Updated:** December 18, 2025  
**Version:** 2.0  
**Status:** ✅ Production & Getestet
