# 🚀 A.R.I. - Artificial Retail Intelligence

**Version:** 6.0.0  
**Status:** Production-Ready

AI-gestütztes Automatisierungssystem für WooCommerce-Shops. Automatisiert Produkterstellung, Content-Generierung, Analytics und Marketing über WooCommerce/WordPress REST API.

---

## 📋 Features

### 🤖 Automatisierung
- **44 Job Workflows** für Produkt-Management, Content, Analytics, Marketing und Shop-Health
- **Cron-basiertes Scheduling** mit node-cron
- **Circuit Breakers** für automatische Fehlerbehandlung
- **Dead Letter Queue** mit automatischem Retry

### 📊 Analytics & Reporting
- Shop-Metriken (Umsatz, Bestellungen, Conversion-Rate)
- Echtzeit-Analytics (Live-Besucher, aktuelle Orders)
- Conversion-Funnel-Analyse mit Drop-Off-Detection
- Google Trends Integration für Keyword-Recherche

### 🎨 Content & Marketing
- **GPT-4o-mini Integration** für Produktbeschreibungen, E-Mails, Blog-Posts
- **DALL-E Integration** für automatische Bildgenerierung
- **Social Media Automation** (Facebook, Instagram, LinkedIn, Twitter)
- **Email Marketing** (Abandoned Cart, Welcome Series, Win-Back)

### 🏗️ Architektur
- **Stateless Design** - Keine persistente Datenspeicherung
- **Zero-Data Architecture** - Alle Daten werden über WooCommerce API abgerufen
- **Kubernetes-Ready** - Horizontale Skalierung möglich
- **Multi-Language** - Deutsch & Englisch (react-i18next)

---

## 🚀 Installation

### Voraussetzungen
- Node.js 18+
- Docker & Docker Compose (optional)
- WooCommerce-Shop mit aktivierter REST API
- OpenAI API Key

### 1. Repository klonen
```bash
git clone https://github.com/AndreZ1971/ki.git
cd ki
```

### 2. Konfiguration erstellen

Erstelle `connection.json` im Root-Verzeichnis:

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
    "username": "admin",
    "appPassword": "xxxx xxxx xxxx xxxx"
  }
}
```

### 3. Installation & Start

**Mit Docker (empfohlen):**
```bash
docker compose up -d
```

**Ohne Docker:**
```bash
# Backend
cd backend
npm install
npm run build
npm start

# Frontend (neues Terminal)
cd frontend
npm install
npm run dev
```

### 4. Zugriff
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/documentation

---

## 📡 API Endpoints

### Produkte
- `GET /api/products` - Alle Produkte abrufen
- `POST /api/products` - Produkt erstellen
- `PUT /api/products/:id` - Produkt aktualisieren
- `DELETE /api/products/:id` - Produkt löschen

### Analytics
- `GET /api/analytics/dashboard` - Dashboard-Metriken
- `GET /api/analytics/conversion` - Conversion-Analyse
- `GET /api/analytics/real-time` - Echtzeit-Daten

### Content & AI
- `POST /api/marketing/content/generate-copy` - AI Produkttext
- `POST /api/marketing/ai-images` - DALL-E Bildgenerierung
- `POST /api/marketing/social/post` - Social Media Post

### Jobs & Automation
- `GET /api/jobs` - Alle Jobs anzeigen
- `POST /api/jobs/:jobId/run` - Job manuell ausführen
- `GET /api/jobs/:jobId/status` - Job-Status abrufen

**Vollständige Dokumentation:** [docs/german/api/README.md](docs/german/api/README.md)

---

## 🔧 Konfiguration

### Umgebungsvariablen

Das System benötigt **keine** Datenbank-Zugangsdaten. Alle Daten werden über die WooCommerce REST API abgerufen.

**Backend (.env optional):**
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### WooCommerce REST API aktivieren

1. WordPress Admin → WooCommerce → Einstellungen → Erweitert → REST API
2. "Schlüssel hinzufügen" klicken
3. Berechtigungen: "Lesen/Schreiben"
4. Consumer Key und Secret kopieren → `connection.json`

### OpenAI API Key

1. https://platform.openai.com/api-keys
2. "Create new secret key"
3. Key kopieren → `connection.json`

---

## 🧪 Testing

```bash
# Alle Tests
npm test

# E2E Tests
npm run test:e2e

# Coverage Report
npm run test:coverage

# Tests im Watch-Modus
npm run test:watch
```

**Test-Abdeckung:** 350/350 Tests ✅

---

## 📋 Dokumentation

| Dokument | Beschreibung |
|----------|--------------|
| [API Referenz](docs/german/api/README.md) | Vollständige API-Dokumentation |
| [Workflows](docs/german/workflows/README.md) | 44 Job-Workflows im Detail |
| [Bedienungsanleitung](docs/german/Bedienungsanleitung-KI-Agent.md) | Komplette Anleitung für alle Features |
| [Deployment Guide](docs/german/deployment.md) | Production-Setup & Troubleshooting |
| [Social Media Setup](docs/german/SOCIAL_MEDIA_GUIDE.md) | Meta, TikTok, LinkedIn Integration |

**English Documentation:** [README_EN.md](README_EN.md)

---

## 🔒 Datenschutz

### Zero-Data Architektur
- Keine Datenbank - alle Daten werden über WooCommerce API abgerufen
- Keine persistente Speicherung von Kundendaten
- Temporäre Daten nur im RAM (max. 5000 Events)
- Server-Neustart löscht alle temporären Daten

### OpenAI API Nutzung
- Produktbeschreibungen, E-Mails und Content werden an GPT-4o-mini gesendet
- OpenAI speichert API-Daten gemäß deren Datenschutzrichtlinien
- API-Daten werden **nicht** für Model-Training verwendet

**DSGVO-Hinweis:** Als Betreiber müssen Sie die AI-Nutzung in Ihrer Datenschutzerklärung erwähnen.

---

## 📝 Changelog

### v6.0.0 (Januar 2026)
- ✅ Production-Ready Release
- ✅ 350/350 Tests passing
- ✅ 44 automatisierte Job-Workflows
- ✅ Premium Spezialisierungen (10 Branchen)
- ✅ Circuit Breakers & Dead Letter Queue
- ✅ Multi-Language Support (DE/EN)

### v5.1.1 (Januar 2026)
- 🐛 8 kritische Bugfixes (Analytics, Routing, Auth)
- ✅ Server-Stabilität: 0 Fehler beim Start

### v5.1.0 (Dezember 2025)
- 🌍 100% i18n Coverage (64 Pages)
- 🇩🇪🇬🇧 Deutsch & Englisch Support
- 💾 LocalStorage Language Persistence

### v5.0.0-alpha (November 2025)
- 🔄 Dynamic Config Reload
- 🐋 Container-ready Architecture

---

## 📞 Support

- **Dokumentation:** [/docs](./docs)
- **Issues:** [GitHub Issues](https://github.com/AndreZ1971/ki/issues)
- **Email:** info@kaufe-es.eu

---

## 📄 Lizenz

ISC License
