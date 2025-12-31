````markdown
# Agentic Loop Architecture

> **Note**: For user documentation see [AGENTIC_LOOPS_USER_GUIDE.md](./AGENTIC_LOOPS_USER_GUIDE.md)

## Overview

The Agentic Loop architecture enables autonomous agents working in a continuous cycle:

```
SENSE → THINK → ACT → LEARN → (REPEAT if needed)
         ↓       ↓      ↓        ↓
      Data  Analysis  Tools   Memory
```

Each loop can utilize **reusable tools** to perform ACT operations:
- **WooCommerce API Tool**: Reads/writes orders, products, customers
- **AI/ML Tool**: Generates insights, recommendations, variants
- **Alert Tool**: Sends notifications, logs
- **Storage Tool**: Persists learnings & patterns for future decisions

---

## 4 Agentic Loop Implementations

### 1. **Anomaly Detection Loop** 🚨
**File**: `backend/agent/loops/anomalyDetectionLoop.ts`

**Purpose**: Detects payment anomalies and creates recovery actions

**Flow**:

| Phase     | Tool            | Action                                          |
| --------- | --------------- | ----------------------------------------------- |
| **SENSE** | WooCommerce API | Load last 100 failed/pending orders             |
| **THINK** | Analyzer Tool   | Detect 4 anomaly types (see below)              |
| **ACT**   | Alert + Storage | Create recovery actions, save pattern           |
| **LEARN** | Memory Tool     | Refine detection logic for next iteration       |

**Detected Anomaly Types**:
```typescript
1. failed_payment: Status = "failed" → Severity: HIGH
   Tool: WooCommerce (Read order status)
   Action: Alert "Manual review required"

2. unusual_amount: Total > €5000 → Severity: MEDIUM
   Tool: Amount Analyzer
   Action: Flag "Manual review for high-value order"

3. repeated_attempts: Customer with 2+ failed payments → Severity: HIGH
   Tool: WooCommerce (Read customer order history)
   Action: Alert "Possible fraud / customer in distress"

4. high_risk: Pattern-based (e.g., same amount, multiple cards) → Severity: MEDIUM
   Tool: Pattern Analyzer
   Action: Alert "High-risk pattern detected"
```

**Output**:
```typescript
{
  totalAnomalies: 45,
  byType: { 
    failed_payment: 20, 
    unusual_amount: 15, 
    repeated_attempts: 8,
    high_risk: 2 
  },
  bySeverity: { 
    high: 30, 
    medium: 15 
  },
  recommendations: [
    "Order #8765 – Manual review (unusual_amount €7,500)",
    "Customer ID 234 – High-risk (3 failed attempts in 2 hours)"
  ]
}
```

**HTTP Endpoint**:
```bash
POST /api/agent/loops/anomaly-detection/run
```

**Tools used**:
- 🔗 **WooCommerce API Tool**: GET `/orders?status=failed,pending,cancelled`
- 📊 **Analyzer Tool**: Pattern matching, Amount validation
- 📧 **Alert Tool**: Log anomalies, queue notifications
- 💾 **Storage Tool**: Persist patterns for ML feedback

---

### 2. **Product Optimization Loop** 📈
**File**: `backend/agent/loops/productOptimizationLoop.ts`

**Purpose**: A/B tests product attributes to improve conversions

**Flow**:

| Phase     | Tool                 | Action                                                       |
| --------- | -------------------- | ------------------------------------------------------------ |
| **SENSE** | WooCommerce API      | Load 50 underperforming products (sorted by popularity)      |
| **THINK** | Variant Generator    | Create 3 variants per product                                |
| **ACT**   | A/B Test Tool        | Run simulated tests, determine winner                        |
| **LEARN** | Optimization Storage | Save successful variants for future application             |

**Generated Variants per Product**:
```typescript
1. Price Optimization:
   Original: €29.99
   Suggested: €26.99 (10% discount)
   Expected Impact: +15% Conversions
   Tool: Price Analyzer

2. Title Enhancement:
   Original: "Product name"
   Suggested: "Product name ⭐ Bestseller"
   Expected Impact: +8% Conversions
   Tool: SEO/Copywriting Tool

3. Description Upgrade:
   Original: [original text]
   Suggested: [original] + "\n✅ In stock\n✅ GDPR compliant\n✅ German quality"
   Expected Impact: +12% Conversions
   Tool: Copywriting Tool
```

