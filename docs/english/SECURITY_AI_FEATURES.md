# 🔒 Security & Best Practices - WooProductUpdate AI/ML

**Date:** December 11, 2025  
**Classification:** Internal  
**Review Status:** ✅ Approved

---

## 🎯 Security Overview

The WooProductUpdate AI/ML System integrates **external APIs** (Google Trends, Reddit, OpenAI) with **E-Commerce Data** (WooCommerce). This guide documents all **security measures** and **best practices**.

---

## 🔐 1. API Security

### **1.1 Google Trends API**

**Status:** ✅ Secure  
**Authentication:** None (Public API)  
**Data Type:** Anonymous trend data

```typescript
// ✅ SECURE: No sensitive data
const result = await googleTrends.interestOverTime({
  keyword: productName,      // Public
  startTime: new Date(...),  // Public
  geo: 'DE'                  // Public
});

// ❌ INSECURE: Never User-IDs or Tracking
❌ userId: user.id
❌ sessionToken: auth.token
```

**Protection Mechanisms:**
- ✅ Read-only access
- ✅ No authentication required (no keys to protect)
- ✅ Rate-Limits: ~100 requests/day (monitor)
- ✅ No user data transmitted

**Implementation:**
```typescript
// Good: Error handling
try {
  const result = await googleTrends.interestOverTime({...})
} catch (error) {
  logger.warn('Google Trends unavailable, using fallback')
  return defaultScore
}

// Good: Set timeout
const controller = new AbortController()
setTimeout(() => controller.abort(), 5000)
const response = await fetch(url, { signal: controller.signal })
```

---

### **1.2 Reddit API**

**Status:** ✅ Secure (with restrictions)  
**Authentication:** None (Public API, Read-only)  
**Data Type:** Public posts

```typescript
// ✅ SECURE: Correct User-Agent
headers: {
  'User-Agent': 'KI-TrendAnalyzer/1.0 (by CompanyName)'
}

// ❌ INSECURE: Wrong or missing User-Agent
❌ 'User-Agent': 'Mozilla/5.0...' (misleading)
❌ No User-Agent (Reddit blocks)
```

**Protection Mechanisms:**
- ✅ Read-only access (only read data, don't post)
- ✅ No authentication required
- ✅ User-Agent present (Reddit requirement)
- ✅ Rate-Limiting: 60 requests/minute (implemented: 1.5s delay)
- ✅ Only public posts read
- ❌ No private/moderated data

**Implementation:**
```typescript
// Good: Rate-Limiting
for (const keyword of keywords) {
  const posts = await redditService.searchPosts(keyword)
  await new Promise(r => setTimeout(r, 1500)) // 1.5s delay
}

// Good: Error-Handling
try {
  const response = await axios.get(redditUrl, {
    timeout: 5000,
    headers: { 'User-Agent': userAgent }
  })
} catch (error) {
  if (error.response?.status === 429) {
    logger.warn('Reddit rate limit reached')
    return [] // Fallback
  }
}
```

**Reddit ToS Compliance:**
- ✅ Read-only (don't interact with posts)
- ✅ User-Agent present
- ✅ No data scraping for sale
- ✅ No user data collection
- ✅ No analysis of private communities

---

### **1.3 OpenAI API**

**Status:** ⚠️ Critical (API-Key required)  
**Authentication:** API-Key (SECRET)  
**Data Type:** Proprietary

```typescript
// ✅ SECURE: API-Key in backend
// .env
OPENAI_API_KEY=sk-proj-xxx...

// ❌ NEVER in frontend
❌ const key = import.meta.env.VITE_OPENAI_KEY
❌ fetch('/api/openai', { key: process.env.REACT_APP_API_KEY })
```

**Protection Mechanisms:**

1. **API-Key Management**
```typescript
// ✅ Backend access only
const apiKey = process.env.OPENAI_API_KEY // Server-side only
const openai = new OpenAI({ apiKey }) // Don't export!

// ❌ Never in Frontend/Client
// ❌ import { openai } from '@/utils/openai' (in React)
```

2. **Prompt-Injection Prevention**
```typescript
// ❌ INSECURE: Direct user input in prompt
const userInput = req.body.description // from user
const prompt = `Optimize: ${userInput}` // SQL-Injection possible

// ✅ SECURE: Input validation + Escaped strings
const userInput = req.body.description
if (!userInput?.trim() || userInput.length > 2000) {
  return 400 "Invalid input"
}
const prompt = `Optimize this: "${userInput.replace(/"/g, '\\"')}"` // Escaped
```

3. **Token & Cost Control**
```typescript
// ✅ Set token limits
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [...],
  max_tokens: 500, // Limit
  temperature: 0.4, // Consistent
})

