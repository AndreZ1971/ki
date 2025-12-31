# Agentic Troubleshooting Guide

> **Für alle User**: Fehlerdiagnose & Lösungen für Agentic Loops.  
> **Für Entwickler**: Debugging Strategien & Stack Traces.

---

## Übersicht: Error Classification

Agentic Loop-Fehler fallen in 4 Kategorien:

| Kategorie          | Symptom                                              | Root Cause                                       | Lösung                                              |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| **Configuration**  | App startet nicht                                    | connection.json/ml.config ungültig               | Validiere Config (Abschnitt 2)                      |
| **External API**   | Loop läuft nicht, WooCommerce/OpenAI antwortet nicht | Service Down, Rate Limit, Auth Fehler            | Retry, Rate Limit abwarten (Abschnitt 3)            |
| **Logic Error**    | Loop läuft, aber Anomalien werden falsch erkannt     | Bug in Analyzer, Thresholds zu hoch/niedrig      | Justiere Thresholds (Abschnitt 4)                   |
| **Infrastructure** | Logs voll, Memory hoch, Crash                        | Storage voll, Memory Leak, zu häufige Ausführung | Bereinige Storage, reduziere Frequenz (Abschnitt 5) |

---

## 1. Quick Diagnostic Flowchart

```
┌─ Agent läuft?
│
├─ Nein → Gehe zu Abschnitt 2: Configuration
│
├─ Ja, aber "Connection Failed" in Logs
│  └─ Gehe zu Abschnitt 3: External API Errors
│
├─ Ja, aber Loops machen nichts
│  ├─ Check: mode === 'continuous'? → Abschnitt 2.4
│  ├─ Check: intervalMs nicht zu groß? → Abschnitt 2.4
│  ├─ Check: Schwellenwerte nicht zu hoch? → Abschnitt 4
│
├─ Ja, aber falsche Ergebnisse
│  └─ Gehe zu Abschnitt 4: Logic Errors
│
└─ Ja, aber Performance-Probleme
   └─ Gehe zu Abschnitt 5: Infrastructure
```

---

## 2. Configuration Errors

### 2.1 "Cannot find module 'connection.json'"

**Fehler**:
```
Error: Cannot find module '../connection.json'
  at Module._load (internal/modules/loader.js:...)
```

**Ursache**: Datei existiert nicht oder ist im falschen Ordner.

**Lösung**:
```bash
# Richtige Pfade:
backend/connection.json      ✅ Korrekt
backend/config/connection.json  ❌ Falsch

# Erstelle die Datei:
touch backend/connection.json

# Kopiere Vorlage:
cp backend/connection.json.example backend/connection.json
```

---

### 2.2 "Invalid JSON in connection.json"

**Fehler**:
```
SyntaxError: Unexpected token } in JSON at position 234
```

**Ursache**: JSON-Syntax-Fehler (fehlender Komma, falsche Klammer, etc.)

**Lösung**:
```bash
# Validiere JSON
npm run validate:connection

# Oder online:
https://jsonlint.com/

# Beispiel – FALSCH:
{
  "woocommerce": {
    "url": "https://..."
    "consumer_key": "ck_..."  ← Fehler: Komma fehlt nach "url"
  }
}

# Beispiel – RICHTIG:
{
  "woocommerce": {
    "url": "https://...",
    "consumer_key": "ck_..."
  }
}
```

---

### 2.3 "Missing required field: woocommerce.url"

**Fehler**:
```
ValidationError: Missing required field: woocommerce.url
```

**Ursache**: connection.json ist unvollständig.

**Lösung** – Mindest-Konfiguration:

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

**Fehler**:
```
ValidationError: job.mode must be 'once' or 'continuous'
```

**Ursache**: Ungültiger Wert in `job.mode`.

**Lösung**:
```json
{
  "job": {
    "mode": "continuous",  // ✅ Korrekt
    // NICHT: "every_hour", "daily", "manual", etc.
    "intervalMs": 900000
  }
}
```

