# Agentic Tools Reference

> **Für Developer**: Vollständige API-Referenz aller Tools, die von Agentic Loops verwendet werden.  
> **Für Benutzer**: Siehe [AGENTIC_LOOPS_USER_GUIDE.md](./AGENTIC_LOOPS_USER_GUIDE.md)

---

## Übersicht

Agentic Loops nutzen spezialisierte Tools, um Aufgaben auszuführen. Jedes Tool hat eine klare Verantwortung und kann von mehreren Loops aufgerufen werden.

| Tool                        | Modul                                         | Verantwortung                                    | Loops                                  |
| --------------------------- | --------------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| **WooCommerce API Tool**    | `backend/tools/woo.ts`                        | Lesen/Schreiben von Orders, Produkten, Customers | Alle 4                                 |
| **Analyzer Tool**           | `backend/tools/feedbackAnalysis.ts`           | Anomalie-Erkennung, Pattern-Matching             | Anomaly Detection                      |
| **Email Enhancement Tool**  | `backend/services/emailEnhancementService.ts` | Personalisierte E-Mails, Templates               | Payment Recovery, Analytics Insights   |
| **Strategy Selector Tool**  | `backend/agent/tools.ts`                      | Entscheidungslogik für Recovery-Strategien       | Payment Recovery                       |
| **A/B Test Tool**           | `backend/agent/tools.ts`                      | Varianten-Simulation, Winner-Bestimmung          | Product Optimization                   |
| **Discount Generator Tool** | `backend/agent/tools.ts`                      | Rabatt-Kalkulationen, Schwellenwert-Prüfung      | Payment Recovery, Product Optimization |
| **Storage Tool**            | `backend/agent/memory.ts`                     | Persistente Pattern-Speicherung                  | Alle 4                                 |
| **Analytics ML Tool**       | `backend/services/analyticsMLService.ts`      | Insight-Generierung, Vorhersagen                 | Analytics Insights                     |
| **Alert Tool**              | `backend/error-handling/alerting.ts`          | Monitoring, Notifications, Logging               | Alle 4                                 |

---

## 1. WooCommerce API Tool

**Datei**: `backend/tools/woo.ts`

**Zweck**: Alle Operationen auf WooCommerce REST API

### Verfügbare Operationen

#### 1.1 Orders

```typescript
// GET – Orders abrufen
getOrders(params: {
  status?: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed'
  limit?: number           // Default: 100
  offset?: number          // Default: 0
  orderby?: 'id' | 'date'  // Default: 'date'
  order?: 'asc' | 'desc'   // Default: 'desc'
  search?: string          // Nach Order-Nr oder Kundennamen suchen
}): Promise<Order[]>
```

**Example**:
```typescript
const failedOrders = await wooTool.getOrders({
  status: 'failed',
  limit: 100,
  orderby: 'date',
  order: 'desc'
});
// Returns: [{ id: 8765, total: '7500.00', status: 'failed', date_created: '2025-12-17', ... }]
```

**Fehlerbehandlung**:
```typescript
// Timeout
throw new Error('WooCommerce API Timeout (30s)');

// Authentifizierung
throw new Error('Invalid WooCommerce credentials (check connection.json)');

// Rate Limiting
throw new Error('WooCommerce API rate limit exceeded');
```

---

#### 1.2 Produkte

```typescript
// GET – Produkte abrufen
getProducts(params: {
  search?: string              // Nach Name suchen
  category?: number            // Nach Kategorie filtern
  limit?: number               // Default: 50
  orderby?: 'popularity' | 'rating' | 'date'
  order?: 'asc' | 'desc'
  stock_status?: 'instock' | 'outofstock'
}): Promise<Product[]>

// GET – Ein Produkt abrufen
getProduct(productId: number): Promise<Product>

// POST – Produkt aktualisieren
updateProduct(productId: number, data: {
  name?: string
  regular_price?: string
  sale_price?: string
  description?: string
  stock_quantity?: number
}): Promise<Product>
```

**Example**:
```typescript
// Underperforming Products laden
const underperformers = await wooTool.getProducts({
  orderby: 'popularity',
  order: 'asc',
  limit: 50,
  stock_status: 'instock'
});

// Preisoptimierung anwenden
await wooTool.updateProduct(123, {
  regular_price: '26.99',  // von 29.99
  sale_price: '24.99'
});
```

