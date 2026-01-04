# Agent Workflows Documentation - WooCommerce AI Agent

## Overview

The WooCommerce AI Agent System features **44 automated job workflows** for e-commerce automation. These jobs are triggered either time-based (Cron), manually, or through events.

---

## Job Categories

1. **[Product Management](#product-management)** (11 Jobs)
2. **[Content Generation](#content-generation)** (3 Jobs)
3. **[Analytics & Reporting](#analytics--reporting)** (7 Jobs)
4. **[Marketing Automation](#marketing-automation)** (5 Jobs)
5. **[Payment Management](#payment-management)** (13 Jobs)
6. **[Shop Health & Audits](#shop-health--audits)** (5 Jobs)

---

## Job Scheduler

### Scheduler Configuration

**File**: `backend/scheduler.ts`

**Engine**: Node-Cron (https://www.npmjs.com/package/node-cron)

**Example Configuration**:
```typescript
import cron from 'node-cron';

// Every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  await ordersCheckJob();
});

// Daily at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  await dailyAnalyticsJob();
});

// Every Monday at 10:00 AM
cron.schedule('0 10 * * 1', async () => {
  await weeklyReportJob();
});
```

**Cron Syntax**:
```
┌───────────── Minute (0 - 59)
│ ┌───────────── Hour (0 - 23)
│ │ ┌───────────── Day of month (1 - 31)
│ │ │ ┌───────────── Month (1 - 12)
│ │ │ │ ┌───────────── Day of week (0 - 7) (0 & 7 = Sunday)
│ │ │ │ │
* * * * *
```

**Common Patterns**:
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Daily at midnight
- `0 9 * * 1-5` - Weekdays at 9:00 AM
- `0 0 1 * *` - First day of each month

---

## Product Management

### 1. Auto Product Creator

**File**: `backend/agent/jobs/autoProductCreator.ts`

**Purpose**: Automatic product creation based on Google Trends

**Workflow**:
```
1. Google Trends Analysis
   ↓
2. Trend Evaluation (Demand Score, Competition)
   ↓
3. Trend Filtering (Score ≥ 70, Competition ≤ 40)
   ↓
4. AI Content Generation (GPT-4)
   ↓
5. Product Creation in WooCommerce
   ↓
6. Optional: Auto-Publish
```

**Configuration**:
```typescript
interface AutoProductConfig {
  keyword: string;           // Main keyword
  geo: string;              // Country (DE, US, etc.)
  maxProducts: number;      // Max products per run
  minDemandScore: number;   // Min demand (0-100)
  maxCompetition: number;   // Max competition (0-100)
  autoPublish: boolean;     // Publish immediately?
}
```

**Example**:
```typescript
await autoProductCreatorJob({
  keyword: 'digital products',
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
      "name": "GDPR Checklist 2025",
      "status": "draft",
      "trend": {
        "keyword": "gdpr checklist",
        "demandScore": 85,
        "competition": 30
      }
    }
  ]
}
```

**Scheduler**:
```typescript
// Daily at 6:00 AM to check for new trends
cron.schedule('0 6 * * *', async () => {
  await autoProductCreatorJob();
});
```

---

### 2. WooCommerce Product Creator

**File**: `backend/agent/jobs/wooCreateProduct.ts`

**Purpose**: Create single product in WooCommerce

**Workflow**:
```
1. Validation (Name, Price required)
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

**Usage**:
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

**File**: `backend/agent/jobs/wooUpdateProduct.ts`

**Purpose**: Update existing products

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

**Example**:
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

**File**: `backend/agent/jobs/bundles.ts`

**Purpose**: Automatic product bundle creation

**Workflow**:
```
1. Analysis: Top-Selling Products
   ↓
2. Bundle Suggestions (AI-based)
   ↓
3. Create Bundle Product
   ↓
4. Discount Calculation (15-30%)
   ↓
5. Cross-Sell Configuration
```

**Bundle Types**:
- **Thematic Bundles**: Related products
- **Price-Based Bundles**: Products in similar price range
- **Bestseller Bundles**: Top products combined

**Example**:
```typescript
await createBundleJob({
  type: 'thematic',
  theme: 'GDPR Starter Pack',
  products: [123, 456, 789],
  discount: 20,
  autoPublish: false
});
```

---

### 5. Freebie Creator

**File**: `backend/agent/jobs/createFreebie.ts`

**Purpose**: Create free lead magnets

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

**Freebie Types**:
- **Checklists**: GDPR Checklist, SEO Checklist
- **Templates**: Privacy Policy, Cookie Policy
- **Guides**: "7 GDPR Mistakes to Avoid"
- **Workbooks**: Interactive PDFs

**Example**:
```typescript
await createFreebieJob({
  type: 'checklist',
  topic: 'GDPR for Beginners',
  format: 'pdf',
  pages: 5,
  autoEmailSequence: true
});
```

---

### 6. Product Categories Manager

**File**: `backend/agent/jobs/getCategories.ts`

**Purpose**: Category management & optimization

**Features**:
- Automatic category creation
- Category SEO optimization
- Product categorization (AI)
- Unused categories cleanup

---

### 7. Kits & Templates Manager

**File**: `backend/agent/jobs/kitsTemplates.ts`

**Purpose**: Manage product kits & templates

**Use Cases**:
- Starter kits for beginners
- Professional kits for advanced users
- Industry-specific templates

---

## Content Generation

### 8. AI Content Generator

**File**: `backend/agent/jobs/aiContentGenerator.ts`

**Purpose**: AI-based content generation with GPT-4

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

**Content Types**:
- **Product Descriptions**: Optimized for conversion
- **Blog Posts**: SEO-optimized articles
- **Category Descriptions**: Category texts
- **Email Copy**: Marketing emails
- **Social Media**: Posts for Facebook, Instagram, LinkedIn

**Example**:
```typescript
await aiContentGeneratorJob({
  type: 'product_description',
  product: {
    name: 'GDPR Audit Service',
    keywords: ['gdpr', 'audit', 'compliance']
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
    "title": "Professional GDPR Audit Service",
    "description": "Our GDPR Audit Service helps you...",
    "seo_title": "GDPR Audit | Professional Compliance Check",
    "meta_description": "Ensure GDPR compliance...",
    "keywords": ["gdpr audit", "compliance check"]
  }
}
```

---

### 9. German Content Generator

**File**: `backend/agent/jobs/germanContentGenerator.ts`

**Purpose**: German content generation with local SEO

**Specializations**:
- **GDPR Content**: Legally compliant texts
- **German SEO**: Local keywords
- **Cultural Adaptation**: German customer approach
- **Legal Compliance**: Imprint, Privacy Policy

---

### 10. AI Image Generator

**File**: `backend/agent/jobs/aiImageGenerator.ts`

**Purpose**: Generate product images with DALL-E

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

**Example**:
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

**File**: `backend/agent/jobs/analyticsReporting.ts`

**Purpose**: Automated analytics reports

**Report Types**:
- **Daily Report**: Daily at 8:00 AM
- **Weekly Report**: Mondays at 9:00 AM
- **Monthly Report**: First of month
- **Custom Reports**: On-demand

**Metrics**:
- Revenue & Orders
- Conversion Rate
- Top Products
- Customer Acquisition
- Traffic Sources
- Bounce Rate

**Scheduler**:
```typescript
// Daily at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  await analyticsReportingJob({ period: 'daily' });
});

// Mondays at 9:00 AM
cron.schedule('0 9 * * 1', async () => {
  await analyticsReportingJob({ period: 'weekly' });
});
```

---

### 12. Real-Time Analytics

**File**: `backend/agent/jobs/realAnalyticsReporting.ts`

**Purpose**: Real-time data from WooCommerce & Google Analytics

**Features**:
- Live visitor count
- Current orders
- Real-time revenue
- Active sessions
- Cart abandonment rate

---

### 13. Real WooCommerce Analytics

**File**: `backend/agent/jobs/realWooCommerceAnalytics.ts`

**Purpose**: WooCommerce-specific real-time analytics

**Metrics**:
- Order processing status
- Stock levels
- Payment status
- Shipping status

---

### 14. Conversion Analysis

**File**: `backend/agent/jobs/conversionAnalysis.ts`

**Purpose**: Detailed conversion funnel analysis

**Funnel Stages**:
```
Visitors → Product Views → Add to Cart → Checkout → Purchase
```

**Output**:
- Drop-off rates per stage
- Optimization recommendations
- A/B test suggestions

---

### 15. Conversion Report

**File**: `backend/agent/jobs/conversionReport.ts`

**Purpose**: Conversion report generation with AI insights

---

### 16. Trend Analysis

**File**: `backend/agent/jobs/trendAnalysis.ts`

**Purpose**: Google Trends integration & trend forecasting

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

**Example**:
```typescript
await trendAnalysisJob({
  keyword: 'digital products',
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
      "keyword": "gdpr checklist",
      "demandScore": 85,
      "competition": 30,
      "trend": "rising",
      "relatedKeywords": ["gdpr audit", "data protection"]
    }
  ]
}
```

---

### 17. Google Trends Service

**File**: `backend/agent/jobs/googleTrendsService.ts`

**Purpose**: Google Trends API wrapper

---

## Marketing Automation

### 18. Email Marketing Automation

**File**: `backend/agent/jobs/emailMarketingAutomation.ts`

**Purpose**: Automated email marketing campaigns

**Email Types**:
1. **Welcome Series**: New subscribers
2. **Abandoned Cart**: Cart abandonment
3. **Post-Purchase**: After purchase
4. **Win-Back**: Inactive customers
5. **Newsletter**: Monthly updates

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

**Example - Abandoned Cart**:
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

**Email Templates**:
```typescript
const TEMPLATES = {
  welcome: {
    subject: "🎉 Welcome to kaufe-es.eu",
    body: `
      <h1>Welcome!</h1>
      <p>Thank you for signing up...</p>
      <a href="{{shop_url}}">Browse our products</a>
    `
  },
  abandoned_cart: {
    subject: "😢 You forgot something...",
    body: `
      <h1>Your cart is waiting!</h1>
      <p>You left {{product_name}} in your cart...</p>
      <strong>{{discount_code}}</strong>
    `
  }
};
```

**Scheduler**:
```typescript
// Check for abandoned carts every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  await checkAbandonedCarts();
});
```

---

### 19. Social Media Automation

**File**: `backend/agent/jobs/socialMediaAutomation.ts`

**Purpose**: Automatic social media post scheduling

**Platforms**:
- Facebook
- Instagram
- LinkedIn
- Twitter (X)

**Post Types**:
- Product launches
- Blog post sharing
- Testimonials
- Tips & tricks

---

### 20. Social Media Auto-Poster

**File**: `backend/agent/jobs/socialMediaAutoPoster.ts`

**Purpose**: Automatic content posting

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
// Daily at 9:00 AM, 2:00 PM, 6:00 PM
cron.schedule('0 9,14,18 * * *', async () => {
  await socialMediaAutoPosterJob();
});
```

---

### 21. Content Monetizer

**File**: `backend/agent/jobs/contentMonetizer.ts`

**Purpose**: Monetize existing content

**Strategies**:
- Blog posts → Lead magnets
- Free content → Premium upgrades
- Webinars → Courses
- Checklists → Consulting

---

### 22. Free-to-Paid Converter

**File**: `backend/agent/jobs/freeToPaidConverter.ts`

**Purpose**: Convert freemium users to paid customers

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

**Payment Debugging & Fixing Suite**:

**Jobs**:
- `paymentDebugger.ts` - Diagnose payment errors
- `paymentFixer.ts` - Automatic payment fixes
- `paymentEmergency.ts` - Emergency payment recovery
- `paymentLiveFixer.ts` - Fix live payment issues
- `paymentQuickCheck.ts` - Quick payment validation
- `paymentSimpleFix.ts` - Simple payment corrections
- `paymentSuccess.ts` - Payment success handling
- `paymentSuccessValidator.ts` - Payment validation
- `paymentTester.ts` - Payment gateway testing
- `paymentVerifier.ts` - Payment verification
- `paymentIssueDetector.ts` - Automatic issue detection
- `paymentFixCompanion.ts` - Payment fix assistant

**Common Payment Issues**:
- Failed transactions
- Timeout errors
- Gateway connection problems
- Webhook errors
- Currency conversion errors

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
// Check payment issues every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await paymentIssueDetectorJob();
});

// Critical errors: Live fixer
cron.schedule('*/1 * * * *', async () => {
  await paymentLiveFixerJob();
});
```

---

## Shop Health & Audits

### 36. Shop Health Report

**File**: `backend/agent/jobs/shopHealthReport.ts`

**Purpose**: Comprehensive shop health check

**Check Categories**:
1. **Performance**: Page load, server response time
2. **SEO**: Meta tags, sitemap, robots.txt
3. **Security**: SSL, firewall, updates
4. **User Experience**: Navigation, checkout flow
5. **Technical**: Broken links, 404 errors
6. **Inventory**: Stock levels, out-of-stock
7. **Payments**: Gateway status
8. **Marketing**: Email lists, campaigns

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
// Daily at 3:00 AM (night, low traffic)
cron.schedule('0 3 * * *', async () => {
  await shopHealthReportJob();
});
```

---

### 37. Mini Audit

**File**: `backend/agent/jobs/miniAudit.ts`

**Purpose**: Quick basic audit (5 min)

**Checks**:
- Basic SEO
- SSL status
- Broken links (top 20 pages)
- Critical security issues

---

### 38. Standard Audit

**File**: `backend/agent/jobs/standardAudit.ts`

**Purpose**: Standard audit (15 min)

**Checks**:
- Mini audit +
- Performance analysis
- Mobile responsiveness
- Basic analytics review

---

### 39. Premium Audit

**File**: `backend/agent/jobs/premiumAudit.ts`

**Purpose**: Comprehensive premium audit (30-60 min)

**Checks**:
- Standard audit +
- Deep SEO analysis
- Competitor analysis
- Conversion funnel optimization
- A/B testing recommendations
- Custom reports

---

### 40. Auto Fix Implementer

**File**: `backend/agent/jobs/autoFixImplementer.ts`

**Purpose**: Automatic error correction

**Auto-Fixes**:
- Broken links → Redirect to similar content
- Missing meta descriptions → AI-generated
- Out-of-stock → Auto-hide or alternative suggestion
- 404 errors → Custom 404 page with search
- Slow images → Compression & lazy loading

---

## Additional Jobs

### 41-44. Utility Jobs

**WordPress Analytics Service** (`wordpressAnalyticsService.ts`):
- WordPress-specific analytics
- Post performance
- Comment analysis

**Run Scripts** (`runAutoProductCreator.ts`, `runCreateFreebie.ts`, `runTrendAnalysis.ts`):
- Standalone execution scripts
- CLI tools for manual execution

---

## Job Execution

### Manual Job Start

```typescript
// Import job
import { autoProductCreatorJob } from './backend/agent/jobs/autoProductCreator';

// Execute
await autoProductCreatorJob({
  keyword: 'digital products',
  geo: 'DE',
  maxProducts: 5
});
```

### API Trigger

```bash
POST /app/api/jobs/trigger
{
  "job": "autoProductCreator",
  "config": {
    "keyword": "digital products",
    "geo": "DE"
  }
}
```

### Event Trigger

```typescript
// On new order
eventEmitter.on('order.created', async (order) => {
  await postPurchaseEmailJob(order);
});

// On cart abandonment
eventEmitter.on('cart.abandoned', async (cart) => {
  await abandonedCartEmailJob(cart);
});
```

---

## Error Handling in Jobs

### Circuit Breaker Integration

All jobs use the error handling system:

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

On job failures:
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

### Job Status API

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

### Job Logs

```bash
GET /app/api/jobs/logs/:jobName
```

---

## Best Practices

### 1. Job Design

✅ **DO**:
- Idempotent jobs (repeatable without side effects)
- Error handling (Circuit Breaker, Retry, DLQ)
- Logging (Start, End, Errors)
- Progress reporting
- Timeout configuration

❌ **DON'T**:
- Long-running jobs without progress updates
- Hardcoded credentials
- Unhandled exceptions
- Blocking operations without timeout

### 2. Scheduler Configuration

✅ **DO**:
- Off-peak hours for heavy jobs (night)
- Staggered start times (not all jobs simultaneously)
- Appropriate intervals (not too frequent)
- Resource monitoring

❌ **DON'T**:
- Peak hours for heavy jobs
- Overlapping heavy jobs
- Too frequent execution (< 1 min)

### 3. Error Handling

✅ **DO**:
- Use circuit breaker for external APIs
- Retry with exponential backoff
- Dead Letter Queue for failed jobs
- Alert admin on critical failures

❌ **DON'T**:
- Infinite retries
- Silent failures
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
      // Job logic here
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

## Summary

The WooCommerce AI Agent System offers:

✅ **44 automated workflows** for e-commerce  
✅ **Cron-based scheduling** with Node-Cron  
✅ **Circuit Breaker integration** for all jobs  
✅ **Dead Letter Queue** for failed job recovery  
✅ **Multi-channel alerting** on job failures  
✅ **AI integration** (GPT-4, DALL-E) for content  
✅ **Google Trends** for trend-based automation  
✅ **Email automation** with personalized campaigns  
✅ **Payment debugging suite** (13 jobs)  
✅ **Shop health monitoring** with auto-fix  

**Version**: 1.8.0  
**Last Update**: November 2025  
**Author**: AndreZ1971
