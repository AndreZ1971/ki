# System Architecture - WooCommerce AI Agent

<!-- Last Updated: 2025-12-16 | Status: current -->
<!-- Feedback Analysis route active: registered at /api/analytics/feedback per ackend/server.ts -->

## Overview

The WooCommerce AI Agent system is a fully integrated, AI-powered automation platform for e-commerce. It comprises three main components: Backend (AI Agent), Frontend (admin dashboard), and external integrations (WooCommerce, WordPress, OpenAI).

`
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  - Admin Dashboard                                          │
│  - Analytics Visualization                                  │
│  - Product Management UI                                    │
│  - Marketing Content Generator                              │
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
`

---

## 1. Backend architecture

### 1.1 Core components

#### AI Agent System (ackend/agent/)

**Planner** (planner.ts):
- **Function**: GPT-4-based planning engine
- **Responsibilities**:
  - Analyzes user requests
  - Builds multi-step action plans
  - Picks suitable tools
  - Orchestrates tool calls
- **Model**: GPT-4 with tool-use support
- **Context window**: 128k tokens

**Memory** (memory.ts):
- **Function**: Conversation context management
- **Features**:
  - Message history storage
  - Context window management
  - Memory statistics
  - Optional persistent storage
- **Capacity**: Dynamic based on token limit

**Tools** (	ools.ts):
- **Function**: Tool registry and wrappers
- **Tool categories**:
  1. WooCommerce tools: product CRUD, orders, analytics
  2. WordPress tools: posts, media, users
  3. OpenAI tools: content generation, image generation
  4. Job tools: automated workflows
  5. Google tools: trends analysis, search data
- **Interface**: Standardized tool interface for the AI Agent

#### Specialization system (ackend/services/)

**SpecializationPersistenceManager** (specializationPersistenceManager.ts):
- **Function**: Persistent storage of AI specializations
- **Features**:
  - Filesystem-based persistence (JSON)
  - SHA-256 integrity checks
  - CRUD operations
  - Active/fallback management
  - Corruption recovery
- **Storage structure**:
  - index.json - global inventory
  - ctive.json - active specializations
  - allback.json - fallback specializations
  - {userId}/{specId}.json - specialization data
  - {userId}/{specId}.meta.json - metadata and checksums

**SpecializationAutoLoad** (specializationAutoLoad.ts):
- **Function**: Automatic load on server start
- **Features**:
  - In-memory cache for active specializations
  - State management (not-started → loading → loaded/failed)
  - Fallback mechanisms
  - Reload and invalidation
  - Validation for all specializations
- **Performance**: < 5ms cache hit, ~10–20ms disk load

**TestSpecializationBackupManager** (security/testSpecializationBackupManager.ts):
- **Function**: Encrypted storage of test specializations
- **Encryption**: AES-256-GCM
- **Features**:
  - Unique IV per encryption
  - Authentication tag for tamper detection
  - Original hash preservation
  - Backup and restore
- **See**: [SPECIALIZATION_PERSISTENCE_SYSTEM.md](./SPECIALIZATION_PERSISTENCE_SYSTEM.md)

#### Job system (ackend/agent/jobs/)

**Automated jobs** (44 job types):

1. **Product Management**:
   - utoProductCreator.ts - automatic product creation
   - wooCreateProduct.ts - create single product
   - wooUpdateProduct.ts - update product
   - undles.ts - create product bundles
   - createFreebie.ts - generate freebie products
   - kitsTemplates.ts - product kits template system

2. **Content Generation**:
   - iContentGenerator.ts - AI-based content generation
   - germanContentGenerator.ts - generate German content
   - iImageGenerator.ts - DALL-E image generation

3. **Analytics and Reporting**:
   - nalyticsReporting.ts - analytics reports
   - 
ealAnalyticsReporting.ts - real-time analytics
   - 
ealWooCommerceAnalytics.ts - WooCommerce real-time data
  - conversionAnalysis.ts - conversion analysis
   - conversionReport.ts - conversion reports
   - 	rendAnalysis.ts - trend analysis
   - googleTrendsService.ts - Google Trends integration

4. **Marketing Automation**:
   - mailMarketingAutomation.ts - email marketing
   - socialMediaAutomation.ts - social media automation
   - socialMediaAutoPoster.ts - auto-posting
   - contentMonetizer.ts - content monetization
   - reeToPaidConverter.ts - free-to-paid conversion