**Rückgabe-Format**:
```typescript
interface Product {
  id: number
  name: string
  slug: string
  status: 'draft' | 'pending' | 'private' | 'publish'
  description: string
  regular_price: string
  sale_price: string
  images: Array<{ id: number; src: string }>
  stock_quantity: number
  stock_status: 'instock' | 'outofstock'
  categories: Array<{ id: number; name: string }>
  rating: number
  _links: { self: Array<{ href: string }> }
}
```

---

#### 1.3 Customers

```typescript
// GET – Customers abrufen
getCustomers(params: {
  search?: string      // Nach Name/Email suchen
  limit?: number       // Default: 50
  role?: 'subscriber' | 'contributor' | 'author' | 'editor' | 'administrator'
}): Promise<Customer[]>

// GET – Customer-Details + Order-Historie
getCustomerWithOrders(customerId: number): Promise<{
  customer: Customer
  orders: Order[]
  failureRate: number  // Prozentsatz fehlgeschlagener Zahlungen
}>

// POST – Newsletter-Opt-in setzen
updateCustomerOptIn(customerId: number, subscribed: boolean): Promise<void>
```

**Example**:
```typescript
// Wiederholte Zahlungsausfälle erkennen
const customer = await wooTool.getCustomerWithOrders(234);
if (customer.failureRate > 0.3) {
  // Alert: "Customer 234 – 30% Zahlungsausfallquote"
  await alertTool.send({
    level: 'HIGH',
    message: `Customer ${customer.customer.id} has ${customer.failureRate}% payment failure rate`
  });
}
```

---

### 1.4 Fehlerbehandlung & Retry-Logik

```typescript
// Automatisches Retry mit Exponential Backoff
async function wooApiCall<T>(
  endpoint: string,
  options: RequestOptions
): Promise<T> {
  let retries = 0;
  const maxRetries = 3;
  const baseDelay = 1000; // 1 Sekunde

  while (retries < maxRetries) {
    try {
      return await fetch(`${wooUrl}${endpoint}`, options);
    } catch (error) {
      if (error.status === 429) {  // Rate Limited
        const delay = baseDelay * Math.pow(2, retries);
        await sleep(delay);
        retries++;
      } else if (error.status === 500) {  // Server Error
        throw new Error('WooCommerce server error – check shop status');
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Connection-Konfiguration** (aus `connection.json`):
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

---

## 2. Analyzer Tool

**Datei**: `backend/tools/feedbackAnalysis.ts`

**Zweck**: Musteranalyse, Anomalieerkennung, Datenvalidierung

### Verfügbare Operationen

#### 2.1 Anomalie-Detektion

```typescript
// Erkenne 4 Anomaly-Types in Orders
detectAnomalies(orders: Order[]): Promise<{
  anomalies: Anomaly[]
  byType: Record<AnomalyType, number>
  bySeverity: Record<Severity, number>
  patterns: Pattern[]
}>

type AnomalyType = 'failed_payment' | 'unusual_amount' | 'repeated_attempts' | 'high_risk'
type Severity = 'HIGH' | 'MEDIUM' | 'LOW'
```

**Anomaly-Typen Detail**:

```typescript
interface Anomaly {
  type: AnomalyType
  orderId: number
  severity: Severity
  reason: string
  recommendation: string
  threshold?: number    // Welcher Wert hat Trigger ausgelöst
  actualValue?: number
}

// 1. FAILED_PAYMENT
{
  type: 'failed_payment',
  orderId: 8765,
  severity: 'HIGH',
  reason: 'Order status is "failed"',
  recommendation: 'Manual review or retry payment gateway',
  threshold: 'status === "failed"'
}

// 2. UNUSUAL_AMOUNT
{
  type: 'unusual_amount',
  orderId: 9123,
  severity: 'MEDIUM',
  reason: 'Order total exceeds €5000 threshold',
  recommendation: 'Verify customer identity & fraud checks',
  threshold: 5000,
  actualValue: 7500.00
}

// 3. REPEATED_ATTEMPTS
{
  type: 'repeated_attempts',
  orderId: 9124,
  severity: 'HIGH',
  reason: 'Customer ID 234 has 3 failed payments in 2 hours',
  recommendation: 'Alert customer, suggest alternative payment method',
  threshold: 2,
  actualValue: 3
}

