# 🗺️ A.R.I. Update Roadmap

**Version**: 6.3.0+  
**Status**: Living Document  
**Letztes Update**: 11. Januar 2026

---

## 📋 Übersicht

Diese Roadmap definiert die strategischen Updates für A.R.I. nach dem erfolgreichen v6.3.0 Release. Der Fokus liegt auf **Verfeinerung bestehender Features**, **Erweiterung der KI-Fähigkeiten** und **Internationalisierung**.

---

## 🎯 Prioritäts-Übersicht

### 🔴 HÖCHSTE PRIORITÄT (Parallele Entwicklung - kontinuierlich)
- **Track 1**: Tool-Prompt-Optimierung ⭐⭐⭐⭐⭐
- **Track 4**: i18n-Erweiterung & Verbesserung ⭐⭐⭐⭐
- **Track 5**: Neue Spezialisierungen ⭐⭐⭐⭐

### 🟠 HOHE PRIORITÄT (Sequentielle Entwicklung)
- **Track 2**: Voice/TTS-Integration ⭐⭐⭐⭐
- **Track 3**: ML-Feature-Erweiterung ⭐⭐⭐⭐

### 🟡 OPTIONALE ERWEITERUNGEN (NIEDRIGERE PRIORITÄT)
- **Track 6**: Trend-Aggregator Erweiterung ⭐⭐⭐

---

## 🔧 Track 1: Tool-Prompt-Optimierung ⭐⭐⭐⭐⭐ HÖCHSTE PRIORITÄT

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

#### Phase 2: JSON-Prompting Migration (4 Wochen)
- [ ] Evaluate JSON Mode vs. Structured Outputs
- [ ] Migrationsstrategie für Email/Marketing Services
- [ ] Zod-Schema Definition für kritische Funktionen
- [ ] Testing & Validierung

#### Phase 3: Kategorien-basierte Optimierung (6 Wochen)
- [ ] **Analytics (13 Tools)**: Shop-Health-Reports mit Spec-Metriken
- [ ] **Product Management (8 Tools)**: Content-Generierung mit Spec-Vokabular
- [ ] **Payment (13 Tools)**: Fraud-Detection mit Spec-Schwellenwerten
- [ ] **Marketing (10 Tools)**: Tone-of-Voice aus Spezialisierung
- [ ] **Advanced (9 Tools)**: Memory-Kontext mit Spec-Präferenzen

#### Phase 4: Testing & Rollout (2 Wochen)
- [ ] A/B-Tests: Generic vs. Spec-Prompts
- [ ] Metrics: Conversion-Lift, User-Satisfaction, Tool-Usage
- [ ] Rollout: Feature-Flag `USE_SPEC_PROMPTS=true`

### 📈 Erfolgskriterien
- Min. **20% Verbesserung** der Tool-Recommendation-Quality
- Max. **10% Token-Overhead** pro Request
- 100% der Tools unterstützen Spec-Context

---

## 🎤 Track 2: Voice/TTS-Integration ⭐⭐⭐⭐ HOHE PRIORITÄT

### 🎯 Ziel
Chat-Bot kann **sprechen** – Insights und Empfehlungen werden vorgelesen.

### ✅ Maßnahmen

#### Phase 1: Browser-basierte TTS (4 Wochen)
- [ ] Web Speech API Integration
- [ ] Voice-Auswahl und Kontrolle
- [ ] Accessibility-Features

#### Phase 2: OpenAI TTS-Integration (2 Wochen)
- [ ] OpenAI TTS-1/TTS-1-HD Models
- [ ] Audio-Caching und Cost-Control

#### Phase 3: Voice-Commands (Future)
- [ ] Speech-to-Text für Chat-Eingabe

### 📈 Erfolgskriterien
- Min. **15% der User** aktivieren Voice
- Latenz < 2-5 Sekunden

---

## 🤖 Track 3: ML-Feature-Erweiterung ⭐⭐⭐⭐ HOHE PRIORITÄT

### 🎯 Ziel
Aktivierung der **3 vorbereiteten ML-Features**: Dynamische Preise, Churn-Vorhersage, Betrugs-Erkennung.

### 📊 Status Quo
- Features sind deaktiviert in `ml.config.ts`
- Benötigen Training-Daten & Testing

### ✅ Maßnahmen

#### Feature 1: Dynamische Preise (8 Wochen)
- [ ] Modell-Training mit historischen Preisdaten
- [ ] Backend: `/api/ml/pricing/suggest` Endpoint
- [ ] Frontend: Pricing-Dashboard mit Vorschlägen
- [ ] Human-in-the-Loop Validierung

#### Feature 2: Churn-Vorhersage (6 Wochen)
- [ ] Modell-Training (High/Medium/Low Risk)
- [ ] Batch-Processing (nächtlich)
- [ ] Winback-Campaign Automation

#### Feature 3: Betrugs-Erkennung (6 Wochen)
- [ ] Real-time Fraud Scoring
- [ ] Payment Integration
- [ ] Review-Queue für Admins

### 📈 Erfolgskriterien
- **Dynamische Preise**: Min. **5% Revenue-Lift**
- **Churn**: Min. **70% Accuracy**
- **Fraud**: Max. **2% False-Positive-Rate**

---

## 🌍 Track 4: i18n-Erweiterung ⭐⭐⭐⭐ HOHE PRIORITÄT

### 🎯 Ziel
Neue Sprachen hinzufügen: FR, ES, IT, PL, NL

### ✅ Maßnahmen

#### Phase 1: Bestehende Sprachen verbessern (3 Wochen)
- [ ] Audit aller Übersetzungen
- [ ] Native Speaker Review (DE, EN)
- [ ] Context-basierte Verbesserungen

