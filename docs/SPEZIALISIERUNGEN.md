# 🎯 A.R.I. Spezialisierungs-System

## Übersicht

Das Spezialisierungs-System erweitert A.R.I. mit Branchen-spezifischen Prompts und Kontext. Spezialisierungen werden auf **kaufe-es.eu** verkauft, als signierte JSON-Dateien ausgeliefert und lokal in jedem A.R.I. installiert.

---

## 🏗️ Architektur

### **Zentral (kaufe-es.eu)**
- WooCommerce-Shop mit digitalen Produkten
- Nach Kauf: Generierung einer signierten JSON-Datei
- Download-Link per E-Mail an Kunden

### **Dezentral (jeder A.R.I.)**
- Upload-Funktion in Settings
- Signatur-Validierung (Public Key hardcoded)
- AES-256-Verschlüsselung
- Lokale Speicherung in `/data/specializations/{userId}/{specId}.enc`
- AI-Integration: System-Prompt-Injection

---

## 📂 Dateistruktur

```
backend/
  types/
    specialization.ts          # TypeScript-Interfaces
  services/
    specializationService.ts   # Core-Logik (Validate, Encrypt, Store, Decrypt)
  routes/
    app/
      api/
        specializations/
          index.ts             # API-Endpoints (upload, list, activate, delete)
  utils/
    aiSpecializationHelper.ts  # AI-Integration Helper
  data/
    specializations/
      default/                 # User-ID (aktuell fix auf "default")
        metadata.json          # Liste aller installierten Specs
        reisebuero.enc         # Verschlüsselte Spezialisierung
    test-specializations/
      reisebuero-test.json     # Test-Datei für Entwicklung

frontend/
  src/
    pages/
      Settings/
        Settings.tsx           # Upload + Verwaltung UI
```

---

## 🔐 Signatur-System

### **1. Generierung (kaufe-es.eu Backend)**

```typescript
import crypto from 'crypto';

const privateKey = process.env.SPEC_PRIVATE_KEY; // RSA-2048

function signSpecialization(data: SpecializationData) {
  const payload = JSON.stringify(data);
  const signature = crypto.sign('sha256', Buffer.from(payload), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  });
  
  return {
    version: '1.0',
    issuer: 'kaufe-es.eu',
    timestamp: Date.now(),
    data,
    signature: signature.toString('base64')
  };
}
```

### **2. Validierung (A.R.I. Backend)**

Public Key ist in `specializationService.ts` hardcoded:

```typescript
const KAUFE_ES_PUBLIC_KEY = process.env.SPEC_PUBLIC_KEY || `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`;

SpecializationService.validateSignature(signedSpec);
```

---

## 📡 API-Endpoints

### **GET `/api/specializations/list`**
Listet alle installierten Spezialisierungen auf.

**Response:**
```json
{
  "success": true,
  "specializations": [
    {
      "id": "reisebuero",
      "name": "Reisebüro Spezialisierung",
      "description": "Optimiert für Reise- und Tourismusbranche",
      "category": "Services",
      "icon": "✈️",
      "version": "1.0.0",
      "features": ["Reisebeschreibungen", "Hotel Marketing", "..."],
      "installedAt": 1733961600000,
      "filePath": "/data/specializations/default/reisebuero.enc",
      "isActive": true
    }
  ]
}
```

---

### **POST `/api/specializations/upload`**
Lädt eine signierte Spezialisierungs-Datei hoch.

**Request Body:**
```json
{
  "signedData": {
    "version": "1.0",
    "issuer": "kaufe-es.eu",
    "timestamp": 1733961600000,
    "signature": "BASE64_SIGNATURE",
    "data": {
      "id": "reisebuero",
      "name": "Reisebüro Spezialisierung",
      "systemPrompt": "Du bist ein Reise-Experte...",
      "contextInstructions": ["...", "..."]
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Spezialisierung \"Reisebüro Spezialisierung\" erfolgreich installiert!",
  "specialization": {
    "id": "reisebuero",
    "name": "Reisebüro Spezialisierung",
    "description": "..."
  }
}
```

