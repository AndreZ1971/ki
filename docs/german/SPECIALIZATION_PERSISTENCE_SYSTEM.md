# 🔐 Specialization Persistence & Auto-Load System

**Version:** 2.1  
**Datum:** December 31, 2025  
**Status:** ✅ Produktiv (ARI/.enc, Auto-Load aktiviert)  
**Autor:** System Architecture Team

---

## 📋 Übersicht

Das Specialization Persistence & Auto-Load System ist eine vollständige Lösung für die sichere, persistente Speicherung und automatische Verwaltung von KI-Spezialisierungen. Es kombiniert Filesystem-basierte Persistierung mit In-Memory-Caching, Verschlüsselung und umfassenden Fehlertoleranz-Mechanismen.

### Kernfunktionen

- ✅ **Filesystem-Persistierung** mit strukturierter Organisation
- ✅ **AES-256-GCM Verschlüsselung** für sensible Daten
- ✅ **SHA-256 Integritätschecks** für alle gespeicherten Dateien
- ✅ **In-Memory Cache** für schnellen Zugriff
- ✅ **Auto-Load beim Server-Start** mit Fallback-Mechanismen
- ✅ **CRUD-Operationen** für vollständige Verwaltung
- ✅ **Fehlertoleranz** mit graceful degradation
- ✅ **Umfassende Test-Suite** (148 Tests passed)

---

## 🏗️ Architektur

### Komponenten-Übersicht

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

## 📁 Dateisystem-Struktur

### Verzeichnis-Layout

```
data/specializations/
│
├── index.json              # Globales Inventar aller Spezialisierungen
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
├── active.json             # Aktive Spezialisierungen pro User
│   {
│     "user-123": "beauty-001",
│     "user-456": "tech-002"
│   }
│
├── fallback.json          # Fallback-Spezialisierungen
│   {
│     "user-123": "default-001"
│   }
│
└── {userId}/              # User-spezifisches Verzeichnis
    │
    ├── {specId}.json      # Spezialisierungs-Daten
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
    └── {specId}.meta.json # Metadata & Checksums
        {
          "checksum": "sha256-hash",
          "size": 4096,
          "createdAt": 1702920000000,
          "lastValidated": 1702920000000
        }
```

---

## 🔐 Sicherheit & Verschlüsselung

### AES-256-GCM Verschlüsselung

**Verwendung:** Test-Spezialisierungen und Backups

```typescript
// Encryption Format
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
- 256-bit Schlüssel für maximale Sicherheit
- Unique IV pro Verschlüsselung (verhindert Pattern-Erkennung)
- Authentication Tag für Tamper-Detection
- Original-Hash-Preservation für Integrity-Checks

### SHA-256 Integritätschecks

Jede gespeicherte Spezialisierung erhält einen SHA-256 Hash:

```typescript
const checksum = crypto
  .createHash('sha256')
  .update(JSON.stringify(specialization))
  .digest('hex');
```

**Verwendung:**
- Corruption-Detection beim Laden
- Vergleich vor/nach Updates
- Audit-Trail für Änderungen

---

## 🚀 API & Verwendung

### Persistence Manager API

#### Initialisierung

```typescript
import { SpecializationPersistenceManager } from './services/specializationPersistenceManager';

// Beim Server-Start
await SpecializationPersistenceManager.initialize();
```

#### Spezialisierung persistieren

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

#### Spezialisierung laden

```typescript
const spec = await SpecializationPersistenceManager.loadSpecialization(
  specId,   // string
  userId    // string
);

// Returns: SpecializationContext | null
```

#### Aktive Spezialisierung setzen

```typescript
const success = await SpecializationPersistenceManager.setActiveSpecialization(
  specId,   // string
  userId    // string
);

// Returns: boolean
```

#### Aktive Spezialisierung abrufen

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

#### Alle Spezialisierungen auflisten

```typescript
const list = await SpecializationPersistenceManager.listSpecializations(
  userId    // string
);

// Returns: Array<{id, name, createdAt, updatedAt}>
```

#### Integrität validieren

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

#### Spezialisierung löschen

```typescript
const success = await SpecializationPersistenceManager.deleteSpecialization(
  specId,   // string
  userId    // string
);

