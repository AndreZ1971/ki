# Konfigurationsguide

## � Authentifizierung & Datenzugriff

### Aktuelle Implementierung (v7.0.5)

**Authentifizierung:**
- Temporäre In-Memory-Authentifizierung via ENV-Variablen
- Konfiguration über `ADMIN_USER` und `ADMIN_PASS` / `ADMIN_PASS_HASH`
- Geplant: Automattic-Integration für Produktivumgebung

**Datenzugriff:**
- **WooCommerce:** Direkt über REST API (connection.json)
- **Kunden:** Von WooCommerce `customers` Endpoint
- **Bestellungen:** Von WooCommerce `orders` Endpoint
- **Support-Tickets:** Awesome Support Plugin mit HTML-Bereinigung
- **Keine Mock-Daten:** Alle Routen nutzen echte API-Calls

### connection.json Konfiguration

```json
{
  "openAI": {
    "apiKey": "sk-...",
    "model": "gpt-4o-mini"
  },
  "woocommerce": {
    "url": "https://deinshop.de",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_..."
  },
  "wordpress": {
    "url": "https://deinshop.de",
    "username": "admin",
    "appPassword": "xxxx xxxx xxxx xxxx"
  }
}
```

## �🔧 Dynamische Shop-URLs

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
const wooUrl = "https://example.com/wp-json/wc/v3/products";
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
| `${config.url}/...` | `https://example.com/...` |

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

## 🔑 OAuth & API Authentifizierung

### YouTube OAuth Setup (NEU in v6.4)

YouTube Video Upload benötigt OAuth 2.0 Authentifizierung. Die Konfiguration erfolgt über `connection.json`:

**1. Google Cloud Console Setup:**
- Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
- Erstelle ein neues Projekt
- Aktiviere "YouTube Data API v3"
- Erstelle OAuth 2.0 Credentials (Desktop Application)
- Kopiere `Client ID`, `Client Secret` und `Redirect URI`

**2. connection.json konfigurieren:**
```json
{
  "youtube": {
    "enabled": true,
    "clientId": "dein-client-id.apps.googleusercontent.com",
    "clientSecret": "dein-client-secret",
    "redirectUri": "http://localhost:3000",
    "accessToken": "",
    "refreshToken": "",
    "channelId": ""
  }
}
```

**3. Redirect URI wichtig:**
- Lokale Entwicklung: `http://localhost:3000`
- Production: `https://deine-domain.com`
- **Wichtig**: Redirect URI MUSS ohne `/api/auth/youtube/callback` sein (Backend hängt das automatisch an)

**4. Autorisierung im UI:**
- Öffne Settings → Social Media Connections → YouTube
- Klicke "Mit YouTube verbinden"
- Melde dich mit Google-Account an
- Bestätige Berechtigungen
- Tokens werden automatisch in `connection.json` gespeichert

**5. Tokens prüfen:**
Nach erfolgreicher Authentifizierung sollten diese Felder gefüllt sein:
- `accessToken` - Zum Upload verwenden
- `refreshToken` - Zum erneuern des Access Tokens
- `channelId` - Dein YouTube Channel

### Reddit OAuth Setup

Reddit-Daten für Kundenmeinungen benötigen OAuth:

```json
{
  "reddit": {
    "enabled": true,
    "clientId": "dein-reddit-client-id",
    "clientSecret": "dein-reddit-secret",
    "username": "dein-reddit-username",
    "password": "dein-reddit-password"
  }
}
```

**Tokens-Rotation:**
- Reddit Tokens werden automatisch erneuert
- Kein manuelles Erneuern nötig
- Falls Fehler: Connection neu authentifizieren

### Best Practices für OAuth

| ✅ Richtig | ❌ Falsch |
|-----------|---------|
| Secrets in `connection.json` (nicht in Git) | Secrets in `.ts` Dateien |
| `connection.json` .gitignore | Secrets in Environment-Variablen hardcoden |
| Tokens automatisch erneuern | Manuelles Token-Refresh |
| Redirect URI = Base URL | Redirect URI mit `/callback` appended |

### Fehlerbehandlung OAuth

**401 Unauthorized:**
```
Lösung: Token erneuert oder User muss neu authentifizieren
```

**Redirect URI Mismatch:**
```
Fehler: "redirect_uri_mismatch"
Lösung: Prüfe dass Redirect URI in Google Console EXAKT mit connection.json matched
```

---

## Siehe auch

- [README.md](../../README.md) - Projektübersicht
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution Guidelines
- [backend/config.ts](../../backend/config.ts) - Konfigurationslogik
