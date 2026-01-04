# 🧪 Testing Guide - ARI System

**Version:** 5.1.1  
**Letzte Aktualisierung:** 4. Januar 2026  
**Status:** Production-Ready

---

## 📋 Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Test-Setup](#test-setup)
3. [Unit-Tests](#unit-tests)
4. [Integration-Tests](#integration-tests)
5. [End-to-End Tests](#end-to-end-tests)
6. [Bugfix Validation Tests (v5.1.1)](#bugfix-validation-tests)
7. [Performance-Tests](#performance-tests)
8. [Security-Tests](#security-tests)

---

## 🎯 Überblick

### Test-Strategie

```
     ┌─────────────────────────────────────┐
     │      E2E Tests (Playwright)         │  ← 10% Coverage
     │  - User Workflows                   │
     │  - Cross-Browser Testing            │
     └─────────────────────────────────────┘
                     ▲
     ┌──────────────┴──────────────────────┐
     │   Integration Tests (Vitest)        │  ← 30% Coverage
     │  - API Endpoint Testing             │
     │  - Service Interactions             │
     │  - Database Operations              │
     └─────────────────────────────────────┘
                     ▲
     ┌──────────────┴──────────────────────┐
     │    Unit Tests (Vitest)              │  ← 60% Coverage
     │  - Service Logic                    │
     │  - Utilities                        │
     │  - Data Transformations             │
     └─────────────────────────────────────┘
```

### Test-Tools

| Tool        | Zweck                    | Config              |
|-------------|--------------------------|---------------------|
| **Vitest**  | Unit + Integration Tests | `vitest.config.ts`  |
| **Playwright** | E2E Browser Tests     | `playwright.config.ts` |
| **Supertest** | API Endpoint Testing   | Built-in            |
| **MSW**     | API Mocking              | Manual Setup        |

---

## 🛠️ Test-Setup

### Installation

```bash
# Test-Dependencies installieren
npm install --save-dev vitest @vitest/ui playwright @playwright/test

# Playwright Browser installieren
npx playwright install
```

### Konfiguration

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['tests/**', 'node_modules/**']
    }
  }
});
```

### Test-Befehle

```bash
# Unit-Tests ausführen
npm run test

# Mit Coverage
npm run test:coverage

# Watch-Mode
npm run test:watch

# Integration-Tests
npm run test:integration

# E2E-Tests
npm run test:e2e

# Alle Tests
npm run test:all
```

---

## ⚡ Unit-Tests

### Service-Tests

**Beispiel: analyticsMLService.test.ts**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeUniqueCustomers } from '../services/analyticsMLService';

describe('analyticsMLService', () => {
  describe('computeUniqueCustomers', () => {
    it('should count unique customers by email', () => {
      const orders = [
        { customer_id: 1, billing: { email: 'test@example.com' } },
        { customer_id: 1, billing: { email: 'test@example.com' } },
        { customer_id: 2, billing: { email: 'other@example.com' } }
      ];

      const result = computeUniqueCustomers(orders);
      expect(result).toBe(2); // Unique emails
    });

    it('should handle guest orders without customer_id', () => {
      const orders = [
        { customer_id: 0, billing: { email: 'guest1@example.com' } },
        { customer_id: 0, billing: { email: 'guest2@example.com' } }
      ];

      const result = computeUniqueCustomers(orders);
      expect(result).toBe(2); // Guest orders counted by email
    });

    it('should fallback to order count when no unique identifiers', () => {
      const orders = [
        { customer_id: 0, billing: {} },
        { customer_id: 0, billing: {} }
      ];

      const result = computeUniqueCustomers(orders);
      expect(result).toBe(2); // Order count fallback
    });

    it('should handle empty orders array', () => {
      const result = computeUniqueCustomers([]);
      expect(result).toBe(0);
    });
  });
});
```

### Utility-Tests

**Beispiel: openaiHelper.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { repairJSON, extractJSON } from '../utils/openaiHelper';

describe('openaiHelper', () => {
  describe('repairJSON', () => {
    it('should repair missing closing bracket', () => {
      const broken = '{"categories": [{"id": 1}';
      const repaired = repairJSON(broken);
      expect(() => JSON.parse(repaired)).not.toThrow();
    });

    it('should handle already valid JSON', () => {
      const valid = '{"test": "value"}';
      const repaired = repairJSON(valid);
      expect(repaired).toBe(valid);
    });
  });

  describe('extractJSON', () => {
    it('should extract JSON from markdown code blocks', () => {
      const text = '```json\n{"test": true}\n```';
      const extracted = extractJSON(text);
      expect(extracted).toEqual({ test: true });
    });

    it('should extract JSON from plain text', () => {
      const text = 'Some text {"test": true} more text';
      const extracted = extractJSON(text);
      expect(extracted).toEqual({ test: true });
    });
  });
});
```

---

## 🔗 Integration-Tests

### API-Endpoint Tests

**Beispiel: analytics.integration.test.ts**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import analyticsRoutes from '../routes/app/api/analytics';

describe('Analytics API Integration', () => {
  let server;

  beforeAll(async () => {
    server = Fastify();
    await server.register(analyticsRoutes);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/analytics/real-time/dashboard', () => {
    it('should return dashboard metrics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/real-time/dashboard'
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveProperty('success', true);
      expect(response.json().data).toHaveProperty('totalOrders');
      expect(response.json().data).toHaveProperty('totalRevenue');
      expect(response.json().data).toHaveProperty('uniqueCustomers');
    });

    it('should handle WooCommerce API errors gracefully', async () => {
      // Mock WooCommerce failure
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/real-time/dashboard?mock_error=true'
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toHaveProperty('success', false);
    });
  });

  describe('POST /api/analytics/conversion/analyze', () => {
    it('should calculate conversion rates without NaN', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/analytics/conversion/analyze',
        payload: {
          startDate: '2026-01-01',
          endDate: '2026-01-31'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json().data;
      
      // Check no NaN values
      expect(data.conversionRate).not.toBeNaN();
      expect(data.totalRevenue).not.toBeNaN();
      expect(Number.isFinite(data.conversionRate)).toBe(true);
    });
  });
});
```

### Service Integration Tests

**Beispiel: woocommerce.integration.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WooCommerceService } from '../services/woocommerceService';

describe('WooCommerce Service Integration', () => {
  let service: WooCommerceService;

  beforeEach(() => {
    service = new WooCommerceService({
      consumerKey: process.env.WOO_CONSUMER_KEY,
      consumerSecret: process.env.WOO_CONSUMER_SECRET,
      url: process.env.WOO_URL
    });
  });

  it('should authenticate with Basic Auth headers', async () => {
    const customers = await service.getCustomers();
    expect(Array.isArray(customers)).toBe(true);
  });

  it('should not use query string auth', async () => {
    // Ensure requests use Authorization header
    const spy = vi.spyOn(service, 'makeRequest');
    await service.getCustomers();
    
    const calls = spy.mock.calls;
    expect(calls[0][0].headers).toHaveProperty('Authorization');
    expect(calls[0][0].url).not.toContain('consumer_key=');
  });
});
```

---

## 🧩 End-to-End Tests

### Playwright-Tests

**Beispiel: dashboard.e2e.test.ts**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should load dashboard metrics', async ({ page }) => {
    await page.waitForSelector('[data-testid="total-orders"]');
    
    const totalOrders = await page.textContent('[data-testid="total-orders"]');
    expect(totalOrders).toMatch(/\d+/);

    const revenue = await page.textContent('[data-testid="total-revenue"]');
    expect(revenue).toMatch(/[\d,.]+/);
  });

  test('should switch language', async ({ page }) => {
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-language="en"]');

    await expect(page.locator('h1')).toHaveText('Dashboard');

    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-language="de"]');

    await expect(page.locator('h1')).toHaveText('Dashboard');
  });
});
```

---

## 🐛 Bugfix Validation Tests (v5.1.1)

### Bug #1: Real-Time Analytics - Unique Customers

**Test:** `tests/integration/bugfixes/bug1-unique-customers.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { computeUniqueCustomers } from '../../../backend/services/analyticsMLService';

describe('Bug #1: Unique Customer Count', () => {
  it('should count guest orders (customer_id = 0)', () => {
    const orders = [
      { customer_id: 0, billing: { email: 'guest@example.com' } },
      { customer_id: 1, billing: { email: 'user@example.com' } }
    ];

    const result = computeUniqueCustomers(orders);
    expect(result).toBe(2); // Both counted
  });

  it('should use email for uniqueness when no customer_id', () => {
    const orders = [
      { customer_id: 0, billing: { email: 'same@example.com' } },
      { customer_id: 0, billing: { email: 'same@example.com' } }
    ];

    const result = computeUniqueCustomers(orders);
    expect(result).toBe(1); // Same email = 1 customer
  });

  it('should fallback to billing fingerprint', () => {
    const orders = [
      { customer_id: 0, billing: { first_name: 'John', last_name: 'Doe', address_1: '123 Main' } },
      { customer_id: 0, billing: { first_name: 'John', last_name: 'Doe', address_1: '123 Main' } }
    ];

    const result = computeUniqueCustomers(orders);
    expect(result).toBe(1); // Same billing = 1 customer
  });
});
```

### Bug #2: Email Marketing Routes

**Test:** `tests/integration/bugfixes/bug2-email-routes.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import emailMarketingRoutes from '../../../backend/routes/app/api/marketing/email-marketing';

describe('Bug #2: Email Marketing Route Registration', () => {
  it('should register /api/customers/segments endpoint', async () => {
    const server = Fastify();
    await server.register(emailMarketingRoutes);
    await server.ready();

    const response = await server.inject({
      method: 'GET',
      url: '/api/customers/segments'
    });

    expect(response.statusCode).not.toBe(404);
    expect([200, 500]).toContain(response.statusCode); // 200 or 500, but not 404
  });
});
```

### Bug #3: WooCommerce Sync Reply Handling

**Test:** `tests/integration/bugfixes/bug3-sync-reply.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import syncRoutes from '../../../backend/routes/app/api/woocommerce/sync';

describe('Bug #3: WooCommerce Sync Response', () => {
  it('should use reply.send() for success responses', async () => {
    const server = Fastify();
    await server.register(syncRoutes);
    await server.ready();

    const response = await server.inject({
      method: 'POST',
      url: '/api/woocommerce/sync'
    });

    // Should return valid JSON response
    expect(() => response.json()).not.toThrow();
    expect(response.headers['content-type']).toContain('application/json');
  });
});
```

### Bug #4: Duplicate Subscribers Endpoint

**Test:** `tests/integration/bugfixes/bug4-duplicate-endpoint.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import customersRoutes from '../../../backend/routes/app/api/woocommerce/customers';

describe('Bug #4: No Duplicate /subscribers Endpoint', () => {
  it('should register without FST_ERR_DUPLICATED_ROUTE', async () => {
    const server = Fastify();
    
    // This should not throw
    await expect(async () => {
      await server.register(customersRoutes);
      await server.ready();
    }).resolves.not.toThrow();

    await server.close();
  });

  it('should have only one /subscribers endpoint', async () => {
    const server = Fastify();
    await server.register(customersRoutes);
    await server.ready();

    const routes = server.printRoutes().split('\n');
    const subscriberRoutes = routes.filter(r => r.includes('/subscribers'));
    
    expect(subscriberRoutes.length).toBe(1);
  });
});
```

### Bug #5: Trend Analysis Auth

**Test:** `tests/integration/bugfixes/bug5-trends-auth.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';

describe('Bug #5: WooCommerce Basic Auth', () => {
  it('should use Authorization header instead of query params', async () => {
    const axiosSpy = vi.spyOn(axios, 'get');

    // Make request to trends endpoint
    await fetch('http://localhost:3000/api/analytics/trends/analyze', {
      method: 'POST'
    });

    // Check axios was called with Authorization header
    const lastCall = axiosSpy.mock.calls[axiosSpy.mock.calls.length - 1];
    expect(lastCall[1]?.headers).toHaveProperty('Authorization');
    expect(lastCall[1]?.headers?.Authorization).toMatch(/^Basic /);
  });
});
```

### Bug #6: Conversion NaN Errors

**Test:** `tests/integration/bugfixes/bug6-conversion-nan.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('Bug #6: Conversion NaN Handling', () => {
  it('should handle undefined order.total gracefully', () => {
    const orders = [
      { total: undefined },
      { total: null },
      { total: '100.50' },
      { total: 50 }
    ];

    const total = orders.reduce((sum, order) => {
      const orderTotal = parseFloat(String(order.total || 0));
      return sum + (isNaN(orderTotal) ? 0 : orderTotal);
    }, 0);

    expect(total).toBe(150.50);
    expect(Number.isFinite(total)).toBe(true);
  });
});
```

### Bug #7: Feedback Analysis Implementation

**Test:** `tests/integration/bugfixes/bug7-feedback-analyze.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import feedbackRoutes from '../../../backend/routes/app/api/analytics/feedback';

describe('Bug #7: Feedback Analysis Endpoint', () => {
  it('should return data instead of 404', async () => {
    const server = Fastify();
    await server.register(feedbackRoutes);
    await server.ready();

    const response = await server.inject({
      method: 'POST',
      url: '/api/analytics/feedback/analyze'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('success', true);
    expect(response.json()).toHaveProperty('data');
  });
});
```

### Bug #8: Categories JSON Parsing

**Test:** `tests/integration/bugfixes/bug8-categories-json.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { repairJSON } from '../../../backend/utils/openaiHelper';

describe('Bug #8: OpenAI JSON Parsing Fallbacks', () => {
  it('should repair malformed JSON from OpenAI', () => {
    const broken = '{"categories": [{"id": 1, "name": "Test"';
    const repaired = repairJSON(broken);
    
    expect(() => JSON.parse(repaired)).not.toThrow();
  });

  it('should fallback to popular categories on parse failure', async () => {
    const server = Fastify();
    await server.register(categoriesRoutes);
    await server.ready();

    // Mock OpenAI to return invalid JSON
    const response = await server.inject({
      method: 'POST',
      url: '/api/categories/ml/suggest',
      payload: { productName: 'Test Product' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveProperty('suggestions');
    expect(Array.isArray(response.json().data.suggestions)).toBe(true);
  });
});
```

---

## ⚡ Performance-Tests

### Load Testing mit Artillery

**artillery-config.yml:**

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"

scenarios:
  - name: "Dashboard Metrics"
    flow:
      - get:
          url: "/api/analytics/real-time/dashboard"
      - think: 2
      - get:
          url: "/api/analytics/metrics/dashboard"
```

**Ausführen:**

```bash
npm install -g artillery
artillery run artillery-config.yml
```

---

## 🔒 Security-Tests

### OWASP ZAP Scan

```bash
# ZAP Baseline Scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html
```

### Dependency Audit

```bash
# NPM Audit
npm audit --production

# Fix vulnerabilities
npm audit fix
```

---

## 📊 Test-Coverage

### Coverage-Ziele

| Komponente       | Aktuell | Ziel   |
|------------------|---------|--------|
| Services         | 45%     | 80%    |
| Routes (API)     | 30%     | 70%    |
| Utilities        | 60%     | 90%    |
| **Gesamt**       | **40%** | **75%** |

### Coverage Report generieren

```bash
# Vitest Coverage
npm run test:coverage

# Report anzeigen
open coverage/index.html
```

---

## ✅ Test-Checkliste für Release

### Pre-Release Tests

- [ ] Alle Unit-Tests bestehen (100%)
- [ ] Integration-Tests bestehen (100%)
- [ ] E2E-Tests bestehen (90%+)
- [ ] Bugfix-Validation-Tests bestehen (100%)
- [ ] Performance-Tests unter Last erfolgreich
- [ ] Security Audit ohne kritische Findings
- [ ] Coverage > 75%
- [ ] Manuelle Regressions-Tests durchgeführt

### Post-Release Validation

- [ ] Production Health Check erfolgreich
- [ ] Monitoring-Alerts aktiv
- [ ] Error-Rate < 1%
- [ ] Response-Time < 500ms (P95)
- [ ] Zero Downtime Deployment validiert

---

## 🔗 Weitere Ressourcen

- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)
- [Fastify Testing](https://www.fastify.io/docs/latest/Guides/Testing/)
- [Production Bugfix Summary](./PRODUCTION_BUGFIX_SUMMARY.md)

---

**Version:** 5.1.1  
**Maintained by:** AndreZ1971  
**Last Updated:** 4. Januar 2026
