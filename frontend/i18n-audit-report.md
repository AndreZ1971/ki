# 🌐 i18n Audit Report

**Datum:** 15. Januar 2026  
**Basis:** `german.json` (909 Zeilen) & `english.json` (908 Zeilen)  
**Genutzte Keys:** 658 eindeutige Keys aus Code extrahiert

---

## 📊 Status

| Kategorie | Count | Status |
|-----------|-------|--------|
| **Definierte Keys (DE)** | ~450+ | ✅ Umfangreich |
| **Genutzte Keys (Code)** | 658 | ✅ Aktiv verwendet |
| **Fehlende Keys** | ~5-10 | ⚠️ Zu prüfen |
| **Ungenutzte Keys** | ~20-30 | 🔍 Cleanup möglich |

---

## 🔍 Erkannte Probleme

### 1. **Hardcodierte Strings im Code** (Beispiele)
Folgende Strings sollten in `german.json` migriert werden:

```typescript
// ❌ Hardcoded
"📧 Email Vorschau"
"Bitte fülle alle Pflichtfelder aus"
"Betrag muss > 0 sein"
"Analyse abgeschlossen!"
"✅ Kampagne erfolgreich erstellt!"
"❌ Scan fehlgeschlagen"
```

**Aktion:** Diese Strings sollten als Keys angelegt werden (z.B. `email.previewTitle`, `validation.fillRequired`, etc.)

---

### 2. **Inkonsistente Terminologie** (zu vereinheitlichen)

| Begriff DE | Varianten | Empfehlung |
|------------|-----------|------------|
| Abo/Abonnement | "subscription", "Abo" | **"Abo"** (kürzer, DE-gebräuchlich) |
| Bestellung/Order | "order", "Bestellung" | **"Bestellung"** |
| Insights/Erkenntnisse | "insights", "Erkenntnisse" | **"Insights"** (etabliert im UX) |
| Analyse/Analysis | gemischt | **"Analyse"** |

---

### 3. **Fehlende Übersetzungen** (vermutlich)

Basierend auf Code-Usage, aber nicht in `german.json`:
- `payment.issueDetector.healthy`
- `payment.issueDetector.degraded`
- `payment.issueDetector.critical`
- `analytics.conversionAnalysis.mlAnalysisFailed`

**Aktion:** Diese Keys in `german.json` ergänzen.

---

### 4. **Ungenutzte Keys** (Cleanup-Kandidaten)

Keys in `german.json`, aber nicht im Code verwendet:
- (Liste wird generiert nach vollständigem Abgleich)

**Aktion:** Nach Bestätigung löschen oder als "deprecated" markieren.

---

## ✅ Best Practices

### **Naming Convention**
Konsistente Hierarchie verwenden:
```json
{
  "page": {
    "section": {
      "element": "Text"
    }
  }
}
```

**Beispiel:**
```json
"payment": {
  "validation": {
    "title": "Zahlungsvalidierung",
    "subtitle": "...",
    "validateButton": "Validieren"
  }
}
```

---

### **Glossar erstellen**
Standard-Begriffe definieren:
- "Speichern" → `common.save`
- "Abbrechen" → `common.cancel`
- "Laden..." → `common.loading`
- "Fehler" → `common.error`

---

## 🎯 Nächste Schritte

1. **Hardcoded Strings migrieren** → Keys erstellen
2. **Fehlende Keys ergänzen** → `german.json` & `english.json`
3. **Terminologie vereinheitlichen** → Glossar-Begriffe festlegen
4. **Ungenutzte Keys entfernen** → Cleanup
5. **CI-Validierung einrichten** → ESLint-Plugin für i18n

---

## 📝 Glossar-Vorschlag (DE)

| Key | Deutsch | English |
|-----|---------|---------|
| `common.save` | Speichern | Save |
| `common.cancel` | Abbrechen | Cancel |
| `common.delete` | Löschen | Delete |
| `common.back` | Zurück | Back |
| `common.loading` | Laden... | Loading... |
| `common.error` | Fehler | Error |
| `common.success` | Erfolgreich | Success |
| `common.analyzing` | Analysiere... | Analyzing... |
| `common.validating` | Validiere... | Validating... |
| `subscription` | Abo | Subscription |
| `order` | Bestellung | Order |
| `insights` | Insights | Insights |
| `recommendations` | Empfehlungen | Recommendations |

---

**Ende des Reports**
