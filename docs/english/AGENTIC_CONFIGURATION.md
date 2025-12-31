# Agentic Configuration Guide

> For shop admins: configure A.R.I. and adjust loops.
> For developers: see AGENTIC_TOOLS_REFERENCE.md.

---

## Overview

Agentic Loops are configured through two files:

1. backend/connection.json – external integrations (WooCommerce, OpenAI, SMTP, Reddit)
2. backend/agent/config/ml.config.ts – loop behavior and thresholds

---

## 1. connection.json – External credentials

File: backend/connection.json

### 1.1 WooCommerce integration

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

Field reference:

| Field | Type | Meaning | Example |
| --- | --- | --- | --- |
| url | string | WooCommerce shop URL (must be HTTPS) | https://kaufe-es.eu |
| consumerKey | string | WooCommerce REST API key | Generated in WP Admin → Settings → Advanced → REST API |
| consumerSecret | string | WooCommerce REST API secret | Generated in WP Admin → Settings → Advanced → REST API |
| authMode | basic | oauth | Authentication method | basic (default) |
| timeoutMs | number | Max wait time for API calls | 30000 (30 seconds) |

How to generate the API key:

1. WooCommerce Admin → Settings → Advanced → REST API
2. Click Create key / Add Key
3. Name it e.g. "A.R.I. Loop Agent"
4. Permissions: Read/Write for orders, products, customers
5. Click Generate
6. Copy consumerKey and consumerSecret into connection.json

Security:
- Never commit connection.json (keep it in .gitignore)
- Use env vars in production: WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET
- Rotate keys regularly (for example quarterly)

---

### 1.2 OpenAI integration

```json
{
  "openAI": {
    "apiKey": "sk-proj-...",
    "model": "gpt-4o-mini"
  }
}
```

Field reference:

| Field | Type | Meaning | Example |
| --- | --- | --- | --- |
| apiKey | string | OpenAI API key | https://platform.openai.com/api-keys |
| model | string | LLM model | gpt-4o-mini (budget) or gpt-4 (powerful) |

Model options:

| Model | Cost (per 1k tokens) | Speed | Use case |
| --- | --- | --- | --- |
| gpt-4o-mini | ~€0.001-0.003 | Fast | Email, variant generation (recommended) |
| gpt-4 | ~€0.01-0.03 | Medium | Complex analysis, strategy selection |
| gpt-4-turbo | ~€0.01 | Medium | Balanced (older) |

Cost management:
- Loops use ~1,000–2,000 tokens per run
- intervalMs 900000 (15 min) ≈ 2,880–5,760 tokens/day
- Estimated monthly cost: €0.02–0.05 with gpt-4o-mini

How to get API keys:
1. Go to https://platform.openai.com/account/api-keys
2. Log in
3. Click + Create new secret key
4. Copy the key (shown once)
5. Add it to connection.json

---

### 1.3 SMTP / Email

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

Field reference:

| Field | Type | Meaning | Example |
| --- | --- | --- | --- |
| host | string | Mail server hostname | inn.bitpalast.net or smtp.gmail.com |
| port | number | SMTP port | 465 (TLS), 587 (STARTTLS), 25 (unencrypted) |
| secure | boolean | TLS enabled | true for 465, false for 587 |
| user | string | SMTP user | info@kaufe-es.eu |
| password | string | SMTP password | From your provider |
| from | string | Sender email | info@kaufe-es.eu or "A.R.I. Recovery <recovery@kaufe-es.eu>" |

Common providers:

```json
// Gmail
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "your-email@gmail.com",
  "password": "your-app-password"
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

Gmail app password:
1. https://myaccount.google.com/apppasswords
2. Choose Mail → Windows PC
3. Google generates a 16-char password
4. Use that in connection.json (not your Gmail password)

---

### 1.4 Reddit integration (optional)

```json
{
  "reddit": {
    "clientId": "...",
    "clientSecret": "..."
  }
}
```

Used for social listening only.

---

### 1.5 Loop schedules (per loop configurable)

File: backend/data/loop-schedules.json

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

Fields:

| Field | Type | Meaning |
| --- | --- | --- |
| enabled | boolean | Loop active (true) / paused (false) |
| type | string | daily | weekly | interval |
| time | string | HH:MM (daily, weekly) |
| weekdays | string[] | e.g. ["Monday","Friday"] (weekly only) |
| minutes | number | 15 | 30 | 45 | 60 (interval only) |

API:
- GET  /api/agent/monitoring/schedules – all schedules
- GET  /api/agent/monitoring/schedules/:loopType
- PUT  /api/agent/monitoring/schedules/:loopType – update and reschedule immediately
- POST /api/agent/monitoring/schedules/:loopType/toggle – enable/disable

UI:
Settings → Agentic Loops → Schedule (modal)
- Anomaly Detection: daily HH:MM
- Payment Recovery: interval 15/30/45/60 min
- Product Optimization: weekly (weekdays + HH:MM)
- Analytics Insights: daily HH:MM

---

### 1.6 ML feature switches

```json
{
  "features": {
    "enableAnalytics": true,
    "enableAutoProducts": true,
    "enableEmailMarketing": true
  }
}
```

Feature toggles; loops themselves are controlled in ml.config.ts.

---

## 2. ml.config.ts – Loop behavior and thresholds

File: backend/agent/config/ml.config.ts
Purpose: tune loop behavior without code changes.

### 2.1 Anomaly Detection

```typescript
export const anomalyDetectionConfig = {
  // Inputs
  orderLimit: 100,
  maxDaysOld: 30,

  // Thresholds
  anomalyThresholds: {
    unusualAmount: 5000,
    repeatedFailureThreshold: 2,
    repeatedFailureTimeWindowMinutes: 120,
    highRiskPatternMatches: 3
  },

  // Severity
  severityWeights: {
    failed_payment: 'HIGH',
    unusual_amount: 'MEDIUM',
    repeated_attempts: 'HIGH',
    high_risk: 'MEDIUM'
  },

  // Behavior
  autoRecoveryEnabled: true,
  recoveryChainEnabled: true,
  maxRecoveryAttempts: 3,

  // Alerts
  alertThreshold: 'HIGH',
  batchAlertsWhenAbove: 10
};
```

Recommended presets:

```typescript
// Aggressive (early detection)
{ unusualAmount: 3000, repeatedFailureThreshold: 1, maxRecoveryAttempts: 5 }

