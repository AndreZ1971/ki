# 🔒 Security & Best Practices - WooProductUpdate AI/ML

**Datum:** 11. Dezember 2025  
**Klassifizierung:** Internal  
**Review-Status:** ✅ Approved

---

## 🎯 Security Overview

Das WooProductUpdate AI/ML System integriert **externe APIs** (Google Trends, Reddit, OpenAI) mit **E-Commerce Daten** (WooCommerce). Dieser Leitfaden dokumentiert alle **Sicherheitsmaßnahmen** und **Best Practices**.

---

## 🔐 1. API-Security

### **1.1 Google Trends API**

**Status:** ✅ Sicher  
**Authentifizierung:** Keine (Public API)  
**Datentyp:** Anonyme Trend-Daten

```typescript
// ✅ SICHER: Keine sensiblen Daten
const result = await googleTrends.interestOverTime({
  keyword: productName,      // Öffentlich
  startTime: new Date(...),  // Öffentlich
  geo: 'DE'                  // Öffentlich
});

// ❌ UNSICHER: Niemals User-IDs or Tracking
❌ userId: user.id
❌ sessionToken: auth.token
```

**Schutzmechanismen:**
- ✅ Read-only Zugriff
- ✅ Keine Authentifizierung erforderlich (keine Keys zu schützen)
- ✅ Rate-Limits: ~100 requests/Tag (kontrollieren)
- ✅ Keine Benutzer-Daten übertragen

**Implementierung:**
```typescript
// Good: Fehlerbehandlung
try {
  const result = await googleTrends.interestOverTime({...})
} catch (error) {
  logger.warn('Google Trends unavailable, using fallback')
  return defaultScore
}

// Good: Timeout setzen
const controller = new AbortController()
setTimeout(() => controller.abort(), 5000)
const response = await fetch(url, { signal: controller.signal })
```

---

### **1.2 Reddit API**

**Status:** ✅ Sicher (mit Einschränkungen)  
**Authentifizierung:** Keine (Public API, Read-only)  
**Datentyp:** Öffentliche Posts

```typescript
// ✅ SICHER: User-Agent korrekt
headers: {
  'User-Agent': 'KI-TrendAnalyzer/1.0 (by Geschäftsinhaberfirma)'
}

// ❌ UNSICHER: Falsche oder fehlende User-Agent
❌ 'User-Agent': 'Mozilla/5.0...' (misleading)
❌ Keine User-Agent (Reddit blockiert)
```

**Schutzmechanismen:**
- ✅ Read-only Zugriff (nur Daten lesen, nicht posten)
- ✅ Keine Authentifizierung erforderlich
- ✅ User-Agent vorhanden (Reddit requirement)
- ✅ Rate-Limiting: 60 requests/minute (implementiert: 1,5s delay)
- ✅ Nur öffentliche Posts gelesen
- ❌ Keine privaten/moderierten Daten

**Implementierung:**
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
- ✅ Read-only (nicht mit Posts interagieren)
- ✅ User-Agent vorhanden
- ✅ Keine Daten-Scraping für Verkauf
- ✅ Keine Benutzer-Daten sammeln
- ✅ keine Analyse von privaten Communities

---

### **1.3 OpenAI API**

**Status:** ⚠️ Kritisch (API-Key erforderlich)  
**Authentifizierung:** API-Key (GEHEIM)  
**Datentyp:** Proprietary

```typescript
// ✅ SICHER: API-Key im Backend
// .env
OPENAI_API_KEY=sk-proj-xxx...

// ❌ NIEMALS im Frontend
❌ const key = import.meta.env.VITE_OPENAI_KEY
❌ fetch('/api/openai', { key: process.env.REACT_APP_API_KEY })
```

**Schutzmechanismen:**

1. **API-Key Management**
```typescript
// ✅ Nur Backend Zugriff
const apiKey = process.env.OPENAI_API_KEY // Server-side only
const openai = new OpenAI({ apiKey }) // Nicht exportieren!

// ❌ Niemals in Frontend/Client
// ❌ import { openai } from '@/utils/openai' (in React)
```

