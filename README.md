# 🚀 A.R.I. - AI-powered WooCommerce Automation Platform

**Version:** 6.0.0  
**Status:** Production-Ready

AI-gestütztes Business Automation System für WooCommerce/WordPress mit 130+ API-Endpoints, 44 automatisierten Workflows, ML-basierter Analytics und vollständiger Mehrsprachunterstützung.

---

## 📋 Features

### 🤖 **Automatisierung**
- **44 Job Workflows**: Produkt-Management, Content-Generierung, Analytics, Marketing, Payment-Management, Shop-Health
- **Cron-basiertes Scheduling**: Node-Cron für zeitgesteuerte Jobs
- **Circuit Breakers**: Automatische Fehlerbehandlung bei API-Ausfällen
- **Dead Letter Queue**: Automatisches Retry für fehlgeschlagene Jobs

### 📊 **Analytics & Reporting**
- Shop-Metriken (Umsatz, Bestellungen, Conversion)
- Echtzeit-Analytics (Live-Besucher, aktuelle Orders)
- Conversion-Funnel-Analyse mit Drop-Off-Detection
- Google Trends Integration für Keyword-Analyse

### 🎨 **Content & Marketing**
- AI Content Generator (GPT-4o-mini) für Produktbeschreibungen, Blog-Posts, E-Mails
- AI Image Generator (DALL-E) mit automatischem SEO
- Social Media Auto-Poster (Facebook, Instagram, LinkedIn, Twitter)
- Email Marketing Automation (Abandoned Cart, Welcome Series, Win-Back)

### 🏗️ **Architektur**
- **Stateless Design**: Keine persistente Datenspeicherung
- **Kubernetes-Ready**: Horizontale Skalierung, Container-Orchestrierung
- **Multi-Language**: Deutsch & Englisch (react-i18next)
- **Error Handling**: Circuit Breakers, Retry-Logik, DLQ

### 🤖 **44 Automated Job Workflows**

**Product Management** (11 jobs):
- Auto Product Creator (Google Trends integration)
- WooCommerce Product Creator/Updater
- Product Bundles Creator (15-30% discount)
- Freebie Creator (lead magnets)
- Categories Manager, Kits & Templates

**Content Generation** (3 jobs):
- AI Content Generator (GPT-4, SEO-optimized)
- German Content Generator (local compliance)
- AI Image Generator (DALL-E)

**Analytics & Reporting** (7 jobs):
- Daily/Weekly/Monthly reports
- Real-time analytics & conversion analysis
- Google Trends integration & forecasting

**Marketing Automation** (5 jobs):
- Email Marketing (abandoned cart, welcome series, win-back)
- Social Media Auto-Poster (Facebook, Instagram, LinkedIn, Twitter)
- Content Monetizer & Free-to-Paid Converter

**Pa🎨 **Premium Specializations Marketplace**

**10 Industry Specializations** (99€-149€ each):
- 🏨 **Travel & Hospitality**: Seasonal pricing, local attractions, travel tips
- 🏠 **Real Estate**: Property descriptions, legal compliance, location analysis
- 💻 **Tech & Electronics**: Spec tables, compatibility charts, tech support
- 👗 **Fashion & Apparel**: Size guides, material care, style recommendations
- 💄 **Beauty & Cosmetics**: INCI ingredient descriptions, health claims compliance
- 🏋️ **Sports & Fitness**: Training programs, nutrition plans, equipment guides
- 🍽️ **Food & Beverage**: Recipe ideas, allergen warnings, nutritional info
- 🏠 **Home & Garden**: DIY guides, maintenance tips, seasonal recommendations
- 📚 **Education & Courses**: Learning objectives, curriculum outlines, certification paths
- 🎮 **Gaming & Entertainment**: Platform compatibility, game guides, community features

**Revenue Forecast:** 30% adoption × 3 specializations × 124€ avg = 2.23M€ year 1

### 📊 **130+ API Endpoints**

**Categories:**
- Products (list, create, update, delete, bulk operations, AI descriptions)
- Analytics (shop metrics, conversion analysis, real-time data, trends)
- Audit (mini/standard/premium, shop scan, health reports)
- Email (send, AI generation, marketing automation)
- Marketing (workflows, social media, content monetization)
- System (health checks, circuit breakers, DLQ stats, memory management)
- Customers (list, stats, segmentation, subscribers)
- Agent (GPT-4 planning engine, tool execution)

### 🤖 **AI Integration**

- **GPT-4o-mini**: Product descriptions, email copy, content generation
- **DALL-E**: Product image generation with auto-SEO
- **Google Trends**: Keyword analysis, demand scoring, competition analysis
- **ML Analytics**: Conversion predictions, anomaly detection, trend forecasting

### 📈 **Error Handling & Resilience**

- **Circuit Breakers**: Auto-recovery from WooCommerce/OpenAI failures (60s cooldown)
- **Dead Letter Queue**: Failed jobs automatically retry (max 3x, 5min intervals)
- **Rate Limiting**: 100 req/min global, 60 req/min per IP, 10 req/min AI endpoints
- **Caching**: 60s cache for shop metrics, fallback on connection issuesent für alle Tools
- Motivation & Support für Daily Tasks
- Versteht Kontext über alle Bereiche

