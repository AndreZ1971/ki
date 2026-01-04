# 🌐 API Language Header Migration Guide

## Problem

KI antwortet auf Deutsch, obwohl UI auf Englisch ist (und umgekehrt).

**Ursache:** Frontend sendet keine Language-Header bei API-Calls → Backend nutzt Default (English) → KI bekommt englische Prompts.

## Lösung

Alle API-Calls müssen `X-Language` Header mitschicken.

### Neuer zentraler API-Client

**Datei:** `frontend/src/lib/api-client.ts`

Bietet:
- `apiFetch()` - Enhanced fetch mit automatischen Language-Headern
- `apiClient.get/post/put/delete()` - Convenience-Wrapper
- `buildApiUrl()` - URL-Builder mit VITE_API_URL
- `getApiLanguage()` - Aktuelle Sprache holen

### Migration Steps

#### 1. Import ändern

**Vorher:**
```typescript
const response = await fetch('/api/products/ai/generate-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Product' })
});
```

**Nachher:**
```typescript
import { apiClient } from '@/lib/api-client';

const response = await apiClient.post('/api/products/ai/generate-description', {
  name: 'Product'
});
```

#### 2. Oder: apiFetch für custom Requests

```typescript
import { apiFetch } from '@/lib/api-client';

const response = await apiFetch('/api/products/ai/generate-description', {
  method: 'POST',
  body: JSON.stringify({ name: 'Product' })
});
// X-Language header wird automatisch hinzugefügt
```

## Betroffene Dateien (Priority 1 - KI-Responses)

### Kritisch (KI generiert Text):

1. **ProductManagement:**
   - `WooProductCreate.tsx` - `/api/products/ai/generate-description`
   - `WooProductCreate.tsx` - `/api/products/ai/seo-optimize`
   - `WooProductUpdate.tsx` - `/api/products/ai/optimize-description-trends`
   - `RunAutoProductCreator.tsx` - `/api/products/auto-create`
   - `MLFreebieGenerator.tsx` - `/api/freebies/ml/generate`

2. **Marketing:**
   - `GermanContentGenerator.tsx` - `/api/marketing/content/german` ⚠️ Hardcoded auf Deutsch
   - `AudioScriptGenerator.tsx` - `/api/marketing/audio-script`
   - Alle `/api/ai/email/*` Endpoints

3. **AnalyseMetrics:**
   - `PremiumAudit.tsx` - `/api/audit/premium/scan`
   - `StandardAudit.tsx` - `/api/audit/standard/scan`
   - `RunTrendAnalysis.tsx` - `/api/ml/test/trends`

4. **ML/Personalization:**
   - `MLPersonalization.tsx` - `/api/ml/personalization/offers`
   - `MLPaymentAnalyzer.tsx` - `/api/payment/ml/analyze`

### Weniger kritisch (Datenabruf ohne KI-Text):

- `UserManagement.tsx` - `/api/woocommerce/customers`
- `ProductAnalyzer.tsx` - `/api/products/woo/*`
- `ShopHealthReport.tsx` - `/api/health/*`

## Backend: X-Language Header Nutzung

Backend ist bereits vorbereitet:

```typescript
// backend/services/i18nService.ts
getLocaleFromHeaders(headers: Record<string, unknown>): string {
  // 1. X-Language (Priority)
  const xLanguage = headers['x-language'];
  if (typeof xLanguage === 'string') {
    return this.normalizeLocale(xLanguage);
  }
  
  // 2. Accept-Language (Fallback)
  const acceptLanguage = headers['accept-language'];
  // ...
  
  // 3. Default: english
  return this.defaultLocale;
}
```

## Migration Status

### Phase 1 (✅ Abgeschlossen):
- ✅ `WooProductCreate.tsx` - 5 API Calls
- ✅ `WooProductUpdate.tsx` - 5 API Calls
- ✅ `GermanContentGenerator.tsx` - 1 API Call

