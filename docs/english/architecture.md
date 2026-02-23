<!-- Last Updated: 2026-01-05 | Status: Production Ready -->
<!-- Complete ML/AI Integration: 52/52 Tools (100%) with AI Features -->
# System Architecture - A.R.I. (Artificial Retail Intelligence)

## Overview

A.R.I. is a fully integrated, AI-powered automation platform for e-commerce with 52 tools and 100% ML/AI integration. The system consists of three main components: Backend (AI Agent), Frontend (Admin Dashboard), and external integrations (WooCommerce, WordPress, OpenAI, Social Media APIs).

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  - AI Dashboard (52 Tools)                                  │
│  - Analytics Visualization (9 Tools)                        │
│  - Product Management UI (8 Tools)                          │
│  - Marketing Content Generator (10 Tools)                   │
│  - Payment & Finances (13 Tools)                            │
│  - Advanced AI (12 Tools)                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────────────┐
│              Backend (Node.js + Fastify)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           AI Agent Core System                      │   │
│  │  - Planner (GPT-4 Planning Engine)                  │   │
│  │  - Memory Management (Conversation Context)         │   │
│  │  - Tools (WooCommerce, WordPress, OpenAI)           │   │
│  │  - Job Scheduler (Cron-based Automation)            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │       Error Handling & Resilience                   │   │
│  │  - Circuit Breaker (Service Protection)             │   │
│  │  - Retry Strategies (Exponential Backoff)           │   │
│  │  - Dead Letter Queue (Failed Job Recovery)          │   │
│  │  - Multi-Channel Alerting (Email, Slack, Webhook)   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼────┐  ┌─────▼─────┐  ┌───▼────────┐
│ WooCommerce│  │ WordPress │  │  OpenAI    │
│  REST API  │  │ REST API  │  │    API     │
│            │  │           │  │            │
│ - Products │  │ - Posts   │  │ - GPT-4    │
│ - Orders   │  │ - Media   │  │ - DALL-E   │
│ - Analytics│  │ - Users   │  │ - Embedding│
└────────────┘  └───────────┘  └────────────┘
```

---

## 1. Backend Architecture

### 1.1 Core Components

#### **AI Agent System** (`backend/agent/`)

**Planner** (`planner.ts`):
- **Function**: GPT-4-based Planning Engine
- **Tasks**:
  - Analyzes user requests
  - Creates multi-step action plans
  - Selects appropriate tools
  - Orchestrates tool calls
- **Model**: GPT-4 with Tool-Use Support
- **Context Window**: 128k Tokens

**Memory** (`memory.ts`):
- **Function**: Conversation Context Management
- **Features**:
  - Message History Storage
  - Context Window Management
  - Memory Statistics
  - Persistent Storage Option
- **Capacity**: Dynamic based on Token-Limit

**Tools** (`tools.ts`):
- **Function**: Tool Registry and Wrapper
- **Tool Categories**:
  1. **WooCommerce Tools**: Product CRUD, Orders, Analytics
  2. **WordPress Tools**: Posts, Media, Users
  3. **OpenAI Tools**: Content Generation, Image Generation
  4. **Job Tools**: Automated Workflows
  5. **Google Tools**: Trends Analysis, Search Data
- **Interface**: Standardized Tool Interface for AI Agent

#### **Specialization System** (`backend/services/`)

**SpecializationPersistenceManager** (`specializationPersistenceManager.ts`):
- **Function**: Persistent storage of AI specializations
- **Features**:
  - Filesystem-based persistence (JSON)
  - SHA-256 Integrity checks
  - CRUD operations
  - Active/Fallback management
  - Corruption recovery
- **Storage Structure**:
  - `index.json` - Global inventory
  - `active.json` - Active specializations
  - `fallback.json` - Fallback specializations
  - `{userId}/{specId}.json` - Specialization data
  - `{userId}/{specId}.meta.json` - Metadata & Checksums

**SpecializationAutoLoad** (`specializationAutoLoad.ts`):
- **Function**: Automatic loading on server start
- **Features**:
  - In-memory cache for active specialization
  - State management (not-started → loading → loaded/failed)
  - Fallback mechanisms
  - Reload & invalidation
  - Validation for all specializations
- **Performance**: < 5ms Cache-Hit, ~10-20ms Disk-Load

**TestSpecializationBackupManager** (`security/testSpecializationBackupManager.ts`):
- **Function**: Encrypted storage of test specializations
- **Encryption**: AES-256-GCM
- **Features**:
  - Unique IV per encryption
  - Authentication tag for tamper detection
  - Original hash preservation
  - Backup & restore
- **See**: [SPECIALIZATION_PERSISTENCE_SYSTEM.md](./SPECIALIZATION_PERSISTENCE_SYSTEM.md)

#### **Job System** (`backend/agent/jobs/`)

**Automated Jobs** (52 different tool types):

**Note**: All tools work assistive, not autonomous. Changes require user approval.

1. **Product Management** (8 Tools):
   - `ProductAnalyzer.tsx` - Product Health Check with AI Insights
   - `ProductAnalysis.tsx` - Product analysis with Notes feature (Autosave, Character Counter)
   - `AutoProductCreator.tsx` - AI-powered marketing material generation
   - `WooProductCreate.tsx` - WooCommerce product creation
   - `WooProductUpdate.tsx` - Product updates with AI (Trends, Reddit sentiment)
   - `CategoriesManager.tsx` - AI category suggestions with ML
   - `CreateFreebies.tsx` - Freebie generation with conversion prediction
   - `ProductBundles.tsx` - Bundle planning with AI suggestions

2. **Marketing & Content** (10 Tools):
   - `AIEmailGenerator.tsx` - AI email drafts (Welcome, Promo, Winback)
   - `GermanContentGenerator.tsx` - German longform/shortform texts
   - `EmailMarketingAutomation.tsx` - Campaign automation
   - `SocialMediaAudio.tsx` - AI script + TTS audio for social clips
   - `SocialMediaPoster.tsx` - OAuth API integration (6 platforms)
   - `FreeToPostConverter.tsx` - Activation campaigns
   - `ContentMonetized.tsx` - Price recommendations + product text AI
   - `KiteTemplates.tsx` - Template management with AI
   - `BlogpostGenerator.tsx` - SEO-optimized blog posts
   - `ImageAnalyzer.tsx` - Image analysis (quality, tags, SEO)

3. **Analytics** (9 Tools):
   - `TrendAnalysis.tsx` - AI trend analysis with insights
   - `RunTrendAnalysis.tsx` - Trend job trigger
   - `RealAnalytics.tsx` - Real-time analytics with AI
   - `ShopMetrics.tsx` - ML-based shop KPIs
   - `ConversionAnalysis.tsx` - ML funnel analysis
   - `ConversionReported.tsx` - Report engine with ML
   - `AnalyticRegioning.tsx` - Regional performance AI
   - `ShopHealthReport.tsx` - ML health check
   - `PremiumAudit.tsx` / `StandardAudit.tsx` / `MiniAudit.tsx` - AI Audits

4. **Payment & Finances** (13 Tools):
   - `PaymentFast.tsx` - Fraud detection + smart suggestions
   - `PaymentSimplified.tsx` - ML-optimized checkout flow
   - `PaymentTester.tsx` - AI test plan generation
   - `PaymentVerifier.tsx` - ML transaction verification
   - `PaymentSuccess.tsx` - Confidence scoring
   - `PaymentValidation.tsx` - Security analysis with AI
   - `PaymentIssuesDetector.tsx` - Auto-categorization
   - `PaymentUserFavor.tsx` - GPT-4o-mini personalization
   - `PaymentDelivery.tsx` - ML delivery predictions
   - `PaymentEmergency.tsx` - GPT-4o-mini emergency analysis
   - `PaymentExpansion.tsx` - GPT-4o-mini business planning
   - `PaymentQuickCheck.tsx` - AI quick scanner
   - `MLPaymentAnalyzer.tsx` - Dedicated AI component

5. **Advanced AI** (12 Tools):
   - `ContextGenerator.tsx` - AI context generation
   - `StringGenerator.tsx` - Intelligent string generation
   - `AutoFramplementator.tsx` - Framework implementation with AI
   - `WooCommerceSync.tsx` - ML-optimized sync
   - `MemorySystem.tsx` - Persistent AI memory
   - `SystemHealth.tsx` - Monitoring with alerts
   - `UserManagement.tsx` - AI customer segmentation
   - `FeedbackAnalysis.tsx` - Sentiment analysis (reviews + tickets)
   - `RealWebAnalytics.tsx` - Multi-source trend AI
   - Additional 3 advanced tools

**New Features (December 2025 - January 2026)**:
   - ✅ Product Notes Feature (Autosave, Character Counter, Quick Templates)
   - ✅ Rate-Limiting Protection (useEffect Cleanup)
   - ✅ OpenAI Description Overflow Fix (500 chars limit)
   - ✅ IP-Block Prevention (404 Monitoring)
   - ✅ Social Media OAuth Integration (6 platforms)
   - ✅ GDPR-compliant AI tools (OpenAI 30-day retention notice)

**Job Scheduler** (`scheduler.ts`):
- **Engine**: Node-Cron
- **Features**:
  - Time-controlled job execution
  - Recurring tasks
  - Job prioritization
  - Error handling with retry

---

### 1.2 Error-Handling System

**Complete Resilience System** (`backend/error-handling/`):

### **Circuit Breaker** (`circuit-breaker.ts`)

**Function**: Protection against cascade failures

**States**:
```
CLOSED → OPEN → HALF_OPEN → CLOSED
  ↓       ↓         ↓          ↓
