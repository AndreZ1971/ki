# 📋 Spezialisierungs-Upload Feature - Analyse & Roadmap

**Datum:** December 18, 2025  
**Status:** ⏳ Analyse abgeschlossen - Implementierung erforderlich

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

---

## 📋 Implementations-Checkliste

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

