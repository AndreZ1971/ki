# Agentic Loop Architecture

> **Hinweis**: Für Benutzer-Dokumentation siehe [AGENTIC_LOOPS_USER_GUIDE.md](./AGENTIC_LOOPS_USER_GUIDE.md)

## Übersicht

Die Agentic Loop Architektur ermöglicht autonome Agenten, die in einem kontinuierlichen Zyklus arbeiten:

```
SENSE → THINK → ACT → LEARN → (REPEAT if needed)
         ↓       ↓      ↓        ↓
      Daten  Analyse  Tools   Memory
```

Jeder Loop kann **wiederverwendbare Tools** zur Durchführung von ACT-Operationen nutzen:
- **WooCommerce API Tool**: Liest/schreibt Orders, Produkte, Customers
- **AI/ML Tool**: Generiert Insights, Empfehlungen, Varianten
- **Alert Tool**: Versendet Notifications, Logs
- **Storage Tool**: Speichert Learnings & Patterns für zukünftige Entscheidungen

---

## 4 Agentic Loop Implementierungen

### 1. **Anomaly Detection Loop** 🚨
**Datei**: `backend/agent/loops/anomalyDetectionLoop.ts`

**Zweck**: Erkennt Payment-Anomalien und erstellt Recovery-Actions

**Flow**:

| Phase     | Tool            | Aktion                                           |
| --------- | --------------- | ------------------------------------------------ |
| **SENSE** | WooCommerce API | Lade letzte 100 failed/pending Orders            |
| **THINK** | Analyzer Tool   | Erkenne 4 Anomaly-Types (s.u.)                   |
| **ACT**   | Alert + Storage | Erstelle Recovery-Actions, speichere Pattern     |
| **LEARN** | Memory Tool     | Verfeinere Erkennungslogik für nächste Iteration |

**Erkannte Anomaly-Types**:
```typescript
1. failed_payment: Status = "failed" → Severity: HIGH
   Tool: WooCommerce (Lese Order Status)
   Action: Alert "Manual review required"

2. unusual_amount: Total > €5000 → Severity: MEDIUM
   Tool: Amount Analyzer
   Action: Flag "Manual review for high-value order"

3. repeated_attempts: Customer mit 2+ failed Payments → Severity: HIGH
   Tool: WooCommerce (Lese Customer Order History)
   Action: Alert "Possible fraud / customer in distress"

4. high_risk: Pattern-based (z.B. gleicher Betrag, mehrere Cards) → Severity: MEDIUM
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
**Datei**: `backend/agent/loops/productOptimizationLoop.ts`

**Zweck**: A/B testet Produkt-Attribute um Conversions zu verbessern

**Flow**:

| Phase     | Tool                 | Aktion                                                       |
| --------- | -------------------- | ------------------------------------------------------------ |
| **SENSE** | WooCommerce API      | Lade 50 underperforming Products (nach Popularität sortiert) |
| **THINK** | Variant Generator    | Erstelle 3 Varianten pro Produkt                             |
| **ACT**   | A/B Test Tool        | Führe simulierte Tests durch, bestimme Winner                |
| **LEARN** | Optimization Storage | Speichere erfolgreich Varianten für zukünftige Anwendung     |

**Generierte Varianten pro Produkt**:
```typescript
1. Price Optimization:
   Original: €29.99
   Suggested: €26.99 (10% discount)
   Expected Impact: +15% Conversions
   Tool: Price Analyzer

2. Title Enhancement:
   Original: "Produktname"
   Suggested: "Produktname ⭐ Bestseller"
   Expected Impact: +8% Conversions
   Tool: SEO/Copywriting Tool

3. Description Upgrade:
   Original: [original text]
   Suggested: [original] + "\n✅ Sofort lieferbar\n✅ DSGVO konform\n✅ Deutsche Qualität"
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
- 🤖 **Variant Generator**: Erstellt alternative Titles/Descriptions via OpenAI
- 📊 **A/B Test Tool**: Simuliert Conversions, berechnet Significance
- 💾 **Optimization Storage**: Speichert erfolgreiche Varianten für A/B Learning

---

### 3. **Payment Recovery Loop** 💳
**Datei**: `backend/agent/loops/paymentRecoveryLoop.ts`

**Zweck**: Versucht Failed Orders mit verschiedenen Strategien zu recovern

**Flow**:

| Phase     | Tool                | Aktion                                       |
| --------- | ------------------- | -------------------------------------------- |
| **SENSE** | WooCommerce API     | Lade Failed/Pending Orders (letzten 30 Tage) |
| **THINK** | Strategy Selector   | Wähle beste Recovery-Strategie per Order     |
| **ACT**   | Recovery Tools (4x) | Führe Strategie-Workflow aus                 |
| **LEARN** | Strategy Storage    | Speichere Erfolgsraten per Strategie-Segment |

**Recovery-Strategien mit jeweils eigenen Tools**:

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
- 🧠 **Strategy Selector**: Decision tree basierend auf Customer Segment + Amount
- 📧 **Email Tool**: Sends personalized recovery emails (nutzt Email Enhancement Service)
- 💳 **Payment Tool**: Trigger retries via Payment Gateway API
- 🎟️ **Discount Tool**: Generate coupon codes, validate redemption
- 💾 **Strategy Storage**: Track which strategies work für welche Kundentypen

---

### 4. **Analytics Insights Loop** 📊
**Datei**: `backend/agent/loops/analyticsInsightsLoop.ts`

**Zweck**: Analysiert Shop-Daten und generiert automatische Business-Empfehlungen

**Flow**:

| Phase     | Tool                        | Aktion                                  |
| --------- | --------------------------- | --------------------------------------- |
| **SENSE** | WooCommerce + Reporting API | Sammle Metriken für alle Zeiträume      |
| **THINK** | Trend Analyzer + ML         | Erkenne Trends, Anomalien, Muster       |
| **ACT**   | Insight Generator           | Erstelle Human-readable Recommendations |
| **LEARN** | Analytics Storage           | Speichere historische Daten für Trends  |

**Erfasste Metriken** (vom SENSE Tool):

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
- 🤖 **Insight Generator**: Nutzt OpenAI für human-readable recommendations
- 💾 **Analytics Storage**: Speichert historische Daten für Trend-Analyse

---

## 🔧 Gemeinsame Tools & Patterns

### Storage / Memory Tool
```typescript
// Jeder Loop kann Learnings persistent speichern
persistentMemory.remember({
  key: 'anomaly_patterns_high_risk',
  value: { pattern: 'repeated_failed_attempts', frequency: 8 },
  ttl: 604800 // 1 week
})

// Später abrufen
const patterns = persistentMemory.recall('anomaly_patterns_high_risk')
```

### Execution Logger
```typescript
// Jeder Loop wird geloggt
executionLogger.logExecution({
  loopName: 'payment-recovery',
  status: 'success',
  result: {
    totalAttempts: 87,
    successCount: 28,
    recovered: €5420.75
  }
})

// Monitoring abrufen
const history = executionLogger.getHistory('payment-recovery', 100)
```

### Loop Scheduler
```typescript
// Loops können zeit-basiert oder ereignis-basiert triggert werden
scheduler.schedule('payment-recovery', {
  cron: '0 */4 * * *', // Every 4 hours
  maxDuration: 300000 // 5 min timeout
})
```

---

## 📊 Monitoring & Observability

Alle Loops schreiben in zentrale **ExecutionLogger** & **PersistentMemory**:

```
Loop Monitoring Dashboard
├─ Status (Running / Scheduled / Failed)
├─ Last Execution (Time + Result)
├─ History (Last 100 runs)
├─ Statistics (Avg duration, success rate, learnings)
├─ Trends (7-day graph of key metrics)
└─ Insights (What the loop learned)
```

Verfügbare Endpoints:
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

1. **Pro Loop: Ein verantwortlicher Tool-Set**
   - Anomaly Detection: fokussiert auf WooCommerce API + Analyzer
   - Product Optimization: fokussiert auf Variant Generator + A/B Tool
   - Payment Recovery: fokussiert auf Strategy Selector + Email Tool
   - Analytics: fokussiert auf Reporting API + Trend Analyzer

2. **Learnings speichern & abrufen**
   - Jeder Loop speichert Erfolgsmuster in Memory
   - Zukünftige Iterationen verbessern sich basierend auf Learnings

3. **Failures sind OK**
   - Loops haben Built-in Retry-Logik
   - Fehler werden geloggt + alertet
   - Continue nächste Iteration trotz Fehler

---

**Nächste Schritte:**
- Lesen Sie [AGENTIC_LOOPS_USER_GUIDE.md](./AGENTIC_LOOPS_USER_GUIDE.md) für Shop-Admin Perspective
- Siehe [API Documentation](./api/agent-loops.md) für Entwickler Details