Normal  Block   Test    Recovered
```

**Pre-configured Circuit Breakers**:
- `wooCommerceBreaker` - WooCommerce API Protection
- `wordPressBreaker` - WordPress API Protection
- `openAIBreaker` - OpenAI API Protection

**Configuration**:
```typescript
{
  failureThreshold: 5,      // Failures until OPEN
  successThreshold: 2,      // Successes until CLOSED
  timeout: 60000,           // Timeout in ms
  halfOpenRequests: 3       // Requests in HALF_OPEN
}
```

#### **Retry Strategies** (`retry-strategies.ts`)

**Function**: Automatic retry with exponential backoff

**Strategies**:
1. **standardRetry** - Standard (3 attempts, 1s initial)
2. **aggressiveRetry** - Aggressive (5 attempts, 500ms initial)
3. **conservativeRetry** - Conservative (3 attempts, 2s initial)
4. **openAIRetry** - OpenAI-optimized (4 attempts, 2s initial)

**Exponential Backoff**:
```
delay = initialDelay × factor^(attempt-1) × jitter
jitter = random(0.5, 1.0)
```

**Retryable Errors**:
- Network Errors (ECONNRESET, ETIMEDOUT, ENOTFOUND)
- HTTP 429 (Rate Limit)
- HTTP 503, 504 (Service Unavailable)

### **Dead Letter Queue** (`dead-letter-queue.ts`)

**Function**: Persistence of failed jobs

**Features**:
- Disk-based storage (`data/dlq/`)
- Automatic retry scheduling
- Max 3 retry attempts
- 5-minute retry delays
- Statistics & monitoring

**DLQ Workflow**:
```
Job Failed → DLQ Storage → Wait 5min → Retry → Success/DLQ
```

#### **Alerting System** (`alerting.ts`)

**Function**: Multi-channel alerting

**Severity Levels**:
- `INFO` - Informative messages
- `WARNING` - Warnings
- `ERROR` - Errors
- `CRITICAL` - Critical errors

**Alerting Channels**:
1. **Console** - Always active
2. **Email** - Nodemailer (SMTP)
3. **Slack** - Webhook integration
4. **Webhooks** - Custom endpoints

**Features**:
- Rate limiting (max 10 alerts/minute)
- Alert aggregation (dedupe in 1-minute window)
- HTML email templates
- Slack formatted messages

---

### 1.3 API Integrations

#### **WooCommerce Client** (`backend/woocommerce/client.ts`)

**Features**:
- OAuth 1.0a Authentication
- Full CRUD Support (GET, POST, PUT, DELETE)
- Circuit Breaker Protection
- Automatic Retry
- Error Alerting
- Connection Pooling (Keep-Alive)

**Protected Methods**:
```typescript
get(endpoint: string): Promise<T>
post(endpoint: string, data: any): Promise<T>
put(endpoint: string, data: any): Promise<T>
delete(endpoint: string): Promise<T>
getCircuitState(): CircuitState
getCircuitStats(): CircuitBreakerStats
```

#### **WordPress Tools** (`backend/tools/wp.ts`)

**Tools**:
- `wpGet` - GET Requests (Circuit Breaker + Retry)
- `wpPost` - POST/PUT/PATCH/DELETE Requests (Circuit Breaker + Retry)
- `wpMediaUpload` - Media Upload (5 Min Timeout, Circuit Breaker)

**Authentication**: Basic Auth (Username + App Password)

**Features**:
- HTTP/HTTPS Keep-Alive Connections
- Automatic Error Alerting
- Tool Interface Compatibility

#### **OpenAI Wrapper** (`backend/utils/openai.ts`)

**Features**:
- OpenAI SDK Client
- Circuit Breaker Protection (`openAIBreaker`)
- OpenAI-optimized Retry Strategy (`openAIRetry`)
- 120s Timeout for GPT-4/DALL-E
- Rate Limit Handling (429 Errors)
- Error Alerting

**Wrapper**:
```typescript
executeOpenAI<T>(
  operation: () => Promise<T>,
  operationName: string,
  metadata?: Record<string, unknown>
): Promise<T>
```

---

### 1.4 API Routes

**Structure** (`backend/routes/app/api/`):

```
/app/api/
├── analytics/
│   ├── conversion.ts             # Conversion Analytics APIs
│   ├── regioning.ts              # Regional Analytics APIs
│   ├── ml-insights.ts            # ML/AI Insights APIs
│   ├── trends.ts                 # Trend Analysis APIs
│   ├── real-time.ts              # Real-time Analytics APIs
│   ├── metrics/
│   │   └── shop-metrics.ts       # Shop Metrics
│   └── reviews.ts                # Review Analysis
├── audit/
│   └── mini.ts                   # Mini Audit APIs
├── products/
│   ├── woocommerce.ts            # WooCommerce Products
│   ├── product-management.ts     # Product Management
│   ├── categories.ts             # Categories
│   ├── bundles.ts                # Product Bundles
│   ├── freebies.ts               # Freebies
│   └── optimizer/
│       └── product-optimizer.ts  # Product Optimizer
├── email/
│   └── email-sender.ts           # Email Sending
├── ai/
│   └── email/
│       └── ai-email.ts           # AI Email Generator
├── marketing/
│   └── marketing-routes.ts       # Marketing Automation
├── system/
│   ├── health/
│   │   └── system.ts             # System Health
│   └── memory/
│       └── memory.ts             # Memory Stats
└── woocommerce/
    └── customers.ts              # WooCommerce Customers
