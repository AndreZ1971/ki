# 🗺️ A.R.I. Update Roadmap

**Version**: 6.3.0+  
**Status**: Living Document  
**Last Update**: January 7, 2026

---

## 📋 Overview

This roadmap defines strategic updates for A.R.I. following the successful v6.3.0 release. The focus is on **refining existing features**, **expanding AI capabilities**, and **internationalization**.

---

## 🎯 Update Strategy

### Parallel Development (continuous)
- **Track 1**: Tool Prompt Optimization
- **Track 4**: i18n Expansion & Improvement
- **Track 5**: New Specializations

### Sequential Development (by priority)
- **Track 2**: Voice/TTS Integration (after Track 1)
- **Track 3**: ML Feature Expansion (after Track 2)

---

## 🔧 Track 1: Tool Prompt Optimization

### 🎯 Goal
All 52 tools should use **specialization-based prompts** to deliver more precise, contextual responses.

### 📊 Current State
- Currently: Generic prompts for all shops
- Problem: Recommendations are too generic, ignore shop specialization
- Example: Fashion shop receives tech product suggestions

### ✅ Actions

#### Phase 1: Analysis & Template Creation (2 weeks)
- [ ] Audit all 52 tool prompts (`backend/tools/`)
- [ ] Create specialization template (`{SPEC_CONTEXT}`, `{SPEC_TONE}`, `{SPEC_FOCUS}`)
- [ ] Document best practices

#### Phase 2: Category-based Optimization (6 weeks)
- [ ] **Analytics (13 Tools)**: Shop health reports with spec metrics
  - Example: Fashion → seasonality, Tech → product cycles
- [ ] **Product Management (8 Tools)**: Content generation with spec vocabulary
  - Example: Fashion → style/material/size, Tech → specs/compatibility
- [ ] **Payment (13 Tools)**: Fraud detection with spec thresholds
  - Example: Digital products → lower threshold
- [ ] **Marketing (10 Tools)**: Tone-of-voice from specialization
  - Example: Luxury → formal, Youth → casual
- [ ] **Advanced (9 Tools)**: Memory context with spec preferences

#### Phase 3: Testing & Rollout (2 weeks)
- [ ] A/B tests: Generic vs. Spec prompts
- [ ] Metrics: Conversion lift, user satisfaction, tool usage
- [ ] Rollout: Feature flag `USE_SPEC_PROMPTS=true`

### 📈 Success Criteria
- Min. **20% improvement** in tool recommendation quality (user feedback)
- Max. **10% token overhead** per request
- 100% of tools support spec context

---

## 🎤 Track 2: Voice/TTS Integration

### 🎯 Goal
Chat-bot can **speak** – insights, recommendations, and notifications are read aloud.

### 📊 Current State
- Currently: Text-based chat only
- Use case: Merchants in warehouse, while packing, on the go – hear updates

### ✅ Actions

#### Phase 1: Browser-based TTS (4 weeks)
- [ ] **Frontend**: Web Speech API integration
  - `SpeechSynthesis` for browser TTS
  - Voice selection (male/female, language)
  - Speed/pitch controls
- [ ] **UI**: Speaker icon in chat interface
  - Play/Pause/Stop controls
  - Auto-read for new messages (optional)
- [ ] **Accessibility**: Screen reader compatibility

#### Phase 2: OpenAI TTS Integration (Optional, 2 weeks)
- [ ] **Backend**: `/api/tts/generate` endpoint
  - OpenAI TTS-1/TTS-1-HD models
  - Audio caching for frequent phrases
- [ ] **Frontend**: Audio player for TTS files
  - Download option for insights
- [ ] **Cost Control**: TTS only for important notifications

#### Phase 3: Voice Commands (Future)
- [ ] Speech-to-text for chat input
- [ ] Voice activation ("Hey A.R.I.")

### 📈 Success Criteria
- Min. **15% of users** activate voice feature
- Latency < 2 seconds (browser TTS) / < 5 seconds (OpenAI TTS)
- Positive accessibility feedback

---

## 🤖 Track 3: ML Feature Expansion

### 🎯 Goal
Activate the **3 prepared ML features**: Dynamic pricing, churn prediction, fraud detection.

### 📊 Current State
- Already prepared in `backend/ml/` and `ml.config.ts`
- Features are disabled: `dynamicPricing: false`, `churnPrediction: false`, `fraudDetection: false`
- Reason: Models require training data & testing

### ✅ Actions

