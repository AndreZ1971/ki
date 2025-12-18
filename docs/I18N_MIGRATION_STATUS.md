# 🌐 i18n Migration Guide - Phase 1 Frontend

## ✅ Abgeschlossen

### 1. Locale-Files erweitert
- ✅ `frontend/src/locales/german.json` - 150+ neue Übersetzungskeys
- ✅ `frontend/src/locales/english.json` - 150+ englische Übersetzungen

### 2. Shared Components konvertiert
- ✅ `BackButton.tsx` - nutzt `t('common.back')`
- ✅ `LoadingButton.tsx` - nutzt `t('common.loading')`

### Neue Translation Keys (Auswahl):

```json
{
  "common": { "back", "save", "copy", "generate", "analyze" },
  "settings": {
    "tabs": { "connection", "specialization", "license" },
    "connection": { "wooUrl", "consumerKey", "testConnection" }
  },
  "dashboard": { "title", "subtitle", "searchPlaceholder", "categories" },
  "marketing": { "germanContent", "emailAutomation" },
  "payment": { "simplified" },
  "analytics": { "shopMetrics" }
}
```

---

## 🔧 Wie man eine Page konvertiert (Template)

### Beispiel: GermanContentGenerator.tsx

**VORHER:**
```tsx
import React, { useState } from 'react';
import { BackButton, LoadingButton } from '../../components/shared';

const GermanContentGenerator: React.FC = () => {
  return (
    <div>
      <BackButton onClick={handleBack} />
      <h1>🇩🇪 Content Generator</h1>
      <p>Deutsche Content-Erstellung für lokales Marketing</p>
      
      <label>Thema / Produkt</label>
      <input placeholder="z.B. DSGVO-konforme Software" />
      
      <LoadingButton 
        onClick={handleGenerate}
        loading={loading}
        loadingText="Generiere Content..."
      >
        🚀 Content Generieren
      </LoadingButton>
    </div>
  );
};
```

**NACHHER:**
```tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackButton, LoadingButton } from '../../components/shared';

const GermanContentGenerator: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <BackButton onClick={handleBack} />
      <h1>{t('marketing.germanContent.title')}</h1>
      <p>{t('marketing.germanContent.subtitle')}</p>
      
      <label>{t('marketing.germanContent.topic')}</label>
      <input placeholder={t('marketing.germanContent.topicPlaceholder')} />
      
      <LoadingButton 
        onClick={handleGenerate}
        loading={loading}
        loadingText={t('marketing.germanContent.generating')}
      >
        {t('marketing.germanContent.generate')}
      </LoadingButton>
    </div>
  );
};
```

**Änderungen:**
1. Import hinzufügen: `import { useTranslation } from 'react-i18next';`
2. Hook aufrufen: `const { t } = useTranslation();`
3. Alle Strings ersetzen: `"Text"` → `{t('translation.key')}`
4. Placeholders ersetzen: `placeholder="..."` → `placeholder={t('...')}`
5. Button-Text: `children` prop mit `{t('...')}`

---

## 📋 TODO: Verbleibende Pages

### High Priority (viel genutzt):
- [ ] `Settings.tsx` - 200+ Strings (Tabs, Forms, Labels)
- [ ] `AIDashboard.tsx` - 50+ Tool-Beschreibungen
- [ ] `GermanContentGenerator.tsx` - 50+ Strings
- [ ] `EmailMarketingAutomation.tsx` - 40+ Strings
- [ ] `PaymentSimplified.tsx` - 30+ Strings

### Medium Priority:
- [ ] `ShopMetrics.tsx` - Metrics Labels
- [ ] `CustomerAnalysis.tsx` - Tabellen-Headers
- [ ] `ProductAnalyzer.tsx` - Analyse-Labels
- [ ] `ContentMonetized.tsx` - Form-Fields

### Low Priority:
- [ ] Alle anderen Marketing-Pages
- [ ] Analytics-Pages
- [ ] Advanced-Tools

---

## 🛠️ Workflow für weitere Konvertierung:

1. **Page öffnen** → Hardcoded-Strings finden
2. **Translation Keys definieren** in `german.json` + `english.json`
3. **useTranslation Hook** importieren
4. **Strings ersetzen** mit `t()` Aufrufen
5. **Build testen** mit `npm run build`
6. **Funktionstest** im Browser mit Sprach-Umschaltung

---

## ⚡ Quick Commands:

```bash
# Build testen
cd frontend && npm run build

# Dev-Server mit Live-Reload
npm run dev

# Nur TypeScript-Check
npm run type-check
```

---

## 📊 Progress Tracking:

- **Locale Files**: ✅ 150+ Keys (DE + EN)
- **Shared Components**: ✅ 2/3 (BackButton, LoadingButton)
- **Pages konvertiert**: 0/50+ ⏳
- **Geschätzter Aufwand**: ~8-12 Stunden für alle Pages

**Nächster Schritt**: Settings.tsx konvertieren (größte Impact)
