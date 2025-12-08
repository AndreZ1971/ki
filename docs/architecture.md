## TODO: Feedback Analysis Route

Die Route `/api/analytics/feedback` ist aktuell auskommentiert, da die Datei `tools/feedbackAnalysis.ts`/`.js` fehlt.

**Wichtig:** Die Datei muss nachgereicht oder implementiert werden, damit die Feedback-Analyse wieder funktioniert.

Siehe auch: Auskommentierung in `backend/server.ts`.# System-Architektur - WooCommerce AI Agent

## Übersicht

Das WooCommerce AI Agent System ist eine vollständig integrierte, KI-gestützte Automatisierungsplattform für E-Commerce. Das System besteht aus drei Hauptkomponenten: Backend (AI Agent), Frontend (Admin Dashboard) und externe Integrationen (WooCommerce, WordPress, OpenAI).

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  - Admin Dashboard                                          │
│  - Analytics Visualisierung                                 │
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
```

---

## 1. Backend-Architektur

### 1.1 Core-Komponenten

#### **AI Agent System** (`backend/agent/`)

**Planner** (`planner.ts`):
- **Funktion**: GPT-4-basierte Planning Engine
- **Aufgaben**:
  - Analysiert Benutzeranfragen
  - Erstellt mehrstufige Aktionspläne
  - Wählt passende Tools aus
  - Orchestriert Tool-Aufrufe
- **Modell**: GPT-4 mit Tool-Use Support
- **Context Window**: 128k Tokens

**Memory** (`memory.ts`):
- **Funktion**: Konversations-Kontext Management
- **Features**:
  - Message History Storage
  - Context Window Management
  - Memory Statistics
  - Persistent Storage Option
- **Kapazität**: Dynamisch basierend auf Token-Limit

**Tools** (`tools.ts`):
- **Funktion**: Tool-Registry und Wrapper
- **Tool-Kategorien**:
  1. **WooCommerce Tools**: Product CRUD, Orders, Analytics
  2. **WordPress Tools**: Posts, Media, Users
  3. **OpenAI Tools**: Content Generation, Image Generation
  4. **Job Tools**: Automated Workflows
  5. **Google Tools**: Trends Analysis, Search Data
- **Interface**: Standardisiertes Tool-Interface für AI Agent

#### **Job System** (`backend/agent/jobs/`)

**Automatisierte Jobs** (44 verschiedene Job-Typen):

1. **Product Management**:
   - `autoProductCreator.ts` - Automatische Produkterstellung
   - `wooCreateProduct.ts` - Einzelprodukt erstellen
   - `wooUpdateProduct.ts` - Produkt aktualisieren
   - `bundles.ts` - Produkt-Bundles erstellen
   - `createFreebie.ts` - Freebie-Produkte generieren
   - `kitsTemplates.ts` - Produkt-Kits Template-System

2. **Content Generation**:
   - `aiContentGenerator.ts` - AI-basierte Content-Generierung
   - `germanContentGenerator.ts` - Deutsche Inhalte generieren
   - `aiImageGenerator.ts` - DALL-E Bild-Generierung

3. **Analytics & Reporting**:
   - `analyticsReporting.ts` - Analytics-Berichte
   - `realAnalyticsReporting.ts` - Real-Time Analytics
   - `realWooCommerceAnalytics.ts` - WooCommerce Echtzeit-Daten
   - `conversionAnalysis.ts` - Conversion-Analyse
   - `conversionReport.ts` - Conversion-Berichte
   - `trendAnalysis.ts` - Trend-Analyse
   - `googleTrendsService.ts` - Google Trends Integration

4. **Marketing Automation**:
   - `emailMarketingAutomation.ts` - E-Mail-Marketing
   - `socialMediaAutomation.ts` - Social Media Automation
   - `socialMediaAutoPoster.ts` - Auto-Posting
   - `contentMonetizer.ts` - Content-Monetarisierung
   - `freeToPaidConverter.ts` - Free-to-Paid Conversion

5. **Payment & Debugging**:
   - `paymentDebugger.ts` - Payment Debugging
   - `paymentFixer.ts` - Payment Problem Fixing
   - `paymentEmergency.ts` - Notfall-Payment-Fixes
   - `paymentLiveFixer.ts` - Live Payment Fixes
   - `paymentQuickCheck.ts` - Schnelle Payment-Checks
   - `paymentSimpleFix.ts` - Einfache Payment-Fixes
   - `paymentSuccess.ts` - Payment Success Handling
   - `paymentSuccessValidator.ts` - Payment Validierung
   - `paymentTester.ts` - Payment Testing
   - `paymentVerifier.ts` - Payment Verifizierung
   - `paymentIssueDetector.ts` - Issue Detection
   - `paymentFixCompanion.ts` - Fix Companion

6. **Shop Health & Audits**:
   - `shopHealthReport.ts` - Shop Health Reports
   - `miniAudit.ts` - Mini Shop Audit
   - `standardAudit.ts` - Standard Shop Audit
   - `premiumAudit.ts` - Premium Shop Audit
   - `autoFixImplementer.ts` - Automatische Fehlerkorrektur

**Job Scheduler** (`scheduler.ts`):
- **Engine**: Node-Cron
- **Features**:
  - Zeitgesteuerte Job-Ausführung
  - Wiederkehrende Tasks
  - Job-Priorisierung
  - Fehlerbehandlung mit Retry

---

### 1.2 Error-Handling System

**Vollständiges Resilience-System** (`backend/error-handling/`):

#### **Circuit Breaker** (`circuit-breaker.ts`)

**Funktion**: Schutz vor Kaskadenfehlern

**States**:
```
CLOSED → OPEN → HALF_OPEN → CLOSED
  ↓       ↓         ↓          ↓
