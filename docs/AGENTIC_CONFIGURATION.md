# Agentic Configuration Guide

> **Für Shop-Admins**: Wie man A.R.I. konfiguriert & Loops anpasst.  
> **Für Entwickler**: Siehe [AGENTIC_TOOLS_REFERENCE.md](./AGENTIC_TOOLS_REFERENCE.md)

---

## Übersicht

Agentic Loops werden über zwei Config-Dateien gesteuert:

1. **`backend/connection.json`** – Externe Integrationen (WooCommerce, OpenAI, SMTP)
2. **`backend/agent/config/ml.config.ts`** – Loop-Verhalten & Schwellenwerte

---

## 1. connection.json – External Credentials

**Datei**: `backend/connection.json`

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

**Parameter erklären**:

| Feld             | Typ                | Bedeutung                              | Beispiel                                                   |
| ---------------- | ------------------ | -------------------------------------- | ---------------------------------------------------------- |
| `url`            | String             | WooCommerce Shop-URL (muss HTTPS sein) | `https://kaufe-es.eu`                                      |
| `consumerKey`    | String             | WooCommerce REST API Key               | Generiert in WP Admin: Einstellungen → Advanced → REST API |
| `consumerSecret` | String             | WooCommerce REST API Secret            | Generiert in WP Admin: Einstellungen → Advanced → REST API |
| `authMode`       | `basic` \| `oauth` | Authentifizierungs-Methode             | `basic` (Standard)                                         |
| `timeoutMs`      | Number             | Max. Wartezeit für API-Calls           | `30000` (30 Sekunden)                                      |

**Wie man den API-Key generiert**:

1. WooCommerce Admin → **Einstellungen** → **Advanced** → **REST API**
2. Klick auf **Key erstellen** / **Add Key**
3. Gib einen Namen ein: z.B. "A.R.I. Loop Agent"
4. **Permissions**: Wähle `Read/Write` für Orders, Products, Customers
5. Klick **Generate**
6. Kopiere `Consumer Key` und `Consumer Secret` in connection.json

**⚠️ Sicherheit**:
- Speichere connection.json **niemals** in Git (in `.gitignore`)
- Nutze Environment Variables in Production: `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`
- Rotiere Keys regelmäßig (z.B. jedes Quartal)

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

**Parameter erklären**:

| Feld     | Typ    | Bedeutung      | Beispiel                                               |
| -------- | ------ | -------------- | ------------------------------------------------------ |
| `apiKey` | String | OpenAI API Key | Von https://platform.openai.com/api-keys               |
| `model`  | String | LLM-Modell     | `gpt-4o-mini` (cost-effective) oder `gpt-4` (powerful) |

**Modell-Optionen**:

| Modell        | Kosten                  | Geschwindigkeit | Use-Case                                 |
| ------------- | ----------------------- | --------------- | ---------------------------------------- |
| `gpt-4o-mini` | ~€0.001-0.003/1k tokens | Schnell ⚡       | Email, Varianten-Generierung (empfohlen) |
| `gpt-4`       | ~€0.01-0.03/1k tokens   | Mittel 🟡        | Komplexe Analyse, Strategy Selection     |
| `gpt-4-turbo` | ~€0.01/1k tokens        | Mittel 🟡        | Balanciert (alt)                         |

**⚠️ Kosten-Management**:
- Loops = ~1,000-2,000 tokens pro Durchlauf
- Bei `intervalMs: 900000` (15min) = ~2,880-5,760 tokens/Tag
- Geschätzter Monatskost: €0.02-0.05 mit `gpt-4o-mini`

**Wie man die API-Keys erhält**:

1. Gehe zu https://platform.openai.com/account/api-keys
2. Login mit OpenAI-Account
3. Klick **+ Create new secret key**
4. Kopiere den Key (wird nur 1x angezeigt!)
5. Trage ihn in connection.json ein

---

### 1.3 SMTP / Email Konfiguration

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

**Parameter erklären**:

| Feld       | Typ     | Bedeutung            | Beispiel                                                           |
| ---------- | ------- | -------------------- | ------------------------------------------------------------------ |
| `host`     | String  | Mail-Server Hostname | `inn.bitpalast.net` oder `smtp.gmail.com`                          |
| `port`     | Number  | SMTP-Port            | `465` (TLS), `587` (STARTTLS), `25` (unverschlüsselt)              |
| `secure`   | Boolean | TLS-Verschlüsselung? | `true` (für Port 465), `false` für 587                             |
| `user`     | String  | SMTP-Benutzer        | `info@kaufe-es.eu`                                                 |
| `password` | String  | SMTP-Passwort        | Vom Mail-Provider                                                  |
| `from`     | String  | Absender E-Mail      | `info@kaufe-es.eu` oder `"A.R.I. Recovery <recovery@kaufe-es.eu>"` |

**Häufige Provider**:

```json
// Gmail
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "your-email@gmail.com",
  "password": "your-app-password"  // Nicht dein Gmail-Passwort!
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

**Gmail App-Passwort generieren**:

1. https://myaccount.google.com/apppasswords
2. Wähle **Mail** → **Windows PC** (egal was)
3. Google generiert ein 16-zeichen Passwort
4. Trage dieses (nicht dein Gmail-Passwort!) in connection.json ein

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

Für Social Media Listening (nicht für Loops nötig, nur für Extended Features).

---

### 1.5 Loop Schedules (per Loop konfigurierbar)

**Datei**: `backend/data/loop-schedules.json`

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

**Typen & Felder**

| Feld       | Typ      | Bedeutung                                 |
| ---------- | -------- | ----------------------------------------- |
| `enabled`  | boolean  | Loop aktiv (true) / pausiert (false)      |
| `type`     | string   | `daily` \| `weekly` \| `interval`         |
| `time`     | string   | HH:MM (für `daily` und `weekly`)          |
| `weekdays` | string[] | z.B. `["Monday","Friday"]` (nur `weekly`) |
| `minutes`  | number   | 15 \| 30 \| 45 \| 60 (nur `interval`)     |

**API**

- GET  `/api/agent/monitoring/schedules` – alle Schedules
- GET  `/api/agent/monitoring/schedules/:loopType`
- PUT  `/api/agent/monitoring/schedules/:loopType` – ändern & sofort neu planen
- POST `/api/agent/monitoring/schedules/:loopType/toggle` – aktivieren/deaktivieren

**UI**

Settings → Agentic Loops → ⚙️ Schedule (Modal)
- Anomaly Detection: Daily HH:MM
- Payment Recovery: Interval 15/30/45/60 Min
- Product Optimization: Weekly (Wochentage + HH:MM)
- Analytics Insights: Daily HH:MM

---

### 1.6 ML Features Schalter

```json
{
  "features": {
    "enableAnalytics": true,
    "enableAutoProducts": true,
    "enableEmailMarketing": true
  }
}
```

Schaltet Features an/aus. Für Loops nicht direkt relevant (werden in `ml.config.ts` gesteuert).

---

## 2. ml.config.ts – Loop Behavior & Thresholds

**Datei**: `backend/agent/config/ml.config.ts`

**Zweck**: Feinjustierung von Loop-Verhalten ohne Code-Änderungen.

### 2.1 Anomaly Detection Loop Config

```typescript
export const anomalyDetectionConfig = {
  // Eingabe-Quellen
  orderLimit: 100,           // Max. Orders pro Durchlauf
  maxDaysOld: 30,           // Nur Orders der letzten 30 Tage
  
  // Schwellenwerte für Anomalie-Erkennung
  anomalyThresholds: {
    unusualAmount: 5000,                    // > €5000 = Anomalie
    repeatedFailureThreshold: 2,            // 2+ Fehler = Anomalie
    repeatedFailureTimeWindowMinutes: 120,  // Innerhalb 2h
    highRiskPatternMatches: 3               // 3+ Muster = Anomalie
  },
  
  // Schweregrade
  severityWeights: {
    failed_payment: 'HIGH',       // Automatisch manuelle Review
    unusual_amount: 'MEDIUM',
    repeated_attempts: 'HIGH',
    high_risk: 'MEDIUM'
  },
  
  // Verhalten
  autoRecoveryEnabled: true,      // Automatisch Recovery-Strategien anwenden?
  recoveryChainEnabled: true,     // Mehrere Recovery-Versuche nacheinander?
  maxRecoveryAttempts: 3,
  
  // Alerts
  alertThreshold: 'HIGH',         // Nur HIGH+ Severity alerten
  batchAlertsWhenAbove: 10        // Batch alerts wenn >10 Anomalien
}
```

**Empfohlene Einstellungen nach Use-Case**:

```typescript
// Aggressive Mode (Early Detection)
{
  unusualAmount: 3000,        // Niedrigere Schwelle
  repeatedFailureThreshold: 1, // Sofort nach 1 Fehler
  maxRecoveryAttempts: 5
}