- **THINK**: Generiert 3 Varianten pro Produkt:
  - `price`: 10% Rabatt
  - `title`: Fügt "⭐ Bestseller" hinzu
  - `description`: Fügt Verfügbarkeitsmeldung hinzu
- **ACT**: Simuliert A/B Test mit Conversion-Lift (~15%)
- **LEARN**: Wendet Winner-Varianten an (wenn Improvement > 5%)

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
**Datei**: `backend/agent/loops/paymentRecoveryLoop.ts`

**Zweck**: Versucht Failed Orders mit verschiedenen Strategien zu recovern

**Flow**:
- **SENSE**: Laden Failed/Pending Orders der letzten 30 Tage
- **THINK**: Wählt beste Recovery-Strategie:
  - Neue Kunden + hoher Betrag → **Contact** (60% erfolgsquote)
  - Mehrfache Versuche → **Alternative Payment** (52%)
  - Mittlere Beträge → **Discount** (45%)
  - Kleine Beträge → **Retry** (35%)
- **ACT**: Führt Recovery-Strategien aus
- **LEARN**: Speichert welche Strategie bei welcher Order funktioniert

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
**Datei**: `backend/agent/loops/analyticsInsightsLoop.ts`

**Zweck**: Generiert Dashboard-Insights aus Analytics-Daten

**Flow**:
- **SENSE**: Sammelt Metriken (Revenue, Orders, Customers, Conversion, AOV)
- **THINK**: Analysiert Trends & detektiert Anomalien:
  - Wenn Veränderung > 15% → Anomalie erkannt
- **ACT**: Generiert Insight-Karten mit Empfehlungen
- **LEARN**: Speichert Best Practices für zukünftige Empfehlungen

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

**Datei**: `backend/agent/agenticLoop.ts`

### Kernkonzepte

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

### 5-Phasen Execution Cycle

```typescript
async execute(): Promise<LoopResult> {
  while (this.shouldContinue()) {
    this.sense();      // Daten sammeln
    this.think();      // Analysieren
    this.act();        // Handeln
    this.learn();      // Lernen
    this.context.iteration++;
  }
  return this.buildResult();
}
```

---

## HTTP API

### 1. Loop starten

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

### 2. Loop Status abrufen

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

### 3. Loop Schema abrufen

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

### Beispiel: Täglich um 09:00 Anomalien checken

```bash
# Mit node-cron oder PM2 ecosystem.config.cjs
curl -X POST http://localhost:3000/api/agent/loops/anomaly-detection/run
```

### Beispiel: Nach jedem Produktupload Optimization starten

```bash
# In ProductUploader
const response = await fetch('/api/agent/loops/product-optimization/run', {
  method: 'POST'
});
```

---

## Memory System

Jeder Loop hat Zugang zu **Memory** für:
- **Learnings**: Was funktioniert gut?
- **Patterns**: Welche Anomalien treten auf?
- **Success Rates**: Erfolgsquoten von Strategien

```typescript
// In memory.ts
memory.store('payment-recovery-success-rates', {
  'contact': 0.60,
  'discount': 0.45,
  'retry': 0.35
});
```

---

## Erweiterung: Custom Loop erstellen

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
      description: 'Daten sammeln',
      action: async () => {
        // Deine Logik hier
        return data;
      }
    });

    // think, act, learn, shouldContinue hinzufügen...
  }

  getSummary() {
    // Ergebnisse zusammenfassen
    return { ... };
  }
}
```

---

## Monitoring & Logging

Alle Loops loggen ihre Aktivitäten:

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

Tests sind implementiert, benötigen aber WooCommerce API Mock-Setup.

---

## Nächste Schritte

1. ✅ 4 Agentic Loop Implementierungen
2. ✅ HTTP Endpoints registriert
3. ✅ Basis Tests geschrieben
4. ⏳ Tests mit vollständigen Mocks
5. ⏳ Scheduling (z.B. täglich 09:00 Anomaly Detection)
6. ⏳ Dashboard-Integration für Loop Results
7. ⏳ Machine Learning Integration für bessere Entscheidungen

---

**Erstellt**: 2025-01-04  
**Architektur**: Agentic Loop Pattern (Sense → Think → Act → Learn → Repeat)  
**Framework**: Fastify + TypeScript + WooCommerce API