**Mode erklären**:

| Mode         | Verhalten                                  | Wann nutzen          |
| ------------ | ------------------------------------------ | -------------------- |
| `continuous` | Loop läuft alle `intervalMs` Millisekunden | Production           |
| `once`       | Loop läuft nur auf manuellen API-Call      | Development, Testing |

```bash
# Test: Triggere Loop manuell (mode: 'once')
curl -X POST http://localhost:3000/api/agent/loops/anomaly-detection/run
```

---

### 2.5 "intervalMs too small"

**Fehler**:
```
ValidationError: intervalMs must be >= 300000 (5 minutes)
```

**Ursache**: Interval ist zu aggressiv konfiguriert.

**Lösung**:
```json
{
  "job": {
    "intervalMs": 900000  // ✅ Min. 15 Min (Production)
    // NICHT: 60000 (1 Min), 300000 (5 Min) – nur für Testing
  }
}
```

**Warum Minimum 5-15 Minuten?**
- WooCommerce API braucht Zeit für Konsistenz
- A/B Tests brauchen Daten-Akkumulation
- Rate Limits der APIs respektieren
- Server-Last reduzieren

---

### 2.6 "ml.config.ts validation failed"

**Fehler**:
```
ValidationError in ml.config.ts: anomalyThresholds.unusualAmount must be >= 10
```

**Ursache**: Logische Validierungsfehler in Config-Werten.

**Lösung – Häufige Fehler**:

```typescript
// ❌ FALSCH: Threshold negativ
anomalyThresholds: {
  unusualAmount: -5000  // Kann nicht negativ sein
}

// ✅ RICHTIG:
anomalyThresholds: {
  unusualAmount: 5000   // In EUR, positiv
}

// ❌ FALSCH: Confidence > 1
confidenceLevel: 1.5    // Kann max. 1.0 sein

// ✅ RICHTIG:
confidenceLevel: 0.95   // 0-1 (0% - 100%)

// ❌ FALSCH: Margin > 1
targetMarginPercent: 150  // Margin > 100%?

// ✅ RICHTIG:
targetMarginPercent: 30   // 30% Marge
```

```bash
# Validiere Config
npm run validate:ml-config
```

---

## 3. External API Errors

### 3.1 "WooCommerce 401 Unauthorized"

**Fehler in Logs**:
```
[ERROR] WooCommerce API Error: 401 Unauthorized
  Endpoint: GET /orders?status=failed&limit=100
  Headers: Authorization: Basic [base64]
```

**Mögliche Ursachen** (in dieser Reihenfolge):
1. consumerKey oder consumerSecret falsch
2. API Key wurde deaktiviert
3. WooCommerce REST API nicht aktiviert

**Lösungsschritte**:

**Schritt 1: API Key regenerieren**
1. WooCommerce Admin: **Einstellungen** → **Advanced** → **REST API**
2. Alte Key löschen (falls vorhanden)
3. Neue Key erstellen: **Add Key**
4. Name: "A.R.I. Loop Agent"
5. Permission: **Read/Write** (für Orders, Products, Customers)
6. Klick **Generate**
7. Kopiere **Consumer Key** und **Consumer Secret**

**Schritt 2: connection.json aktualisieren**
```json
{
  "woocommerce": {
    "consumerKey": "PASTE_HERE_FROM_STEP_5",
    "consumerSecret": "PASTE_HERE_FROM_STEP_5"
  }
}
```

**Schritt 3: Teste Verbindung**
```bash
curl -X GET "https://kaufe-es.eu/wp-json/wc/v3/orders?status=failed&limit=1" \
  -u "ck_XXX:cs_YYY"

# Sollte JSON mit 1 Order zurückgeben (oder empty array)
```

**Schritt 4: Restart Agent**
```bash
npm run dev
# oder: systemctl restart agentic (Production)
```

---

