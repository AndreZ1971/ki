# 🗺️ A.R.I. Update Roadmap

**Version**: 6.3.0+  
**Status**: Living Document  
**Letztes Update**: 7. Januar 2026

---

## 📋 Übersicht

Diese Roadmap definiert die strategischen Updates für A.R.I. nach dem erfolgreichen v6.3.0 Release. Der Fokus liegt auf **Verfeinerung bestehender Features**, **Erweiterung der KI-Fähigkeiten** und **Internationalisierung**.

---

## 🎯 Update-Strategie

### Parallele Entwicklung (kontinuierlich)
- **Track 1**: Tool-Prompt-Optimierung
- **Track 4**: i18n-Erweiterung & Verbesserung
- **Track 5**: Neue Spezialisierungen

### Sequentielle Entwicklung (nach Priorität)
- **Track 2**: Voice/TTS-Integration (nach Track 1)
- **Track 3**: ML-Feature-Erweiterung (nach Track 2)

---

## 🔧 Track 1: Tool-Prompt-Optimierung

### 🎯 Ziel
Alle 52 Tools sollen **spezialisierungsbasierte Prompts** verwenden, um präzisere, kontextuelle Antworten zu liefern.

### 📊 Status Quo
- Aktuell: Generische Prompts für alle Shops
- Problem: Empfehlungen sind zu allgemein, ignorieren Shop-Spezialisierung
- Beispiel: Fashion-Shop bekommt Tech-Produktvorschläge

### ✅ Maßnahmen

#### Phase 1: Analyse & Template-Erstellung (2 Wochen)
- [ ] Audit aller 52 Tool-Prompts (`backend/tools/`)
- [ ] Spezialisierungs-Template erstellen (`{SPEC_CONTEXT}`, `{SPEC_TONE}`, `{SPEC_FOCUS}`)
- [ ] Best Practices dokumentieren

#### Phase 2: Kategorien-basierte Optimierung (6 Wochen)
- [ ] **Analytics (13 Tools)**: Shop-Health-Reports mit Spec-Metriken
  - Beispiel: Fashion → Saisonalität, Tech → Produktzyklen
- [ ] **Product Management (8 Tools)**: Content-Generierung mit Spec-Vokabular
  - Beispiel: Fashion → Stil/Material/Größe, Tech → Specs/Kompatibilität
- [ ] **Payment (13 Tools)**: Fraud-Detection mit Spec-Schwellenwerten
  - Beispiel: Digital-Produkte → niedrigere Schwelle
- [ ] **Marketing (10 Tools)**: Tone-of-Voice aus Spezialisierung
  - Beispiel: Luxus → formal, Youth → casual
- [ ] **Advanced (9 Tools)**: Memory-Kontext mit Spec-Präferenzen

#### Phase 3: Testing & Rollout (2 Wochen)
- [ ] A/B-Tests: Generic vs. Spec-Prompts
- [ ] Metrics: Conversion-Lift, User-Satisfaction, Tool-Usage
- [ ] Rollout: Feature-Flag `USE_SPEC_PROMPTS=true`

### 📈 Erfolgskriterien
- Min. **20% Verbesserung** der Tool-Recommendation-Quality (User-Feedback)
- Max. **10% Token-Overhead** pro Request
- 100% der Tools unterstützen Spec-Context

---

## 🎤 Track 2: Voice/TTS-Integration

### 🎯 Ziel
Chat-Bot kann **sprechen** – Insights, Empfehlungen und Benachrichtigungen werden vorgelesen.

### 📊 Status Quo
- Aktuell: Nur Text-basierter Chat
- Use Case: Händler im Lager, beim Packen, unterwegs – hört sich Updates an

### ✅ Maßnahmen

#### Phase 1: Browser-basierte TTS (4 Wochen)
- [ ] **Frontend**: Web Speech API Integration
  - `SpeechSynthesis` für Browser-TTS
  - Voice-Auswahl (männlich/weiblich, Sprache)
  - Geschwindigkeit/Tonhöhe-Kontrolle
- [ ] **UI**: Lautsprecher-Icon im Chat-Interface
  - Play/Pause/Stop-Controls
  - Auto-Read für neue Messages (optional)