```

#### **Complete API Route Overview**

**Analytics API Endpoints** (9 Tool Categories)

**Conversion Analytics** (`/api/analytics/conversion`):
- `GET /analysis` - Retrieve conversion rates and funnel data
- `POST /analyze` - Perform detailed conversion analysis
- `GET /funnel` - Conversion funnel visualization with stage data

**Regional Analytics** (`/api/analytics/regioning`):
- `GET /data?region={region}` - Regional performance data by region
- `POST /ml-analysis` - ML-based insights for specific region
- `GET /comparison` - Multi-region comparison with benchmarks

**ML/AI Insights** (`/api/analytics/ml`):
- `GET /report` - Retrieve ML-generated analytics reports
- `POST /generate` - Generate AI-based analysis for custom data
- `POST /report-insights` - Extract detailed insights from report data

**Trend Analysis** (`/api/analytics/trends`):
- `GET /analyze/:keyword` - Trend score and data for single keyword
- `POST /analyze` - Batch trend analysis for multiple keywords
- `GET /products` - Identify trending products with trend scores
- `POST /report` - Comprehensive trend report with recommendations

**Real-time Analytics** (`/api/analytics/real-time`):
- `GET /dashboard` - Real-time dashboard data (overview)
- `GET /sales` - Current sales (last 24 hours)
- `GET /visitors` - Current visitors and session data
- `GET /performance` - Performance metrics (load times, error rate)
- `GET /products` - Top products in real-time with sales numbers

**Audit APIs** (`/api/audit/mini`):
- `GET /` - Perform mini audit (quick shop health check)
- `POST /scan` - Scan shop and identify critical issues
- `GET /summary` - Audit summary with prioritized recommendations

---

## 2. Frontend Architecture

### 2.1 Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: Shadcn/ui (Radix UI + Tailwind CSS)
- **Routing**: React Router v6
- **State Management**: React Hooks (useState, useEffect)
- **HTTP Client**: Fetch API
- **TypeScript**: Strict Mode

### 2.2 Component Structure

**Pages** (`frontend/src/pages/`):

1. **Analytics & Metrics** (9 Tools):
   - `AnalyseMetrics/TrendAnalysis.tsx`
   - `AnalyseMetrics/RunTrendAnalysis.tsx`
   - `AnalyseMetrics/RealAnalytics.tsx`
   - `AnalyseMetrics/RealWebAnalytics.tsx`
   - `AnalyseMetrics/ShopMetrics.tsx`
   - `AnalyseMetrics/ConversionAnalysis.tsx`
   - `AnalyseMetrics/ConversionReported.tsx`
   - `AnalyseMetrics/AnalyticRegioning.tsx`
   - `AnalyseMetrics/ShopHealthReport.tsx`

2. **Product Management** (8 Tools):
   - `ProductManagement/ProductAnalyzer.tsx`
   - `app/ProductAnalysis.tsx` (with Notes feature)
   - `ProductManagement/AutoProductCreator.tsx`
   - `ProductManagement/WooProductCreate.tsx`
   - `ProductManagement/WooProductUpdate.tsx`
   - `ProductManagement/CategoriesManager.tsx`
   - `ProductManagement/CreateFreebies.tsx`
   - `ProductManagement/ProductBundles.tsx`

3. **Marketing & Content** (10 Tools):
   - `MarketingContent/ai-email-generator.tsx`
   - `MarketingContent/GermanContentGenerator.tsx`
   - `MarketingContent/EmailMarketingAutomation.tsx`
   - `MarketingContent/SocialMediaAudio.tsx`
   - `MarketingContent/SocialMediaPoster.tsx`
   - `MarketingContent/FreeToPostConverter.tsx`
   - `MarketingContent/ContentMonetized.tsx`
   - `MarketingContent/KiteTemplates.tsx`
   - `MarketingContent/BlogPostGenerator.tsx`
   - `MarketingContent/ImageAnalyzer.tsx`

4. **Payment & Finances** (13 Tools):
   - `PaymentFinances/PaymentFast.tsx`
   - `PaymentFinances/PaymentSimplified.tsx`
   - `PaymentFinances/PaymentTester.tsx`
   - `PaymentFinances/PaymentVerifier.tsx`
   - `PaymentFinances/PaymentSuccess.tsx`
   - `PaymentFinances/PaymentValidation.tsx`
   - `PaymentFinances/PaymentIssuesDetector.tsx`
   - `PaymentFinances/PaymentUserFavor.tsx`
   - `PaymentFinances/PaymentDelivery.tsx`
   - `PaymentFinances/PaymentEmergency.tsx`
   - `PaymentFinances/PaymentExpansion.tsx`
   - `PaymentFinances/PaymentQuickCheck.tsx`
   - `PaymentFinances/MLPaymentAnalyzer.tsx`

5. **Advanced AI** (12 Tools):
   - `Advanced/ContextGenerator.tsx`
   - `Advanced/StringGenerator.tsx`
   - `Advanced/AutoFramplementator.tsx`
   - `Advanced/WooCommerceSync.tsx`
   - `Advanced/MemorySystem.tsx`
   - `Advanced/SystemHealth.tsx`
   - `app/UserManagement.tsx`
   - `app/FeedbackAnalysis.tsx`
   - `AnalyseMetrics/RealWebAnalytics.tsx`

**Components** (`frontend/src/components/`):
- Reusable UI components
- Shadcn/ui Integration
- Responsive Design

---

## 3. Data Flow

### 3.1 Standard Request Flow

```
User → Frontend → Backend API → Error Handling → External API → Response
  ↓                   ↓               ↓                ↓           ↓