### 3.2 "WooCommerce 403 Forbidden"

**Fehler**:
```
[ERROR] WooCommerce API Error: 403 Forbidden
  Message: "User does not have permission to read products"
```

**Ursache**: API Key hat nicht ausreichend Permissions.

**Lösung**:

1. WooCommerce Admin: **Einstellungen** → **Advanced** → **REST API**
2. Wähle deine Key
3. Check Permission: Sollte mindestens **Read/Write** sein (nicht nur Read)

```
Permissions sollten sein:
- Orders: Read/Write ✅
- Products: Read/Write ✅
- Customers: Read/Write ✅
```

---

### 3.3 "WooCommerce API Timeout (30000ms)"

**Fehler**:
```
[ERROR] WooCommerce API Timeout
  Endpoint: GET /orders?status=failed&limit=100
  Timeout: 30000ms
```

**Ursachen**:
1. WooCommerce Shop ist langsam (viele Plugins, große DB)
2. Netzwerk-Problem
3. WooCommerce Server Down

**Lösungsschritte**:

**Kurz-Fristig**:
```json
{
  "woocommerce": {
    "timeoutMs": 60000  // Erhöhe auf 60 Sekunden
  }
}
```

**Mittelfristig**: Überprüfe WooCommerce Performance
```bash
# Test: Gibt WooCommerce schnell Antwort?
time curl "https://kaufe-es.eu/wp-json/wc/v3/orders?limit=1" -u "..."

# Sollte < 5 Sekunden dauern
```

**Langfristig**: Wenn durchgehend > 10s
- Increase Interval (weniger häufig laufen)
- Reduziere `orderLimit`, `productLimit` in ml.config.ts
- Kontaktiere Hosting-Provider (Performance-Upgrade)

---

### 3.4 "OpenAI API Error: 401 Unauthorized"

**Fehler**:
```
[ERROR] OpenAI API Error: 401 Unauthorized
  Message: "Incorrect API key provided."
```

**Ursache**: API Key ist falsch/abgelaufen.

**Lösung**:

1. https://platform.openai.com/account/api-keys
2. Alte Key löschen (falls bereits rotiert)
3. Create new secret key
4. Kopiere Key (wird nur einmal angezeigt!)
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

**Fehler**:
```
[ERROR] OpenAI API Error: 429 Insufficient quota
  You exceeded your current quota, please check your plan and billing settings.
```

**Ursache**: OpenAI Account hat keine Credits mehr.

**Lösung**:

1. https://platform.openai.com/account/billing/overview
2. Check: "Usage this month" vs. "Billing limit"
3. Bezahle Rechnung oder erhöhe Billing Limit
4. Warte 1-2 Minuten (Quota wird refreshed)

**Kosten abschätzen**:
```
Loops pro Day × Tokens pro Loop = Tages-Tokens
3 (ca. 15 Schleifen) × 1500 tokens = 4,500 tokens/Tag

Tages-Tokens × 30 Tage = Monat
4,500 × 30 = 135,000 tokens/Monat

Kosten mit gpt-4o-mini:
135,000 tokens × $0.00015/1k tokens = $0.02-0.05/Monat
```

**Sparen**:
```json
{
  "openAI": {
    "model": "gpt-4o-mini"  // ✅ Billiger (~$0.15/1M tokens)
    // NICHT: "gpt-4" (~$3/1M tokens) für Production
  }
}
```

---

### 3.6 "OpenAI Error: Rate limit exceeded"

**Fehler**:
```
[ERROR] OpenAI API Error: 429 Rate limit exceeded
  Retry after: 60 seconds
```

**Ursache**: Zu viele API-Calls zu schnell.

**Lösung – Mittelfristig**:
```json
{
  "job": {
    "intervalMs": 1800000  // Erhöhe von 900000 zu 30 Min
  }
}
```

**Lösung – Langfristig**: Batch-Processing nutzen

