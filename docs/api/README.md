# API Documentation - WooCommerce AI Agent

## Übersicht

Das WooCommerce AI Agent System bietet eine umfangreiche REST API für E-Commerce-Automatisierung, Analytics, Content-Generierung und Marketing-Automation.

**Base URL**: `http://localhost:3000` (Development) | `https://your-domain.com` (Production)

**API Version**: 1.8.0

---

## API-Kategorien

1. **[Products](#products)** - WooCommerce Produkt-Management
2. **[Analytics](#analytics)** - Shop-Metriken & Reporting (inkl. Conversion, ML Insights, Trends, Real-Time)
3. **[Audit](#audit)** - Shop Health Checks & Mini-Audits
4. **[Email](#email)** - Email-Versand & AI-Generierung
5. **[Marketing](#marketing)** - Marketing-Automation
6. **[System](#system)** - Health Checks & Memory Management
7. **[Customers](#customers)** - Kundenverwaltung
8. **[Agent](#agent)** - AI Agent Interaction

---

## Authentication

### WooCommerce API
- **Type**: OAuth 1.0a
- **Credentials**: Consumer Key + Consumer Secret
- **Config**: `.env.production`

### WordPress API
- **Type**: Basic Auth
- **Credentials**: Username + App Password
- **Config**: `.env.production`

### API Security
- **Rate Limiting**: 100 Requests/Minute (konfigurierbar)
- **CORS**: Konfiguriert für Frontend
- **Helmet.js**: Security Headers aktiv

---

## Products

### List Products
**GET** `/app/api/products/woo/products`

Ruft alle WooCommerce-Produkte ab mit optionalen Filtern.

**Query Parameters**:
```typescript
{
  per_page?: number;  // Default: 10, Max: 100
  page?: number;      // Default: 1
  search?: string;    // Suche in Name/Beschreibung
  status?: 'publish' | 'draft' | 'pending' | 'private';
  category?: number;  // Kategorie-ID
  orderby?: 'date' | 'title' | 'price' | 'popularity';
  order?: 'asc' | 'desc';
}
```

**Response** (200 OK):
```json
{
  "success": true,

**Error Responses**:

```json
// 503 Service Unavailable – WooCommerce nicht konfiguriert
{
  "success": false,
  "error": "WooCommerce ist nicht konfiguriert"
}
```

```json
// 502 Bad Gateway – Upstream-Fehler (Shop antwortet nicht / Auth fehlgeschlagen)
{
  "success": false,
  "error": "WooCommerce API Error",
  "details": {
    "status": 401,
    "message": "Unauthorized"
  }
}
```

**Hinweise**:
- Die Implementierung nutzt die WordPress/WooCommerce REST API direkt (Basic Auth). Fallbacks: Query-String-Auth und Abruf ohne `role`-Filter.
- Leere Ergebnisse können auf fehlende Berechtigungen oder Shop-Restriktionen des `role`-Parameters hindeuten.

  "data": [
    {
      "id": 123,
      "name": "Premium WordPress Theme",
      "slug": "premium-wp-theme",
      "type": "simple",
      "status": "publish",
      "featured": false,
      "catalog_visibility": "visible",
      "description": "Ein hochwertiges WordPress Theme...",
      "short_description": "Premium Theme für WordPress",
      "sku": "WP-THEME-001",
      "price": "49.99",
      "regular_price": "49.99",
      "sale_price": "",
      "date_created": "2025-11-01T10:00:00",
      "date_modified": "2025-11-01T12:00:00",
      "stock_status": "instock",
      "stock_quantity": null,
      "categories": [
        {
          "id": 15,
          "name": "Themes",
          "slug": "themes"
        }
      ],
      "images": [
        {
          "id": 456,
          "src": "https://shop.de/wp-content/uploads/theme-preview.jpg",
          "name": "theme-preview"
        }
      ]
    }
  ],
  "total": 145,
  "pages": 15
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Invalid per_page parameter. Must be between 1 and 100."
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "success": false,
  "error": "WooCommerce API error: Unauthorized"
}
```

---

### Get Single Product
**GET** `/app/api/products/woo/products/:id`

Ruft ein einzelnes Produkt nach ID ab.

**Path Parameters**:
- `id` (number) - WooCommerce Product ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Premium WordPress Theme",
    // ... (see List Products for full structure)
  }
}
```

---

### Create Product
**POST** `/app/api/products/woo/products`

Erstellt ein neues WooCommerce-Produkt.

**Request Body**:
```json
{
  "name": "New Digital Product",
  "type": "simple",
  "regular_price": "29.99",
  "description": "Ausführliche Produktbeschreibung...",
  "short_description": "Kurze Beschreibung",
  "categories": [
    { "id": 15 }
  ],
  "images": [
    {
      "src": "https://shop.de/wp-content/uploads/product.jpg"
    }
  ],
  "status": "publish",
  "sku": "PROD-001",
  "stock_status": "instock",
  "virtual": true,
  "downloadable": true,
  "downloads": [
    {
      "name": "Product File",
      "file": "https://shop.de/downloads/product.zip"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 789,
    "name": "New Digital Product",
    // ... (full product object)
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Missing required field: name"
}
```

---

### Update Product
**PUT** `/app/api/products/woo/products/:id`

Aktualisiert ein bestehendes Produkt.

**Path Parameters**:
- `id` (number) - Product ID

**Request Body** (partial update):
```json
{
  "name": "Updated Product Name",
  "regular_price": "39.99",
  "sale_price": "29.99",
  "description": "Updated description..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Updated Product Name",
    // ... (full updated product)
  }
}
```

---

### Delete Product
**DELETE** `/app/api/products/woo/products/:id`

Löscht ein Produkt (permanent oder in Trash).

**Path Parameters**:
- `id` (number) - Product ID

**Query Parameters**:
```typescript
{
  force?: boolean;  // true = permanent delete, false = trash
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    "id": 123,
    "name": "Deleted Product"
  }
}
```

---

### Bulk Create Products
**POST** `/app/api/products/woo/products/bulk`

Erstellt mehrere Produkte gleichzeitig.

**Request Body**:
```json
{
  "products": [
    {
      "name": "Product 1",
      "regular_price": "19.99",
      "type": "simple"
    },
    {
      "name": "Product 2",
      "regular_price": "29.99",
      "type": "simple"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "created": 2,
  "failed": 0,
  "results": [
    {
      "success": true,
      "product": { "id": 101, "name": "Product 1" }
    },
    {
      "success": true,
      "product": { "id": 102, "name": "Product 2" }
    }
  ]
}
```

---

### AI Product Description
**POST** `/app/api/products/woo/products/ai-description`

Generiert AI-optimierte Produktbeschreibungen mit GPT-4.

**Request Body**:
```json
{
  "productName": "Premium WordPress Theme",
  "keywords": ["wordpress", "theme", "responsive", "ecommerce"],
  "tone": "professional",
  "language": "de"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "description": {
    "short": "Ein professionelles, responsives WordPress Theme...",
    "long": "Entdecken Sie unser Premium WordPress Theme, das perfekt für...",
    "seo_title": "Premium WordPress Theme - Responsive & E-Commerce Ready",
    "meta_description": "Das beste WordPress Theme für E-Commerce..."
  }
}
```

---

### List Categories
**GET** `/app/api/products/woo/categories`

Ruft alle WooCommerce-Kategorien ab.

**Query Parameters**:
```typescript
{
  per_page?: number;  // Default: 100
  hide_empty?: boolean;  // Default: false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "name": "Themes",
      "slug": "themes",
      "parent": 0,
      "description": "WordPress Themes Kategorie",
      "count": 45,
      "image": {
        "src": "https://shop.de/wp-content/uploads/category.jpg"
      }
    }
  ]
}
```

---

## Analytics

### Shop Metrics
**GET** `/app/api/analytics/metrics/shop-metrics`

Ruft aktuelle Shop-Metriken ab (Umsatz, Bestellungen, Conversion).

**Query Parameters**:
```typescript
{
  period?: '7days' | '30days' | '90days' | 'year';  // Default: 30days
  compare?: boolean;  // Vergleich mit Vorperiode
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "revenue": {
      "current": 12450.50,
      "previous": 10200.30,
      "change": 22.05,
      "trend": "up"
    },
    "orders": {
      "current": 245,
      "previous": 210,
      "change": 16.67,
      "trend": "up"
    },
    "conversion_rate": {
      "current": 3.45,
      "previous": 2.98,
      "change": 15.77,
      "trend": "up"
    },
    "average_order_value": {
      "current": 50.82,
      "previous": 48.57,
      "change": 4.63,
      "trend": "up"
    },
    "top_products": [
      {
        "id": 123,
        "name": "Premium Theme",
        "sales": 45,
        "revenue": 2249.55
      }
    ],
    "period": {
      "start": "2025-10-01",
      "end": "2025-10-31"
    }
  }
}
```

---

### Real-Time Analytics
**GET** `/app/api/analytics/real-woocommerce-analytics`

Echtzeit-Daten aus WooCommerce & Google Analytics.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "live_visitors": 45,
    "active_sessions": 38,
    "today_revenue": 1245.60,
    "today_orders": 28,
    "cart_abandonment_rate": 68.5,
    "recent_orders": [
      {
        "id": 5678,
        "total": "49.99",
        "status": "processing",
        "date": "2025-11-01T14:30:00"
      }
    ]
  }
}
```

---

### Conversion Analysis
**GET** `/app/api/analytics/conversion-analysis`

Detaillierte Conversion-Funnel-Analyse.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "funnel": {
      "visitors": 10000,
      "product_views": 4500,
      "add_to_cart": 1200,
      "checkout": 450,
      "completed": 345
    },
    "conversion_rates": {
      "visitor_to_purchase": 3.45,
      "cart_to_purchase": 28.75,
      "checkout_to_purchase": 76.67
    },
    "drop_off_points": [
      {
        "stage": "add_to_cart_to_checkout",
        "drop_off_rate": 62.5,
        "recommendation": "Vereinfache den Checkout-Prozess"
      }
    ]
  }
}
```

---

## Settings

### Get Settings (masked)
**GET** `/app/api/settings/connection`

Gibt die aktuelle Konfiguration zurück. Geheimfelder sind maskiert (`****`). Struktur entspricht dem UI (verschachtelte Gruppen):

**Response** (200 OK):
```json
{
  "wordpress": { "url": "https://shop.de", "user": "admin", "appPassword": "****" },
  "woocommerce": { "url": "https://shop.de", "consumerKey": "****", "consumerSecret": "****" },
  "openAI": { "apiKey": "****" },
  "smtp": { "host": "smtp.example.com", "user": "alerts@example.com", "pass": "****" },
  "job": { "mode": "once", "intervalMs": 900000 },
  "features": { "ml": false, "emailMarketing": false }
}
```

### Save Settings
**POST** `/app/api/settings/connection`

Nimmt ein verschachteltes Payload entgegen (wie im UI) und mappt es serverseitig auf die flache `connection.json`. Maskierte Felder (`****`) behalten ihren vorhandenen Secret-Wert.

**Request Body** (Beispiel):
```json
{
  "wordpress": { "url": "https://shop.de", "user": "admin", "appPassword": "xxxx xxxx xxxx xxxx" },
  "woocommerce": { "url": "https://shop.de", "consumerKey": "ck_xxx", "consumerSecret": "cs_xxx" },
  "openAI": { "apiKey": "sk-xxx" },
  "job": { "mode": "interval", "intervalMs": 900000 },
  "features": { "ml": true }
}
```

**Validation**:
- Gruppen (WordPress, WooCommerce, OpenAI) sind optional. Wenn Felder innerhalb einer Gruppe befüllt werden, müssen die Pflichtfelder dieser Gruppe gültig sein.
- `job.mode`: `"once" | "interval"`
  - `once`: `job.intervalMs` wird ignoriert
  - `interval`: `job.intervalMs` ∈ [10 000, 86 400 000] (10 s–24 h)

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "job.intervalMs", "rule": "interval_range", "message": "Must be between 10s and 24h" }
  ]
}
```

---

### Analytics: Conversion

#### GET /api/analytics/conversion/analysis
Conversion-Raten und Funnel-Daten abrufen.

**Response** (200 OK):
```json
{
  "overallRate": 3.5,
  "period": "last30Days",
  "data": [
    {
      "date": "2025-12-01",
      "rate": 3.2,
      "visitors": 1000,
      "conversions": 32
    }
  ]
}
```

#### POST /api/analytics/conversion/analyze
Detaillierte Conversion-Analyse für spezifischen Zeitraum.

**Request Body**:
```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "filters": {
    "source": "organic",
    "device": "mobile"
  }
}
```

#### GET /api/analytics/conversion/funnel
Conversion-Funnel-Visualisierung mit Stufen-Daten.

**Response** (200 OK):
```json
{
  "funnel": [
    { "stage": "Landing", "visitors": 10000, "rate": 100 },
    { "stage": "Product View", "visitors": 5000, "rate": 50 },
    { "stage": "Add to Cart", "visitors": 1000, "rate": 10 },
    { "stage": "Checkout", "visitors": 400, "rate": 4 },
    { "stage": "Purchase", "visitors": 320, "rate": 3.2 }
  ]
}
```

---

### Analytics: Regionale Daten

#### GET /api/analytics/regioning/data?region={region}
Regionale Performance-Daten für spezifische Region.

**Response** (200 OK):
```json
{
  "region": "DE",
  "sales": 25000,
  "orders": 450,
  "avgOrderValue": 55.56,
  "topProducts": [
    { "id": 123, "name": "Product A", "sales": 5000 }
  ],
  "growth": 15.5
}
```

#### POST /api/analytics/regioning/ml-analysis
ML-basierte Insights für spezifische Region.

**Request Body**:
```json
{
  "region": "DE",
  "timeframe": "last90Days",
  "includeForecasts": true
}
```

#### GET /api/analytics/regioning/comparison
Multi-Region-Vergleich mit Benchmarks.

---

### Analytics: ML/KI Insights

#### GET /api/analytics/ml/report
ML-generierte Analytics-Reports abrufen.

#### POST /api/analytics/ml/generate
KI-basierte Analyse für Custom-Daten generieren.

**Request Body**:
```json
{
  "dataType": "sales",
  "timeframe": "last30Days",
  "focus": ["trends", "anomalies", "predictions"]
}
```

#### POST /api/analytics/ml/report-insights
Detaillierte Insights aus Report-Daten extrahieren.

---

### Analytics: Trend-Analyse

#### GET /api/analytics/trends/analyze/:keyword
Trend-Score und Daten für einzelnes Keyword.

**Response** (200 OK):
```json
{
  "keyword": "sustainable fashion",
  "trendScore": 85,
  "searchVolume": 12000,
  "competition": "medium",
  "trend": "rising",
  "relatedKeywords": ["eco friendly clothing"]
}
```

#### POST /api/analytics/trends/analyze
Batch-Trend-Analyse für mehrere Keywords.

**Request Body**:
```json
{
  "keywords": [
    "sustainable fashion",
    "organic cotton",
    "recycled materials"
  ]
}
```

#### GET /api/analytics/trends/products
Trending Produkte mit Trend-Scores identifizieren.

#### POST /api/analytics/trends/report
Umfassender Trend-Report mit Empfehlungen.

---

### Analytics: Echtzeit-Daten

#### GET /api/analytics/real-time/dashboard
Real-Time Dashboard-Daten (Übersicht).

**Response** (200 OK):
```json
{
  "currentVisitors": 245,
  "activeSessions": 178,
  "salesToday": 3500,
  "ordersToday": 67,
  "conversionRate": 3.2,
  "timestamp": "2025-12-09T10:30:00Z"
}
```

#### GET /api/analytics/real-time/sales
Aktuelle Verkäufe (letzte 24 Stunden).

#### GET /api/analytics/real-time/visitors
Aktuelle Besucher und Session-Daten.

#### GET /api/analytics/real-time/performance
Performance-Metriken (Ladezeiten, Fehlerrate).

#### GET /api/analytics/real-time/products
Top-Produkte in Echtzeit mit Verkaufszahlen.

---

### Trend Analysis (Legacy)
**GET** `/app/api/analytics/trend-analysis`

Google Trends Integration für Keyword-Trends.

**Query Parameters**:
```typescript
{
  keywords: string[];  // Array of keywords
  timeframe?: 'today' | '7days' | '30days' | '90days';
  geo?: string;  // Country code (DE, US, etc.)
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "keywords": [
      {
        "keyword": "wordpress theme",
        "trend": "rising",
        "interest": 85,
        "change": 12.5,
        "related_queries": [
          "free wordpress themes",
          "best wordpress themes 2025"
        ]
      }
    ],
    "recommendations": [
      "Keyword 'wordpress theme' zeigt steigende Nachfrage"
    ]
  }
}
```

---

---

## Audit

### Mini Audit
**GET** `/api/audit/mini`

Schneller Shop-Health-Check mit Basis-Metriken.

**Response** (200 OK):
```json
{
  "score": 78,
  "status": "good",
  "checks": [
    {
      "name": "SSL Certificate",
      "status": "pass",
      "message": "Valid SSL certificate"
    },
    {
      "name": "Page Speed",
      "status": "warning",
      "message": "Average load time: 2.5s"
    }
  ],
  "checkedAt": "2025-12-09T10:00:00Z"
}
```

### Shop Scan
**POST** `/api/audit/mini/scan`

Detaillierter Shop-Scan mit Problemerkennung.

**Request Body**:
```json
{
  "depth": "full",
  "includePlugins": true,
  "checkSecurity": true
}
```

**Response** (200 OK):
```json
{
  "scan": {
    "duration": "00:02:15",
    "pagesScanned": 45,
    "issuesFound": 8,
    "issues": [
      {
        "severity": "critical",
        "type": "security",
        "message": "Outdated WooCommerce version",
        "recommendation": "Update to latest version"
      }
    ]
  }
}
```

### Audit Summary
**GET** `/api/audit/mini/summary`

Audit-Zusammenfassung mit priorisierten Empfehlungen.

**Response** (200 OK):
```json
{
  "summary": {
    "overallScore": 78,
    "lastAudit": "2025-12-09T10:00:00Z",
    "improvements": [
      {
        "priority": "high",
        "area": "security",
        "action": "Update WooCommerce to v8.5"
      }
    ],
    "strengths": [
      "Valid SSL certificate",
      "Mobile-responsive design"
    ]
  }
}
```

---

### Reviews Analytics
**GET** `/app/api/analytics/reviews`

Produktbewertungen & Sentiment-Analyse.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "average_rating": 4.65,
    "total_reviews": 1234,
    "rating_distribution": {
      "5": 856,
      "4": 245,
      "3": 78,
      "2": 32,
      "1": 23
    },
    "sentiment": {
      "positive": 89.2,
      "neutral": 7.8,
      "negative": 3.0
    },
    "top_keywords": [
      "quality",
      "support",
      "easy to use"
    ]
  }
}
```

---

## Email

### Send Email
**POST** `/app/api/email/email-sender`

Versendet Emails mit Nodemailer.

**Request Body**:
```json
{
  "to": "customer@example.com",
  "subject": "Your Order Confirmation",
  "text": "Thank you for your order...",
  "html": "<h1>Thank you for your order</h1><p>...</p>",
  "attachments": [
    {
      "filename": "invoice.pdf",
      "path": "/path/to/invoice.pdf"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "messageId": "<abc123@smtp.gmail.com>",
  "accepted": ["customer@example.com"],
  "rejected": []
}
```

---

### AI Email Generator
**POST** `/app/api/ai/email/ai-email`

Generiert personalisierte Marketing-Emails mit GPT-4.

**Request Body**:
```json
{
  "type": "promotional" | "transactional" | "newsletter",
  "product": {
    "name": "Premium WordPress Theme",
    "price": "49.99"
  },
  "customer": {
    "name": "John Doe",
    "language": "de"
  },
  "tone": "friendly" | "professional" | "casual",
  "include_cta": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "email": {
    "subject": "Exklusives Angebot: Premium WordPress Theme",
    "html": "<html>...</html>",
    "text": "Hallo John, wir haben ein exklusives Angebot...",
    "preview_text": "Sparen Sie 20% auf unser Premium Theme"
  }
}
```

---

## Marketing

### Marketing Automation
**POST** `/app/api/marketing/marketing-routes`

Startet Marketing-Automation-Workflows.

**Request Body**:
```json
{
  "workflow": "abandoned_cart" | "welcome_series" | "win_back",
  "trigger": {
    "type": "cart_abandoned",
    "customer_id": 123,
    "cart_value": 49.99
  },
  "settings": {
    "delay_hours": 2,
    "send_reminder": true
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "workflow_id": "wf_abc123",
  "status": "scheduled",
  "next_action": "2025-11-01T16:30:00",
  "steps": [
    {
      "action": "send_email",
      "template": "abandoned_cart_reminder",
      "scheduled_at": "2025-11-01T16:30:00"
    }
  ]
}
```

---

## System

### Health Check
**GET** `/app/api/health`

Prüft System-Health Status.

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T10:00:00.000Z",
  "uptime": 86400,
  "services": {
    "woocommerce": "connected",
    "wordpress": "connected",
    "openai": "connected",
    "smtp": "connected"
  }
}
```

---

### System Metrics
**GET** `/app/api/system/health/system`

Detaillierte System-Metriken.

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T10:00:00.000Z",
  "uptime": 86400,
  "memory": {
    "used": 1200000000,
    "total": 4000000000,
    "percentage": 30,
    "heap": {
      "used": 850000000,
      "total": 2048000000
    }
  },
  "cpu": {
    "usage": 25.5,
    "cores": 3
  },
  "disk": {
    "used": 35000000000,
    "total": 80000000000,
    "percentage": 43.75
  }
}
```

---

### Memory Stats
**GET** `/app/api/system/memory/memory`

AI Agent Memory Management Stats.

**Response** (200 OK):
```json
{
  "success": true,
  "memory": {
    "totalMessages": 1250,
    "memorySize": 5242880,
    "messagesBreakdown": {
      "user": 625,
      "assistant": 625
    },
    "oldestMessage": "2025-11-01T00:00:00.000Z",
    "newestMessage": "2025-11-01T10:00:00.000Z"
  }
}
```

---

### Circuit Breaker Status
**GET** `/app/api/error-handling/circuit-breakers`

Status aller Circuit Breakers.

**Response** (200 OK):
```json
{
  "success": true,
  "circuit_breakers": {
    "wooCommerce": {
      "state": "CLOSED",
      "failures": 0,
      "successes": 1245,
      "lastFailureTime": null,
      "nextAttemptTime": null
    },
    "wordPress": {
      "state": "HALF_OPEN",
      "failures": 3,
      "successes": 1,
      "lastFailureTime": "2025-11-01T09:50:00.000Z",
      "nextAttemptTime": "2025-11-01T09:51:00.000Z"
    },
    "openAI": {
      "state": "CLOSED",
      "failures": 0,
      "successes": 456,
      "lastFailureTime": null,
      "nextAttemptTime": null
    }
  }
}
```

---

### Dead Letter Queue Stats
**GET** `/app/api/error-handling/dlq/stats`

Dead Letter Queue Statistiken.

**Response** (200 OK):
```json
{
  "success": true,
  "dlq": {
    "totalMessages": 5,
    "readyForRetry": 2,
    "messagesByJobType": {
      "createProduct": 3,
      "sendEmail": 1,
      "updateAnalytics": 1
    },
    "oldestMessage": "2025-11-01T08:00:00.000Z",
    "newestMessage": "2025-11-01T09:45:00.000Z"
  }
}
```

---

## Customers

### List Customers
**GET** `/app/api/woocommerce/customers`

Ruft WooCommerce-Kunden ab.

**Query Parameters**:
```typescript
{
  per_page?: number;  // Default: 10
  page?: number;      // Default: 1
  search?: string;    // Suche in Name/Email
  orderby?: 'registered_date' | 'name' | 'email';
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "email": "customer@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe",
      "billing": {
        "first_name": "John",
        "last_name": "Doe",
        "company": "Company Inc.",
        "address_1": "123 Main St",
        "city": "New York",
        "postcode": "10001",
        "country": "US"
      },
      "orders_count": 15,
      "total_spent": "749.85",
      "date_created": "2024-01-01T10:00:00"
    }
  ],
  "total": 456,
  "pages": 46
}
```

---

### Customer Subscribers
**GET** `/app/api/woocommerce/subscribers`

Ruft Newsletter-Subscriber ab.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total": 1234,
    "subscribers": [
      {
        "id": 123,
        "email": "subscriber@example.com",
        "name": "John Doe",
        "subscribed_date": "2025-01-01T10:00:00",
        "status": "active"
      }
    ]
  }
}
```

---

### Customer Stats
**GET** `/app/api/woocommerce/stats`

Kunden-Statistiken & Segmentierung.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total_customers": 1234,
    "new_customers_30d": 45,
    "returning_customers": 789,
    "average_lifetime_value": 245.60,
    "segments": {
      "high_value": 123,
      "medium_value": 456,
      "low_value": 655
    },
    "churn_rate": 12.5
  }
}
```

---

## Agent

### AI Agent Interaction
**POST** `/app/api/agent`

Interagiert mit dem AI Agent (GPT-4 Planning Engine).

**Request Body**:
```json
{
  "message": "Erstelle ein neues Produkt: Premium WordPress Theme für E-Commerce",
  "context": {
    "user_id": 123,
    "session_id": "sess_abc123"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "response": {
    "message": "Ich habe das Produkt erfolgreich erstellt.",
    "steps_executed": [
      {
        "step": 1,
        "action": "create_product",
        "result": "Product ID: 789"
      },
      {
        "step": 2,
        "action": "generate_description",
        "result": "AI description generated"
      },
      {
        "step": 3,
        "action": "upload_image",
        "result": "Image uploaded: media_456"
      }
    ],
    "product": {
      "id": 789,
      "name": "Premium WordPress Theme",
      "status": "draft",
      "url": "https://shop.de/product/premium-wordpress-theme"
    }
  }
}
```

---

## Error Responses

### Standard Error Format

Alle API-Fehler folgen diesem Format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "field_name",
    "reason": "detailed_reason"
  },
  "timestamp": "2025-11-01T10:00:00.000Z"
}
```

### HTTP Status Codes

| Code | Bedeutung             | Verwendung                         |
| ---- | --------------------- | ---------------------------------- |
| 200  | OK                    | Successful GET/PUT/DELETE          |
| 201  | Created               | Successful POST (resource created) |
| 400  | Bad Request           | Invalid input/parameters           |
| 401  | Unauthorized          | Missing/invalid authentication     |
| 403  | Forbidden             | Insufficient permissions           |
| 404  | Not Found             | Resource not found                 |
| 429  | Too Many Requests     | Rate limit exceeded                |
| 500  | Internal Server Error | Server error                       |
| 503  | Service Unavailable   | Circuit Breaker OPEN               |

### Error Codes

| Code                    | Bedeutung                                       | Action                          |
| ----------------------- | ----------------------------------------------- | ------------------------------- |
| `CIRCUIT_BREAKER_OPEN`  | Service Circuit Breaker ist OPEN                | Warten (Auto-Recovery nach 60s) |
| `RATE_LIMIT_EXCEEDED`   | Rate Limit überschritten                        | Warten und erneut versuchen     |
| `INVALID_INPUT`         | Ungültige Eingabedaten                          | Request-Body korrigieren        |
| `RESOURCE_NOT_FOUND`    | Ressource nicht gefunden                        | ID prüfen                       |
| `EXTERNAL_API_ERROR`    | Fehler bei externer API (WooCommerce/WordPress) | Credentials prüfen              |
| `AUTHENTICATION_FAILED` | Authentifizierung fehlgeschlagen                | API Keys prüfen                 |

---

## Rate Limiting

**Default Limits**:
- **Global**: 100 Requests/Minute
- **Per IP**: 60 Requests/Minute
- **Heavy Endpoints** (AI, Bulk): 10 Requests/Minute

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698825600
```

**Rate Limit Exceeded Response** (429):
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retry_after": 60,
  "limit": 100,
  "remaining": 0
}
```

---

## Pagination

**Standard Pagination Parameters**:
```typescript
{
  per_page?: number;  // Items per page (Default: 10, Max: 100)
  page?: number;      // Page number (Default: 1)
}
```

**Pagination Response Headers**:
```
X-WP-Total: 145         # Total items
X-WP-TotalPages: 15     # Total pages
Link: <...page=2>; rel="next", <...page=15>; rel="last"
```

---

## API Testing

### Swagger UI

Interaktive API-Dokumentation verfügbar unter:

```
http://localhost:3000/docs
```

### Postman Collection

Import Postman Collection:

```bash
curl -o woo-ki-agent.postman_collection.json \
  https://github.com/AndreZ1971/ki/blob/master/docs/api/postman_collection.json
```

### cURL Examples

**Get Products**:
```bash
curl -X GET "http://localhost:3000/app/api/products/woo/products?per_page=10&page=1"
```

**Create Product**:
```bash
curl -X POST "http://localhost:3000/app/api/products/woo/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "regular_price": "29.99",
    "type": "simple"
  }'
```

**Health Check**:
```bash
curl -X GET "http://localhost:3000/api/health"
```

---

## API Versioning

**Current Version**: v1 (implicit in routes)

**Future Versioning** (geplant):
```
/api/v1/products
/api/v2/products
```

**Deprecation Policy**:
- Deprecated Endpoints erhalten 6 Monate Warning
- `Deprecation` Header bei deprecated Endpoints
- Changelog in Documentation

---

## WebSocket Support (Future)

**Geplant für v2.0**:
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('message', (data) => {
  // Real-time updates
  // - New Orders
  // - Analytics Updates
  // - Agent Status
});
```

---

## SDK & Client Libraries (Future)

**Geplante SDKs**:
- **JavaScript/TypeScript**: npm package
- **Python**: pip package
- **PHP**: composer package

---

## Support

**API Issues**: https://github.com/AndreZ1971/ki/issues  
**Documentation**: https://github.com/AndreZ1971/ki/docs  
**Changelog**: https://github.com/AndreZ1971/ki/CHANGELOG.md

**Version**: 1.8.0  
**Last Update**: November 2025
