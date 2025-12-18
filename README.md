# 🚀 ARI - Artificial Retail Intelligence System

**Version:** 5.0.0-alpha  
**Status:** Alpha-Container MVP - Live Testing Phase 🧪

Ein **AI-gestütztes Business Automation System** für WooCommerce/WordPress mit 50+ spezialisierten Tools, KI-Agent, Agentic Loops und modernem Dashboard.

---

## ✨ Was ist neu in Version 5.0.0-alpha?

### 🔄 **Dynamic Config Reload** (NEU)

- **Live-Update ohne Restart**: Änderungen in Settings UI werden sofort aktiv
- **getConfig()**: Dynamisches Nachladen von connection.json bei jeder API-Anfrage
- **Auth-Modus Switching**: Unterstützung für 'basic' (Header) und 'query' (URL-Parameter)
- **Shop-Metrics Dashboard**: Zeigt echte Shop-Daten unmittelbar nach Settings-Speicherung

### 🐋 **Alpha-Container Philosophie** (MVP)

- **Ephemeral Design**: Jeder Container-Start mit frischen Platzhaltern
- **UI-Driven Onboarding**: Kunden konfigurieren via Settings-Interface
- **K8s-Ready**: Repair/Update Container für Production (Roadmap)
- **Stateless Architecture**: Keine Persistierung über Container-Restarts

---

## 🎯 Version 4.1.0 Features

### 🤖 **Agentic Loop Framework**

Autonome KI-Agenten für kontinuierliche Geschäftsprozesse:

**4 spezialisierte Loop-Typen:**

1. **Anomaly Detection Loop** 🚨
   - Erkennt Payment-Anomalien automatisch
   - Typen: failed_payment, unusual_amount, repeated_attempts, high_risk
   - Endpoint: `POST /api/agent/loops/anomaly-detection/run`

2. **Product Optimization Loop** 📈
   - A/B testet Produktattribute automatisch
   - Optimiert: Preis (-10%), Titel (+Bestseller), Beschreibung (+Benefits)
   - Endpoint: `POST /api/agent/loops/product-optimization/run`

3. **Payment Recovery Loop** 💳
   - Versucht Failed Orders mit verschiedenen Strategien
   - Strategien: Retry, Discount, Alternative Payment, Contact
   - Success Rate: bis zu 60% bei Contact-Strategie
   - Endpoint: `POST /api/agent/loops/payment-recovery/run`

4. **Analytics Insights Loop** 📊
   - Generiert automatisch Dashboard-Insights
   - Erkennt Anomalien und Trends
   - Liefert Empfehlungen für Maßnahmen
   - Endpoint: `POST /api/agent/loops/analytics-insights/run`

**Architektur:** Sense → Think → Act → Learn → Repeat Zyklus  
**Dokumentation:** [AGENTIC_LOOP_ARCHITECTURE.md](docs/AGENTIC_LOOP_ARCHITECTURE.md)

### 🔍 Product Analyzer & Optimizer (v4.0.0)

- **Intelligentes Modal**: Vollständige Produktdetails mit scrollbarem Layout
- **KI-Analyse Integration**: Produktanalyse mit Score, Metriken und personalisierten Empfehlungen
- **Dropdown-Selection**: Benutzerfreundliche Produktauswahl mit Live-Daten
- **Action Board**: Direkte Maßnahmen (Restock, Pricing, Steering) aus der Analyse heraus
- **Light Theme**: Optimiert für Lesbarkeit mit weißem Hintergrund und dunkler Schrift

### ⚡ Performance & Resilience (v4.0.0)

- **30s Timeout**: Großzügigere Timeouts für langsame WooCommerce-Instanzen
- **60s Cache**: Intelligente Caching-Schicht für Shop-Metriken und Produktdaten
- **Fallback-System**: Zeigt gecachte Daten bei temporären Verbindungsproblemen
- **Error Handling**: Klare Fehlermeldungen statt silent failures

### 🛠️ Backend-Verbesserungen

- **WooCommerce Service**: Zentralisierte Credentials-Verwaltung (Env + connection.json)
- **Shop Metrics Cache**: Resiliente Metriken auch bei Shop-Ausfällen
- **Type Safety**: Vollständige TypeScript-Typisierung für WooCommerce-Entities
- **Agentic Loops**: 4 spezialisierte autonome Agenten für Payment, Products & Analytics

---

## 🎯 Core Features

### 📊 **50+ spezialisierte Marketing Tools**
- Image Analyzer (Bild-Analyse mit KI)
- Auto Product Creator (Produkt-Automatisierung)
- Social Media Poster (Multi-Platform Publishing)
- Conversion Analyzer (Funnel-Analyse)
- Revenue Analytics (Echtzeitdaten)
- Und viele mehr...

### 🤖 **KI-Chatbot Ari**
- Integrierter AI-Agent für alle Tools
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

---

## 📋 Dokumentation

| Dokument                                                      | Beschreibung                                 |
| ------------------------------------------------------------- | -------------------------------------------- |
| [Content Monetization](./docs/CONTENT_MONETIZATION.md)        | Konsolidierte Anleitung & API                |
| [Bedienungsanleitung](./docs/Bedienungsanleitung-KI-Agent.md) | Komplette Tool-Übersicht & How-To's          |
| [Backend AI Setup](./docs/BACKEND_AI_SETUP.md)                | AI-Transformation & Social Media Integration |
| [Deployment Guide](./docs/deployment.md)                      | Production-Setup & Troubleshooting           |
| [API-Reference](./docs/api/)                                  | Vollständige API-Dokumentation               |
| [Social Media Guide](./docs/SOCIAL_MEDIA_GUIDE.md)            | Meta & TikTok Setup, .env, Test-APIs         |

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

### System Logs
```bash
# Docker
docker compose logs -f ki

# Lokal
npm run start 2>&1 | tee logs.txt
```

---

## 🤝 Contribution

Contributions sind willkommen! Bitte beachte:

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/xy`)
3. Committe deine Änderungen (`git commit -m 'Add feature'`)
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
- **Issues**: GitHub Issues
- **Email**: support@kaufe-es.eu
- **Chat**: KI-Agent Ari im Dashboard

---

## 📄 Lizenz

Proprietär © 2025 Kaufe-es GmbH

---

**Made with ❤️ for e-commerce automation**
