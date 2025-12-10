# 🎯 Content Monetization API - Technische Dokumentation

**Version:** 3.2.0

Technische Dokumentation für die neuen Content Monetization Endpoints und Features.

---

## 📋 Übersicht

Das Content Monetization System bietet eine vollständige API für:
- Intelligente Preisempfehlungen
- KI-gestützte Text-Generierung
- Revenue-Prognosen
- Digitale Produkt-Verwaltung

---

## 🔌 API-Endpoints

### 1. Price Recommendation

**Endpoint:** `GET /api/marketing/content/price-recommendation`

**Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|------------|
| `contentType` | string | ✅ | Produkttyp (digital, course, template, subscription, etc.) |
| `strategy` | string | ✅ | Monetarisierungsstrategie (one-time, subscription, freemium, tiered) |
| `basePrice` | number | ✅ | Basispreis als Referenz |

**Beispiel:**
```bash
curl "http://localhost:3000/api/marketing/content/price-recommendation?contentType=course&strategy=one-time&basePrice=49"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recommendedPrice": 149,
    "range": {
      "min": 129,
      "max": 199
    },
    "reasoning": "Online-Kurse sollten in Premium-Segment positioniert werden mit 3x Multiplikator für Quality-Content"
  }
}
```

**Fehlerfall (400):**
```json
{
  "success": false,
  "error": "Missing required parameters: contentType, strategy, basePrice"
}
```

**Preis-Logik:**
| Typ | Strategie | Multiplikator | Beispiel |
|-----|-----------|---------------|---------|
| course | one-time | 3.0x | €49 → €147 |
| template | one-time | 1.2x | €49 → €59 |
| digital | subscription | 0.7x/month | €49 → €34/month |
| subscription | freemium | 1.5x | €49 → €74 |

---

### 2. Generate Copy

**Endpoint:** `POST /api/marketing/content/generate-copy`

**Body:**
```json
{
  "contentTitle": "Python für Anfänger Kurs",
  "contentType": "course",
  "monetizationStrategy": "one-time",
  "pricing": 149
}
```

**Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|------------|
| `contentTitle` | string | ✅ | Titel des Produkts/Contents |
| `contentType` | string | ⭕ | Produkttyp (für bessere Anpassung) |
| `monetizationStrategy` | string | ⭕ | Strategie (für bessere Anpassung) |
| `pricing` | number | ⭕ | Preis (für bessere Anpassung) |

**Beispiel:**
```bash
curl -X POST "http://localhost:3000/api/marketing/content/generate-copy" \
  -H "Content-Type: application/json" \
  -d '{
    "contentTitle": "Python für Anfänger Kurs",
    "contentType": "course",
    "monetizationStrategy": "one-time",
    "pricing": 149
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "headline": "Python für Anfänger: Der komplette Schritt-für-Schritt Kurs",
    "body": "Lerne Python von Grund auf mit 50+ praktischen Übungen. Perfekt für Einsteiger – kein Vorwissen erforderlich. Zugang auf Lebenszeit plus regelmäßige Updates.",
    "cta": "Jetzt Kurs kaufen - Nur €149"
  }
}
```

**Fallback Response (falls OpenAI nicht verfügbar):**
```json
{
  "success": true,
  "data": {
    "headline": "Python für Anfänger Kurs",
    "body": "Premium-Inhalt für dein Geschäft. Erstellt mit professioneller Qualität.",
    "cta": "Jetzt kaufen"
  }
}
```

**Fehlerfall (400):**
```json
{
  "success": false,
  "error": "contentTitle is required"
}
```

---

### 3. Revenue Forecast

**Endpoint:** `GET /api/marketing/content/revenue-forecast`

**Parameter:** Keine erforderlich

**Beispiel:**
```bash
curl "http://localhost:3000/api/marketing/content/revenue-forecast"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "avgDay": 15.5,
    "forecastWeek": 108.5,
    "forecastMonth": 465,
    "periodAnalyzed": "last_7_days"
  }
}
```

**Berechnung:**
```
avgDay = SUM(Tagesumsätze letzte 7 Tage) / 7
forecastWeek = avgDay × 7
forecastMonth = avgDay × 30
```

**Fehlerfall (500):**
```json
{
  "success": false,
  "error": "Unable to calculate forecast. Ensure WooCommerce is configured."
}
```

---

### 4. Create Digital Product

**Endpoint:** `POST /api/marketing/content/create-digital-product`

