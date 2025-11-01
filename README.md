# 🤖 KI Agent System für WooCommerce/WordPress

> **Version 1.8.0** - Intelligentes Automatisierungs-System mit React Frontend & AI-gestütztem Backend

## 📋 Projektüberblick

Ein vollständiges **AI Agent System** für WooCommerce/WordPress mit moderner React-Oberfläche:

### **Backend (AI Agent)**
- 🤖 Automatisierte WooCommerce-Produkterstellung (Freebies, Premium, AI-generiert)
- 📊 Analytics & Conversion-Optimierung
- 💳 Payment-Monitoring & Auto-Fix
- 📧 E-Mail Marketing Automation
- 📱 Social Media Auto-Posting
- 🔍 Google Trends Integration
- 🎨 AI-gestützte Content- & Bild-Generierung
- 🩺 Shop Health Monitoring

### **Frontend (React Dashboard)**
- ⚛️ React 19 mit TypeScript & Vite
- 🎨 Framer Motion Animationen
- 📱 Responsive Design (Desktop + Mobile)
- 🎯 46+ spezialisierte Tool-Seiten
- 🌙 Modernes Dark Theme

**Tech-Stack:** Node.js, TypeScript, React, Express, OpenAI API, WooCommerce/WordPress REST API

---

## 🚀 Features

### **Marketing & Content**
- 📝 Deutscher Content Generator (DSGVO, Datenschutz, etc.)
- 🤖 AI Content Generator (beliebige Themen)
- 🎨 AI Bild-Generator (DALL-E 3 Integration)
- 📱 Social Media Automation (Post-Generierung & Auto-Posting)
- 📧 E-Mail Marketing Automation
- 📊 Google Trends Analyse & Produkt-Vorschläge

### **E-Commerce**
- 🎁 Freebie-Erstellung (automatisch mit ZIP & Cover)
- 🛒 Auto Product Creator (Trend-basiert)
- 💰 Freemium-Conversion-Optimierung
- 💸 Content Monetizer
- 📦 Bundle Creator & Kits/Templates
- 🔄 WooCommerce Sync & Health Reports

### **Analytics & Optimierung**
- 📈 Real-Time Analytics (Umsatz, Conversions, Traffic)
- 🎯 Conversion-Analyse & Auto-Fix
- 🩺 Shop Health Report (Performance, SEO, UX)
- 🔍 Mini/Standard/Premium Audits
- 💳 Payment Issue Detection & Live-Fixes

### **Payment & Finanzen**
- ⚡ Payment Fast Track (Schnellverarbeitung)
- ✅ Payment Verification & Testing
- 🚨 Payment Emergency System
- 📊 Payment Success Tracking
- 🔒 Payment Validation & Security
- 🚚 Delivery Tracking

### **Advanced Tools**
- 🧠 Memory System (Cache-Management)
- 🏥 System Health Monitoring
- 🔧 Auto Fix Implementer
- 🎯 Context Generator
- 🔐 String Generator (IDs, Tokens, Passwörter)
- 🚀 Auto Framplementator (Projekt-Setup)

---

## 📦 Voraussetzungen

### **Backend**
- **Node.js** ≥ 18 (LTS empfohlen)
- **npm** ≥ 9
- **Git**
- **WooCommerce** ≥ 7, **WordPress** ≥ 6
- WordPress: **Application Password** für API-Zugriff
- WooCommerce: **Consumer Key/Secret** mit `read/write`
- **OpenAI API Key** (für AI-Features)

### **Frontend**
- Automatisch via Vite (keine zusätzlichen Anforderungen)

### **Optional**
- **PM2** (für Production Deployment)
- **Docker** (für Container-Deployment)

---

## 🔧 Installation & Setup

### **Schnellstart**

```bash
# Repository klonen
git clone <REPO_URL> ki
cd ki

# Backend installieren
cd backend
npm ci
npm run build

# Frontend installieren
cd ../frontend
npm ci
npm run build

# Zurück zum Root
cd ..
```

### **Development Mode**

```bash
# Terminal 1: Backend starten
cd backend
npm run dev

# Terminal 2: Frontend starten
cd frontend
npm run dev
```

Frontend läuft auf: `http://localhost:5173`  
Backend API läuft auf: `http://localhost:3000`

### **.env Konfiguration**

Erstelle eine `.env` im Projektroot:

```dotenv
# WordPress Basis-URL (ohne /wp-json am Ende)
WP_URL=https://example.com

# WordPress Basic Auth per Application Password
WP_USERNAME=admin@example.com
WP_APP_PASSWORD=ab12 ab34 cd56 ef78 gh90

# WooCommerce REST-Basis (ohne /wp-json am Ende)
WC_API_URL=https://example.com

# WooCommerce REST Keys
WC_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# (Optional) OpenAI
OPENAI_API_KEY=sk-...

# (Optional) GitHub Token
GITHUB_TOKEN=ghp_...

# Job-Runner
JOB=createFreebie
JOB_MODE=once         # 'once' | 'interval'
JOB_INTERVAL_MS=900000
```

**Wichtig:**

- `WP_URL`/`WC_API_URL` **ohne** Doppel-`/wp-json/...`
- Bei fehlenden Permalinks ggf. `WC_API_URL=https://example.com/index.php`
- Application Passwords sind **Basic Auth** (User/Pass)
- **Secrets niemals commiten**

---

## 📜 Verfügbare Skripte

### **Backend**

```bash
# Development
npm run dev              # Backend mit Hot-Reload
npm run dev:agent        # Agent-System starten

# Production
npm run build            # TypeScript kompilieren
npm start                # Production-Server starten
npm run start:agent      # Agent im Production-Mode

# Spezifische Jobs
npm run german-products  # Deutsche Produkte generieren
npm run ai-products      # AI-Produkte erstellen
npm run generate-images  # AI-Bilder generieren
npm run social-media     # Social Media Posts
npm run email-marketing  # E-Mail Kampagnen
npm run analytics        # Analytics Report
npm run conversion-analysis  # Conversion-Optimierung
npm run fix-payments     # Payment-Probleme beheben
npm run health-report    # Shop Health Check

# Testing & Quality
npm run lint             # Code-Linting
npm run format           # Code formatieren
npm test                 # Tests ausführen
```

### **Frontend**

```bash
# Development
npm run dev              # Dev-Server (Port 5173)

# Production
npm run build            # Production Build
npm run preview          # Build-Vorschau

# Quality
npm run lint             # ESLint Check
npm run type-check       # TypeScript Check
```

### **Docker**

```bash
# Container bauen & starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Container stoppen
docker-compose down

# Neustart
docker-compose restart
```

---

## 🎯 Frontend-Struktur

### **Dashboard-Kategorien**

#### **📝 Marketing (9 Seiten)**
- German Content Generator
- AI Content Generator  
- AI Image Generator
- Social Media Automation
- Social Media Auto-Poster
- E-Mail Marketing
- Google Trends Analyzer
- Free to Premium Converter
- Content Monetizer

#### **🛒 E-Commerce (10 Seiten)**
- Create Freebie
- Auto Product Creator
- Bundle Creator
- Kits & Templates
- Mini Audit
- Standard Audit
- Premium Audit
- Shop Health Report
- Analytics Reporting
- Conversion Analysis

#### **🔧 Advanced (6 Seiten)**
- Context Generator
- String Generator
- Auto Framplementator
- WooCommerce Sync
- Memory System
- System Health

#### **💳 Payment & Finances (12 Seiten)**
- Payment Fast
- Payment Simplified
- Payment Tester
- Payment Verifier
- Payment Success
- Payment Validation
- Payment Issue Detector
- Payment User Favor
- Payment Delivery
- Payment Emergency
- Payment Expansion
- Payment Quick Check

#### **🎨 Conversion (9 Seiten)**
- Conversion Report
- Conversion Auto-Implementer
- Payment Debugger
- Payment Quick Check
- Payment Simple Fix
- Payment Success Validator
- Payment Live Fixer
- Payment Fix Companion
- Payment Emergency

**Total: 46 spezialisierte Tool-Seiten**

---

## Freebie anlegen (CLI)

```bash
npm run freebie --   --zip "./assets/freebie.zip"   --cover "./assets/cover.jpg"   --category 15   --name "Super Freebie"   --slug "super-freebie"   --short "Kurzbeschreibung <strong>HTML</strong> erlaubt."   --long "<p>Lange Beschreibung …</p>"   --tags "freebie,download"
```

Die Kernlogik liegt in `src/agent/jobs/createFreebie.ts`.

---

## WordPress / WooCommerce Hinweise