// Returns: boolean
```

---

### Auto-Load API

#### Initialisierung & Cache laden

```typescript
import { 
  initializeSpecializationAutoLoad,
  getActiveSpecialization,
  getLoadingState 
} from './services/specializationAutoLoad';

// Auto-Load starten
const spec = await initializeSpecializationAutoLoad(userId);

// Returns: SpecializationContext | null
```

#### Aktive Spezialisierung aus Cache

```typescript
const cached = getActiveSpecialization();

// Returns: SpecializationContext | null (synchron!)
```

#### Loading-State prüfen

```typescript
const state = getLoadingState();

// Returns: 'not-started' | 'loading' | 'loaded' | 'failed'
```

#### Spezialisierung aktivieren

```typescript
const success = await activateSpecialization(specId, userId);

// Returns: boolean
// Side-effect: Updated cache & disk
```

#### Cache neu laden

```typescript
const spec = await reloadSpecialization(userId);

// Returns: SpecializationContext | null
// Side-effect: Cache invalidated & reloaded
```

#### Alle validieren

```typescript
const validation = await validateAllSpecializations(userId);

// Returns:
{
  valid: 15,
  corrupted: 0,
  missing: 1
}
```

#### Verfügbare auflisten

```typescript
const list = await listAvailableSpecializations(userId);

// Returns: Array<{id, name, createdAt, updatedAt}>
```

---

## 🔄 State-Management

### Loading States

```
┌─────────────┐
│ not-started │ ← Initial State
└──────┬──────┘
       │ initializeSpecializationAutoLoad()
       ↓
┌─────────────┐
│   loading   │ ← Lädt von Disk
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

Der Cache wird invalidiert bei:
- `reloadSpecialization()` - Explizites Reload
- `activateSpecialization()` - Neue Aktivierung
- Server-Restart - Komplett neu geladen

---

## 🧪 Testing

### Test-Suite Übersicht

**Gesamt:** 148 passed, 28 skipped, 0 failed

#### 1. Persistence Tests (20 Tests)

**Datei:** `tests/integration/specialization-persistence.test.ts`

**Coverage:**
- ✅ Initialisierung & Setup
- ✅ Persist & Load-Operationen
- ✅ Active/Fallback-Mechanismen
- ✅ Listing & Inventar
- ✅ Integrity-Validierung
- ✅ Delete-Operationen
- ✅ Corruption-Recovery
- ✅ Error-Handling

#### 2. Auto-Load Tests (in Persistence-Suite)

**Coverage:**
- ✅ Cache-Funktionalität
- ✅ State-Transitions
- ✅ Activation & Reload
- ✅ Validation
- ✅ Missing-Data-Handling

#### 3. Backup Manager Tests (20 Tests)

**Datei:** `backend/tests/unit/testSpecializationBackup.test.ts`

**Coverage:**
- ✅ Load & List Operationen
- ✅ Encryption & Decryption
- ✅ Hash-Generierung & Consistency
- ✅ Integrity-Checks
- ✅ Error-Recovery
- ✅ Performance (< 100ms per operation)

#### 4. Encryption Flow Tests (8 Tests)

**Datei:** `backend/tests/integration/testSpecializationEncryption.test.ts`

**Coverage:**
- ✅ Encrypt → Save → Load → Decrypt
- ✅ Unicode & Special Characters
- ✅ Large Prompts (5KB+)
- ✅ Edge Cases (empty values)
- ✅ Performance & Statistics

### Test-Execution

```bash
# Alle Tests
npm run test

# Nur Persistence
npm run test -- -t "Persistence"

# Nur Auto-Load
npm run test -- -t "Auto-Load"

# Nur Encryption
npm run test -- -t "Encryption"
```

---

## 📊 Performance

### Benchmarks

**Setup:** 15 Spezialisierungen, Windows 11, Node.js 24

| Operation                     | Durchschnitt | Maximum |
| ----------------------------- | ------------ | ------- |
| Load Single                   | 2-5ms        | 15ms    |
| Persist                       | 7-10ms       | 25ms    |
| List All                      | 1-3ms        | 10ms    |
| Validate Integrity (15 specs) | 25-30ms      | 60ms    |
| Auto-Load Initialize          | 3-6ms        | 20ms    |
| Cache Hit                     | < 1ms        | < 1ms   |
| Encryption                    | 2-4ms        | 10ms    |
| Decryption                    | 2-4ms        | 10ms    |