// Conservative Mode (High Precision)
{
  unusualAmount: 10000,       // Höhere Schwelle
  repeatedFailureThreshold: 5, // Erst nach 5 Fehlern
  maxRecoveryAttempts: 1      // Maximal 1 Retry
}

// Balanced Mode (Empfohlen)
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
  // Eingabe-Quellen
  productLimit: 50,                  // Max. Produkte pro Durchlauf
  minOrderHistory: 30,               // Nur Produkte mit 30+ historischen Orders
  minConversionRate: 0.02,           // Nur wenn Conversion >= 2%
  
  // Varianten-Generierung
  variantTypesToGenerate: ['price', 'title', 'description'],
  variantsPerProduct: 3,
  
  // Simulation
  abTestSampleSize: 1000,
  confidenceLevel: 0.95,
  
  // A/B Test Schwellenwerte
  minLiftThreshold: 0.05,            // Min. +5% erwartet für Winner
  statisticalSignificanceLevel: 0.05, // p < 0.05 = signifikant
  
  // Preis-Limits
  discountLimits: {
    minDiscount: 5,                  // Min. -5% Rabatt
    maxDiscount: 30,                 // Max. -30% Rabatt
    targetMarginPercent: 30          // Mind. 30% Brutto-Marge
  },
  
  // Kopie-Generierung
  titleMaxLength: 70,
  descriptionMaxLength: 300,
  
  // Auto-Apply
  autoApplyWinners: false,           // Automatisch beste Variante live schalten?
  autoApplyConfidenceThreshold: 0.85, // Nur wenn >85% sicher
  
  // Alerts
  alertThreshold: 'INFO',            // Jede Optimierung melden
  notifyOnHighLift: 0.20             // Alert wenn Lift > 20%
}
```

**Empfohlene Einstellungen nach Risiko-Appetit**:

```typescript
// Conservative (Manuelle Bestätigung)
{
  autoApplyWinners: false,
  confidenceLevel: 0.99,             // Sehr hoch
  minLiftThreshold: 0.10             // Min. +10%
}

// Moderate (Semi-Auto)
{
  autoApplyWinners: false,
  autoApplyConfidenceThreshold: 0.85,
  minLiftThreshold: 0.05
}

// Aggressive (Full Auto)
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
  // Eingabe-Quellen
  orderLimit: 50,
  maxOrderAgeHours: 24,              // Nur Orders aus letzten 24h
  minOrderAmount: 10,                // Nur Orders >= €10
  
  // Schwellenwerte für Recovery-Trigger
  triggerThresholds: {
    failureStatus: ['failed', 'on-hold', 'pending'], // Welche Status triggern Recovery?
    customerFailureRateThreshold: 0.3  // Kundenhistorie > 30% Ausfallquote
  },
  
  // Recovery-Strategie Konfiguration
  strategies: {
    retry: {
      enabled: true,
      delayMinutes: 30,              // Wie lange warten bis Retry?
      maxAttempts: 2
    },
    discount: {
      enabled: true,
      percentages: [5, 10, 15],      // Versuche 5%, dann 10%, dann 15%
      respectMarginLimits: true
    },
    alternative_payment: {
      enabled: true,
      preferredMethods: ['klarna', 'paypal', 'bank_transfer']
    },
    contact: {
      enabled: true,
      triggerOn: ['high_amount', 'repeated_failure'], // Manuelle Kontakt-Notwendigkeit
      assignToTeam: 'sales'          // Welches Team kriegt die Ticket?
    }
  },
  
  // Email-Konfiguration
  emailTemplate: 'payment_recovery',
  emailDelay: 5,                     // Minuten vor Email-Versand
  includeSocialProof: true,          // "87% successfully recovered"
  
  // Success Tracking
  successThreshold: 0.40,            // Target: 40% Recovery Success Rate
  alertWhenUnder: 0.25,              // Alert wenn < 25%
  
  // Auto-Escalation
  escalationEnabled: true,
  escalateAfterFailures: 2           // Nach 2 Versuchen: Contact
}
```

**Empfohlene Einstellungen nach Business-Strategie**:

```typescript
// Revenue-Focused (Agg. Recovery)
{
  discount: { percentages: [10, 15, 20] },
  contact: { triggerOn: ['high_amount'] },
  strategies: { contact: { enabled: false } }  // Weniger Support-Overhead
}