**A/B Test Simulation**:
```typescript
For each variant {
  Baseline Conversions: calculateHistoricalRate(productId)
  Variant Conversions: Baseline × (1 + expectedImpact/100) + noise
  Winner: variant if conversions > baseline
  Improvement: ((variant - baseline) / baseline) * 100
}
```

**Output**:
```typescript
{
  totalTests: 150,
  winners: 42,
  avgImprovement: "8.7%",
  topOpportunities: [
    { 
      productId: 123, 
      attribute: 'price', 
      improvement: '23%',
      recommendation: "Apply -10% price strategy"
    }
  ],
  byAttribute: {
    price: { winners: 18, avgImprovement: '14.2%' },
    title: { winners: 12, avgImprovement: '6.8%' },
    description: { winners: 12, avgImprovement: '5.1%' }
  }
}
```

**HTTP Endpoint**:
```bash
POST /api/agent/loops/product-optimization/run
```

**Tools used**:
- 🔗 **WooCommerce API Tool**: GET `/products?orderby=popularity&order=asc`, UPDATE `/products/{id}`
- 🤖 **Variant Generator**: Create alternative titles/descriptions via OpenAI
- 📊 **A/B Test Tool**: Simulate conversions, calculate significance
- 💾 **Optimization Storage**: Save successful variants for A/B learning

---

### 3. **Payment Recovery Loop** 💳
**File**: `backend/agent/loops/paymentRecoveryLoop.ts`

**Purpose**: Attempts to recover failed orders with various strategies

**Flow**:

| Phase     | Tool                | Action                                       |
| --------- | ------------------- | -------------------------------------------- |
| **SENSE** | WooCommerce API     | Load failed/pending orders (last 30 days)    |
| **THINK** | Strategy Selector   | Select best recovery strategy per order      |
| **ACT**   | Recovery Tools (4x) | Execute strategy workflow                    |
| **LEARN** | Strategy Storage    | Save success rates per strategy segment      |

**Recovery Strategies with Individual Tools**:

```typescript
Strategy 1: RETRY (Basic Retry)
├─ Success Rate: ~35%
├─ When: Small amounts (<€50) or first attempt
├─ Tool: WooCommerce Payment Retry API
│   Action: Trigger payment reauthorization via gateway
├─ Output: Retry status, new transaction ID
└─ Learning: "Retry works for €20-€50 small orders"

Strategy 2: DISCOUNT (Incentive)
├─ Success Rate: ~45%
├─ When: Medium amounts (€50-€500)
├─ Tool: Email + Discount Code Generator
│   Action: Send personalized email: "€5 off to complete order"
├─ Output: Email sent, coupon activated
└─ Learning: "5-10% discounts work best; 15% is overkill"

Strategy 3: ALT_PAYMENT (Alternative Payment Method)
├─ Success Rate: ~52%
├─ When: Multiple attempts (>2) or high-value orders
├─ Tool: WooCommerce Payment Gateway Selector
│   Action: Send email: "Try different payment method (SEPA, PayPal)"
├─ Output: Email sent, gateway options presented
└─ Learning: "SEPA works 2x better than Credit Card retry"

Strategy 4: CONTACT (Direct Communication)
├─ Success Rate: ~60% (BEST)
├─ When: VIP customers, high-value (>€500), or repeat failures
├─ Tool: Email + CRM Integration
│   Action: Personalized email from support: "We're here to help. What's the issue?"
├─ Output: Email sent, support ticket opened
└─ Learning: "Personal touch converts 60% of €1000+ orders"
```

**Strategy Selection Logic** (in THINK phase):

```typescript
if (customer_new && amount > €100) {
  strategy = CONTACT  // VIP treatment for high-value new customers
} else if (attempts > 2) {
  strategy = ALT_PAYMENT  // They've tried multiple times – offer alternative
} else if (amount > €50) {
  strategy = DISCOUNT  // Incentivize mid-size orders
} else {
  strategy = RETRY  // Just retry for small orders
}
```