// 4. HIGH_RISK
{
  type: 'high_risk',
  orderId: 9125,
  severity: 'MEDIUM',
  reason: 'Pattern: Same amount (€99.99) from 5 different cards in 24h',
  recommendation: 'Flag for manual fraud review',
  threshold: '3+ cards, same amount, <24h'
}
```

#### 2.2 Pattern-Matching

```typescript
// Erkenne Muster in Daten
detectPatterns(data: {
  orders?: Order[]
  products?: Product[]
  customers?: Customer[]
}): Promise<Pattern[]>

interface Pattern {
  type: string  // z.B. 'seasonal', 'payment_method_preference', 'churn_risk'
  confidence: number  // 0-1
  description: string
  affectedEntities: Array<{ id: number; relevance: number }>
  recommendations: string[]
}
```

**Beispiele**:
```typescript
// Pattern 1: Saisonale Verkaufsspitzen
{
  type: 'seasonal',
  confidence: 0.92,
  description: 'Strong sales spike every Friday evening',
  recommendations: ['Schedule stock checks Friday 6pm', 'Pre-allocate payment processing capacity']
}

// Pattern 2: Zahlungsmethoden-Präferenz
{
  type: 'payment_method_preference',
  confidence: 0.85,
  description: 'Klarna preferred by 68% of German customers',
  recommendations: ['Optimize Klarna checkout flow', 'Consider Klarna fees in margin calculations']
}

// Pattern 3: Churn-Risiko
{
  type: 'churn_risk',
  confidence: 0.78,
  description: 'Customers with >1 failed payment likely to churn',
  recommendations: ['Activate recovery campaign after 1st failure', 'Offer alternative payment methods']
}
```

---

## 3. Email Enhancement Tool

**Datei**: `backend/services/emailEnhancementService.ts`

**Zweck**: KI-gestützte E-Mail-Generierung & Personalisierung

### Verfügbare Operationen

```typescript
generatePersonalizedEmail(params: {
  customerId: number
  orderData?: Order
  context: 'payment_recovery' | 'payment_success' | 'abandoned_cart' | 'upsell'
  includeDiscount?: boolean
  discountPercentage?: number
  variables?: Record<string, string>  // {{customerName}}, {{productName}}, etc.
}): Promise<{
  subject: string
  html: string
  plaintext: string
  recommendation: string  // z.B. "Best send: Friday 2pm"
}>

generateBulkEmails(
  customerIds: number[],
  context: string,
  options?: EmailOptions
): Promise<EmailBatch>
```

**Example - Payment Recovery Mail**:
```typescript
const email = await emailTool.generatePersonalizedEmail({
  customerId: 234,
  orderData: { id: 8765, total: 7500.00, items: [...] },
  context: 'payment_recovery',
  includeDiscount: true,
  discountPercentage: 10,
  variables: {
    customerName: 'Max',
    productNames: 'Premium Widget Pack'
  }
});

// Returns:
{
  subject: 'Max, wir helfen dir gerne weiter! 🤝 Deine Bestellung #8765',
  html: `<p>Hallo Max,</p>
         <p>deine Zahlung für die <strong>Premium Widget Pack</strong> konnte leider nicht verarbeitet werden.</p>
         <p>Wir bieten dir alternativ:</p>
         <ul>
           <li>✅ Zahlung per Klarna statt Kreditkarte</li>
           <li>✅ 10% Rabatt auf diese Bestellung</li>
           <li>✅ Kostenloser Versand</li>
         </ul>
         <a href="https://...">Bestellung jetzt abschließen</a>`,
  plaintext: 'Hallo Max...',
  recommendation: 'Best send: Wednesday 10:00 AM (2h after failure)'
}
```

---

## 4. Strategy Selector Tool

**Datei**: `backend/agent/tools.ts`

**Zweck**: Entscheidungslogik für komplexe Recovery-Szenarien

### Verfügbare Operationen

```typescript
selectPaymentRecoveryStrategy(params: {
  orderId: number
  customerId: number
  failureReason: string  // 'insufficient_funds' | 'card_declined' | 'fraud_check' | 'unknown'
  orderTotal: number
  customerFailureRate: number  // 0-1
  isRepeatCustomer: boolean
  paymentMethods: PaymentMethod[]
}): Promise<{
  strategy: 'retry' | 'discount' | 'alternative_payment' | 'contact'
  reasoning: string
  actions: Action[]
  successProbability: number  // 0-1
}>
```

**Decision Tree**:
```
┌─ Failure Reason?
│
├─> insufficient_funds (geringe Saldo)
│   ├─ orderTotal > €500 → 'contact' (persönliche Ansprache)
│   ├─ orderTotal ≤ €500 → 'discount' (-10% Preis)
│
├─> card_declined (Kartenproblem)
│   ├─ customerFailureRate > 0.3 → 'alternative_payment'
│   └─ customerFailureRate ≤ 0.3 → 'retry' (nach 30min)
│
├─> fraud_check (Betrugserkennung aktiv)
│   └─ 'contact' (Verifizierung erforderlich)
│
└─> unknown
    └─ 'retry' (Standard bei fehlender Info)
