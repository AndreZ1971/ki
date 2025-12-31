# Agentic Configuration Guide

> **For Shop Admins**: How to configure A.R.I. & adjust loops.  
> **For Developers**: See [AGENTIC_TOOLS_REFERENCE.md](./AGENTIC_TOOLS_REFERENCE.md)

---

## Overview

Agentic Loops are controlled via two configuration files:

1. **`backend/connection.json`** – External integrations (WooCommerce, OpenAI, SMTP)
2. **`backend/agent/config/ml.config.ts`** – Loop behavior & thresholds

---

## 1. connection.json – External Credentials

**File**: `backend/connection.json`

### 1.1 WooCommerce Integration

```json
{
  "woocommerce": {
    "url": "https://kaufe-es.eu",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_...",
    "authMode": "basic",
    "timeoutMs": 30000
  }
}
```

**Parameter explanation**:

| Field            | Type              | Meaning                                | Example                                                   |
| ---------------- | ----------------- | -------------------------------------- | ---------------------------------------------------------- |
| `url`            | String            | WooCommerce shop URL (must be HTTPS) | `https://kaufe-es.eu`                                      |
| `consumerKey`    | String            | WooCommerce REST API key              | Generated in WP Admin: Settings → Advanced → REST API      |
| `consumerSecret` | String            | WooCommerce REST API secret           | Generated in WP Admin: Settings → Advanced → REST API      |
| `authMode`       | `basic` \| `oauth`| Authentication method                 | `basic` (standard)                                         |
| `timeoutMs`      | Number            | Max wait time for API calls            | `30000` (30 seconds)                                       |

**How to generate API key**:

1. WooCommerce Admin → **Settings** → **Advanced** → **REST API**
2. Click **Create Key** / **Add Key**
3. Enter name: e.g. "A.R.I. Loop Agent"
4. **Permissions**: Select `Read/Write` for Orders, Products, Customers
5. Click **Generate**
6. Copy `Consumer Key` and `Consumer Secret` into connection.json

**⚠️ Security**:
- Never store connection.json in Git (add to `.gitignore`)
- Use environment variables in production: `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`
- Rotate keys regularly (e.g. quarterly)

---

### 1.2 OpenAI Integration

```json
{
  "openAI": {
    "apiKey": "sk-proj-...",
    "model": "gpt-4o-mini"
  }
}
```

**Parameter explanation**:

| Field    | Type   | Meaning       | Example                                       |
| -------- | ------ | ------------- | --------------------------------------------- |
| `apiKey` | String | OpenAI API key | From https://platform.openai.com/api-keys     |
| `model`  | String | LLM model     | `gpt-4o-mini` (cost-effective) or `gpt-4`     |

**Model options**:

| Model         | Cost                      | Speed      | Use case                                 |
| ------------- | ------------------------- | ---------- | ---------------------------------------- |
| `gpt-4o-mini` | ~€0.001-0.003/1k tokens   | Fast ⚡    | Email, variant generation (recommended) |
| `gpt-4`       | ~€0.01-0.03/1k tokens     | Medium 🟡  | Complex analysis, strategy selection     |
| `gpt-4-turbo` | ~€0.01/1k tokens          | Medium 🟡  | Balanced (legacy)                        |

**⚠️ Cost management**:
- Loops = ~1,000-2,000 tokens per run
- At `intervalMs: 900000` (15min) = ~2,880-5,760 tokens/day
- Estimated monthly cost: €0.02-0.05 with `gpt-4o-mini`

**How to get API keys**:

1. Go to https://platform.openai.com/account/api-keys
2. Login with OpenAI account
3. Click **+ Create new secret key**
4. Copy the key (shown only once!)
5. Enter in connection.json

---

### 1.3 SMTP / Email Configuration

```json
{
  "smtp": {
    "host": "inn.bitpalast.net",
    "port": 465,
    "secure": true,
    "user": "info@kaufe-es.eu",
    "password": "***",
    "from": "info@kaufe-es.eu"
  }
}
```

**Parameter explanation**:

| Field      | Type    | Meaning             | Example                                                       |
| ---------- | ------- | ------------------- | ------------------------------------------------------------- |
| `host`     | String  | Mail server hostname | `inn.bitpalast.net` or `smtp.gmail.com`                       |
| `port`     | Number  | SMTP port            | `465` (TLS), `587` (STARTTLS), `25` (unencrypted)             |
| `secure`   | Boolean | TLS encryption?     | `true` (for port 465), `false` for 587                        |
| `user`     | String  | SMTP user           | `info@kaufe-es.eu`                                            |
| `password` | String  | SMTP password       | From mail provider                                            |
| `from`     | String  | Sender email        | `info@kaufe-es.eu` or `"A.R.I. Recovery <recovery@kaufe-es.eu>"` |

**Common providers**:

```json
// Gmail
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "your-email@gmail.com",
  "password": "your-app-password"  // Not your Gmail password!
}

// Outlook
{
  "host": "smtp-mail.outlook.com",
  "port": 587,
  "secure": false,
  "user": "your-email@outlook.com",
  "password": "your-password"
}

// Ionos
{
  "host": "smtp.ionos.de",
  "port": 465,
  "secure": true,
  "user": "your-email@yourdomain.com",
  "password": "your-password"
}
```

**Generate Gmail app password**:

