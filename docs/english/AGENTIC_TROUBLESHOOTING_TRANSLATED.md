# Agentic Troubleshooting Guide

> **For all Users**: Error diagnosis & solutions for Agentic Loops.  
> **For Developers**: Debugging strategies & stack traces.

---

## Overview: Error Classification

Agentic Loop errors fall into 4 categories:

| Category           | Symptom                                           | Root Cause                                        | Solution                                            |
| ------------------ | ------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------- |
| **Configuration**  | App doesn't start                                 | connection.json/ml.config invalid                | Validate config (Section 2)                        |
| **External API**   | Loop not running, WooCommerce/OpenAI not responding | Service down, rate limit, auth error            | Retry, wait for rate limit (Section 3)             |
| **Logic Error**    | Loop runs, but anomalies detected incorrectly     | Bug in analyzer, thresholds too high/low         | Adjust thresholds (Section 4)                      |
| **Infrastructure** | Logs full, memory high, crash                     | Storage full, memory leak, too frequent execution | Clean storage, reduce frequency (Section 5)       |

---

## 1. Quick Diagnostic Flowchart

```
┌─ Agent running?
│
├─ No → Go to Section 2: Configuration
│
├─ Yes, but "Connection Failed" in logs
│  └─ Go to Section 3: External API Errors
│
├─ Yes, but loops do nothing
│  ├─ Check: mode === 'continuous'? → Section 2.4
│  ├─ Check: intervalMs not too large? → Section 2.4
│  ├─ Check: thresholds not too high? → Section 4
│
├─ Yes, but wrong results
│  └─ Go to Section 4: Logic Errors
│
└─ Yes, but performance issues
   └─ Go to Section 5: Infrastructure
```

---

## 2. Configuration Errors

### 2.1 "Cannot find module 'connection.json'"

**Error**:
```
Error: Cannot find module '../connection.json'
  at Module._load (internal/modules/loader.js:...)
```

**Cause**: File doesn't exist or is in the wrong folder.

**Solution**:
```bash
# Correct paths:
backend/connection.json      ✅ Correct
backend/config/connection.json  ❌ Wrong

# Create the file:
touch backend/connection.json

# Copy template:
cp backend/connection.json.example backend/connection.json
```

---

### 2.2 "Invalid JSON in connection.json"

**Error**:
```
SyntaxError: Unexpected token } in JSON at position 234
```

**Cause**: JSON syntax error (missing comma, wrong bracket, etc.)

**Solution**:
```bash
# Validate JSON
npm run validate:connection

# Or online:
https://jsonlint.com/

# Example – WRONG:
{
  "woocommerce": {
    "url": "https://..."
    "consumer_key": "ck_..."  ← Error: comma missing after "url"
  }
}

# Example – CORRECT:
{
  "woocommerce": {
    "url": "https://...",
    "consumer_key": "ck_..."
  }
}
```

---

### 2.3 "Missing required field: woocommerce.url"

**Error**:
```
ValidationError: Missing required field: woocommerce.url
```

**Cause**: connection.json is incomplete.

**Solution** – Minimum configuration:

```json
{
  "woocommerce": {
    "url": "https://kaufe-es.eu",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_...",
    "authMode": "basic",
    "timeoutMs": 30000
  },
  "openAI": {
    "apiKey": "sk-proj-...",
    "model": "gpt-4o-mini"
  },
  "job": {
    "mode": "continuous",
    "intervalMs": 900000
  }
}
```

---

### 2.4 "mode must be 'once' or 'continuous'"

**Error**:
```
ValidationError: job.mode must be 'once' or 'continuous'
```

**Cause**: Invalid value in `job.mode`.

**Solution**:
```json
{
  "job": {
    "mode": "continuous",  // ✅ Correct
    // NOT: "every_hour", "daily", "manual", etc.
    "intervalMs": 900000
  }
}
```

**Mode explained**:

| Mode         | Behavior                                   | When to use          |
| ------------ | ------------------------------------------ | -------------------- |
| `continuous` | Loop runs every `intervalMs` milliseconds | Production           |
| `once`       | Loop runs only on manual API call          | Development, Testing |

```bash
# Test: Trigger loop manually (mode: 'once')
curl -X POST http://localhost:3000/api/agent/loops/anomaly-detection/run
```

---

### 2.5 "intervalMs too small"

**Error**:
```
ValidationError: intervalMs must be >= 300000 (5 minutes)
```

**Cause**: Interval is configured too aggressively.

**Solution**:
```json
{
  "job": {
    "intervalMs": 900000  // ✅ Min. 15 min (Production)
    // NOT: 60000 (1 min), 300000 (5 min) – only for testing
  }
}
```

**Why minimum 5-15 minutes?**
- WooCommerce API needs time for consistency
- A/B tests need data accumulation
- Respect API rate limits
- Reduce server load

---

### 2.6 "ml.config.ts validation failed"

**Error**:
```
ValidationError in ml.config.ts: anomalyThresholds.unusualAmount must be >= 10
```

**Cause**: Logical validation errors in config values.

**Solution – Common errors**:

```typescript
// ❌ WRONG: Threshold negative
anomalyThresholds: {
  unusualAmount: -5000  // Cannot be negative
}

// ✅ CORRECT:
anomalyThresholds: {
  unusualAmount: 5000   // In EUR, positive
}

// ❌ WRONG: Confidence > 1
confidenceLevel: 1.5    // Max. 1.0
// ✅ CORRECT:
confidenceLevel: 0.95   // 0-1 (0% - 100%)

// ❌ WRONG: Margin > 1
targetMarginPercent: 150  // Margin > 100%?

// ✅ CORRECT:
targetMarginPercent: 30   // 30% margin
```

```bash
# Validate config
npm run validate:ml-config
```

---

## 3. External API Errors

### 3.1 "WooCommerce 401 Unauthorized"

**Error in logs**:
```
[ERROR] WooCommerce API Error: 401 Unauthorized
  Endpoint: GET /orders?status=failed&limit=100
  Headers: Authorization: Basic [base64]
```

**Possible causes** (in order):
1. consumerKey or consumerSecret wrong
2. API key was disabled
3. WooCommerce REST API not enabled

**Solution steps**:

**Step 1: Regenerate API key**
1. WooCommerce Admin: **Settings** → **Advanced** → **REST API**
2. Delete old key (if exists)
3. Create new key: **Add Key**
4. Name: "A.R.I. Loop Agent"
5. Permission: **Read/Write** (for Orders, Products, Customers)
6. Click **Generate**
7. Copy **Consumer Key** and **Consumer Secret**

**Step 2: Update connection.json**
```json
{
  "woocommerce": {
    "consumerKey": "PASTE_HERE_FROM_STEP_5",
    "consumerSecret": "PASTE_HERE_FROM_STEP_5"
  }
}
```

**Step 3: Test connection**
```bash
curl -X GET "https://kaufe-es.eu/wp-json/wc/v3/orders?status=failed&limit=1" \
  -u "ck_XXX:cs_YYY"

# Should return JSON with 1 order (or empty array)
```

**Step 4: Restart agent**
```bash
npm run dev
# or: systemctl restart agentic (Production)
```

---

### 3.2 "WooCommerce 403 Forbidden"

**Error**:
```
[ERROR] WooCommerce API Error: 403 Forbidden
  Message: "User does not have permission to read products"
```

**Cause**: API key doesn't have sufficient permissions.

**Solution**:

1. WooCommerce Admin: **Settings** → **Advanced** → **REST API**
2. Select your key
3. Check permission: Should be at least **Read/Write** (not just Read)

```
Permissions should be:
- Orders: Read/Write ✅
- Products: Read/Write ✅
- Customers: Read/Write ✅
```

---

### 3.3 "WooCommerce API Timeout (30000ms)"

**Error**:
```
[ERROR] WooCommerce API Timeout
  Endpoint: GET /orders?status=failed&limit=100
  Timeout: 30000ms
```