**Output**:
```typescript
{
  totalAttempts: 87,
  successCount: 28,
  successRate: "32.2%",
  totalRecovered: "€5,420.75",
  byStrategy: {
    retry: { attempts: 25, success: 8, rate: 32%, recovered: €800 },
    discount: { attempts: 30, success: 14, rate: 47%, recovered: €2100 },
    alt_payment: { attempts: 18, success: 9, rate: 50%, recovered: €1350 },
    contact: { attempts: 14, success: 9, rate: 64%, recovered: €1170 }
  },
  recommendations: [
    "DISCOUNT strategy performing best – increase allocation",
    "CONTACT strategy: only for €500+ orders (too much overhead for small)",
    "New insight: SEPA gateway outperforms Credit Card by 40%"
  ]
}
```

**HTTP Endpoint**:
```bash
POST /api/agent/loops/payment-recovery/run
```

**Tools used**:
- 🔗 **WooCommerce API Tool**: GET `/orders?status=failed,pending`, GET `/customers/{id}/orders`
- 🧠 **Strategy Selector**: Decision tree based on customer segment + amount
- 📧 **Email Tool**: Sends personalized recovery emails (uses email enhancement service)
- 💳 **Payment Tool**: Trigger retries via payment gateway API
- 🎟️ **Discount Tool**: Generate coupon codes, validate redemption
- 💾 **Strategy Storage**: Track which strategies work for which customer types

---

### 4. **Analytics Insights Loop** 📊
**File**: `backend/agent/loops/analyticsInsightsLoop.ts`

**Purpose**: Analyzes shop data and generates automatic business recommendations

**Flow**:

| Phase     | Tool                        | Action                                  |
| --------- | --------------------------- | --------------------------------------- |
| **SENSE** | WooCommerce + Reporting API | Collect metrics for all time periods    |
| **THINK** | Trend Analyzer + ML         | Detect trends, anomalies, patterns      |
| **ACT**   | Insight Generator           | Create human-readable recommendations   |
| **LEARN** | Analytics Storage           | Save historical data for trend analysis |

**Captured Metrics** (from SENSE tool):

```typescript
Dashboard Metrics (Last 30 Days):
├─ Revenue
│  ├─ Current: €45,000
│  ├─ Last Month: €42,000
│  ├─ Change: +7.1%
│  └─ Trend: 📈 Positive
│
├─ Orders
│  ├─ Current: 320
│  ├─ Last Month: 310
│  ├─ Change: +3.2%
│  └─ Trend: 📈 Positive
│
├─ Customers
│  ├─ Current: 180
│  ├─ Unique New: 45
│  ├─ Retention: 88%
│  └─ Trend: 📈 Positive
│
├─ Conversion Rate
│  ├─ Current: 3.2%
│  ├─ Last Month: 3.1%
│  ├─ Change: +3.2%
│  └─ Trend: 📈 Positive
│
└─ Avg Order Value
   ├─ Current: €140.60
   ├─ Last Month: €135.50
   ├─ Change: +3.8%
   └─ Trend: 📈 Positive
```

**Anomaly Detection** (THINK Tool):

```typescript
Threshold: ±15% change = WARNING
           ±20% change = CRITICAL

Example:
Conversion Rate Change: -22% → CRITICAL Anomaly
├─ Current: 2.5%
├─ Expected: 3.2%
├─ Deviation: -22%
├─ Severity: 🔴 CRITICAL
└─ Root Cause Suggestions (AI):
   "Checkout flow issue? Abandoned cart increased 40%"
   "Payment gateway downtime yesterday – check logs"
   "Recent marketing campaign attracted low-intent traffic"
```

**Insight Generation** (ACT Tool):

```typescript
Insights generated from metrics + anomalies:

[HIGH PRIORITY]
1. 🚨 Conversion Drop: "Convert rate -22%. Fix checkout flow ASAP"
   Action: Review checkout steps, test payment methods
   Expected Impact: Could recover 2% → +€14,000/month

2. 📊 Revenue UP +7%: "Keep doing what you're doing! 🎉"
   Action: None – status quo
   
3. 💰 AOV Trend: "Avg order value climbing. Try upsells?"
   Action: Test product bundle recommendations
   Expected Impact: Additional +€2-3/order

[MEDIUM PRIORITY]
4. 👥 Customer Acquisition: "New customers +12% this month"
   Action: Scale successful ads, increase retention focus
   Expected Impact: Compound growth

5. 📈 Repeat Purchase: "88% retention rate – strong!"
   Action: Launch loyalty program to push to 92%
   Expected Impact: +5% sustainable revenue
```