1. https://myaccount.google.com/apppasswords
2. Select **Mail** → **Windows PC** (doesn't matter)
3. Google generates a 16-character password
4. Enter this (not your Gmail password!) in connection.json

---

### 1.4 Reddit Integration (Optional)

```json
{
  "reddit": {
    "clientId": "...",
    "clientSecret": "..."
  }
}
```

For social media listening (not required for loops, only for extended features).

---

### 1.5 Loop Schedules (configurable per loop)

**File**: `backend/data/loop-schedules.json`

```json
{
  "anomaly-detection": { "enabled": true, "type": "daily", "time": "08:00" },
  "payment-recovery":  { "enabled": true, "type": "interval", "minutes": 30 },
  "product-optimization": {
    "enabled": true,
    "type": "weekly",
    "time": "10:00",
    "weekdays": ["Monday", "Wednesday", "Friday"]
  },
  "analytics-insights": { "enabled": true, "type": "daily", "time": "22:00" }
}
```

**Types & fields**

| Field      | Type     | Meaning                                  |
| ---------- | -------- | ---------------------------------------- |
| `enabled`  | boolean  | Loop active (true) / paused (false)     |
| `type`     | string   | `daily` \| `weekly` \| `interval`       |
| `time`     | string   | HH:MM (for `daily` and `weekly`)        |
| `weekdays` | string[] | e.g. `["Monday","Friday"]` (only `weekly`) |
| `minutes`  | number   | 15 \| 30 \| 45 \| 60 (only `interval`) |

**API**

- GET  `/api/agent/monitoring/schedules` – all schedules
- GET  `/api/agent/monitoring/schedules/:loopType`
- PUT  `/api/agent/monitoring/schedules/:loopType` – change & reschedule immediately
- POST `/api/agent/monitoring/schedules/:loopType/toggle` – enable/disable

**UI**

Settings → Agentic Loops → ⚙️ Schedule (Modal)
- Anomaly Detection: Daily HH:MM
- Payment Recovery: Interval 15/30/45/60 min
- Product Optimization: Weekly (weekdays + HH:MM)
- Analytics Insights: Daily HH:MM

---

### 1.6 ML Features Switch

```json
{
  "features": {
    "enableAnalytics": true,
    "enableAutoProducts": true,
    "enableEmailMarketing": true
  }
}
```

Turns features on/off. Not directly relevant for loops (controlled in `ml.config.ts`).

---

## 2. ml.config.ts – Loop Behavior & Thresholds

**File**: `backend/agent/config/ml.config.ts`

**Purpose**: Fine-tune loop behavior without code changes.

### 2.1 Anomaly Detection Loop Config

```typescript
export const anomalyDetectionConfig = {
  // Input sources
  orderLimit: 100,           // Max orders per run
  maxDaysOld: 30,           // Only orders from last 30 days
  
  // Anomaly detection thresholds
  anomalyThresholds: {
    unusualAmount: 5000,                    // > €5000 = anomaly
    repeatedFailureThreshold: 2,            // 2+ failures = anomaly
    repeatedFailureTimeWindowMinutes: 120,  // Within 2h
    highRiskPatternMatches: 3               // 3+ patterns = anomaly
  },
  
  // Severity levels
  severityWeights: {
    failed_payment: 'HIGH',       // Auto manual review
    unusual_amount: 'MEDIUM',
    repeated_attempts: 'HIGH',
    high_risk: 'MEDIUM'
  },
  
  // Behavior
  autoRecoveryEnabled: true,      // Auto-apply recovery strategies?
  recoveryChainEnabled: true,     // Multiple recovery attempts sequentially?
  maxRecoveryAttempts: 3,
  
  // Alerts
  alertThreshold: 'HIGH',         // Only alert HIGH+ severity
  batchAlertsWhenAbove: 10        // Batch alerts when >10 anomalies
}
```

**Recommended settings by use case**:

```typescript
// Aggressive Mode (Early detection)
{
  unusualAmount: 3000,        // Lower threshold
  repeatedFailureThreshold: 1, // Right after 1 failure
  maxRecoveryAttempts: 5
}

// Conservative Mode (High precision)
{
  unusualAmount: 10000,       // Higher threshold
  repeatedFailureThreshold: 5, // Only after 5 failures
  maxRecoveryAttempts: 1      // Max 1 retry
}

// Balanced Mode (Recommended)
{
  unusualAmount: 5000,
  repeatedFailureThreshold: 2,
  maxRecoveryAttempts: 3
}
```

---

### 2.2 Product Optimization Loop Config

```typescript
export const productOptimizationConfig = {
  // Input sources
  productLimit: 50,                  // Max products per run
  minOrderHistory: 30,               // Only products with 30+ historical orders
  minConversionRate: 0.02,           // Only if conversion >= 2%
  
  // Variant generation
  variantTypesToGenerate: ['price', 'title', 'description'],
  variantsPerProduct: 3,
  
  // Simulation
  abTestSampleSize: 1000,
  confidenceLevel: 0.95,
  
  // A/B test thresholds
  minLiftThreshold: 0.05,            // Min. +5% expected for winner
  statisticalSignificanceLevel: 0.05, // p < 0.05 = significant
  
  // Price limits
  discountLimits: {
    minDiscount: 5,                  // Min. -5% discount
    maxDiscount: 30,                 // Max. -30% discount
    targetMarginPercent: 30          // Min. 30% gross margin
  },
  
  // Copy generation
  titleMaxLength: 70,
  descriptionMaxLength: 300,
  
  // Auto-apply
  autoApplyWinners: false,           // Auto-apply best variant live?
  autoApplyConfidenceThreshold: 0.85, // Only if >85% confident
  
  // Alerts
  alertThreshold: 'INFO',            // Alert every optimization
  notifyOnHighLift: 0.20             // Alert if lift > 20%
}
```

**Recommended settings by risk appetite**:

```typescript
// Conservative (manual confirmation)
{
  autoApplyWinners: false,
  confidenceLevel: 0.99,             // Very high
  minLiftThreshold: 0.10             // Min. +10%
}

// Moderate (semi-auto)
{
  autoApplyWinners: false,
  autoApplyConfidenceThreshold: 0.85,
  minLiftThreshold: 0.05
}

// Aggressive (full auto)
{
  autoApplyWinners: true,
  autoApplyConfidenceThreshold: 0.75,
  minLiftThreshold: 0.03
}
```

---

### 2.3 Payment Recovery Loop Config

```typescript
export const paymentRecoveryConfig = {
  // Input sources
  orderLimit: 50,
  maxOrderAgeHours: 24,              // Only orders from last 24h
  minOrderAmount: 10,                // Only orders >= €10
  
  // Recovery trigger thresholds
  triggerThresholds: {
    failureStatus: ['failed', 'on-hold', 'pending'], // Which statuses trigger recovery?
    customerFailureRateThreshold: 0.3  // Customer history > 30% failure rate
  },
  
  // Recovery strategy configuration
  strategies: {
    retry: {
      enabled: true,
      delayMinutes: 30,              // How long to wait before retry?
      maxAttempts: 2
    },
    discount: {
      enabled: true,
      percentages: [5, 10, 15],      // Try 5%, then 10%, then 15%
      respectMarginLimits: true
    },
    alternative_payment: {
      enabled: true,
      preferredMethods: ['klarna', 'paypal', 'bank_transfer']
    },
    contact: {
      enabled: true,
      triggerOn: ['high_amount', 'repeated_failure'], // Manual contact needed
      assignToTeam: 'sales'          // Which team gets the ticket?
    }
  },
  
  // Email configuration
  emailTemplate: 'payment_recovery',
  emailDelay: 5,                     // Minutes before sending email
  includeSocialProof: true,          // "87% successfully recovered"
  
  // Success tracking
  successThreshold: 0.40,            // Target: 40% recovery success rate
  alertWhenUnder: 0.25,              // Alert if < 25%
  
  // Auto-escalation
  escalationEnabled: true,
  escalateAfterFailures: 2           // After 2 attempts: contact
}
```

**Recommended settings by business strategy**:

```typescript
// Revenue-focused (aggressive recovery)
{
  discount: { percentages: [10, 15, 20] },
  contact: { triggerOn: ['high_amount'] },
  strategies: { contact: { enabled: false } }  // Less support overhead
}

// Relationship-focused
{
  discount: { percentages: [5, 5] },          // Small discounts
  contact: { enabled: true, triggerOn: ['any'] },
  escalationEnabled: true
}

// Balanced
{
  discount: { percentages: [5, 10, 15] },
  contact: { triggerOn: ['high_amount', 'repeated_failure'] }
}
```

---

### 2.4 Analytics Insights Loop Config

```typescript
export const analyticsInsightsConfig = {
  // Data aggregation
  daysToAnalyze: 90,                 // Rolling 90-day window
  metricsToTrack: [
    'average_order_value',
    'conversion_rate',
    'customer_acquisition_cost',
    'refund_rate',
    'repeat_customer_rate',
    'churn_rate'
  ],
  
  // Anomaly detection in metrics
  anomalyDetection: {
    enabled: true,
    sigma: 2.5                       // 2.5σ = ~1.2% probability of error
  },
  
  // Trend analysis
  trendAnalysis: {
    minDataPoints: 7,                // Min. 7 data points for trend
    trendConfidenceThreshold: 0.70   // 70% confidence minimum
  },
  
  // Forecast
  forecastingEnabled: true,
  forecastMethod: 'arima',           // or 'exponential_smoothing', 'linear_regression'
  forecastDays: 7,
  
  // Insight generation
  minInsightConfidence: 0.75,
  maxInsightsPerRun: 5,
  
  // AI copy
  generateRecommendations: true,
  recommendationModel: 'gpt-4o-mini',
  
  // Alerting
  criticalThresholds: {
    conversionRateDrop: 0.15,        // Alert if conversion drops > 15%
    churnRateIncrease: 0.25,         // Alert if churn increases > 25%
    aovDecrease: 0.20                // Alert if AOV decreases > 20%
  }
}
```

---

## 3. Loop Frequencies & Scheduling

**Recommendation**: Different frequencies for each loop:

```json
{
  "job": {
    "mode": "continuous",
    "intervalMs": 900000  // Base interval
  },
  "loopSchedules": {
    "anomaly_detection": {
      "frequencyMultiplier": 1,    // Run every time
      "intervalMs": 900000         // 15 min
    },
    "product_optimization": {
      "frequencyMultiplier": 2,    // Run every 2nd time
      "intervalMs": 1800000        // 30 min
    },
    "payment_recovery": {
      "frequencyMultiplier": 1,    // Run every time
      "intervalMs": 900000         // 15 min
    },
    "analytics_insights": {
      "frequencyMultiplier": 4,    // Run every 4th time
      "intervalMs": 3600000        // 1 hour
    }
  }
}
```

**Rationale**:
- **Anomaly Detection**: Fast (15min) → Payment issues are time-sensitive
- **Product Optimization**: Medium (30min) → A/B tests need time
- **Payment Recovery**: Fast (15min) → Recovery window is short
- **Analytics Insights**: Slow (1h) → Lot of data aggregation

---

## 4. Monitoring & Health Checks

### 4.1 Configuration Validation

After editing config files:

```bash
# Validate connection.json
npm run validate:connection

# Validate ml.config.ts
npm run validate:ml-config

# Run all validations
npm run validate:all
```

### 4.2 Health Check Endpoint

```bash
# Check if all configurations are OK
curl http://localhost:3000/api/agent/health

# Response:
{
  "status": "healthy",
  "components": {
    "woocommerce": { "status": "ok", "latency": 245 },
    "openai": { "status": "ok", "latency": 1200 },
    "smtp": { "status": "ok" },
    "config": { "status": "ok", "validationErrors": [] }
  }
}
```

---

## 5. Best Practices & Common Mistakes

### ✅ Best Practices

1. **Test before production**:
   ```bash
   # Set mode: 'once' in ml.config.ts
   npm run dev
   # Trigger manually via API
   curl -X POST http://localhost:3000/api/agent/loops/anomaly-detection/run
   ```

2. **Gradually reduce thresholds**:
   - Start: Aggressive (early detection)
   - Weeks 1-2: Monitor false positive rate
   - Then: Adjust as needed

3. **Use environment variables**:
   ```bash
   # Not hardcoded in connection.json:
   export WOO_CONSUMER_KEY="ck_..."
   export OPENAI_API_KEY="sk-..."
   ```

4. **Regular backups**:
   ```bash
   cp backend/connection.json backend/connection.json.backup
   ```

### ❌ Common Mistakes

| Mistake                     | Symptom                         | Solution                                                 |
| --------------------------- | ------------------------------- | -------------------------------------------------------- |
| **WooCommerce URL wrong**   | "401 Unauthorized"              | Check URL in connection.json (must start with `https://`) |
| **API key expired**         | "Invalid credentials"           | Regenerate key in WooCommerce Admin                      |
| **SMTP auth wrong**         | "Email not sent"                | Test with `npm run test:smtp`                            |
| **Threshold too high**      | No anomalies detected           | Lower `unusualAmount`, `repeatedFailureThreshold`        |
| **Loop not running**        | Mode is `once` not `continuous`| Change `"mode": "continuous"`                            |

---

## 6. Configuration per Environment

### Development

```json
{
  "woocommerce": {
    "url": "http://localhost:8080",  // Local WooCommerce
    "timeoutMs": 60000               // Longer timeout for debugging
  },
  "job": {
    "mode": "once",                  // Trigger manually
    "intervalMs": 900000
  }
}
```

### Staging

```json
{
  "woocommerce": {
    "url": "https://staging-kaufe-es.eu",
    "timeoutMs": 30000
  },
  "job": {
    "mode": "continuous",
    "intervalMs": 3600000            // 1h (testing with real data)
  }
}
```

### Production

```json
{
  "woocommerce": {
    "url": "https://kaufe-es.eu",
    "timeoutMs": 30000
  },
  "job": {
    "mode": "continuous",
    "intervalMs": 900000             // 15min (full speed)
  }
}
```

---

## 7. Troubleshooting Checklist

If loops don't run as expected:

- [ ] **connection.json valid?** → `npm run validate:connection`
- [ ] **WooCommerce reachable?** → `curl https://kaufe-es.eu/wp-json/`
- [ ] **API keys active?** → Check WooCommerce Admin > Advanced > REST API
- [ ] **OpenAI account has credits?** → Check https://platform.openai.com/account/billing/overview
- [ ] **SMTP configured?** → `npm run test:smtp`
- [ ] **ml.config.ts valid?** → `npm run validate:ml-config`
- [ ] **Thresholds too high?** → Try aggressive settings
- [ ] **Loop mode is `continuous`?** → Check `job.mode`
- [ ] **Interval not too large?** → Min. 900000ms (15min)
- [ ] **Check logs** → `npm run logs:agent`

---

## 8. Important Shortcuts

```bash
# Validate config
npm run validate:all

# View agent logs
npm run logs:agent
npm run logs:agent:tail

# Trigger loop manually
npm run trigger:anomaly-detection
npm run trigger:payment-recovery
npm run trigger:product-optimization
npm run trigger:analytics-insights

# Agent health check
curl http://localhost:3000/api/agent/health

# View agent errors
curl http://localhost:3000/api/agent/errors

# Reload config (without restart)
curl -X POST http://localhost:3000/api/agent/config/reload

# View all patterns
curl http://localhost:3000/api/agent/memory/patterns

# Delete pattern
curl -X DELETE http://localhost:3000/api/agent/memory/patterns/:loopType/:patternKey
```

---

## Support

**Questions?**
- Technical details: [AGENTIC_TOOLS_REFERENCE.md](./AGENTIC_TOOLS_REFERENCE.md)
- Loop features: [AGENTIC_LOOP_ARCHITECTURE.md](./AGENTIC_LOOP_ARCHITECTURE.md)
- User guide: [AGENTIC_LOOPS_USER_GUIDE.md](./AGENTIC_LOOPS_USER_GUIDE.md)