**Causes**:
1. WooCommerce shop is slow (many plugins, large DB)
2. Network problem
3. WooCommerce server down

**Solution steps**:

**Short-term**:
```json
{
  "woocommerce": {
    "timeoutMs": 60000  // Increase to 60 seconds
  }
}
```

**Medium-term**: Check WooCommerce performance
```bash
# Test: Does WooCommerce respond quickly?
time curl "https://kaufe-es.eu/wp-json/wc/v3/orders?limit=1" -u "..."

# Should be < 5 seconds
```

**Long-term**: If consistently > 10s
- Increase interval (run less frequently)
- Reduce `orderLimit`, `productLimit` in ml.config.ts
- Contact hosting provider (performance upgrade)

---

### 3.4 "OpenAI API Error: 401 Unauthorized"

**Error**:
```
[ERROR] OpenAI API Error: 401 Unauthorized
  Message: "Incorrect API key provided."
```

**Cause**: API key is wrong/expired.

**Solution**:

1. https://platform.openai.com/account/api-keys
2. Delete old key (if already rotated)
3. Create new secret key
4. Copy key (shown only once!)
5. Paste in connection.json

```json
{
  "openAI": {
    "apiKey": "sk-proj-PASTE_YOUR_NEW_KEY_HERE",
    "model": "gpt-4o-mini"
  }
}
```

6. Restart
```bash
npm run dev
```

---

### 3.5 "OpenAI Error: Insufficient quota"

**Error**:
```
[ERROR] OpenAI API Error: 429 Insufficient quota
  You exceeded your current quota, please check your plan and billing settings.
```

**Cause**: OpenAI account has no credits left.

**Solution**:

1. https://platform.openai.com/account/billing/overview
2. Check: "Usage this month" vs. "Billing limit"
3. Pay invoice or increase billing limit
4. Wait 1-2 minutes (quota refreshes)

**Cost estimation**:
```
Loops per day × Tokens per loop = Daily tokens
3 (ca. 15 loops) × 1500 tokens = 4,500 tokens/day

Daily tokens × 30 days = Month
4,500 × 30 = 135,000 tokens/month

Cost with gpt-4o-mini:
135,000 tokens × $0.00015/1k tokens = $0.02-0.05/month
```

**Savings**:
```json
{
  "openAI": {
    "model": "gpt-4o-mini"  // ✅ Cheaper (~$0.15/1M tokens)
    // NOT: "gpt-4" (~$3/1M tokens) for production
  }
}
```

---

### 3.6 "OpenAI Error: Rate limit exceeded"

**Error**:
```
[ERROR] OpenAI API Error: 429 Rate limit exceeded
  Retry after: 60 seconds
```

**Cause**: Too many API calls too fast.

**Solution – Medium-term**:
```json
{
  "job": {
    "intervalMs": 1800000  // Increase from 900000 to 30 min
  }
}
```

**Solution – Long-term**: Use batch processing

```typescript
// NOT: Run 5 loops sequentially
loop1(); await sleep(1000);
loop2(); await sleep(1000);
loop3();

// INSTEAD: Run sequentially with backoff
await runLoopsSequentially([loop1, loop2, loop3], {
  delayBetween: 5000,  // 5s between loops
  maxConcurrent: 1     // Only 1 at a time
});
```

---

### 3.7 "SMTP Connection Failed"

**Error**:
```
[ERROR] Email Error: SMTP Connection Failed
  Host: inn.bitpalast.net
  Port: 465
  Error: connect ECONNREFUSED
```

**Cause**: SMTP server not reachable or port wrong.

**Solution steps**:

**Step 1: Test SMTP connection**
```bash
npm run test:smtp
```

**Step 2: Check config**
```json
{
  "smtp": {
    "host": "inn.bitpalast.net",
    "port": 465,          // Check port!
    "secure": true,       // true for port 465, false for 587
    "user": "info@...",
    "password": "..."
  }
}
```

**Common port problems**:

```
Port 25:  Unencrypted, often blocked → ❌ Use 465 or 587
Port 465: TLS (secure: true)      → ✅ Standard
Port 587: STARTTLS (secure: false) → ✅ Alternative

WRONG:
{
  "port": 25,
  "secure": true  ← Conflict!
}

CORRECT:
{
  "port": 465,
  "secure": true   ← or
  "port": 587,
  "secure": false
}
```

**Step 3: Check host**
```bash
# Test if host is reachable
nslookup inn.bitpalast.net
telnet inn.bitpalast.net 465

# Should be connected, not "Connection refused"
```

**Step 4: Check credentials**
- Username: Usually full email address
- Password: Can be app password (e.g. Gmail)

---

### 3.8 "Database Connection Error"

**Error** (if using persistent memory DB):
```
[ERROR] Database Error: ECONNREFUSED
  Host: localhost
  Port: 5432
```

**Cause**: Database not reachable.

**Note**: A.R.I. uses **In-Memory Storage** (no DB needed!)

**But if persistent storage configured**:

```bash
# Start DB (e.g. PostgreSQL)
docker run -d -e POSTGRES_PASSWORD=secret postgres:15

# Or: Use SQLite (simpler)
# Or: Disable persistence
```

---

## 4. Logic Errors

### 4.1 "No anomalies detected, but many failed orders"

**Symptom**: Loop runs, but doesn't find anomalies.

**Cause**: Thresholds are too high.

**Solution – Adjust in ml.config.ts**:

```typescript
// BEFORE (too conservative):
anomalyThresholds: {
  unusualAmount: 10000,           // Only > €10k
  repeatedFailureThreshold: 5,    // Only after 5 failures
}
// → Finds almost nothing

// AFTER (more aggressive):
anomalyThresholds: {
  unusualAmount: 3000,            // > €3k
  repeatedFailureThreshold: 2,    // After 2 failures
}
// → Finds more (but also more false positives)
```

**Debug techniques**:

```bash
# 1. Trigger manually and check logs
npm run trigger:anomaly-detection

# 2. Filter logs
npm run logs:agent | grep "anomaly\|threshold\|detected"

# 3. Call API directly and inspect response
curl http://localhost:3000/api/agent/loops/anomaly-detection/run
# → Returns JSON with detected anomalies
```

---

### 4.2 "Strategy Selector always returns 'retry'"

**Symptom**: Recovery strategy is always `retry`, never `discount` or `contact`.

**Cause**: Decision tree has logic error or inputs are invalid.

**Solution**:

```typescript
// Check inputs
const strategy = await strategyTool.selectPaymentRecoveryStrategy({
  failureReason: 'card_declined',  // Must be known value
  customerFailureRate: 0.35,       // Must be 0-1
  orderTotal: 7500.00,             // Must be > 0
  paymentMethods: ['klarna']       // Can't be empty
});

// Debugging: Check logs
console.log('Strategy Selector Input:', {
  failureReason,
  customerFailureRate,
  orderTotal,
  paymentMethods
});
console.log('Decision Tree Branch:', selectedBranch);
console.log('Result Strategy:', strategy);
```

**Check decision tree** (backend/agent/tools.ts):

```typescript
if (failureReason === 'card_declined') {
  if (customerFailureRate > 0.3) {
    return 'alternative_payment';  ← Should arrive here
  } else {
    return 'retry';
  }
}
```

---

### 4.3 "A/B Test always shows no winner"

**Symptom**: A/B test runs, but all variants have similar conversions.

**Causes**:
1. Sample size too small
2. Test duration too short (not enough data)
3. Effect is really small

**Solution**:

```typescript
// Increase sample size
const result = await abTestTool.simulateABTest({
  baselineConversionRate: 0.06,
  sampleSize: 5000,              // from 1000 to 5000
  confidenceLevel: 0.90           // from 0.95 to 0.90 (accept less accuracy)
});
```