Normal  Block   Test    Recovered
```

**Vorkonfigurierte Circuit Breaker**:
- `wooCommerceBreaker` - WooCommerce API Protection
- `wordPressBreaker` - WordPress API Protection
- `openAIBreaker` - OpenAI API Protection

**Konfiguration**:
```typescript
{
  failureThreshold: 5,      // Fehler bis OPEN
  successThreshold: 2,      // Erfolge bis CLOSED
  timeout: 60000,           // Timeout in ms
  halfOpenRequests: 3       // Requests in HALF_OPEN
}
```

#### **Retry Strategies** (`retry-strategies.ts`)

**Funktion**: Automatisches Retry mit Exponential Backoff

**Strategien**:
1. **standardRetry** - Standard (3 Versuche, 1s initial)
2. **aggressiveRetry** - Aggressiv (5 Versuche, 500ms initial)
3. **conservativeRetry** - Konservativ (3 Versuche, 2s initial)
4. **openAIRetry** - OpenAI-optimiert (4 Versuche, 2s initial)

**Exponential Backoff**:
```
delay = initialDelay × factor^(attempt-1) × jitter
jitter = random(0.5, 1.0)
```

**Retryable Errors**:
- Network Errors (ECONNRESET, ETIMEDOUT, ENOTFOUND)
- HTTP 429 (Rate Limit)
- HTTP 503, 504 (Service Unavailable)

#### **Dead Letter Queue** (`dead-letter-queue.ts`)

**Funktion**: Persistierung fehlgeschlagener Jobs

**Features**:
- Disk-basierte Speicherung (`data/dlq/`)
- Automatisches Retry-Scheduling
- Max 3 Retry-Versuche
- 5-Minuten Retry-Delays
- Statistics & Monitoring

**DLQ Workflow**:
```
Job Failed → DLQ Storage → Wait 5min → Retry → Success/DLQ
```

#### **Alerting System** (`alerting.ts`)

**Funktion**: Multi-Channel Alerting

**Severity Levels**:
- `INFO` - Informative Meldungen
- `WARNING` - Warnungen
- `ERROR` - Fehler
- `CRITICAL` - Kritische Fehler

**Alerting Channels**:
1. **Console** - Immer aktiv
2. **Email** - Nodemailer (SMTP)
3. **Slack** - Webhook Integration
4. **Webhooks** - Custom Endpoints

**Features**:
- Rate Limiting (max 10 Alerts/Minute)
- Alert Aggregation (dedupe in 1-Minute Window)
- HTML Email Templates
- Slack Formatted Messages

---

### 1.3 API-Integrationen

#### **WooCommerce Client** (`backend/woocommerce/client.ts`)

**Features**:
- OAuth 1.0a Authentication
- Full CRUD Support (GET, POST, PUT, DELETE)
- Circuit Breaker Protection
- Automatic Retry
- Error Alerting
- Connection Pooling (Keep-Alive)

**Geschützte Methoden**:
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
- Tool Interface Kompatibilität

#### **OpenAI Wrapper** (`backend/utils/openai.ts`)

**Features**:
- OpenAI SDK Client
- Circuit Breaker Protection (`openAIBreaker`)
- OpenAI-optimierte Retry Strategy (`openAIRetry`)
- 120s Timeout für GPT-4/DALL-E
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

### 1.4 API-Routen

**Struktur** (`backend/routes/app/api/`):

```
/app/api/
├── analytics/
│   ├── metrics/
│   │   └── shop-metrics.ts       # Shop-Metriken
│   └── reviews.ts                # Review-Analysen
├── products/
│   ├── woocommerce.ts            # WooCommerce Products
│   ├── product-management.ts     # Product Management
│   ├── categories.ts             # Kategorien
│   ├── bundles.ts                # Produkt-Bundles
│   ├── freebies.ts               # Freebies
│   └── optimizer/
│       └── product-optimizer.ts  # Product Optimizer
├── email/
│   └── email-sender.ts           # Email Versand
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
    └── customers.ts              # WooCommerce Kunden