```typescript
// Nicht: 5 Loops nacheinander laufen lassen
loop1(); await sleep(1000);
loop2(); await sleep(1000);
loop3();

// Sondern: Sequenziell mit Backoff
await runLoopsSequentially([loop1, loop2, loop3], {
  delayBetween: 5000,  // 5s zwischen Loops
  maxConcurrent: 1     // Nur 1 gleichzeitig
});
```

---

### 3.7 "SMTP Connection Failed"

**Fehler**:
```
[ERROR] Email Error: SMTP Connection Failed
  Host: inn.bitpalast.net
  Port: 465
  Error: connect ECONNREFUSED
```

**Ursache**: SMTP Server nicht erreichbar oder Port falsch.

**Lösungsschritte**:

**Schritt 1: Teste SMTP Verbindung**
```bash
npm run test:smtp
```

**Schritt 2: Überprüfe Config**
```json
{
  "smtp": {
    "host": "inn.bitpalast.net",
    "port": 465,          // Prüfe Port!
    "secure": true,       // true für Port 465, false für 587
    "user": "info@...",
    "password": "..."
  }
}
```

**Häufige Port-Probleme**:

```
Port 25:  Unverschlüsselt, oft blockiert → ❌ Nutze 465 oder 587
Port 465: TLS (secure: true)     → ✅ Standard
Port 587: STARTTLS (secure: false) → ✅ Alternative

FALSCH:
{
  "port": 25,
  "secure": true  ← Konflikt!
}

RICHTIG:
{
  "port": 465,
  "secure": true   ← oder
  "port": 587,
  "secure": false
}
```

**Schritt 3: Host prüfen**
```bash
# Teste ob Host erreichbar ist
nslookup inn.bitpalast.net
telnet inn.bitpalast.net 465

# Sollte verbunden, nicht "Connection refused"
```

**Schritt 4: Credentials prüfen**
- Username: Meist vollständige Email-Adresse
- Password: Kann App-Passwort sein (z.B. Gmail)

---

### 3.8 "Database Connection Error"

**Fehler** (falls Persistent Memory DB nutzt):
```
[ERROR] Database Error: ECONNREFUSED
  Host: localhost
  Port: 5432
```

**Ursache**: Datenbank nicht erreichbar.

**Hinweis**: A.R.I. nutzt **In-Memory Storage** (kein DB nötig!)

**Aber falls persistent Storage konfiguriert**:

```bash
# Starte DB (z.B. PostgreSQL)
docker run -d -e POSTGRES_PASSWORD=secret postgres:15

# Oder: Nutze SQLite (einfacher)
# Oder: Deaktiviere Persistence
```

---

## 4. Logic Errors

### 4.1 "No anomalies detected, but many failed orders"

**Symptom**: Loop läuft, aber findet Anomalien nicht.

**Ursache**: Schwellenwerte sind zu hoch.

**Lösung – Justiere in ml.config.ts**:

```typescript
// VORHER (zu konservativ):
anomalyThresholds: {
  unusualAmount: 10000,           // Nur > €10k
  repeatedFailureThreshold: 5,    // Erst nach 5 Fehlern
}
// → Findet fast nichts

// NACHHER (aggressiver):
anomalyThresholds: {
  unusualAmount: 3000,            // > €3k
  repeatedFailureThreshold: 2,    // Nach 2 Fehlern
}
// → Findet mehr (aber auch mehr False Positives)
```

**Debug-Techniken**:

```bash
# 1. Manuell triggern und Logs anschauen
npm run trigger:anomaly-detection

# 2. Logs filtern
npm run logs:agent | grep "anomaly\|threshold\|detected"

# 3. Rufe API direkt auf und inspiziere Response
curl http://localhost:3000/api/agent/loops/anomaly-detection/run
# → Gibt JSON mit erkannten Anomalien zurück
```

---

### 4.2 "Strategy Selector always returns 'retry'"