5. **Payment and Debugging**:
   - paymentDebugger.ts - payment debugging
   - paymentFixer.ts - payment issue fixing
   - paymentEmergency.ts - emergency payment fixes
   - paymentLiveFixer.ts - live payment fixes
   - paymentQuickCheck.ts - quick payment checks
   - paymentSimpleFix.ts - simple payment fixes
   - paymentSuccess.ts - payment success handling
   - paymentSuccessValidator.ts - payment validation
   - paymentTester.ts - payment testing
   - paymentVerifier.ts - payment verification
   - paymentIssueDetector.ts - issue detection
   - paymentFixCompanion.ts - fix companion

6. **Shop Health and Audits**:
   - shopHealthReport.ts - shop health reports
   - miniAudit.ts - mini shop audit
   - standardAudit.ts - standard shop audit
   - premiumAudit.ts - premium shop audit
   - utoFixImplementer.ts - automatic remediation

**Job Scheduler** (scheduler.ts):
- **Engine**: Node-Cron
- **Features**:
  - Time-based job execution
  - Recurring tasks
  - Job prioritization
  - Error handling with retry

---

### 1.2 Error-handling system

**Complete resilience system** (ackend/error-handling/):

#### Circuit Breaker (circuit-breaker.ts)

**Function**: Protect against cascading failures

**States**:
`
CLOSED → OPEN → HALF_OPEN → CLOSED
  ↓       ↓         ↓          ↓
Normal  Block    Test     Recovered
`

**Preconfigured circuit breakers**:
- wooCommerceBreaker - WooCommerce API protection
- wordPressBreaker - WordPress API protection
- openAIBreaker - OpenAI API protection

**Configuration**:
`	ypescript
{
  failureThreshold: 5,      // Failures until OPEN
  successThreshold: 2,      // Successes until CLOSED
  timeout: 60000,           // Timeout in ms
  halfOpenRequests: 3       // Requests in HALF_OPEN
}
`

#### Retry strategies (
etry-strategies.ts)

**Function**: Automatic retry with exponential backoff

**Strategies**:
1. standardRetry - standard (3 attempts, 1s initial)
2. ggressiveRetry - aggressive (5 attempts, 500ms initial)
3. conservativeRetry - conservative (3 attempts, 2s initial)
4. openAIRetry - OpenAI-optimized (4 attempts, 2s initial)

**Exponential backoff**:
`
delay = initialDelay × factor^(attempt-1) × jitter
jitter = random(0.5, 1.0)
`

**Retryable errors**:
- Network errors (ECONNRESET, ETIMEDOUT, ENOTFOUND)
- HTTP 429 (rate limit)
- HTTP 503, 504 (service unavailable)

#### Dead Letter Queue (dead-letter-queue.ts)

**Function**: Persist failed jobs

**Features**:
- Disk-based storage (data/dlq/)
- Automatic retry scheduling
- Max 3 retry attempts
- 5-minute retry delays
- Statistics and monitoring

**DLQ workflow**:
`
Job Failed → DLQ Storage → Wait 5min → Retry → Success/DLQ
`

#### Alerting system (lerting.ts)

**Function**: Multi-channel alerting

**Severity levels**:
- INFO - informational
- WARNING - warnings
- ERROR - errors
- CRITICAL - critical errors

**Alerting channels**:
1. Console - always on
2. Email - Nodemailer (SMTP)
3. Slack - webhook integration
4. Webhooks - custom endpoints

**Features**:
- Rate limiting (max 10 alerts/minute)
- Alert aggregation (dedupe in 1-minute window)
- HTML email templates
- Slack formatted messages

---

### 1.3 API integrations

#### WooCommerce client (ackend/woocommerce/client.ts)

**Features**:
- OAuth 1.0a authentication
- Full CRUD support (GET, POST, PUT, DELETE)
- Circuit breaker protection
- Automatic retry
- Error alerting
- Connection pooling (keep-alive)

**Exposed methods**:
`	ypescript
get(endpoint: string): Promise<T>
post(endpoint: string, data: any): Promise<T>
put(endpoint: string, data: any): Promise<T>
delete(endpoint: string): Promise<T>
getCircuitState(): CircuitState
getCircuitStats(): CircuitBreakerStats
`

#### WordPress tools (ackend/tools/wp.ts)

**Tools**:
- wpGet - GET requests (circuit breaker + retry)
- wpPost - POST/PUT/PATCH/DELETE requests (circuit breaker + retry)
- wpMediaUpload - media upload (5 min timeout, circuit breaker)