// Relationship-Focused
{
  discount: { percentages: [5, 5] },          // Kleine Rabatte
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
  // Daten-Aggregation
  daysToAnalyze: 90,                 // Rolling 90-Tage-Fenster
  metricsToTrack: [
    'average_order_value',
    'conversion_rate',
    'customer_acquisition_cost',
    'refund_rate',
    'repeat_customer_rate',
    'churn_rate'
  ],
  
  // Anomalie-Erkennung in Metriken
  anomalyDetection: {
    enabled: true,
    sigma: 2.5                       // 2.5σ = ~1.2% Wahrscheinlichkeit für Fehler
  },
  
  // Trend-Analyse
  trendAnalysis: {
    minDataPoints: 7,                // Min. 7 Datenpunkte für Trend
    trendConfidenceThreshold: 0.70   // 70% Konfidenz mindestens
  },
  
  // Forecast
  forecastingEnabled: true,
  forecastMethod: 'arima',           // oder 'exponential_smoothing', 'linear_regression'
  forecastDays: 7,
  
  // Insight-Generierung
  minInsightConfidence: 0.75,
  maxInsightsPerRun: 5,
  
  // AI-Kopie
  generateRecommendations: true,
  recommendationModel: 'gpt-4o-mini',
  
  // Alerting
  criticalThresholds: {
    conversionRateDrop: 0.15,        // Alert wenn Conversion > 15% sinkt
    churnRateIncrease: 0.25,         // Alert wenn Churn > 25% steigt
    aovDecrease: 0.20                // Alert wenn AOV > 20% sinkt
  }
}
```

---

## 3. Loop-Frequenzen & Scheduling

**Recommendation**: Unterschiedliche Frequenzen je nach Loop:

```json
{
  "job": {
    "mode": "continuous",
    "intervalMs": 900000  // Basis-Interval
  },
  "loopSchedules": {
    "anomaly_detection": {
      "frequencyMultiplier": 1,    // Jedes mal laufen
      "intervalMs": 900000         // 15 Min
    },
    "product_optimization": {
      "frequencyMultiplier": 2,    // Jedes 2. mal
      "intervalMs": 1800000        // 30 Min
    },
    "payment_recovery": {
      "frequencyMultiplier": 1,    // Jedes mal
      "intervalMs": 900000         // 15 Min
    },
    "analytics_insights": {
      "frequencyMultiplier": 4,    // Jedes 4. mal
      "intervalMs": 3600000        // 1 Stunde
    }
  }
}
```

**Begründung**:
- **Anomaly Detection**: Schnell (15min) → Payment Issues hochfrequent
- **Product Optimization**: Mittelsam (30min) → A/B Tests brauchen Zeit
- **Payment Recovery**: Schnell (15min) → Recovery Fenster kurz
- **Analytics Insights**: Langsam (1h) → Viele Daten-Aggregation

---

## 4. Monitoring & Health Checks

### 4.1 Configuration Validierung

Nach jedem Bearbeiten von Config-Dateien:

```bash
# Validiere connection.json
npm run validate:connection

# Validiere ml.config.ts
npm run validate:ml-config

# Starte alle Validierungen
npm run validate:all
```

### 4.2 Health Check Endpoint

```bash
# Check ob alle Konfigurationen OK sind
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

## 5. Best Practices & Häufige Fehler

### ✅ Best Practices

