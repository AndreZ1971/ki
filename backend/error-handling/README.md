# Error Handling System

Production-ready Error-Handling für das KI Agent System mit Circuit Breaker, Retry-Strategien, Dead Letter Queue und Alerting.

## 📦 Module

### 1. Circuit Breaker
Schützt externe Services vor Überlastung durch temporäres Blockieren bei wiederholten Fehlern.

**States:**
- `CLOSED` - Normal operation
- `OPEN` - Requests werden blockiert
- `HALF_OPEN` - Test-Phase nach Timeout

**Verwendung:**
```typescript
import { wooCommerceBreaker } from './error-handling';

// API Call mit Circuit Breaker Protection
const products = await wooCommerceBreaker.execute(async () => {
  return await wooCommerce.get('products');
});

// Status prüfen
console.log(wooCommerceBreaker.getState()); // CLOSED | OPEN | HALF_OPEN
```

**Konfiguration:**
```typescript
import { circuitBreakerManager } from './error-handling';

const myBreaker = circuitBreakerManager.register('MyAPI', {
  failureThreshold: 5,      // 5 Fehler bis Circuit öffnet
  successThreshold: 2,      // 2 Erfolge zum Schließen
  timeout: 60000,           // 1 Minute bis Retry
  onStateChange: (state, name) => {
    console.log(`${name} is now ${state}`);
  }
});
```

---

### 2. Retry Strategies
Automatische Wiederholung fehlgeschlagener Operationen mit exponential backoff.

**Verwendung:**
```typescript
import { standardRetry, openAIRetry } from './error-handling';

// Standard Retry (3 Versuche)
const result = await standardRetry.execute(async () => {
  return await api.call();
});

// OpenAI spezifisch (optimiert für Rate Limits)
const completion = await openAIRetry.execute(async () => {
  return await openai.chat.completions.create({...});
});
```

**Custom Retry:**
```typescript
import { RetryStrategy } from './error-handling';

const customRetry = new RetryStrategy({
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  jitter: true,
  onRetry: (attempt, error, delay) => {
    console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
  }
});

await customRetry.execute(() => myOperation());
```

**Vordefinierte Strategien:**
- `aggressiveRetry` - 5 Versuche, schnell
- `standardRetry` - 3 Versuche, balanced
- `conservativeRetry` - 2 Versuche, langsam
- `openAIRetry` - 4 Versuche, lange Delays

---

### 3. Dead Letter Queue (DLQ)
Speichert fehlgeschlagene Jobs für spätere Wiederholung.

**Verwendung:**
```typescript
import { deadLetterQueue } from './error-handling';

// Job fehlgeschlagen - in DLQ speichern
try {
  await createProduct(data);
} catch (error) {
  await deadLetterQueue.add('createProduct', data, error, {
    shopId: 123,
    priority: 'high'
  });
}

// Stats abrufen
const stats = deadLetterQueue.getStats();
console.log(`DLQ: ${stats.total} messages, ${stats.readyForRetry} ready`);

// Erfolgreich verarbeitet - aus DLQ entfernen
await deadLetterQueue.remove(messageId);
```

**Auto-Retry:**
```typescript
import { DeadLetterQueue } from './error-handling';

const dlq = new DeadLetterQueue({
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 300000, // 5 Minuten
  onRetry: (message) => {
    console.log(`Retrying job: ${message.jobType}`);
    // Hier Job erneut ausführen
  }
});
```

---

### 4. Alerting System
Benachrichtigungen bei kritischen Fehlern über mehrere Kanäle.

**Verwendung:**
```typescript
import { alertError, alertCritical, alertWarning } from './error-handling';

// Error Alert
await alertError(
  'API Connection Failed',
  'WooCommerce API ist nicht erreichbar',
  'WooCommerceClient',
  error,
  { shopUrl: 'https://example.com' }
);

// Critical Alert (höchste Priorität)
await alertCritical(
  'Payment Gateway Down',
  'Zahlungen können nicht verarbeitet werden',
  'PaymentService',
  error
);

// Warning Alert
await alertWarning(
  'High Memory Usage',
  'Memory usage bei 85%',
  'SystemMonitor',
  { memoryUsage: '3.4GB' }
);
```

**Kanäle konfigurieren:**
```typescript
import { AlertingService, AlertSeverity } from './error-handling';

const alerting = new AlertingService({
  channels: [
    { type: 'console', enabled: true },
    { 
      type: 'email', 
      enabled: true,
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        user: 'alerts@example.com',
        pass: 'password',
        to: 'admin@example.com'
      }
    },
    {
      type: 'slack',
      enabled: true,
      config: {
        webhookUrl: 'https://hooks.slack.com/services/...'
      }
    },
    {
      type: 'webhook',
      enabled: true,
      config: {
        url: 'https://api.example.com/alerts'
      }
    }
  ],
  minSeverity: AlertSeverity.WARNING,
  rateLimit: 10 // Max 10 Alerts pro Minute
});
```

