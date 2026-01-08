# ARI Update Roadmap

## Status: Januar 2026

Dieses Dokument dokumentiert die aktuellen und geplanten Verbesserungen des Trend-Aggregators und der Produktanalyse.

---

## 🎯 Kürzlich Abgeschlossene Updates

### ✅ Reddit OAuth Integration (Januar 2026)
- **Status**: Production Ready
- **Implementierung**: Echte Reddit OAuth mit Client Credentials Flow
- **Datenquelle**: `connection.json` (zentrale Konfiguration)
- **Nutzen**: Authentische Kundenmeinungen aus Reddit-Diskussionen
- **Performance**: Async mit Caching, max. Requests pro Minute kontrolliert

### ✅ Prozentuale Preissuggestionen (Januar 2026)
- **Status**: Production Ready
- **Logik**: `maxPriceIncreasePercent` (default +20%), `maxPriceDecreasePercent` (default -15%)
- **Intelligente Fallbacks**: Dynamic scaling (30-70% Bereich) wenn Trend-Score nicht optimal
- **Frontend**: Prozentuale Input-Felder mit live Preisvorschau
- **Sicherheit**: Doppelte Validierung (Frontend + Backend)

### ✅ Dark Glass UI Theme (Januar 2026)
- **Status**: Production Ready
- **Implementierung**: Rgba-Backgrounds + Blur-Filter mit !important Overrides
- **Komponenten**: Header, Cards, Product List, Toasts
- **Accessibility**: Hohe Kontraste, WCAG 2.1 AA kompatibel

### ✅ Verbesserte Fehlerbehandlung (Januar 2026)
- **Status**: Production Ready
- **Features**: Detailliertes Logging, WooCommerce-Verfügbarkeits-Check, OpenAI API-Key-Validierung
- **Stack-Traces**: Gekürzt auf erste 5 Zeilen für Lesbarkeit
- **DX Improvements**: Klare Error-Messages für Admin & User

### ✅ Configuration Management (Januar 2026)
- **Status**: Production Ready
- **System**: `connection.json` mit Multi-Path-Fallback-System
- **Vorteile**: Single Source of Truth für alle Credentials
- **Security**: Keine API-Keys in .env, alle in Git-ignorierter JSON

---

## 📋 Geplante Verbesserungen (Trend-Aggregator)

### Phase 1: YouTube Trends Integration
- **Status**: Geplant
- **Beschreibung**: YouTube Trending-Daten als zusätzliche Quelle aktivieren
- **Voraussetzung**: YouTube API Key (in `connection.json`)
- **Nutzen**: Bessere Trend-Einschätzung durch Video-Popularität
- **Aufwand**: Mittel (2-3 Tage)
- **Priorität**: Hoch

### Phase 2: Erweiterte Wikipedia-Analyse
- **Status**: Aktiv (Basis)
- **Geplante Verbesserung**: Multi-Language-Support, Pageviews-Trends über längere Zeiträume
- **Nutzen**: Internationale Trend-Erkennung
- **Aufwand**: Gering (1 Tag)
- **Priorität**: Mittel

### Phase 3: Google News RSS Optimierung
- **Status**: Aktiv (Basis)
- **Geplante Verbesserung**: Sentiment-Analyse der News-Headlines, kategoriespezifische Feeds
- **Nutzen**: Bessere Einschätzung der Nachrichtenlage
- **Aufwand**: Mittel (2 Tage)
- **Priorität**: Mittel

### Phase 4: GitHub Trending Enhancement
- **Status**: Aktiv (Basis)
- **Geplante Verbesserung**: Tech-Produkt-spezifische Trend-Scores, Star-Growth-Rate
- **Nutzen**: Bessere Einschätzung für Tech-/Software-Produkte
- **Aufwand**: Mittel (2 Tage)
- **Priorität**: Niedrig

### Phase 5: StackOverflow Trends
- **Status**: Aktiv (Basis)
- **Geplante Verbesserung**: Tag-basierte Trend-Analyse, Frage-Frequenz-Tracking
- **Nutzen**: Developer-Community-Trends erkennen
- **Aufwand**: Mittel (2 Tage)
- **Priorität**: Niedrig

### Phase 6: UI Transparenz-Layer
- **Status**: Geplant
- **Beschreibung**: Badge-System im UI zur Anzeige aktiver/inaktiver Quellen
- **Features**:
  - Live-Status pro Quelle (✅ aktiv, ⏸ deaktiviert, ❌ fehlgeschlagen)
  - Fallback-Handling mit User-Feedback
  - Logging/Telemetrie für Admins
  - Source-Attribution im Analyseergebnis
- **Nutzen**: Transparenz für Endkunden, besseres Debugging
- **Aufwand**: Gering-Mittel (1-2 Tage)
- **Priorität**: Mittel

---

## 🔧 Technische Details

### Current Architecture

```
Frontend
  ├─ WooProductUpdate.tsx (Prozentuale Limits-UI)
  ├─ ProductAnalyzer.tsx (Analyse-Page)
  └─ page.css (Dark Glass Theme)

Backend API
  ├─ /api/products/adviser/analyze/:id (Produkt-Analyse)
  ├─ /api/products/woo/update-single (Preis-Update)
  └─ /ai/trend-pricing (GPT + Trend-Aggregation)

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

| Datei | Beschreibung | Status |
|-------|--------------|--------|
| `backend/routes/app/api/products/optimizer/product-optimizer.ts` | Hauptanalyse-Route mit verbessertem Logging | ✅ Updated |
| `backend/services/trendAggregatorService.ts` | Multi-Source Trend-Aggregation mit Reddit OAuth | ✅ Updated |
| `backend/config.ts` | Multi-Path Config-Loader für connection.json | ✅ Updated |
| `frontend/src/pages/ProductManagement/WooProductUpdate.tsx` | Prozentuale Limits-UI mit Dark Glass Theme | ✅ Updated |
| `frontend/src/pages/ProductManagement/page.css` | Dark Glass Styling mit !important Overrides | ✅ Updated |

---

## 📊 Nächste Schritte (Priorität)

1. **YouTube Integration** (Phase 1) - Kunden wünschen sich YouTube-Daten
2. **UI Badges** (Phase 6) - Verbesserte Transparenz für API-Status
3. **Advanced Wikipedia** (Phase 2) - Multi-Language Support
4. **Sentiment News** (Phase 3) - bessere News-Einschätzung

---

## 💡 Erkannte Learnings

- **Prozentuale Limits sind besser als absolute €-Grenzen** - Flexible an verschiedene Preisklassen
- **Fallback-Logik verhindert "floor camping"** - AI-Vorschläge verteilen sich über den erlaubten Bereich
- **connection.json als Single Source of Truth** - Einfachere Verwaltung als .env Dateien
- **Dark Glass Theme mit !important Overrides nötig** - UI-Framework-Konflikte zwingen Overrides
- **Echte OAuth besser als API Keys** - Reddit-Daten authentischer und updater

---

**Hinweis**: Updates werden schrittweise ausgerollt, um kontinuierliche Verbesserungen zu bieten und Kunden bei der Stange zu halten. Jeder Phase folgt Testing + Documentation + Release Notes.