1. **Testen vor Production**:
   ```bash
   # Set mode: 'once' in ml.config.ts
   npm run dev
   # Trigger manuell via API
   curl -X POST http://localhost:3000/api/agent/loops/anomaly-detection/run
   ```

2. **Schwellenwerte schrittweise reduzieren**:
   - Start: Aggressiv (frühe Erkennung)
   - Woche 1-2: Überwache False Positive Rate
   - Dann: Justiere nach Bedarf

3. **Environment Variables nutzen**:
   ```bash
   # Nicht hardcodiert in connection.json:
   export WOO_CONSUMER_KEY="ck_..."
   export OPENAI_API_KEY="sk-..."
   ```

4. **Regelmäßige Backups**:
   ```bash
   cp backend/connection.json backend/connection.json.backup
   ```

### ❌ Häufige Fehler

| Fehler                     | Symptom                            | Lösung                                                     |
| -------------------------- | ---------------------------------- | ---------------------------------------------------------- |
| **WooCommerce URL falsch** | "401 Unauthorized"                 | Check URL in connection.json (muss mit `https://` starten) |
| **API Key abgelaufen**     | "Invalid credentials"              | Regeneriere Key in WooCommerce Admin                       |
| **SMTP Auth falsch**       | "Email nicht versendet"            | Test mit `npm run test:smtp`                               |
| **Schwellenwert zu hoch**  | Keine Anomalien erkannt            | Senke `unusualAmount`, `repeatedFailureThreshold`          |
| **Loop läuft nicht**       | Mode ist `once` statt `continuous` | Ändere `"mode": "continuous"`                              |

---

## 6. Konfiguration pro Environment

### Development

```json
{
  "woocommerce": {
    "url": "http://localhost:8080",  // Local WooCommerce
    "timeoutMs": 60000               // Längeres Timeout für Debugging
  },
  "job": {
    "mode": "once",                  // Manuell triggern
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
    "intervalMs": 3600000            // 1h (Testing mit echten Daten)
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
    "intervalMs": 900000             // 15min (Full Speed)
  }
}
```

---

## 7. Troubleshooting Checklist

Wenn Loops nicht wie erwartet laufen:

- [ ] **connection.json valide?** → `npm run validate:connection`
- [ ] **WooCommerce erreichbar?** → `curl https://kaufe-es.eu/wp-json/`
- [ ] **API Keys aktiv?** → Check WooCommerce Admin > Advanced > REST API
- [ ] **OpenAI Account hat Credits?** → Check https://platform.openai.com/account/billing/overview
- [ ] **SMTP konfiguriert?** → `npm run test:smtp`
- [ ] **ml.config.ts valide?** → `npm run validate:ml-config`
- [ ] **Schwellenwerte zu hoch?** → Probiere aggressive Settings
- [ ] **Loop-Mode ist `continuous`?** → Check `job.mode`
- [ ] **Interval ist nicht zu groß?** → Min. 900000ms (15min)
- [ ] **Logs prüfen** → `npm run logs:agent`

---

## 8. Wichtige Shortcuts

```bash
# Config validieren
npm run validate:all

# Agent Logs anschauen
npm run logs:agent
npm run logs:agent:tail

# Loop manuell triggern
npm run trigger:anomaly-detection
npm run trigger:payment-recovery
npm run trigger:product-optimization
npm run trigger:analytics-insights

# Agent Health Check
curl http://localhost:3000/api/agent/health

# Agent Fehler anschauen
curl http://localhost:3000/api/agent/errors

# Config neuladen (ohne Restart)
curl -X POST http://localhost:3000/api/agent/config/reload

# Alle Patterns anschauen
curl http://localhost:3000/api/agent/memory/patterns

# Pattern löschen
curl -X DELETE http://localhost:3000/api/agent/memory/patterns/:loopType/:patternKey
```

---

## Support

**Fragen?**
- Technische Details: [AGENTIC_TOOLS_REFERENCE.md](./AGENTIC_TOOLS_REFERENCE.md)
- Loop-Funktionen: [AGENTIC_LOOP_ARCHITECTURE.md](./AGENTIC_LOOP_ARCHITECTURE.md)
- User Guide: [AGENTIC_LOOPS_USER_GUIDE.md](./AGENTIC_LOOPS_USER_GUIDE.md)