#### Phase 2: Neue Sprachen hinzufügen (8 Wochen)
- [ ] Französisch (FR)
- [ ] Spanisch (ES)
- [ ] Italienisch (IT)
- [ ] Polnisch (PL)
- [ ] Niederländisch (NL)

#### Phase 3: i18n-Tooling (2 Wochen)
- [ ] Automatische Key-Erkennung
- [ ] Translation-Memory Setup
- [ ] Crowdin/Lokalise-Integration

### 📈 Erfolgskriterien
- Min. **5 Sprachen**
- 100% Translation-Coverage
- Native-Speaker-Approval

---

## 🏪 Track 5: Neue Shop-Spezialisierungen ⭐⭐⭐⭐ HOHE PRIORITÄT

### 🎯 Ziel
Spezialisierungen für Top-E-Commerce-Branchen

### ✅ Maßnahmen

#### Phase 1: Marktanalyse (1 Woche)
- [ ] Top-10-Branchen identifizieren
- [ ] Spezialisierungs-Templates erstellen

#### Phase 2: Entwicklung (12 Wochen)

**Priorität 1 (6 Wochen):**
- Food & Beverage
- Beauty & Cosmetics
- Sports & Fitness

**Priorität 2 (6 Wochen):**
- Home & Garden
- Digital Products
- Jewelry & Accessories

#### Phase 3: Testing & Rollout (2 Wochen)
- [ ] Beta-Testing mit Shop-Ownern
- [ ] Feedback-Loop
- [ ] Dokumentation

### 📈 Erfolgskriterien
- Min. **6 neue Spezialisierungen**
- User-Satisfaction > 4.5/5

---

## 📊 Track 6: Trend-Aggregator Erweiterung ⭐⭐⭐ OPTIONAL - NIEDRIGERE PRIORITÄT

### 🎯 Ziel
Optionale Erweiterung der Trend-Datenquellen (kann parallel laufen, hat aber niedrige Priorität).

### ✅ Abgeschlossene Features (Januar 2026)

- ✅ Reddit OAuth Integration (Production Ready)
- ✅ Prozentuale Preissuggestionen (Production Ready)
- ✅ Dark Glass UI Theme (Production Ready)

### 📋 Geplante Erweiterungen (Niedrige Priorität)

- [ ] YouTube Trends Integration
- [ ] Erweiterte Wikipedia-Analyse
- [ ] Google News Sentiment-Analyse
- [ ] GitHub Trending Enhancement
- [ ] StackOverflow Trends
- [ ] UI Transparenz-Layer mit Badges

---

## 📅 Timeline

```
Q1 2026 (Jan-Mar)
├─ Track 1: Tool-Prompt-Optimierung      ████████████ (laufend)
├─ Track 4: i18n DE/EN Verbesserung      ████░░░░░░░░
├─ Track 5: Food & Beauty Specs          ████████░░░░
└─ Track 2: Browser-TTS (Start)          ░░░░░░░░████

Q2 2026 (Apr-Jun)
├─ Track 1: Tool-Prompt-Optimierung      ████████████ (laufend)
├─ Track 4: FR/ES/IT Integration         ████████████
├─ Track 5: Sport/Home/Digital           ████████████
├─ Track 2: OpenAI TTS                   ████████░░░░
└─ Track 3: Dynamische Preise            ░░░░░░░░████

Q3 2026 (Jul-Sep)
├─ Track 1: Final Refinements            ████░░░░░░░░
├─ Track 4: PL/NL (Bonus)                ████░░░░░░░░
├─ Track 3: Churn & Fraud                ████████████
└─ Track 2: Voice-Commands (R&D)         ░░░░░░░░░░░░

Q4 2026+ (Okt+)
└─ Track 6: Trend-Aggregator (optional)  ░░░░░░░░░░░░
```

---

## 🎯 Erfolgsmessung (KPIs)

| Metric | Baseline | Target |
|--------|----------|--------|
| Tool-Quality | 3.5/5 | 4.2/5 |
| Languages | 2 | 5+ |
| Specializations | 3 | 9+ |
| ML-Features | 0/3 | 3/3 |
| Voice-Adoption | 0% | 15%+ |
| Translation-Coverage | 92% | 100% |
| Token-Efficiency | Baseline | -5% to -10% |

---

## 💡 Wichtige Erkenntnisse

- **JSON-Prompting eliminiert 90% der Parse-Fehler** – massive Stabilität
- **Spezialisierungen sind Kern-Feature** – sollte früh implementiert werden
- **Tool-Prompts beeinflussen alle Features** – deshalb höchste Priorität
- **Prozentuale Limits > absolute Grenzen** – flexibler für verschiedene Märkte
- **connection.json als Single Source of Truth** – einfacheres Credential-Management

---

## 📝 Abhängigkeiten & Risiken

### Abhängigkeiten
- Track 2 & 3 benötigen stabile Tool-Prompts (Track 1)
- Track 5 benötigt Track 1 für spezialisierte Prompts
- Track 4 & 6 sind parallelisierbar

### Risiken
- ML-Features brauchen ausreichend Training-Daten
- JSON-Migration könnte Breaking Changes verursachen (Feature-Flag!)
- Voice-Features hängen von Browser-Kompatibilität ab

---

**Autor**: André Zabel  
**Repository**: A.R.I. - Artificial Retail Intelligence System  
**Status**: ✅ Aktualisiert 11. Januar 2026  
**Ursprung**: Commit 0df2ced (7. Januar 2026) – Restauriert mit korrektem Prioritäts-Framework + Track 6 als optional