React               Fastify    Circuit Breaker    WooCommerce   Success
Component           Route      + Retry Strategy    WordPress     /Error
                                + Alerting         OpenAI
```

### 3.2 Agent Request Flow

```
User → Frontend → Backend API → AI Agent Planner
  ↓                   ↓               ↓
Request          /api/agent       GPT-4 Analysis
                                       ↓
                                  Tool Selection
                                       ↓
                          ┌────────────┴────────────┐
                          ↓                         ↓
                    WooCommerce Tool          WordPress Tool
                          ↓                         ↓
                    Circuit Breaker           Circuit Breaker
                    + Retry                   + Retry
                          ↓                         ↓
                    WooCommerce API           WordPress API
                          ↓                         ↓
                    Product Data              Post/Media Data
                          ↓                         ↓
                          └────────────┬────────────┘
                                       ↓
                                  Agent Response
                                       ↓
                                  Frontend Display
```

### 3.3 Job Execution Flow

```
Scheduler (Cron) → Job Trigger → executeWithFullProtection()
                        ↓                    ↓
                   Job Logic    Circuit Breaker + Retry + DLQ
                        ↓                    ↓
                   API Calls           Error Handling
                        ↓                    ↓
              Success/Failure          Alerting System
                        ↓                    ↓
                   Job Complete    Email/Slack Notification
