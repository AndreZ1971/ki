# A.R.I. User Guide

## ⚠️ Notice About Shop Metrics and Mock Data

**Important:** The revenue charts in Shop Metrics currently use **intentional mock data** instead of live WooCommerce data.

### Why Mock Data?

These visualizations serve as a **vision and roadmap** for A.R.I.'s future development:

- 📊 **Concept Demonstration**: Shows what comprehensive revenue analytics will look like
- 🎯 **Feature Roadmap**: Illustrates planned analytics capabilities
- 💡 **User Experience Preview**: Gives users a preview of upcoming dashboards
- 🔮 **Development Goal**: Symbolizes the intended data integration

### What is Affected?

- **Only** the revenue chart in the dashboard

Everything else uses live data.

### Real Data vs. Mock Data

✅ **Real WooCommerce Data is used for:**
- Product listings and inventory
- Order history (Analytics Insights Loop)
- Categories and attributes
- Customer data

⚠️ **Mock Data is used for:**
- Revenue chart in the dashboard

### Future Development

These mock visualizations will be gradually replaced with real WooCommerce data integration once:
1. WooCommerce Analytics API is fully integrated
2. Performance optimizations for large datasets are implemented
3. Caching mechanisms for real-time metrics are available

---
 v7.0.3 (January 2026)

**Status:** Production Ready with advanced trend analysis and price optimization

---

## 🎯 Quick Start

### What do I need?
- Active WooCommerce Shop with API enabled
- WordPress user account
- OpenAI API Key (enter in `connection.json`)
- Optional: Reddit OAuth Credentials (for real customer opinions)
- Optional: YouTube OAuth (for video uploads to YouTube)

### What happens automatically?
A.R.I. reads your data (products, orders, trends) and creates **hints, drafts, and suggestions**. You review and decide – no autonomous shop changes without your approval.

---

## 🎥 Social Media & Marketing

### 🆕 Social Media Poster (with YouTube Video Upload)
**What it does:** Publish marketing content across multiple platforms (LinkedIn, TikTok, Instagram, X/Twitter, Facebook, **YouTube**).

**New in v6.4:**
- **YouTube Video Upload**: Upload videos directly with auto-generated metadata
- **Metadata Auto-Generation**: Title, tags, description generated from your text
- **Cross-Platform**: Write once, publish to multiple channels

**Usage:**
1. Open "Social Media Poster"
2. Write your content text (first sentence becomes title)
3. Use hashtags in text → automatically become YouTube tags
4. **For YouTube:** Select video file (MP4, MOV, AVI, etc.)
5. Preview: Title, Tags, Description
6. Click "Publish to YouTube"
7. Video uploads with metadata

**Example:**
```
Content Text:
"🚀 Our new course is live! #ArtificialIntelligence #Learning #Tech

Learn AI basics in 4 hours with hands-on projects..."

YouTube Metadata (auto-generated):
- Title: "🚀 Our new course is live!"
- Tags: ["ArtificialIntelligence", "Learning", "Tech"]
- Description: "Learn AI basics in 4 hours with hands-on projects..."
```

**Highlights:**
- All platforms optional (enable/disable as you like)
- OAuth connection one-time, then automatic
- Video upload runs in background
- Phase 2 (planned): Auto-generate videos from text

**Required Connections:**
- YouTube OAuth (see Social Media Onboarding Guide)
- Other platforms optional (LinkedIn, TikTok, etc.)

**YouTube Setup (one-time):**
1. Go to Settings → Social Media Connections → YouTube
2. Click "Connect to YouTube"
3. Sign in with your Google Account
4. Approve permissions
5. Done! Tokens are automatically saved

---

## 📦 Product Management

### 🆕 Woo Product Update (with Trend Analysis)
**What it does:** Updates WooCommerce prices based on Google Trends + Reddit customer opinions.  
**New in v6.3:**
- **Percentage-Based Price Limits**: Max +20% increase / -15% reduction (adjustable)
- **Multi-Source Trends**: Google Trends (search interest) + Reddit (customer opinions)
- **Intelligent Fallbacks**: When trend data is weak, AI automatically scales percentage ranges
- **Manual Override**: You can review/change every suggestion before saving