```

---

## 2. Frontend-Architektur

### 2.1 Technologie-Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: Shadcn/ui (Radix UI + Tailwind CSS)
- **Routing**: React Router v6
- **State Management**: React Hooks (useState, useEffect)
- **HTTP Client**: Fetch API
- **TypeScript**: Strict Mode

### 2.2 Komponenten-Struktur

**Pages** (`frontend/src/pages/`):

1. **Analytics & Metrics**:
   - `AnalyseMetrics/ConversionAnalysis.tsx`
   - `AnalyseMetrics/ConversionReported.tsx`
   - `AnalyseMetrics/RealAnalytics.tsx`
   - `AnalyseMetrics/RealWebAnalytics.tsx`
   - `AnalyseMetrics/TrendAnalysis.tsx`

2. **Product Management**:
   - `ProductManagement/CategoriesManager.tsx`
   - `ProductManagement/product-generator.tsx`
   - `ProductManagement/bundles-manager.tsx`
   - `ProductManagement/freebies-manager.tsx`

3. **Marketing & Content**:
   - `MarketingContent/ai-email-generator.tsx`
   - `MarketingContent/social-media-automation.tsx`

4. **System & Health**:
   - `SystemHealth/system-monitor.tsx`
   - `SystemHealth/shop-health-report.tsx`

**Components** (`frontend/src/components/`):
- Wiederverwendbare UI-Komponenten
- Shadcn/ui Integration
- Responsive Design

---

## 3. Datenfluss

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

## 4. Technologie-Stack

### 4.1 Backend

| Kategorie | Technologie | Version | Verwendung |
|-----------|-------------|---------|------------|
| **Runtime** | Node.js | 18+ | Server Runtime |
| **Framework** | Fastify | 5.2.1 | REST API Server |
| **Language** | TypeScript | 5.8.3 | Type-Safe Development |
| **AI** | OpenAI SDK | Latest | GPT-4, DALL-E, Embeddings |
| **HTTP Client** | Axios | 1.7.9 | External API Calls |
| **Scheduler** | Node-Cron | 3.0.3 | Job Scheduling |
| **Testing** | Vitest | 2.1.8 | Unit & Integration Tests |
| **Linting** | ESLint | 9.18.0 | Code Quality |
| **Process Manager** | PM2 | 5.4.3 | Production Process Management |

### 4.2 Frontend

| Kategorie | Technologie | Version | Verwendung |
|-----------|-------------|---------|------------|
| **Framework** | React | 18.3.1 | UI Framework |
| **Build Tool** | Vite | 6.0.5 | Fast Build Tool |
| **UI Library** | Shadcn/ui | Latest | Component Library |
| **CSS** | Tailwind CSS | 3.4.17 | Utility-First CSS |
| **Routing** | React Router | 7.1.1 | Client-Side Routing |
| **Icons** | Lucide React | 0.468.0 | Icon Library |

### 4.3 DevOps

| Kategorie | Technologie | Verwendung |
|-----------|-------------|------------|
| **Container** | Docker | Containerization |
| **Orchestration** | Docker Compose | Multi-Container Management |
| **Auto-Update** | Watchtower | Automatic Container Updates |
| **Git Hooks** | Husky | Pre-Commit Hooks |
| **Code Formatting** | Prettier | Code Formatting |

---

## 5. Sicherheit

### 5.1 API-Sicherheit

**Authentication**:
- WooCommerce: OAuth 1.0a
- WordPress: Basic Auth (Username + App Password)
- OpenAI: API Key

**Weitere Sicherheitsmaßnahmen**:
- CORS Configuration
- Helmet.js (Security Headers)
- Rate Limiting (Fastify Rate Limit)
- Input Validation
- Secrets in Environment Variables

### 5.2 Error Handling Security

**Keine sensiblen Daten in Logs**:
- API Keys werden gefiltert
- Passwörter nicht geloggt
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
- Critical Errors sofort
- Warning Digest (stündlich)

**Slack Alerts** (Development):
- Webhook Integration
- Formatted Messages mit Severity Colors
- Error Stack Traces
- Metadata als Fields

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

## 7. Skalierung & Performance

### 7.1 Ressourcen-Optimierung

**Node.js Memory**:
- `--max-old-space-size=2048` (2GB Heap)
- Automatic Garbage Collection
- Memory Monitoring

**Connection Pooling**:
- HTTP/HTTPS Keep-Alive Agents
- Persistent Connections zu APIs
- Reduced Overhead

**Circuit Breaker**:
- Verhindert Ressourcen-Verschwendung
- Fail-Fast bei Service-Ausfällen
- Automatic Recovery

### 7.2 Horizontal Scaling

**Docker Compose Scaling**:
```bash
docker-compose up --scale ki-agent=3
```

**Load Balancing**:
- Nginx/Traefik als Reverse Proxy
- Round-Robin Load Balancing
- Health Check Integration

### 7.3 Caching-Strategien

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
feat: neue Feature
fix: Bug-Fix
docs: Dokumentation
refactor: Code Refactoring
test: Tests hinzufügen
chore: Build/Dependencies
```

