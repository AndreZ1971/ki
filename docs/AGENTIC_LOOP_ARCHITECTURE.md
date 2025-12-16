# Agentic Loop Architecture

## Übersicht

Die Agentic Loop Architektur ermöglicht autonome Agenten, die in einem kontinuierlichen Zyklus arbeiten:

```
SENSE → THINK → ACT → LEARN → (REPEAT if needed)
```

## 4 Agentic Loop Implementierungen

### 1. **Anomaly Detection Loop** 🚨
**Datei**: `backend/agent/loops/anomalyDetectionLoop.ts`

**Zweck**: Erkennt Payment-Anomalien und erstellt Recovery-Actions

**Flow**:
- **SENSE**: Lädt 100 fehlgeschlagene/pending Orders
- **THINK**: Analysiert auf 4 Anomaly-Types:
  - `failed_payment`: Status = "failed"
  - `unusual_amount`: > €5000
  - `repeated_attempts`: Customer mit 2+ fehlgeschlagene Payments
  - `high_risk`: Pattern-basiert erkannt
- **ACT**: Erstellt Recovery-Actions mit Priorität (HIGH/MEDIUM/LOW)
- **LEARN**: Speichert Anomaly-Muster in Memory

**Output**:
```typescript
{
  totalAnomalies: 45,
  byType: { failed_payment: 20, unusual_amount: 15, ... },
  bySeverity: { high: 30, medium: 15 }
}
```

**HTTP Endpoint**:
```bash
POST /api/agent/loops/anomaly-detection/run
```

---

### 2. **Product Optimization Loop** 📈
**Datei**: `backend/agent/loops/productOptimizationLoop.ts`

**Zweck**: A/B testet Produkt-Attribute um Conversions zu verbessern

**Flow**:
- **SENSE**: Lädt 50 underperforming Products (sortiert nach Popularity ASC)
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