```

---

## 4. Technology Stack

### 4.1 Backend

| Category            | Technology | Version | Usage                         |
| ------------------- | ----------- | ------- | ----------------------------- |
| **Runtime**         | Node.js     | 18+     | Server Runtime                |
| **Framework**       | Fastify     | 5.2.1   | REST API Server               |
| **Language**        | TypeScript  | 5.8.3   | Type-Safe Development         |
| **AI**              | OpenAI SDK  | Latest  | GPT-4, DALL-E, Embeddings     |
| **HTTP Client**     | Axios       | 1.7.9   | External API Calls            |
| **Scheduler**       | Node-Cron   | 3.0.3   | Job Scheduling                |
| **Testing**         | Vitest      | 2.1.8   | Unit & Integration Tests      |
| **Linting**         | ESLint      | 9.18.0  | Code Quality                  |
| **Process Manager** | PM2         | 5.4.3   | Production Process Management |

### 4.2 Frontend

| Category       | Technology   | Version | Usage               |
| -------------- | ------------ | ------- | ------------------- |
| **Framework**  | React        | 18.3.1  | UI Framework        |
| **Build Tool** | Vite         | 6.0.5   | Fast Build Tool     |
| **UI Library** | Shadcn/ui    | Latest  | Component Library   |
| **CSS**        | Tailwind CSS | 3.4.17  | Utility-First CSS   |
| **Routing**    | React Router | 7.5.0   | Client-Side Routing |
| **Icons**      | Lucide React | 0.468.0 | Icon Library        |
| **Animation**  | Framer Motion| Latest  | UI Animations       |

### 4.3 DevOps

| Category            | Technology     | Usage                       |
| ------------------- | -------------- | --------------------------- |
| **Container**       | Docker         | Containerization            |
| **Orchestration**   | Docker Compose | Multi-Container Management  |
| **Auto-Update**     | Watchtower     | Automatic Container Updates |
| **Git Hooks**       | Husky          | Pre-Commit Hooks            |
| **Code Formatting** | Prettier       | Code Formatting             |

---

## 5. Security

### 5.1 API Security

**Authentication**:
- WooCommerce: OAuth 1.0a
- WordPress: Basic Auth (Username + App Password)
- OpenAI: API Key

**Additional Security Measures**:
- CORS Configuration
- Helmet.js (Security Headers)
- Rate Limiting (Fastify Rate Limit)
- Input Validation
- Secrets in Environment Variables

### 5.2 Error Handling Security

**No sensitive data in logs**:
- API Keys are filtered
- Passwords not logged
- Error Messages sanitized

### 5.3 Environment Variables

**Production Secrets**:
```env
OPENAI_API_KEY=sk-...
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...
WORDPRESS_APP_PASSWORD=...
SMTP_PASS=...
SLACK_WEBHOOK_URL=...
```

---

## 6. Monitoring & Observability

### 6.1 Error-Handling Monitoring

**Circuit Breaker Stats**:
```typescript
{
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN',
  failures: number,
  successes: number,
  lastFailureTime: Date,
  nextAttemptTime: Date
}
```

**Dead Letter Queue Stats**:
```typescript
{
  totalMessages: number,
  readyForRetry: number,
  messagesByJobType: Record<string, number>
}
```

### 6.2 Alerting Channels

**Email Alerts** (Production):
- SMTP via Nodemailer
- HTML Templates
- Critical Errors immediately
- Warning Digest (hourly)

**Slack Alerts** (Development):
- Webhook Integration
- Formatted Messages with Severity Colors
- Error Stack Traces
- Metadata as Fields

**Console Logs** (Development):
- Colored Console Output
- Severity-based Formatting
- Timestamps

### 6.3 Health Checks

**Docker Health Check**:
```bash
node healthcheck.js
```

**API Health Endpoint**:
```
GET /api/health
```

**System Metrics**:
```
GET /api/system/health/system
```

---

## 7. Scaling & Performance

### 7.1 Resource Optimization

**Node.js Memory**:
- `--max-old-space-size=2048` (2GB Heap)
- Automatic Garbage Collection
- Memory Monitoring

**Connection Pooling**:
- HTTP/HTTPS Keep-Alive Agents
- Persistent Connections to APIs
- Reduced Overhead

**Circuit Breaker**:
- Prevents resource waste
- Fail-fast on service failures
- Automatic recovery

### 7.2 Horizontal Scaling

**Docker Compose Scaling**:
```bash
docker-compose up --scale ki-agent=3
```

**Load Balancing**:
- Nginx/Traefik as Reverse Proxy
- Round-Robin Load Balancing
- Health Check Integration

### 7.3 Caching Strategies

**WooCommerce Data Caching**:
- Product Data Cache
- Category Cache
- Analytics Cache

**Response Caching**:
- ETag Support
- Cache-Control Headers
- Conditional Requests

---

## 8. Development Workflow

### 8.1 Development Setup

```bash
# Installation
npm install

