# Konfigurationsguide

## 🔧 Dynamische Shop-URLs

Das System ist vollständig konfigurierbar und verwendet **keine hardcodierten Shop-URLs**. Dies ermöglicht es, den Container für beliebig viele Shops einzusetzen.

### Wo werden URLs konfiguriert?

Die Shop-URLs werden in der `connection.json` definiert:

```json
{
  "wordpress": {
    "url": "https://meinshop.de"
  },
  "woocommerce": {
    "url": "https://meinshop.de"
  }
}
```

### Wie funktioniert das System?

1. **Beim Onboarding**: Der Nutzer gibt seine Shop-URL ein
2. **Speicherung**: Die URL wird in `connection.json` gespeichert
3. **Nutzung**: Alle Services lesen die URL von dort aus

```
┌─────────────────────┐
│   Onboarding UI     │
│  (Settings.tsx)     │
└──────────┬──────────┘
           │ Nutzer trägt URL ein
           ▼
┌─────────────────────┐
│  connection.json    │  ← Single Source of Truth
│  (WordPress URL)    │
│  (WooCommerce URL)  │
└──────────┬──────────┘
           │
      ┌────┼────┬──────────┬─────────┐
      ▼    ▼    ▼          ▼         ▼
    Agent Tools Routes  Services  Tests
    (config.ts)
```

### Welche Services verwenden die dynamische URL?

- ✅ **WooCommerce Client** (`backend/woocommerce/client.ts`)
- ✅ **Agent Tools** (`backend/tools/woo.ts`)
- ✅ **API Routes** (`backend/routes/...`)
- ✅ **Services** (`backend/services/...`)
- ✅ **Tests** (mit `TEST_SHOP_URL` env var)

### Hardcodierte URLs vermeiden

**Richtig ❌ (DO NOT DO THIS):**
```typescript
const wooUrl = "https://kaufe-es.eu/wp-json/wc/v3/products";
```

**Richtig ✅ (SO MACHEN WIR ES):**
```typescript
import { getWooConfig } from './config.js';
const config = getWooConfig();
const wooUrl = `${config.url}/wp-json/wc/v3/products`;
```

### Tests mit unterschiedlichen Shop-URLs

Tests können über Environment-Variablen konfiguriert werden:

```bash
# Test mit Standard-Shop
npm test

# Test mit spezifischem Shop
TEST_SHOP_URL=https://mein-test-shop.de npm test
```

Beispiel in Test-Datei:
```typescript
const TEST_SHOP_URL = process.env.TEST_SHOP_URL || 'https://test.example.com';
process.env.WOOCOMMERCE_URL = TEST_SHOP_URL;
```

### Swagger/API Tests

Swagger-Test-Dateien sollten Platzhalter verwenden:

```json
{
  "fileUrl": "https://{{SHOP_URL}}/downloads/starter-guide.pdf"
}
```

Diese werden zur Laufzeit durch die echte Shop-URL ersetzt.

### Deployment mit Docker

Beim Containerisierung:

```dockerfile
# connection.json wird als Volume gemountet
# ODER als Umgebungsvariablen injiziert
```

**Beispiel docker-compose.yml:**
```yaml
services:
  app:
    environment:
      - WOOCOMMERCE_URL=https://dein-shop.de
      - WORDPRESS_URL=https://dein-shop.de
    volumes:
      - ./connection.json:/app/connection.json:ro
```

### Best Practices

| ✅ Richtig | ❌ Falsch |
|-----------|---------|
| URL aus `connection.json` | Hardcodiert in Code |
| URL aus Config-Datei | URL als String-Konstante |
| Env-Variable für Tests | Test-Fixture-URL |
| `${config.url}/...` | `https://kaufe-es.eu/...` |

### Fehlerbehandlung

Falls URL nicht konfiguriert:

```typescript
if (!config.woocommerce?.url) {
  throw new Error('WooCommerce URL fehlt in connection.json');
}
```

### Migration zu anderen Shops

**Vorher (hardcodiert):**
- Shop ändern = Code ändern = Deploy nötig

**Nachher (konfigurierbar):**
1. `connection.json` editieren
2. Shop sofort gewechselt
3. Kein Code-Change, kein Deploy nötig

---

## Siehe auch

- [README.md](../../README.md) - Projektübersicht
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution Guidelines
- [backend/config.ts](../../backend/config.ts) - Konfigurationslogik