// ✅ Usage tracking
logger.info({
  model: 'gpt-4',
  inputTokens: response.usage.prompt_tokens,
  outputTokens: response.usage.completion_tokens,
  estimatedCost: (response.usage.prompt_tokens * 0.03 + response.usage.completion_tokens * 0.06) / 1000
})
```

4. **Circuit Breaker & Retries**
```typescript
// ✅ Automatic fallback on error
try {
  return await executeOpenAI(fn, 'operation-name')
} catch (error) {
  logger.error('OpenAI failed, using default')
  return defaultValue // Fallback
}

// executeOpenAI includes:
// - Circuit Breaker (stop after 5 failures)
// - Exponential Retry (1s, 2s, 4s)
// - Timeout (30s)
```

---

## 🛡️ 2. WooCommerce API Security

### **2.1 Authentication**

```typescript
// ✅ SECURE: Basic Auth over HTTPS
const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
headers: {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json'
}

// ❌ INSECURE: Credentials in URL
❌ fetch(`${wooUrl}?key=${consumerKey}&secret=${consumerSecret}`)

// ❌ INSECURE: HTTP instead of HTTPS
❌ http://example.com/... (unencrypted!)
```

### **2.2 Input Validation**

```typescript
// ✅ SECURE: Validate all inputs
function validateProductId(id: any): number {
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('Invalid product ID')
  }
  return id
}

// ✅ SECURE: Validate prices
function validatePrice(price: any): number {
  const num = parseFloat(price)
  if (isNaN(num) || num <= 0 || num > 999999) {
    throw new Error('Invalid price')
  }
  return num
}

// ✅ SECURE: Sanitize strings
function sanitizeDescription(desc: any): string {
  if (typeof desc !== 'string' || desc.length > 10000) {
    throw new Error('Invalid description')
  }
  return desc.trim()
}
```

### **2.3 Update Restrictions**

```typescript
// ✅ SECURE: Only update allowed fields
const allowedFields = ['regular_price', 'description', 'stock_quantity', 'name']
const updatePayload = {}

for (const field of allowedFields) {
  if (field in request.body) {
    updatePayload[field] = request.body[field]
  }
}

// ❌ INSECURE: Accept all fields
const updatePayload = request.body // could contain status, author, etc.
```

### **2.4 Batch Operations**

```typescript
// ✅ SECURE: Limit to realistic number
const MAX_BATCH_SIZE = 100
if (productIds.length > MAX_BATCH_SIZE) {
  return 400 "Too many products"
}

// ✅ SECURE: Sequential with error handling
for (const productId of productIds) {
  try {
    await updateProduct(productId)
  } catch (error) {
    errors.push({ productId, error: error.message })
    // Continue with next (don't abort)
  }
}

// ❌ INSECURE: Massive parallel requests
await Promise.all(productIds.map(id => updateProduct(id))) // DDoS?
```

---

## 🔍 3. Data Protection

### **3.1 What Data is Stored**

| Data | Where | How Long | Visibility |
|------|-------|----------|------------|
| Trend Scores | Frontend State | Session | User only |
| Reddit Posts | Frontend State | Session | User only |
| Suggested Prices | Backend Logs | 7 days | Admin only |
| WooCommerce Updates | WooCommerce DB | Unlimited | Admin + Audit Trail |
| API Keys | Environment | Unlimited (!) | Nobody (secrets) |

### **3.2 PII Handling**

```typescript
// ✅ SECURE: No user data collection
const trendData = {
  keyword: 'product name',    // Public
  score: 87,                  // Calculated
  timestamp: '2025-12-11',    // Metadata
  // ❌ NO user.id, email, IP, etc.
}

// ✅ SECURE: Reddit posts are public (opt-in)
const posts = redditService.analyzePosts(productName)
// Posts are public on Reddit - no privacy issue

// ✅ SECURE: Logging without PII
logger.info({
  operation: 'trend-pricing',
  productId: 123,             // OK
  suggestedPrice: 279.99,     // OK
  // ❌ NOT: user.email, payment info, etc.
})
```

### **3.3 Data Retention**

```typescript
// ✅ Best Practice: Delete logs after 7 days
const olderThan7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
db.logs.deleteMany({ timestamp: { $lt: olderThan7Days } })

// ✅ Best Practice: Cache invalidation
const TREND_CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours
redis.setex(`trend:${keyword}`, 21600, JSON.stringify(data))