// Conservative (high precision)
{ unusualAmount: 10000, repeatedFailureThreshold: 5, maxRecoveryAttempts: 1 }

// Balanced (default)
{ unusualAmount: 5000, repeatedFailureThreshold: 2, maxRecoveryAttempts: 3 }
```

---

### 2.2 Product Optimization

```typescript
export const productOptimizationConfig = {
  // Inputs
  productLimit: 50,
  minOrderHistory: 30,
  minConversionRate: 0.02,

  // Variant generation
  variantTypesToGenerate: ['price', 'title', 'description'],
  variantsPerProduct: 3,

  // Simulation
  abTestSampleSize: 1000,
  confidenceLevel: 0.95,
  minLiftThreshold: 0.05,
  statisticalSignificanceLevel: 0.05,

  // Price limits
  discountLimits: {
    minDiscount: 5,
    maxDiscount: 30,
    targetMarginPercent: 30
  },

  // Copy generation
  titleMaxLength: 70,
  descriptionMaxLength: 300,

  // Auto-apply
  autoApplyWinners: false,
  autoApplyConfidenceThreshold: 0.85,

  // Alerts
  alertThreshold: 'INFO',
  notifyOnHighLift: 0.20
};
```

Risk appetite presets:

```typescript
// Conservative (manual approval)
{ autoApplyWinners: false, confidenceLevel: 0.99, minLiftThreshold: 0.10 }

// Moderate (semi-auto)
{ autoApplyWinners: false, autoApplyConfidenceThreshold: 0.85, minLiftThreshold: 0.05 }

// Aggressive (full auto)
{ autoApplyWinners: true, autoApplyConfidenceThreshold: 0.75, minLiftThreshold: 0.03 }
```

---

### 2.3 Payment Recovery

```typescript
export const paymentRecoveryConfig = {
  // Inputs
  orderLimit: 50,
  maxOrderAgeHours: 24,
  minOrderAmount: 10,

  // Triggers
  triggerThresholds: {
    failureStatus: ['failed', 'on-hold', 'pending'],
    customerFailureRateThreshold: 0.3
  },

  // Strategies
  strategies: {
    retry: { enabled: true, delayMinutes: 30, maxAttempts: 2 },
    discount: { enabled: true, percentages: [5, 10, 15], respectMarginLimits: true },
    alternative_payment: { enabled: true, preferredMethods: ['klarna', 'paypal', 'bank_transfer'] },
    contact: { enabled: true, triggerOn: ['high_amount', 'repeated_failure'], assignToTeam: 'sales' }
  },

  // Email
  emailTemplate: 'payment_recovery',
  emailDelay: 5,
  includeSocialProof: true,

  // Success tracking
  successThreshold: 0.40,
  alertWhenUnder: 0.25,

  // Escalation
  escalationEnabled: true,
  escalateAfterFailures: 2
};
```

Strategy presets:

```typescript
// Revenue-focused (aggressive)
{ discount: { percentages: [10, 15, 20] }, contact: { triggerOn: ['high_amount'] }, strategies: { contact: { enabled: false } } }

// Relationship-focused
{ discount: { percentages: [5, 5] }, contact: { enabled: true, triggerOn: ['any'] }, escalationEnabled: true }

