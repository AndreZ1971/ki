# Configuration Guide

## 🔧 Dynamic Shop URLs

The system is completely configurable and uses **no hardcoded shop URLs**. This enables the container to be deployed for any number of shops.

### Where are URLs configured?

Shop URLs are defined in `connection.json`:

```json
{
  "wordpress": {
    "url": "https://myshop.com"
  },
  "woocommerce": {
    "url": "https://myshop.com"
  }
}
```

### How does the system work?

1. **During Onboarding**: User enters their shop URL
2. **Storage**: URL is saved in `connection.json`
3. **Usage**: All services read the URL from there

```
┌─────────────────────┐
│   Onboarding UI     │
│  (Settings.tsx)     │
└──────────┬──────────┘
           │ User enters URL
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

### Which services use the dynamic URL?

- ✅ **WooCommerce Client** (`backend/woocommerce/client.ts`)
- ✅ **Agent Tools** (`backend/tools/woo.ts`)
- ✅ **API Routes** (`backend/routes/...`)
- ✅ **Services** (`backend/services/...`)
- ✅ **Tests** (with `TEST_SHOP_URL` env var)

### Avoid Hardcoded URLs

**Wrong ❌ (DO NOT DO THIS):**
```typescript
const wooUrl = "https://myshop.example.com/wp-json/wc/v3/products";
```

**Correct ✅ (THIS IS HOW WE DO IT):**
```typescript
import { getWooConfig } from './config.js';
const config = getWooConfig();
const wooUrl = `${config.url}/wp-json/wc/v3/products`;
```

### Testing with Different Shop URLs

Tests can be configured via environment variables:

```bash
# Test with default shop
npm test

# Test with specific shop
TEST_SHOP_URL=https://my-test-shop.com npm test
```

Example in test file:
```typescript
const TEST_SHOP_URL = process.env.TEST_SHOP_URL || 'https://test.example.com';
process.env.WOOCOMMERCE_URL = TEST_SHOP_URL;
```

### Swagger/API Tests

Swagger test files should use placeholders:

```json
{
  "fileUrl": "https://{{SHOP_URL}}/downloads/starter-guide.pdf"
}
```

These are replaced with the actual shop URL at runtime.

### Docker Deployment

When containerizing:

```dockerfile
# connection.json is mounted as volume
# OR injected as environment variables
```

**Example docker-compose.yml:**
```yaml
services:
  app:
    environment:
      - WOOCOMMERCE_URL=https://your-shop.com
      - WORDPRESS_URL=https://your-shop.com
    volumes:
      - ./connection.json:/app/connection.json:ro
```

### Best Practices

| ✅ Correct | ❌ Wrong |
|-----------|---------|
| URL from `connection.json` | Hardcoded in code |
| URL from config file | URL as string constant |
| Env variable for tests | Test fixture URL |
| `${config.url}/...` | `https://myshop.com/...` |

### Error Handling

If URL is not configured:

```typescript
if (!config.woocommerce?.url) {
  throw new Error('WooCommerce URL missing in connection.json');
}
```

### Migrating to Different Shops

**Before (hardcoded):**
- Change shop = Change code = Deploy required

**After (configurable):**
1. Edit `connection.json`
2. Shop switched immediately
3. No code changes, no deployment needed

---

## See also

- [README.md](../../README_EN.md) - Project overview
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution Guidelines
- [backend/config.ts](../../backend/config.ts) - Configuration logic
