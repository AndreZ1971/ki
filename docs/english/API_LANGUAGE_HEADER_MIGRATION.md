# 🌐 API Language Header Migration Guide

## Problem

AI responds in German even when UI is set to English (and vice versa).

**Root Cause:** Frontend doesn't send language headers with API calls → Backend uses default (English) → AI receives English prompts.

## Solution

All API calls must include `X-Language` header.

### New Centralized API Client

**File:** `frontend/src/lib/api-client.ts`

Features:
- `apiFetch()` - Enhanced fetch with automatic language headers
- `apiClient.get/post/put/delete()` - Convenience wrappers
- `buildApiUrl()` - URL builder with VITE_API_URL
- `getApiLanguage()` - Get current language

### Migration Steps

#### 1. Change Import

**Before:**
```typescript
const response = await fetch('/api/products/ai/generate-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Product' })
});
```

**After:**
```typescript
import { apiClient } from '@/lib/api-client';

const response = await apiClient.post('/api/products/ai/generate-description', {
  name: 'Product'
});
```

#### 2. Or: apiFetch for Custom Requests

```typescript
import { apiFetch } from '@/lib/api-client';

const response = await apiFetch('/api/products/ai/generate-description', {
  method: 'POST',
  body: JSON.stringify({ name: 'Product' })
});
// X-Language header is automatically added
```

## Affected Files (Priority 1 - AI Responses)

### Critical (AI generates text):

1. **ProductManagement:**
   - `WooProductCreate.tsx` - `/api/products/ai/generate-description`
   - `WooProductCreate.tsx` - `/api/products/ai/seo-optimize`
   - `WooProductUpdate.tsx` - `/api/products/ai/optimize-description-trends`
   - `RunAutoProductCreator.tsx` - `/api/products/auto-create`
   - `MLFreebieGenerator.tsx` - `/api/freebies/ml/generate`

2. **Marketing:**
   - `GermanContentGenerator.tsx` - `/api/marketing/content/german` ⚠️ Hardcoded to German
   - `AudioScriptGenerator.tsx` - `/api/marketing/audio-script`
   - All `/api/ai/email/*` Endpoints

3. **AnalyseMetrics:**
   - `PremiumAudit.tsx` - `/api/audit/premium/scan`
   - `StandardAudit.tsx` - `/api/audit/standard/scan`
   - `RunTrendAnalysis.tsx` - `/api/ml/test/trends`

4. **ML/Personalization:**
   - `MLPersonalization.tsx` - `/api/ml/personalization/offers`
   - `MLPaymentAnalyzer.tsx` - `/api/payment/ml/analyze`

### Less Critical (Data fetching without AI text):

- `UserManagement.tsx` - `/api/woocommerce/customers`
- `ProductAnalyzer.tsx` - `/api/products/woo/*`
- `ShopHealthReport.tsx` - `/api/health/*`

## Backend: X-Language Header Usage

Backend is already prepared:

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

### Phase 1 (✅ Completed):
- ✅ `WooProductCreate.tsx` - 5 API Calls
- ✅ `WooProductUpdate.tsx` - 5 API Calls
- ✅ `GermanContentGenerator.tsx` - 1 API Call

### Phase 2 (✅ Completed):
- ✅ `RunAutoProductCreator.tsx` - 2 API Calls
- ✅ `ProductAnalyzer.tsx` - 4 API Calls
- ✅ `PremiumAudit.tsx` - 3 API Calls
- ✅ `StandardAudit.tsx` - 3 API Calls
- ✅ `MLPersonalization.tsx` - 1 API Call
- ✅ `MLPaymentAnalyzer.tsx` - 1 API Call

**Total:** 25 critical AI endpoints migrated ✅

## Testing

1. **Switch UI to English**
2. **Use AI feature** (e.g., generate product description)
3. **Check result:** Should now be in English
4. **Switch back to German** → Should be in German again

## Code Examples

### Before/After: WooProductCreate.tsx

**Before:**
```typescript
const response = await fetch('/api/products/ai/generate-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: productName })
});
const data = await response.json();
```

**After:**
```typescript
import { apiClient } from '../../lib/api-client';

const data = await apiClient.post('/api/products/ai/generate-description', {
  name: productName
});
```

### Before/After: MLPersonalization.tsx

**Before:**
```typescript
const res = await fetch(`/api/ml/personalization/offers?userId=${userId}`);
const data = await res.json();
```

**After:**
```typescript
import { apiClient } from '../../lib/api-client';

const data = await apiClient.get(`/api/ml/personalization/offers?userId=${userId}`);
```

## Special Case: GermanContentGenerator

This component is explicitly for German content. Two options:

**Option A:** Rename to "ContentGenerator" + Language Support
**Option B:** Force German in body instead of header

Recommendation: **Option A** - Makes tool multilingual.

## Implementation Details

### API Client Architecture

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
    'X-Language': getCurrentLanguage(), // 'de' or 'en'
    'Accept-Language': getAcceptLanguage(), // 'de-DE' or 'en-US'
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

## Benefits

✅ **Automatic:** No more manual header management
✅ **Consistent:** All API calls use same logic
✅ **Maintainable:** Central changes instead of 25+ files
✅ **Type-Safe:** TypeScript support
✅ **Clean Code:** Less boilerplate

## Known Limitations

⚠️ **Client-side only:** Server-Side Rendering (SSR) requires separate solution
⚠️ **Cookie-based auth:** If cookie headers are needed, must add `credentials: 'include'`
⚠️ **CORS:** For cross-origin requests, backend must allow X-Language in Access-Control-Allow-Headers

## Git Commits

- `940ccf5` - Phase 1: 11 critical endpoints
- `5d89dec` - Phase 2: 14 additional endpoints

---

**Created:** 2026-01-04  
**Status:** ✅ Completed  
**Owner:** Dev Team  
**Total Time:** ~4 hours
