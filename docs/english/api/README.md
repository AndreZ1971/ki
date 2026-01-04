# API Documentation - WooCommerce AI Agent

## Overview

The WooCommerce AI Agent System provides a comprehensive REST API for e-commerce automation, analytics, content generation, and marketing automation.

**Base URL**: `http://localhost:3000` (Development) | `https://your-domain.com` (Production)

**API Version**: 1.8.0

---

## API Categories

1. **[Products](#products)** - WooCommerce Product Management
2. **[Analytics](#analytics)** - Shop Metrics & Reporting (incl. Conversion, ML Insights, Trends, Real-Time)
3. **[Audit](#audit)** - Shop Health Checks & Mini-Audits
4. **[Email](#email-1)** - Email Sending & AI Generation
5. **[Marketing](#marketing)** - Marketing Automation
6. **[System](#system)** - Health Checks & Memory Management
7. **[Customers](#customers)** - Customer Management
8. **[Agent](#agent-interaction)** - AI Agent Interaction

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

- **Rate Limiting**: 100 Requests/Minute (configurable)
- **CORS**: Configured for Frontend
- **Helmet.js**: Security Headers active

---

## Products

### List Products

**GET** `/app/api/products/woo/products`

Retrieves all WooCommerce products with optional filters.

**Query Parameters**:

```typescript
{
  per_page?: number;  // Default: 10, Max: 100
  page?: number;      // Default: 1
  search?: string;    // Search in name/description
  status?: 'publish' | 'draft' | 'pending' | 'private';
  category?: number;  // Category ID
  orderby?: 'date' | 'title' | 'price' | 'popularity';
  order?: 'asc' | 'desc';
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "Premium WordPress Theme",
      "slug": "premium-wp-theme",
      "type": "simple",
      "status": "publish",
      "featured": false,
      "catalog_visibility": "visible",
      "description": "A high-quality WordPress theme...",
      "short_description": "Premium Theme for WordPress",
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

**Error Responses**:

```json
// 503 Service Unavailable – WooCommerce not configured
{
  "success": false,
  "error": "WooCommerce is not configured"
}
```

```json
// 502 Bad Gateway – Upstream error (shop not responding / auth failed)
{
  "success": false,
  "error": "WooCommerce API Error",
  "details": {
    "status": 401,
    "message": "Unauthorized"
  }
}
```

**Notes**:
- The implementation uses the WordPress/WooCommerce REST API directly (Basic Auth). Fallbacks: Query-String-Auth and retrieval without `role` filter.
- Empty results may indicate missing permissions or shop restrictions on the `role` parameter.

---

### Get Single Product
**GET** `/app/api/products/woo/products/:id`

Retrieves a single product by ID.

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

Creates a new WooCommerce product.

**Request Body**:
```json
{
  "name": "New Digital Product",
  "type": "simple",
  "regular_price": "29.99",
  "description": "Detailed product description...",
  "short_description": "Short description",
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

Updates an existing product.

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

Deletes a product (permanently or move to trash).

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

Creates multiple products at once.

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

Generates AI-optimized product descriptions with GPT-4.

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
    "short": "A professional, responsive WordPress theme...",
    "long": "Discover our premium WordPress theme, perfect for...",
    "seo_title": "Premium WordPress Theme - Responsive & E-Commerce Ready",
    "meta_description": "The best WordPress theme for e-commerce..."
  }
}
```

---

### List Categories
**GET** `/app/api/products/woo/categories`

Retrieves all WooCommerce categories.

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
      "description": "WordPress Themes Category",
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

Retrieves current shop metrics (revenue, orders, conversion).

**Query Parameters**:
```typescript
{
  period?: '7days' | '30days' | '90days' | 'year';  // Default: 30days
  compare?: boolean;  // Compare with previous period
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

Real-time data from WooCommerce & Google Analytics.

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

Detailed conversion funnel analysis.

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
        "recommendation": "Simplify checkout process"
      }
    ]
  }
}
```

---

## Settings

### Get Settings (masked)
**GET** `/app/api/settings/connection`

Returns the current configuration. Secret fields are masked (`****`). Structure corresponds to the UI (nested groups):

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

Accepts a nested payload (as in UI) and maps it server-side to flat `connection.json`. Masked fields (`****`) retain their existing secret value.

**Request Body** (Example):
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
- Groups (WordPress, WooCommerce, OpenAI) are optional. If fields within a group are filled, required fields of that group must be valid.
- `job.mode`: `"once" | "interval"`
  - `once`: `job.intervalMs` is ignored
  - `interval`: `job.intervalMs` ∈ [10 000, 86 400 000] (10 s–24 h)

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
Retrieve conversion rates and funnel data.

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
Detailed conversion analysis for specific time period.

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
Conversion funnel visualization with stage data.

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

### Analytics: Regional Data

#### GET /api/analytics/regioning/data?region={region}
Regional performance data for specific region.

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
ML-based insights for specific region.

**Request Body**:
```json
{
  "region": "DE",
  "timeframe": "last90Days",
  "includeForecasts": true
}
```

#### GET /api/analytics/regioning/comparison
Multi-region comparison with benchmarks.

---

### Analytics: ML/AI Insights

#### GET /api/analytics/ml/report
Retrieve ML-generated analytics reports.

#### POST /api/analytics/ml/generate
Generate AI-based analysis for custom data.

**Request Body**:
```json
{
  "dataType": "sales",
  "timeframe": "last30Days",
  "focus": ["trends", "anomalies", "predictions"]
}
```

#### POST /api/analytics/ml/report-insights
Extract detailed insights from report data.

---

### Analytics: Trend Analysis

#### GET /api/analytics/trends/analyze/:keyword
Trend score and data for single keyword.

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
Batch trend analysis for multiple keywords.

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
Identify trending products with trend scores.

#### POST /api/analytics/trends/report
Comprehensive trend report with recommendations.

---

### Analytics: Real-Time Data

#### GET /api/analytics/real-time/dashboard
Real-time dashboard data (overview).

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
Current sales (last 24 hours).

#### GET /api/analytics/real-time/visitors
Current visitors and session data.

#### GET /api/analytics/real-time/performance
Performance metrics (load times, error rate).

#### GET /api/analytics/real-time/products
Top products in real-time with sales figures.

---

### Trend Analysis (Legacy)
**GET** `/app/api/analytics/trend-analysis`

Google Trends integration for keyword trends.

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
      "Keyword 'wordpress theme' shows rising demand"
    ]
  }
}
```

---

## Audit

### Mini Audit
**GET** `/api/audit/mini`

Quick shop health check with basic metrics.

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

Detailed shop scan with issue detection.

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

Audit summary with prioritized recommendations.

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

Product reviews & sentiment analysis.

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

Sends emails with Nodemailer.

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

Generates personalized marketing emails with GPT-4.

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
    "subject": "Exclusive Offer: Premium WordPress Theme",
    "html": "<html>...</html>",
    "text": "Hello John, we have an exclusive offer...",
    "preview_text": "Save 20% on our Premium Theme"
  }
}
```

---

## Marketing

### Marketing Automation
**POST** `/app/api/marketing/marketing-routes`

Starts marketing automation workflows.

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

Checks system health status.

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

Detailed system metrics.

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

AI Agent memory management stats.

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

Status of all circuit breakers.

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

Dead Letter Queue statistics.

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

Retrieves WooCommerce customers.

**Query Parameters**:
```typescript
{
  per_page?: number;  // Default: 10
  page?: number;      // Default: 1
  search?: string;    // Search in name/email
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

Retrieves newsletter subscribers.

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

Customer statistics & segmentation.

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

## Agent Interaction

### AI Agent Interaction
**POST** `/app/api/agent`

Interacts with the AI Agent (GPT-4 Planning Engine).

**Request Body**:
```json
{
  "message": "Create a new product: Premium WordPress Theme for E-Commerce",
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
    "message": "I have successfully created the product.",
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

All API errors follow this format:

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

| Code | Meaning               | Usage                              |
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

| Code                    | Meaning                                      | Action                       |
| ----------------------- | -------------------------------------------- | ---------------------------- |
| `CIRCUIT_BREAKER_OPEN`  | Service circuit breaker is OPEN              | Wait (auto-recovery after 60s) |
| `RATE_LIMIT_EXCEEDED`   | Rate limit exceeded                          | Wait and retry               |
| `INVALID_INPUT`         | Invalid input data                           | Correct request body         |
| `RESOURCE_NOT_FOUND`    | Resource not found                           | Check ID                     |
| `EXTERNAL_API_ERROR`    | External API error (WooCommerce/WordPress)   | Check credentials            |
| `AUTHENTICATION_FAILED` | Authentication failed                        | Check API keys               |

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

Interactive API documentation available at:

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

**Future Versioning** (planned):
```
/api/v1/products
/api/v2/products
```

**Deprecation Policy**:
- Deprecated endpoints receive 6 months warning
- `Deprecation` header on deprecated endpoints
- Changelog in documentation

---

## WebSocket Support (Future)

**Planned for v2.0**:
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

**Planned SDKs**:
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