### Optimierungen

- **In-Memory Cache:** Vermeidet wiederholte Disk-Reads
- **Lazy Loading:** Metadata wird nur bei Bedarf geladen
- **Batch Operations:** Validierung nutzt Promise.all
- **Async File-I/O:** Blockiert nicht den Event-Loop

---

## 🔧 Troubleshooting

### Problem: Spezialisierung nicht gefunden

**Symptom:**
```
⚠️ Spezialisierung nicht gefunden: spec-001
```

**Lösung:**
1. Prüfe ob Datei existiert: `data/specializations/{userId}/{specId}.json`
2. Validiere index.json: `validateIntegrity(userId)`
3. Prüfe Logs auf Corruption-Warnings

### Problem: Corrupted File

**Symptom:**
```
⚠️ Fehler beim Laden von spec-001: Unexpected token
```

**Lösung:**
1. Prüfe `.meta.json` Checksum
2. Restore aus Fallback: `getActiveSpecialization()` nutzt automatisch Fallback
3. Neuanlage falls nötig: `persistSpecialization()`

### Problem: Cache out-of-sync

**Symptom:**
Cache zeigt alte Daten nach Update

**Lösung:**
```typescript
await reloadSpecialization(userId);
```

### Problem: Auto-Load failed State

**Symptom:**
```
getLoadingState() === 'failed'
```

**Lösung:**
1. Prüfe Logs für Root-Cause
2. Retry mit: `await initializeSpecializationAutoLoad(userId)`
3. Fallback prüfen: `getActiveSpecialization()` gibt immer etwas zurück

---

## 🎯 Best Practices

### 1. Immer initialize() aufrufen

```typescript
// ✅ Gut
await SpecializationPersistenceManager.initialize();
const spec = await persistSpecialization(...);

// ❌ Schlecht
const spec = await persistSpecialization(...); // Kann fehlschlagen!
```

### 2. Errors gracefully behandeln

```typescript
// ✅ Gut
const spec = await loadSpecialization(id, userId);
if (!spec) {
  logger.warn('Spec nicht gefunden, nutze Fallback');
  const fallback = await getActiveSpecialization(userId);
  return fallback.specialization;
}

// ❌ Schlecht
const spec = await loadSpecialization(id, userId);
spec.systemPrompt; // Kann crashen!
```

### 3. Cache nutzen für häufige Zugriffe

```typescript
// ✅ Gut - Cache hit
const spec = getActiveSpecialization(); // Synchron, schnell

// ⚠️ OK - Aber langsamer
const result = await getActiveSpecialization(userId); // Disk-Read
```

### 4. Regelmäßig validieren

```typescript
// Täglich oder bei kritischen Operationen
const validation = await validateIntegrity(userId);
if (validation.corrupted > 0) {
  await alertAdmin('Corrupted specs detected!');
}
```

### 5. Fallbacks definieren

```typescript
// Beim Setup
await persistSpecialization(defaultSpec, userId);
// Wird automatisch als Fallback verwendet wenn active fehlt
```

---

## 📚 Verwandte Dokumentation

- [SPECIALIZATION_UPLOAD_ANALYSIS.md](./SPECIALIZATION_UPLOAD_ANALYSIS.md) - Upload & Security
- [TEST_SPECIALIZATIONS_ANALYSIS.md](./TEST_SPECIALIZATIONS_ANALYSIS.md) - Test-Daten
- [SECURITY_AI_FEATURES.md](./SECURITY_AI_FEATURES.md) - Security-Overview
- [architecture.md](./architecture.md) - System-Architektur

---

## 📞 Support

Bei Fragen oder Problemen:

1. Prüfe Logs: `backend/logs/`
2. Validiere System: `validateIntegrity()`
3. Konsultiere diese Dokumentation
4. Kontaktiere Development Team

---

**Letzte Aktualisierung:** December 18, 2025  
**Version:** 2.0  
**Status:** ✅ Produktiv & Getestet
