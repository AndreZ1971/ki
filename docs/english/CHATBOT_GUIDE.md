# 🤖 A.R.I. Chatbot Guide – English

**Version:** 7.0.2  
**Date:** January 2026  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Available Intents & Functions](#available-intents--functions)
4. [Configuration](#configuration)
5. [Caching & Performance](#caching--performance)
6. [Troubleshooting](#troubleshooting)
7. [Developer Guide](#developer-guide)
8. [Roadmap](#roadmap)

---

## Overview

The A.R.I. Chatbot is an **intelligent assistant system** that:

- **Fetches live data** from your WooCommerce shop (products, categories, orders, customers)
- **Understands natural language** queries and provides answers
- **Uses fallback mechanisms** when external APIs are unavailable
- **Leverages caching** for fast responses and scalability
- **Maintains query history** for context and improvements

### Use Cases

✅ **Customer Service:** "How many products do you have?" → Live answer  
✅ **Shop Overview:** "What categories exist?" → Real-time data  
✅ **Order Tracking:** "Check order status" → Integration with shop data  
✅ **General Questions:** "What is your service?" → GPT-4o with context  

---

## Architecture

### Component Stack

```
Frontend (React)
    ↓
[chatbot-message.tsx]
    ↓ POST /api/app/chatbot-message
Backend (Fastify)
    ↓
[chatbot-message.ts] (Route)
    ↓
[chatbotFunctionCaller.ts] (Smart Intent Parser & Function Caller)
    ├→ WooCommerce API (Live Data)
    ├→ getShopStats (Fallback)
    └→ GPT-4o (Natural Language Processing)
    ↓
Response with Live Data or Fallback
    ↓
Frontend (Display)
```

### Data Flow

1. **User Input** → Frontend sends message
2. **Intent Recognition** → Regex patterns + NLP check for live data
3. **Function Calling** → If live data detected:
   - Fetch from WooCommerce API (5 min cache)
   - If error: Fallback to `getShopStats`
4. **Enrichment** → Enhance system prompt with live data
5. **GPT-4o Call** → Generate natural language response
6. **Response** → Send to frontend with source (live/cache/fallback)

---

## Available Intents & Functions

### 1. **Product Count** – Number of Products

**Recognition:**
```
- "How many products do you have?"
- "Product count?"
- "How many items in the shop?"
- /product/i
```

**Live Data:**
```json
{
  "productCount": 42,
  "source": "woocommerce_api",
  "timestamp": "2026-01-10T19:00:00Z"
}
```

**Fallback:** `getShopStats().totalProducts`

---

### 2. **Category Count** – Number of Categories

**Recognition:**
```
- "How many categories?"
- "Show categories"
- /categor/i
```

**Live Data:**
```json
{
  "categoryCount": 8,
  "categories": ["Electronics", "Fashion", ...],
  "source": "woocommerce_api"
}
```

---

### 3. **Total Orders** – Total Orders

**Recognition:**
```
- "How many orders?"
- "Total orders?"
- /order/i
```

**Live Data:**
```json
{
  "totalOrders": 156,
  "todayOrders": 3,
  "source": "woocommerce_api"
}
```

---

### 4. **Total Customers** – Registered Customers

**Recognition:**
```
- "How many customers?"
- "Customer count?"
- /customer/i
```

**Live Data:**
```json
{
  "totalCustomers": 3,
  "thisMonthCustomers": 1,
  "source": "woocommerce_api"
}
```

---

### 5. **Top Products** – Best Sellers

**Recognition:**
```
- "Top products?"
- "Best sellers?"
- "Most sold?"
```

**Live Data:**
```json
{
  "topProducts": [
    {"name": "Product A", "sales": 15},
    {"name": "Product B", "sales": 12}
  ],
  "source": "woocommerce_api"
}
```

---

### 6. **Low Stock** – Products Below Minimum

**Recognition:**
```
- "Which products are low?"
- "Low stock?"
- "Reorder needed?"
```

**Live Data:**
```json
{
  "lowStockProducts": [
    {"name": "Product X", "stock": 2}
  ],
  "threshold": 5
}
```

---

## Configuration

### Backend Settings (`backend/services/chatbotFunctionCaller.ts`)

```typescript
// Cache settings
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Intent patterns (Regex)
const PATTERNS = {
  productCount: /how many|count.*product|product.*count/i,
  categoryCount: /how many.*categor|categor.*count/i,
  // ... more patterns
};

// Function timeouts
const FUNCTION_TIMEOUT = 5000; // 5 seconds

// Query history limit
const MAX_QUERY_HISTORY = 10;
```

### Frontend Settings (`frontend/src/pages/AnalyseMetrics/Chatbot.tsx`)

```typescript
// Chatbot UI
const CHATBOT_CONFIG = {
  maxMessages: 50,
  autoScroll: true,
  placeholder: "Ask me something about your shop...",
  suggestionPrompts: [
    "How many products?",
    "Top sellers?",
    "Customer count?"
  ]
};
```

---

## Caching & Performance

### Cache Strategies

| Source | TTL | Fallback |
|--------|-----|----------|
| WooCommerce API | 5 Min | `getShopStats()` |
| Product Count | 5 Min | Last value or 0 |
| Categories | 5 Min | Last value or [] |
| Orders | 5 Min | `getShopStats().totalOrders` |
| Customers | 5 Min | `getShopStats().totalCustomers` |

### Cache Hits & Misses

```json
{
  "cacheKey": "woo_products_count",
  "hit": true,
  "timestamp": "2026-01-10T19:00:00Z",
  "ttl_remaining": "4m 32s"
}
```

### Performance Goals

- **Cache Hit:** < 50ms response
- **Cache Miss with Fallback:** < 1s
- **Full Live Data:** < 5s (WooCommerce API limit)

---

## Troubleshooting

### Problem: Chatbot responds "Unknown Error"

**Causes & Solutions:**

| Symptom | Cause | Solution |
|---------|-------|----------|
| All intents fail | WooCommerce API offline | Check connection to `kaufe-es.eu/wp-json/wc/v3/` |
| Only Customers = 0 | API role too low | See [WooCommerce Customer Sync](#woocommerce-customer-sync) |
| Cache not working | TTL too short | Increase TTL in config (min. 60s) |
| Timeout on large shops | Rate limit WooCommerce | Reduce per-page to 100 |

### Problem: Fallback is always used

**Debug Steps:**

1. **Check server logs:**
   ```bash
   tail -f /var/log/ari/backend.log | grep "chatbot\|fallback"
   ```

2. **Test live data:**
   ```bash
   curl -X GET "https://kaufe-es.eu/wp-json/wc/v3/products?per_page=1" \
     -u "key:secret" -v
   ```

3. **Check cache:**
   ```bash
   # In backend console
   wooCache.list() // Shows active cache keys
   ```

### Problem: Very slow responses (> 5s)

**Optimizations:**

1. **Reduce per-page:**
   ```typescript
   // In chatbotFunctionCaller.ts
   const ITEMS_PER_PAGE = 50; // instead of 100
   ```

2. **Increase cache TTL:**
   ```typescript
   const CACHE_TTL = 10 * 60 * 1000; // 10 min instead of 5
   ```

3. **Parallel requests:**
   ```typescript
   // Already optimized with Promise.all()
   const [products, categories] = await Promise.all([...]);
   ```

---

## Developer Guide

### Adding a New Intent

**Step 1: Define pattern**

```typescript
// In chatbotFunctionCaller.ts

const intentPatterns = {
  // New intent for "Average Order Value"
  avgOrderValue: {
    patterns: [
      /average.*order|avg.*value|mean.*order/i,
      /how.*expensive.*average|typical.*order/i
    ]
  }
};
```

**Step 2: Implement function**

```typescript
async function getAverageOrderValue(): Promise<number> {
  const cacheKey = 'woo_avg_order_value';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const orders = await wooAPI.getOrders({ per_page: 100 });
    const total = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const avg = total / orders.length;
    
    cache.set(cacheKey, avg, CACHE_TTL);
    return avg;
  } catch (error) {
    return fallback.getShopStats().averageOrderValue || 0;
  }
}
```

**Step 3: Integrate into chatbot**

```typescript
// In chatbot-message.ts

if (matchesIntent(userMessage, 'avgOrderValue')) {
  const value = await functionCaller.getAverageOrderValue();
  systemPrompt += `\nAverage order value: €${value.toFixed(2)}`;
}
```

**Step 4: Test**

```typescript
// Test locally
const result = await getAverageOrderValue();
console.log(`Avg Order: €${result}`); // Should be realistic
```

---

### Extending Fallback Logic

**Current:**
```typescript
try {
  const live = await wooAPI.getProducts();
  return live;
} catch (error) {
  const fallback = await getShopStats();
  return fallback.products; // Cached/persistent data
}
```

**Enhanced (Multi-Fallback):**
```typescript
try {
  return await wooAPI.getProducts(); // Live
} catch (error1) {
  try {
    return await getShopStats(); // Cache
  } catch (error2) {
    return loadFromFile('products.json'); // File backup
  }
}
```

---

### Using Query History

The chatbot stores the last 10 user queries for context:

```typescript
// In chatbotFunctionCaller.ts
const queryHistory = [
  "How many products?",
  "What are top sellers?",
  "Check inventory?"
];

// GPT-4o receives additional context:
systemPrompt += `\nPrevious questions: ${queryHistory.join(", ")}`;
```

This enables **contextual answers** instead of isolated responses.

---

## Roadmap

### Phase 1: Short-term (Q1 2026)

- ✅ Live data for products, categories, orders, customers
- ✅ Fallback mechanisms
- ✅ Caching (5 min TTL)
- ✅ Query history (10 entries)
- 🔄 **This documentation** ← You are here

### Phase 2: Medium-term (Q2 2026)

- 📋 **Light Feedback Loop:** Thumbs up/down on answers
  - Store in JSON logs (no DB!)
  - Basis for prompt optimization
  
- 📊 **Extended Intents:**
  - Revenue today (daily revenue)
  - Conversion funnel
  - Return rate
  
- 🧠 **Persistent Query History:**
  - Store in localStorage (frontend) or Redis
  - Enable contextual follow-up questions

### Phase 3: Long-term (Q3+ 2026)

- 📚 **Knowledge Base:** JSON/YAML FAQs (git-versioned)
  - "How long does shipping take?" → Answer from KB
  - Admin UI for editing

- 🔄 **Long-term Learning:** 
  - Frequent questions → Add to FAQ
  - Poor answers → Prompt tuning

- 📈 **Analytics:**
  - Intent hit-rate dashboard
  - Track fallback ratio
  - User satisfaction score

- 🤖 **Advanced NLP:**
  - Entity recognition ("Product XYZ" → load ID)
  - Sentiment analysis
  - Multi-turn conversations

---

## FAQ for Users

**Q: Is the chatbot a learning system?**  
A: Not yet – it uses only short-term memory (query history). Long-term learning is planned for Q2 2026.

**Q: Why sometimes 0 customers?**  
A: That was a bug (missing `role=all` parameter). Fixed since commit `5762eba`.

**Q: Can I clear the cache?**  
A: Yes, restart backend clears it. Or via API (future).

**Q: What data is stored?**  
A: Query history (memory), cache (RAM), no persistent log (except debug logs).

---

## Support & Contact

- **Bugs:** Open issue on GitHub
- **Questions:** See [DEVELOPER_FAQ.md](DEVELOPER_FAQ.md)
- **Feature Requests:** Create discussion on GitHub

---

**Happy chatting with your intelligent shop assistant!** 🚀
