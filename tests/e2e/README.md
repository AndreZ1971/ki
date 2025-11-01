# E2E Tests mit Playwright

## Überblick

Die E2E-Tests verwenden [Playwright](https://playwright.dev/) um kritische User Flows zu testen. Tests werden auf mehreren Browsern ausgeführt (Chromium, Firefox, WebKit) und auf Desktop- und Mobile-Viewports.

## Test-Struktur

```
tests/e2e/
├── pages/              # Page Object Pattern
│   ├── BasePage.ts     # Base class für alle Pages
│   ├── LoginPage.ts    # Login/Auth Page
│   └── DashboardPage.ts # Dashboard Page
├── auth/               # Authentication Tests
│   └── login.spec.ts   # Login/Logout Tests
└── ...                 # Weitere Test-Suites
```

## Page Object Pattern

Wir verwenden das **Page Object Pattern** um Tests wartbar und wiederverwendbar zu machen:

- **BasePage**: Gemeinsame Funktionalität (Navigation, Warten, Klicken, etc.)
- **Spezifische Pages**: Erben von BasePage und definieren page-spezifische Locators und Methoden

### Beispiel: LoginPage

```typescript
const loginPage = new LoginPage(page);
await loginPage.navigate();
await loginPage.login('user@example.com', 'password');
await loginPage.waitForLoginSuccess();
```

## Tests ausführen

### Alle Tests (headless)
```bash
npm run test:e2e
```

### Tests mit UI (interaktiv)
```bash
npm run test:e2e:ui
```

### Tests mit sichtbarem Browser
```bash
npm run test:e2e:headed
```

### Debug-Modus (Step-by-Step)
```bash
npm run test:e2e:debug
```

### Test-Report anzeigen
```bash
npm run test:e2e:report
```

### Spezifische Tests ausführen
```bash
# Nur Login-Tests
npx playwright test auth/login

# Nur auf Chrome
npx playwright test --project=chromium

# Nur auf Mobile
npx playwright test --project="Mobile Chrome"
```

## Test-Konfiguration

Die Konfiguration befindet sich in `playwright.config.ts`:

- **baseURL**: `http://localhost:5173` (Vite Dev Server)
- **Timeout**: 10 Sekunden für Actions
- **Retries**: 2 auf CI, 0 lokal
- **Screenshots**: Bei Fehlern
- **Videos**: Bei Fehlern behalten
- **Traces**: Bei Retry

### Browser-Projekte

Tests werden auf folgenden Projekten ausgeführt:

1. **Desktop**:
   - Chromium (Desktop Chrome)
   - Firefox (Desktop Firefox)
   - WebKit (Desktop Safari)

2. **Mobile**:
   - Mobile Chrome (Pixel 5)
   - Mobile Safari (iPhone 12)

## Test-Development

### Neuen Test erstellen

1. **Page Object erstellen** (falls noch nicht vorhanden):
```typescript
// tests/e2e/pages/ProductPage.ts
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  readonly createButton = this.page.locator('[data-testid="create-product"]');
  
  async createProduct(name: string) {
    await this.clickElement(this.createButton);
    // ...
  }
}
```

2. **Test erstellen**:
```typescript
// tests/e2e/products/create.spec.ts
import { test, expect } from '@playwright/test';
import { ProductPage } from '../pages/ProductPage';

test.describe('Product Creation', () => {
  test('should create new product', async ({ page }) => {
    const productPage = new ProductPage(page);
    await productPage.navigate();
    await productPage.createProduct('Test Product');
    // ...
  });
});
```

### Best Practices

1. **Verwende Page Objects**: Kapsle Page-Logik in Page Object Classes
2. **Verwende data-testid**: Für stabile Selektoren
3. **Verwende waitFor**: Warte auf Elemente bevor du interagierst
4. **Verwende expect**: Playwright's eingebaute Assertions
5. **Isoliere Tests**: Jeder Test sollte unabhängig sein
6. **Cleanup**: beforeEach/afterEach für Test-Setup und Cleanup

### Locator-Strategien (Priorität)

1. `data-testid` Attribute: `page.locator('[data-testid="login-button"]')`
2. Aria-Roles: `page.locator('button[aria-label="Submit"]')`
3. Text-Content: `page.locator('button:has-text("Login")')`
4. CSS-Selektoren: `page.locator('button.primary')`

## Debugging

### Mit Playwright Inspector
```bash
npm run test:e2e:debug
```

### Mit Browser DevTools
```bash
npx playwright test --headed --debug
```

### Screenshots bei Fehlern
Screenshots werden automatisch bei Fehlern erstellt und in `test-results/` gespeichert.

### Trace Viewer
Nach einem fehlgeschlagenen Test mit Retry:
```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

Auf CI werden Tests automatisch mit folgenden Einstellungen ausgeführt:

- **workers**: 1 (Sequential)
- **retries**: 2
- **forbidOnly**: true (Keine .only Tests)
- **webServer**: Automatischer Start des Dev-Servers

### GitHub Actions Beispiel
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Aktuelle Test-Coverage

### ✅ Implementiert

1. **Authentication Flow** (`auth/login.spec.ts`):
   - Login mit validen Credentials
   - Login mit invaliden Credentials
   - Logout
   - Session Persistence
   - "Remember Me" Funktionalität
   - Password Visibility Toggle
   - Protected Routes
   - Email Validation

### 📋 Geplant

1. **Product Management**:
   - Product Creation Flow
   - Product Editing
   - Product Publishing
   - Product Search/Filter

2. **Analytics Dashboard**:
   - Dashboard Loading
   - Metrics Display
   - Chart Interactions
   - Date Range Selection

3. **Email Marketing**:
   - Email Generation
   - Email Preview
   - Email Sending
   - Customer Selection

## Troubleshooting

### Port bereits belegt
Wenn der Dev-Server nicht starten kann:
```bash
# Finde den Prozess auf Port 5173
netstat -ano | findstr :5173
# Beende den Prozess
taskkill /PID <PID> /F
```

### Browser-Installation fehlgeschlagen
```bash
npx playwright install --with-deps
```

### Tests timeout
Erhöhe den Timeout in `playwright.config.ts`:
```typescript
use: {
  actionTimeout: 20000, // 20 Sekunden
}
```

## Resources

- [Playwright Dokumentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Page Object Model](https://playwright.dev/docs/pom)
