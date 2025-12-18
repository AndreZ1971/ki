# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [5.0.0-alpha] - 2025-12-18

### 🎯 Alpha-Container MVP - Live Testing Phase

Dies ist die erste Alpha-Release des neuen Container-Designs. Hauptfokus liegt auf Live-Testing aller Features auf Production-Server.

### ✨ Hinzugefügt

#### Dynamic Config Reload
- **getConfig()** Funktion in `backend/config.ts` für dynamisches Nachladen von `connection.json`
- Settings UI Änderungen werden **sofort aktiv** ohne Backend-Restart
- Shop-Metrics Dashboard zeigt Live-Daten unmittelbar nach Settings-Speicherung
- Auth-Modus Switching: Unterstützung für 'basic' (Header) und 'query' (URL-Parameter)
- Endpoint-basierte Cache-Keys für bessere Wiederverwendbarkeit

#### Alpha-Container Philosophie
- Ephemeral Design: Container startet mit frischen Platzhaltern
- UI-Driven Onboarding: Konfiguration via Settings-Interface
- docker-entrypoint.sh erstellt vollständiges connection.json Schema
- Stateless Architecture für K8s-Readiness

### 🔧 Geändert

- `backend/routes/app/api/analytics/metrics/shop-metrics.ts`: Nutzt `getConfig()` statt statischen Import
- `backend/config.ts`: Interface `woocommerce` um `authMode` erweitert
- Dokumentation aktualisiert: README.md, Onboarding.md, BACKEND_AI_SETUP.md

### 🐛 Behoben

- **Dashboard Platzhalter Bug**: Shop-Metrics zeigten `PLEASE_SET_WOOCOMMERCE_URL` auch nach erfolgreichem Speichern
- Settings UI speichert korrekt zu `/app/connection.json`, Dashboard liest diese Daten nun dynamisch
- Nginx IP-Cache Problem nach Backend-Restart dokumentiert (Lösung: Nginx ebenfalls neu starten)

### 📝 Dokumentation

- README.md: v5.0.0-alpha Features, Alpha-Container Konzept
- Onboarding.md: Live-Update Workflow, keine Restarts nötig
- CHANGELOG.md: v5.0.0-alpha Release Notes

### 🧪 Testing

- Live-Testing Phase gestartet auf Production-Server (debian-4gb-fsn1-1)
- Shop-Metriken Dashboard: ✅ Funktioniert
- Settings UI mit Connection Test: ✅ Funktioniert
- Dynamic Config Reload: ✅ Funktioniert

---

## [3.7.0] - 2025-01-XX

### ✨ Added (Neue Features)

#### **Product Analyzer mit KI-Integration**
- 🔍 **Produktauswahl & Details**: Scrollbare Liste aller WooCommerce-Produkte
  - Automatisches Laden beim Öffnen
  - Detailansicht mit Bild, Name, Preis, Lagerbestand
  - Vollständige Produktbeschreibung (scrollbar)
  
- 🤖 **KI-Analyse**: Intelligente Produktbewertung mit GPT-4
  - Analyse-Score (0-100) mit Farbcodierung
  - Kategorie-basierte Empfehlungen
  - Strategische Vorschläge (Preis, Beschreibung, Marketing)
  - Scrollbare Analyseergebnisse

- 📋 **Action Board**: Kategorisierte Aktionsempfehlungen
  - Restock-Empfehlungen (niedrige Lagerbestände)
  - Pricing-Aktionen (Preisanpassungen)
  - Steering-Empfehlungen (Marketing & Optimierung)
  - Direkte Verlinkung zu Produkten

- 🎨 **Modern Light Theme UI**: Optimierte Benutzeroberfläche
  - Scrollbares Modal-Layout (max 90vh)
  - Separate Scroll-Container für Details und Analyse
  - Responsive Design mit maxHeight-Constraints
  - Verbesserte Error-States mit Debug-Informationen

#### **WooCommerce Resilience Layer**
- ⚡ **Performance & Zuverlässigkeit**:
  - 30s Timeout für alle WooCommerce-Requests (erhöht von 10s)
  - 60s In-Memory Cache für API-Responses
  - Automatische Fallbacks bei Connectivity-Issues
  - Cache-Busting für frische Daten bei Bedarf