### 📈 **Real-Time Analytics**
- Live-Dashboard mit aktuellen Metriken
- Conversion-Tracking & Funnel-Analyse
- Regionale Performance-Vergleiche
- Trend-Identifikation mit ML

### 💳 **Digital Product Management**
- Content Monetization Framework
- Automatische WooCommerce-Integration
- Multi-Channel Publishing
- Payment Processing

---

## 🔒 Datenschutz-Informationen

### KI-Datenverarbeitung
Dieses System verwendet **GPT-4o-mini** für verschiedene Analyse- und Optimierungsfunktionen:

- **Payment User Favor**: Personalisierte Payment-Optimierung
- **Payment Issued Detector**: Proaktive System-Anomalieerkennung
- **Payment Validation**: Transaktions-Anomalieerkennung
- **Payment Success**: Conversion-Optimierung

### Datenspeicherung
- ✅ **Keine dauerhafte Speicherung**: Alle KI-Analysedaten werden nur temporär im RAM verarbeitet
- ✅ **Automatische Löschung**: Max. 5000 Events im Speicher, älteste werden automatisch entfernt
- ✅ **Server-Neustart**: Alle temporären Daten werden beim Neustart gelöscht
- ✅ **Session-basiert**: Frontend-Daten existieren nur während der Browsersitzung

### OpenAI-API Datenverarbeitung
- ⚠️ **API-Calls**: Analysedaten werden an OpenAI GPT-4o-mini übermittelt
- ⚠️ **Retention**: OpenAI speichert API-Daten gemäß deren Datenschutzrichtlinien (30-Tage-Retention für Abuse-Monitoring)
- ⚠️ **Keine Trainingsdaten**: API-Daten werden **nicht** für Model-Training verwendet (per OpenAI Enterprise Agreement)

### DSGVO-Empfehlungen
**Wichtig**: Als Betreiber dieser Software sollten Sie:
1. ✅ KI-Analyse in Ihrer **Datenschutzerklärung** erwähnen
2. ✅ Nutzer über **OpenAI-Datenverarbeitung** informieren
3. ✅ Optional: Consent-Banner für KI-Features implementieren
4. ✅ Verweis auf [OpenAI Privacy Policy](https://openai.com/policies/privacy-policy)

**Hinweis**: Die in der UI angezeigten Datenschutz-Banner erfüllen **keine** rechtliche Informationspflicht. Sie müssen die KI-Verarbeitung in Ihrer eigenen Datenschutzerklärung dokumentieren.

---

## 🚀 Quick Start

### Mit Docker (Empfohlen)
```bash
# connection.json herunterladen & platzieren
docker compose up -d

# Frontend öffnen
# http://localhost:5173
```

### Lokal mit Node.js
```bash
# Voraussetzungen
- Node.js 18+
- MySQL/MariaDB
- connection.json

# Setup
npm install
npm run build
npm run start

# Frontend Dev
cd frontend
npm run dev
```

### 🌍 Language Switching (i18n)

Nach dem Start kann die Sprache über die **Flaggen-Buttons** oben rechts im Dashboard gewechselt werden:
- 🇩🇪 Deutsch
- 🇬🇧 English

Die Sprachpräferenz wird **automatisch in localStorage gespeichert** und beim nächsten Besuch wiederhergestellt.

---

## 📋 Dokumentation

| Dokument                                                      | Beschreibung                                    |
| ------------------------------------------------------------- | ----------------------------------------------- |
| [i18n Coverage Report](./docs/I18N_COVERAGE_REPORT.md)        | 🌍 Multi-Language Implementation (100% Coverage) |
| [Content Monetization](./docs/CONTENT_MONETIZATION.md)        | Konsolidierte Anleitung & API                   |
| [Bedienungsanleitung](./docs/Bedienungsanleitung-KI-Agent.md) | Komplette Tool-Übersicht & How-To's             |
| [Backend AI Setup](./docs/BACKEND_AI_SETUP.md)                | AI-Transformation & Social Media Integration    |
| [Deployment Guide](./docs/deployment.md)                      | Production-Setup & Troubleshooting              |
| [API-Reference](./docs/api/)                                  | Vollständige API-Dokumentation                  |
| [Social Media Guide](./docs/SOCIAL_MEDIA_GUIDE.md)            | Meta & TikTok Setup, .env, Test-APIs            |

---

## 🏗️ System-Architektur

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React/Vite)                              │
│  - Dashboard                                        │
│  - Marketing Tools (50+)                            │
│  - Analytics Dashboards                             │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────▼─────────────┐
        │  Fastify Backend     │
        │  Port 3000           │
        ├─────────────────────┤
        │ - Marketing Routes  │
        │ - Analytics Engine  │
        │ - AI Integration    │
        │ - WooCommerce API   │
        └────────────┬────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼─────┐          ┌──────▼────┐
    │ OpenAI  │          │ WooCommerce│
    │ API     │          │ API        │
    └─────────┘          └────────────┘