- [ ] **Accessibility**: Screen-Reader-Kompatibilität

#### Phase 2: OpenAI TTS-Integration (Optional, 2 Wochen)
- [ ] **Backend**: `/api/tts/generate` Endpoint
  - OpenAI TTS-1/TTS-1-HD Modelle
  - Audio-Caching für häufige Phrasen
- [ ] **Frontend**: Audio-Player für TTS-Dateien
  - Download-Option für Insights
- [ ] **Cost Control**: TTS nur für wichtige Notifications

#### Phase 3: Voice-Commands (Future)
- [ ] Speech-to-Text für Chat-Eingabe
- [ ] Voice-Aktivierung ("Hey A.R.I.")

### 📈 Erfolgskriterien
- Min. **15% der User** aktivieren Voice-Feature
- Latenz < 2 Sekunden (Browser-TTS) / < 5 Sekunden (OpenAI TTS)
- Positive Accessibility-Feedback

---

## 🤖 Track 3: ML-Feature-Erweiterung

### 🎯 Ziel
Aktivierung der **3 vorbereiteten ML-Features**: Dynamische Preise, Churn-Vorhersage, Betrugs-Erkennung.

### 📊 Status Quo
- Bereits vorbereitet in `backend/ml/` und `ml.config.ts`
- Features sind deaktiviert: `dynamicPricing: false`, `churnPrediction: false`, `fraudDetection: false`
- Grund: Modelle benötigen Training-Daten & Testing

### ✅ Maßnahmen

#### Feature 1: Dynamische Preise (8 Wochen)
- [ ] **Modell-Training**:
  - Historische Preisdaten sammeln (min. 3 Monate)
  - Features: Wochentag, Saison, Konkurrenz, Lagerbestand, Demand
  - Algorithmus: Gradient Boosting (XGBoost/LightGBM)
- [ ] **Backend**: `/api/ml/pricing/suggest` Endpoint
  - Input: Product ID
  - Output: `{ suggestedPrice, confidence, reasoning }`
- [ ] **Frontend**: Pricing-Dashboard
  - Preis-Vorschlag-Karten mit Confidence-Meter
  - Accept/Reject-Buttons (Shop-Owner entscheidet)
- [ ] **Safety**: Min/Max-Price-Grenzen, Human-in-the-Loop

#### Feature 2: Churn-Vorhersage (6 Wochen)
- [ ] **Modell-Training**:
  - Features: Kauffrequenz, Recency, AOV, Support-Tickets, Email-Öffnungsrate
  - Binary Classification: Churn-Risk (High/Medium/Low)
- [ ] **Backend**: `/api/ml/churn/predict` Endpoint
  - Batch-Processing für alle Kunden (nächtlich)
  - Churn-Score speichern in `customer_meta`
- [ ] **Frontend**: Churn-Dashboard
  - Liste der High-Risk-Kunden
  - Automatische Winback-Email-Trigger
- [ ] **Agentic Loop**: Customer Winback Loop (neu)
  - Erkennt Churn-Risk → schlägt Winback-Kampagne vor

#### Feature 3: Betrugs-Erkennung (6 Wochen)
- [ ] **Modell-Training**:
  - Features: Payment-Velocity, Geo-Mismatch, Device-Fingerprint, Order-Value-Anomaly
  - Multi-Class: `safe`, `suspicious`, `fraudulent`
- [ ] **Backend**: `/api/ml/fraud/detect` Endpoint
  - Real-time Scoring bei Checkout
  - Threshold-basierte Auto-Blockierung (konfigurierbar)
- [ ] **Frontend**: Fraud-Dashboard
  - Flagged Orders mit Review-Queue
  - False-Positive-Feedback-Loop
- [ ] **Integration**: Payment Verifier Tool erweitern

### 📈 Erfolgskriterien
- **Dynamische Preise**: Min. **5% Revenue-Lift** in A/B-Test
- **Churn-Vorhersage**: Min. **70% Accuracy**, **30% Winback-Success-Rate**
- **Betrugs-Erkennung**: Max. **2% False-Positive-Rate**, **90% Fraud-Detection-Rate**

---

## 🌍 Track 4: i18n-Erweiterung & Verbesserung