- 🛡️ **Error Handling**:
  - Graceful Degradation: Cached Data bei Shop-Ausfällen
  - Detaillierte Error-Messages mit Status-Codes
  - Debug-JSON-View für Entwickler
  - Shop-Metrics mit Fallback-Logik

### 🔧 Fixed (Bugfixes)

- **Fastify Schema Serialization**: `additionalProperties: true` für WooCommerce-Felder
- **TypeScript Compilation**: Import-Pfade und Type-Annotations korrigiert
- **ESLint Warnings**: Unused Variables korrekt gekennzeichnet
- **WooCommerce Service**: Credentials aus env + connection.json

### 🏗️ Technical Improvements

- Neue Datei: `backend/utils/woo-cache.ts` (Cache-Utility mit TTL)
- Updated: `backend/routes/app/api/products/woocommerce.ts` (Cache-Integration)
- Updated: `backend/routes/app/api/analytics/metrics/shop-metrics.ts` (Fallback-Logik)
- Updated: `frontend/src/pages/ProductManagement/ProductAnalyzer.tsx` (Modal UI)
- Updated: `frontend/src/pages/app/ProductAnalysis.tsx` (Action Board)

---

## [2.1.0-ai-features] - 2025-12-11

### ✨ Added (Neue Features)

#### **WooProductUpdate AI/ML Integration**
- 🔥 **Trend-Based Pricing**: Google Trends API Integration für intelligente Preisanpassung
  - Echtzeit Trend-Score (0-100)
  - GPT-4 basierte Preis-Empfehlungen
  - Strategien: INCREASE / MAINTAIN / DECREASE
  - Confidence-Levels und Risk-Assessment

- 💬 **Reddit Sentiment Analysis**: Community-Feedback für Produkte
  - Post-Suche über relevante Subreddits
  - Sentiment-Analyse (POSITIVE / NEGATIVE / NEUTRAL)
  - Top Keywords und Subreddit-Mapping
  - Aktuelle Posts mit Links und Engagement-Metriken

- 📝 **AI Description Optimizer**: SEO-Optimierung mit trending Keywords
  - Google Trends Keywords Integration
  - Natürliche Keyword-Integration
  - SEO-Scoring (0-100%)
  - Improvement-Suggestions

- 🤖 **Auto-Apply Modus**: Automatische Übernahme von AI-Vorschlägen
  - Toggle für automatische/manuelle Übernahme
  - Sofortige Preis/Beschreibungs-Änderungen
  - Visuelle Indikatoren (Badges, Hintergrundfarben)

- 🎯 **Bulk AI Analyze**: Batch-Processing für mehrere Produkte
  - Max. 5 Produkte parallel
  - Rate-Limiting (1,5s Abstand)
  - Success/Error-Counter
  - Progress-Tracking

#### **Backend Services**
- `redditService.ts`: Neue Sentiment-Analysis-Service
  - Post-Suche mit Kategorie-Mapping
  - Sentiment-Berechnung
  - Keyword-Extraktion
  - Top-Subreddit-Detection

- `ai-product-assistant.ts`: Neue AI-Endpoints
  - `POST /api/products/ai/trend-pricing`
  - `POST /api/products/ai/optimize-description-trends`
  - `POST /api/products/ai/reddit-sentiment`
  - `POST /api/products/ai/bulk-trend-optimize`

- `PUT /api/products/woo/update-single/:productId`: Einzeln-Update-Endpoint
  - AI-Werte direkt zu WooCommerce
  - Input-Validierung
  - Error-Handling pro Produkt

#### **Frontend UI Improvements**
- KI-Dashboard mit Gradient-Design (Lila/Violett)
- AI-Action-Buttons pro Produkt (🔥 🎯 🎨 💬)
- Trend-Badges mit Live-Score und Preis-Vorschlag
- Reddit Sentiment Panel mit erweiterten Infos
- Auto-Apply Toggle mit Status-Anzeige
- Bulk-Analyze Button mit Rate-Limiting
- Enhanced Toast-Notifications mit unterschiedlichen Meldungen

#### **Documentation**
- `docs/WOO_PRODUCT_UPDATE_AI.md`: Komplette Funktions-Dokumentation
  - Feature-Details mit Request/Response-Beispiele
  - Update-Workflows (3 Szenarien)
  - Performance & Skalierung
  - Testing-Strategien
  - Deployment-Guide

