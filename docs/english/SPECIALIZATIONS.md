# 🎯 A.R.I. Specialization System

## Overview

The specialization system extends A.R.I. with industry-specific prompts and context. Specializations are sold on **kaufe-es.eu**, delivered as signed JSON files, and locally installed in each A.R.I. instance.

---

## 🏗️ Architecture

### **Central (kaufe-es.eu)**
- WooCommerce shop with digital products
- After purchase: Generation of a signed JSON file
- Download link sent via email to customers

### **Decentralized (each A.R.I.)**
- Upload function in Settings
- Signature validation (Public key hardcoded)
- AES-256 encryption
- Local storage in `/data/specializations/{userId}/{specId}.enc`
- AI integration: System prompt injection

---

## 📂 File Structure

```
backend/
  types/
    specialization.ts          # TypeScript interfaces
  services/
    specializationService.ts   # Core logic (Validate, Encrypt, Store, Decrypt)
  routes/
    app/
      api/
        specializations/
          index.ts             # API endpoints (upload, list, activate, delete)
  utils/
    aiSpecializationHelper.ts  # AI integration helper
  data/
    specializations/
      default/                 # User ID (currently fixed to "default")
        metadata.json          # List of all installed specs
        reisebuero.enc         # Encrypted specialization
    test-specializations/
      reisebuero-test.json     # Test file for development

frontend/
  src/
    pages/
      Settings/
        Settings.tsx           # Upload + management UI
```

---

## 🔐 Signature System

### **1. Generation (kaufe-es.eu Backend)**

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

### **2. Validation (A.R.I. Backend)**

Public key is hardcoded in `specializationService.ts`:

```typescript
const KAUFE_ES_PUBLIC_KEY = process.env.SPEC_PUBLIC_KEY || `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`;

SpecializationService.validateSignature(signedSpec);
```

---

## 📡 API Endpoints

### **GET `/api/specializations/list`**
Lists all installed specializations.

**Response:**
```json
{
  "success": true,
  "specializations": [
    {
      "id": "reisebuero",
      "name": "Travel Agency Specialization",
      "description": "Optimized for travel and tourism industry",
      "category": "Services",
      "icon": "✈️",
      "version": "1.0.0",
      "features": ["Travel descriptions", "Hotel marketing", "..."],
      "installedAt": 1733961600000,
      "filePath": "/data/specializations/default/reisebuero.enc",
      "isActive": true
    }
  ]
}
```

---

### **POST `/api/specializations/upload`**
Uploads a signed specialization file.

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
      "name": "Travel Agency Specialization",
      "systemPrompt": "You are a travel expert...",
      "contextInstructions": ["...", "..."]
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Specialization \"Travel Agency Specialization\" successfully installed!",
  "specialization": {
    "id": "reisebuero",
    "name": "Travel Agency Specialization",
    "description": "..."
  }
}
```

---

### **POST `/api/specializations/activate`**
Activates an installed specialization (only one can be active at a time).

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
  "message": "Specialization activated"
}
```

---

### **DELETE `/api/specializations/:specId`**
Deletes an installed specialization.

**Response:**
```json
{
  "success": true,
  "message": "Specialization deleted"
}
```

---

### **GET `/api/specializations/active`**
Returns the currently active specialization.

**Response:**
```json
{
  "success": true,
  "specialization": {
    "id": "reisebuero",
    "name": "Travel Agency Specialization",
    "systemPrompt": "You are a travel expert...",
    "contextInstructions": ["...", "..."]
  }
}
```

If none is active: `{ "success": true, "specialization": null }`

---

## 🤖 AI Integration

### **Usage in OpenAI Calls**

```typescript
import { AISpecializationHelper } from '../utils/aiSpecializationHelper';

// Example: Generate product description
const messages = await AISpecializationHelper.buildOpenAIMessages(
  'You are a professional e-commerce assistant.', // Base system prompt
  'Create a description for a round trip through Vietnam',  // User prompt
  [],        // Conversation history (optional)
  'default'  // User ID
);

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages
});
```

**Resulting Messages:**
```javascript
[
  { role: 'system', content: 'You are a professional e-commerce assistant.' },
  { role: 'system', content: '## ACTIVE SPECIALIZATION: Travel Agency Specialization\n\nYou are a highly specialized AI assistant for the travel and tourism industry...' },
  { role: 'system', content: '### ADDITIONAL CONTEXT INSTRUCTIONS:\n1. Prioritize safety warnings...\n2. Always mention cancellation terms...' },
  { role: 'user', content: '[Context: Specialization "Travel Agency Specialization" active]\n\nCreate a description for a round trip through Vietnam' }
]
```

### **Helper Functions**