---

### **POST `/api/specializations/activate`**
Aktiviert eine installierte Spezialisierung (nur eine kann aktiv sein).

**Request Body:**
```json
{
  "specId": "reisebuero"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Spezialisierung aktiviert"
}
```

---

### **DELETE `/api/specializations/:specId`**
Löscht eine installierte Spezialisierung.

**Response:**
```json
{
  "success": true,
  "message": "Spezialisierung gelöscht"
}
```

---

### **GET `/api/specializations/active`**
Gibt die aktuell aktive Spezialisierung zurück.

**Response:**
```json
{
  "success": true,
  "specialization": {
    "id": "reisebuero",
    "name": "Reisebüro Spezialisierung",
    "systemPrompt": "Du bist ein Reise-Experte...",
    "contextInstructions": ["...", "..."]
  }
}
```

Wenn keine aktiv: `{ "success": true, "specialization": null }`

---

## 🤖 AI-Integration

### **Verwendung in OpenAI-Calls**

```typescript
import { AISpecializationHelper } from '../utils/aiSpecializationHelper';

// Beispiel: Produkt-Beschreibung generieren
const messages = await AISpecializationHelper.buildOpenAIMessages(
  'Du bist ein professioneller E-Commerce-Assistent.', // Base System Prompt
  'Erstelle eine Beschreibung für eine Rundreise durch Vietnam',  // User Prompt
  [],        // Conversation History (optional)
  'default'  // User ID
);

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages
});
```

**Resultierende Messages:**
```javascript
[
  { role: 'system', content: 'Du bist ein professioneller E-Commerce-Assistent.' },
  { role: 'system', content: '## AKTIVE SPEZIALISIERUNG: Reisebüro Spezialisierung\n\nDu bist ein hochspezialisierter AI-Assistent für die Reise- und Tourismusbranche...' },
  { role: 'system', content: '### ZUSÄTZLICHE KONTEXT-ANWEISUNGEN:\n1. Priorisiere Sicherheitshinweise...\n2. Erwähne immer Stornobedingungen...' },
  { role: 'user', content: '[Kontext: Spezialisierung "Reisebüro Spezialisierung" aktiv]\n\nErstelle eine Beschreibung für eine Rundreise durch Vietnam' }
]
```

### **Helper-Funktionen**

```typescript
// System Messages erstellen
const systemMessages = await AISpecializationHelper.buildSystemMessages(basePrompt, userId);

// User-Prompt erweitern
const enhancedPrompt = await AISpecializationHelper.enhanceUserPrompt(userPrompt, userId);

// Prüfen ob Spezialisierung aktiv
const hasSpec = await AISpecializationHelper.hasActiveSpecialization(userId);

// Namen der aktiven Spezialisierung
const name = await AISpecializationHelper.getActiveSpecializationName(userId);

// Cache invalidieren (nach Aktivierung)
AISpecializationHelper.invalidateCache();
```

---

## 🎨 Frontend-UI

### **Settings → Spezialisierung Tab**

**Features:**
- ✅ Upload-Button für `.json`-Dateien
- ✅ Link zu kaufe-es.eu Marketplace
- ✅ Grid mit allen installierten Spezialisierungen
- ✅ Aktivieren-Button (nur eine kann aktiv sein)
- ✅ Löschen-Button
- ✅ Status-Anzeige (AKTIV Badge)
- ✅ Feature-Liste (gekürzt auf 3 + "weitere...")
- ✅ Hover-Effekte

---

## 🧪 Testing

### **Test-Spezialisierung hochladen**

1. Öffne `backend/data/test-specializations/reisebuero-test.json`
2. Gehe zu **Settings → Spezialisierung**
3. Klicke "📤 Datei auswählen"
4. Wähle `reisebuero-test.json`
5. Resultat: **Mock-Signatur** wird akzeptiert (da Public Key nicht validiert wird in Test-Umgebung)

### **Produktion: Echte Signatur**