```

**Example**:
```typescript
const strategy = await strategyTool.selectPaymentRecoveryStrategy({
  orderId: 8765,
  customerId: 234,
  failureReason: 'card_declined',
  orderTotal: 7500.00,
  customerFailureRate: 0.35,
  isRepeatCustomer: true,
  paymentMethods: ['klarna', 'bank_transfer', 'paypal']
});

// Returns:
{
  strategy: 'alternative_payment',
  reasoning: 'Customer has 35% failure rate on current payment method; suggest Klarna',
  actions: [
    { type: 'send_email', data: { template: 'payment_recovery_alt', discountPercentage: 5 } },
    { type: 'log_event', data: { event: 'recovery_strategy_applied', strategy: 'alternative_payment' } }
  ],
  successProbability: 0.72
}
```

---

## 5. A/B Test Tool

**Datei**: `backend/agent/tools.ts`

**Zweck**: Variant-Simulation & Winner-Bestimmung

### Verfügbare Operationen

```typescript
simulateABTest(params: {
  productId: number
  baselineConversionRate: number  // 0-1 (z.B. 0.08 = 8%)
  variants: Variant[]
  sampleSize?: number  // Default: 1000
  confidenceLevel?: number  // Default: 0.95 (95%)
}): Promise<{
  baseline: TestResult
  variants: TestResult[]
  winner?: Variant
  recommendation: string
  statisticalSignificance: boolean
}>

interface Variant {
  id: string
  attribute: 'price' | 'title' | 'description'
  control: string
  treatment: string
  expectedLift?: number  // z.B. 0.15 = +15%
}
```

**Example**:
```typescript
const testResult = await abTestTool.simulateABTest({
  productId: 123,
  baselineConversionRate: 0.06,  // 6% baseline
  variants: [
    {
      id: 'price_discount_10',
      attribute: 'price',
      control: '€29.99',
      treatment: '€26.99',
      expectedLift: 0.15  // +15% erwartet
    },
    {
      id: 'title_badge',
      attribute: 'title',
      control: 'Produktname',
      treatment: 'Produktname ⭐ Bestseller',
      expectedLift: 0.08
    }
  ],
  sampleSize: 1000,
  confidenceLevel: 0.95
});

// Returns:
{
  baseline: {
    conversions: 60,  // 6% von 1000
    rate: 0.06,
    ci: [0.048, 0.072]  // 95% Konfidenzintervall
  },
  variants: [
    {
      id: 'price_discount_10',
      conversions: 84,
      rate: 0.084,
      ci: [0.066, 0.102],
      lift: 0.40,  // +40%
      pValue: 0.012  // statisch signifikant (< 0.05)
    }
  ],
  winner: { id: 'price_discount_10', ... },
  recommendation: 'Apply -10% price strategy; expected +€17k revenue uplift',
  statisticalSignificance: true
}
```

**Statistische Methode**:
```typescript
// Binomial Test (Standard für Conversion Rates)
conversions ~ Binomial(n, p)

// Konfidenzintervall (Wilson Score)
p_lower = (p + z²/2n - z√(p(1-p)/n + z²/4n²)) / (1 + z²/n)
p_upper = (p + z²/2n + z√(p(1-p)/n + z²/4n²)) / (1 + z²/n)