**Symptom**: Recovery Strategy ist immer `retry`, nie `discount` oder `contact`.

**Ursache**: Decision Tree hat Logik-Fehler oder Inputs sind ungültig.

**Lösung**:

```typescript
// Überprüfe Inputs
const strategy = await strategyTool.selectPaymentRecoveryStrategy({
  failureReason: 'card_declined',  // Muss bekannter Wert sein
  customerFailureRate: 0.35,       // Muss 0-1 sein
  orderTotal: 7500.00,             // Muss > 0 sein
  paymentMethods: ['klarna']       // Darf nicht leer sein
});

// Debugging: Logs anschauen
console.log('Strategy Selector Input:', {
  failureReason,
  customerFailureRate,
  orderTotal,
  paymentMethods
});
console.log('Decision Tree Branch:', selectedBranch);
console.log('Result Strategy:', strategy);
```

**Decision Tree überprüfen** (backend/agent/tools.ts):

```typescript
if (failureReason === 'card_declined') {
  if (customerFailureRate > 0.3) {
    return 'alternative_payment';  ← Sollte hier ankommen
  } else {
    return 'retry';
  }
}
```

---

### 4.3 "A/B Test always shows no winner"

**Symptom**: A/B Test läuft, aber alle Varianten haben ähnliche Conversions.

**Ursachen**:
1. Sample Size zu klein
2. Test Duration zu kurz (nicht genug Daten)
3. Effekt ist wirklich klein

**Lösung**:

```typescript
// Erhöhe Sample Size
const result = await abTestTool.simulateABTest({
  baselineConversionRate: 0.06,
  sampleSize: 5000,              // von 1000 auf 5000
  confidenceLevel: 0.90           // von 0.95 auf 0.90 (akzeptiere weniger Genauigkeit)
});
```

**Statistik erklärt**:
- Größere Sample Size = zuverlässigere Ergebnisse
- Aber: Dauert länger (mehr Zeit nötig für Test)
- Trade-off: Speed vs. Accuracy

---

### 4.4 "Discount always at maximum threshold"

**Symptom**: Discount Generator gibt immer 30% Rabatt (Maximum).

**Ursache**: Margin-Limits sind zu niedrig konfiguriert.

**Lösung**:

```typescript
// VORHER (zu restriktiv):
targetMarginPercent: 50          // Ziele 50% Marge
// → Discount wird limited auf max 5% um Marge zu schützen

// NACHHER (realistisch):
targetMarginPercent: 30          // Ziele 30% Marge (üblich im E-Commerce)
// → Erlaubt höhere Discounts (z.B. 15%)
```

**Brutto-Marge Beispiel**:
```
Kosten: €8.50
Verkaufspreis: €29.99
Brutto-Marge: (29.99 - 8.50) / 29.99 = 71.5%

Mit 10% Rabatt:
Neuer Preis: €26.99
Neue Marge: (26.99 - 8.50) / 26.99 = 68.5%
→ Immer noch > 30% OK!

Mit 30% Rabatt:
Neuer Preis: €20.99
Neue Marge: (20.99 - 8.50) / 20.99 = 59.5%
→ Immer noch > 30% OK!
```

---

## 5. Infrastructure & Performance

### 5.1 "Memory usage keeps growing"

**Symptom**: Node Process nutzt immer mehr RAM (z.B. von 100MB → 500MB → 1GB).

**Ursache**: Memory Leak (wahrscheinlich in Pattern Storage).

**Debug-Schritte**:

```bash
# 1. Überprüfe Storage Size
curl http://localhost:3000/api/agent/memory/stats
# Response: { "patternCount": 15000 }  ← Zu viele!

# 2. Cleanup erzwingen
npm run agent:cleanup-storage

# 3. Überprüfe ob TTL-Cleanup läuft
npm run logs:agent | grep "cleanup\|TTL\|deleted"
```

**Lösung**:

