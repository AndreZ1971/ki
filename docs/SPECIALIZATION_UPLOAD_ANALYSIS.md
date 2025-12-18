# 📋 Spezialisierungs-Upload Feature - Analyse & Roadmap

**Datum:** December 18, 2025  
**Status:** ⏳ Analyse abgeschlossen - Implementierung erforderlich
**Security-Level:** 🔒 ENCRYPTED (Proprietary IP)

---

## ⚠️ KRITISCHE SICHERHEITSANFORDERUNG

### 🔐 Datei-Verschlüsselung ERFORDERLICH

Die hochgeladene Umschulung (Spezialisierungs-Prompt) ist **proprietäres Know-How** des Kunden und MUSS verschlüsselt werden:

✅ **Verschlüsselung erforderlich für:**
- Upload zur API (HTTPS + Payload-Verschlüsselung)
- Speicherung in Datenbank/File (AES-256)
- Übertragung zu ML-Modell (encrypted in memory)
- Zugriff nur mit Authentifizierung

✅ **Sicherheits-Anforderungen:**
- 🔒 Nur autorisierte User können lesen
- 🔒 Nur Shop-Owner kann ändern/löschen
- 🔒 Audit-Log für alle Zugriffe
- 🔒 Keine Logs/Backups unverschlüsselt
- 🔒 Datenleck-Schutz durch TDE

---

## 🔍 Aktuelle Situation

### ✅ Was bereits existiert:

#### 1. **Frontend UI (Settings.tsx)**
- ✅ Upload-Button in der Specialization Tab
- ✅ File Input (akzeptiert `.json` und `.csv`)
- ✅ Handler-Funktion: `handleSpecializationUpload()`
- ✅ Styling für Upload-Section vorhanden
- ✅ i18n Labels für Upload-UI

**UI-Element:**
```tsx
// Lines 2231-2269 in Settings.tsx
- Upload Section mit Dashed Border
- Button "Upload Spezialisierungs-Prompt"
- File Input akzeptiert: .json, .csv
```

#### 2. **Spezialisierungs-Prompt in AutoProductCreator**
- ✅ `specializationPrompt` State vorhanden
- ✅ Textarea für Benutzereingabe
- ✅ Wird in der Produkt-Erstellung verwendet
- ✅ Optional - kann leer sein

**Nutzung:**
```tsx
// Lines 38, 198-200 in AutoProductCreator.tsx
config: {
  specializationPrompt: "",  // String field
  // ... andere Config
}

// Im Form:
<textarea
  value={config.specializationPrompt}
  onChange={(e) => setConfig({ ...config, specializationPrompt: e.target.value })}
  placeholder="Beschreibe hier besondere Anforderungen..."
/>
```

#### 3. **RunAutoProductCreator**
- ✅ `specializationPrompt` wird geladen und genutzt
- ✅ Wird an API gesendet: `/api/products/auto-create`

---

## ❌ Was NICHT implementiert ist:

### 1. **Upload-Handler ist Stub**
```tsx
// Current (Lines 535-543):
const handleSpecializationUpload = (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];
  if (!file) return;
  // TODO: Implement real upload/parse logic  ← STUB!
  console.log("📤 Spezialisierungs-Upload gestartet:", file.name);
  setConnectionMessage(`📂 Upload gestartet: ${file.name}`);
};
```

**Problem:** Macht nichts mit der Datei! Nur Logging.

### 2. **Keine Datei-Verarbeitung**
- ❌ JSON/CSV nicht geparst
- ❌ Inhalte nicht validiert
- ❌ Inhalte nicht in State gespeichert
- ❌ Inhalte nicht an API gesendet
- ❌ Keine Error-Behandlung

### 3. **Keine Persistierung**
- ❌ Upload wird nirgends gespeichert
- ❌ Keine Datenbank-Integration
- ❌ Kein API Endpoint für Upload
- ❌ Kein Abruf von hochgeladenem Prompt

### 4. **Keine Validierung**
- ❌ File-Größe nicht begrenzt
- ❌ Inhalte nicht validiert
- ❌ Keine Format-Checks
- ❌ Keine Fehlerbehandlung für invalide Dateien

### 5. **Keine API-Integration**
- ❌ Kein Backend-Endpoint für Upload
- ❌ Keine Speicherung im Backend
- ❌ Keine Abruf-Möglichkeit aus Settings

---