**Output**:
```typescript
{
  period: "2025-12-17 to 2025-01-17",
  metrics: {
    revenue: { current: 45000, change: 7.1, trend: 'up' },
    orders: { current: 320, change: 3.2, trend: 'up' },
    customers: { current: 180, change: 12, trend: 'up' },
    conversion: { current: 3.2, change: 3.2, trend: 'stable' },
    avgOrderValue: { current: 140.6, change: 3.8, trend: 'up' }
  },
  anomalies: [
    {
      metric: 'conversion',
      severity: 'warning',
      change: -15.2,
      recommendation: 'Check checkout UX / payment gateway'
    }
  ],
  insights: [
    {
      title: 'Revenue Growth Accelerating',
      value: '+7.1%',
      priority: 'high',
      action: 'Maintain current strategy'
    },
    {
      title: 'New Customer Acquisition Strong',
      value: '+12%',
      priority: 'high',
      action: 'Scale successful channels'
    }
  ]
}
```

**HTTP Endpoint**:
```bash
POST /api/agent/loops/analytics-insights/run
```

**Tools used**:
- 📊 **WooCommerce Reporting API**: GET orders, revenue, customers metrics
- 📈 **Trend Analyzer**: YoY/MoM/WoW comparison, growth rate calculation
- 🚨 **Anomaly Detector**: >15% deviation detection, root cause analysis
- 🤖 **Insight Generator**: Uses OpenAI for human-readable recommendations
- 💾 **Analytics Storage**: Save historical data for trend analysis

---

## 🔧 Shared Tools & Patterns

### Storage / Memory Tool
```typescript
// Each loop can persistently save learnings
persistentMemory.remember({
  key: 'anomaly_patterns_high_risk',
  value: { pattern: 'repeated_failed_attempts', frequency: 8 },
  ttl: 604800 // 1 week
})

// Retrieve later
const patterns = persistentMemory.recall('anomaly_patterns_high_risk')
```

### Execution Logger
```typescript
// Each loop is logged
executionLogger.logExecution({
  loopName: 'payment-recovery',
  status: 'success',
  result: {
    totalAttempts: 87,
    successCount: 28,
    recovered: €5420.75
  }
})

// Retrieve monitoring
const history = executionLogger.getHistory('payment-recovery', 100)
```

### Loop Scheduler
```typescript
// Persistent configuration (backend/data/loop-schedules.json)
//   - anomaly-detection: daily HH:MM
//   - payment-recovery: interval (15/30/45/60 min)
//   - product-optimization: weekly (weekdays + HH:MM)
//   - analytics-insights: daily HH:MM

// Load & schedule
const schedules = loopScheduleManager.getAllSchedules();
Object.entries(schedules).forEach(([loopType, cfg]) => {
  if (!cfg.enabled) return;
  const cron = scheduleToCron(cfg); // e.g. */30 * * * *
  scheduler.scheduleLoop(loopType, cron, () => runLoop(loopType));
});

// API update → reschedule (PUT /api/agent/monitoring/schedules/:loopType)
loopScheduleManager.updateSchedule(loopType, body);
await scheduler.rescheduleLoop(loopType, body);
```

---

## 📊 Monitoring & Observability

All loops write to central **ExecutionLogger** & **PersistentMemory**:

```
Loop Monitoring Dashboard
├─ Status (Running / Scheduled / Failed)
├─ Last Execution (Time + Result)
├─ History (Last 100 runs)
├─ Statistics (Avg duration, success rate, learnings)
├─ Trends (7-day graph of key metrics)
└─ Insights (What the loop learned)
```

Available endpoints:
```bash
GET  /api/monitoring/agent/loops/status
GET  /api/monitoring/agent/loops/history
GET  /api/monitoring/agent/loops/stats
GET  /api/monitoring/agent/loops/trends
GET  /api/monitoring/agent/loops/insights
POST /api/monitoring/agent/loops/{loop}/start
POST /api/monitoring/agent/loops/{loop}/stop
```

