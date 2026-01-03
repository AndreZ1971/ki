# i18n Synchronisierungs-Leitfaden

## Überblick

Dieser Leitfaden beschreibt den Prozess zur Synchronisierung von i18n-Keys zwischen Deutsch (DE) und Englisch (EN) in A.R.I. Frontend.

**Datum**: 3. Januar 2026  
**Status**: ✅ Synchronisiert (0 fehlende Keys)

## Architektur

### Locale-Dateien

- **Deutsch**: [frontend/src/locales/german.json](../../frontend/src/locales/german.json)
- **Englisch**: [frontend/src/locales/english.json](../../frontend/src/locales/english.json)
- **Framework**: react-i18next
- **Initialisierung**: [frontend/src/i18n.ts](../../frontend/src/i18n.ts)

### Schlüssel-Struktur

```
{
  "settings": {
    "connection": {
      "title": "...",
      "saveButton": "..."
    }
  },
  "pages": {
    "analytics_pages": {
      "paymentSuccess": {
        "title": "..."
      }
    }
  }
}
```

**Namespacing**: Alle Keys sind unter `"common"` namespace organisiert.

## Synchronisierungs-Prozess

### 1. Keys Abgleichen

```bash
cd /c/Entwicklung/neuer-git-ordner/ki
node -e "
const fs=require('fs');
const de=JSON.parse(fs.readFileSync('frontend/src/locales/german.json','utf8'));
const en=JSON.parse(fs.readFileSync('frontend/src/locales/english.json','utf8'));
const walk=(o,p='')=>Object.entries(o).flatMap(([k,v])=>
  v&&typeof v==='object'&&!Array.isArray(v)?walk(v,p?p+'.'+k:k):[p?p+'.'+k:k]
);
const deKeys=new Set(walk(de));
const enKeys=new Set(walk(en));
const missingInEn=[...deKeys].filter(k=>!enKeys.has(k));
const missingInDe=[...enKeys].filter(k=>!deKeys.has(k));
console.log('Missing in EN',missingInEn.length,missingInEn);
console.log('Missing in DE',missingInDe.length,missingInDe);
"
```

### 2. Fehlende Keys Identifizieren

**Beispiel Output**:
```
Missing in EN 4 [
  'settings.specialization.uploadSuccess',
  'settings.specialization.activated',
  'settings.specialization.deleted',
  'pages.productAnalysis.title'
]
Missing in DE 0 []
```

### 3. Neue Keys Hinzufügen

#### Deutsche Keys zu Englisch hinzufügen

1. Öffne [frontend/src/locales/english.json](../../frontend/src/locales/english.json)
2. Finde entsprechende deutsche Übersetzung in [frontend/src/locales/german.json](../../frontend/src/locales/german.json)
3. Übersetze ins Englische
4. Füge Key mit gleicher Struktur ein

**Beispiel**:
```json
{
  "settings": {
    "specialization": {
      "uploadSuccess": "Specialization uploaded successfully",
      "activated": "Specialization activated",
      "deleted": "Specialization deleted"
    }
  }
}
```

#### Englische Keys zu Deutsch hinzufügen

1. Öffne [frontend/src/locales/german.json](../../frontend/src/locales/german.json)
2. Übersetze von Englisch zu Deutsch
3. Füge mit identischer Struktur ein

**Beispiel**:
```json
{
  "pages": {
    "payment": {
      "verifier": {
        "title": "✅ Payment-Verifizierer",
        "verify": "Payment verifizieren"
      }
    }
  }
}
```

### 4. Struktur-Fehler Beheben

**Häufiges Problem**: Doppelte `"pages"`-Objekte

❌ **Falsch**:
```json
{
  "pages": { /* Erste Gruppe */ },
  "pages": { /* Zweite Gruppe - ÜBERSCHREIBT erste! */ }
}
```

✅ **Richtig**:
```json
{
  "pages": {
    "analytics_pages": { /* ... */ },
    "payment": { /* ... */ },
    "product": { /* ... */ }
  }
}
```

**Lösung**: Alle Keys in ein einzelnes `"pages"` Objekt zusammenführen.

## Testing

### Format-Validierung

```bash
cd /c/Entwicklung/neuer-git-ordner/ki
node -e "
JSON.parse(require('fs').readFileSync('frontend/src/locales/german.json','utf8'));
console.log('✅ german.json ist gültiges JSON');
JSON.parse(require('fs').readFileSync('frontend/src/locales/english.json','utf8'));
console.log('✅ english.json ist gültiges JSON');
"
```

### React-i18next Tests

```bash
cd frontend
npm test -- i18n.test.ts
```

### Keys im Code verwenden

```typescript
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('settings.specialization.uploadSuccess')}</h1>;
}
```

## Best Practices

### 1. Konsistente Struktur
- Nutze Präfixe: `pages.`, `settings.`, `components.`, `error.`
- Nummeriere nicht durcheinander
- Gruppiere zusammenhängende Keys

### 2. Aussagekräftige Schlüssel
```json
// ✅ Gut
"error.connectionFailed": "Connection failed"

// ❌ Schlecht
"err1": "Error"
```

### 3. Emoji-Konsistenz
- Nutze gleiches Emoji in DE und EN
- Beispiel: `"🎯"` für Spezialisierungen

### 4. Sprachspezifische Anpassungen
- Nutze Umlaute in Deutsch: `ä, ö, ü, ß`
- Beachte unterschiedliche Längungen (EN oft kürzer)
- Behalte Tone of Voice: formell vs casual

## Häufige Fehler

| Fehler | Symptom | Lösung |
|--------|---------|--------|
| Doppelte `pages` | Keys verschwinden | In ein Objekt zusammenführen |
| Fehlende Kommas | JSON parsing error | Validator nutzen |
| Falsche Verschachtelung | Keys nicht gefunden | Struktur-Konsistenz prüfen |
| Übersetzung vergessen | Keys als fallback angezeigt | Beide Dateien synchron halten |

## Automatisierungs-Tipps

### VSCode JSON Schema
Nutze JSON Schema zur Validierung:
```json
{
  "fileMatch": ["**/locales/*.json"],
  "url": "file:///path/to/i18n-schema.json"
}
```

### Pre-commit Hook
```bash
#!/bin/bash
node -e "
const de=JSON.parse(require('fs').readFileSync('frontend/src/locales/german.json','utf8'));
const en=JSON.parse(require('fs').readFileSync('frontend/src/locales/english.json','utf8'));
// Validate here
" || exit 1
```

## Changelog

### [3. Januar 2026]
- ✅ Alle 122 fehlende Keys synchronisiert
- ✅ Doppelte `pages` Struktur entfernt
- ✅ Specialization Status Keys hinzugefügt
- ✅ ProductAnalysis Title hinzugefügt

## Siehe auch

- [i18n Test Suite](../../frontend/src/tests/i18n.test.ts)
- [react-i18next Dokumentation](https://react.i18next.com/)
- [I18N Implementation Complete](./I18N_IMPLEMENTATION_COMPLETE.md)