// ✅ Best Practice: Frontend cache clearing
// State is only kept for current session
// On page reload: everything gone
```

---

## 🚨 4. Error Handling & Logging

### **4.1 Secure Error Messages**

```typescript
// ❌ INSECURE: Detailed errors exposed
return reply.send({
  success: false,
  error: 'SELECT * failed: Syntax error near...',
  stack: 'at Database.query()...',
  database: 'mongodb://admin:pass@...'
})

// ✅ SECURE: Generic error messages
return reply.send({
  success: false,
  error: 'Database operation error',
  requestId: '550e8400-e29b-41d4-a716-446655440000'
})

// ✅ SECURE: Detailed logging (backend only)
logger.error({
  requestId: '550e8400...',
  operation: 'trend-pricing',
  actualError: 'MongoDB connection timeout',
  timestamp: new Date().toISOString()
})
```

### **4.2 Security Logging**

```typescript
// ✅ Log security-relevant events
logger.warn({
  event: 'HIGH_BATCH_REQUEST',
  productCount: 200,
  userId: 'user-123',
  timestamp: new Date(),
  action: 'BLOCKED' // If > MAX_BATCH_SIZE
})

logger.warn({
  event: 'RATE_LIMIT_EXCEEDED',
  endpoint: '/api/products/ai/trend-pricing',
  clientIp: req.ip,
  attempts: 150,
  timeframe: '1 hour'
})

logger.info({
  event: 'BULK_UPDATE_COMPLETED',
  productCount: 45,
  successCount: 43,
  failureCount: 2,
  duration: '2.3s'
})
```

---

## 📋 5. Compliance Checklist

### **GDPR (DSGVO)**
- ✅ No user data in APIs
- ✅ No tracking of individuals
- ✅ Logs are deleted after 7 days
- ✅ Privacy Policy updated
- ✅ Consent not needed (no PII)

### **Terms of Service**
- ✅ Google Trends: For product analytics only
- ✅ Reddit: Read-only, no scraping for sale
- ✅ OpenAI: Usage for internal optimization (OK)
- ✅ WooCommerce: API keys configured

### **Payment Card Security**
- ✅ No prices directly from AI without review (for critical products)
- ✅ Audit trail for all updates
- ✅ Manual approval for >50% price changes (recommended)

---

## 🔄 6. Security Review Checklist

**Before Production Deployment:**

- [ ] All API keys in `.env`, not in code
- [ ] HTTPS enabled for all endpoints
- [ ] CORS configured (own domain only)
- [ ] Rate-limiting active (see `fastify-rate-limit`)
- [ ] Input validation on all endpoints
- [ ] Error messages are generic (not detailed)
- [ ] Logging is running (important events tracked)
- [ ] Firewall rules checked (who can call API?)
- [ ] API quotas set (max X requests/day)
- [ ] Backup plan for API outages
- [ ] Monitoring & alerting configured
- [ ] Penetration test performed

---

## 🚀 7. Deployment Security

### **Environment Variables**

```bash
# ✅ SECURE: In .env.local (not in Git)
OPENAI_API_KEY=sk-proj-xxx...
WOOCOMMERCE_CONSUMER_KEY=ck_xxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxx

# ✅ SECURE: In Docker Secrets / K8s Secrets
docker secret create openai_key /run/secrets/openai_key

# ❌ INSECURE: In source code
// ❌ const API_KEY = "sk-proj-xxx"
// ❌ export const secret = "password123"
```

### **Network Security**

```yaml
# Kubernetes Network Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ki-backend-policy
spec:
  podSelector:
    matchLabels:
      app: ki-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: ki-frontend
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector: {}  # Allow all outbound (Google/Reddit/OpenAI)
    ports:
    - protocol: TCP
      port: 443  # HTTPS only
```

---

## 📞 Incident Response

### **If OpenAI API is compromised**

1. ✅ **Immediately:** Generate new API key
2. ✅ **Immediately:** Deactivate old key
3. ✅ **15min:** Deploy new key
4. ✅ **1h:** Check all requests from last 24h
5. ✅ **End of day:** Write incident report

### **If Reddit API Rate-Limited**

1. ✅ Enable cache (6h TTL)
2. ✅ Shift requests to non-critical times
3. ✅ Fallback to standard updates

### **If WooCommerce API Fails**

1. ✅ Show toast: "Updates delayed, please wait"
2. ✅ Queue all changes
3. ✅ Retry every 5 minutes
4. ✅ If still down after 1h: Notify admin

---

## 📚 Further Resources

- [OpenAI API Security Best Practices](https://platform.openai.com/docs/guides/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Reddit API Terms](https://www.reddit.com/dev/api)
- [GDPR Guidelines](https://www.bfdi.bund.de/)

---

**Last Review:** December 11, 2025  
**Next Review:** January 11, 2026  
**Owner:** @security-team