### Phase 2 (✅ Abgeschlossen):
- ✅ `RunAutoProductCreator.tsx` - 2 API Calls
- ✅ `ProductAnalyzer.tsx` - 4 API Calls
- ✅ `PremiumAudit.tsx` - 3 API Calls
- ✅ `StandardAudit.tsx` - 3 API Calls
- ✅ `MLPersonalization.tsx` - 1 API Call
- ✅ `MLPaymentAnalyzer.tsx` - 1 API Call

**Gesamt:** 25 kritische KI-Endpoints migriert ✅

## Testing

1. **Sprache auf Englisch umstellen**
2. **KI-Feature nutzen** (z.B. Produktbeschreibung generieren)
3. **Ergebnis prüfen:** Sollte jetzt auf Englisch sein
4. **Zurück auf Deutsch** → Sollte wieder deutsch sein

## Code-Beispiele

### Before/After: WooProductCreate.tsx

**Vorher:**
```typescript
const response = await fetch('/api/products/ai/generate-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: productName })
});
const data = await response.json();
```

**Nachher:**
```typescript
import { apiClient } from '../../lib/api-client';

const data = await apiClient.post('/api/products/ai/generate-description', {
  name: productName
});
```

### Before/After: MLPersonalization.tsx

**Vorher:**
```typescript
const res = await fetch(`/api/ml/personalization/offers?userId=${userId}`);
const data = await res.json();
```

**Nachher:**
```typescript
import { apiClient } from '../../lib/api-client';

const data = await apiClient.get(`/api/ml/personalization/offers?userId=${userId}`);
```

## Spezialfall: GermanContentGenerator

Diese Komponente ist explizit für deutsche Inhalte. Zwei Optionen:

**Option A:** Umbenennen zu "ContentGenerator" + Language-Support
**Option B:** Force German im Body statt Header

Empfehlung: **Option A** - Macht Tool mehrsprachig.

## Implementierungs-Details

### API Client Architektur

```typescript
// frontend/src/lib/api-client.ts
export const apiClient = {
  get: (url: string) => apiFetch(url, { method: 'GET' }),
  post: (url: string, data: any) => apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  put: (url: string, data: any) => apiFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (url: string) => apiFetch(url, { method: 'DELETE' })
};

function apiFetch(url: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Language': getCurrentLanguage(), // 'de' oder 'en'
    'Accept-Language': getAcceptLanguage(), // 'de-DE' oder 'en-US'
    ...options.headers
  };
  
  return fetch(buildApiUrl(url), { ...options, headers })
    .then(res => res.json());
}
```

### Language Detection

```typescript
function getCurrentLanguage(): string {
  // 1. React i18n Context (localStorage + State)
  const i18nLanguage = i18n.language;
  if (i18nLanguage) return i18nLanguage;
  
  // 2. Browser Language
  const browserLang = navigator.language.split('-')[0];
  if (['de', 'en'].includes(browserLang)) return browserLang;
  
  // 3. Default
  return 'de';
}
```

## Vorteile

✅ **Automatisch:** Keine manuelle Header-Verwaltung mehr
✅ **Konsistent:** Alle API-Calls nutzen gleiche Logik
✅ **Wartbar:** Zentrale Änderungen statt 25+ Files
✅ **Type-Safe:** TypeScript Support
✅ **Clean Code:** Weniger Boilerplate

## Bekannte Einschränkungen

⚠️ **Nur clientseitige Requests:** Server-Side Rendering (SSR) benötigt separate Lösung
⚠️ **Cookie-basierte Auth:** Falls Cookie-Header benötigt werden, muss `credentials: 'include'` ergänzt werden
⚠️ **CORS:** Bei Cross-Origin Requests muss Backend X-Language in Access-Control-Allow-Headers erlauben

## Git Commits

- `940ccf5` - Phase 1: 11 kritische Endpoints
- `5d89dec` - Phase 2: 14 weitere Endpoints

---

**Erstellt:** 2026-01-04  
**Status:** ✅ Abgeschlossen  
**Verantwortlich:** Dev Team  
**Gesamtzeit:** ~4 Stunden
