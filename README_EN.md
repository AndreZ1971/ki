# 🤖 A.R.I. - Artificial Retail Intelligence

<div align="center">

![Version](https://img.shields.io/badge/version-6.4.0-blue.svg)
![Tests](https://img.shields.io/badge/tests-350%2F350-success.svg)
![ML Integration](https://img.shields.io/badge/ML%20Integration-100%25-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**The Digital Employee for Your Online Store**

A system that analyzes, optimizes, and grows your WooCommerce shop –  
without you having to deal with technology, servers, or configuration.

[🚀 Installation](#installation) • [📚 Documentation](#documentation) • [💬 Support](#support) • [🔧 Features](#features)

</div>

---

## 📋 Table of Contents

- [The Vision](#the-vision)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Features](#features)
- [What Changes for You?](#what-changes-for-you)
- [Technology](#technology)
- [Tool Overview](#tool-overview)
- [Status & Roadmap](#status--roadmap)
- [Documentation](#documentation)
- [Support](#support)

---

## 🎯 The Vision

Shop owners spend most of their time on tasks that are repetitive and bring little joy:

- ✍️ Writing product descriptions
- 📱 Creating social media posts
- 📊 Analyzing data (which product is really performing well?)
- 📧 Writing emails (follow-ups, upsells, welcome series)
- 📈 Planning and implementing campaigns
- 🔍 Recognizing trends before the competition does

**A.R.I. gives you this time back.**

## ⚠️ The Problem

### Do You Know This Situation?

Your shop is thriving, but you're stuck. Conversion could be better. Customer communication is chaotic. Your bestseller products don't know they're bestsellers. And somehow you lack the capacity to reach the next growth level.

**All the work is on you. You are the bottleneck.**

This isn't scalable. This isn't sustainable. And it's not necessary, because:

> **80% of these tasks can be done better, faster, and more consistently with the help of AI.**

## ✅ The Solution

**A.R.I. helps you with the operational work of your shop. Simple. Intelligent. Around the clock.**

### 📦 Product Management
New products? A.R.I. analyzes trends, writes SEO texts, generates images, organizes everything – **ready to sell**. You approve, done.

### 📊 Real Insights
No more dashboard paralysis. A.R.I. tells you concretely: *"Your top product has an image problem – here are 3 concrete measures."* You make the decision, A.R.I. implements it.

### 📧 Intelligent Customer Relationships
Abandoned carts? Customers who haven't bought anything in a long time? A.R.I. knows them and creates personalized message drafts – you review and approve. That simple.

### 📱 Visible Everywhere
Your shop is on Facebook, Instagram, LinkedIn, TikTok, email. A.R.I. posts smartly, at the right time, with images and texts that work.

### 🔄 Constantly Getting Better
**44 specialized processes** run in the background. Your shop gets better every day – without your intervention.

## 🚀 Features

### 🤖 Agentic Loop Framework

4 specialized loop types work autonomously in the background:

#### 1. Anomaly Detection Loop 🚨
- Automatically detects payment anomalies
- **Types:** `failed_payment`, `unusual_amount`, `repeated_attempts`, `high_risk`
- Real-time monitoring & alerting

#### 2. Product Performance Loop 📈
- Automatically A/B tests product attributes
- **Enhances:** Price (-10%), title (+Bestseller), description (+Benefits)
- Continuous conversion improvement

#### 3. Payment Recovery Loop 💳
- Attempts failed orders with different strategies
- **Strategies:** Retry, Discount, Alternative Payment, Contact
- **Success Rate:** up to 60% with contact strategy

#### 4. Analytics Insights Loop 📊
- Automatically generates dashboard insights
- Detects anomalies and trends
- Delivers recommendations for actions

---

### 🛡️ Enterprise-Grade Error Handling

| Feature | Description |
|---------|-------------|
| **Circuit Breaker** | Protection against cascade failures (`CLOSED` → `OPEN` → `HALF_OPEN`) |
| **Retry Strategies** | Exponential backoff with jitter |
| **Dead Letter Queue** | Automatic recovery of failed jobs |
| **Multi-Channel Alerting** | Email, Slack, Webhooks |

---

### 🔧 51+ Intelligent Tools

> **Important:** All tools work assistively – drafts, analyses, and hints are generated; approvals and live changes remain always with you.

## 🎁 What Changes for You?

| Area | Improvement |
|------|-------------|
| ⏰ **Time** | You get your time back – **5–10 hours per week** less admin work |
| 💰 **Numbers** | Conversion increases, customers are better served, repeat purchases grow |
| 📊 **Insights** | You understand your business better – clear, actionable insights instead of data clutter |
| 🚀 **Scaling** | You can scale – without hiring more people |

### Concretely Implemented Through:

- ✅ Optimized product texts (SEO-optimized, sales-promoting)
- ✅ AI-generated product images (DALL-E integration)
- ✅ Real-time analytics with real recommendations
- ✅ Email automation (carts, welcome series, reactivation)
- ✅ Social media posts (6 platforms)
- ✅ Anomaly detection (problems are reported to you before they become critical)

## ⚙️ Technology

### Backend Stack

| Technology | Version | Usage |
|------------|---------|-------|
| Node.js | 18+ | Server Runtime |
| Fastify | 5.2.1 | REST API Framework |
| TypeScript | 5.8.3 | Type-Safe Development |
| OpenAI SDK | Latest | GPT-4, DALL-E, Embeddings |
| Vitest | 2.1.8 | Testing Framework |

### Frontend Stack

| Technology | Version | Usage |
|------------|---------|-------|
| React | 18.3.1 | UI Framework |
| Vite | 6.0.5 | Build Tool |
| Shadcn/ui | Latest | Component Library |
| Tailwind CSS | 3.4.17 | Styling |
| Framer Motion | Latest | Animations |

### 🤖 AI & ML Integration

- **GPT-4:** Planning Engine, Content Generation
- **GPT-4o-mini:** Fast analyses, user-favor detection
- **DALL-E:** Automatic image generation
- **Embeddings:** Semantic search & matching
- **Custom ML:** Trend analysis, sentiment detection, pattern recognition

### 🧠 AI Agent System

| Component | Description |
|-----------|-------------|
| **Planner** | GPT-4 planning engine for multi-step action plans |
| **Memory** | Conversation context management (128k token window) |
| **Tools** | 51+ specialized tools for WooCommerce, WordPress, OpenAI |
| **Scheduler** | Cron-based automation for 44 job types |

### 🛡️ Error Handling & Resilience

- **Circuit Breaker:** `Failure` → `OPEN` → `HALF_OPEN` → `Recovery Flow`
- **Retry Logic:** Exponential backoff with jitter
- **Dead Letter Queue:** Disk-based persistence of failed jobs
- **Alerting:** Email/Slack/Webhook multi-channel notifications

## 🔧 Tool Overview

### 📊 Analytics (13 Tools)

- **Shop Metrics:** Live KPIs (revenue, orders, conversion)
- **Conversion Analysis:** Funnel analysis with drop-off detection
- **Feedback Analysis:** Review & ticket sentiment analysis
- **Trend Analysis:** AI-powered trend detection
- **Real Analytics:** Real-time dashboard
- **Shop Health Report:** 360° shop audit
- **Premium/Standard/Mini Audit:** Various audit depths

### 📦 Product Management (8 Tools)

- **Product Analyzer:** ML-based product optimization
- **Auto Product Creator:** AI content generation
- **Categories Manager:** Intelligent category management
- **Product Bundles:** Bundle creation with AI suggestions
- **Freebies Creator:** Automatic free products
- **Notes Feature:** Storage location tracking with autosave

### 💳 Payment & Finances (13 Tools)

- **Payment Verifier:** ML-based transaction verification
- **Payment Tester:** Automated payment flow tests
- **Payment Emergency:** AI emergency analysis with GPT-4o-mini
- **Payment Expansion:** AI expansion planning
- **Payment Success:** Success rate tracking
- **+8 more payment tools** with ML integration

### 📧 Marketing & Content (10 Tools)

- **AI Email Generator:** Personalized email drafts
- **Social Media Poster:** 6 platforms (LinkedIn, Facebook, Instagram, TikTok, X, YouTube)
- **Blogpost Generator:** SEO-optimized blog posts
- **Image Analyzer:** AI image quality check
- **German Content Generator:** German marketing texts
- **+5 more content tools**

### 🧠 Advanced AI (9 Tools)

- **Context Generator:** AI prompt optimization
- **Memory System:** Persistent AI context
- **System Health:** Real-time monitoring
- **User Management:** Customer intelligence with ML personalization
- **Real Web Analytics:** Multi-source trend analysis
- **+4 more advanced tools**

> **💡 Important:** All tools work assistively – approvals always require your click!

## 📊 Status & Roadmap

### ✅ Current Status

| Metric | Status |
|--------|--------|
| **Version** | 6.0.0 – Production-Ready |
| **Tests** | 350/350 ✅ |
| **Workflows** | 44 automated jobs |
| **Languages** | German & English |
| **Stable since** | December 2025 |

### 🤖 ML/AI Integration Status

| Category | Tools | ML/AI | Status |
|----------|-------|-------|--------|
| Analytics | 13 | 🟢 13/13 | **100%** |
| Products | 8 | 🟢 8/8 | **100%** |
| Payments | 13 | 🟢 13/13 | **100%** |
| Marketing | 10 | 🟢 10/10 | **100%** |
| Advanced | 9 | 🟢 9/9 | **100%** |
| **TOTAL** | **53** | **🟢 53/53** | **100%** |

### 🆕 Recent Updates (December 16, 2025)

#### ✅ Critical Fixes:
- Rate-limiting protection (useEffect dependency hell solved)
- OpenAI description overflow fix (max 500 chars, HTML sanitization)
- IP-block prevention (404 monitoring implemented)
- TypeScript compilation fixes
- Duplicate handler fix

#### ✅ New Features:
- Product notes with autosave
- Character counter (0/1000 with warnings)
- Quick templates for fast notes
- Last-saved timestamp display

---

## 🛡️ Security & Compliance

### 🔐 Authentication

| Service | Method |
|---------|--------|
| **WooCommerce** | OAuth 1.0a |
| **WordPress** | Basic Auth with Application Passwords |
| **OpenAI** | API Key Authentication |

### 🔒 Privacy

- ✅ **GDPR-compliant:** All tools with privacy notices
- ✅ **OpenAI:** 30-day retention, RAM-only processing
- ✅ **No cookies:** Session-based authentication
- ✅ **Encryption:** AES-256-GCM for sensitive data

---

## 📚 Documentation

| Document | Description | Link |
|----------|-------------|------|
| 📖 **User Manual** | Complete user guide | [docs/english/USER_MANUAL.md](docs/english/USER_MANUAL.md) |
| 🔧 **Tool Documentation** | All 53 tools in detail | [docs/english/TOOLS_DOCUMENTATION.md](docs/english/TOOLS_DOCUMENTATION.md) |
| 💡 **User FAQ** | Frequently asked questions for shop owners | [docs/english/USER_FAQ.md](docs/english/USER_FAQ.md) |
| 🛠️ **Developer FAQ** | Technical FAQ for developers | [docs/english/DEVELOPER_FAQ.md](docs/english/DEVELOPER_FAQ.md) |
| 🛡️ **Security** | Security & best practices | [docs/english/SECURITY.md](docs/english/SECURITY.md) |
| 🧪 **Testing** | Test coverage & quality | [docs/english/TESTING.md](docs/english/TESTING.md) |
| 🚀 **Deployment** | Server setup & installation | [docs/english/DEPLOYMENT_GUIDE.md](docs/english/DEPLOYMENT_GUIDE.md) |

---

## 💬 Support

- **Email:** info@example.com
- **Website:** [example.com](https://example.com)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Credits

<div align="center">

**Developed with ❤️ by André Zabel ([@AndreZ1971](https://github.com/AndreZ1971))**

### Powered by:

![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![WooCommerce](https://img.shields.io/badge/WooCommerce-96588A?style=for-the-badge&logo=woocommerce&logoColor=white)
![WordPress](https://img.shields.io/badge/WordPress-21759B?style=for-the-badge&logo=wordpress&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

<div align="center">

### 🎯 Built for shop owners who want to use their time for the important decisions.

[🚀 Installation](docs/english/DEPLOYMENT_GUIDE.md) • [📚 Documentation](docs/english/USER_MANUAL.md) • [💬 Support](#support)


</div>
