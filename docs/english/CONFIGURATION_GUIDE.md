# Configuration Guide

## � Authentication & Data Access

### Current Implementation (7.5.0)

**Authentication:**
- Temporary in-memory authentication via ENV variables
- Configuration via `ADMIN_USER` and `ADMIN_PASS` / `ADMIN_PASS_HASH`
- Planned: Automattic integration for production environment

**Data Access:**
- **WooCommerce:** Direct via REST API (connection.json)
- **Customers:** From WooCommerce `customers` endpoint
- **Orders:** From WooCommerce `orders` endpoint
- **Support Tickets:** Awesome Support Plugin with HTML sanitization
- **No Mock Data:** All routes use real API calls

### connection.json Configuration

```json
{
  "openAI": {
    "apiKey": "sk-...",
    "model": "gpt-4o-mini"
  },
  "woocommerce": {
    "url": "https://yourshop.com",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_..."
  },
  "wordpress": {
    "url": "https://yourshop.com",
    "username": "admin",
    "appPassword": "xxxx xxxx xxxx xxxx"
  }
}
```

## �🔧 Dynamic Shop URLs

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

## 🔑 OAuth & API Authentication

### YouTube OAuth Setup (NEW in v6.4)

YouTube video uploads require OAuth 2.0 authentication. Configuration is done via `connection.json`:

**1. Google Cloud Console Setup:**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project
- Enable "YouTube Data API v3"
- Create OAuth 2.0 Credentials (Desktop Application)
- Copy `Client ID`, `Client Secret`, and `Redirect URI`

**2. Configure connection.json:**
```json
{
  "youtube": {
    "enabled": true,
    "clientId": "your-client-id.apps.googleusercontent.com",
    "clientSecret": "your-client-secret",
    "redirectUri": "http://localhost:3000",
    "accessToken": "",
    "refreshToken": "",
    "channelId": ""
  }
}
```

**3. Redirect URI is important:**
- Local development: `http://localhost:3000`
- Production: `https://your-domain.com`
- **Important**: Redirect URI MUST be without `/api/auth/youtube/callback` (backend appends it automatically)

**4. Authorization in UI:**
- Open Settings → Social Media Connections → YouTube
- Click "Connect to YouTube"
- Sign in with your Google Account
- Approve permissions
- Tokens are automatically saved to `connection.json`

**5. Verify tokens:**
After successful authentication, these fields should be populated:
- `accessToken` - Used for uploads
- `refreshToken` - Used to renew access token
- `channelId` - Your YouTube channel

### Reddit OAuth Setup

Reddit data for customer opinions requires OAuth:

```json
{
  "reddit": {
    "enabled": true,
    "clientId": "your-reddit-client-id",
    "clientSecret": "your-reddit-secret",
    "username": "your-reddit-username",
    "password": "your-reddit-password"
  }
}
```

**Token Rotation:**
- Reddit tokens are automatically renewed
- No manual renewal needed
- If error: Re-authenticate connection

### Best Practices for OAuth

| ✅ Correct | ❌ Wrong |
|-----------|---------|
| Secrets in `connection.json` (not in Git) | Secrets in `.ts` files |
| `connection.json` in .gitignore | Secrets in hardcoded env vars |
| Auto-refresh tokens | Manual token refresh |
| Redirect URI = base URL | Redirect URI with `/callback` appended |

### OAuth Error Handling

**401 Unauthorized:**
```
Solution: Token expired or user needs to re-authenticate
```

**Redirect URI Mismatch:**
```
Error: "redirect_uri_mismatch"
Solution: Check that Redirect URI in Google Console EXACTLY matches connection.json
```

---

## See also

- [README.md](../../README_EN.md) - Project overview
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution Guidelines
- [backend/config.ts](../../backend/config.ts) - Configuration logic