- **Rollen:** REST + Medien-Upload + Produkt-Erstellung
- **REST-Endpoints:**
  - Medien: `POST /wp-json/wp/v2/media`
  - Produkt: `POST /wp-json/wc/v3/products`
- **Base-URL:**
  - Mit Permalinks: `https://example.com`
  - Ohne Permalinks: `https://example.com/index.php`

---

## E2E-Test (Shop)

1. Freebie erzeugen
2. Produkt sichtbar? publish, Preis 0, downloadable
3. Checkout (0,00 €)
4. Download-Link in Bestellbestätigung
5. ZIP & Cover öffnen
6. Kategorie & Slug prüfen

---

## Troubleshooting

**401 Unauthorized:** Application Password oder Rolle prüfen  
**404 Not Found:** Base-URL korrekt? Kein doppeltes `/wp-json`  
**413 Payload Too Large:** PHP/NGINX Upload-Limits erhöhen  
**5xx / Timeout:** Server-Limits oder CDN? Keep-Alive aktiv  
**Linting:** `.eslintignore` löschen, `eslint.config.mjs` nutzen

---

## Sicherheit

- **DB-Pass rotieren** und `wp-config.php` aktualisieren
- **Application Password** neu erzeugen, alte deaktivieren
- **Woo CK/CS** neu generieren, alte revoken
- **WP Salts** erneuern
- **.env** nie ins Repo!

---

## 🚀 Deployment

### **Production mit PM2**

```bash
# Backend bauen
cd backend
npm run build

# PM2 starten (ecosystem.config.cjs wird automatisch erkannt)
pm2 start ecosystem.config.cjs

# Logs überwachen
pm2 logs ki-agent

# Status prüfen
pm2 status

# Neustart
pm2 restart ki-agent

# Auto-Start beim Server-Reboot
pm2 startup
pm2 save
```

### **Docker Deployment**

```bash
# Container bauen
docker-compose build

# Starten
docker-compose up -d

# Logs
docker-compose logs -f ki-agent

# Ressourcen-Monitoring
docker stats ki-agent
```

### **Empfohlene Server-Specs (Agent-Only)**

| Komponente | Minimum | Empfohlen | Production |
|------------|---------|-----------|------------|
| vCPU | 2 | 3 | 4+ |
| RAM | 2 GB | 4 GB | 8 GB |
| Disk | 40 GB | 80 GB | 120 GB |
| Uptime | 99% | 99.9% | 99.99% |

**Hinweis:** WordPress/WooCommerce läuft auf separatem Server!

### **Ressourcen-Limits (docker-compose.yml)**

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

---

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                     │
│  (Dashboard, 46 Tool-Seiten, Framer Motion)        │
└──────────────────┬──────────────────────────────────┘
                   │ REST API
┌──────────────────┴──────────────────────────────────┐
│              Node.js Backend (Express)              │
│  ├─ Agent System (Scheduler, Jobs, Memory)         │
│  ├─ WooCommerce Client (REST API)                  │
│  ├─ WordPress Client (REST API + Media Upload)     │
│  ├─ OpenAI Integration (GPT-4, DALL-E 3)          │
│  └─ Error Handling (Retry, Circuit Breaker)       │
└──────────────────┬──────────────────────────────────┘
                   │ REST API
┌──────────────────┴──────────────────────────────────┐
│      WordPress/WooCommerce (Externer Server)       │
│  ├─ WooCommerce REST API (/wp-json/wc/v3)         │
│  ├─ WordPress REST API (/wp-json/wp/v2)           │
│  └─ Media Library Upload                           │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Sicherheit

### **Best Practices**

✅ **Secrets Management**
- Alle API-Keys in `.env` (nie committen!)
- `.env.example` für Team-Dokumentation
- Secrets regelmäßig rotieren

✅ **API Security**
- Rate Limiting aktiv (100 Requests/Min)
- CORS konfiguriert
- Input-Validierung auf allen Endpoints

✅ **WordPress/WooCommerce**
- Application Passwords statt Admin-Login
- Separate User für API-Zugriff
- Minimale Berechtigungen (Principle of Least Privilege)

### **Secrets Rotation**

```bash
# WordPress Application Password neu generieren
# WooCommerce → Einstellungen → Erweitert → REST API
# Alte Keys widerrufen, neue generieren

# OpenAI API Key rotieren
# https://platform.openai.com/api-keys

# .env aktualisieren & Server neu starten
pm2 restart ki-agent
```