# Backend Development
cd backend
npm run dev

# Frontend Development
cd frontend
npm run dev

# Testing
npm run test
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Build
npm run build
```

### 8.2 Git Workflow

**Branch Strategy**:
- `master` - Production-ready Code
- `develop` - Development Branch
- Feature Branches: `feature/xyz`
- Bugfix Branches: `bugfix/xyz`

**Commit Convention**:
```
feat: new feature
fix: bug fix
docs: documentation
refactor: code refactoring
test: add tests
chore: build/dependencies
```

### 8.3 Testing

**Test Types**:
- Unit Tests (Vitest)
- Integration Tests
- E2E Tests (Playwright - planned)

**Test Coverage**:
```bash
npm run test:coverage
```

---

## 9. Deployment

### 9.1 Docker Deployment

**Build**:
```bash
docker build -t woo-ki-agent .
```

**Run**:
```bash
docker-compose up -d
```

**Logs**:
```bash
docker-compose logs -f ki-agent
```

### 9.2 Production Checklist

✅ Environment Variables configured  
✅ Error-Handling activated (setupErrorHandling())  
✅ Alerting configured (Email/Slack)  
✅ Health Checks functioning  
✅ Docker Compose running  
✅ Watchtower for Auto-Updates  
✅ Logs-Rotation configured  
✅ Backup-Strategy for DLQ  

---

## 10. Support & Maintenance

### 10.1 Troubleshooting

**Circuit Breaker OPEN**:
- Check External API Status
- Check Network Connectivity
- Review Error Logs
- Manual Reset possible

**DLQ full**:
- Check Failed Jobs
- Manual Retry possible
- Correct Job Parameters
- Clean DLQ

**High Memory Usage**:
- Increase Node.js Heap Size
- Check Memory Leaks
- Force Garbage Collection

### 10.2 Logs

**Log Locations**:
- Docker: `docker-compose logs`
- File System: `/app/logs/`
- DLQ: `/app/data/dlq/`

**Log Levels**:
- `info` - Normal Operations
- `warn` - Warnings
- `error` - Errors
- `debug` - Debug Information

---

## Summary

A.R.I. (Artificial Retail Intelligence) is a **production-ready**, **resilient** and **scalable** AI automation platform with:

✅ **52 Tools with 100% ML/AI Integration** - Fully AI-powered  
✅ **Complete Error Handling** (Circuit Breaker, Retry, DLQ, Alerting)  
✅ **GPT-4o-mini Integration** with GDPR compliance  
✅ **Multi-Channel Integrations** (WooCommerce, WordPress, OpenAI, Social Media)  
✅ **Production-hardened** with Rate-Limiting Protection  
✅ **Docker-ready** with Auto-Update Support  
✅ **Assistive, not autonomous** - All changes require user approval

**Categories**:
- Analytics: 9 Tools
- Product Management: 8 Tools  
- Payment & Finances: 13 Tools
- Marketing & Content: 10 Tools
- Advanced AI: 12 Tools

**Version**: 7.5.0  
**Date**: January 2026  
**Author**: André Zabel (AndreZ1971)
