# 🛠️ A.R.I. - Developer FAQ

**Version:** 2.0.0  
**Date:** January 2026  
**Target Audience:** DevOps, Developers, System Administrators

---

## 📋 Table of Contents

1. [Setup & Installation](#setup--installation)
2. [Docker & Container](#docker--container)
3. [Configuration & Environment](#configuration--environment)
4. [Backend & APIs](#backend--apis)
5. [Frontend & Build](#frontend--build)
6. [Debugging & Logs](#debugging--logs)
7. [Performance & Optimization](#performance--optimization)
8. [Deployment & Updates](#deployment--updates)
9. [Security & Authentication](#security--authentication)
10. [Testing & Quality](#testing--quality)
11. [Tool Reference & Architecture](#tool-reference--architecture)
12. [Emergency Alerting & Monitoring](#emergency-alerting--monitoring)
13. [Machine Learning Integration](#machine-learning-integration)

---

## Setup & Installation

### System Requirements

**Minimum:**
- Docker 20.10+ & Docker Compose 2.0+
- 2 CPU Cores
- 4 GB RAM
- 10 GB Storage
- Node.js 18+ (for local development)

**Recommended:**
- 4+ CPU Cores
- 8 GB RAM
- 20 GB SSD Storage
- Ubuntu 22.04 / Debian 11+

### How do I install A.R.I. locally?

**1. Clone repository:**
```bash
git clone https://github.com/AndreZ1971/ki.git
cd ki
```

**2. Create environment file:**
```bash
cp .env.example .env.production
```

**3. Configure environment variables:**
```bash
# Required
SHOP_URL=https://your-woocommerce-shop.com
WOO_CONSUMER_KEY=ck_xxxxx
WOO_CONSUMER_SECRET=cs_xxxxx
OPENAI_API_KEY=sk-xxxxx

# Optional
NODE_ENV=production
PORT=3000
```

**4. Start with Docker:**
```bash
docker-compose up -d
```

**5. Access:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3000/api`

### Local Development (without Docker)

**1. Install dependencies:**
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

**2. Start development servers:**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## Docker & Container

### Docker-Compose Structure

```yaml
services:
  app:      # Main application (Backend + Frontend)
  nginx:    # Reverse proxy
  watchtower: # Auto-updates
```

### How do I rebuild containers?

```bash
# Rebuild all containers
docker-compose build --no-cache

# Rebuild only app container
docker-compose build --no-cache app

# Restart after rebuild
docker-compose up -d
```

### How do I view container logs?

```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f app
docker-compose logs -f nginx

# Last 100 lines
docker-compose logs --tail=100 app
```

### Container doesn't start

**Check logs:**
```bash
docker-compose logs app
```

**Common issues:**
- ❌ Port 3000 already in use
- ❌ .env.production missing
- ❌ Invalid WooCommerce credentials
- ❌ Out of memory

**Solution:**
```bash
# Stop all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

---

## Configuration & Environment

### Required Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `SHOP_URL` | WooCommerce shop URL | `https://myshop.com` |
| `WOO_CONSUMER_KEY` | WooCommerce API Key | `ck_xxxxx` |
| `WOO_CONSUMER_SECRET` | WooCommerce API Secret | `cs_xxxxx` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-proj-xxxxx` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Backend port | `3000` |

### Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT` | API rate limit | `100/min` |
| `SESSION_SECRET` | Session encryption | auto-generated |
| `OPENAI_MODEL` | Default AI model | `gpt-4o-mini` |

### Where is connection.json?

**Path:** `backend/connection.json`

**Format:**
```json
{
  "woocommerce": {
    "shop_url": "https://myshop.com",
    "consumer_key": "ck_xxxxx",
    "consumer_secret": "cs_xxxxx",
    "validated": true
  },
  "openai": {
    "api_key": "sk-xxxxx",
    "model": "gpt-4o-mini",
    "validated": true
  }
}
```

**This file is created automatically** after customer onboarding via frontend.

---

## Backend & APIs

### Backend Architecture

```
backend/
├── server.ts              # Main Fastify server
├── routes/                # API routes
│   ├── agentLoops.ts      # Agent loop endpoints
│   ├── analytics.ts       # Analytics tools
│   ├── products.ts        # Product tools
│   ├── payments.ts        # Payment tools
│   └── marketing.ts       # Marketing tools
├── tools/                 # 51 Tool implementations
│   ├── analytics/
│   ├── products/
│   ├── payments/
│   ├── marketing/
│   └── advanced/
├── services/              # Core services
│   ├── woocommerceService.ts
│   ├── openaiService.ts
│   └── mlService.ts
├── middleware/            # Auth, rate limiting
├── config/                # Configuration
└── types/                 # TypeScript types
```

### How do I add a new API endpoint?

**1. Create route file:**
```typescript
// backend/routes/myRoute.ts
import { FastifyInstance } from 'fastify';

export async function myRoutes(fastify: FastifyInstance) {
  fastify.get('/api/my-endpoint', async (request, reply) => {
    return { message: 'Hello World' };
  });
}
```

**2. Register in server.ts:**
```typescript
// backend/server.ts
import { myRoutes } from './routes/myRoute';

app.register(myRoutes);
```

### Available API Endpoints

**Analytics:**
- `GET /api/analytics/shop-metrics`
- `POST /api/analytics/conversion`
- `GET /api/analytics/trends`

**Products:**
- `POST /api/products/create`
- `PUT /api/products/:id`
- `GET /api/products/:id/analyze`

**Payments:**
- `POST /api/payments/verify`
- `GET /api/payments/success-rate`

**Marketing:**
- `POST /api/marketing/email/generate`
- `POST /api/marketing/social/post`

**Full list:** See [Tool Reference & Architecture](#tool-reference--architecture)

### Rate Limiting

**Default:** 100 requests/minute per IP

**Configuration:**
```typescript
// backend/server.ts
import rateLimit from '@fastify/rate-limit';

app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});
```

---

## Frontend & Build

### Frontend Architecture

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── tools/         # Tool components
│   │   ├── dashboard/     # Dashboard
│   │   └── settings/      # Settings
│   ├── services/          # API services
│   ├── stores/            # State management
│   ├── hooks/             # Custom hooks
│   ├── types/             # TypeScript types
│   └── App.tsx            # Main app
├── public/                # Static assets
└── vite.config.ts         # Vite configuration
```

### Build Frontend

```bash
cd frontend
npm run build
```

**Output:** `frontend/dist/`

### Development Mode

```bash
cd frontend
npm run dev
```

**Hot-reload enabled** - Changes appear immediately.

### Environment Variables (Frontend)

**File:** `frontend/.env`

```bash
VITE_BACKEND_URL=http://localhost:3000
VITE_APP_VERSION=6.0.0
```

**Access in code:**
```typescript
const backendUrl = import.meta.env.VITE_BACKEND_URL;
```

---

## Debugging & Logs

### Where are the logs?

**Development:**
- Backend: Terminal output
- Frontend: Browser console

**Production (Docker):**
- Backend: `docker-compose logs app`
- Nginx: `docker-compose logs nginx`

**Log files:**
- `backend/data/logs/app.log`
- `backend/data/logs/error.log`

### Log Levels

```typescript
// backend/logger.ts
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
```

**Set log level:**
```bash
LOG_LEVEL=debug npm run dev
```

### Common Debug Scenarios

#### WooCommerce Connection Failed

**Check:**
```bash
curl -X GET "https://your-shop.com/wp-json/wc/v3/system_status" \
  -u "ck_xxxxx:cs_xxxxx"
```

**Expected:** 200 OK with system status

#### OpenAI API Error

**Check:**
```bash
curl -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer sk-xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'
```

**Expected:** 200 OK with completion

#### Frontend can't connect to Backend

**Check:**
1. Backend is running: `curl http://localhost:3000/api/health`
2. CORS enabled in backend
3. `VITE_BACKEND_URL` correct in frontend/.env

---

## Performance & Optimization

### Backend Performance

**Caching:**
```typescript
// Cache WooCommerce requests
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 300 }); // 5 min

const cachedData = cache.get('key');
if (cachedData) return cachedData;

const freshData = await fetchFromWooCommerce();
cache.set('key', freshData);
```

**Database connection pooling:**
```typescript
// Use connection pooling for better performance
const pool = new Pool({
  max: 20,
  connectionTimeoutMillis: 2000,
});
```

### Frontend Performance

**Code splitting:**
```typescript
// Lazy load components
const ToolComponent = lazy(() => import('./components/tools/MyTool'));
```

**Memoization:**
```typescript
const expensiveCalculation = useMemo(() => {
  return heavyComputation(data);
}, [data]);
```

### Monitoring

**Health endpoint:**
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": 123456,
  "checks": {
    "cpu": { "status": "ok", "value": 45 },
    "memory": { "status": "ok", "value": 60 },
    "apis": {
      "woocommerce": "ok",
      "openai": "ok"
    }
  }
}
```

---

## Deployment & Updates

### Production Deployment

**1. Build:**
```bash
npm run build:all
```

**2. Deploy with Docker:**
```bash
docker-compose -f docker-compose.production.yml up -d
```

**3. Verify:**
```bash
curl https://your-domain.com/api/health
```

### Update Procedure

**Zero-downtime update:**

```bash
# Pull latest code
git pull origin master

# Build new container
docker-compose build --no-cache app

# Rolling update (old container stays until new is ready)
docker-compose up -d --no-deps app

# Verify new container
docker-compose logs app
```

**See also:** [DEPLOYMENT.md](DEPLOYMENT.md) for Kubernetes deployment

### SSL/TLS Configuration

**Using Let's Encrypt:**

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d your-domain.com

# Auto-renewal
certbot renew --dry-run
```

---

## Security & Authentication

### API Authentication

**JWT Tokens:**
```typescript
// Generate token
const token = jwt.sign({ userId: 123 }, SECRET, { expiresIn: '1h' });

// Verify token
const decoded = jwt.verify(token, SECRET);
```

### Rate Limiting

**Per endpoint:**
```typescript
fastify.post('/api/heavy-operation', {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: '1 minute'
    }
  }
}, handler);
```

### Secrets Management

**Never commit secrets!**

✅ Use `.env.production` (in .gitignore)  
✅ Use environment variables  
✅ Use secrets manager (AWS Secrets, Azure Key Vault)  

❌ Never hardcode API keys  
❌ Never commit `.env.production`

### CORS Configuration

```typescript
// backend/server.ts
app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
});
```

---

## Testing & Quality

### Test Structure

```
tests/
├── unit/              # 187 unit tests
│   ├── tools/
│   ├── services/
│   └── utils/
├── integration/       # 156 integration tests
│   ├── api/
│   └── woocommerce/
├── e2e/              # 48 E2E tests
│   └── playwright/
└── setup.ts          # Test configuration
```

### Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Write a Test

```typescript
// tests/unit/tools/shop-metrics.test.ts
import { describe, it, expect } from 'vitest';
import { shopMetrics } from '@/tools/analytics/shop-metrics';

describe('Shop Metrics Tool', () => {
  it('should fetch metrics from WooCommerce', async () => {
    const result = await shopMetrics({
      dateRange: { start: '2026-01-01', end: '2026-01-31' }
    });
    
    expect(result).toHaveProperty('revenue');
    expect(result).toHaveProperty('orders');
    expect(result.revenue).toBeGreaterThan(0);
  });
});
```

### Test Coverage

**Current:** 92%

**Target:** 95%+

**View report:**
```bash
npm run test:coverage
open coverage/index.html
```

---

## Tool Reference & Architecture

> **For Developers:** This section shows **what the tools do** (customer perspective) and **how they're technically built** (developer perspective).

### Tool Categories Overview

A.R.I. has **51 assistive tools** in 4 categories:

| Category | Count | Backend Path | Purpose |
|----------|-------|--------------|---------|
| **Analytics** | 13 | `backend/tools/analytics/` | Data analysis, reporting, metrics |
| **Products** | 9 | `backend/tools/products/` | Product management, WooCommerce integration |
| **Payments** | 12 | `backend/tools/payments/` | Payment processing, checkout optimization |
| **Marketing** | 10 | `backend/tools/marketing/` | Content generation, email, social media |
| **Advanced** | 7 | `backend/tools/advanced/` | System tools, sync, memory |

**Important principle:** All tools are **assistive, not autonomous**. Changes only go live with user approval.

---

### Analytics Tools (13)

#### 1. Shop Metrics

**What it does:**  
Reads basic KPIs from WooCommerce (revenue, orders, conversion, customers).

**Technical Details:**
- **Backend Path:** `backend/tools/analytics/shop-metrics.ts`
- **API Endpoint:** `GET /api/analytics/shop-metrics`
- **Dependencies:** WooCommerce REST API (`/wp-json/wc/v3/reports`)
- **Response Format:**
```typescript
interface ShopMetrics {
  revenue: number;
  orders: number;
  conversion_rate: number;
  customers: number;
  avg_order_value: number;
  period: string;
}
```

**WooCommerce API Calls:**
- `GET /wp-json/wc/v3/reports/sales`
- `GET /wp-json/wc/v3/reports/orders/totals`
- `GET /wp-json/wc/v3/customers`

---

#### 2. Conversion Analysis

**What it does:**  
Analyzes conversion funnel (where do users drop off?).

**Technical Details:**
- **Backend Path:** `backend/tools/analytics/conversion-analysis.ts`
- **API Endpoint:** `POST /api/analytics/conversion`
- **Request Payload:**
```typescript
{
  dateRange: { start: string; end: string };
  funnelSteps: string[];
}
```
- **OpenAI Integration:** `gpt-4o-mini` for funnel analysis
- **Output:** Funnel report with drop-off points

---

#### 3. Feedback Analysis

**What it does:**  
Analyzes WooCommerce reviews and support tickets (via Awesome Support Plugin).

**Technical Details:**
- **Backend Path:** `backend/tools/analytics/feedback-analysis.ts`
- **API Endpoints:**
  - `GET /api/analytics/feedback`
  - `POST /api/analytics/sentiment`
- **Dependencies:**
  - WooCommerce Reviews API
  - Awesome Support REST API
- **OpenAI Call:** Sentiment analysis with GPT-4o-mini
- **Output Format:**
```typescript
interface FeedbackAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // 0-100
  insights: string[];
  priorities: Array<{issue: string; severity: 'high' | 'medium' | 'low'}>;
}
```

---

#### 4-13. Other Analytics Tools

**Quick Reference:**
- **Conversion Reported:** PDF/Excel reports
- **Trend Analysis:** Time-series analysis with Moving Average
- **Run Trend Analysis:** Manual job trigger
- **Real Analytics:** WebSocket live updates (5s interval)
- **Real Web Analytics:** Custom analytics (no Google dependency)
- **Analytic Regioning:** GeoJSON heatmaps
- **Shop Health Report:** Lighthouse + SEO + Security checks
- **Premium Audit:** GPT-4o-mini market analysis
- **Standard Audit:** Performance + SEO + UX
- **Mini Audit:** Quick check (< 30s)

---

### Products Tools (9)

#### 14. Auto Product Creator

**What it does:**  
Creates marketing material for products (texts, image prompts) with AI. **Not** the product itself.

**Technical Details:**
- **Backend Path:** `backend/tools/products/auto-product-creator.ts`
- **API Endpoint:** `POST /api/products/auto-create`
- **OpenAI Call:** GPT-4o-mini for descriptions, DALL-E for image prompts
- **Request Payload:**
```typescript
{
  title: string;
  category: string;
  keywords: string[];
  tone: 'professional' | 'casual' | 'enthusiastic';
}
```
- **Output:** Description draft, image prompt (no WooCommerce upload!)

---

#### 15-16. WooCommerce Product Management

**Woo Product Create:**
- **API:** `POST /api/products/create`
- **WooCommerce:** `POST /wp-json/wc/v3/products`
- **User confirmation required**

**Woo Product Update:**
- **API:** `PUT /api/products/:id`
- **WooCommerce:** `PUT /wp-json/wc/v3/products/:id`
- **User approval needed**

---

#### 17-22. Other Product Tools

**Quick Reference:**
- **Product Analysis:** SEO + Image + Pricing + Conversion scoring
- **Categories Manager:** CRUD operations on WooCommerce categories
- **Create Freebies:** File upload via `multer`, creates downloadable product (price: 0)
- **Product Bundles:** Requires "WooCommerce Product Bundles" plugin

---

### Payments Tools (12)

**Quick Reference:**

| Tool | Endpoint | Purpose |
|------|----------|---------|
| Payment Fast | `POST /api/payments/fast` | One-click, tokenization |
| Payment Simplified | `POST /api/payments/simplify` | Fewer checkout steps |
| Payment Tester | `POST /api/payments/test` | Automated test scenarios |
| Payment Verifier | `POST /api/payments/verify` | Fraud check (BIN, AVS, CVV) |
| Payment Success | `GET /api/payments/success-rate` | Metrics dashboard |
| Payment Validation | `POST /api/payments/validate` | Luhn, expiry, CVV |
| Payment Issued Detector | `GET /api/payments/issues` | Error log parsing |
| Payment User Favor | `POST /api/payments/personalize` | Preferred methods |
| Payment Delivery | `GET /api/payments/delivery-status` | Order status webhooks |
| Payment Emergency | `POST /api/payments/emergency` | Fallback gateway |
| Payment Expansion | `POST /api/payments/expand` | Crypto, BNPL, regional |
| Payment Quick Check | `GET /api/payments/:id/status` | Transaction status |

---

### Marketing Tools (10)

#### 35. AI Email Generator

**What it does:**  
Creates email drafts with AI.

**Technical Details:**
- **Backend Path:** `backend/tools/marketing/ai-email-generator.ts`
- **API Endpoint:** `POST /api/marketing/email/generate`
- **OpenAI Call:** GPT-4o-mini
- **Request Payload:**
```typescript
{
  subject: string;
  audience: string;
  tone: 'professional' | 'casual' | 'friendly';
  length: 'short' | 'medium' | 'long';
}
```
- **Output:** HTML + Plain-Text Email

---

#### 36-44. Other Marketing Tools

**Quick Reference:**
- **German Content Generator:** GPT-4o-mini with German prompts
- **Email Marketing Automation:** Welcome/Abandoned/Winback sequences
- **Social Media Audio:** OpenAI TTS (6 voices, MP3 output)
- **Social Media Poster:** Multi-platform posts (LinkedIn, FB, IG, TikTok, X, YT)
  - **Requires:** API tokens in Settings (OAuth2/Graph API)
  - **See:** `social_media_onboarding.md` for token setup
- **Blogpost Generator:** Markdown with H2/H3, SEO-optimized
- **Image Analyzer:** OpenAI Vision for alt-text suggestions

---

### Advanced Tools (7)

**Quick Reference:**

| Tool | Path | Purpose |
|------|------|---------|
| Context Generator | `backend/tools/advanced/context-generator.ts` | Improve prompts |
| String Generator | `backend/tools/advanced/string-generator.ts` | UUIDs, passwords, test data |
| Auto Framplementator | `backend/tools/advanced/auto-framplementator.ts` | React/Next/Node boilerplates |
| WooCommerce Sync | `backend/tools/advanced/woocommerce-sync.ts` | Batch sync (products, orders, customers) |
| Memory System | `backend/tools/advanced/memory-system.ts` | In-memory context (Redis-like) |
| System Health | `backend/tools/advanced/system-health.ts` | CPU/Memory/API status (**also K8s liveness probe!**) |
| User Management | `backend/tools/advanced/user-management.ts` | Customer intelligence + personalized offers |

---

## Tool Development: Adding a New Tool

### Tool Anatomy

Every tool consists of:

1. **Backend Handler** (`backend/tools/[category]/[tool-name].ts`)
2. **API Route** (`backend/routes/tools.ts`)
3. **Frontend Component** (`frontend/src/components/tools/[ToolName].tsx`)
4. **Tool Registration** (`backend/tools/index.ts`)

### Step-by-Step: Create a New Tool

#### 1. Create Backend Handler

```typescript
// backend/tools/marketing/my-new-tool.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { openaiService } from '@/services/openaiService';

interface MyToolRequest {
  input: string;
  options: Record<string, any>;
}

export async function myNewToolHandler(
  request: FastifyRequest<{ Body: MyToolRequest }>,
  reply: FastifyReply
) {
  try {
    const { input, options } = request.body;

    // Validation
    if (!input) {
      return reply.code(400).send({ error: 'Input required' });
    }

    // Business logic
    const result = await openaiService.generate({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: input }],
    });

    return reply.send({
      success: true,
      data: result,
    });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}
```

#### 2. Register API Route

```typescript
// backend/routes/tools.ts
import { myNewToolHandler } from '@/tools/marketing/my-new-tool';

export async function toolRoutes(fastify) {
  // ... existing routes

  fastify.post('/api/tools/my-new-tool', myNewToolHandler);
}
```

#### 3. Create Frontend Component

```tsx
// frontend/src/components/tools/MyNewTool.tsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

export function MyNewTool() {
  const [input, setInput] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { input: string }) =>
      api.post('/tools/my-new-tool', data),
  });

  const handleSubmit = () => {
    mutation.mutate({ input });
  };

  return (
    <div className="tool-container">
      <h2>My New Tool</h2>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your input..."
      />
      <button onClick={handleSubmit} disabled={mutation.isPending}>
        {mutation.isPending ? 'Processing...' : 'Generate'}
      </button>
      {mutation.data && (
        <div className="result">{mutation.data.data}</div>
      )}
    </div>
  );
}
```

#### 4. Register Tool

```typescript
// backend/tools/index.ts
export const TOOLS = {
  // ... existing tools
  MY_NEW_TOOL: {
    id: 'my-new-tool',
    name: 'My New Tool',
    category: 'marketing',
    description: 'Description of what it does',
    endpoint: '/api/tools/my-new-tool',
    handler: myNewToolHandler,
  },
};
```

#### 5. Add Frontend Route

```tsx
// frontend/src/App.tsx
import { MyNewTool } from '@/components/tools/MyNewTool';

function App() {
  return (
    <Routes>
      {/* ... existing routes */}
      <Route path="/tools/my-new-tool" element={<MyNewTool />} />
    </Routes>
  );
}
```

### Best Practices for Tool Development

✅ **Input Validation:** Always validate (Zod, Joi)  
✅ **Error Handling:** Try/Catch + meaningful error messages  
✅ **Rate Limiting:** For OpenAI calls (max 10 req/min)  
✅ **Logging:** Log all tool calls (`backend/logger.ts`)  
✅ **User Approval:** Always require confirmation for WooCommerce mutations  
✅ **Testing:** Unit tests for backend handlers (`tests/unit/tools/`)  
✅ **Documentation:** Add description to User Manual

---

## Quick Fixes

### Port already in use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### `ECONNREFUSED` - Connection Error

✅ Backend running?  
✅ `VITE_BACKEND_URL` correct?  
✅ Firewall blocking port?  
✅ Docker container started?  

### TypeScript errors despite correct code

✅ VS Code TypeScript Server restart (Cmd+Shift+P → "Restart TS Server")  
✅ Delete `node_modules`, `npm install` again  
✅ `tsconfig.json` syntax correct?  

### Build fails with memory error

✅ Increase Node memory:  
```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

---

**Last Updated:** January 5, 2026  
**Version:** 2.0.0  
**Created for:** Developers & System Administrators

---

## 12. Emergency Alerting & Monitoring

### Overview

The Payment Emergency System uses **GPT-4o-mini** to analyze critical incidents and automatically sends alerts to configured channels.

---

### Supported Alerting Channels

#### 1. Slack 💬
- **Type**: Instant Messaging
- **Trigger**: All emergencies (P0-P3)
- **Format**: Rich Message with Ticket ID, Severity, Impact, Escalation Path

**Setup:**
```bash
# 1. Create Slack Incoming Webhook
# https://api.slack.com/messaging/webhooks

# 2. Add to .env
SLACK_EMERGENCY_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Slack Message Example:**
```
🚨 PAYMENT EMERGENCY

Ticket:           EMG-1733934567-A3B9F2
Priority:         CRITICAL
Severity:         P0
Customers:        1,523
Revenue at Risk:  €127,450
SLA Violation:    ❌ YES

Escalation Path:
1. L1 Support
2. Payment Lead
3. CTO
```

---

#### 2. Email 📧
- **Type**: Email Notification
- **Trigger**: All emergencies (P0-P3)
- **Format**: HTML Email with complete incident analysis

**Setup:**
```bash
# Add to .env
EMERGENCY_ALERT_EMAIL=devops@your-company.com,oncall@your-company.com
```

**Prerequisites:**
- Uses your existing email system
- Integrate in `backend/services/emailService.ts`
- SMTP configuration required

---

#### 3. PagerDuty 📟
- **Type**: Incident Management & On-Call Alerting
- **Trigger**: Only P0/P1 (Critical/High)
- **Format**: PagerDuty Event with Custom Details

**Setup:**
```bash
# 1. Create PagerDuty Service
# https://support.pagerduty.com/docs/services-and-integrations

# 2. Copy Events API v2 Integration Key

# 3. Add to .env
PAGERDUTY_INTEGRATION_KEY=your-integration-key-here
```

**PagerDuty Features:**
- ✅ Automatic incident creation for P0/P1
- ✅ On-call engineer notified immediately
- ✅ Escalation policies followed
- ✅ Custom details with Ticket ID, Impact, Revenue Risk

---

#### 4. Console Logging 📋
- **Type**: Server Console Output
- **Trigger**: Always active (all emergencies)
- **Format**: Formatted ASCII-Box Log

**No setup required** - always active!

**Console Output Example:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 PAYMENT EMERGENCY ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ticket:           EMG-1733934567-A3B9F2
Severity:         P0
Priority:         CRITICAL
Customers:        1,523
Revenue at Risk:  €127,450
SLA Violation:    YES ❌
Issue Type:       gateway-down

Escalation Path:
  1. L1 Support
  2. Payment Lead
  3. CTO

Alerts Sent: ✅ Slack notification sent, ✅ PagerDuty incident created, ✅ Email queued
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Configuration

**Backend (.env):**
```bash
# Slack
SLACK_EMERGENCY_WEBHOOK=https://hooks.slack.com/services/...

# Email
EMERGENCY_ALERT_EMAIL=devops@company.com

# PagerDuty (only for P0/P1)
PAGERDUTY_INTEGRATION_KEY=your-key-here
```

**Alert Logic:**
```typescript
// In backend/routes/app/api/payments.ts

async function sendEmergencyAlerts(analysis: any): Promise<void> {
  // 1. Slack → All emergencies
  if (process.env.SLACK_EMERGENCY_WEBHOOK) {
    await sendSlackAlert(analysis);
  }

  // 2. Email → All emergencies
  if (process.env.EMERGENCY_ALERT_EMAIL) {
    await sendEmailAlert(analysis);
  }

  // 3. PagerDuty → Only P0/P1
  if (process.env.PAGERDUTY_INTEGRATION_KEY && 
      (analysis.severity === 'P0' || analysis.severity === 'P1')) {
    await sendPagerDutyAlert(analysis);
  }

  // 4. Console → Always
  console.log('🚨 PAYMENT EMERGENCY:', analysis);
}
```

---

### Severity Levels

| Severity | Priority | PagerDuty | Description |
|----------|----------|-----------|-------------|
| **P0** | CRITICAL | ✅ Yes | Total Outage, Revenue Loss |
| **P1** | HIGH | ✅ Yes | Degraded Service, High Impact |
| **P2** | MEDIUM | ❌ No | Partial Issues, Medium Impact |
| **P3** | LOW | ❌ No | Minor Issues, Low Impact |

---

### Advanced Integration

**Jira/GitHub Issues:**
```typescript
// Jira Ticket
const jiraResponse = await fetch('https://your-domain.atlassian.net/rest/api/3/issue', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fields: {
      project: { key: 'PAYMENT' },
      summary: `[${analysis.severity}] Payment Emergency: ${analysis.metadata.issueType}`,
      description: analysis.communicationTemplate.internal,
      issuetype: { name: 'Bug' },
      priority: { name: analysis.priority }
    }
  })
});
```

**Microsoft Teams:**
```typescript
// Teams Webhook
const teamsPayload = {
  '@type': 'MessageCard',
  'title': `🚨 Payment Emergency: ${analysis.severity}`,
  'text': analysis.communicationTemplate.internal,
  'themeColor': analysis.severity === 'P0' ? 'FF3B30' : 'FF9500'
};
```

---

### Testing

**Test Emergency Alert:**
```bash
curl -X POST http://localhost:3000/api/payments/ml/emergency-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "issueType": "gateway-down",
    "description": "Payment Gateway unreachable for 10 minutes",
    "affectedCustomers": 1500,
    "financialImpact": 120000,
    "systemsAffected": ["Payment Gateway", "Checkout"]
  }'
```

**Expected Behavior:**
1. ✅ **GPT-4o-mini Analysis** runs
2. ✅ **Severity** determined (P0-P3)
3. ✅ **Slack Message** sent (if configured)
4. ✅ **PagerDuty Incident** created (P0/P1 only)
5. ✅ **Console Log** output
6. ✅ **Email** queued (if configured)

---

### Security Best Practices

1. **Never** commit Webhook URLs/Keys to Git
2. Use **Environment Variables** (.env)
3. In Production: **Secrets Management** (AWS Secrets Manager, Azure Key Vault, etc.)
4. **Rotate Keys** regularly
5. **Monitor** Failed Alerts (e.g., via Sentry)

---

### Additional Integrations

- **Discord**: Similar to Slack Webhook
- **Telegram Bot**: For mobile alerts
- **Twilio SMS**: For P0 Critical Alerts
- **Opsgenie**: Alternative to PagerDuty
- **VictorOps/Splunk**: Enterprise Incident Management

---

## 13. Machine Learning Integration

### Overview

A.R.I. features an **optional ML system** with automatic fallback to rule-based algorithms. ML features can be enabled/disabled per feature.

**Important Principle:** ML is **never mandatory** - all features have rule-based fallbacks!

---

### ML Features

A.R.I. supports 7 ML features:

| Feature | Purpose | Fallback |
|---------|---------|----------|
| **Product Recommendations** | Personalized product suggestions | Rule-based recommendations (category match) |
| **Trend Forecasting** | Sales trend prediction | Google Trends API |
| **Dynamic Pricing** | AI-based price optimization | Static pricing rules |
| **Email Optimization** | Best send time for emails | Default time (09:00 AM) |
| **Churn Prediction** | Customer churn forecasting | Activity score rules |
| **Sentiment Analysis** | Review/feedback analysis | Keyword-based sentiment detection |
| **Fraud Detection** | Payment fraud detection | Threshold-based rules |

---

### ML Configuration

#### Backend (.env)

```bash
# ML Master Switch
ML_ENABLED=true

# Features (individually activatable)
ML_PRODUCT_RECOMMENDATIONS=true
ML_TREND_FORECASTING=true
ML_DYNAMIC_PRICING=false
ML_EMAIL_OPTIMIZATION=true
ML_CHURN_PREDICTION=true
ML_SENTIMENT_ANALYSIS=true
ML_FRAUD_DETECTION=true

# Model Confidence Thresholds (0.0 - 1.0)
ML_PRODUCT_REC_MIN_CONFIDENCE=0.7
ML_TREND_MIN_CONFIDENCE=0.6
ML_EMAIL_MIN_CONFIDENCE=0.65

# Fallback Behavior
ML_PRODUCT_REC_FALLBACK=true
ML_TREND_FALLBACK=true
ML_EMAIL_FALLBACK=true
ML_EMAIL_DEFAULT_TIME=09:00

# Performance
ML_MAX_INFERENCE_TIME=5000  # Timeout in ms
ML_CACHE_RESULTS=true
ML_CACHE_TTL=3600  # Seconds
```

#### Frontend Settings (UI)

Users can configure ML features via **Settings → ML Settings**:

**URL:** `/settings/ml`

**Features:**
- ✅ ML Master Switch (Enable/Disable all)
- ✅ Individual feature toggles
- ✅ Confidence threshold sliders
- ✅ Fallback configuration
- ✅ Live ML stats (success rate, avg confidence)

---

### ML Service Architecture

#### Automatic Fallback Pattern

```typescript
// backend/ml/mlService.ts

import { MLService } from './ml/mlService';

// Example: Product Recommendations
const result = await MLService.predict(
  'productRecommendations',
  
  // ML Function
  async () => {
    const prediction = await ProductRecommendationEngine.predict(userId);
    return {
      prediction,
      confidence: 0.85,
      source: 'ml',
      inferenceTime: 120,
      modelVersion: '1.0.0'
    };
  },
  
  // Fallback Function (when ML fails or confidence too low)
  async () => {
    return getRuleBasedRecommendations(userId);
  }
);

// Result always has this structure:
interface MLPrediction<T> {
  prediction: T;
  confidence: number;
  source: 'ml' | 'rules' | 'fallback';
  inferenceTime: number; // ms
  modelVersion?: string;
}
```

**Fallback Logic:**
1. ✅ ML disabled → Immediate fallback
2. ✅ ML timeout (> 5s) → Fallback
3. ✅ ML error → Fallback + error logging
4. ✅ Confidence < threshold → Fallback
5. ✅ Fallback disabled → Use ML result anyway

---

### ML Models

#### 1. Product Recommendation Engine

**Path:** `backend/ml/models/productRecommendation.ts`

**Input:**
- User ID
- Purchase history
- Browsing behavior
- Cart items

**Output:**
```typescript
{
  recommendations: [
    { productId: 123, score: 0.89, reason: 'Frequently Bought Together' },
    { productId: 456, score: 0.76, reason: 'Similar Category' }
  ],
  confidence: 0.85
}
```

**Fallback:** Rule-based (category match, bestsellers)

---

#### 2. Trend Forecasting Engine

**Path:** `backend/ml/models/trendForecasting.ts`

**Input:**
- Historical sales data (30-90 days)
- Seasonality
- External trends (optional: Google Trends)

**Output:**
```typescript
{
  forecast: [
    { date: '2026-02-01', sales: 15000, confidence: 0.82 },
    { date: '2026-02-02', sales: 16200, confidence: 0.79 }
  ],
  trend: 'upward' | 'stable' | 'downward',
  confidence: 0.78
}
```

**Fallback:** Google Trends API + Moving Average

---

#### 3. Email Send Time Optimization

**Path:** `backend/ml/models/emailSendTime.ts`

**Input:**
- User timezone
- Email open history
- Click-through rates
- Industry benchmarks

**Output:**
```typescript
{
  optimalTime: '14:30',
  expectedOpenRate: 0.42,
  confidence: 0.71
}
```

**Fallback:** Default time (09:00 AM)

---

### ML API Endpoints

#### GET /api/ml/config
```bash
curl http://localhost:3000/api/ml/config

# Response:
{
  "enabled": true,
  "features": {
    "productRecommendations": true,
    "trendForecasting": true,
    ...
  },
  "models": {
    "productRecommendation": {
      "enabled": true,
      "minConfidence": 0.7
    }
  }
}
```

#### POST /api/ml/config
```bash
curl -X POST http://localhost:3000/api/ml/config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "features": {
      "productRecommendations": true,
      "trendForecasting": false
    }
  }'
```

#### GET /api/ml/status
```bash
curl http://localhost:3000/api/ml/status

# Response:
{
  "enabled": true,
  "activeFeatures": ["productRecommendations", "emailOptimization"],
  "featureCount": 2,
  "models": {
    "productRecommendation": {
      "enabled": true,
      "minConfidence": 0.7
    }
  }
}
```

#### GET /api/ml/stats
```bash
curl http://localhost:3000/api/ml/stats

# Response:
{
  "success": true,
  "data": {
    "totalPredictions": 1234,
    "successRate": 0.94,
    "avgConfidence": 0.78,
    "avgInferenceTime": 145,
    "byFeature": {
      "productRecommendations": {
        "count": 856,
        "successRate": 0.96,
        "avgConfidence": 0.82
      }
    }
  }
}
```

---

### ML Testing

#### Unit Tests (22 Tests ✅)

**Path:** `tests/unit/ml/mlService.test.ts`

```typescript
import { MLService } from '@/ml/mlService';
import { mlConfig } from '@/config/ml.config';

describe('ML Service', () => {
  it('should use ML when enabled and confidence above threshold', async () => {
    mlConfig.enabled = true;
    mlConfig.features.productRecommendations = true;

    const mlFunction = vi.fn().mockResolvedValue({
      prediction: ['product1', 'product2'],
      confidence: 0.85,
      source: 'ml',
      inferenceTime: 100
    });

    const fallbackFunction = vi.fn();

    const result = await MLService.predict(
      'productRecommendations',
      mlFunction,
      fallbackFunction
    );

    expect(mlFunction).toHaveBeenCalled();
    expect(fallbackFunction).not.toHaveBeenCalled();
    expect(result.source).toBe('ml');
    expect(result.confidence).toBe(0.85);
  });

  it('should fallback when confidence below threshold', async () => {
    mlConfig.enabled = true;
    
    const mlFunction = vi.fn().mockResolvedValue({
      prediction: ['product1'],
      confidence: 0.4, // Below threshold (0.7)
      source: 'ml',
      inferenceTime: 100
    });

    const fallbackFunction = vi.fn().mockResolvedValue(['fallback1', 'fallback2']);

    const result = await MLService.predict(
      'productRecommendations',
      mlFunction,
      fallbackFunction
    );

    expect(fallbackFunction).toHaveBeenCalled();
    expect(result.source).toBe('fallback');
  });

  it('should timeout ML inference after max time', async () => {
    mlConfig.enabled = true;
    mlConfig.performance.maxInferenceTime = 100;

    const mlFunction = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 200))
    );

    const fallbackFunction = vi.fn().mockResolvedValue(['fallback']);

    const result = await MLService.predict(
      'productRecommendations',
      mlFunction,
      fallbackFunction
    );

    expect(result.source).toBe('fallback');
  });
});
```

**Test Coverage:** 92% for ML Service

---

### ML in Production

#### Performance Monitoring

```typescript
// backend/services/mlStats.ts

export function recordMlEvent(feature: string, success: boolean, confidence: number) {
  events.push({
    feature,
    success,
    confidence,
    timestamp: Date.now()
  });
}

// Usage in ML Service:
const result = await MLService.predict(...);
recordMlEvent('productRecommendations', true, result.confidence);
```

#### Health Checks

```bash
# Check if ML works
curl http://localhost:3000/api/ml/status

# Check if predictions run
curl http://localhost:3000/api/ml/stats
```

#### Debugging

**Enable Verbose Logging:**
```bash
# In .env
LOG_LEVEL=debug
DEBUG=ml:*
```

**Check ML Logs:**
```bash
docker compose logs backend | grep "ML prediction"

# Expected Output:
# ✅ ML prediction for productRecommendations: confidence=0.85, time=120ms
# ⚠️ ML confidence 0.45 below threshold 0.7, using fallback
```

---

### Common ML Issues

#### ML not working

**Check:**
1. `ML_ENABLED=true` in .env?
2. Feature flag enabled? (`ML_PRODUCT_RECOMMENDATIONS=true`)
3. Backend restarted after .env changes?
4. Check logs: `docker compose logs backend | grep ML`

**Fix:**
```bash
# Check .env
cat .env | grep ML_

# Restart backend
docker compose restart backend

# Check status
curl http://localhost:3000/api/ml/status
```

---

#### ML always in fallback mode

**Cause:** Confidence below threshold

**Check:**
```bash
curl http://localhost:3000/api/ml/stats

# Check avgConfidence
```

**Fix:** Lower threshold
```bash
# In .env
ML_PRODUCT_REC_MIN_CONFIDENCE=0.5  # Default: 0.7
```

---

#### ML timeout errors

**Cause:** Inference takes > 5s

**Fix:** Increase timeout
```bash
# In .env
ML_MAX_INFERENCE_TIME=10000  # 10 seconds
```

---

### Best Practices

✅ **Always implement fallback** - Never ML-only without fallback  
✅ **Test confidence thresholds** - Start with 0.6-0.7, then optimize  
✅ **Monitor ML stats** - Regularly check `/api/ml/stats`  
✅ **Use feature flags** - Enable ML per feature individually  
✅ **Enable caching** - Performance boost for frequent predictions  
✅ **Configure timeouts** - Never wait longer than 5s  
✅ **Enable logging** - For debugging and monitoring  

❌ **Never:** Use ML without .env configuration  
❌ **Never:** Enable all features at once (test first!)  
❌ **Never:** Disable fallback in production  