**Body:**
```json
{
  "contentTitle": "Python für Anfänger Kurs",
  "contentType": "course",
  "monetizationStrategy": "one-time",
  "pricing": 149
}
```

**Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|------------|
| `contentTitle` | string | ✅ | Produktname |
| `contentType` | string | ⭕ | Typ (für Kategorisierung) |
| `monetizationStrategy` | string | ⭕ | Strategie |
| `pricing` | number | ✅ | Verkaufspreis |

**Beispiel:**
```bash
curl -X POST "http://localhost:3000/api/marketing/content/create-digital-product" \
  -H "Content-Type: application/json" \
  -d '{
    "contentTitle": "Python für Anfänger Kurs",
    "contentType": "course",
    "monetizationStrategy": "one-time",
    "pricing": 149
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Digitales Produkt erfolgreich erstellt!",
  "data": {
    "productId": 12345,
    "productTitle": "Python für Anfänger Kurs",
    "price": 149,
    "wooCommerceUrl": "https://shop.example.de/product/python-kurs",
    "createdAt": "2025-12-10T14:30:00Z"
  }
}
```

**Fehlerfall (400):**
```json
{
  "success": false,
  "error": "Missing required fields: contentTitle, pricing"
}
```

**Fehlerfall (500 - WooCommerce):**
```json
{
  "success": false,
  "error": "WooCommerce connection failed. Check settings."
}
```

---

## 🔐 Authentifizierung

Alle Endpoints unterstützen:
- Cookie-basierte Sessions
- API Key Header (falls aktiviert)

```bash
# Mit API-Key
curl -H "X-API-Key: your-api-key" "http://localhost:3000/api/marketing/content/..."
```

---

## 🚨 Fehlerbehandlung

### Standard Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid parameter: contentType must be one of [digital, course, template, ...]",
  "code": "INVALID_PARAMETER"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Internal server error. Check logs.",
  "code": "INTERNAL_ERROR"
}
```

---

## 📊 Performance & Rate Limits

| Endpoint | Rate Limit | Cache |
|----------|-----------|-------|
| `/price-recommendation` | 100/min | 1 Stunde |
| `/generate-copy` | 50/min | Nicht gecacht |
| `/revenue-forecast` | 100/min | 5 Minuten |
| `/create-digital-product` | 20/min | Nicht gecacht |

---

## 🔧 Konfiguration

### Required Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# WooCommerce
WOO_SHOP_URL=https://shop.example.de
WOO_CONSUMER_KEY=ck_...
WOO_CONSUMER_SECRET=cs_...
```

### connection.json

```json
{
  "openai": {
    "apiKey": "sk-proj-...",
    "model": "gpt-4o-mini"
  },
  "woocommerce": {
    "url": "https://shop.example.de",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_..."
  }
}
```

---

## 🧪 Beispiele

### cURL

```bash
# Preisvorschlag abrufen
curl "http://localhost:3000/api/marketing/content/price-recommendation?contentType=course&strategy=one-time&basePrice=50"

# Produkttext generieren
curl -X POST "http://localhost:3000/api/marketing/content/generate-copy" \
  -H "Content-Type: application/json" \
  -d '{"contentTitle":"Mein Produkt"}'

# Forecast abrufen
curl "http://localhost:3000/api/marketing/content/revenue-forecast"
```

### JavaScript/Fetch

```javascript
// Preisvorschlag
const priceResp = await fetch(
  '/api/marketing/content/price-recommendation?contentType=course&strategy=one-time&basePrice=50'
);
const priceData = await priceResp.json();

// Text generieren
const copyResp = await fetch('/api/marketing/content/generate-copy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contentTitle: 'Python Kurs' })
});
const copyData = await copyResp.json();
```

### Python

```python
import requests

# Preisvorschlag
response = requests.get(
    'http://localhost:3000/api/marketing/content/price-recommendation',
    params={
        'contentType': 'course',
        'strategy': 'one-time',
        'basePrice': 50
    }
)
data = response.json()
print(f"Recommended: €{data['data']['recommendedPrice']}")
```

---

## 📚 Siehe auch

- [User Guide: Content Monetization](./CONTENT_MONETIZATION_GUIDE.md)
- [Bedienungsanleitung](./Bedienungsanleitung-KI-Agent.md)
- [API-Referenz](./README.md#-api-endpoints)

---

**Letzte Aktualisierung:** Dezember 10, 2025  
**Maintenance:** Support Team