### 🎯 Ziel
Neue Sprachen hinzufügen, bestehende Übersetzungen verbessern.

### 📊 Status Quo
- Aktuell: Deutsch (DE), Englisch (EN)
- Problem: Einige Übersetzungen sind maschinell/unnatürlich
- Fehlende Märkte: FR, ES, IT, PL, NL

### ✅ Maßnahmen

#### Phase 1: Bestehende Sprachen verbessern (3 Wochen)
- [ ] **Audit**: Alle `frontend/src/locales/` Dateien prüfen
  - Inkonsistenzen markieren (z. B. "Dashboard" vs. "Übersicht")
  - Fehlende Keys dokumentieren
- [ ] **Native Speaker Review**:
  - DE: Professionelle Korrektur (besonders Tech-Begriffe)
  - EN: British vs. American English (Standard: American)
- [ ] **Context-basierte Übersetzungen**:
  - Beispiel: "order" (Verb: bestellen, Noun: Bestellung)
  - Pluralisierung korrekt (ICU MessageFormat)

#### Phase 2: Neue Sprachen hinzufügen (8 Wochen)
- [ ] **Französisch (FR)** – 2 Wochen
  - Zielmarkt: Frankreich, Belgien, Schweiz, Kanada
  - Besonderheit: Formell/Informell ("tu" vs. "vous")
- [ ] **Spanisch (ES)** – 2 Wochen
  - Zielmarkt: Spanien, Lateinamerika
  - Besonderheit: EU-Spanisch vs. LATAM-Spanisch
- [ ] **Italienisch (IT)** – 2 Wochen
  - Zielmarkt: Italien, Schweiz
- [ ] **Polnisch (PL)** – 1 Woche
  - Zielmarkt: Polen (wachsender E-Commerce-Markt)
- [ ] **Niederländisch (NL)** – 1 Woche
  - Zielmarkt: Niederlande, Belgien

#### Phase 3: i18n-Tooling verbessern (2 Wochen)
- [ ] **Automatische Key-Erkennung**: Ungenutzte Keys löschen
- [ ] **Translation-Memory**: Wiederverwendbare Phrasen
- [ ] **Crowdin/Lokalise-Integration**: Für Community-Übersetzungen
- [ ] **Language-Switcher UX**: Flaggen-Icons + Auto-Detect (Browser-Locale)

### 📈 Erfolgskriterien

- Min. **5 Sprachen** (DE, EN, FR, ES, IT + bonus PL, NL)
- 100% Translation-Coverage (keine fehlenden Keys)
- Native-Speaker-Approval für alle Sprachen

---

## 🏪 Track 5: Neue Shop-Spezialisierungen

### 🎯 Ziel
Spezialisierungen für die **Top-E-Commerce-Branchen** bereitstellen.

### 📊 Status Quo
- Aktuell: Generic-Fallback, Fashion-Mode, Technik-Elektronik
- Fehlend: Food, Beauty, Sport, Home & Garden, Digital Products, etc.

### ✅ Maßnahmen

#### Phase 1: Marktanalyse & Priorisierung (1 Woche)
- [ ] Top-10-E-Commerce-Branchen identifizieren (Umsatz-Volumen)
- [ ] Spezialisierungs-Templates erstellen (System-Prompt, Features, Context)

#### Phase 2: Spezialisierungen entwickeln (12 Wochen, parallel)

##### Priorität 1 (6 Wochen)
- [ ] **Food & Beverage** (Lebensmittel, Getränke, Feinkost)
  - Features: Ablaufdatum-Tracking, Rezept-Generierung, Allergen-Filter
  - Tone: Appetitlich, einladend, gesundheitsbewusst
- [ ] **Beauty & Cosmetics** (Kosmetik, Pflege, Parfüm)
  - Features: Hauttyp-Analyse, Ingredient-Scanner, Before/After-Trends
  - Tone: Luxuriös, selbstbewusst, inklusiv
- [ ] **Sports & Fitness** (Sportartikel, Fitnessgeräte, Outdoor)
  - Features: Activity-Matching, Size-Guide, Performance-Metriken
  - Tone: Motivierend, dynamisch, leistungsorientiert