**Authentication**: Basic Auth (username + app password)

**Features**:
- HTTP/HTTPS keep-alive connections
- Automatic error alerting
- Tool interface compatibility

#### OpenAI wrapper (ackend/utils/openai.ts)

**Features**:
- OpenAI SDK client
- Circuit breaker protection (openAIBreaker)
- OpenAI-optimized retry strategy (openAIRetry)
- 120s timeout for GPT-4/DALL-E
- Rate limit handling (429 errors)
- Error alerting

**Wrapper**:
`	ypescript
executeOpenAI<T>(
  operation: () => Promise<T>,
  operationName: string,
  metadata?: Record<string, unknown>
): Promise<T>
`

---

### 1.4 API routes

**Structure** (ackend/routes/app/api/):

`
/app/api/
├── analytics/
│   ├── conversion.ts             # Conversion analytics APIs
│   ├── regioning.ts              # Regional analytics APIs
│   ├── ml-insights.ts            # ML/AI insights APIs
│   ├── trends.ts                 # Trend analysis APIs
│   ├── real-time.ts              # Real-time analytics APIs
│   ├── metrics/
│   │   └── shop-metrics.ts       # Shop metrics
│   └── reviews.ts                # Review analysis
├── audit/
│   └── mini.ts                   # Mini audit APIs
├── products/
│   ├── woocommerce.ts            # WooCommerce products
│   ├── product-management.ts     # Product management
│   ├── categories.ts             # Categories
│   ├── bundles.ts                # Product bundles
│   ├── freebies.ts               # Freebies
│   └── optimizer/
│       └── product-optimizer.ts  # Product optimizer
├── email/
│   └── email-sender.ts           # Email sending
├── ai/
│   └── email/
│       └── ai-email.ts           # AI email generator
├── marketing/
│   └── marketing-routes.ts       # Marketing automation
├── system/
│   ├── health/
│   │   └── system.ts             # System health
│   └── memory/
│       └── memory.ts             # Memory stats
└── woocommerce/
    └── customers.ts              # WooCommerce customers
`

#### Analytics API endpoints

**Conversion Analytics** (/api/analytics/conversion):
- GET /analysis - fetch conversion rates and funnel data
- POST /analyze - perform detailed conversion analysis
- GET /funnel - conversion funnel visualization with stage data

**Regional Analytics** (/api/analytics/regioning):
- GET /data?region={region} - regional performance data by region
- POST /ml-analysis - ML-based insights for a specific region
- GET /comparison - multi-region comparison with benchmarks

**ML/AI Insights** (/api/analytics/ml):
- GET /report - fetch ML-generated analytics reports
- POST /generate - generate AI-based analysis for custom data
- POST /report-insights - extract detailed insights from report data

**Trend Analysis** (/api/analytics/trends):
- GET /analyze/:keyword - trend score and data for a single keyword
- POST /analyze - batch trend analysis for multiple keywords
- GET /products - identify trending products with trend scores
- POST /report - comprehensive trend report with recommendations

**Real-time Analytics** (/api/analytics/real-time):
- GET /dashboard - real-time dashboard overview
- GET /sales - current sales (last 24 hours)
- GET /visitors - current visitors and session data
- GET /performance - performance metrics (load times, error rate)
- GET /products - top products in real time with sales figures

**Audit APIs** (/api/audit/mini):
- GET / - run a mini audit (quick shop health check)
- POST /scan - scan the shop and identify critical issues
- GET /summary - audit summary with prioritized recommendations

---

## 2. Frontend architecture

### 2.1 Technology stack

- Framework: React 18
- Build Tool: Vite
- UI Library: Shadcn/ui (Radix UI + Tailwind CSS)
- Routing: React Router v6
- State Management: React Hooks (useState, useEffect)
- HTTP Client: Fetch API
- TypeScript: Strict mode

### 2.2 Component structure

**Pages** (rontend/src/pages/):

1. **Analytics and Metrics**:
  - AnalyseMetrics/ConversionAnalysis.tsx
  - AnalyseMetrics/ConversionReported.tsx
  - AnalyseMetrics/RealAnalytics.tsx
  - AnalyseMetrics/RealWebAnalytics.tsx
  - AnalyseMetrics/TrendAnalysis.tsx

2. **Product Management**:
  - ProductManagement/CategoriesManager.tsx
  - ProductManagement/product-generator.tsx
  - ProductManagement/bundles-manager.tsx
  - ProductManagement/freebies-manager.tsx

