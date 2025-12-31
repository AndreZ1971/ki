# 🎯 Content Monetization API – Deprecated (consolidated)

This file is deprecated. The consolidated and current guide including API is located in:

- CONTENT_MONETIZATION.md

Version: 3.2.0 (deprecated)
Last Updated: December 2025

—

Original content follows below for reference.

---

## 📋 Overview

The Content Monetization System provides a complete API for:
- Intelligent price recommendations
- AI-powered text generation
- Revenue forecasts
- Digital product management

---

## 🔌 API Endpoints

### 1. Price Recommendation

**Endpoint:** `GET /api/marketing/content/price-recommendation`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contentType` | string | ✅ | Product type (digital, course, template, subscription, etc.) |
| `strategy` | string | ✅ | Monetization strategy (one-time, subscription, freemium, tiered) |
| `basePrice` | number | ✅ | Base price as reference |

**Example:**
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
    "reasoning": "Online courses should be positioned in premium segment with 3x multiplier for quality content"
  }
}
```

**Error Case (400):**
```json
{
  "success": false,
  "error": "Missing required parameters: contentType, strategy, basePrice"
}
```

**Pricing Logic:**
| Type | Strategy | Multiplier | Example |
|------|----------|-----------|---------|
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
  "contentTitle": "Python for Beginners Course",
  "contentType": "course",
  "monetizationStrategy": "one-time",
  "pricing": 149
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contentTitle` | string | ✅ | Title of the product/content |
| `contentType` | string | ⭕ | Product type (for better adaptation) |
| `monetizationStrategy` | string | ⭕ | Strategy (for better adaptation) |
| `pricing` | number | ⭕ | Price (for better adaptation) |

**Example:**
```bash
curl -X POST "http://localhost:3000/api/marketing/content/generate-copy" \
  -H "Content-Type: application/json" \
  -d '{
    "contentTitle": "Python for Beginners Course",
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
    "headline": "Python for Beginners: The Complete Step-by-Step Course",
    "body": "Learn Python from scratch with 50+ practical exercises. Perfect for beginners – no prior knowledge required. Lifetime access plus regular updates.",
    "cta": "Buy Course Now - Only €149"
  }
}
```

**Fallback Response (if OpenAI unavailable):**
```json
{
  "success": true,
  "data": {
    "headline": "Python for Beginners Course",
    "body": "Premium content for your business. Created with professional quality.",
    "cta": "Buy now"
  }
}
```

**Error Case (400):**
```json
{
  "success": false,
  "error": "contentTitle is required"
}
```

---

### 3. Revenue Forecast

**Endpoint:** `GET /api/marketing/content/revenue-forecast`

**Parameters:** None required

**Example:**
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

**Calculation:**
```
avgDay = SUM(Daily revenue last 7 days) / 7
forecastWeek = avgDay × 7
forecastMonth = avgDay × 30
```

**Error Case (500):**
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
  "contentTitle": "Python for Beginners Course",
  "contentType": "course",
  "monetizationStrategy": "one-time",
  "pricing": 149
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contentTitle` | string | ✅ | Product name |
| `contentType` | string | ⭕ | Type (for categorization) |
| `monetizationStrategy` | string | ⭕ | Strategy |
| `pricing` | number | ✅ | Selling price |

**Example:**
```bash
curl -X POST "http://localhost:3000/api/marketing/content/create-digital-product" \
  -H "Content-Type: application/json" \
  -d '{
    "contentTitle": "Python for Beginners Course",
    "contentType": "course",
    "monetizationStrategy": "one-time",
    "pricing": 149
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Digital product created successfully!",
  "data": {
    "productId": 12345,
    "productTitle": "Python for Beginners Course",
    "price": 149,
    "wooCommerceUrl": "https://shop.example.de/product/python-course",
    "createdAt": "2025-12-10T14:30:00Z"
  }
}
```

**Error Case (400):**
```json
{
  "success": false,
  "error": "Missing required fields: contentTitle, pricing"
}
```

**Error Case (500 - WooCommerce):**
```json
{
  "success": false,
  "error": "WooCommerce connection failed. Check settings."
}
```

---

## 🔐 Authentication

All endpoints support:
- Cookie-based sessions
- API Key header (if enabled)

```bash
# With API-Key
curl -H "X-API-Key: your-api-key" "http://localhost:3000/api/marketing/content/..."
```

---

## 🚨 Error Handling

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
| `/price-recommendation` | 100/min | 1 hour |
| `/generate-copy` | 50/min | Not cached |
| `/revenue-forecast` | 100/min | 5 minutes |
| `/create-digital-product` | 20/min | Not cached |

---

## 🔧 Configuration

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

## 🧪 Examples

### cURL

```bash
# Get price suggestion
curl "http://localhost:3000/api/marketing/content/price-recommendation?contentType=course&strategy=one-time&basePrice=50"

# Generate product text
curl -X POST "http://localhost:3000/api/marketing/content/generate-copy" \
  -H "Content-Type: application/json" \
  -d '{"contentTitle":"My Product"}'

# Get forecast
curl "http://localhost:3000/api/marketing/content/revenue-forecast"
```

### JavaScript/Fetch

```javascript
// Price suggestion
const priceResp = await fetch(
  '/api/marketing/content/price-recommendation?contentType=course&strategy=one-time&basePrice=50'
);
const priceData = await priceResp.json();

// Generate text
const copyResp = await fetch('/api/marketing/content/generate-copy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contentTitle: 'Python Course' })
});
const copyData = await copyResp.json();
```

### Python

```python
import requests

# Price suggestion
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

## 📚 See Also

- [User Guide: Content Monetization](./CONTENT_MONETIZATION_GUIDE.md)
- [Operating Instructions](./Bedienungsanleitung-KI-Agent.md)
- [API Reference](./README.md#-api-endpoints)

---

**Last Updated:** December 10, 2025  
**Maintenance:** Support Team