##### Priorität 2 (6 Wochen)
- [ ] **Home & Garden** (Möbel, Deko, Garten, DIY)
  - Features: Room-Planner, Style-Matching, Seasonal-Trends
  - Tone: Gemütlich, inspirierend, nachhaltig
- [ ] **Digital Products** (Software, E-Books, Kurse, Downloads)
  - Features: License-Management, Auto-Delivery, Anti-Piracy
  - Tone: Professionell, bildungsorientiert, innovativ
- [ ] **Jewelry & Accessories** (Schmuck, Uhren, Taschen)
  - Features: Occasion-Matching, Material-Guide, Gift-Finder
  - Tone: Elegant, emotional, exklusiv

#### Phase 3: Testing & Rollout (2 Wochen)
- [ ] Beta-Testing mit realen Shop-Ownern (1 pro Branche)
- [ ] Feedback-Loop: Prompts & Features anpassen
- [ ] Dokumentation: Setup-Guides für jede Spezialisierung

### 📈 Erfolgskriterien
- Min. **6 neue Spezialisierungen** (+ 3 bestehende = 9 total)
- Jede Spezialisierung getestet mit min. **1 Live-Shop**
- User-Satisfaction-Score > 4.5/5

---

## 📅 Timeline

```
Q1 2026 (Jan-Mar)
├─ Track 1: Tool-Prompt-Optimierung ████████████ (laufend)
├─ Track 4: i18n DE/EN Verbesserung ████░░░░░░░░
├─ Track 5: Food & Beauty Specs    ████████░░░░
└─ Track 2: Browser-TTS (Start)    ░░░░░░░░████

Q2 2026 (Apr-Jun)
├─ Track 1: Tool-Prompt-Optimierung ████████████ (laufend)
├─ Track 4: FR/ES/IT Integration    ████████████
├─ Track 5: Sport/Home/Digital      ████████████
├─ Track 2: OpenAI TTS              ████████░░░░
└─ Track 3: Dynamische Preise       ░░░░░░░░████

Q3 2026 (Jul-Sep)
├─ Track 1: Final Refinements       ████░░░░░░░░
├─ Track 4: PL/NL (Bonus)           ████░░░░░░░░
├─ Track 3: Churn & Fraud           ████████████
└─ Track 2: Voice-Commands (R&D)    ░░░░░░░░░░░░
```

---

## 🎯 Erfolgsmessung

### Key Performance Indicators (KPIs)

| Metric | Baseline (v6.3.0) | Target (v7.0.0) |
|--------|-------------------|-----------------|
| **Tool-Recommendation-Quality** | 3.5/5 | 4.2/5 |
| **Supported Languages** | 2 (DE, EN) | 5+ (DE, EN, FR, ES, IT) |
| **Available Specializations** | 3 | 9+ |
| **ML-Features Active** | 0/3 | 3/3 (Pricing, Churn, Fraud) |
| **Voice-Feature Adoption** | 0% | 15%+ |
| **Translation Coverage** | 92% | 100% |

---

## 🚀 Release-Strategie

### Version-Schema
- **v6.4.0**: Track 1 Phase 1-2 + Track 4 Phase 1
- **v6.5.0**: Track 5 Prio 1 (Food, Beauty, Sports)
- **v6.6.0**: Track 2 Phase 1 (Browser-TTS)
- **v7.0.0**: Track 3 komplett + Track 5 Prio 2 + Track 4 Phase 2

### Rollout-Prinzipien
- **Feature-Flags**: Alle neuen Features hinter Toggles
- **Beta-Phase**: Min. 2 Wochen für kritische Features
- **Backward-Compatibility**: Keine Breaking Changes für bestehende Specs
- **A/B-Testing**: Track 1 & 3 mit Metrics-Vergleich

---

## 📝 Notizen

- **Abhängigkeiten**: Track 2 & 3 benötigen stabile Tool-Prompts (Track 1)
- **Ressourcen**: Track 4 & 5 sind parallelisierbar (unabhängig)
- **Risiken**: ML-Features (Track 3) benötigen ausreichend Trainingsdaten
- **Community**: i18n-Crowdsourcing kann Track 4 beschleunigen

---

**Autor**: André Zabel  
**Repository**: A.R.I. - Artificial Retail Intelligence System  
**Status**: ✅ Approved for Execution