- `docs/SECURITY_AI_FEATURES.md`: Security & Compliance Guide
  - API-Security für alle externen Services
  - WooCommerce API Security
  - Data Protection & PII Handling
  - Error Handling & Logging
  - Compliance Checklist (DSGVO)
  - Deployment Security
  - Incident Response Plans

### 🔒 Security

- ✅ API-Keys nur im Backend (`utils/openai.ts`)
- ✅ Input-Validierung für alle Endpoints
- ✅ Rate-Limiting für Bulk-Operations
- ✅ Error-Messages sind generic (keine Secrets exposed)
- ✅ HTTPS für alle externen APIs
- ✅ Circuit Breaker + Retry für OpenAI
- ✅ DSGVO-konform (keine PII-Sammlung)
- ✅ Reddit ToS-konform (Read-only, User-Agent)

### 🔧 Changed

- **WooProductUpdate.tsx**: Architektur erweitert mit AI-Komponenten
- **product-management.ts**: Neuer Single-Update-Endpoint hinzugefügt
- **productApi.ts**: Alle Endpoints mit `/api` prefix angepasst
- **server.ts**: AI-Routes registriert

### 🐛 Fixed

- ✅ API-Endpoint-Routing (alle mit `/api` prefix)
- ✅ TypeScript-Fehler bei imports (relative paths mit `.js`)
- ✅ Parameter-Typing bei map-Funktionen

### 📊 Performance

- Trend-Pricing: ~3-5 Sekunden
- Reddit-Sentiment: ~2-3 Sekunden
- Description-Optimize: ~2-4 Sekunden
- Single-Update: ~1-2 Sekunden
- Bulk-Update (10x): ~5-10 Sekunden

### 📚 Dependencies

- Keine neuen Abhängigkeiten
- Nutzt existierende: axios, google-trends-api, rss-parser

### ⚠️ Known Issues

- [ ] Caching für Trend-Daten empfohlen (Redis)
- [ ] Queue-System für Bulk-Operationen (Bull/BullMQ)
- [ ] A/B Testing für AI vs. Standard-Updates
- [ ] Unit Tests für redditService
- [ ] E2E Tests für AI-Workflows

### 🚀 Migration Guide

**Keine Migration erforderlich!**

Die neuen AI-Features sind optional:
- Alte Update-Logik läuft unverändert
- AI-Features können einzeln aktiviert werden
- Rückwärtskompatibilität garantiert

---

## [2.0.0] - 2025-12-10

### ✨ Added

- WooProductCreate.tsx erweitert mit AI-Features
  - Smart Description Generator
  - Auto-Tagging System
  - Quality Score Predictor
  - SEO Optimization Assistant
  - Image Generation (DALL-E 3)
  - Dynamic Pricing Intelligence

- AI-Product-Assistant Backend-Endpoints
  - `/api/products/ai/generate-description`
  - `/api/products/ai/auto-tag`
  - `/api/products/ai/quality-score`
  - `/api/products/ai/seo-optimize`
  - `/api/products/ai/generate-image`
  - `/api/products/ai/suggest-pricing`

### 🔄 Phase 1: Core AI Features

- RunAutoProductCreator.tsx: Image-Generation Toggle (inkl. A.R.I.)
- Entfernung von "Premium"-Gating (alle Features in A.R.I. enthalten)

---

## [1.0.0] - 2025-11-01

### ✨ Initial Release

- WooProductUpdate mit Standard-Funktionen
  - 4 Update-Typen (prices, inventory, descriptions, all)
  - Batch-Processing (100+ Produkte)
  - Multi-Select mit Checkboxen
  - WooCommerce-Integration

---

## Format

Alle zukünftigen Änderungen folgen diesem Format:

```
## [Version] - YYYY-MM-DD

### Added
- Neue Features

### Changed
- Änderungen an existierenden Features

### Deprecated
- Veraltete Features (noch funktionsfähig)

### Removed
- Entfernte Features

### Fixed
- Bugfixes

### Security
- Sicherheits-relevante Änderungen
```

---

**Maintainer**: André Zabel  
**Last Updated**: 2025-12-11