```typescript
// In backend/agent/memory.ts
// TTL-Cleanup sollte auto laufen
setInterval(() => {
  this.cleanup();  // Jede Stunde
}, 3600000);

// Falls nicht aktiv, aktiviere:
export const enableAutoCleanup = true;
export const cleanupInterval = 3600000;  // 1h
```

**Notfalls: Manuelle Bereinigung**:
```bash
# Alle Patterns älter als 24h löschen
curl -X DELETE http://localhost:3000/api/agent/memory/cleanup?maxAgeHours=24
```

---

### 5.2 "Logs are huge (GB)"

**Symptom**: Log-Datei ist mehrere GB groß.

**Ursache**: Logging Level ist zu verbose, keine Log Rotation.

**Lösung – Log Rotation aktivieren**:

```typescript
// backend/logger.ts
import winston from 'winston';
import 'winston-daily-rotate-file';

const transport = new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '100m',     // Rotate wenn > 100MB
  maxDays: '14d'       // Lösche Logs älter als 14 Tage
});
```

**Sofortige Bereinigung**:
```bash
# Archiviere alte Logs
gzip logs/app-2025-11-*.log

# Lösche sehr alte Logs
find logs -name "*.log" -mtime +30 -delete  # Älter als 30 Tage
```

---

### 5.3 "Agent crashes frequently"

**Symptom**: Process beendet sich unerwartet (kein Fehler in Logs).

**Ursache**: Out of Memory, Unhandled Exception, System Signal.

**Debug-Schritte**:

```bash
# 1. Überprüfe System Ressourcen
free -h       # Memory
df -h         # Disk
top           # CPU

# 2. Überprüfe Crash Log
dmesg | tail -20  # Kernel Messages (OOM Killer?)

# 3. Starte mit Debug
npm run dev:debug
# → Mehr Logging, bessere Stack Traces
```

**Häufige Ursachen & Lösungen**:

| Symptom     | Ursache                   | Lösung                                 |
| ----------- | ------------------------- | -------------------------------------- |
| `SIGKILL`   | Out of Memory             | Reduziere `orderLimit`, `productLimit` |
| `SIGSEGV`   | Segmentation Fault (rare) | Update Node.js                         |
| `SIGABRT`   | Uncaught Exception        | Check Logs vor Crash                   |
| `ENOTFOUND` | DNS Error                 | Überprüfe DNS, Internet Connection     |

---

### 5.4 "Loops are running too slowly"

**Symptom**: Ein Loop-Durchlauf dauert 10+ Minuten (sollte 30s sein).

**Debug**:

```bash
# 1. Messe Loop Duration
npm run trigger:anomaly-detection

# Logs zeigen:
# [2025-12-17 10:00:00] Starting anomalyDetectionLoop
# [2025-12-17 10:00:45] Completed anomalyDetectionLoop (duration: 45s)

# Alles unter 2 Min ist OK
```

**Wenn > 2 Min, dann optimiere**:

```typescript
// ml.config.ts – Reduziere Datenmenge
anomalyDetectionConfig = {
  orderLimit: 50,        // von 100 auf 50
  maxDaysOld: 7          // von 30 auf 7 Tage
}

productOptimizationConfig = {
  productLimit: 25,      // von 50 auf 25
  minConversionRate: 0.05  // von 0.02 auf 0.05 (höher = weniger Produkte)
}
```

**Oder: Reduziere Frequenz / verschiebe Zeiten** (Settings → Agentic Loops → ⚙️ Schedule oder direkt in `backend/data/loop-schedules.json`):
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

| Level     | Bedeutung                             | Häufigkeit           |
| --------- | ------------------------------------- | -------------------- |
| **TRACE** | Sehr detailliert (Variable values)    | Selten (Debug only)  |
| **DEBUG** | Normale Operation Details             | Häufig               |
| **INFO**  | Wichtige Meilensteine                 | Jeder Loop-Durchlauf |
| **WARN**  | Potential Issues (Retries, Fallbacks) | Gelegentlich         |
| **ERROR** | Failed Operations (Need Attention)    | Sollte selten sein   |
| **FATAL** | System Down                           | Sehr selten          |

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