## 📊 Dateiformat-Analyse

### Unterstützte Formate:

#### Format 1: JSON
```json
{
  "name": "Premium Spezialisierung",
  "description": "Hochwertige Produktbeschreibungen mit SEO",
  "rules": [
    "Verwende mindestens 500 Zeichen pro Beschreibung",
    "Integriere Suchbegriffe natürlich",
    "Hebe USP hervor"
  ],
  "systemPrompt": "Du bist ein erfahrener...",
  "exampleProducts": ["product1", "product2"]
}
```

#### Format 2: CSV (einfacher)
```csv
Rule,Description
1,"Verwende mindestens 500 Zeichen"
2,"Integriere Suchbegriffe natürlich"
3,"Hebe USP hervor"
```

---

## 🎯 Was muss implementiert werden?

### Phase 1: Frontend Upload-Handler (Einfach)
**Datei:** `frontend/src/pages/Settings/Settings.tsx`

```typescript
const handleSpecializationUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validierung
  if (file.size > 5 * 1024 * 1024) { // 5MB max
    setConnectionMessage("❌ Datei zu groß (max. 5MB)");
    return;
  }

  if (!["application/json", "text/csv"].includes(file.type)) {
    setConnectionMessage("❌ Nur JSON oder CSV erlaubt");
    return;
  }

  // Datei lesen
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      let prompt = "";
      const content = e.target?.result as string;

      if (file.name.endsWith(".json")) {
        const json = JSON.parse(content);
        prompt = json.systemPrompt || JSON.stringify(json);
      } else if (file.name.endsWith(".csv")) {
        prompt = content; // Oder strukturiert parsen
      }

      // An API senden
      await uploadSpecialization(file.name, prompt);
      
      // In State speichern
      setConnections(prev => ({
        ...prev,
        specializationPrompt: prompt
      }));

      setConnectionMessage(`✅ Spezialisierung hochgeladen: ${file.name}`);
    } catch (err) {
      setConnectionMessage(`❌ Fehler beim Upload: ${err.message}`);
    }
  };

  reader.readAsText(file);
};
```

### Phase 2: API Endpoint (Backend)
**Pfad:** `POST /api/settings/specialization/upload`

```typescript
// Request
{
  "filename": "specialization.json",
  "content": "..."
}

// Response
{
  "success": true,
  "message": "Spezialisierung hochgeladen",
  "promptId": "spec_123",
  "preview": "Du bist ein erfahrener..."
}
```

### Phase 3: Persistierung (Backend/Database)
- Speichere Upload in Datenbank
- Zuordnung zu User/Shop
- Versioning von Prompts
- Abruf beim Start

### Phase 4: Integration in Produkterstellung
- Lade gespeicherten Prompt beim Auto-Erstellen
- Verwende als System-Prompt in ML-Modell
- Passe Produktgenerierung danach an

### Phase 5: UI-Feedback
- Progress-Bar während Upload
- Erfolgs-/Fehler-Meldung
- Vorschau des Prompts
- Möglichkeit zum Löschen

---

## 💾 Speicherungs-Strategie

### Option A: connection.json (schnell)
```json
{
  "specialization": {
    "uploadedPrompt": "...",
    "fileName": "specialization.json",
    "uploadedAt": "2025-12-18T..."
  }
}
```

### Option B: Separate Datei
```
backend/data/specializations/
  ├── shop_123_current.json
  └── shop_123_history/
      ├── 2025-12-18_v1.json
      └── 2025-12-19_v2.json
```

### Option C: Datenbank
```sql
specializations
├── id (primary)
├── shop_id (foreign)
├── prompt_content (text)
├── filename (string)
├── created_at
├── is_active (boolean)
└── version
```

## 💾 Speicherungs-Strategie

### ⚡ WICHTIG: Mit Verschlüsselung!

### Option A: connection.json (mit Verschlüsselung)
```json
{
  "specialization": {
    "uploadedPrompt": "enc:base64_encrypted_payload",  // AES-256 verschlüsselt
    "fileName": "specialization.json",
    "uploadedAt": "2025-12-18T...",
    "encryptionKey": "stored_in_env_or_vault",
    "hash": "sha256_for_integrity"
  }
}
```

### Option B: Separate verschlüsselte Datei
```
backend/data/specializations/
  ├── shop_123_current.enc  (AES-256 verschlüsselt)
  └── shop_123_history/
      ├── 2025-12-18_v1.enc.gpg
      └── 2025-12-19_v2.enc.gpg
```