#### Feature 1: Dynamic Pricing (8 weeks)
- [ ] **Model Training**:
  - Collect historical pricing data (min. 3 months)
  - Features: Day of week, season, competition, inventory, demand
  - Algorithm: Gradient Boosting (XGBoost/LightGBM)
- [ ] **Backend**: `/api/ml/pricing/suggest` endpoint
  - Input: Product ID
  - Output: `{ suggestedPrice, confidence, reasoning }`
- [ ] **Frontend**: Pricing dashboard
  - Price suggestion cards with confidence meter
  - Accept/Reject buttons (shop owner decides)
- [ ] **Safety**: Min/max price limits, human-in-the-loop

#### Feature 2: Churn Prediction (6 weeks)
- [ ] **Model Training**:
  - Features: Purchase frequency, recency, AOV, support tickets, email open rate
  - Binary classification: Churn risk (High/Medium/Low)
- [ ] **Backend**: `/api/ml/churn/predict` endpoint
  - Batch processing for all customers (nightly)
  - Store churn score in `customer_meta`
- [ ] **Frontend**: Churn dashboard
  - List of high-risk customers
  - Automatic winback email trigger
- [ ] **Agentic Loop**: Customer Winback Loop (new)
  - Detects churn risk → suggests winback campaign

#### Feature 3: Fraud Detection (6 weeks)
- [ ] **Model Training**:
  - Features: Payment velocity, geo mismatch, device fingerprint, order value anomaly
  - Multi-class: `safe`, `suspicious`, `fraudulent`
- [ ] **Backend**: `/api/ml/fraud/detect` endpoint
  - Real-time scoring at checkout
  - Threshold-based auto-blocking (configurable)
- [ ] **Frontend**: Fraud dashboard
  - Flagged orders with review queue
  - False positive feedback loop
- [ ] **Integration**: Extend Payment Verifier tool

### 📈 Success Criteria
- **Dynamic Pricing**: Min. **5% revenue lift** in A/B test
- **Churn Prediction**: Min. **70% accuracy**, **30% winback success rate**
- **Fraud Detection**: Max. **2% false positive rate**, **90% fraud detection rate**

---

## 🌍 Track 4: i18n Expansion & Improvement

### 🎯 Goal
Add new languages, improve existing translations.

### 📊 Current State
- Currently: German (DE), English (EN)
- Problem: Some translations are machine-generated/unnatural
- Missing markets: FR, ES, IT, PL, NL

### ✅ Actions

#### Phase 1: Improve Existing Languages (3 weeks)
- [ ] **Audit**: Review all `frontend/src/locales/` files
  - Mark inconsistencies (e.g., "Dashboard" vs. "Overview")
  - Document missing keys
- [ ] **Native Speaker Review**:
  - DE: Professional correction (especially tech terms)
  - EN: British vs. American English (standard: American)
- [ ] **Context-based Translations**:
  - Example: "order" (verb: to order, noun: order)
  - Correct pluralization (ICU MessageFormat)

#### Phase 2: Add New Languages (8 weeks)
- [ ] **French (FR)** – 2 weeks
  - Target market: France, Belgium, Switzerland, Canada
  - Special: Formal/informal ("tu" vs. "vous")
- [ ] **Spanish (ES)** – 2 weeks
  - Target market: Spain, Latin America
  - Special: EU Spanish vs. LATAM Spanish
- [ ] **Italian (IT)** – 2 weeks
  - Target market: Italy, Switzerland
- [ ] **Polish (PL)** – 1 week
  - Target market: Poland (growing e-commerce market)
- [ ] **Dutch (NL)** – 1 week
  - Target market: Netherlands, Belgium

#### Phase 3: Improve i18n Tooling (2 weeks)
- [ ] **Automatic Key Detection**: Delete unused keys
- [ ] **Translation Memory**: Reusable phrases
- [ ] **Crowdin/Lokalise Integration**: For community translations
- [ ] **Language Switcher UX**: Flag icons + auto-detect (browser locale)

### 📈 Success Criteria
- Min. **5 languages** (DE, EN, FR, ES, IT + bonus PL, NL)
- 100% translation coverage (no missing keys)
- Native speaker approval for all languages

---

## 🏪 Track 5: New Shop Specializations

### 🎯 Goal
Provide specializations for **top e-commerce industries**.

### 📊 Current State
- Currently: Generic fallback, Fashion-Mode, Tech-Electronics
- Missing: Food, Beauty, Sports, Home & Garden, Digital Products, etc.

### ✅ Actions

#### Phase 1: Market Analysis & Prioritization (1 week)
- [ ] Identify top 10 e-commerce industries (revenue volume)
- [ ] Create specialization templates (system prompt, features, context)

