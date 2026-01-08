# ARI Update Roadmap

## Status: January 2026

This document outlines the current and planned improvements to the Trend Aggregator and Product Analysis features.

---

## 🎯 Recently Completed Updates

### ✅ Reddit OAuth Integration (January 2026)
- **Status**: Production Ready
- **Implementation**: Genuine Reddit OAuth with Client Credentials Flow
- **Data Source**: `connection.json` (centralized configuration)
- **Benefits**: Authentic customer opinions from Reddit discussions
- **Performance**: Async with caching, max requests per minute controlled

### ✅ Percentage-Based Price Suggestions (January 2026)
- **Status**: Production Ready
- **Logic**: `maxPriceIncreasePercent` (default +20%), `maxPriceDecreasePercent` (default -15%)
- **Intelligent Fallbacks**: Dynamic scaling (30-70% range) when trend score not optimal
- **Frontend**: Percentage input fields with live price preview
- **Security**: Double validation (Frontend + Backend)

### ✅ Dark Glass UI Theme (January 2026)
- **Status**: Production Ready
- **Implementation**: Rgba-Backgrounds + Blur-Filters with !important Overrides
- **Components**: Header, Cards, Product List, Toasts
- **Accessibility**: High contrast, WCAG 2.1 AA compatible

### ✅ Improved Error Handling (January 2026)
- **Status**: Production Ready
- **Features**: Detailed logging, WooCommerce availability check, OpenAI API Key validation
- **Stack Traces**: Truncated to first 5 lines for readability
- **DX Improvements**: Clear error messages for Admin & User

### ✅ Configuration Management (January 2026)
- **Status**: Production Ready
- **System**: `connection.json` with multi-path fallback system
- **Benefits**: Single source of truth for all credentials
- **Security**: No API keys in .env, all in git-ignored JSON

---

## 📋 Planned Improvements (Trend Aggregator)

### Phase 1: YouTube Trends Integration
- **Status**: Planned
- **Description**: Enable YouTube trending data as additional source
- **Prerequisite**: YouTube API Key (in `connection.json`)
- **Benefits**: Better trend assessment through video popularity
- **Effort**: Medium (2-3 days)
- **Priority**: High

### Phase 2: Enhanced Wikipedia Analysis
- **Status**: Active (Basic)
- **Planned Enhancement**: Multi-language support, pageviews trends over longer periods
- **Benefits**: International trend recognition
- **Effort**: Low (1 day)
- **Priority**: Medium

### Phase 3: Google News RSS Optimization
- **Status**: Active (Basic)
- **Planned Enhancement**: Sentiment analysis of news headlines, category-specific feeds
- **Benefits**: Better assessment of news landscape
- **Effort**: Medium (2 days)
- **Priority**: Medium

### Phase 4: GitHub Trending Enhancement
- **Status**: Active (Basic)
- **Planned Enhancement**: Tech-product-specific trend scores, star growth rate
- **Benefits**: Better assessment for tech/software products
- **Effort**: Medium (2 days)
- **Priority**: Low

### Phase 5: StackOverflow Trends
- **Status**: Active (Basic)
- **Planned Enhancement**: Tag-based trend analysis, question frequency tracking
- **Benefits**: Recognize developer community trends
- **Effort**: Medium (2 days)
- **Priority**: Low

### Phase 6: UI Transparency Layer
- **Status**: Planned
- **Description**: Badge system in UI to display active/inactive sources
- **Features**:
  - Live status per source (✅ active, ⏸ disabled, ❌ failed)
  - Fallback handling with user feedback
  - Logging/telemetry for admins
  - Source attribution in analysis results
- **Benefits**: Transparency for end customers, better debugging
- **Effort**: Low-Medium (1-2 days)
- **Priority**: Medium

---

## 🔧 Technical Details

### Current Architecture

```
Frontend
  ├─ WooProductUpdate.tsx (Percentage Limits UI)
  ├─ ProductAnalyzer.tsx (Analysis Page)
  └─ page.css (Dark Glass Theme)

Backend API
  ├─ /api/products/adviser/analyze/:id (Product Analysis)
  ├─ /api/products/woo/update-single (Price Update)
  └─ /ai/trend-pricing (GPT + Trend Aggregation)

Services
  ├─ trendAggregatorService.ts
  │  ├─ Google Trends (7-day moving average)
  │  ├─ Reddit OAuth (live discussions)
  │  ├─ Wikipedia (pageviews)
  │  ├─ Google News (RSS feed)
  │  ├─ GitHub (trending repos)
  │  └─ StackOverflow (top tags)
  │
  ├─ wooCommerceService.ts (Product CRUD)
  └─ openaiHelper.ts (GPT-4 + Config)

Config
  └─ connection.json (centralized credentials)
```

### Key Files

| File | Description | Status |
|------|-------------|--------|
| `backend/routes/app/api/products/optimizer/product-optimizer.ts` | Main analysis route with improved logging | ✅ Updated |
| `backend/services/trendAggregatorService.ts` | Multi-source trend aggregation with Reddit OAuth | ✅ Updated |
| `backend/config.ts` | Multi-path config loader for connection.json | ✅ Updated |
| `frontend/src/pages/ProductManagement/WooProductUpdate.tsx` | Percentage limits UI with dark glass theme | ✅ Updated |
| `frontend/src/pages/ProductManagement/page.css` | Dark glass styling with !important overrides | ✅ Updated |

---

## 📊 Next Steps (Priority Order)

1. **YouTube Integration** (Phase 1) - Customers request YouTube data
2. **UI Badges** (Phase 6) - Improved transparency for API status
3. **Advanced Wikipedia** (Phase 2) - Multi-language support
4. **Sentiment News** (Phase 3) - Better news assessment

---

## 💡 Recognized Learnings

- **Percentage limits are better than absolute € thresholds** - Flexible to different price ranges
- **Fallback logic prevents "floor camping"** - AI suggestions distribute across allowed range
- **connection.json as single source of truth** - Simpler management than .env files
- **Dark glass theme with !important overrides necessary** - UI framework conflicts force overrides
- **Real OAuth better than API keys** - Reddit data more authentic and up-to-date

---

**Note**: Updates are rolled out gradually to provide continuous improvements and keep customers engaged. Each phase includes testing + documentation + release notes.