---

## 📊 Monitoring & Logging

### **Logs Location**

```
backend/logs/
├── err.log          # Error-Log
├── out.log          # Output-Log
└── combined.log     # Kombiniert
```

### **Health Check**

```bash
# Backend Health
curl http://localhost:3000/health

# Docker Health
docker inspect --format='{{.State.Health.Status}}' ki-agent
```

### **Performance Monitoring**

```bash
# PM2 Monitoring
pm2 monit

# Docker Stats
docker stats ki-agent

# Memory-Nutzung
pm2 show ki-agent
```

---

## 🐛 Troubleshooting

### **Backend startet nicht**

```bash
# Port bereits belegt?
netstat -ano | findstr :3000

# Dependencies installieren
cd backend
rm -rf node_modules package-lock.json
npm install

# TypeScript neu kompilieren
npm run build
```

### **Frontend Build-Fehler**

```bash
# Cache löschen
cd frontend
rm -rf node_modules .vite dist
npm install
npm run build
```

### **WordPress/WooCommerce API-Fehler**

**401 Unauthorized**
- Application Password prüfen
- User-Rolle überprüfen (Editor/Administrator)
- Base64-Encoding korrekt?

**404 Not Found**
- Base-URL korrekt? (ohne `/wp-json` am Ende)
- Permalinks aktiv?
- REST API aktiviert?

**413 Payload Too Large**
```nginx
# nginx.conf
client_max_body_size 50M;
```

```php
// php.ini
upload_max_filesize = 50M
post_max_size = 50M
```

### **OpenAI API Fehler**

**429 Rate Limit**
- API-Key Quota überprüfen
- Request-Rate reduzieren
- Retry-Logic greift automatisch

**500 Server Error**
- OpenAI Status: https://status.openai.com
- Alternative Model verwenden (GPT-3.5 statt GPT-4)

---

## 📝 Changelog

### **Version 1.8.0** (November 2025)
- ✨ Komplettes React Frontend (46 Tool-Seiten)
- 🎨 Framer Motion Animationen
- 📱 Responsive Design für alle Seiten
- 🔧 12 Payment & Finance Tools
- 🧠 6 Advanced System-Tools
- 📊 Erweiterte Analytics & Reporting
- 🚀 Docker-Support optimiert
- 📚 Umfassende README-Dokumentation

### **Version 1.7.0**
- 🤖 AI-gestützte Content-Generierung
- 🎨 DALL-E 3 Bild-Generator
- 📱 Social Media Automation
- 📧 E-Mail Marketing System

### **Version 1.6.0**
- 🛒 Auto Product Creator
- 📊 Google Trends Integration
- 💰 Conversion-Optimierung
- 🩺 Shop Health Monitoring

### **Version 1.5.0**
- 💳 Payment-System mit Auto-Fix
- 🔍 Issue Detection
- ✅ Payment Verification
- 🚨 Emergency System

---

## 🤝 Contributing

### **Development Workflow**

```bash
# Feature-Branch erstellen
git checkout -b feature/neue-funktion

# Änderungen committen
git add .
git commit -m "feat: Neue Funktion hinzugefügt"

# Tests & Linting
npm run lint
npm run type-check

# Push & Pull Request
git push origin feature/neue-funktion
```

### **Commit-Conventions**

```
feat: Neue Features
fix: Bug-Fixes
docs: Dokumentation
style: Formatierung
refactor: Code-Refactoring
test: Tests hinzufügen
chore: Build/Tools-Anpassungen
```

### **Code-Standards**

- ✅ TypeScript strict mode
- ✅ ESLint-Regeln befolgen
- ✅ Prettier für Formatierung
- ✅ Keine Secrets committen
- ✅ Aussagekräftige Commit-Messages

---

## 📄 Lizenz

Proprietary - Alle Rechte vorbehalten

---

## 🆘 Support

**Issues:** GitHub Issues  
**Dokumentation:** `/docs` Ordner  
**API-Docs:** `/docs/api`

---

## 🙏 Danksagungen

- **React Team** - Für das beste Frontend-Framework
- **OpenAI** - Für die leistungsstarken AI-APIs
- **WooCommerce** - Für die robuste E-Commerce-Plattform
- **Framer Motion** - Für butterweiche Animationen

---

**Made with ❤️ and ☕ for automated E-Commerce**