3. **Marketing and Content**:
  - MarketingContent/ai-email-generator.tsx
  - MarketingContent/social-media-automation.tsx

4. **System and Health**:
  - SystemHealth/system-monitor.tsx
  - SystemHealth/shop-health-report.tsx

**Components** (rontend/src/components/):
- Reusable UI components
- Shadcn/ui integration
- Responsive design

---

## 3. Data flow

### 3.1 Standard request flow

`
User → Frontend → Backend API → Error Handling → External API → Response
  ↓                   ↓               ↓                ↓           ↓
React               Fastify    Circuit Breaker    WooCommerce   Success
Component           Route      + Retry Strategy    WordPress     /Error
                                + Alerting         OpenAI
`

### 3.2 Agent request flow

`
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
                          └────────────┬────────────┘
                                       ↓
                                  Agent Response
                                       ↓
                                  Frontend Display
`

### 3.3 Job execution flow

`
Scheduler (Cron) → Job Trigger → executeWithFullProtection()
                        ↓                    ↓
                   Job Logic    Circuit Breaker + Retry + DLQ
                        ↓                    ↓
                   API Calls           Error Handling
                        ↓                    ↓
              Success/Failure          Alerting System
                        ↓                    ↓
                   Job Complete    Email/Slack Notification
`

---

## 4. Technology stack

### 4.1 Backend

| Category        | Technology | Version | Usage                      |
| --------------- | ---------- | ------- | -------------------------- |
| Runtime         | Node.js    | 18+     | Server runtime             |
| Framework       | Fastify    | 5.2.1   | REST API server            |
| Language        | TypeScript | 5.8.3   | Type-safe development      |
| AI              | OpenAI SDK | Latest  | GPT-4, DALL-E, embeddings  |
| HTTP Client     | Axios      | 1.7.9   | External API calls         |
| Scheduler       | Node-Cron  | 3.0.3   | Job scheduling             |
| Testing         | Vitest     | 2.1.8   | Unit and integration tests |
| Linting         | ESLint     | 9.18.0  | Code quality               |
| Process Manager | PM2        | 5.4.3   | Production process manager |

### 4.2 Frontend

| Category  | Technology  | Version | Usage               |
| --------- | ----------- | ------- | ------------------- |
| Framework | React       | 18.3.1  | UI framework        |
| Build Tool| Vite        | 6.0.5   | Fast build tool     |
| UI Library| Shadcn/ui   | Latest  | Component library   |
| CSS       | Tailwind CSS| 3.4.17  | Utility-first CSS   |
| Routing   | React Router| 7.1.1   | Client-side routing |
| Icons     | Lucide React| 0.468.0 | Icon library        |

### 4.3 DevOps

| Category        | Technology    | Usage                      |
| --------------- | --------------| -------------------------- |
| Container       | Docker         | Containerization           |
| Orchestration   | Docker Compose | Multi-container management |
| Auto-Update     | Watchtower     | Automatic container updates|
| Git Hooks       | Husky          | Pre-commit hooks           |
| Code Formatting | Prettier       | Code formatting            |

---

## 5. Security

### 5.1 API security

**Authentication**:
- WooCommerce: OAuth 1.0a
- WordPress: Basic Auth (username + app password)
- OpenAI: API key

**Additional measures**:
- CORS configuration
- Helmet.js (security headers)
- Rate limiting (Fastify Rate Limit)
- Input validation
- Secrets in environment variables

### 5.2 Error handling security

**No sensitive data in logs**:
- API keys are filtered
- Passwords not logged
- Error messages sanitized

### 5.3 Environment variables

**Production secrets**:
`nv
OPENAI_API_KEY=sk-...
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...
WORDPRESS_APP_PASSWORD=...
SMTP_PASS=...
SLACK_WEBHOOK_URL=...
`

---

## 6. Monitoring and observability

### 6.1 Error-handling monitoring

**Circuit Breaker Stats**:
`	ypescript
{
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN',
  failures: number,
  successes: number,
  lastFailureTime: Date,
  nextAttemptTime: Date
}
`

**Dead Letter Queue Stats**:
`	ypescript
{
  totalMessages: number,
  readyForRetry: number,
  messagesByJobType: Record<string, number>
}
`

### 6.2 Alerting channels

**Email Alerts** (Production):
- SMTP via Nodemailer
- HTML templates
- Critical errors immediately
- Hourly warning digest

**Slack Alerts** (Development):
- Webhook integration
- Formatted messages with severity colors
- Error stack traces
- Metadata as fields