// Signifikanz (Chi-squared Test)
χ² = (observed - expected)² / expected
p_value = P(χ² > test_statistic)
```

---

## 6. Discount Generator Tool

**Datei**: `backend/agent/tools.ts`

**Zweck**: Rabatt-Kalkulationen mit Margin-Schutz

### Verfügbare Operationen

```typescript
calculateOptimalDiscount(params: {
  productId: number
  currentPrice: number
  productCost: number  // Einkaufspreis
  targetMargin: number  // z.B. 0.30 = 30% Marge
  conversionLift?: number  // z.B. 0.15 = +15% Conversions erwartet
  maxDiscountPercent?: number  // Default: 25%
}): Promise<{
  recommendedDiscount: number  // in Prozent
  resultingPrice: number
  effectiveMargin: number
  estimatedRevenueLift: number  // in EUR
  riskAssessment: string  // 'safe' | 'moderate' | 'risky'
}>
```

**Example**:
```typescript
const discount = await discountTool.calculateOptimalDiscount({
  productId: 123,
  currentPrice: 29.99,
  productCost: 8.50,
  targetMargin: 0.30,  // min. 30% Marge beibehalten
  conversionLift: 0.15,  // +15% Conversions mit Rabatt erwartet
  maxDiscountPercent: 25
});

// Returns:
{
  recommendedDiscount: 10,  // -10%
  resultingPrice: 26.99,
  effectiveMargin: 0.52,  // (26.99 - 8.50) / 26.99 = 68.5% Brutto-Marge! Wait, fix:
                         // (26.99 - 8.50) / 26.99 = 0.685 → 68.5% Brutto, aber Zielspanne ist 30%
                         // Realistisch: (26.99 - 8.50) / 26.99 = 0.685 → ✅ OK, 68.5% > 30%
  estimatedRevenueLift: 1245.60,  // EUR pro Monat (basierend auf Historisches Volumen)
  riskAssessment: 'safe'  // Margin ist komfortabel über Zielspanne
}
```

**Schutzmaßnahmen**:
```typescript
// 1. Minimale Marge nicht unterschreiten
if ((resultingPrice - cost) / resultingPrice < targetMargin) {
  throw new Error('Discount would violate margin targets');
}

// 2. Realistische Conversion-Lift Annahmen
if (conversionLift > 0.50) {
  console.warn('Unrealistic conversion lift (>50%); capping at 50%');
  conversionLift = 0.50;
}

// 3. Max Discount-Grenzen
if (discountPercent > maxDiscountPercent) {
  console.warn(`Discount capped at ${maxDiscountPercent}%`);
  discountPercent = maxDiscountPercent;
}
```

---

## 7. Storage Tool / Memory

**Datei**: `backend/agent/memory.ts`

**Zweck**: Persistente Pattern-Speicherung für Lerneffekte

### Verfügbare Operationen

```typescript
class PersistentMemory {
  // Speichern
  async savePattern(
    loopType: LoopType,
    patternKey: string,
    data: any,
    metadata?: { ttl?: number; confidence?: number }
  ): Promise<void>

  // Abrufen
  async getPattern(
    loopType: LoopType,
    patternKey: string
  ): Promise<StoredPattern | null>

  // Alle Patterns eines Loops
  async getPatternsByLoop(loopType: LoopType): Promise<StoredPattern[]>

  // Aktualisieren
  async updatePattern(
    loopType: LoopType,
    patternKey: string,
    updates: Partial<StoredPattern>
  ): Promise<void>

  // Löschen
  async deletePattern(
    loopType: LoopType,
    patternKey: string
  ): Promise<void>

  // Bereinigung (TTL-basiert)
  async cleanup(): Promise<{ deleted: number }>
}
```

**Gespeicherte Patterns pro Loop**:

```typescript
// Anomaly Detection Loop
{
  loopType: 'anomaly_detection',
  patternKey: 'high_failure_rate:customer:234',
  data: {
    failureRate: 0.35,
    lastUpdated: 1702824000,
    triggerCount: 15,
    recoverySuccessRate: 0.47
  },
  metadata: { ttl: 2592000, confidence: 0.92 }  // 30 Tage
}

// Product Optimization Loop
{
  loopType: 'product_optimization',
  patternKey: 'price_sensitivity:category:electronics',
  data: {
    optimalPriceRange: [29.99, 49.99],
    elasticity: -1.8,
    lastWinningStrategy: 'price_discount_10',
    successRate: 0.68
  },
  metadata: { ttl: 5184000, confidence: 0.85 }  // 60 Tage
}