### 8.3 Testing

**Test-Typen**:
- Unit Tests (Vitest)
- Integration Tests
- E2E Tests (Playwright - geplant)

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

✅ Environment Variables konfiguriert  
✅ Error-Handling aktiviert (setupErrorHandling())  
✅ Alerting konfiguriert (Email/Slack)  
✅ Health Checks funktionieren  
✅ Docker Compose läuft  
✅ Watchtower für Auto-Updates  
✅ Logs-Rotation konfiguriert  
✅ Backup-Strategie für DLQ  

---

## 10. Roadmap & Future Enhancements

### 10.1 Geplante Features

- [ ] **Kubernetes Deployment** - K8s Manifests & Helm Charts
- [ ] **Prometheus Metrics** - Metrics Export für Monitoring
- [ ] **GraphQL API** - Alternative zu REST
- [ ] **WebSocket Support** - Real-Time Updates
- [ ] **Multi-Tenancy** - Multiple WooCommerce Shops
- [ ] **AI Agent Workflows** - Visual Workflow Editor
- [ ] **Advanced Analytics** - Predictive Analytics mit ML

### 10.2 Performance Optimierungen

- [ ] **Redis Caching** - Distributed Cache
- [ ] **Database Integration** - PostgreSQL für Persistent Storage
- [ ] **Queue System** - Bull/BullMQ für Job Queue
- [ ] **CDN Integration** - CloudFlare/CloudFront
- [ ] **API Gateway** - Kong/Tyk für Rate Limiting & Analytics

---

## 11. Support & Maintenance

### 11.1 Troubleshooting

**Circuit Breaker OPEN**:
- Prüfe External API Status
- Checke Network Connectivity
- Review Error Logs
- Manuelles Reset möglich

**DLQ voll**:
- Prüfe Failed Jobs
- Manuelle Retry möglich
- Job-Parameter korrigieren
- DLQ bereinigen

**High Memory Usage**:
- Node.js Heap Size erhöhen
- Memory Leaks prüfen
- Garbage Collection forcieren

### 11.2 Logs

**Log-Locations**:
- Docker: `docker-compose logs`
- File System: `/app/logs/`
- DLQ: `/app/data/dlq/`

**Log-Levels**:
- `info` - Normal Operations
- `warn` - Warnings
- `error` - Errors
- `debug` - Debug Information

---

## Zusammenfassung

Das WooCommerce AI Agent System ist eine **production-ready**, **resilient** und **skalierbare** Automatisierungsplattform mit:

✅ **Vollständiges Error-Handling** (Circuit Breaker, Retry, DLQ, Alerting)  
✅ **44 automatisierte Jobs** für E-Commerce-Automatisierung  
✅ **GPT-4 AI Agent** für intelligente Planung & Execution  
✅ **Multi-Channel Integrationen** (WooCommerce, WordPress, OpenAI)  
✅ **Production-hardened** mit Monitoring & Alerting  
✅ **Docker-ready** mit Auto-Update Support  

**Version**: 1.8.0  
**Stand**: November 2025  
**Autor**: AndreZ1971
