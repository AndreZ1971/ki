<!-- Last Updated: 2026-01-05 | Status: Production Ready -->
<!-- Vollständige ML/AI-Integration: 52/52 Tools (100%) mit KI-Features -->
# System-Architektur - A.R.I. (Artificial Retail Intelligence)

## Übersicht

A.R.I. ist eine vollständig integrierte, KI-gestützte Automatisierungsplattform für E-Commerce mit 52 Tools und 100% ML/AI-Integration. Das System besteht aus drei Hauptkomponenten: Backend (AI Agent), Frontend (Admin Dashboard) und externe Integrationen (WooCommerce, WordPress, OpenAI, Social Media APIs).

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  - AI Dashboard (52 Tools)                                  │
│  - Analytics Visualisierung (9 Tools)                       │
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

#### **Specialization System** (`backend/services/`)

**SpecializationPersistenceManager** (`specializationPersistenceManager.ts`):
- **Funktion**: Persistente Speicherung von KI-Spezialisierungen
- **Features**:
  - Filesystem-basierte Persistierung (JSON)
  - SHA-256 Integritätschecks
  - CRUD-Operationen
  - Active/Fallback-Verwaltung
  - Corruption-Recovery
- **Storage-Struktur**:
  - `index.json` - Globales Inventar
  - `active.json` - Aktive Spezialisierungen
  - `fallback.json` - Fallback-Spezialisierungen
  - `{userId}/{specId}.json` - Spezialisierungs-Daten
  - `{userId}/{specId}.meta.json` - Metadata & Checksums

**SpecializationAutoLoad** (`specializationAutoLoad.ts`):
- **Funktion**: Automatisches Laden beim Server-Start
- **Features**:
  - In-Memory Cache für aktive Spezialisierung
  - State-Management (not-started → loading → loaded/failed)
  - Fallback-Mechanismen
  - Reload & Invalidation
  - Validation für alle Spezialisierungen
- **Performance**: < 5ms Cache-Hit, ~10-20ms Disk-Load

**TestSpecializationBackupManager** (`security/testSpecializationBackupManager.ts`):
- **Funktion**: Verschlüsselte Speicherung von Test-Spezialisierungen
- **Verschlüsselung**: AES-256-GCM
- **Features**:
  - Unique IV pro Encryption
  - Authentication Tag für Tamper-Detection
  - Original-Hash-Preservation
  - Backup & Restore
- **Siehe**: [SPECIALIZATION_PERSISTENCE_SYSTEM.md](./SPECIALIZATION_PERSISTENCE_SYSTEM.md)

#### **Job System** (`backend/agent/jobs/`)

**Automatisierte Jobs** (52 verschiedene Tool-Typen):

**Hinweis**: Alle Tools arbeiten assistierend, nicht autonom. Änderungen erfordern User-Freigabe.

1. **Product Management** (8 Tools):
   - `ProductAnalyzer.tsx` - Produkt-Health-Check mit AI Insights
   - `ProductAnalysis.tsx` - Produktanalyse mit Notes-Feature (Autosave, Character Counter)
   - `AutoProductCreator.tsx` - KI-gestützte Marketing-Material-Generierung
   - `WooProductCreate.tsx` - WooCommerce-Produkt erstellen
   - `WooProductUpdate.tsx` - Produkt-Updates mit AI (Trends, Reddit-Sentiment)
   - `CategoriesManager.tsx` - KI-Kategorie-Vorschläge mit ML
   - `CreateFreebies.tsx` - Freebie-Generierung mit Conversion-Prediction
   - `ProductBundles.tsx` - Bundle-Planung mit AI-Vorschlägen

2. **Marketing & Content** (10 Tools):
   - `AIEmailGenerator.tsx` - KI-E-Mail-Entwürfe (Welcome, Promo, Winback)
   - `GermanContentGenerator.tsx` - Deutsche Longform/Shortform-Texte
   - `EmailMarketingAutomation.tsx` - Kampagnen-Automatisierung
   - `SocialMediaAudio.tsx` - KI-Skript + TTS-Audio für Social Clips
   - `SocialMediaPoster.tsx` - OAuth-API-Integration (6 Plattformen)
   - `FreeToPostConverter.tsx` - Aktivierungskampagnen
   - `ContentMonetized.tsx` - Preisempfehlungen + Produkttext-KI
   - `KiteTemplates.tsx` - Template-Management mit AI
   - `BlogpostGenerator.tsx` - SEO-optimierte Blogposts
   - `ImageAnalyzer.tsx` - Bildanalyse (Qualität, Tags, SEO)