2. **Prompt-Injection Prevention**
```typescript
// ❌ UNSICHER: Direkte User-Input im Prompt
const userInput = req.body.description // from user
const prompt = `Optimize: ${userInput}` // SQL-Injection möglich

// ✅ SICHER: Input-Validierung + Escaped Strings
const userInput = req.body.description
if (!userInput?.trim() || userInput.length > 2000) {
  return 400 "Invalid input"
}
const prompt = `Optimize this: "${userInput.replace(/"/g, '\\"')}"` // Escaped
```

3. **Token & Cost Control**
```typescript
// ✅ Token-Limits setzen
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [...],
  max_tokens: 500, // Limit
  temperature: 0.4, // Konsistent
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
// ✅ Automatischer Fallback bei Fehler
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
// ✅ SICHER: Basic Auth über HTTPS
const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
headers: {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json'
}

// ❌ UNSICHER: Credentials in URL
❌ fetch(`${wooUrl}?key=${consumerKey}&secret=${consumerSecret}`)

// ❌ UNSICHER: HTTP statt HTTPS
❌ http://example.com/... (unverschlüsselt!)
```

### **2.2 Input Validation**

```typescript
// ✅ SICHER: Validate all inputs
function validateProductId(id: any): number {
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('Invalid product ID')
  }
  return id
}

// ✅ SICHER: Validate prices
function validatePrice(price: any): number {
  const num = parseFloat(price)
  if (isNaN(num) || num <= 0 || num > 999999) {
    throw new Error('Invalid price')
  }
  return num
}

// ✅ SICHER: Sanitize strings
function sanitizeDescription(desc: any): string {
  if (typeof desc !== 'string' || desc.length > 10000) {
    throw new Error('Invalid description')
  }
  return desc.trim()
}
```

### **2.3 Update Restrictions**

```typescript
// ✅ SICHER: Nur erlaubte Felder updaten
const allowedFields = ['regular_price', 'description', 'stock_quantity', 'name']
const updatePayload = {}

for (const field of allowedFields) {
  if (field in request.body) {
    updatePayload[field] = request.body[field]
  }
}

// ❌ UNSICHER: Alle Felder akzeptieren
const updatePayload = request.body // könnte status, author, etc. enthalten
```

### **2.4 Batch Operations**

```typescript
// ✅ SICHER: Limit auf realistisch Anzahl
const MAX_BATCH_SIZE = 100
if (productIds.length > MAX_BATCH_SIZE) {
  return 400 "Too many products"
}

// ✅ SICHER: Sequential mit Error-Handling
for (const productId of productIds) {
  try {
    await updateProduct(productId)
  } catch (error) {
    errors.push({ productId, error: error.message })
    // Continue mit nächstem (nicht abbrechen)
  }
}

// ❌ UNSICHER: Massive Parallel-Requests
await Promise.all(productIds.map(id => updateProduct(id))) // DDoS?
```

---

## 🔍 3. Data Protection

### **3.1 What Data is Stored**

| Daten | Wo | Wie lange | Sichtbarkeit |
|-------|-----|-----------|--------------|
| Trend Scores | Frontend State | Session | Nur User |
| Reddit Posts | Frontend State | Session | Nur User |
| Suggested Prices | Backend Logs | 7 Tage | Admin only |
| WooCommerce Updates | WooCommerce DB | Unbegrenzt | Admin + Audit Trail |
| API-Keys | Environment | Unbegrenzt (!) | Niemand (secrets) |

### **3.2 PII Handling**

```typescript
// ✅ SICHER: Keine Benutzer-Daten sammeln
const trendData = {
  keyword: 'product name',    // Public
  score: 87,                  // Calculated
  timestamp: '2025-12-11',    // Metadata
  // ❌ KEINE user.id, email, IP, etc.
}

// ✅ SICHER: Reddit Posts sind Public (opt-in)
const posts = redditService.analyzePosts(productName)
// Posts sind public auf Reddit - kein Privacy-Issue

// ✅ SICHER: Logging ohne PII
logger.info({
  operation: 'trend-pricing',
  productId: 123,             // OK
  suggestedPrice: 279.99,     // OK
  // ❌ NICHT: user.email, payment info, etc.
})
```

### **3.3 Data Retention**

```typescript
// ✅ Best Practice: Delete logs nach 7 Tagen
const olderThan7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
db.logs.deleteMany({ timestamp: { $lt: olderThan7Days } })

// ✅ Best Practice: Cache invalidation
const TREND_CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours
redis.setex(`trend:${keyword}`, 21600, JSON.stringify(data))

