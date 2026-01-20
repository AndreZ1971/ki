# 🎯 A.R.I. Spezialisierungen - Dokumentation

**Version:** 7.0.3  
**Stand:** Januar 2026  
**Status:** ✅ Vollständig implementiert

---

## Übersicht

Spezialisierungen sind branchenspezifische KI-Konfigurationen, die A.R.I. für verschiedene Geschäftsbereiche anpassen. Sie werden auf **dein-shop.com** verkauft, signiert geliefert und lokal installiert.

**Features:**
- ✅ RSA-2048 Signatur-Validierung
- ✅ AES-256-GCM Verschlüsselung
- ✅ Lokale Persistierung mit Auto-Load
- ✅ Race-Condition Schutz (Mutex-Locking)
- ✅ SHA-256 Integritätschecks

---

## Architektur

### Zentral 
- WooCommerce-Shop mit digitalen Produkten
- Nach Kauf: RSA-signierte JSON-Datei generiert
- Download-Link per E-Mail

### Dezentral (Jede A.R.I. Installation)
- Upload in Settings → Spezialisierung
- Signatur validieren (Public Key hardcoded)
- AES-256 verschlüsseln und speichern
- AI-Integration: System-Prompt-Injection

---

## Datei-Struktur

```
backend/
  services/
    specializationPersistenceManager.ts  # Core CRUD-Operationen
    specializationAutoLoad.ts            # Cache & Auto-Load
  routes/
    app/api/specializations/
      index.ts                           # Upload, List, Activate, Delete
  types/
    specialization.ts                    # TypeScript-Interfaces

frontend/
  src/pages/Settings/Settings.tsx        # Upload-UI

data/specializations/
  ├── index.json                         # Inventar aller Specs
  ├── active.json                        # Aktive Spec pro User
  ├── fallback.json                      # Fallback bei Fehler
  └── {userId}/
      └── {specId}.json                  # Spezialisierungs-Daten
```

---

## API-Endpoints

### GET `/api/specializations/list`
Listet alle installierten Spezialisierungen.

**Response:**
```json
{
  "success": true,
  "specializations": [
    {
      "id": "reisebuero",
      "name": "Reisebüro Spezialisierung",
      "description": "Optimiert für Tourismusbranche",
      "category": "Services",
      "version": "1.0.0",
      "features": ["Reisebeschreibungen", "Hotel Marketing"],
      "installedAt": 1733961600000,
      "isActive": true
    }
  ]
}
```

### POST `/api/specializations/upload`
Lädt signierte Spezialisierungs-Datei hoch.

**Request:**
```json
{
  "signedData": {
    "version": "1.0",
    "issuer": "dein-shop.com",
    "timestamp": 1733961600000,
    "signature": "BASE64_RSA_SIGNATURE",
    "data": {
      "id": "reisebuero",
      "name": "Reisebüro Spezialisierung",
      "systemPrompt": "Du bist ein Reise-Experte...",
      "contextInstructions": ["...", "..."]
    }
  }
}
```

### POST `/api/specializations/activate`
Aktiviert eine Spezialisierung (nur eine aktiv).

**Request:**
```json
{
  "specId": "reisebuero"
}
```

### GET `/api/specializations/active`
Gibt aktive Spezialisierung zurück.

**Response:**
```json
{
  "success": true,
  "specialization": {
    "id": "reisebuero",
    "name": "Reisebüro Spezialisierung",
    "systemPrompt": "Du bist ein Reise-Experte...",
    "contextInstructions": ["..."]
  }
}
```

### DELETE `/api/specializations/:specId`
Löscht eine Spezialisierung.

---

## Sicherheit

### Signatur-System (RSA-2048)

**Generierung (Marketplace):**
```typescript
const signature = crypto.sign('sha256', Buffer.from(payload), {
  key: PRIVATE_KEY,
  padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
});
```

**Validierung (in A.R.I.):**
```typescript
const KAUFE_ES_PUBLIC_KEY = process.env.SPEC_PUBLIC_KEY;
// Validiert RSA-Signatur vor Installation
```

### Verschlüsselung (AES-256-GCM)

**Format:**
```json
{
  "version": "1.0",
  "algorithm": "aes-256-gcm",
  "iv": "hex-encoded-iv",
  "authTag": "hex-encoded-authentication-tag",
  "ciphertext": "hex-encrypted-data",
  "integrity": {
    "originalHash": "sha256-hash",
    "originalSize": 1234,
    "encryptedAt": 1733961600000
  }
}
```

### Integrität (SHA-256)

Jede Spezialisierung erhält einen SHA-256 Hash für Corruption-Detection:

```typescript
const checksum = crypto
  .createHash('sha256')
  .update(JSON.stringify(specialization))
  .digest('hex');
```

---

## Persistence & Auto-Load

### Persistierung

**Speicherort:** `data/specializations/{userId}/{specId}.json`

**Automatische Speicherung:**
```typescript
await SpecializationPersistenceManager.persistSpecialization(spec, userId);
```

