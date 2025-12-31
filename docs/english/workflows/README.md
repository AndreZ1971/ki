# Agent Workflows Documentation - WooCommerce AI Agent

## Übersicht

Das WooCommerce AI Agent System verfügt über **44 automatisierte Job-Workflows** für E-Commerce-Automatisierung. Diese Jobs werden entweder zeitgesteuert (Cron), manuell oder durch Events getriggert.

---

## Job-Kategorien

1. **[Product Management](#product-management)** (11 Jobs)
2. **[Content Generation](#content-generation)** (3 Jobs)
3. **[Analytics & Reporting](#analytics--reporting)** (7 Jobs)
4. **[Marketing Automation](#marketing-automation)** (5 Jobs)
5. **[Payment Management](#payment-management)** (13 Jobs)
6. **[Shop Health & Audits](#shop-health--audits)** (5 Jobs)

---

## Job Scheduler

### Scheduler-Konfiguration

**Datei**: `backend/scheduler.ts`

**Engine**: Node-Cron (https://www.npmjs.com/package/node-cron)

**Beispiel-Konfiguration**:
```typescript
import cron from 'node-cron';

// Alle 2 Minuten
cron.schedule('*/2 * * * *', async () => {
  await ordersCheckJob();
});

// Täglich um 8:00 Uhr
cron.schedule('0 8 * * *', async () => {
  await dailyAnalyticsJob();
});

// Jeden Montag um 10:00 Uhr
cron.schedule('0 10 * * 1', async () => {
  await weeklyReportJob();
});
```

**Cron-Syntax**:
```
┌───────────── Minute (0 - 59)
│ ┌───────────── Stunde (0 - 23)
│ │ ┌───────────── Tag im Monat (1 - 31)
│ │ │ ┌───────────── Monat (1 - 12)
│ │ │ │ ┌───────────── Wochentag (0 - 7) (0 & 7 = Sonntag)
│ │ │ │ │
* * * * *
```

**Häufige Patterns**:
- `*/5 * * * *` - Alle 5 Minuten
- `0 * * * *` - Jede Stunde
- `0 0 * * *` - Täglich um Mitternacht
- `0 9 * * 1-5` - Werktags um 9:00 Uhr
- `0 0 1 * *` - Am 1. jeden Monats

---

## Product Management

### 1. Auto Product Creator

**Datei**: `backend/agent/jobs/autoProductCreator.ts`

**Zweck**: Automatische Produkterstellung basierend auf Google Trends

**Workflow**:
```
1. Google Trends Analyse
   ↓
2. Trend-Bewertung (Demand Score, Competition)
   ↓
3. Trend-Filterung (Score ≥ 70, Competition ≤ 40)
   ↓
4. AI Content-Generierung (GPT-4)
   ↓
5. Produkt-Erstellung in WooCommerce
   ↓
6. Optional: Auto-Publish
```

**Konfiguration**:
```typescript
interface AutoProductConfig {
  keyword: string;           // Haupt-Keyword
  geo: string;              // Land (DE, US, etc.)
  maxProducts: number;      // Max. Produkte pro Run
  minDemandScore: number;   // Min. Nachfrage (0-100)
  maxCompetition: number;   // Max. Wettbewerb (0-100)
  autoPublish: boolean;     // Direkt veröffentlichen?
}
```

**Beispiel**:
```typescript
await autoProductCreatorJob({
  keyword: 'digitale produkte',
  geo: 'DE',
  maxProducts: 3,
  minDemandScore: 70,
  maxCompetition: 40,
  autoPublish: false
});
```

**Output**:
```json
{
  "success": true,
  "created": 3,
  "products": [
    {
      "id": 789,
      "name": "DSGVO Checkliste 2025",
      "status": "draft",
      "trend": {
        "keyword": "dsgvo checkliste",
        "demandScore": 85,
        "competition": 30
      }
    }
  ]
}
```

**Scheduler**:
```typescript
// Täglich um 6:00 Uhr neue Trends prüfen
cron.schedule('0 6 * * *', async () => {
  await autoProductCreatorJob();
});
```

---

### 2. WooCommerce Product Creator

**Datei**: `backend/agent/jobs/wooCreateProduct.ts`

**Zweck**: Einzelnes Produkt in WooCommerce erstellen

**Workflow**:
```
1. Validierung (Name, Preis required)
   ↓
2. AI Description Generation (Optional)
   ↓
3. Image Upload (Optional)
   ↓
4. WooCommerce API Call (POST /products)
   ↓
5. Error Handling (Circuit Breaker + Retry)
```

**Input**:
```typescript
interface ProductInput {
  name: string;
  regular_price: string;
  description?: string;
  short_description?: string;
  categories?: number[];
  images?: string[];
  type?: 'simple' | 'variable' | 'grouped';
  virtual?: boolean;
  downloadable?: boolean;
  status?: 'draft' | 'publish';
}
```

**Verwendung**:
```typescript
await wooCreateProductJob({
  name: 'Premium WordPress Theme',
  regular_price: '49.99',
  type: 'simple',
  virtual: true,
  downloadable: true,
  status: 'draft'
});
```

---

### 3. WooCommerce Product Updater

**Datei**: `backend/agent/jobs/wooUpdateProduct.ts`

**Zweck**: Bestehende Produkte aktualisieren

**Workflow**:
```
1. Product ID Validation
   ↓
2. Fetch Current Product Data
   ↓
3. Merge Updates
   ↓
4. WooCommerce API Call (PUT /products/:id)
   ↓
5. Verification
```

**Beispiel**:
```typescript
await wooUpdateProductJob({
  id: 123,
  sale_price: '39.99',
  description: 'Updated description...',
  status: 'publish'
});
```

---

### 4. Product Bundles Creator

**Datei**: `backend/agent/jobs/bundles.ts`

**Zweck**: Automatische Produktbundle-Erstellung

**Workflow**:
```
1. Analyse: Top-Selling Products
   ↓
2. Bundle-Vorschläge (AI-basiert)
   ↓
3. Bundle-Produkt erstellen
   ↓
4. Discount Calculation (15-30%)
   ↓
5. Cross-Sell Configuration
```

**Bundle-Typen**:
- **Thematic Bundles**: Zusammenhängende Produkte
- **Price-Based Bundles**: Produkte in ähnlicher Preisklasse
- **Bestseller Bundles**: Top-Produkte kombiniert

**Beispiel**:
```typescript
await createBundleJob({
  type: 'thematic',
  theme: 'DSGVO Starter Pack',
  products: [123, 456, 789],
  discount: 20,
  autoPublish: false
});
```

---

### 5. Freebie Creator

**Datei**: `backend/agent/jobs/createFreebie.ts`

**Zweck**: Kostenlose Lead-Magnets erstellen

**Workflow**:
```
1. Content Topic Selection
   ↓
2. AI Content Generation (PDF/Checklist)
   ↓
3. WooCommerce Freebie Product
   ↓
4. Email Automation Setup
   ↓
5. Landing Page Integration
```

**Freebie-Typen**:
- **Checklists**: DSGVO-Checkliste, SEO-Checklist
- **Templates**: Datenschutzerklärung, Cookie-Policy
- **Guides**: "7 DSGVO-Fehler vermeiden"
- **Workbooks**: Interactive PDFs

**Beispiel**:
```typescript
await createFreebieJob({
  type: 'checklist',
  topic: 'DSGVO für Einsteiger',
  format: 'pdf',
  pages: 5,
  autoEmailSequence: true
});
```

---

### 6. Product Categories Manager

**Datei**: `backend/agent/jobs/getCategories.ts`

**Zweck**: Kategorien-Management & Optimierung

**Features**:
- Automatische Kategorie-Erstellung
- Kategorie-SEO Optimierung
- Product-Kategorisierung (AI)
- Unused Categories Cleanup

---

### 7. Kits & Templates Manager

**Datei**: `backend/agent/jobs/kitsTemplates.ts`

**Zweck**: Produkt-Kits & Templates verwalten

**Use Cases**:
- Starter-Kits für Anfänger
- Professional-Kits für Fortgeschrittene
- Industry-specific Templates

---

## Content Generation

### 8. AI Content Generator

**Datei**: `backend/agent/jobs/aiContentGenerator.ts`

**Zweck**: AI-basierte Content-Generierung mit GPT-4

**Workflow**:
```
1. Content Type Selection
   ↓
2. GPT-4 Prompt Engineering
   ↓
3. Content Generation
   ↓
4. SEO Optimization
   ↓
5. Publishing (WordPress/WooCommerce)
```

**Content-Typen**:
- **Product Descriptions**: Optimiert für Conversion
- **Blog Posts**: SEO-optimierte Artikel
- **Category Descriptions**: Kategorie-Texte
- **Email Copy**: Marketing-Emails
- **Social Media**: Posts für Facebook, Instagram, LinkedIn

**Beispiel**:
```typescript
await aiContentGeneratorJob({
  type: 'product_description',
  product: {
    name: 'DSGVO Audit Service',
    keywords: ['dsgvo', 'audit', 'compliance']
  },
  tone: 'professional',
  length: 'medium',
  language: 'de'
});
```

**Output**:
```json
{
  "success": true,
  "content": {
    "title": "Professioneller DSGVO-Audit Service",
    "description": "Unser DSGVO-Audit Service hilft Ihnen...",
    "seo_title": "DSGVO-Audit | Professionelle Compliance-Prüfung",
    "meta_description": "Stellen Sie DSGVO-Compliance sicher...",
    "keywords": ["dsgvo audit", "compliance prüfung"]
  }
}
```

---

### 9. German Content Generator

**Datei**: `backend/agent/jobs/germanContentGenerator.ts`

**Zweck**: Deutsche Content-Generierung mit lokalem SEO

**Spezialisierungen**:
- **DSGVO-Content**: Rechtssichere Texte
- **German SEO**: Lokale Keywords
- **Cultural Adaptation**: Deutsche Kundenansprache
- **Legal Compliance**: Impressum, Datenschutz

---

### 10. AI Image Generator

**Datei**: `backend/agent/jobs/aiImageGenerator.ts`

**Zweck**: Produkt-Bilder mit DALL-E generieren

**Workflow**:
```
1. Image Prompt Generation
   ↓
2. DALL-E API Call
   ↓
3. Image Download
   ↓
4. WordPress Media Upload
   ↓
5. Product Image Assignment
```

**Beispiel**:
```typescript
await aiImageGeneratorJob({
  product_id: 123,
  prompt: 'Professional GDPR compliance checklist cover',
  style: 'modern',
  dimensions: '1024x1024'
});
```

---

## Analytics & Reporting

### 11. Analytics Reporting

**Datei**: `backend/agent/jobs/analyticsReporting.ts`

**Zweck**: Automatisierte Analytics-Berichte

**Report-Typen**:
- **Daily Report**: Täglich um 8:00 Uhr
- **Weekly Report**: Montags um 9:00 Uhr
- **Monthly Report**: Am 1. des Monats
- **Custom Reports**: On-Demand

**Metriken**:
- Umsatz & Orders
- Conversion Rate
- Top Products
- Customer Acquisition
- Traffic Sources
- Bounce Rate

**Scheduler**:
```typescript
// Täglich um 8:00 Uhr
cron.schedule('0 8 * * *', async () => {
  await analyticsReportingJob({ period: 'daily' });
});

// Montags um 9:00 Uhr
cron.schedule('0 9 * * 1', async () => {
  await analyticsReportingJob({ period: 'weekly' });
});
```

---

### 12. Real-Time Analytics

**Datei**: `backend/agent/jobs/realAnalyticsReporting.ts`

**Zweck**: Echtzeit-Daten aus WooCommerce & Google Analytics

**Features**:
- Live Visitor Count
- Current Orders
- Real-Time Revenue
- Active Sessions
- Cart Abandonment Rate

---

### 13. Real WooCommerce Analytics

**Datei**: `backend/agent/jobs/realWooCommerceAnalytics.ts`

**Zweck**: WooCommerce-spezifische Echtzeit-Analysen

**Metriken**:
- Order Processing Status
- Stock Levels
- Payment Status
- Shipping Status

---

### 14. Conversion Analysis

**Datei**: `backend/agent/jobs/conversionAnalysis.ts`

**Zweck**: Detaillierte Conversion-Funnel-Analyse

**Funnel-Stages**:
```
Visitors → Product Views → Add to Cart → Checkout → Purchase
```

**Output**:
- Drop-Off Rates per Stage
- Optimization Recommendations
- A/B Test Suggestions

---

### 15. Conversion Report

**Datei**: `backend/agent/jobs/conversionReport.ts`

**Zweck**: Conversion-Report-Generierung mit AI-Insights

---

### 16. Trend Analysis

**Datei**: `backend/agent/jobs/trendAnalysis.ts`

**Zweck**: Google Trends Integration & Trend-Forecasting

**Workflow**:
```
1. Google Trends API Call
   ↓
2. Trend Data Collection
   ↓
3. Demand Score Calculation
   ↓
4. Competition Analysis
   ↓
5. Trend Recommendations
```

**Beispiel**:
```typescript
await trendAnalysisJob({
  keyword: 'digitale produkte',
  geo: 'DE',
  timeframe: '30days'
});
```

**Output**:
```json
{
  "success": true,
  "trendingProducts": [
    {
      "keyword": "dsgvo checkliste",
      "demandScore": 85,
      "competition": 30,
      "trend": "rising",
      "relatedKeywords": ["dsgvo audit", "datenschutz"]
    }
  ]
}
```

---

### 17. Google Trends Service

**Datei**: `backend/agent/jobs/googleTrendsService.ts`

**Zweck**: Google Trends API Wrapper

---

## Marketing Automation

### 18. Email Marketing Automation

**Datei**: `backend/agent/jobs/emailMarketingAutomation.ts`

**Zweck**: Automatisierte Email-Marketing-Kampagnen

**Email-Typen**:
1. **Welcome Series**: Neue Subscriber
2. **Abandoned Cart**: Warenkorb-Abbruch
3. **Post-Purchase**: Nach Kauf
4. **Win-Back**: Inaktive Kunden
5. **Newsletter**: Monatliche Updates

**Workflow**:
```
1. Trigger Event (Cart Abandoned, New Subscriber)
   ↓
2. Customer Segmentation
   ↓
3. Email Template Selection
   ↓
4. AI Personalization
   ↓
5. Email Scheduling
   ↓
6. Send & Track
```

**Beispiel - Abandoned Cart**:
```typescript
await emailMarketingAutomationJob({
  type: 'abandoned_cart',
  trigger: {
    customer_id: 123,
    cart_value: 49.99,
    abandoned_at: '2025-11-01T10:00:00Z'
  },
  delay_hours: 2,
  discount: 10  // 10% Discount Code
});
```

**Email-Templates**:
```typescript
const TEMPLATES = {
  welcome: {
    subject: "🎉 Willkommen bei kaufe-es.eu",
    body: `
      <h1>Willkommen!</h1>
      <p>Danke für Ihre Anmeldung...</p>
      <a href="{{shop_url}}">Zu unseren Produkten</a>
    `
  },
  abandoned_cart: {
    subject: "😢 Sie haben etwas vergessen...",
    body: `
      <h1>Ihr Warenkorb wartet!</h1>
      <p>Sie haben {{product_name}} im Warenkorb...</p>
      <strong>{{discount_code}}</strong>
    `
  }
};
```

**Scheduler**:
```typescript
// Alle 30 Minuten Abandoned Carts prüfen
cron.schedule('*/30 * * * *', async () => {
  await checkAbandonedCarts();
});
```

---

### 19. Social Media Automation

**Datei**: `backend/agent/jobs/socialMediaAutomation.ts`

**Zweck**: Automatische Social Media Post-Planung

**Plattformen**:
- Facebook
- Instagram
- LinkedIn
- Twitter (X)

**Post-Typen**:
- Product Launches
- Blog Post Sharing
- Testimonials
- Tips & Tricks

---

### 20. Social Media Auto-Poster

**Datei**: `backend/agent/jobs/socialMediaAutoPoster.ts`

**Zweck**: Automatisches Posten von Content

**Workflow**:
```
1. Content Queue Management
   ↓
2. Optimal Posting Time Calculation
   ↓
3. AI Content Optimization per Platform
   ↓
4. Image/Video Upload
   ↓
5. Post Publishing
   ↓
6. Engagement Tracking
```

**Scheduler**:
```typescript
// Täglich um 9:00, 14:00, 18:00 Uhr
cron.schedule('0 9,14,18 * * *', async () => {
  await socialMediaAutoPosterJob();
});
```

---

### 21. Content Monetizer

**Datei**: `backend/agent/jobs/contentMonetizer.ts`

**Zweck**: Bestehenden Content monetarisieren

**Strategien**:
- Blog Posts → Lead Magnets
- Free Content → Premium Upgrades
- Webinars → Courses
- Checklists → Consulting

---

### 22. Free-to-Paid Converter

**Datei**: `backend/agent/jobs/freeToPaidConverter.ts`

**Zweck**: Freemium-Users zu Paid Customers konvertieren

**Workflow**:
```
1. User Behavior Analysis
   ↓
2. Engagement Scoring
   ↓
3. Upsell Opportunity Identification
   ↓
4. Personalized Offer Creation
   ↓
5. Email Campaign Trigger
```

---

## Payment Management

### 23-35. Payment Jobs (13 Jobs)

**Payment-Debugging & Fixing Suite**:

**Jobs**:
- `paymentDebugger.ts` - Payment-Fehler diagnostizieren
- `paymentFixer.ts` - Automatische Payment-Fixes
- `paymentEmergency.ts` - Notfall-Payment-Recovery
- `paymentLiveFixer.ts` - Live Payment-Probleme lösen
- `paymentQuickCheck.ts` - Schnelle Payment-Validierung
- `paymentSimpleFix.ts` - Einfache Payment-Korrekturen
- `paymentSuccess.ts` - Payment Success Handling
- `paymentSuccessValidator.ts` - Payment-Validierung
- `paymentTester.ts` - Payment Gateway Testing
- `paymentVerifier.ts` - Payment-Verifizierung
- `paymentIssueDetector.ts` - Automatische Issue Detection
- `paymentFixCompanion.ts` - Payment Fix Assistent

**Common Payment Issues**:
- Fehlgeschlagene Transaktionen
- Timeout-Fehler
- Gateway-Verbindungsprobleme
- Webhook-Fehler
- Währungs-Konvertierungsfehler

**Workflow (paymentDebugger)**:
```
1. Payment Log Analysis
   ↓
2. Error Pattern Detection
   ↓
3. Gateway Status Check
   ↓
4. Fix Recommendation
   ↓
5. Automatic Fix (if possible)
   ↓
6. Alert Admin (if manual intervention needed)
```

**Scheduler**:
```typescript
// Alle 5 Minuten Payment-Probleme prüfen
cron.schedule('*/5 * * * *', async () => {
  await paymentIssueDetectorJob();
});

// Bei kritischen Fehlern: Live Fixer
cron.schedule('*/1 * * * *', async () => {
  await paymentLiveFixerJob();
});
```

---

## Shop Health & Audits

### 36. Shop Health Report

**Datei**: `backend/agent/jobs/shopHealthReport.ts`

**Zweck**: Umfassender Shop-Gesundheitscheck

**Check-Kategorien**:
1. **Performance**: Page Load, Server Response Time
2. **SEO**: Meta Tags, Sitemap, Robots.txt
3. **Security**: SSL, Firewall, Updates
4. **User Experience**: Navigation, Checkout Flow
5. **Technical**: Broken Links, 404 Errors
6. **Inventory**: Stock Levels, Out-of-Stock
7. **Payments**: Gateway Status
8. **Marketing**: Email Lists, Campaigns

**Workflow**:
```
1. Data Collection (WooCommerce, WordPress, Analytics)
   ↓
2. Health Score Calculation (0-100)
   ↓
3. Issue Detection
   ↓
4. Priority Assignment (Critical, High, Medium, Low)
   ↓
5. Recommendation Generation
   ↓
6. Report Creation (PDF/HTML)
   ↓
7. Email to Admin
```

**Report Output**:
```json
{
  "overallScore": 85,
  "categories": {
    "performance": { "score": 90, "status": "good" },
    "seo": { "score": 75, "status": "warning" },
    "security": { "score": 95, "status": "excellent" }
  },
  "criticalIssues": [
    {
      "type": "broken_links",
      "count": 5,
      "priority": "high",
      "recommendation": "Fix broken links in footer"
    }
  ],
  "recommendations": [
    "Enable caching for faster load times",
    "Update SEO meta descriptions"
  ]
}
```

**Scheduler**:
```typescript
// Täglich um 3:00 Uhr (nachts, wenig Traffic)
cron.schedule('0 3 * * *', async () => {
  await shopHealthReportJob();
});
```

---

### 37. Mini Audit

**Datei**: `backend/agent/jobs/miniAudit.ts`

**Zweck**: Schneller Basis-Audit (5 Min)

**Checks**:
- Basic SEO
- SSL Status
- Broken Links (Top 20 Pages)
- Critical Security Issues

---

### 38. Standard Audit

**Datei**: `backend/agent/jobs/standardAudit.ts`

**Zweck**: Standard-Audit (15 Min)

**Checks**:
- Mini Audit +
- Performance Analysis
- Mobile Responsiveness
- Basic Analytics Review

---

### 39. Premium Audit

**Datei**: `backend/agent/jobs/premiumAudit.ts`

**Zweck**: Umfassender Premium-Audit (30-60 Min)

**Checks**:
- Standard Audit +
- Deep SEO Analysis
- Competitor Analysis
- Conversion Funnel Optimization
- A/B Testing Recommendations
- Custom Reports

---

### 40. Auto Fix Implementer

**Datei**: `backend/agent/jobs/autoFixImplementer.ts`

**Zweck**: Automatische Fehlerkorrektur

**Auto-Fixes**:
- Broken Links → Redirect to Similar Content
- Missing Meta Descriptions → AI-Generated
- Out-of-Stock → Auto-Hide or Alternative Suggestion
- 404 Errors → Custom 404 Page with Search
- Slow Images → Compression & Lazy Loading

---

## Weitere Jobs

### 41-44. Utility Jobs

**WordPress Analytics Service** (`wordpressAnalyticsService.ts`):
- WordPress-spezifische Analytics
- Post Performance
- Comment Analysis

**Run Scripts** (`runAutoProductCreator.ts`, `runCreateFreebie.ts`, `runTrendAnalysis.ts`):
- Standalone Execution Scripts
- CLI-Tools für manuelle Ausführung

---

## Job Execution

### Manueller Job-Start

```typescript
// Import Job
import { autoProductCreatorJob } from './backend/agent/jobs/autoProductCreator';

// Execute
await autoProductCreatorJob({
  keyword: 'digitale produkte',
  geo: 'DE',
  maxProducts: 5
});
```

### API-Trigger

```bash
POST /app/api/jobs/trigger
{
  "job": "autoProductCreator",
  "config": {
    "keyword": "digitale produkte",
    "geo": "DE"
  }
}
```

### Event-Trigger

```typescript
// Bei neuem Order
eventEmitter.on('order.created', async (order) => {
  await postPurchaseEmailJob(order);
});

// Bei Warenkorb-Abbruch
eventEmitter.on('cart.abandoned', async (cart) => {
  await abandonedCartEmailJob(cart);
});
```

---

## Error Handling in Jobs

### Circuit Breaker Integration

Alle Jobs nutzen das Error-Handling System:

```typescript
import { executeWithFullProtection } from '../error-handling';

export async function myJob(config) {
  return await executeWithFullProtection(
    () => jobLogic(config),
    {
      circuitBreaker: wooCommerceBreaker,
      retryStrategy: standardRetry,
      jobType: 'myJob',
      payload: config,
      alertOnFailure: true
    }
  );
}
```

### Dead Letter Queue

Bei Job-Failures:
```
1. Job Failed
   ↓
2. Add to DLQ (data/dlq/)
   ↓
3. Wait 5 Minutes
   ↓
4. Retry (Max 3x)
   ↓
5. Alert Admin (if still failing)
```

---

## Job Monitoring

### Job-Status API

```bash
GET /app/api/jobs/status
```

**Response**:
```json
{
  "success": true,
  "jobs": {
    "autoProductCreator": {
      "status": "running",
      "lastRun": "2025-11-01T06:00:00Z",
      "nextRun": "2025-11-02T06:00:00Z",
      "success_rate": 95.5
    },
    "emailMarketing": {
      "status": "completed",
      "lastRun": "2025-11-01T09:00:00Z",
      "nextRun": "2025-11-01T09:30:00Z",
      "success_rate": 98.2
    }
  }
}
```

### Job-Logs

```bash
GET /app/api/jobs/logs/:jobName
```

---

## Best Practices

### 1. Job Design

✅ **DO**:
- Idempotent Jobs (wiederholbar ohne Nebenwirkungen)
- Error Handling (Circuit Breaker, Retry, DLQ)
- Logging (Start, End, Errors)
- Progress Reporting
- Timeout Configuration

❌ **DON'T**:
- Lange-laufende Jobs ohne Progress Updates
- Hardcoded Credentials
- Unhandled Exceptions
- Blocking Operations ohne Timeout

### 2. Scheduler Configuration

✅ **DO**:
- Off-Peak Hours für heavy Jobs (nachts)
- Staggered Start Times (nicht alle Jobs gleichzeitig)
- Appropriate Intervals (nicht zu häufig)
- Resource Monitoring

❌ **DON'T**:
- Peak Hours für heavy Jobs
- Overlapping Heavy Jobs
- Too Frequent Execution (< 1 Min)

### 3. Error Handling

✅ **DO**:
- Use Circuit Breaker für External APIs
- Retry mit Exponential Backoff
- Dead Letter Queue für Failed Jobs
- Alert Admin bei Critical Failures

❌ **DON'T**:
- Infinite Retries
- Silent Failures
- Ignore DLQ

---

## Job Templates

### New Job Template

```typescript
// backend/agent/jobs/myNewJob.ts
import { executeWithFullProtection } from '../../error-handling';
import { wooCommerceBreaker, standardRetry } from '../../error-handling';
import { logger } from '../../logger';

interface MyJobConfig {
  param1: string;
  param2: number;
}

export async function myNewJob(config?: Partial<MyJobConfig>) {
  const {
    param1 = 'default',
    param2 = 10
  } = config || {};

  logger.info('🚀 Starting myNewJob...');

  return await executeWithFullProtection(
    async () => {
      // Job Logic here
      logger.info('✅ myNewJob completed');
      return { success: true };
    },
    {
      circuitBreaker: wooCommerceBreaker,
      retryStrategy: standardRetry,
      jobType: 'myNewJob',
      payload: config,
      alertOnFailure: true
    }
  );
}
```

---

## Zusammenfassung

Das WooCommerce AI Agent System bietet:

✅ **44 automatisierte Workflows** für E-Commerce  
✅ **Cron-basiertes Scheduling** mit Node-Cron  
✅ **Circuit Breaker Integration** für alle Jobs  
✅ **Dead Letter Queue** für Failed Job Recovery  
✅ **Multi-Channel Alerting** bei Job-Failures  
✅ **AI-Integration** (GPT-4, DALL-E) für Content  
✅ **Google Trends** für Trend-basierte Automation  
✅ **Email Automation** mit personalisierten Kampagnen  
✅ **Payment Debugging Suite** (13 Jobs)  
✅ **Shop Health Monitoring** mit Auto-Fix  

**Version**: 1.8.0  
**Stand**: November 2025  
**Autor**: AndreZ1971