```typescript
// Create system messages
const systemMessages = await AISpecializationHelper.buildSystemMessages(basePrompt, userId);

// Enhance user prompt
const enhancedPrompt = await AISpecializationHelper.enhanceUserPrompt(userPrompt, userId);

// Check if specialization is active
const hasSpec = await AISpecializationHelper.hasActiveSpecialization(userId);

// Get name of active specialization
const name = await AISpecializationHelper.getActiveSpecializationName(userId);

// Invalidate cache (after activation)
AISpecializationHelper.invalidateCache();
```

---

## 🎨 Frontend UI

### **Settings → Specialization Tab**

**Features:**
- ✅ Upload button for `.json` files
- ✅ Link to kaufe-es.eu marketplace
- ✅ Grid with all installed specializations
- ✅ Activate button (only one can be active)
- ✅ Delete button
- ✅ Status indicator (ACTIVE badge)
- ✅ Feature list (truncated to 3 + "more...")
- ✅ Hover effects

---

## 🧪 Testing

### **Upload Test Specialization**

1. Open `backend/data/test-specializations/reisebuero-test.json`
2. Go to **Settings → Specialization**
3. Click "📤 Select file"
4. Choose `reisebuero-test.json`
5. Result: **Mock signature** will be accepted (as public key is not validated in test environment)

### **Production: Real Signature**

For production:
1. kaufe-es.eu must generate an **RSA-2048 keypair**
2. Store **private key** on kaufe-es.eu backend (signs specializations)
3. Add **public key** to A.R.I. backend (`SPEC_PUBLIC_KEY` environment variable)

---

## 🔒 Encryption

**Algorithm:** AES-256-GCM

**Key:** 32-byte key from environment variable `SPEC_ENCRYPTION_KEY`

**Storage Format:**
```json
{
  "iv": "HEX_STRING",
  "authTag": "HEX_STRING",
  "data": "ENCRYPTED_HEX_DATA"
}
```

---

## 🚀 Deployment Checklist

### **Backend**
- [ ] Set `SPEC_PUBLIC_KEY` in environment (kaufe-es.eu public key)
- [ ] Set `SPEC_ENCRYPTION_KEY` in environment (32-byte key)
- [ ] Create `/data/specializations/` directory (automatic, but verify)
- [ ] Enable API route `/api/specializations/*`

### **Frontend**
- [ ] `VITE_API_URL` correctly configured
- [ ] Update link to kaufe-es.eu marketplace (verify URL)

### **kaufe-es.eu**
- [ ] Create WooCommerce products (digital downloads)
- [ ] Webhook `order_completed` → JSON generation + signature
- [ ] Email template with download link

---

## 📝 Example Specializations (Ideas)

- ✈️ **Travel Agency** (implemented)
- 🏠 **Real Estate**
- 🛠️ **Tech Shop / Electronics**
- 👗 **Fashion & Clothing**
- 🍕 **Gastronomy / Restaurant**
- 💼 **B2B / Wholesale**
- 🎨 **Creative Industry / Artist**
- 🏋️ **Fitness / Sports Equipment**
- 📚 **Education / E-Learning**
- 🏥 **Health / Pharmacy**

---

## 🆘 Troubleshooting

**Problem:** Upload fails with "Invalid signature"
- **Solution:** Check public key in backend (`SPEC_PUBLIC_KEY`)
- **Test:** Mock signature in `reisebuero-test.json` should still work

**Problem:** Specialization not displayed
- **Solution:** Call `GET /api/specializations/list`, check response
- **Solution:** Check `metadata.json` in `/data/specializations/default/`

**Problem:** AI not using specialization
- **Solution:** Call `AISpecializationHelper.invalidateCache()`
- **Solution:** Check if specialization is active (`isActive: true`)

**Problem:** Encryption fails
- **Solution:** `SPEC_ENCRYPTION_KEY` must be exactly 32 bytes

---

## 📊 Metrics & Analytics (TODO)

- [ ] Tracking: Which specializations are most popular?
- [ ] Conversion: Uploads → Activations
- [ ] Usage: How often is active specialization used in AI calls?
- [ ] Feedback: User ratings for specializations

---

## 🔮 Roadmap

**Q1 2025:**
- [ ] Publish top 10 specializations on kaufe-es.eu
- [ ] Multi-user support (currently only "default" user)
- [ ] Specialization version management (updates)

**Q2 2025:**
- [ ] Community marketplace (users can create/sell their own specializations)
- [ ] A/B testing for specializations
- [ ] Specialization combinations (e.g., "Travel Agency + Sustainability")

**Q3 2025:**
- [ ] AI-generated specializations (user describes industry → AI creates specialization)
- [ ] White-label specializations for enterprise customers