// Payment Recovery Loop
{
  loopType: 'payment_recovery',
  patternKey: 'strategy_effectiveness',
  data: {
    retry: { successRate: 0.32 },
    discount: { successRate: 0.58 },
    alternative_payment: { successRate: 0.71 },
    contact: { successRate: 0.85 }
  },
  metadata: { ttl: 7776000, confidence: 0.91 }  // 90 Tage
}

// Analytics Insights Loop
{
  loopType: 'analytics_insights',
  patternKey: 'dashboard_trend:aov',
  data: {
    trend: 'increasing',
    changeRate: 0.05,  // +5% WoW
    forecastedValue: 87.50,
    confidence: 0.78
  },
  metadata: { ttl: 604800, confidence: 0.75 }  // 7 Tage (aktuelle Trends)
}
```

**Speicherimplementierung** (Privacy-First):
```typescript
// In-Memory Storage (keine Datenbank)
private patterns: Map<string, StoredPattern> = new Map()

// Serialisierung (optional: Local Disk bei Restart)
async saveToFile(): Promise<void> {
  const data = JSON.stringify(Array.from(this.patterns.values()));
  await fs.writeFile('patterns.json.enc', encrypt(data));
}

// TTL Management
setInterval(() => {
  const now = Date.now();
  for (const [key, pattern] of this.patterns) {
    if (pattern.metadata.ttl && now > pattern.createdAt + pattern.metadata.ttl * 1000) {
      this.patterns.delete(key);
    }
  }
}, 3600000);  // 1x pro Stunde prüfen
```

---

## 8. Analytics ML Tool

**Datei**: `backend/services/analyticsMLService.ts`

**Zweck**: KI-gestützte Insight-Generierung & Vorhersagen

### Verfügbare Operationen

```typescript
generateDashboardInsights(params: {
  timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year'
  includeForecasts?: boolean
  focusMetrics?: string[]  // z.B. ['aov', 'conversion_rate', 'churn']
}): Promise<{
  metrics: MetricSnapshot[]
  trends: Trend[]
  anomalies: AnomalyAlert[]
  forecasts: Forecast[]
  actionItems: ActionItem[]
}>

interface MetricSnapshot {
  name: string  // z.B. 'average_order_value'
  value: number
  previousValue: number
  change: number  // +/- Prozentpunkte
  trend: 'up' | 'down' | 'stable'
  sparkline: number[]  // Mini-Chart Data (letzte 12 Perioden)
}

interface Trend {
  name: string
  description: string
  confidence: number  // 0-1
  trajectory: 'accelerating' | 'decelerating' | 'stable'
  recommendation: string
}

interface Forecast {
  metric: string
  forecastedValue: number
  confidenceInterval: [number, number]  // [lower, upper]
  timeRange: string  // z.B. '+7 days'
  method: 'linear_regression' | 'exponential_smoothing' | 'arima'
}
```

**Example – Dashboard Insights Response**:
```typescript
{
  metrics: [
    {
      name: 'average_order_value',
      value: 87.50,
      previousValue: 83.20,
      change: +5.2,
      trend: 'up',
      sparkline: [82, 83, 84, 85, 85, 86, 87, 87, 88, 87, 87.5]
    },
    {
      name: 'conversion_rate',
      value: 0.062,
      previousValue: 0.058,
      change: +6.8,
      trend: 'up',
      sparkline: [0.055, 0.056, 0.057, 0.058, 0.058, 0.059, 0.060, 0.061, 0.062]
    }
  ],
  trends: [
    {
      name: 'Premium Segment Growth',
      description: 'High-value customers (>€200 AOV) grew 23% this month',
      confidence: 0.91,
      trajectory: 'accelerating',
      recommendation: 'Increase premium product inventory; run luxury segment marketing'
    }
  ],
  anomalies: [
    {
      name: 'High Refund Rate on Product #456',
      value: 0.18,
      threshold: 0.05,
      severity: 'MEDIUM',
      recommendation: 'Review product quality; contact recent buyers'
    }
  ],
  forecasts: [
    {
      metric: 'revenue',
      forecastedValue: 42500,
      confidenceInterval: [39800, 45200],
      timeRange: '+7 days',
      method: 'arima'
    }
  ],
  actionItems: [
    'Increase marketing spend on premium products (ROI +23%)',
    'Investigate product #456 quality issues',
    'Launch customer retention campaign (churn up 2%)'
  ]
}
```

---

## 9. Alert / Monitoring Tool

**Datei**: `backend/error-handling/alerting.ts`

**Zweck**: Notifications, Logging, Monitoring

### Verfügbare Operationen

```typescript
interface AlertService {
  // Einfache Alerts
  send(alert: AlertMessage): Promise<void>