---

## 🎯 Best Practices

1. **Per Loop: One responsible tool set**
   - Anomaly Detection: focused on WooCommerce API + Analyzer
   - Product Optimization: focused on Variant Generator + A/B Tool
   - Payment Recovery: focused on Strategy Selector + Email Tool
   - Analytics: focused on Reporting API + Trend Analyzer

2. **Save & retrieve learnings**
   - Each loop saves success patterns in memory
   - Future iterations improve based on learnings

3. **Failures are OK**
   - Loops have built-in retry logic
   - Errors are logged + alerted
   - Continue next iteration despite errors

---

**Next Steps:**
- Read [AGENTIC_LOOPS_USER_GUIDE.md](./AGENTIC_LOOPS_USER_GUIDE.md) for shop admin perspective
- See [API Documentation](./api/agent-loops.md) for developer details

- **THINK**: Generates 3 variants per product:
  - `price`: 10% discount
  - `title`: Adds "⭐ Bestseller"
  - `description`: Adds availability message
- **ACT**: Simulates A/B test with conversion lift (~15%)
- **LEARN**: Applies winner variants (if improvement > 5%)

**Output**:
```typescript
{
  totalTests: 150,
  winners: 42,
  avgImprovement: "8.7%",
  topOpportunities: [
    { productId: 123, attribute: 'price', improvement: '23%' }
  ]
}
```

**HTTP Endpoint**:
```bash
POST /api/agent/loops/product-optimization/run
```

---

### 3. **Payment Recovery Loop** 💳
**File**: `backend/agent/loops/paymentRecoveryLoop.ts`

**Purpose**: Attempts to recover failed orders with various strategies

**Flow**:
- **SENSE**: Load failed/pending orders from last 30 days
- **THINK**: Select best recovery strategy:
  - New customers + high amount → **Contact** (60% success rate)
  - Multiple attempts → **Alternative payment** (52%)
  - Medium amounts → **Discount** (45%)
  - Small amounts → **Retry** (35%)
- **ACT**: Execute recovery strategies
- **LEARN**: Save which strategy worked for which order

**Output**:
```typescript
{
  totalAttempts: 42,
  successCount: 15,
  successRate: "35.7%",
  totalRecovered: "€2,100.50",
  byStrategy: {
    retry: { success: 5, total: 12 },
    discount: { success: 7, total: 15 },
    ...
  }
}
```

**HTTP Endpoint**:
```bash
POST /api/agent/loops/payment-recovery/run
```

---

### 4. **Analytics Insights Loop** 📊
**File**: `backend/agent/loops/analyticsInsightsLoop.ts`

**Purpose**: Generates dashboard insights from analytics data

**Flow**:
- **SENSE**: Collect metrics (revenue, orders, customers, conversion, AOV)
- **THINK**: Analyze trends & detect anomalies:
  - If change > 15% → Anomaly detected
- **ACT**: Generate insight cards with recommendations
- **LEARN**: Save best practices for future recommendations

**Output**:
```typescript
{
  totalInsights: 8,
  highPriority: 3,
  mediumPriority: 2,
  anomaliesDetected: 2,
  criticalAnomalies: 1,
  insights: [
    {
      title: "📈 Revenue Growth",
      trend: "up",
      recommendation: "Maintain current strategy and scale"
    }
  ],
  topAnomalies: [
    { metric: "conversion", deviation: "-18.5%" }
  ]
}
```

**HTTP Endpoint**:
```bash
POST /api/agent/loops/analytics-insights/run
```

---

## Base Architecture: AgenticLoop Class

**File**: `backend/agent/agenticLoop.ts`

### Core Concepts

#### 1. **LoopStep Interface**
```typescript
interface LoopStep {
  name: string;
  description: string;
  action: () => Promise<any>;
  validation?: () => boolean;
}
```

#### 2. **LoopContext**
```typescript
class LoopContext {
  id: string;
  type: string;
  iteration: number;
  maxIterations: number;
  status: 'running' | 'completed' | 'failed';
  findings: any[] = [];
  decisions: any[] = [];
  learnings: any[] = [];
}
```