**Usage:**
1. Select product in "Woo Product Updater"
2. Enter `maxPriceIncreasePercent` and `maxPriceDecreasePercent` (e.g., +20 / -15)
3. Click **"Analyze Trends"**
4. AI suggests new price (with reasoning: Google Trends Score, Reddit Sentiment, Confidence %)
5. **Either:** Click "✓ Apply" (save immediately) **or** "Manual Edit" (customize + save)

**Example:**
- Current Price: €50
- Max Increase: +20% → €60
- Max Decrease: -15% → €42.50
- Google Trends Score: 65/100 (interest declining)
- Reddit: Customers want lower price
- **AI Suggestion:** €47 (-6%) with 78% Confidence
- ✓ You click "Apply" → Price updates to €47

**Limitations:** Percentage limits are guidelines, not hard caps – AI can deviate if trend data is very strong. Always review before saving!

### Product Analyzer  
**What it does:** 360° check of your product (SEO score, description quality, price positioning).  
**Input:** Product ID.  
**Output:** Score card with insights & improvement suggestions.  
**Limitations:** Analysis hints only; no auto-changes.

### Auto Product Creator
**What it does:** Generates product texts, image prompts, keywords with AI.  
**Input:** Product title, category, keywords.  
**Output:** Description draft + DALL-E image prompt.  
**Limitations:** You save manually to WooCommerce.

### Categories Manager
**What it does:** Creates/edits WooCommerce categories.  
**Input:** Category data.  
**Output:** Categories in WooCommerce (after your click).  
**Limitations:** Manual saving required.

### Create Freebies  
**What it does:** Creates digital freebie products (€0, downloadable).  
**Input:** Your ZIP/PDF file, product info.  
**Output:** Freebie entry in WooCommerce (with your file).  
**Limitations:** You provide file; A.R.I. doesn't create content.

### Product Bundles
**What it does:** Combines multiple products into bundles.  
**Input:** Product IDs, bundle name.  
**Output:** Bundle draft.  
**Limitations:** You save to WooCommerce.

---

## 📊 Analytics & Insights

### 🆕 Trend Analysis (Multi-Source)
**What it does:** Detects trends via **Google Trends**, **Reddit Discussions**, **Wikipedia Pageviews**, **Google News**, and more.  
**New in v6.3:**
- **Google Trends**: 7-day average of search queries
- **Reddit OAuth**: Real customer opinions from r/ecommerce, r/shopping, etc. (not just Public API)
- **Wikipedia**: International trend indicators
- **Google News**: News trends in the field
- **Planned (Phase 1):** YouTube trending videos

**Usage:**
1. Enter product name (e.g., "laptop backpack")
2. Click "Analyze Trends"
3. See: Google Trend Score (0-100), Reddit Sentiment (Pos/Neg/Neutral), Confidence %
4. AI combines data → price suggestion

**Example:**
- Google Trends: 72/100 (high search interest)
- Reddit: +65 upvotes for "good quality for price", -30 for "too expensive"
- Confidence: 82%
- **Suggestion:** Mid-range price with strong quality messaging

**Limitations:** Trends are delayed (Google Trends max 7 days old). Reddit data only for English discussions (currently).

### Shop Metrics
**What it does:** Live KPIs from WooCommerce (sales, orders, conversion).  
**Input:** WooCommerce API.  
**Output:** Dashboard with real-time data.  
**Limitations:** Read-only access.

### Conversion Analysis
**What it does:** Analyzes where users drop off in the funnel.  
**Input:** Analytics data, time period.  
**Output:** Funnel with drop-off points.  
**Limitations:** Suggestions; no auto-fixes.

### Feedback Analysis
**What it does:** Sentiment analysis of reviews + support tickets.  
**Input:** WooCommerce reviews, Awesome Support tickets.  
**Output:** Sentiment report, top issues, priorities.  
**Limitations:** Analysis hints; no auto-responses.

### Real Analytics
**What it does:** Live dashboard with visitors, clicks, sessions.  
**Input:** Tracking code installed.  
**Output:** Real-time metrics.  
**Limitations:** Display only.

### Shop Health Report
**What it does:** 360° shop audit (performance, SEO, security, conversion).  
**Input:** Shop URL.  
**Output:** Score + problem list with priorities.  
**Limitations:** No auto-repair.

### Premium/Standard/Mini Audit
**What it does:** Various audit depths (Premium = detailed; Mini = quick).  
**Input:** Shop URL, audit type.  
**Output:** Audit report.  
**Limitations:** Suggestions; you implement.