### 9.1 Agent steckt fest ("Hung Process")

```bash
# 1. Überprüfe ob Agent antwortet
curl -m 5 http://localhost:3000/api/agent/health
# Timeout? → Agent ist gehängt

# 2. Stoppe Agent
npm stop
# oder: kill $(lsof -ti :3000)

# 3. Warte 5 Sekunden
sleep 5

# 4. Starte neu
npm run dev
```

---

### 9.2 Zu viele alte Patterns → Storage voll

```bash
# 1. Check Pattern Count
curl http://localhost:3000/api/agent/memory/stats

# 2. Cleanup alte Patterns (älter als 7 Tage)
curl -X POST http://localhost:3000/api/agent/memory/cleanup?maxAgeDays=7

# 3. Falls nötig: Alle Patterns löschen (setzt Lerneffekte zurück!)
curl -X DELETE http://localhost:3000/api/agent/memory/purge
```

---

### 9.3 Agent läuft, aber keine Schleifen-Ausführung

```bash
# 1. Überprüfe ob Loops überhaupt konfiguriert sind
curl http://localhost:3000/api/agent/config/loops

# 2. Überprüfe mode
curl http://localhost:3000/api/agent/config | grep '"mode"'
# Sollte: "mode": "continuous"

# 3. Triggere Loop manuell
npm run trigger:anomaly-detection

# 4. Falls auch manuell nichts passiert → Logs anschauen
npm run logs:agent:tail
```

---

## 10. Support Resources

### Checklisten

**Agent startet nicht:**
- [ ] connection.json existiert?
- [ ] JSON valide? (`npm run validate:connection`)
- [ ] Alle required Fields vorhanden?
- [ ] Port 3000 nicht blockiert?

**Loops laufen nicht:**
- [ ] job.mode === 'continuous'?
- [ ] intervalMs >= 900000?
- [ ] WooCommerce API Key aktiv?
- [ ] OpenAI API Key valide?

**Fehler in Loops:**
- [ ] Schwellenwerte passend? (ml.config.ts)
- [ ] Externe Services online? (health check)
- [ ] Genug Daten vorhanden? (orderLimit, productLimit)

---

### Escalation Path

1. **Log inspizieren**: `npm run logs:agent:tail`
2. **Health Check**: `curl http://localhost:3000/api/agent/health`
3. **Konfiguration validieren**: `npm run validate:all`
4. **Manuell testen**: `npm run trigger:anomaly-detection`
5. **Debug-Mode starten**: `npm run dev:debug`
6. **Kontaktiere Entwickler** (mit Logs & Debug Output)

---

### Dokumentation

- **Allgemein**: [AGENTIC_LOOP_ARCHITECTURE.md](./AGENTIC_LOOP_ARCHITECTURE.md)
- **Tools**: [AGENTIC_TOOLS_REFERENCE.md](./AGENTIC_TOOLS_REFERENCE.md)
- **Konfiguration**: [AGENTIC_CONFIGURATION.md](./AGENTIC_CONFIGURATION.md)
- **User Guide**: [AGENTIC_LOOPS_USER_GUIDE.md](./AGENTIC_LOOPS_USER_GUIDE.md)

---

## 11. Zusammenfassung Error-Handling

```
Error auftritt
    ↓
[Check Severity]
    ├─ CRITICAL (App Down)
    │  └─ → Config/Auth Error (Abschnitt 2-3)
    ├─ HIGH (Loops fehlen)
    │  └─ → Logic/Threshold Error (Abschnitt 4)
    └─ MEDIUM (Slow/Memory)
       └─ → Infrastructure Error (Abschnitt 5)
```

**Erste Hilfe**: Immer erst Logs anschauen → Configuration prüfen → External APIs testen.