3. **Analytics** (9 Tools):
   - `TrendAnalysis.tsx` - KI-Trendanalyse mit Insights
   - `RunTrendAnalysis.tsx` - Trend-Job-Trigger
   - `RealAnalytics.tsx` - Echtzeit-Analytics mit KI
   - `ShopMetrics.tsx` - ML-basierte Shop-KPIs
   - `ConversionAnalysis.tsx` - ML-Funnel-Analyse
   - `ConversionReported.tsx` - Report-Engine mit ML
   - `AnalyticRegioning.tsx` - Regionale Performance-KI
   - `ShopHealthReport.tsx` - ML-Gesundheitscheck
   - `PremiumAudit.tsx` / `StandardAudit.tsx` / `MiniAudit.tsx` - AI-Audits

4. **Payment & Finances** (13 Tools):
   - `PaymentFast.tsx` - Betrugserkennung + Smart Suggestions
   - `PaymentSimplified.tsx` - ML-optimierter Checkout-Flow
   - `PaymentTester.tsx` - KI-Testplan-Generierung
   - `PaymentVerifier.tsx` - ML-Transaktionsverifikation
   - `PaymentSuccess.tsx` - Confidence-Scoring
   - `PaymentValidation.tsx` - Security-Analyse mit KI
   - `PaymentIssuesDetector.tsx` - Auto-Kategorisierung
   - `PaymentUserFavor.tsx` - GPT-4o-mini Personalisierung
   - `PaymentDelivery.tsx` - ML-Delivery-Predictions
   - `PaymentEmergency.tsx` - GPT-4o-mini Notfall-Analyse
   - `PaymentExpansion.tsx` - GPT-4o-mini Business-Planung
   - `PaymentQuickCheck.tsx` - KI-Quick-Scanner
   - `MLPaymentAnalyzer.tsx` - Dedizierte KI-Komponente

5. **Advanced AI** (12 Tools):
   - `ContextGenerator.tsx` - KI-Kontext-Generierung
   - `StringGenerator.tsx` - Intelligente String-Generierung
   - `AutoFramplementator.tsx` - Framework-Implementierung mit KI
   - `WooCommerceSync.tsx` - ML-optimierte Sync
   - `MemorySystem.tsx` - Persistentes KI-Memory
   - `SystemHealth.tsx` - Monitoring mit Alerts
   - `UserManagement.tsx` - KI-Kundensegmentierung
   - `FeedbackAnalysis.tsx` - Sentiment-Analyse (Reviews + Tickets)
   - `RealWebAnalytics.tsx` - Multi-Source Trend-KI
   - Weitere 3 Advanced-Tools

**Neue Features (Dezember 2025 - Januar 2026)**:
   - ✅ Product Notes Feature (Autosave, Character Counter, Quick Templates)
   - ✅ Rate-Limiting Protection (useEffect Cleanup)
   - ✅ OpenAI Description Overflow Fix (500 chars limit)
   - ✅ IP-Block Prevention (404 Monitoring)
   - ✅ Social Media OAuth Integration (6 Plattformen)
   - ✅ GDPR-konforme KI-Tools (OpenAI 30-day retention notice)

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

### **Circuit Breaker** (`circuit-breaker.ts`)

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

### **Dead Letter Queue** (`dead-letter-queue.ts`)

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
│   ├── conversion.ts             # Conversion-Analytics APIs
│   ├── regioning.ts              # Regionale Analytics APIs
│   ├── ml-insights.ts            # ML/KI Insights APIs
│   ├── trends.ts                 # Trend-Analyse APIs
│   ├── real-time.ts              # Echtzeit-Analytics APIs
│   ├── metrics/
│   │   └── shop-metrics.ts       # Shop-Metriken
│   └── reviews.ts                # Review-Analysen
├── audit/
│   └── mini.ts                   # Mini-Audit APIs
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

#### **Vollständige API-Route-Übersicht**

**Analytics API-Endpoints** (9 Tool-Kategorien)

**Conversion Analytics** (`/api/analytics/conversion`):
- `GET /analysis` - Conversion-Raten und Funnel-Daten abrufen
- `POST /analyze` - Detaillierte Conversion-Analyse durchführen
- `GET /funnel` - Conversion-Funnel-Visualisierung mit Stufen-Daten