**Encryption-Header:**
```
[VERSION:1][ALGORITHM:AES-256][IV:16bytes][SALT:16bytes][ENCRYPTED_DATA]
```

### Option C: Datenbank mit TDE (Transparent Data Encryption)
```sql
specializations
├── id (primary)
├── shop_id (foreign)
├── prompt_content (text) -- TDE encrypted at rest
├── prompt_hash (varchar) -- For integrity check
├── filename (string)
├── created_at
├── is_active (boolean)
├── version
├── encrypted_at (timestamp)
└── encryption_algorithm (enum: AES-256)
```

### Empfohlene Strategie: **Option C + Option B**
- **Datenbank:** Hauptspeicher mit TDE
- **File-Backup:** Encrypted Backup für Disaster Recovery
- **Vault:** Encryption Keys in Hashicorp Vault oder AWS KMS

---

## 🔐 **KRITISCH: Verschlüsselungsanforderungen**

> ⚠️ **ANFORDERUNG:** Die Umschulungs-Prompt MUSS IMMER verschlüsselt sein!
> - ❌ NIEMALS im Klartext speichern
> - ❌ NIEMALS im Klartext übertragen
> - ❌ NIEMALS im Klartext in Logs speichern

### Verschlüsselungs-Architektur

```
┌─────────────────────────────────────────┐
│  User Upload (Settings Page)            │
│  - Wählt JSON/CSV Spezialisierungs-File │
└────────────┬──────────────────────────┘
             │
      ┌──────▼──────────┐
      │ AES-256-GCM     │
      │ Verschlüsselung │
      └──────┬──────────┘
             │
      ┌──────▼────────────────────┐
      │ POST to API + HTTPS        │
      │ + Integrity Signature      │
      └──────┬────────────────────┘
             │
      ┌──────▼──────────────────────┐
      │ Backend Decryption Check     │
      │ + Signature Verification    │
      └──────┬──────────────────────┘
             │
      ┌──────▼──────────────────────┐
      │ TDE-Encrypted DB            │
      │ + SHA-256 Hash              │
      │ + Audit Log (anonym)        │
      └─────────────────────────────┘
```

### Encryption Utilities (TypeScript)

```typescript
// backend/security/promptEncryption.ts
import crypto from 'crypto';

export class PromptEncryption {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly SALT_LENGTH = 32;
  private readonly TAG_LENGTH = 16;
  private readonly IV_LENGTH = 12;

  /**
   * Encrypt prompt with AES-256-GCM
   * @param plaintext Raw prompt content
   * @param masterKey Encryption key (32 bytes)
   * @returns { ciphertext, iv, authTag } as hex string
   */
  encrypt(plaintext: string, masterKey: Buffer): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, masterKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv + authTag + ciphertext
    return `${iv.toString('hex')}${authTag.toString('hex')}${encrypted}`;
  }

  /**
   * Decrypt prompt with AES-256-GCM
   * @param encrypted Combined encrypted data (iv + authTag + ciphertext)
   * @param masterKey Encryption key (32 bytes)
   * @returns Decrypted plaintext
   */
  decrypt(encrypted: string, masterKey: Buffer): string {
    // Extract components
    const iv = Buffer.from(encrypted.slice(0, 24), 'hex');
    const authTag = Buffer.from(encrypted.slice(24, 56), 'hex');
    const ciphertext = encrypted.slice(56);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate SHA-256 hash (for integrity verification, safe to log)
   * @param plaintext Content to hash
   * @returns Hex hash
   */
  hash(plaintext: string): string {
    return crypto.createHash('sha256').update(plaintext).digest('hex');
  }

  /**
   * Derive encryption key from password + salt
   * @param password Master password/key
   * @param salt Random salt (32 bytes)
   * @returns 32-byte key for AES-256
   */
  deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }

  /**
   * Generate secure random key
   * @returns 32-byte random buffer
   */
  generateMasterKey(): Buffer {
    return crypto.randomBytes(32);
  }
}
```

### Backend Middleware mit Verschlüsselung