```

---

## 📡 API-Endpoints (Auszug)

### Content Monetization (`/api/marketing/content`)
```
GET    /revenue-forecast          # Wochengewinne & Monatsprognose
GET    /price-recommendation      # KI-Preisvorschlag
POST   /generate-copy             # KI-Produkttext
POST   /create-digital-product    # Produkt erstellen
```

### Marketing (`/api/marketing`)
```
POST   /social/webhook/post       # Social Media Publishing
GET    /analytics/metrics         # Marketing Metriken
POST   /conversion/campaigns      # Kampagnen
```

### Analytics (`/api/analytics`)
```
GET    /real-time/dashboard       # Live-Metriken
GET    /conversion/analysis       # Conversion Funnels
GET    /trends/analyze            # Trend-Analyse
```

**➡️ [Vollständige API-Dokumentation](./docs/api/)**

---

## 🔧 Konfiguration

### Erforderliche Umgebungsvariablen

**connection.json:**
```json
{
  "woocommerce": {
    "url": "https://dein-shop.de",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_..."
  },
  "openai": {
    "apiKey": "sk-proj-...",
    "model": "gpt-4o-mini"
  },
  "wordpress": {
    "url": "https://dein-shop.de",
    "username": "user",
    "appPassword": "xxxx xxxx xxxx xxxx"
  }
}
```

**.env (Backend):**
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=wordpress
```

---

## 🧪 Testing

```bash
# Alle Tests
npm run test

# Unit Tests
npm run test:unit

# E2E Tests
npm run test:e2e

# Linting
npm run lint
```

---

## 📊 Monitoring & Debugging

### Health Check
```bash
curl http://localhost:3000/health
```

### API Documentation (Swagger)
```
http://localhost:3000/documentation
```

### S6.0.0 (Januar 2026) - Production Release
- ✅ **350/350 tests passing** - Complete test coverage
- ✅ **2 months production runtime** - Zero downtime on Hetzner
- ✅ **Zero-data architecture** - GDPR-compliant by design
- ✅ **Premium specializations** - Marketplace with 10 industries
- ✅ **44 automated workflows** - Cron-based job scheduling
- ✅ **Circuit breakers** - Auto-recovery from API failures
- ✅ **Documentation cleanup** - Removed 57 outdated files (21,000 lines)
- 🎯 **Release Tag**: [v6.0.0](https://github.com/AndreZ1971/ki/releases/tag/v6.0.0)

### v5.1.1 (Januar 2026) - Bugfix Release
- 🐛 Fixed 8 critical bugs (analytics, routing, auth, error handling)
- ✅ Server stability: 0 errors on startup
- 📚 Production bugfix summary documentation

### v5.1.0 (Dezember 2025) - i18n Release
- 🌍 100% frontend coverage (64 pages)
- 🇩🇪🇬🇧 German + English translations
- 💾 LocalStorage language persistence
- 🔄 Zero breaking changes

### v5.0.0-alpha (November 2025)
- 🔄 Dynamic config reload (no restart required)
- 🐋 Container-ready architecture
- ⚡ Live Settings UI updates

### v4.1.0
- 🤖 Agentic Loop Framework (removed in v6.0.0)
- 📊 Anomaly detection & product optimization

### v4.0.0
- 🔍 Product Analyzer & Optimizer
- ⚡ Performance improvements (30s timeout, 60s cache)
- 🛠️ WooCommerce service centralization

### v3.2.0
- ✨ AI price suggestions & product text generator
- 📈 Revenue forecast badges
- 🎨 Content Monetization UI

### v3.0.0 - Initial Release
- 📊 Core marketing tools & analytics dashboardungen (`git commit -m 'Add feature'`)
4. Pushe zum Branch (`git push origin feature/xy`)
5. Öffne einen Pull Request

**Entwicklungs-Standards:**
- TypeScript strict mode
- ESLint + Prettier
- Unit + E2E Tests erforderlich
- Mindestens 80% Code Coverage

---

## 📝 Changelog

### v3.2.0 (Dezember 2025)
- ✨ KI-Preisvorschlag mit intelligenten Empfehlungen
- ✨ KI-Produkttext Generator (Headline, Body, CTA)
- ✨ Revenue Forecast Badges (Woche/Monat)
- 🎨 Content Monetized Page zu 1x1 Grid optimiert
- 🔧 WooCommerce Config Fallback zu connection.json
- 🐛 9 ESLint Warnungen behoben
- 📚 Umfassende Dokumentation aktualisiert

### v3.1.0
- Conversion Analytics Engine
- Social Media Post Automation
- Image Analysis mit KI

### v3.0.0
- Initial Release
- Core Marketing Tools
- Dashboard & Analytics

---

## 📞 Support & Kontakt

- **Dokumentation**: [/docs](./docs)
- **Email**: info@kaufe-es.eu

---

## 📄 Lizenz