**Statistics explained**:
- Larger sample size = more reliable results
- But: Takes longer (more time needed for test)
- Trade-off: Speed vs. accuracy

---

### 4.4 "Discount always at maximum threshold"

**Symptom**: Discount generator always gives 30% discount (maximum).

**Cause**: Margin limits are configured too low.

**Solution**:

```typescript
// BEFORE (too restrictive):
targetMarginPercent: 50          // Target 50% margin
// → Discount limited to max 5% to protect margin

// AFTER (realistic):
targetMarginPercent: 30          // Target 30% margin (standard in e-commerce)
// → Allows higher discounts (e.g. 15%)
```

**Gross margin example**:
```
Cost: €8.50
Sale price: €29.99
Gross margin: (29.99 - 8.50) / 29.99 = 71.5%

With 10% discount:
New price: €26.99
New margin: (26.99 - 8.50) / 26.99 = 68.5%
→ Still > 30% OK!

With 30% discount:
New price: €20.99
New margin: (20.99 - 8.50) / 20.99 = 59.5%
→ Still > 30% OK!
```

---

## 5. Infrastructure & Performance

### 5.1 "Memory usage keeps growing"

**Symptom**: Node process uses increasingly more RAM (e.g. 100MB → 500MB → 1GB).

**Cause**: Memory leak (probably in pattern storage).

**Debug steps**:

```bash
# 1. Check storage size
curl http://localhost:3000/api/agent/memory/stats
# Response: { "patternCount": 15000 }  ← Too many!

# 2. Force cleanup
npm run agent:cleanup-storage

# 3. Check if TTL cleanup is running
npm run logs:agent | grep "cleanup\|TTL\|deleted"
```

**Solution**:

```typescript
// In backend/agent/memory.ts
// TTL cleanup should run automatically
setInterval(() => {
  this.cleanup();  // Every hour
}, 3600000);

// If not active, enable:
export const enableAutoCleanup = true;
export const cleanupInterval = 3600000;  // 1h
```

**If needed: Manual cleanup**:
```bash
# Delete all patterns older than 24h
curl -X DELETE http://localhost:3000/api/agent/memory/cleanup?maxAgeHours=24
```

---

### 5.2 "Logs are huge (GB)"

**Symptom**: Log file is several GB large.

**Cause**: Logging level is too verbose, no log rotation.

**Solution – Enable log rotation**:

```typescript
// backend/logger.ts
import winston from 'winston';
import 'winston-daily-rotate-file';

const transport = new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '100m',     // Rotate when > 100MB
  maxDays: '14d'       // Delete logs older than 14 days
});
```

**Immediate cleanup**:
```bash
# Archive old logs
gzip logs/app-2025-11-*.log

# Delete very old logs
find logs -name "*.log" -mtime +30 -delete  # Older than 30 days
```

---

### 5.3 "Agent crashes frequently"

**Symptom**: Process terminates unexpectedly (no error in logs).

**Cause**: Out of memory, unhandled exception, system signal.

**Debug steps**:

```bash
# 1. Check system resources
free -h       # Memory
df -h         # Disk
top           # CPU

# 2. Check crash log
dmesg | tail -20  # Kernel messages (OOM killer?)

# 3. Start with debug
npm run dev:debug
# → More logging, better stack traces
```

**Common causes & solutions**:

| Symptom     | Cause                        | Solution                               |
| ----------- | ---------------------------- | -------------------------------------- |
| `SIGKILL`   | Out of memory                | Reduce `orderLimit`, `productLimit`    |
| `SIGSEGV`   | Segmentation fault (rare)    | Update Node.js                         |
| `SIGABRT`   | Uncaught exception           | Check logs before crash                |
| `ENOTFOUND` | DNS error                    | Check DNS, internet connection         |

---

### 5.4 "Loops are running too slowly"

**Symptom**: One loop cycle takes 10+ minutes (should be 30s).

**Debug**:

```bash
# 1. Measure loop duration
npm run trigger:anomaly-detection

# Logs show:
# [2025-12-17 10:00:00] Starting anomalyDetectionLoop
# [2025-12-17 10:00:45] Completed anomalyDetectionLoop (duration: 45s)

# Everything under 2 min is OK
```

**If > 2 min, then optimize**:

```typescript
// ml.config.ts – Reduce data
anomalyDetectionConfig = {
  orderLimit: 50,        // from 100 to 50
  maxDaysOld: 7          // from 30 to 7 days
}

productOptimizationConfig = {
  productLimit: 25,      // from 50 to 25
  minConversionRate: 0.05  // from 0.02 to 0.05 (higher = fewer products)
}
```

**Or: Reduce frequency / shift times** (Settings → Agentic Loops → ⚙️ Schedule or directly in `backend/data/loop-schedules.json`):
```json
{
  "product-optimization": {
    "enabled": true,
    "type": "weekly",
    "time": "22:00",
    "weekdays": ["Monday", "Thursday"]
  },
  "payment-recovery": {
    "enabled": true,
    "type": "interval",
    "minutes": 60
  }
}
```

---

## 6. Error Status Codes

### HTTP API Error Responses

```javascript
// 200 OK
{
  "status": "success",
  "data": { /* Loop Result */ }
}

// 400 Bad Request
{
  "error": "Invalid request",
  "message": "Parameter 'loopType' is required",
  "code": "INVALID_INPUT"
}

// 401 Unauthorized
{
  "error": "Unauthorized",
  "message": "API key missing or invalid",
  "code": "AUTH_ERROR"
}

// 429 Too Many Requests
{
  "error": "Rate limited",
  "message": "Too many requests, retry after 60 seconds",
  "code": "RATE_LIMITED",
  "retryAfter": 60
}

// 500 Internal Server Error
{
  "error": "Internal error",
  "message": "WooCommerce API connection failed",
  "code": "EXTERNAL_SERVICE_ERROR",
  "details": {
    "service": "woocommerce",
    "endpoint": "GET /orders",
    "statusCode": 503
  }
}
```

---

## 7. Log Format & Interpretation

### Log Entry Examples

```
[2025-12-17 10:15:00] [INFO] AnomalyDetectionLoop: Starting cycle
[2025-12-17 10:15:01] [DEBUG] SENSE: Fetching 100 failed orders
[2025-12-17 10:15:05] [DEBUG] THINK: Analyzing 98 orders for anomalies
[2025-12-17 10:15:06] [DEBUG] Detected 12 anomalies: 5×failed_payment, 4×unusual_amount, 3×high_risk
[2025-12-17 10:15:07] [DEBUG] ACT: Creating recovery actions
[2025-12-17 10:15:08] [DEBUG] LEARN: Saving patterns to storage
[2025-12-17 10:15:09] [INFO] AnomalyDetectionLoop: Completed (duration: 9s)
```

**Log Levels**:

| Level     | Meaning                                   | Frequency            |
| --------- | ----------------------------------------- | -------------------- |
| **TRACE** | Very detailed (variable values)           | Rare (debug only)    |
| **DEBUG** | Normal operation details                  | Frequent             |
| **INFO**  | Important milestones                      | Every loop cycle     |
| **WARN**  | Potential issues (retries, fallbacks)     | Occasionally         |
| **ERROR** | Failed operations (need attention)        | Should be rare       |
| **FATAL** | System down                               | Very rare            |

---

## 8. Monitoring Endpoints

### Health Check

```bash
curl http://localhost:3000/api/agent/health
```

