# 🎯 A.R.I. Specializations - Documentation

**Version:** 7.0.2  
**Date:** January 2026  
**Status:** ✅ Fully implemented

---

## Overview

Specializations are industry-specific AI configurations that adapt A.R.I. for different business sectors. They are sold on **marketplace.example.com**, signed digitally, and installed locally.

**Features:**
- ✅ RSA-2048 signature validation
- ✅ AES-256-GCM encryption
- ✅ Local persistence with auto-load
- ✅ Race-condition protection (Mutex locking)
- ✅ SHA-256 integrity checks

---

## Architecture

### Central (marketplace.example.com)
- WooCommerce shop with digital products
- After purchase: RSA-signed JSON file generated
- Download link via email

### Decentralized (Each A.R.I. Installation)
- Upload in Settings → Specialization
- Validate signature (public key hardcoded)
- Encrypt with AES-256 and store
- AI integration: System prompt injection

---

## File Structure

```
backend/
  services/
    specializationPersistenceManager.ts  # Core CRUD operations
    specializationAutoLoad.ts            # Cache & auto-load
  routes/
    app/api/specializations/
      index.ts                           # Upload, List, Activate, Delete
  types/
    specialization.ts                    # TypeScript interfaces

frontend/
  src/pages/Settings/Settings.tsx        # Upload UI

data/specializations/
  ├── index.json                         # Inventory of all specs
  ├── active.json                        # Active spec per user
  ├── fallback.json                      # Fallback on error
  └── {userId}/
      └── {specId}.json                  # Specialization data
```

---

## API Endpoints

### GET `/api/specializations/list`
Lists all installed specializations.

**Response:**
```json
{
  "success": true,
  "specializations": [
    {
      "id": "travel-agency",
      "name": "Travel Agency Specialization",
      "description": "Optimized for tourism industry",
      "category": "Services",
      "version": "1.0.0",
      "features": ["Travel descriptions", "Hotel marketing"],
      "installedAt": 1733961600000,
      "isActive": true
    }
  ]
}
```

### POST `/api/specializations/upload`
Uploads signed specialization file.

**Request:**
```json
{
  "signedData": {
    "version": "1.0",
    "issuer": "marketplace.example.com",
    "timestamp": 1733961600000,
    "signature": "BASE64_RSA_SIGNATURE",
    "data": {
      "id": "travel-agency",
      "name": "Travel Agency Specialization",
      "systemPrompt": "You are a travel expert...",
      "contextInstructions": ["...", "..."]
    }
  }
}
```

### POST `/api/specializations/activate`
Activates a specialization (only one active).

**Request:**
```json
{
  "specId": "travel-agency"
}
```

### GET `/api/specializations/active`
Returns active specialization.

**Response:**
```json
{
  "success": true,
  "specialization": {
    "id": "travel-agency",
    "name": "Travel Agency Specialization",
    "systemPrompt": "You are a travel expert...",
    "contextInstructions": ["..."]
  }
}
```

### DELETE `/api/specializations/:specId`
Deletes a specialization.

---

## Security

### Signature System (RSA-2048)

**Generation (on marketplace):
```typescript
const signature = crypto.sign('sha256', Buffer.from(payload), {
  key: PRIVATE_KEY,
  padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
});
```

**Validation (in A.R.I.):**
```typescript
const KAUFE_ES_PUBLIC_KEY = process.env.SPEC_PUBLIC_KEY;
// Validates RSA signature before installation
```

### Encryption (AES-256-GCM)

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

### Integrity (SHA-256)

Each specialization receives a SHA-256 hash for corruption detection:

```typescript
const checksum = crypto
  .createHash('sha256')
  .update(JSON.stringify(specialization))
  .digest('hex');
```

---

## Persistence & Auto-Load

### Persistence

**Storage:** `data/specializations/{userId}/{specId}.json`

**Automatic save:**
```typescript
await SpecializationPersistenceManager.persistSpecialization(spec, userId);
```

### Auto-Load on Server Start

```typescript
// backend/server.ts
await initializeSpecializationAutoLoad(userId);

// Returns active specialization from cache
const active = getActiveSpecialization();
```