// Balanced
{ discount: { percentages: [5, 10, 15] }, contact: { triggerOn: ['high_amount', 'repeated_failure'] } }
```

---

### 2.4 Analytics Insights

```typescript
export const analyticsInsightsConfig = {
  // Data aggregation
  daysToAnalyze: 90,
  metricsToTrack: [
    'average_order_value',
    'conversion_rate',
    'customer_acquisition_cost',
    'refund_rate',
    'repeat_customer_rate',
    'churn_rate'
  ],

  // Metric anomaly detection
  anomalyDetection: { enabled: true, sigma: 2.5 },

  // Trend analysis
  trendAnalysis: { minDataPoints: 7, trendConfidenceThreshold: 0.70 },

  // Forecasting
  forecastingEnabled: true,
  forecastMethod: 'arima',
  forecastDays: 7,

  // Insight generation
  minInsightConfidence: 0.75,
  maxInsightsPerRun: 5,

  // AI copy
  generateRecommendations: true,
  recommendationModel: 'gpt-4o-mini',

  // Alerting
  criticalThresholds: {
    conversionRateDrop: 0.15,
    churnRateIncrease: 0.25,
    aovDecrease: 0.20
  }
};
```

---

## 3. Loop frequencies and scheduling

Recommended baseline:

```json
{
  "job": { "mode": "continuous", "intervalMs": 900000 },
  "loopSchedules": {
    "anomaly_detection": { "frequencyMultiplier": 1, "intervalMs": 900000 },
    "product_optimization": { "frequencyMultiplier": 2, "intervalMs": 1800000 },
    "payment_recovery": { "frequencyMultiplier": 1, "intervalMs": 900000 },
    "analytics_insights": { "frequencyMultiplier": 4, "intervalMs": 3600000 }
  }
}
```

Rationale:
- Anomaly Detection: fast (15 min) because payment issues are frequent
- Product Optimization: medium (30 min) to allow A/B tests to settle
- Payment Recovery: fast (15 min) because recovery window is short
- Analytics Insights: slower (1 h) due to heavy aggregation

---

## 4. Monitoring and health checks

### 4.1 Validate configs

```bash
npm run validate:connection
npm run validate:ml-config
npm run validate:all
```

### 4.2 Health check endpoint

```bash
curl http://localhost:3000/api/agent/health
```

Sample response:

```json
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

## 5. Best practices and common mistakes

Best practices:
1) Test before production (set mode: once in ml.config.ts, run npm run dev, trigger via API)
2) Lower thresholds gradually (start aggressive, observe 1–2 weeks, adjust)
3) Use environment variables (do not hardcode secrets)
4) Take regular backups (copy connection.json)

Common mistakes:

| Mistake | Symptom | Fix |
| --- | --- | --- |
| WooCommerce URL wrong | "401 Unauthorized" | Ensure https:// and correct domain |
| API key expired | "Invalid credentials" | Regenerate key in WooCommerce Admin |
| SMTP auth wrong | "Email not sent" | npm run test:smtp |
| Thresholds too high | No anomalies detected | Lower unusualAmount, repeatedFailureThreshold |
| Loop not running | job.mode is once | Set job.mode to continuous |

---

## 6. Configuration by environment

Development:

```json
{
  "woocommerce": { "url": "http://localhost:8080", "timeoutMs": 60000 },
  "job": { "mode": "once", "intervalMs": 900000 }
}
```

Staging:

```json
{
  "woocommerce": { "url": "https://staging-kaufe-es.eu", "timeoutMs": 30000 },
  "job": { "mode": "continuous", "intervalMs": 3600000 }
}
```

Production:

```json
{
  "woocommerce": { "url": "https://kaufe-es.eu", "timeoutMs": 30000 },
  "job": { "mode": "continuous", "intervalMs": 900000 }
}
```

---

## 7. Troubleshooting checklist

- [ ] connection.json valid (npm run validate:connection)
- [ ] WooCommerce reachable (curl https://kaufe-es.eu/wp-json/)
- [ ] API keys active (WooCommerce Admin → Advanced → REST API)
- [ ] OpenAI account funded (platform.openai.com/account/billing/overview)
- [ ] SMTP configured (npm run test:smtp)
- [ ] ml.config.ts valid (npm run validate:ml-config)
- [ ] Thresholds not too high (try aggressive settings)
- [ ] Loop mode set to continuous
- [ ] Interval not too large (min 900000 ms)
- [ ] Logs checked (npm run logs:agent)

---

## 8. Shortcuts

```bash
npm run validate:all
npm run logs:agent
npm run logs:agent:tail
npm run trigger:anomaly-detection
npm run trigger:payment-recovery
npm run trigger:product-optimization
npm run trigger:analytics-insights
curl http://localhost:3000/api/agent/health
curl http://localhost:3000/api/agent/errors
curl -X POST http://localhost:3000/api/agent/config/reload
curl http://localhost:3000/api/agent/memory/patterns
curl -X DELETE http://localhost:3000/api/agent/memory/patterns/:loopType/:patternKey
```

---

## Support

- Technical details: AGENTIC_TOOLS_REFERENCE.md
- Loop behavior: AGENTIC_LOOP_ARCHITECTURE.md
- User guide: AGENTIC_LOOPS_USER_GUIDE.md