**Response**:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "components": {
    "woocommerce": { 
      "status": "ok", 
      "latency": 245,
      "lastCheck": "2025-12-17T10:15:00Z"
    },
    "openai": { 
      "status": "ok", 
      "latency": 1200 
    },
    "smtp": { 
      "status": "ok" 
    },
    "storage": { 
      "status": "ok",
      "patterns": 342,
      "memoryUsage": "45MB"
    }
  },
  "lastErrors": [
    {
      "timestamp": "2025-12-17T10:10:00Z",
      "service": "woocommerce",
      "message": "Timeout (exceeded 30000ms)",
      "resolved": true
    }
  ]
}
```

### Recent Errors

```bash
curl http://localhost:3000/api/agent/errors?limit=20
```

**Response**:
```json
{
  "last24h": 5,
  "bySeverity": {
    "CRITICAL": 0,
    "HIGH": 2,
    "MEDIUM": 3
  },
  "topErrors": [
    {
      "message": "WooCommerce API timeout",
      "count": 2,
      "lastOccurred": "2025-12-17T10:10:00Z"
    },
    {
      "message": "OpenAI rate limit",
      "count": 1,
      "lastOccurred": "2025-12-17T09:45:00Z"
    }
  ]
}
```

---

## 9. Recovery Procedures

### 9.1 Agent stuck ("Hung Process")

```bash
# 1. Check if agent responds
curl -m 5 http://localhost:3000/api/agent/health
# Timeout? → Agent is hung

# 2. Stop agent
npm stop
# or: kill $(lsof -ti :3000)

# 3. Wait 5 seconds
sleep 5

# 4. Start again
npm run dev
```

---

### 9.2 Too many old patterns → Storage full

```bash
# 1. Check pattern count
curl http://localhost:3000/api/agent/memory/stats

# 2. Cleanup old patterns (older than 7 days)
curl -X POST http://localhost:3000/api/agent/memory/cleanup?maxAgeDays=7

# 3. If needed: Delete all patterns (resets learning!)
curl -X DELETE http://localhost:3000/api/agent/memory/purge
```

---

### 9.3 Agent running, but no loops executing

```bash
# 1. Check if loops are configured
curl http://localhost:3000/api/agent/config/loops

# 2. Check mode
curl http://localhost:3000/api/agent/config | grep '"mode"'
# Should be: "mode": "continuous"

# 3. Trigger loop manually
npm run trigger:anomaly-detection

# 4. If nothing happens manually → Check logs
npm run logs:agent:tail
```

---

## 10. Support Resources

### Checklists

**Agent doesn't start:**
- [ ] connection.json exists?
- [ ] JSON valid? (`npm run validate:connection`)
- [ ] All required fields present?
- [ ] Port 3000 not blocked?

**Loops not running:**
- [ ] job.mode === 'continuous'?
- [ ] intervalMs >= 900000?
- [ ] WooCommerce API key active?
- [ ] OpenAI API key valid?

**Errors in loops:**
- [ ] Thresholds appropriate? (ml.config.ts)
- [ ] External services online? (health check)
- [ ] Enough data available? (orderLimit, productLimit)

---

### Escalation Path

1. **Inspect logs**: `npm run logs:agent:tail`
2. **Health check**: `curl http://localhost:3000/api/agent/health`
3. **Validate configuration**: `npm run validate:all`
4. **Test manually**: `npm run trigger:anomaly-detection`
5. **Start debug mode**: `npm run dev:debug`
6. **Contact developer** (with logs & debug output)

---

### Documentation

- **General**: [AGENTIC_LOOP_ARCHITECTURE.md](./AGENTIC_LOOP_ARCHITECTURE.md)
- **Tools**: [AGENTIC_TOOLS_REFERENCE.md](./AGENTIC_TOOLS_REFERENCE.md)
- **Configuration**: [AGENTIC_CONFIGURATION.md](./AGENTIC_CONFIGURATION.md)
- **User Guide**: [AGENTIC_LOOPS_USER_GUIDE.md](./AGENTIC_LOOPS_USER_GUIDE.md)

---

## 11. Error Handling Summary

```
Error occurs
    ↓
[Check severity]
    ├─ CRITICAL (App down)
    │  └─ → Config/Auth error (Section 2-3)
    ├─ HIGH (Loops missing)
    │  └─ → Logic/Threshold error (Section 4)
    └─ MEDIUM (Slow/Memory)
       └─ → Infrastructure error (Section 5)
```

**First aid**: Always check logs first → validate configuration → test external APIs.