#### 3. **LoopResult**
```typescript
interface LoopResult {
  success: boolean;
  context: LoopContext;
  insights: string[];
  recommendations: string[];
  executionTime: number;
}
```

### 5-Phase Execution Cycle

```typescript
async execute(): Promise<LoopResult> {
  while (this.shouldContinue()) {
    this.sense();      // Gather data
    this.think();      // Analyze
    this.act();        // Take action
    this.learn();      // Learn
    this.context.iteration++;
  }
  return this.buildResult();
}
```

---

## HTTP API

### 1. Start loop

```bash
POST /api/agent/loops/:type/run
?maxIterations=4

Response:
{
  success: true,
  loopType: "anomaly-detection",
  executionTime: 1234,
  result: { ... }
}
```

### 2. Get loop status

```bash
GET /api/agent/loops/status

Response:
{
  availableLoops: {
    "anomaly-detection": { description: "...", status: "active" },
    "product-optimization": { description: "...", status: "active" },
    "payment-recovery": { description: "...", status: "active" },
    "analytics-insights": { description: "...", status: "active" }
  }
}
```

### 3. Get loop schema

```bash
GET /api/agent/loops/:type/schema

Response:
{
  name: "Anomaly Detection Loop",
  description: "Detect payment anomalies...",
  phases: ["sense", "think", "act", "learn"],
  output: { totalAnomalies: "number", ... }
}
```

---

## Integration in Workflows

### Example: Check anomalies daily at 09:00

```bash
# With node-cron or PM2 ecosystem.config.cjs
curl -X POST http://localhost:3000/api/agent/loops/anomaly-detection/run
```

### Example: Start optimization after product upload

```bash
# In ProductUploader
const response = await fetch('/api/agent/loops/product-optimization/run', {
  method: 'POST'
});
```

---

## Memory System

Each loop has access to **Memory** for:
- **Learnings**: What works well?
- **Patterns**: Which anomalies occur?
- **Success Rates**: Success rates of strategies

```typescript
// In memory.ts
memory.store('payment-recovery-success-rates', {
  'contact': 0.60,
  'discount': 0.45,
  'retry': 0.35
});
```

---

## Extension: Create Custom Loop

```typescript
import { AgenticLoop } from '../agenticLoop';

export class CustomLoop extends AgenticLoop {
  constructor() {
    super('custom-loop', 4);
    this.setupSteps();
  }

  private setupSteps(): void {
    this.addStep({
      name: 'sense',
      description: 'Gather data',
      action: async () => {
        // Your logic here
        return data;
      }
    });

    // Add think, act, learn, shouldContinue...
  }

  getSummary() {
    // Summarize results
    return { ... };
  }
}
```

---

## Monitoring & Logging

All loops log their activities:

```
🔍 SENSE: Finding failed payment orders...
💳 SENSE: Found 45 orders to recover
🧠 THINK: Selecting recovery strategies...
⚡ ACT: Executing recovery attempts...
✅ Act: Order 123: retry - Payment retry succeeded
📚 LEARN: Evaluating strategy effectiveness...
```

---

## Test Status

| Loop                 | Tests | Status                              |
| -------------------- | ----- | ----------------------------------- |
| Anomaly Detection    | 5     | ⏭️ Skipped (WooCommerce mock needed) |
| Product Optimization | 6     | ⏭️ Skipped                           |
| Payment Recovery     | 6     | ⏭️ Skipped                           |
| Analytics Insights   | 6     | ⏭️ Skipped                           |

Tests are implemented but need WooCommerce API mock setup.

---

## Next Steps

1. ✅ 4 agentic loop implementations
2. ✅ HTTP endpoints registered
3. ✅ Basic tests written
4. ⏳ Tests with complete mocks
5. ⏳ Scheduling (e.g., daily 09:00 anomaly detection)
6. ⏳ Dashboard integration for loop results
7. ⏳ Machine learning integration for better decisions

---

**Created**: 2025-01-04  
**Architecture**: Agentic Loop Pattern (Sense → Think → Act → Learn → Repeat)  
**Framework**: Fastify + TypeScript + WooCommerce API

````