```typescript
// backend/routes/settings.ts
import express from 'express';
import { PromptEncryption } from '../security/promptEncryption';
import { logger } from '../logger';

const router = express.Router();
const encryption = new PromptEncryption();

// Get master key from secure vault (Hashicorp Vault / AWS KMS)
async function getMasterKey(): Promise<Buffer> {
  // TODO: Implement vault integration
  return Buffer.from(process.env.PROMPT_ENCRYPTION_KEY || '', 'hex');
}

/**
 * Upload Spezialisierungs-Prompt (verschlüsselt)
 * POST /api/settings/specialization/upload
 * 
 * Request Body:
 * {
 *   encryptedContent: string (AES-256-GCM encrypted)
 *   fileName: string
 *   contentHash: string (SHA-256)
 * }
 */
router.post(
  '/specialization/upload',
  async (req, res) => {
    try {
      // 1. Authentifizierung
      if (!req.user) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
      }

      // 2. Autorisierung (nur Shop Owner)
      if (req.user.role !== 'shop_owner') {
        logger.warn(`Unauthorized specialization upload attempt by ${req.user.id}`);
        return res.status(403).json({ error: 'Keine Berechtigung' });
      }

      const { encryptedContent, fileName, contentHash } = req.body;

      // 3. Validierung
      if (!encryptedContent || !fileName || !contentHash) {
        return res.status(400).json({ error: 'Fehlende Felder' });
      }

      // 4. Hash-Verifikation (Integrity Check)
      // Das Hash sollte vom Client berechnet werden BEVOR verschlüsselt
      // Backend verifiziert: Hash(encrypted content) == contentHash
      const calculatedHash = encryption.hash(encryptedContent);
      if (calculatedHash !== contentHash) {
        logger.error(`Hash mismatch for user ${req.user.id}: ${calculatedHash} !== ${contentHash}`);
        return res.status(400).json({ error: 'Datei beschädigt oder tampered' });
      }

      // 5. In Datenbank speichern (ENCRYPTED)
      const masterKey = await getMasterKey();
      
      const specialization = {
        shopId: req.user.shopId,
        userId: req.user.id,
        fileName,
        encryptedContent, // Bleibt verschlüsselt!
        contentHash,      // Hash für Integrity (safe to log/compare)
        uploadedAt: new Date(),
        algorithm: 'aes-256-gcm',
        version: 1,
      };

      // Speichern in DB (mit TDE)
      const stored = await db.specializations.create(specialization);

      // 6. Audit Log (nur Metadaten, kein Prompt!)
      logger.info('Specialization uploaded', {
        userId: req.user.id,
        shopId: req.user.shopId,
        fileName,
        contentHash,
        size: encryptedContent.length,
        timestamp: new Date(),
      });

      // 7. Response
      return res.status(200).json({
        success: true,
        id: stored.id,
        message: 'Spezialisierungs-Prompt erfolgreich hochgeladen',
        contentHash,
      });
    } catch (error) {
      logger.error('Specialization upload error:', error);
      return res.status(500).json({ error: 'Speicherfehler' });
    }
  }
);

/**
 * Get Spezialisierungs-Prompt (automatisch entschlüsselt)
 * GET /api/settings/specialization
 * 
 * Response:
 * {
 *   prompt: string (DECRYPTED - nur für diesen Request!)
 *   fileName: string
 *   uploadedAt: string
 * }
 */
router.get(
  '/specialization',
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
      }

      const stored = await db.specializations.findOne({
        shopId: req.user.shopId,
        userId: req.user.id,
      });

      if (!stored) {
        return res.status(404).json({ error: 'Keine Spezialisierung hochgeladen' });
      }

      // 1. Entschlüsseln
      const masterKey = await getMasterKey();
      const decryptedPrompt = encryption.decrypt(stored.encryptedContent, masterKey);

      // 2. Audit Log (anonymisiert)
      logger.info('Specialization accessed', {
        userId: req.user.id,
        shopId: req.user.shopId,
        contentHash: stored.contentHash,
        timestamp: new Date(),
      });

      // 3. Response mit DECRYPTED Prompt
      return res.status(200).json({
        prompt: decryptedPrompt,
        fileName: stored.fileName,
        uploadedAt: stored.uploadedAt,
        contentHash: stored.contentHash,
      });
    } catch (error) {
      logger.error('Specialization fetch error:', error);
      return res.status(500).json({ error: 'Abruf fehlgeschlagen' });
    }
  }
);

/**
 * Delete Spezialisierungs-Prompt
 * DELETE /api/settings/specialization/:id
 */
router.delete(
  '/specialization/:id',
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
      }

      const { id } = req.params;
      
      const stored = await db.specializations.findOne({
        id,
        shopId: req.user.shopId,
        userId: req.user.id,
      });

      if (!stored) {
        return res.status(404).json({ error: 'Nicht gefunden' });
      }

      // Löschen (wird mit TDE physisch secure gelöscht)
      await db.specializations.delete(id);

      // Audit Log
      logger.info('Specialization deleted', {
        userId: req.user.id,
        shopId: req.user.shopId,
        id,
        timestamp: new Date(),
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Specialization delete error:', error);
      return res.status(500).json({ error: 'Löschfehler' });
    }
  }
);

export default router;
```