---

## 🚀 Komplette Integration

### Setup in server.ts
```typescript
import { setupErrorHandling } from './error-handling';

// Bei Server-Start
setupErrorHandling();
```

### Kombination aller Features
```typescript
import { 
  executeWithFullProtection,
  wooCommerceBreaker,
  standardRetry
} from './error-handling';

// Alles kombiniert: Circuit Breaker + Retry + DLQ + Alerting
const result = await executeWithFullProtection(
  () => wooCommerce.post('products', productData),
  {
    circuitBreaker: wooCommerceBreaker,
    retryStrategy: standardRetry,
    jobType: 'createProduct',
    payload: productData,
    alertOnFailure: true
  }
);
```

### Job-Wrapper
```typescript
async function robustJobExecution<T>(
  jobName: string,
  fn: () => Promise<T>,
  payload?: any
): Promise<T> {
  return executeWithFullProtection(fn, {
    circuitBreaker: wooCommerceBreaker,
    retryStrategy: standardRetry,
    jobType: jobName,
    payload,
    alertOnFailure: true
  });
}

// Verwendung
await robustJobExecution('createFreebie', async () => {
  return await createFreebieJob(data);
}, data);
```

---

## 📊 Monitoring

### Circuit Breaker Status
```typescript
import { circuitBreakerManager } from './error-handling';

// Alle Status abrufen
const stats = circuitBreakerManager.getAllStats();
console.log(stats);
// {
//   WooCommerce: { state: 'CLOSED', failureCount: 0, ... },
//   WordPress: { state: 'OPEN', nextAttempt: '2025-11-01...' },
//   OpenAI: { state: 'HALF_OPEN', successCount: 1, ... }
// }

// Reset bei Bedarf
circuitBreakerManager.resetAll();
```

### DLQ Monitoring
```typescript
import { deadLetterQueue } from './error-handling';

setInterval(() => {
  const stats = deadLetterQueue.getStats();
  console.log(`DLQ Stats:`, stats);
  // {
  //   total: 12,
  //   readyForRetry: 3,
  //   maxRetriesReached: 2,
  //   byJobType: { createProduct: 8, updatePrice: 4 }
  // }
}, 60000);
```

---

## ⚙️ Environment Variables

```env
# Alerting - E-Mail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASS=your-password
ALERT_EMAIL_FROM=ki-agent@example.com
ALERT_EMAIL_TO=admin@example.com

# Alerting - Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz

# Alerting - Custom Webhook
ALERT_WEBHOOK_URL=https://api.example.com/alerts
```

---

## 🎯 Best Practices

### 1. Circuit Breaker für alle externen Services
```typescript
// Immer Circuit Breaker verwenden
const result = await wooCommerceBreaker.execute(() => api.call());

// NICHT direkt aufrufen
const result = await api.call(); // ❌
```

### 2. Retry nur für transiente Fehler
```typescript
// Gut: Retry bei Network-Fehlern
await standardRetry.execute(() => api.call());

// Schlecht: Retry bei Validierungsfehler (400)
// Diese sollten sofort fehlschlagen
```

### 3. DLQ für kritische Jobs
```typescript
// Jobs die nicht verloren gehen dürfen
try {
  await createPayment(data);
} catch (error) {
  await deadLetterQueue.add('payment', data, error);
  throw error; // Trotzdem weitergeben
}
```

### 4. Alerting mit Kontext
```typescript
// Gut: Kontext mitgeben
await alertError('API Failed', message, 'Service', error, {
  shopUrl: shop.url,
  productId: product.id,
  attemptNumber: 3
});

// Schlecht: Keine Kontext-Infos
await alertError('Error', 'Something failed', 'App', error); // ❌
```

---

## 📈 Production Empfehlungen

1. **Circuit Breaker Thresholds:**
   - WooCommerce/WordPress: 5 Fehler, 60s Timeout
   - OpenAI: 3 Fehler, 120s Timeout
   - Custom APIs: Je nach SLA anpassen

2. **Retry Delays:**
   - Fast APIs: aggressive (500ms start)
   - Slow APIs: conservative (2s start)
   - Rate-Limited APIs: openAI (2s start, long max)

3. **DLQ Retention:**
   - Auto-Retry: 3 Versuche, 5min Delay
   - Manual Review nach 3 Versuchen
   - Cleanup nach 7 Tagen

4. **Alert Severity:**
   - INFO: Logging only
   - WARNING: Console + Log
   - ERROR: Console + Email
   - CRITICAL: Console + Email + Slack + Webhook

---

## 🧪 Testing

```typescript
// Test Circuit Breaker
describe('Circuit Breaker', () => {
  it('opens after threshold', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      timeout: 1000
    });
    
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(() => Promise.reject('error'));
      } catch {}
    }
    
    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });
});
```

---

**Made with 🛡️ for Production Stability**