Für Produktion muss:
1. kaufe-es.eu ein **RSA-2048-Keypair** generieren
2. **Private Key** auf kaufe-es.eu Backend speichern (signiert Spezialisierungen)
3. **Public Key** in A.R.I. Backend eintragen (`SPEC_PUBLIC_KEY` ENV-Variable)

---

## 🔒 Verschlüsselung

**Algorithmus:** AES-256-GCM

**Key:** 32-Byte-Key aus ENV-Variable `SPEC_ENCRYPTION_KEY`

**Speicherformat:**
```json
{
  "iv": "HEX_STRING",
  "authTag": "HEX_STRING",
  "data": "ENCRYPTED_HEX_DATA"
}
```

---

## 🚀 Deployment-Checklist

### **Backend**
- [ ] `SPEC_PUBLIC_KEY` in ENV setzen (kaufe-es.eu Public Key)
- [ ] `SPEC_ENCRYPTION_KEY` in ENV setzen (32-Byte-Key)
- [ ] `/data/specializations/` Directory erstellen (automatisch, aber prüfen)
- [ ] API-Route `/api/specializations/*` freigeben

### **Frontend**
- [ ] `VITE_API_URL` korrekt konfiguriert
- [ ] Link zu kaufe-es.eu Marketplace anpassen (URL prüfen)

### **kaufe-es.eu**
- [ ] WooCommerce-Produkte erstellen (digitale Downloads)
- [ ] Webhook `order_completed` → JSON-Generierung + Signatur
- [ ] E-Mail-Template mit Download-Link

---

## 📝 Beispiel-Spezialisierungen (Ideen)

- ✈️ **Reisebüro** (fertig implementiert)
- 🏠 **Immobilienmakler**
- 🛠️ **Technikshop / Elektronik**
- 👗 **Fashion & Bekleidung**
- 🍕 **Gastronomie / Restaurant**
- 💼 **B2B / Großhandel**
- 🎨 **Kreativbranche / Künstler**
- 🏋️ **Fitness / Sportartikel**
- 📚 **Bildung / E-Learning**
- 🏥 **Gesundheit / Pharmazie**

---

## 🆘 Troubleshooting

**Problem:** Upload schlägt fehl mit "Ungültige Signatur"
- **Lösung:** Public Key in Backend prüfen (`SPEC_PUBLIC_KEY`)
- **Test:** Mock-Signatur in `reisebuero-test.json` sollte trotzdem funktionieren

**Problem:** Spezialisierung wird nicht angezeigt
- **Lösung:** `GET /api/specializations/list` aufrufen, Response prüfen
- **Lösung:** `metadata.json` in `/data/specializations/default/` prüfen

**Problem:** AI nutzt Spezialisierung nicht
- **Lösung:** `AISpecializationHelper.invalidateCache()` aufrufen
- **Lösung:** Prüfen ob Spezialisierung aktiv ist (`isActive: true`)

**Problem:** Verschlüsselung schlägt fehl
- **Lösung:** `SPEC_ENCRYPTION_KEY` muss exakt 32 Bytes sein

---

## 📊 Metriken & Analytics (TODO)

- [ ] Tracking: Welche Spezialisierungen sind am beliebtesten?
- [ ] Conversion: Uploads → Aktivierungen
- [ ] Nutzung: Wie oft wird aktive Spezialisierung in AI-Calls verwendet?
- [ ] Feedback: User-Rating für Spezialisierungen

---

## 🔮 Roadmap

**Q1 2025:**
- [ ] Top 10 Spezialisierungen auf kaufe-es.eu veröffentlichen
- [ ] Multi-User-Support (aktuell nur "default" User)
- [ ] Spezialisierungs-Versionsmanagement (Updates)

**Q2 2025:**
- [ ] Community-Marketplace (User können eigene Spezialisierungen erstellen/verkaufen)
- [ ] A/B-Testing für Spezialisierungen
- [ ] Spezialisierungs-Kombinationen (z.B. "Reisebüro + Nachhaltigkeit")

**Q3 2025:**
- [ ] AI-generierte Spezialisierungen (User beschreibt Branche → AI erstellt Spezialisierung)
- [ ] White-Label-Spezialisierungen für Enterprise-Kunden