**Regionale Analytics** (`/api/analytics/regioning`):
- `GET /data?region={region}` - Regionale Performance-Daten nach Region
- `POST /ml-analysis` - ML-basierte Insights für spezifische Region
- `GET /comparison` - Multi-Region-Vergleich mit Benchmarks

**ML/KI Insights** (`/api/analytics/ml`):
- `GET /report` - ML-generierte Analytics-Reports abrufen
- `POST /generate` - KI-basierte Analyse für Custom-Daten generieren
- `POST /report-insights` - Detaillierte Insights aus Report-Daten extrahieren

**Trend-Analyse** (`/api/analytics/trends`):
- `GET /analyze/:keyword` - Trend-Score und Daten für einzelnes Keyword
- `POST /analyze` - Batch-Trend-Analyse für mehrere Keywords
- `GET /products` - Trending Produkte mit Trend-Scores identifizieren
- `POST /report` - Umfassender Trend-Report mit Empfehlungen

**Echtzeit-Analytics** (`/api/analytics/real-time`):
- `GET /dashboard` - Real-Time Dashboard-Daten (Übersicht)
- `GET /sales` - Aktuelle Verkäufe (letzte 24 Stunden)
- `GET /visitors` - Aktuelle Besucher und Session-Daten
- `GET /performance` - Performance-Metriken (Ladezeiten, Fehlerrate)
- `GET /products` - Top-Produkte in Echtzeit mit Verkaufszahlen

**Audit APIs** (`/api/audit/mini`):
- `GET /` - Mini-Audit durchführen (schneller Shop-Health-Check)
- `POST /scan` - Shop scannen und kritische Probleme identifizieren
- `GET /summary` - Audit-Zusammenfassung mit priorisierten Empfehlungen

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
   - `app/ProductAnalysis.tsx` (mit Notes-Feature)
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

| Kategorie           | Technologie | Version | Verwendung                    |
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

| Kategorie      | Technologie  | Version | Verwendung          |
| -------------- | ------------ | ------- | ------------------- |
| **Framework**  | React        | 18.3.1  | UI Framework        |
| **Build Tool** | Vite         | 6.0.5   | Fast Build Tool     |
| **UI Library** | Shadcn/ui    | Latest  | Component Library   |
| **CSS**        | Tailwind CSS | 3.4.17  | Utility-First CSS   |
| **Routing**    | React Router | 7.1.1   | Client-Side Routing |
| **Icons**      | Lucide React | 0.468.0 | Icon Library        |
| **Animation**  | Framer Motion| Latest  | UI Animations       |

### 4.3 DevOps

| Kategorie           | Technologie    | Verwendung                  |
| ------------------- | -------------- | --------------------------- |
| **Container**       | Docker         | Containerization            |
| **Orchestration**   | Docker Compose | Multi-Container Management  |
| **Auto-Update**     | Watchtower     | Automatic Container Updates |
| **Git Hooks**       | Husky          | Pre-Commit Hooks            |
| **Code Formatting** | Prettier       | Code Formatting             |

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

## 10. Support & Maintenance

### 10.1 Troubleshooting

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

### 10.2 Logs

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

A.R.I. (Artificial Retail Intelligence) ist eine **production-ready**, **resilient** und **skalierbare** KI-Automatisierungsplattform mit:

✅ **52 Tools mit 100% ML/AI-Integration** - Vollständig KI-gestützt  
✅ **Vollständiges Error-Handling** (Circuit Breaker, Retry, DLQ, Alerting)  
✅ **GPT-4o-mini Integration** mit GDPR-Compliance  
✅ **Multi-Channel Integrationen** (WooCommerce, WordPress, OpenAI, Social Media)  
✅ **Production-hardened** mit Rate-Limiting Protection  
✅ **Docker-ready** mit Auto-Update Support  
✅ **Assistierend, nicht autonom** - Alle Änderungen erfordern User-Freigabe

**Kategorien**:
- Analytics: 9 Tools
- Product Management: 8 Tools  
- Payment & Finances: 13 Tools
- Marketing & Content: 10 Tools
- Advanced AI: 12 Tools

**Version**: 7.0.2  
**Stand**: Januar 2026  
**Autor**: André Zabel (AndreZ1971)