### Auto-Load beim Server-Start

```typescript
// backend/server.ts
await initializeSpecializationAutoLoad(userId);

// Gibt aktive Spezialisierung aus Cache
const active = getActiveSpecialization();
```

**Cache-States:**
- `not-started` - Nicht gestartet
- `loading` - Lädt von Disk
- `loaded` - Erfolgreich geladen
- `failed` - Fehler beim Laden

### AI-Integration

```typescript
import { AISpecializationHelper } from '../utils/aiSpecializationHelper';

const messages = await AISpecializationHelper.buildOpenAIMessages(
  baseSystemPrompt,
  userPrompt,
  conversationHistory,
  userId
);

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages
});
```

**Resultat:** Spezialisierungs-Prompts werden als System-Message injiziert.

---

## Concurrency Control

### Problem
Zwei gleichzeitige Requests konnten `active.json` überschreiben → Datenverlust.

### Lösung: Mutex-Locking

**SimpleMutex Implementation:**
```typescript
class SimpleMutex {
  async acquire(key: string): Promise<() => void>
}
```

**Lock-Strategie:**
- Separate Locks für verschiedene Users → Parallelität
- Gleicher User serialisiert → Keine Race Conditions
- Lock-Key: `active-{userId}` oder `spec-{userId}-{specId}`

**Atomic Writes:**
```
1. Schreibe zu ${filename}.tmp
2. Rename ${filename}.tmp → ${filename}  (atomar)
```

Beim Crash bleibt `.json` unverändert (nur `.tmp` ist beschädigt).

---

## Testing

### Test-Abdeckung: **148 Tests bestanden** ✅

**Test-Suites:**
1. **Persistence Tests** (20 Tests) - CRUD-Operationen
2. **Auto-Load Tests** - Cache & State-Transitions
3. **Backup Manager Tests** (20 Tests) - Encryption/Decryption
4. **Encryption Flow Tests** (8 Tests) - End-to-End
5. **Concurrency Tests** - Race-Condition Prevention

**Ausführung:**
```bash
npm run test -- -t "Specialization"
npm run test -- -t "Concurrency"
npm run test -- -t "Encryption"
```

---

## Performance

**Benchmarks (Windows 11, Node.js 24):**

| Operation | Zeit |
|-----------|------|
| Load Single | 2-5ms |
| Persist | 7-10ms |
| List All | 1-3ms |
| Validate Integrity | 25-30ms |
| Cache Hit | < 1ms |
| Encryption | 2-4ms |

---

## Verwendung im Frontend

### Settings → Spezialisierung Tab

**Features:**
- ✅ Upload-Button für `.ari-spec` oder `.json`
- ✅ Link zum Marketplace
- ✅ Grid mit installierten Spezialisierungen
- ✅ Aktivieren/Löschen-Buttons
- ✅ AKTIV Badge
- ✅ Feature-Liste

**Code:**
```tsx
const handleSpecializationUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/specializations/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (response.ok) {
    setMessage('✅ Spezialisierung installiert');
  }
};
```

---

## Troubleshooting

### Problem: Upload schlägt mit "Ungültige Signatur" fehl
**Lösung:** Public Key in Backend überprüfen (`SPEC_PUBLIC_KEY`)

### Problem: Spezialisierung wird nicht angezeigt
**Lösung:** `GET /api/specializations/list` aufrufen und Response prüfen

### Problem: AI nutzt Spezialisierung nicht
**Lösung:** `AISpecializationHelper.invalidateCache()` aufrufen

### Problem: Race Condition Fehler
**Lösung:** Mutex-Locking wird automatisch angewendet, Logs überprüfen

---

## Ideen für Spezialisierungen

- ✈️ **Reisebüro** (bereits implementiert)
- 🏠 **Immobilienmakler**
- 🛠️ **Technikshop**
- 👗 **Fashion & Bekleidung**
- 🍕 **Gastronomie**
- 💼 **B2B Großhandel**
- 🎨 **Kreativbranche**
- 🏋️ **Fitness & Sport**
- 📚 **Bildung**
- 🏥 **Gesundheit & Pharmazie**

---

## Zusammenfassung

A.R.I. Spezialisierungen bieten:

✅ **Sichere Verteilung:** RSA-2048 Signatur-Validierung  
✅ **Sichere Speicherung:** AES-256-GCM Verschlüsselung  
✅ **Zuverlässige Operationen:** Mutex-Locking gegen Race Conditions  
✅ **Schnelle Integration:** AI-Prompt-Injection  
✅ **Umfassend getestet:** 148+ Tests bestanden  
✅ **Production-Ready:** Auto-Load, Fallback, Monitoring  

**Vertriebskanal:** Marketplace  
**Technische Integration:** Web-basiertes Upload-System  
**Skalierbarkeit:** Unbegrenzte Anzahl Spezialisierungen pro User

**Version:** 7.0.3  
**Stand:** Januar 2026  
**Autor:** André Zabel (AndreZ1971)