**Console Logs** (Development):
- Colored console output
- Severity-based formatting
- Timestamps

### 6.3 Health checks

**Docker Health Check**:
`ash
node 
`

**API Health Endpoint**:
`
GET /api/health
`

**System Metrics**:
`
GET /api/system/health/system
`

---

## 7. Scaling and performance

### 7.1 Resource optimization

**Node.js Memory**:
- --max-old-space-size=2048 (2GB heap)
- Automatic garbage collection
- Memory monitoring

**Connection Pooling**:
- HTTP/HTTPS keep-alive agents
- Persistent connections to APIs
- Reduced overhead

**Circuit Breaker**:
- Prevents resource waste
- Fail-fast on service outages
- Automatic recovery

### 7.2 Horizontal scaling

**Docker Compose Scaling**:
`ash
docker-compose up --scale ki-agent=3
`

**Load Balancing**:
- Nginx/Traefik as reverse proxy
- Round-robin load balancing
- Health check integration

### 7.3 Caching strategies

**WooCommerce Data Caching**:
- Product data cache
- Category cache
- Analytics cache

**Response Caching**:
- ETag support
- Cache-Control headers
- Conditional requests

---

## 8. Development workflow

### 8.1 Development setup

`ash
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
`

### 8.2 Git workflow

**Branch Strategy**:
- master - production-ready code
- develop - development branch
- Feature branches: eature/xyz
- Bugfix branches: ugfix/xyz

**Commit Convention**:
`
feat: new feature
fix: bug fix
`
`
docs: documentation
refactor: code refactoring
test: add tests
chore: build/dependencies
`

### 8.3 Testing

**Test types**:
- Unit tests (Vitest)
- Integration tests
- E2E tests (Playwright - planned)

**Test coverage**:
`ash
npm run test:coverage
`

---

## 9. Deployment

### 9.1 Docker deployment

**Build**:
`ash
docker build -t woo-ki-agent .
`

**Run**:
`ash
docker-compose up -d
`

**Logs**:
`ash
docker-compose logs -f ki-agent
`

### 9.2 Production checklist

✅ Environment variables configured  
✅ Error handling activated (setupErrorHandling())  
✅ Alerting configured (email/Slack)  
✅ Health checks working  
✅ Docker Compose running  
✅ Watchtower for auto-updates  
✅ Log rotation configured  
✅ Backup strategy for DLQ  

---

## 10. Roadmap and future enhancements

### 10.1 Planned features

- [ ] Kubernetes deployment - K8s manifests and Helm charts
- [ ] Prometheus metrics - metrics export for monitoring
- [ ] GraphQL API - alternative to REST
- [ ] WebSocket support - real-time updates
- [ ] Multi-tenancy - multiple WooCommerce shops
- [ ] AI Agent workflows - visual workflow editor
- [ ] Advanced analytics - predictive analytics with ML

### 10.2 Performance optimizations

- [ ] Redis caching - distributed cache
- [ ] Database integration - PostgreSQL for persistent storage
- [ ] Queue system - Bull/BullMQ for job queue
- [ ] CDN integration - CloudFlare/CloudFront
- [ ] API gateway - Kong/Tyk for rate limiting and analytics

---

## 11. Support and maintenance

### 11.1 Troubleshooting

**Circuit Breaker OPEN**:
- Check external API status
- Check network connectivity
- Review error logs
- Manual reset possible

**DLQ full**:
- Check failed jobs
- Manual retry possible
- Fix job parameters
- Clean DLQ

**High memory usage**:
- Increase Node.js heap size
- Check for memory leaks
- Force garbage collection

### 11.2 Logs

**Log locations**:
- Docker: docker-compose logs
- File system: /app/logs/
- DLQ: /app/data/dlq/

**Log levels**:
- info - normal operations
- warn - warnings
- rror - errors
- debug - debug information

---

## Summary

The WooCommerce AI Agent system is a production-ready, resilient, and scalable automation platform with:

✅ Comprehensive error handling (circuit breaker, retry, DLQ, alerting)  
✅ 44 automated jobs for e-commerce automation  
✅ GPT-4 AI Agent for intelligent planning and execution  
✅ Multi-channel integrations (WooCommerce, WordPress, OpenAI)  
✅ Production-hardened with monitoring and alerting  
✅ Docker-ready with auto-update support  

**Version**: 1.8.0  
**As of**: November 2025  
**Author**: AndreZ1971