---

## 💳 Payment Processing

### Payment Verifier
**What it does:** Checks payments for fraud/errors.  
**Input:** Transactions.  
**Output:** Verification status (OK/Suspicious/Error).  
**Limitations:** Suggestions; no auto-blocks.

### Payment Tester
**What it does:** Automatically tests payment flows (success rate, speed).  
**Input:** Test scenarios.  
**Output:** Test report.  
**Limitations:** Tests only.

### Payment Emergency
**What it does:** Emergency analysis for payment issues (system outage).  
**Input:** Incident trigger.  
**Output:** Response plan.  
**Limitations:** You activate emergency measures.

### Payment Expansion
**What it does:** Plans expansion of payment options (new countries, currencies).  
**Input:** New payment providers.  
**Output:** Integration plan.  
**Limitations:** You implement.

---

## 📧 Marketing

### 🆕 Social Media Poster (6 Platforms)
**What it does:** Creates post drafts for LinkedIn, Facebook, Instagram, TikTok, X (Twitter), YouTube.  
**Input:** Topic, audience, tone.  
**Output:** Platform-specific post drafts (with hashtags, emojis, timing suggestions).  
**New in v6.3:**
- Dark Glass UI for better readability
- Percentage engagement forecasts
- Copy/paste option (no API token needed)

**Usage:**
1. Enter topic (e.g., "New Winter Sale")
2. Select platforms (individually or all)
3. Tone: Professional / Playful / Viral
4. Click "Generate Posts"
5. **Either:** Posts manually copy & post **or** Enter API tokens in Settings for auto-posting

**Limitations:** API tokens required for auto-posting (see `social_media_onboarding.md` for setup).

### AI Email Generator
**What it does:** Creates email drafts (newsletters, welcome, winback).  
**Input:** Topic, audience, tone.  
**Output:** Email draft with subject line and body.  
**Limitations:** You send manually (Mailchimp, Brevo, etc.).

### Blogpost Generator
**What it does:** Generates blog article drafts (SEO-optimized).  
**Input:** Topic, keywords, length (short/medium/long).  
**Output:** Article draft (Markdown).  
**Limitations:** You review and publish to WordPress.

### Kite Templates
**What it does:** Template library (emails, landing pages, posts).  
**Input:** Template type.  
**Output:** Customizable template.  
**Limitations:** You edit and publish.

### Image Analyzer
**What it does:** Checks images (SEO alt-text, quality, size).  
**Input:** Image URL.  
**Output:** Analysis report with improvement suggestions.  
**Limitations:** Suggestions; no auto-optimization.

---

## 🧠 Advanced Features

### Context Generator
**What it does:** Optimizes AI prompts for better results.  
**Input:** Use case / request.  
**Output:** Optimized context/prompt.  
**Limitations:** You use output in other tools.

### Memory System
**What it does:** AI learns your preferences (tone, length, style).  
**Input:** Your interactions.  
**Output:** Personalized results (e.g., "We know you like short, punchy texts").  
**Limitations:** RAM-based, reset on restart.

### User Management
**What it does:** Analyzes customer behavior (top customers, churn risk, personalized offers).  
**Input:** Customer data from WooCommerce.  
**Output:** Customer dashboard + personalized suggestions.  
**Limitations:** Suggestions; you decide on offers.

### System Health
**What it does:** Checks system health (API status, CPU, memory, error rate).  
**Input:** Monitoring.  
**Output:** Health dashboard with alerts.  
**Limitations:** Monitoring only; no auto-repair.

---

## ⚙️ Configuration

### Set up credentials
**All credentials in:** `backend/connection.json` (git-ignored)

```json
{
  "woocommerce": {
    "url": "https://your-shop.com",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_..."
  },
  "openAI": {
    "apiKey": "sk-proj-...",
    "model": "gpt-4o-mini"
  },
  "reddit": {
    "clientId": "0Fju4VBi...",
    "clientSecret": "gVVZ2p6u..."
  }
}
```