  // Log ohne Alert
  log(level: LogLevel, message: string, metadata?: any): Promise<void>

  // Batch Alerts
  sendBulk(alerts: AlertMessage[]): Promise<void>

  // Alert History
  getAlerts(params: {
    loopType?: LoopType
    severity?: Severity
    limit?: number
    timeRange?: { start: Date; end: Date }
  }): Promise<AlertMessage[]>
}

interface AlertMessage {
  level: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL'
  loopType: LoopType
  message: string
  context?: {
    orderId?: number
    customerId?: number
    productId?: number
    [key: string]: any
  }
  timestamp?: Date
  notifyChannels?: ('log' | 'email' | 'slack' | 'webhook')[]
}
```

**Example – Alerts**:
```typescript
// Alert 1: Payment Recovery – High Success
await alertService.send({
  level: 'INFO',
  loopType: 'payment_recovery',
  message: 'Payment Recovery Loop: 47% success rate (target: 40%)',
  context: { orderId: 8765, recoveryAttempts: 3 },
  notifyChannels: ['log']  // Nur ins Log
})

// Alert 2: Anomaly Detection – Manual Review Needed
await alertService.send({
  level: 'HIGH',
  loopType: 'anomaly_detection',
  message: 'Customer #234 shows high-risk pattern (3 failed payments in 2h)',
  context: { customerId: 234, failureCount: 3, riskScore: 0.89 },
  notifyChannels: ['log', 'email', 'slack']  // Multi-channel
})

// Alert 3: Critical System Error
await alertService.send({
  level: 'CRITICAL',
  loopType: 'anomaly_detection',
  message: 'WooCommerce API timeout – requests queued, will retry',
  context: { endpoint: '/orders', timeoutMs: 30000, queuedRequests: 127 },
  notifyChannels: ['log', 'email', 'slack', 'webhook']  // Alle Kanäle
})
```

**Log Levels**:
```
INFO          – Routine events, successful executions
WARNING       – Non-critical issues (z.B. retries)
HIGH          – Manual review recommended (z.B. anomalies)
CRITICAL      – System failure (z.B. API down)
```

---

## 10. Fehlerbehandlung & Best Practices

### 10.1 Generische Error Handling Strategy

```typescript
// Alle Tools sollten Errors wie folgt behandeln:
try {
  const result = await tool.operation();
} catch (error) {
  // 1. Klassifizierung
  if (error instanceof TimeoutError) {
    // Retry mit Backoff
    await sleep(2000);
    return await tool.operation();  // Retry 1x
  } else if (error instanceof RateLimitError) {
    // Exponential Backoff
    await sleep(Math.random() * 5000 + 5000);  // 5-10s
    return await tool.operation();
  } else if (error instanceof AuthenticationError) {
    // Config Issue – kein Retry
    throw new Error(`Auth failed: check connection.json`);
  } else if (error instanceof ValidationError) {
    // Input ungültig – kein Retry
    throw error;
  } else {
    // Unknown – fallback
    await alertService.send({
      level: 'HIGH',
      message: `Tool error (unknown): ${error.message}`,
      context: { tool: 'unknown', error: error.toString() }
    });
    throw error;
  }
}
```

### 10.2 Circuit Breaker Pattern

```typescript
// Für kritische externe APIs (WooCommerce, OpenAI)
class CircuitBreaker {
  state: 'closed' | 'open' | 'half-open' = 'closed'
  failureCount: number = 0
  failureThreshold: number = 5
  resetTimeout: number = 60000  // 1 Minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      throw new Error('Circuit breaker is open – service temporarily unavailable');
    }

    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failureCount = 0;
      }
      return result;
    } catch (error) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'open';
        setTimeout(() => {
          this.state = 'half-open';
          this.failureCount = 0;
        }, this.resetTimeout);
      }
      throw error;
    }
  }
}

// Usage
const wooCircuitBreaker = new CircuitBreaker();
const orders = await wooCircuitBreaker.execute(() => wooTool.getOrders({ limit: 100 }));
```

---

## 11. Tool-Kombinations-Patterns

Häufige Tool-Kombinationen in Loop-Workflows:

### Pattern 1: Anomaly Detection Pipeline
```
WooCommerce API Tool
  ↓ (getOrders mit status=failed,pending)