#### Phase 2: Develop Specializations (12 weeks, parallel)

##### Priority 1 (6 weeks)
- [ ] **Food & Beverage** (Food, drinks, gourmet)
  - Features: Expiration tracking, recipe generation, allergen filter
  - Tone: Appetizing, inviting, health-conscious
- [ ] **Beauty & Cosmetics** (Cosmetics, care, perfume)
  - Features: Skin type analysis, ingredient scanner, before/after trends
  - Tone: Luxurious, confident, inclusive
- [ ] **Sports & Fitness** (Sports equipment, fitness gear, outdoor)
  - Features: Activity matching, size guide, performance metrics
  - Tone: Motivating, dynamic, performance-oriented

##### Priority 2 (6 weeks)
- [ ] **Home & Garden** (Furniture, decor, garden, DIY)
  - Features: Room planner, style matching, seasonal trends
  - Tone: Cozy, inspiring, sustainable
- [ ] **Digital Products** (Software, e-books, courses, downloads)
  - Features: License management, auto-delivery, anti-piracy
  - Tone: Professional, education-focused, innovative
- [ ] **Jewelry & Accessories** (Jewelry, watches, bags)
  - Features: Occasion matching, material guide, gift finder
  - Tone: Elegant, emotional, exclusive

#### Phase 3: Testing & Rollout (2 weeks)
- [ ] Beta testing with real shop owners (1 per industry)
- [ ] Feedback loop: Adjust prompts & features
- [ ] Documentation: Setup guides for each specialization

### 📈 Success Criteria
- Min. **6 new specializations** (+ 3 existing = 9 total)
- Each specialization tested with min. **1 live shop**
- User satisfaction score > 4.5/5

---

## 📅 Timeline

```
Q1 2026 (Jan-Mar)
├─ Track 1: Tool Prompt Optimization ████████████ (ongoing)
├─ Track 4: i18n DE/EN Improvement  ████░░░░░░░░
├─ Track 5: Food & Beauty Specs     ████████░░░░
└─ Track 2: Browser TTS (Start)     ░░░░░░░░████

Q2 2026 (Apr-Jun)
├─ Track 1: Tool Prompt Optimization ████████████ (ongoing)
├─ Track 4: FR/ES/IT Integration     ████████████
├─ Track 5: Sport/Home/Digital       ████████████
├─ Track 2: OpenAI TTS               ████████░░░░
└─ Track 3: Dynamic Pricing          ░░░░░░░░████

Q3 2026 (Jul-Sep)
├─ Track 1: Final Refinements        ████░░░░░░░░
├─ Track 4: PL/NL (Bonus)            ████░░░░░░░░
├─ Track 3: Churn & Fraud            ████████████
└─ Track 2: Voice Commands (R&D)     ░░░░░░░░░░░░
```

---

## 🎯 Success Measurement

### Key Performance Indicators (KPIs)

| Metric | Baseline (v6.3.0) | Target (v7.0.0) |
|--------|-------------------|-----------------|
| **Tool Recommendation Quality** | 3.5/5 | 4.2/5 |
| **Supported Languages** | 2 (DE, EN) | 5+ (DE, EN, FR, ES, IT) |
| **Available Specializations** | 3 | 9+ |
| **ML Features Active** | 0/3 | 3/3 (Pricing, Churn, Fraud) |
| **Voice Feature Adoption** | 0% | 15%+ |
| **Translation Coverage** | 92% | 100% |

---

## 🚀 Release Strategy

### Version Schema
- **v6.4.0**: Track 1 Phase 1-2 + Track 4 Phase 1
- **v6.5.0**: Track 5 Priority 1 (Food, Beauty, Sports)
- **v6.6.0**: Track 2 Phase 1 (Browser TTS)
- **v7.0.0**: Track 3 complete + Track 5 Priority 2 + Track 4 Phase 2

### Rollout Principles
- **Feature Flags**: All new features behind toggles
- **Beta Phase**: Min. 2 weeks for critical features
- **Backward Compatibility**: No breaking changes for existing specs
- **A/B Testing**: Track 1 & 3 with metrics comparison

---

## 📝 Notes

- **Dependencies**: Track 2 & 3 require stable tool prompts (Track 1)
- **Resources**: Track 4 & 5 are parallelizable (independent)
- **Risks**: ML features (Track 3) require sufficient training data
- **Community**: i18n crowdsourcing can accelerate Track 4

---

**Author**: André Zabel  
**Repository**: A.R.I. - Artificial Retail Intelligence System  
**Status**: ✅ Approved for Execution