### Dark Glass Theme
The system automatically uses a dark glass-morphism design with:
- Rgba backgrounds (rgba(36,44,68,0.75))
- Blur effects (backdrop-filter: blur(10px))
- Light text (#f7f9ff) on dark background
- High contrast (WCAG 2.1 AA)

No additional configuration needed.

---

## 🆕 Percentage-Based Price Limits Explained

### Why percentages instead of fixed € values?
- **Problem:** A limit like "max €10 reduction" works for €20 products but not €200 products
- **Solution:** Percentage limits scale automatically

### How does it work?
```
Current Price: €100
maxPriceIncreasePercent: 20% → Maximum: €120
maxPriceDecreasePercent: 15% → Minimum: €85

AI Trend Score: 65/100 (medium)
Dynamic Fallback: (65-50)/50 = 0.30 → 30% of max reduction used
Calculation: €100 - (€15 × 0.30) = €100 - €4.50 = €95.50

**Suggestion: €95.50 instead of hard €85**
```

### What is the "dynamic fallback logic"?
When trend data is weak (score < 50), AI scales the price reduction to avoid always using the maximum. This prevents all prices from landing on the same floor.

---

## 🔧 Common Issues

### "Trend analysis not working"
1. **Check:** Are Reddit credentials entered in `connection.json`?
   - If No → Enter + restart backend
   - If Yes → Next step

2. **Check:** Is OpenAI API key present?
   - If No → Enter + restart backend

3. **Check:** Open browser console (F12) → check for errors

### "Price not updating"
1. **Check:** Did you click "Apply" or "Manual Edit"?
   - "Manual Edit" does NOT save automatically
   - You must click "Save" again

2. **Check:** Errors in browser console?

### "Posts not posting to social media"
1. **Check:** Did you enter API tokens in Settings → Social Media?
   - See `social_media_onboarding.md` for instructions

2. **Check:** Are tokens valid and not expired?
   - Reddit OAuth tokens: 1 hour valid
   - Facebook/LinkedIn/TikTok: Various refresh intervals

---

**All tools work assistively – your control always remains. Good luck! 🚀**

### Shop Metrics
**What it does:** Reads basic KPIs from WooCommerce (sales, orders, conversion, customers).  
**Input:** WooCommerce API credentials.  
**Output:** Dashboard with live metrics.  
**Limitations:** Read-only access, no shop changes.

### Conversion Analysis
**What it does:** Analyzes conversion funnel (where do users drop off?).  
**Input:** Analytics data, time period.  
**Output:** Funnel report with drop-off points.  
**Limitations:** Suggestions only; no auto-fixes.

### Feedback Analysis
**What it does:** Analyzes WooCommerce reviews and support tickets (via Awesome Support plugin).  
**Input:** Reviews + tickets from WooCommerce/WordPress.  
**Output:** Sentiment analysis, insights, priorities.  
**Limitations:** No auto-responses, analysis only.

### Conversion Reported
**What it does:** Creates automated conversion reports.  
**Input:** Time period, conversion goals.  
**Output:** PDF/Excel report.  
**Limitations:** Reporting only, no live optimization.

### Trend Analysis
**What it does:** Detects trends in sales/traffic/demand.  
**Input:** Historical data, time series.  
**Output:** Trend progression, forecasts.  
**Limitations:** Suggestions, no auto-actions.

### Run Trend Analysis
**What it does:** Starts trend analysis job manually.  
**Input:** Click on "Run".  
**Output:** Trend report.  
**Limitations:** Manual trigger required.

### Real Analytics
**What it does:** Shows live metrics in real-time.  
**Input:** WooCommerce connection.  
**Output:** Real-time dashboard.  
**Limitations:** Display only, no changes.

### Real Web Analytics
**What it does:** Web analytics in real-time (visitors, clicks, sessions).  
**Input:** Tracking code installed.  
**Output:** Live visitor data.  
**Limitations:** Observation only.

### Analytic Regioning
**What it does:** Geo/regional analysis (where do customers come from?).  
**Input:** Order data with locations.  
**Output:** Regional heatmap, top regions.  
**Limitations:** Insights only, no auto-campaigns.

### Shop Health Report
**What it does:** Comprehensive shop health check (performance, SEO, security).  
**Input:** Shop URL.  
**Output:** Health score, issue list.  
**Limitations:** No auto-repair.

### Premium Audit
**What it does:** In-depth business audit (competition, market, finances).  
**Input:** Shop data, market info.  
**Output:** Detailed audit report.  
**Limitations:** Analysis only, no implementation.

### Standard Audit
**What it does:** Standard audit (performance, SEO, UX).  
**Input:** Shop URL.  
**Output:** Audit report with recommendations.  
**Limitations:** Suggestions only.

### Mini Audit
**What it does:** Quick audit-lite (load times, mobile, basics).  
**Input:** Shop URL.  
**Output:** Quick-check report.  
**Limitations:** Surface-level, no deep analysis.

---

## Products (9)

### Auto Product Creator
**What it does:** Creates marketing material for products (texts, image prompts) with AI. **Not** the product itself.  
**Input:** Title, category, keywords, tone.  
**Output:** Description draft, image prompt.  
**Limitations:** You must provide the physical/digital product; A.R.I. creates only texts/images. Manual save in WooCommerce.

### Run Auto Product Creator
**What it does:** Starts Auto Product Creator job immediately (generates marketing material).  
**Input:** Click.  
**Output:** Product draft (texts/images). **You must provide product itself.**  
**Limitations:** Manual trigger, no auto-upload, no product creation.

### Woo Product Create
**What it does:** Creates new WooCommerce product.  
**Input:** Product data (name, price, description).  
**Output:** Product in WooCommerce.  
**Limitations:** Only after your click on "Save".

### Woo Product Update
**What it does:** Updates existing WooCommerce product.  
**Input:** Product ID, new data.  
**Output:** Updated product.  
**Limitations:** Only after approval.

### Product Analysis
**What it does:** Analyzes products (score, metrics, recommendations).  
**Input:** Product ID.  
**Output:** Analysis report with optimization suggestions.  
**Limitations:** Suggestions only, no auto-changes.

### Categories Manager
**What it does:** Manages WooCommerce categories (create, rename).  
**Input:** Category data.  
**Output:** Categories in WooCommerce.  
**Limitations:** Only after click.

### Create Freebies
**What it does:** Creates freebie product entries in WooCommerce (€0, digital, downloadable). **You must provide the file (ZIP/PDF).**  
**Input:** ZIP/cover (from you), product info.  
**Output:** Freebie product entry with your file.  
**Limitations:** A.R.I. only uploads what you provide; creates no content. Manual save.

### Run Create Freebies
**What it does:** Starts freebie job immediately (upload your provided file).  
**Input:** Click + your file (ZIP/PDF).  
**Output:** Freebie draft with your file.  
**Limitations:** You must provide file; A.R.I. creates no content. You save.

### Product Bundles
**What it does:** Creates product bundles (multiple products together).  
**Input:** Product IDs, bundle name.  
**Output:** Bundle draft.  
**Limitations:** You create bundle in WooCommerce.

---

## Payments (12)

### Payment Fast
**What it does:** Accelerates payment processing (one-click, tokenization).  
**Input:** Payment methods.  
**Output:** Optimized checkout flows.  
**Limitations:** Configuration required, no auto-activation.

### Payment Simplified
**What it does:** Simplifies checkout (fewer steps, auto-fill).  
**Input:** Checkout process.  
**Output:** Simplified flow.  
**Limitations:** You activate changes.

### Payment Tester
**What it does:** Tests payment flows automatically.  
**Input:** Test scenarios.  
**Output:** Test report with success rates.  
**Limitations:** Tests only, no live fixes.

### Payment Verifier
**What it does:** Verifies payments (fraud check, validation).  
**Input:** Transactions.  
**Output:** Verification status.  
**Limitations:** Suggestions, no auto-blocks.

### Payment Success
**What it does:** Monitors success rates, conversion.  
**Input:** Payment data.  
**Output:** Success rate dashboard.  
**Limitations:** Monitoring only.

### Payment Validation
**What it does:** Validates payments (card, identity, risk).  
**Input:** Payment details.  
**Output:** Validation report.  
**Limitations:** Suggestions only.

### Payment Issues Detector
**What it does:** Detects payment problems (errors, declines).  
**Input:** Transaction logs.  
**Output:** Issue list.  
**Limitations:** No auto-fixes, suggestions only.

### Payment User Favor
**What it does:** Optimizes payment UX (preferred payment methods).  
**Input:** User preferences.  
**Output:** Personalized checkout options.  
**Limitations:** You activate changes.

### Payment Delivery
**What it does:** Manages payment-delivery flow (shipment after payment).  
**Input:** Order data.  
**Output:** Delivery status.  
**Limitations:** No auto-shipment triggers.

### Payment Emergency
**What it does:** Emergency mode for payment problems (system failure).  
**Input:** Incident trigger.  
**Output:** Emergency response plan.  
**Limitations:** You activate emergency plans.

### Payment Expansion
**What it does:** Expands payment options (international currencies, new methods).  
**Input:** New payment partners.  
**Output:** Integration plan.  
**Limitations:** You implement.

### Payment Quick Check
**What it does:** Quick payment status check.  
**Input:** Transaction ID.  
**Output:** Status (succeeded/failed).  
**Limitations:** Status only, no repair.

---

## Marketing (10)

### AI Email Generator
**What it does:** Creates email drafts with AI.  
**Input:** Topic, target audience, tone.  
**Output:** Email draft.  
**Limitations:** You send manually or via ESP.

### English Content Generator
**What it does:** Generates English marketing texts.  
**Input:** Keywords, target audience.  
**Output:** Text draft (blog, social, product).  
**Limitations:** You review and publish.

### Email Marketing Automation
**What it does:** Creates email sequences (welcome, winback).  
**Input:** Sequence type.  
**Output:** Email series.  
**Limitations:** You activate in ESP/CRM.

### Social Media Audio
**What it does:** Creates audio content for social media.  
**Input:** Text/script.  
**Output:** Audio file.  
**Limitations:** You post manually.

### Social Media Poster
**What it does:** Creates social post drafts for LinkedIn, Facebook, Instagram, TikTok, X (Twitter), YouTube.  
**Input:** Topic, target audience, tone, platform selection.  
**Output:** Ready post drafts with hashtags/emojis (optional).  
**Limitations:** Publishing requires API token input in **Settings → Social Media** (access tokens per platform) + your click. Without tokens only copy/paste possible. Technical token generation see `social_media_onboarding.md`.

### Free to Post Converter
**What it does:** Converts free users to active posters (activation campaigns).  
**Input:** User segments.  
**Output:** Campaign draft.  
**Limitations:** You start campaign.

### Content Monetized
**What it does:** Monetizes content (paywall, affiliate, digital products).  
**Input:** Content type.  
**Output:** Monetization plan.  
**Limitations:** You implement.

### Kite Templates
**What it does:** Template library for emails, landing pages, posts.  
**Input:** Template type.  
**Output:** Customizable template.  
**Limitations:** You edit and publish.

### Blogpost Generator
**What it does:** Generates blogpost drafts.  
**Input:** Topic, keywords, length.  
**Output:** Blogpost draft.  
**Limitations:** You review and publish in WordPress.

### Image Analyzer
**What it does:** Analyzes images (SEO, alt text, quality).  
**Input:** Image URL.  
**Output:** Analysis report.  
**Limitations:** Suggestions only, no auto-optimization.

---

## Advanced (7)

### Context Generator
**What it does:** Generates AI contexts/prompts for better results.  
**Input:** Use case.  
**Output:** Optimized context/prompt.  
**Limitations:** You use context in other tools.

### String Generator
**What it does:** Generates strings/patterns (code, test data, UUIDs).  
**Input:** String type, format.  
**Output:** Generated strings.  
**Limitations:** Generation only, no auto-integration.

### Auto Framplementator
**What it does:** Creates framework/boilerplate setup (React, Node, etc.).  
**Input:** Framework type, project name.  
**Output:** Project setup.  
**Limitations:** You review and deploy.

### WooCommerce Sync
**What it does:** Synchronizes WooCommerce data (products, orders, customers).  
**Input:** Sync areas, interval.  
**Output:** Sync report.  
**Limitations:** No auto-mutations, sync/read only.

### Memory System
**What it does:** AI memory for personalized results (user preferences, context).  
**Input:** Interactions.  
**Output:** Personalized suggestions.  
**Limitations:** Temporary in RAM, no long-term storage.

### System Health
**What it does:** Checks system status (CPU, memory, API status).  
**Input:** Monitoring areas.  
**Output:** Health dashboard.  
**Limitations:** Monitoring only, no auto-repair.

### User Management (Customer Intelligence)
**What it does:** Analyzes customer behavior (revenue per user, order history, shop visits, engagement).  
**Input:** Customer data from WooCommerce/WordPress.  
**Output:** Customer dashboard with metrics; AI-generated personalized offer suggestions.  
**Limitations:** Suggestions/analyses only; you decide on offers and delivery.

---

**All 51 tools work assistively. Changes go live only with your approval. No autonomous shop mutations, posts, or price changes.**