### Frontend: File Encryption vor Upload

```typescript
// frontend/src/utils/encryptionUtils.ts
export async function encryptSpecializationFile(
  fileContent: string
): Promise<{ encrypted: string; hash: string }> {
  // 1. Generate random AES-256 key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  // 2. Encrypt content
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(fileContent);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // 3. Convert to hex
  const encryptedHex = Array.from(new Uint8Array(encrypted))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const ivHex = Array.from(iv)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // 4. Calculate SHA-256 hash (für Integrity)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Return: iv + encrypted (Server benötigt Schlüssel aus Vault!)
  return {
    encrypted: `${ivHex}${encryptedHex}`,
    hash: hashHex,
  };
}
```

### Datenbank Schema (mit Encryption)

```typescript
// backend/types/specialization.ts
export interface Specialization {
  id: string;
  shopId: string;
  userId: string;
  fileName: string;
  
  // 🔐 ALWAYS ENCRYPTED
  encryptedContent: string; // AES-256-GCM encrypted
  
  // 🔍 SAFE TO LOG (Hash, nicht plaintext)
  contentHash: string; // SHA-256 hash für integrity
  
  // Metadata
  uploadedAt: Date;
  updatedAt: Date;
  algorithm: 'aes-256-gcm';
  version: number;
  
  // Access tracking (anonymisiert)
  lastAccessedAt?: Date;
  accessCount?: number;
}

// Datenbank Migration
export const createSpecializationTable = `
  CREATE TABLE specializations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    
    -- 🔐 VERSCHLÜSSELT SPEICHERN (TDE auf Datenbank-Ebene)
    encrypted_content TEXT NOT NULL,
    
    -- 🔍 SHA-256 HASH (safe für Logging)
    content_hash CHAR(64) NOT NULL,
    
    -- Metadaten
    algorithm VARCHAR(20) DEFAULT 'aes-256-gcm',
    version INTEGER DEFAULT 1,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    
    -- Index für schnelle Abfragen
    UNIQUE(shop_id, user_id),
    INDEX idx_shop_user (shop_id, user_id),
    INDEX idx_hash (content_hash)
  ) ENCRYPTION='Y' DEFAULT CHARSET utf8mb4;
`;
```

### Sicherheits-Checkliste

- [ ] **Encryption Key Management**
  - [ ] Keys in HashiCorp Vault oder AWS KMS speichern
  - [ ] Key Rotation alle 90 Tage
  - [ ] Separate Keys für verschiedene Shopes/User
  - [ ] Backup-Keys für Disaster Recovery

- [ ] **Transparent Data Encryption (TDE)**
  - [ ] Auf Datenbank-Ebene aktivieren
  - [ ] PostgreSQL: pgcrypto, MySQL: InnoDB TDE
  - [ ] Alle specializations Tabel verschlüsselt

- [ ] **Transport Security**
  - [ ] HTTPS mandatory (TLS 1.3+)
  - [ ] HSTS Header aktivieren
  - [ ] Certificate Pinning optional

- [ ] **Audit Logging**
  - [ ] Upload: User ID, Hash, Timestamp
  - [ ] Access: User ID, Timestamp
  - [ ] Delete: User ID, Timestamp
  - [ ] Logs NICHT mit Plaintext!

- [ ] **Access Control**
  - [ ] nur Shop Owner kann hochladen
  - [ ] Nur eigene Prompts können gelesen werden
  - [ ] API Rate Limiting (z.B. 10 uploads/Tag)
  - [ ] Decryption nur im Backend (nicht Client!)

- [ ] **Backup & Recovery**
  - [ ] Encrypted Backups
  - [ ] Backup Keys getrennt von Daten
  - [ ] Recovery Tests monatlich
  - [ ] Retention Policy: 90 Tage