// ✅ Best Practice: Frontend cache clearing
// State wird nur für aktuelle Session gehalten
// Bei Page-Reload: alles weg
```

---

## 🚨 4. Error Handling & Logging

### **4.1 Secure Error Messages**

```typescript
// ❌ UNSICHER: Detailed errors exposed
return reply.send({
  success: false,
  error: 'SELECT * failed: Syntax error near...',
  stack: 'at Database.query()...',
  database: 'mongodb://admin:pass@...'
})

// ✅ SICHER: Generic error messages
return reply.send({
  success: false,
  error: 'Fehler bei Datenbank-Operation',
  requestId: '550e8400-e29b-41d4-a716-446655440000'
})

// ✅ SICHER: Detailliertes Logging (Backend only)
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
  action: 'BLOCKED' // Wenn > MAX_BATCH_SIZE
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

### **DSGVO (GDPR)**
- ✅ Keine Benutzer-Daten in APIs
- ✅ Keine Tracking von Einzelpersonen
- ✅ Logs werden nach 7 Tagen gelöscht
- ✅ Privacy Policy updated
- ✅ Consent not needed (keine PII)

### **Terms of Service**
- ✅ Google Trends: Nur für Product Analytics
- ✅ Reddit: Read-only, kein Scraping zum Verkaufen
- ✅ OpenAI: Verwendung für interne Optimierung (OK)
- ✅ WooCommerce: API-Keys konfiguriert

### **Payment Card Security**
- ✅ Keine Preise direkt aus AI ohne Review (bei kritischen Produkten)
- ✅ Audit-Trail für alle Updates
- ✅ Manual approval für >50% Preis-Änderung (Empfehlung)

---

## 🔄 6. Security Review Checklist

**Vor Deployment in Production:**

- [ ] All API-Keys in `.env`, nicht in Code
- [ ] HTTPS aktiviert für alle Endpoints
- [ ] CORS konfiguriert (nur eigene Domain)
- [ ] Rate-Limiting aktiv (siehe `fastify-rate-limit`)
- [ ] Input-Validation auf allen Endpoints
- [ ] Error-Messages sind generic (nicht detailed)
- [ ] Logging läuft (wichtige Events tracked)
- [ ] Firewall-Rules geprüft (wer darf API aufrufen?)
- [ ] API-Quotas gesetzt (maximal X requests/Tag)
- [ ] Backup-Plan für API-Ausfälle
- [ ] Monitoring & Alerting eingerichtet
- [ ] Penetration Test durchgeführt

---

## 🚀 7. Deployment Security

### **Environment-Variablen**

```bash
# ✅ SICHER: In .env.local (nicht in Git)
OPENAI_API_KEY=sk-proj-xxx...
WOOCOMMERCE_CONSUMER_KEY=ck_xxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxx

# ✅ SICHER: In Docker Secrets / K8s Secrets
docker secret create openai_key /run/secrets/openai_key

# ❌ UNSICHER: In Source Code
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

### **Wenn OpenAI API kompromittiert wird**

1. ✅ **Sofort:** Neuen API-Key generieren
2. ✅ **Sofort:** Alten Key deaktivieren
3. ✅ **15min:** Deploy neuer Key
4. ✅ **1h:** Alle Requests der letzten 24h checken
5. ✅ **End of day:** Incident Report schreiben

### **Wenn Reddit API Rate-Limited wird**

1. ✅ Cache aktivieren (6h TTL)
2. ✅ Requests auf non-critical Zeiten verschieben
3. ✅ Fallback auf Standard-Updates

### **Wenn WooCommerce API ausfällt**

1. ✅ Toast zeigen: "Updates verzögert, bitte warten"
2. ✅ Alle Changes queuen
3. ✅ Retry alle 5 Minuten
4. ✅ Wenn nach 1h still down: Admin benachrichtigen

---

## 📚 Further Resources

- [OpenAI API Security Best Practices](https://platform.openai.com/docs/guides/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Reddit API Terms](https://www.reddit.com/dev/api)
- [DSGVO Richtlinien](https://www.bfdi.bund.de/)

---

**Letztes Review:** 11. Dezember 2025  
**Nächstes Review:** 11. Januar 2026  
**Owner:** @security-team