**Cache States:**
- `not-started` - Not started
- `loading` - Loading from disk
- `loaded` - Successfully loaded
- `failed` - Load error

### AI Integration

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

**Result:** Specialization prompts are injected as system messages.

---

## Concurrency Control

### Problem
Two concurrent requests could overwrite `active.json` → data loss.

### Solution: Mutex Locking

**SimpleMutex Implementation:**
```typescript
class SimpleMutex {
  async acquire(key: string): Promise<() => void>
}
```

**Lock Strategy:**
- Separate locks for different users → parallelism
- Same user serialized → no race conditions
- Lock key: `active-{userId}` or `spec-{userId}-{specId}`

**Atomic Writes:**
```
1. Write to ${filename}.tmp
2. Rename ${filename}.tmp → ${filename}  (atomic)
```

On crash, `.json` remains unchanged (only `.tmp` is corrupted).

---

## Testing

### Test Coverage: **148 Tests Passed** ✅

**Test Suites:**
1. **Persistence Tests** (20 Tests) - CRUD operations
2. **Auto-Load Tests** - Cache & state transitions
3. **Backup Manager Tests** (20 Tests) - Encryption/Decryption
4. **Encryption Flow Tests** (8 Tests) - End-to-End
5. **Concurrency Tests** - Race-condition prevention

**Execution:**
```bash
npm run test -- -t "Specialization"
npm run test -- -t "Concurrency"
npm run test -- -t "Encryption"
```

---

## Performance

**Benchmarks (Windows 11, Node.js 24):**

| Operation | Time |
|-----------|------|
| Load Single | 2-5ms |
| Persist | 7-10ms |
| List All | 1-3ms |
| Validate Integrity | 25-30ms |
| Cache Hit | < 1ms |
| Encryption | 2-4ms |

---

## Frontend Usage

### Settings → Specialization Tab

**Features:**
- ✅ Upload button for `.ari-spec` or `.json`
- ✅ Link to marketplace
- ✅ Grid with installed specializations
- ✅ Activate/Delete buttons
- ✅ ACTIVE badge
- ✅ Feature list

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
    setMessage('✅ Specialization installed');
  }
};
```

---

## Deployment Checklist

### Backend
- [ ] Set `SPEC_PUBLIC_KEY` in ENV (marketplace public key)
- [ ] Set `SPEC_ENCRYPTION_KEY` in ENV (32-byte key)
- [ ] Create `/data/specializations/` directory
- [ ] Enable API routes

### Frontend
- [ ] Configure `VITE_API_URL`
- [ ] Update link to marketplace

### Marketplace Setup
- [ ] Create WooCommerce products
- [ ] Setup webhook for JSON generation + signature
- [ ] Create email template with download link

---

## Troubleshooting

### Problem: Upload fails with "Invalid signature"
**Solution:** Check public key in backend (`SPEC_PUBLIC_KEY`)

### Problem: Specialization not displayed
**Solution:** Call `GET /api/specializations/list` and check response

### Problem: AI not using specialization
**Solution:** Call `AISpecializationHelper.invalidateCache()`

### Problem: Race condition errors
**Solution:** Mutex locking is applied automatically, check logs

---

## Specialization Ideas

- ✈️ **Travel Agency** (already implemented)
- 🏠 **Real Estate**
- 🛠️ **Tech Shop**
- 👗 **Fashion & Clothing**
- 🍕 **Gastronomy**
- 💼 **B2B Wholesale**
- 🎨 **Creative Industry**
- 🏋️ **Fitness & Sports**
- 📚 **Education**
- 🏥 **Health & Pharmacy**

---

## Summary

A.R.I. Specializations provide:

✅ **Secure Distribution:** RSA-2048 signature validation  
✅ **Secure Storage:** AES-256-GCM encryption  
✅ **Reliable Operations:** Mutex locking against race conditions  
✅ **Fast Integration:** AI prompt injection  
✅ **Thoroughly Tested:** 148+ tests passed  
✅ **Production-Ready:** Auto-load, fallback, monitoring  

**Distribution Channel:** marketplace.example.com  
**Technical Integration:** Web-based upload system  
**Scalability:** Unlimited specializations per user

**Version:** 7.0.2  
**Date:** January 2026  
**Author:** André Zabel (AndreZ1971)