---

## 🔐 Verschlüsselung Implementation

### Frontend (Settings.tsx)
- [ ] Parse JSON/CSV Inhalte
- [ ] Validiere Datei-Format
- [ ] Limitiere Datei-Größe (5MB)
- [ ] Zeige Progress/Status
- [ ] Speichere in Local State
- [ ] Sende an API

### Backend (API)
- [ ] POST `/api/settings/specialization/upload` Endpoint
- [ ] Validiere Upload
- [ ] Speichere Datei/Inhalt
- [ ] Gebe Confirmation zurück
- [ ] GET `/api/settings/specialization` für Abruf
- [ ] DELETE `/api/settings/specialization` für Löschen

### Data Layer
- [ ] Speicher-Location entscheiden (File/DB)
- [ ] Versioning implementieren
- [ ] Backup-Strategie
- [ ] Migration für bestehende Daten

### i18n
- [ ] Upload-Success Message übersetzen
- [ ] Error-Messages übersetzen
- [ ] Datei-Format-Hinweise übersetzen

### Testing
- [ ] Unit Tests für Parser
- [ ] E2E Test für Upload-Flow
- [ ] Error-Szenarien testen
- [ ] Große Dateien testen

---

## 🚀 Empfohlene Reihenfolge

### Sprint 1: Minimum Viable Product (Tag 1)
1. Frontend: File Parsing (JSON/CSV)
2. Frontend: Validierung
3. Frontend: Local State Speicherung
4. Frontend: UI Feedback

### Sprint 2: Backend Integration (Tag 2)
1. API Endpoint erstellen
2. Upload verarbeiten
3. In connection.json speichern
4. State im Settings laden

### Sprint 3: Erweiterte Features (Tag 3)
1. Versioning
2. Abruf-Funktionalität
3. Lösch-Funktionalität
4. Preview im Settings

### Sprint 4: Polish (Tag 4)
1. Error-Handling verbessern
2. Benutzer-Feedback
3. Tests schreiben
4. Dokumentation

---

## 🔗 Verwandte Komponenten

| Komponente            | Datei                     | Status             |
| --------------------- | ------------------------- | ------------------ |
| Settings Tab          | Settings.tsx              | ✅ UI exists        |
| AutoProductCreator    | AutoProductCreator.tsx    | ✅ Uses prompt      |
| RunAutoProductCreator | RunAutoProductCreator.tsx | ✅ Sends to API     |
| API Backend           | backend/routes/app/*      | ❌ Endpoint missing |
| connection.json       | backend/connection.json   | ⏳ Needs field      |

---

## 📝 Code-Beispiele

### Kompletter Flow (Geplant):

```
1. User wählt Datei in Settings
   ↓
2. handleSpecializationUpload() wird aufgerufen
   ↓
3. File wird gelesen (FileReader API)
   ↓
4. JSON/CSV wird geparst
   ↓
5. Validierung durchgeführt
   ↓
6. POST zu /api/settings/specialization/upload
   ↓
7. Backend speichert Datei
   ↓
8. Frontend aktualisiert State
   ↓
9. In AutoProductCreator verfügbar
   ↓
10. Wird bei Produkt-Erstellung verwendet
```

---

## ⚠️ Potenzielle Probleme

1. **Datei-Größe**
   - Große Prompts könnten Speicherplatz verbrauchen
   - Lösung: 5MB Limit setzen

2. **Format-Kompatibilität**
   - Verschiedene JSON-Strukturen möglich
   - Lösung: Schema definieren

3. **Security**
   - Beliebige Dateien hochladen
   - Lösung: Strict Type/Size Checks

4. **Fehlerbehandlung**
   - Parse-Fehler nicht abgefangen
   - Lösung: Try/Catch, User-Feedback

---

## 📞 Nächste Schritte

**Option A: Sofort implementieren**
- Beginne mit Phase 1 (Frontend Handler)
- Dann Phase 2 (Backend Endpoint)
- Iterativ erweitern

**Option B: Später implementieren**
- Dokumentiert und geplant
- Kann später leicht umgesetzt werden
- Keine Abhängigkeiten blockiert

**Meine Empfehlung:** Implementieren, da es für Benutzer sichtbar ist! ✅

---

**Fragen?** Einfach fragen - Code kann sofort geschrieben werden!