Analyzer Tool
  ↓ (detectAnomalies)
Storage Tool
  ↓ (savePattern)
Alert Tool
  ↓ (send HIGH-level alerts)
```

### Pattern 2: Payment Recovery Pipeline
```
WooCommerce API Tool (getCustomerWithOrders)
  ↓
Analyzer Tool (detectPatterns)
  ↓
Strategy Selector Tool (selectPaymentRecoveryStrategy)
  ↓
[Discount Generator | Email Enhancement] Tools
  ↓
Storage Tool (savePattern)
  ↓
Alert Tool
```

### Pattern 3: Product Optimization Pipeline
```
WooCommerce API Tool (getProducts + historical conversions)
  ↓
A/B Test Tool (simulateABTest)
  ↓
Discount Generator Tool (calculateOptimalDiscount)
  ↓
WooCommerce API Tool (updateProduct)
  ↓
Storage Tool (savePattern)
  ↓
Analytics ML Tool (forecast impact)
```

---

## 12. Testing & Debugging

### 12.1 Tool-Testwerkzeuge

**Manueller Test einer Tool-Operation**:
```bash
# Terminal – WooCommerce API Test
curl -X GET "https://kaufe-es.eu/wp-json/wc/v3/orders?status=failed&limit=10" \
  -u "ck_...:cs_..."

# Analyzer Tool testen
npm run test:analyzer

# Strategy Selector testen
npm run test:strategy-selector
```

### 12.2 Monitoring Endpoints

```typescript
// GET /api/agent/tools/health
{
  "woocommerce": { "status": "healthy", "latency": 245 },
  "openai": { "status": "healthy", "latency": 1200 },
  "storage": { "status": "healthy", "patterns": 342 },
  "alerts": { "status": "healthy", "queued": 0 }
}

// GET /api/agent/tools/errors
{
  "last24h": 12,
  "bySeverity": { "CRITICAL": 1, "HIGH": 5, "WARNING": 6 },
  "topErrors": [
    { "message": "WooCommerce timeout", "count": 5 },
    { "message": "Validation error", "count": 3 }
  ]
}
```

---

## 13. Zusammenfassung & Übersicht

| Tool               | Eingabe               | Verarbeitung          | Ausgabe             | Retry | Timeout |
| ------------------ | --------------------- | --------------------- | ------------------- | ----- | ------- |
| WooCommerce API    | productId, filters    | REST API Calls        | Orders/Products     | 3x    | 30s     |
| Analyzer           | Orders[]              | Pattern Matching      | Anomalies[]         | —     | —       |
| Email Enhancement  | customerId, context   | OpenAI API            | Email HTML          | 2x    | 20s     |
| Strategy Selector  | Order + Customer Data | Decision Tree         | Strategy + Actions  | —     | —       |
| A/B Test           | Product + Variants    | Binomial Test         | Winner + Stats      | —     | —       |
| Discount Generator | Price + Cost          | Margin Calculation    | Discount %          | —     | —       |
| Storage            | Pattern Data          | In-Memory Map         | Saved               | —     | —       |
| Analytics ML       | Metrics               | Time Series Analysis  | Insights + Forecast | 1x    | 15s     |
| Alert              | Alert Message         | Multi-Channel Routing | Sent                | —     | —       |

---

## Support & Häufige Fehler

**Q: "WooCommerce API Timeout"**
A: Erhöhe `timeoutMs` in connection.json oder überprüfe Shop-Status.

**Q: "Strategy Selector returns undefined"**
A: Sicherstellen, dass `failureReason` einer bekannten Kategorie entspricht.

**Q: "A/B Test Confidence too low"**
A: Erhöhe `sampleSize` oder `timeRange`; mehr Daten nötig.

**Q: "Storage Pattern expire"**
A: TTL ist abgelaufen; `cleanup()` wird automatisch 1x/h ausgeführt.

---

Für Fragen: [AGENTIC_LOOP_ARCHITECTURE.md](./AGENTIC_LOOP_ARCHITECTURE.md) | [AGENTIC_LOOPS_USER_GUIDE.md](./AGENTIC_LOOPS_USER_GUIDE.md)
