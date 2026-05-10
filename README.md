# 🤖 A.R.I. - Artificial Retail Intelligence

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Tests](https://img.shields.io/badge/tests-350%2F350-success.svg)
![ML Integration](https://img.shields.io/badge/ML%20Integration-100%25-green.svg)
![Design System](https://img.shields.io/badge/Design_Tokens-100%25-purple.svg)
![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)

> **Status**: Production Ready → Runtime stable, no frontend mock data, all results from backend. External integrations (e.g. payment gateways) require configuration. [Full definition](docs/english/TOOLS_DOCUMENTATION.md#-glossary).

## Der digitale Mitarbeiter für deinen Online-Shop

Ein System, das deinen WooCommerce-Shop analysiert, optimiert und wächst –  
ohne dass du dich mit Technik, Servern oder Konfiguration auseinandersetzen musst.

[🚀 Installation](#installation) • [📚 Dokumentation](#dokumentation) • [💬 Support](#support) • [🔧 Features](#features)

---

## 📋 Inhaltsverzeichnis

- [Die Vision](#-die-vision)
- [Das Problem](#-das-problem)
- [Die Lösung](#-die-lösung)
- [Features](#-features)
- [Was ändert sich für dich?](#-was-ändert-sich-für-dich)
- [Technologie](#⚙️-technologie)
- [Tool-Übersicht](#-tool-übersicht)
- [Status & Roadmap](#-status--roadmap)
- [Dokumentation](#-dokumentation)
- [Support](#-support)

---


## 🎯 Die Vision

Shop-Betreiber verbringen den Großteil ihrer Zeit mit Aufgaben, die repetitiv sind und wenig Freude bringen:

- ✍️ Produktbeschreibungen schreiben
- 📱 Social-Media-Posts erstellen
- 📊 Daten analysieren (welches Produkt läuft wirklich gut?)
- 📧 E-Mails schreiben (Follow-ups, Upsells, Willkommensserien)
- 📈 Kampagnen planen und umsetzen
- 🔍 Trends erkennen, bevor die Konkurrenz es tut

**A.R.I. gibt dir diese Zeit zurück.**

## ⚠️ Das Problem

### Kennst du diese Situation?

Dein Shop brummt, aber du sitzt fest. Die Konversion könnte besser sein. Die Kundenkommunikation ist chaotisch. Deine Best-Seller-Produkte wissen nicht, dass sie Bestseller sind. Und irgendwie fehlt dir die Kapazität, um die nächste Wachstumsstufe zu erreichen.

**Die ganze Arbeit liegt bei dir. Du bist der Flaschenhals.**

## ✅ Die Lösung

**A.R.I. hilft dir bei der operativen Arbeit deines Shops. Einfach. Intelligent. Rund um die Uhr.**

### 📦 Produktmanagement
Neue Produkte? A.R.I. analysiert Trends, schreibt SEO-Texte, generiert Bilder, organisiert alles – **ready to sell**. Du genehmigst, fertig.

### 📊 Echte Insights
Keine Dashboard-Paralyse mehr. A.R.I. sagt dir konkret: *"Dein Top-Produkt hat ein Imageproblem – hier sind 3 konkrete Maßnahmen."* Du triffst die Entscheidung, A.R.I. setzt um.

### 📧 Intelligente Kundenbeziehung
Abandoned Carts? Kunden, die lange nichts gekauft haben? A.R.I. kennt sie und erstellt personalisierte Nachrichtenentwürfe – du prüfst und gibst frei. So einfach.

## 🚀 Features

### 🤖 Agentic Loop Framework

4 spezialisierte Loop-Typen arbeiten autonom im Hintergrund:

#### 1. Anomaly Detection Loop 🚨
- Erkennt Payment-Anomalien automatisch
- **Typen:** `failed_payment`, `unusual_amount`, `repeated_attempts`, `high_risk`
- Real-time Monitoring & Alerting

#### 2. Product Performance Loop 📈
- A/B testet Produktattribute automatisch
- **Verbessert:** Preis (-10%), Titel (+Bestseller), Beschreibung (+Benefits)
- Kontinuierliche Conversion-Verbesserung

#### 3. Payment Recovery Loop 💳
- Versucht Failed Orders mit verschiedenen Strategien
- **Strategien:** Retry, Discount, Alternative Payment, Contact
- **Success Rate:** bis zu 60% bei Contact-Strategie

#### 4. Analytics Insights Loop 📊

- Generiert automatisch Dashboard-Insights
- Erkennt Anomalien und Trends
- Liefert Empfehlungen für Maßnahmen

---

### 🛡️ Enterprise-Grade Error Handling

| Feature | Beschreibung |
|---------|--------------|
| **Circuit Breaker** | Schutz vor Kaskadenfehlern (`CLOSED` → `OPEN` → `HALF_OPEN`) |
| **Retry Strategies** | Exponential Backoff mit Jitter |
| **Dead Letter Queue** | Automatisches Recovery fehlgeschlagener Jobs |
| **Multi-Channel Alerting** | Email, Slack, Webhooks |

---

### 🔧 51+ Intelligente Tools

> **Wichtig:** Alle Tools arbeiten assistierend – Entwürfe, Analysen und Hinweise werden erzeugt; Freigaben und Live-Änderungen bleiben immer bei dir.

## 🎁 Was ändert sich für dich?

| Bereich | Verbesserung |
|---------|--------------|
| ⏰ **Zeit** | Du bekommst deine Zeit zurück – **5–10 Stunden pro Woche** weniger Admin-Arbeit |
| 💰 **Zahlen** | Conversion steigt, Kunden werden besser betreut, Repeat-Purchases nehmen zu |
| 📊 **Insights** | Du verstehst dein Business besser – klare, verwertbare Insights statt Datenmüll |
| 🚀 **Skalierung** | Du kannst skalieren – ohne mehr Leute einzustellen |

### Konkret umgesetzt durch

- ✅ Optimierte Produkttexte (SEO-optimiert, verkaufsfördernd)
- ✅ KI-generierte Produktbilder (DALL-E Integration)
- ✅ Echtzeit-Analytics mit echten WooCommerce-Daten (keine Mock-Daten)
- ✅ Email-Automation (Carts, Willkommensserie, Reaktivierung)
- ✅ Social-Media-Posts (LinkedIn, Facebook, Twitter, YouTube mit API-Publishing; Instagram & TikTok mit KI-Text-Generierung via Copy-to-Clipboard)
- ✅ **NEU v1.0.0:** Globales Design Token System mit Dark Mode
- ✅ **NEU v1.0.0:** 8-Sprachen Support (DE, EN, FR, ES, IT, PT, NL, PL)
- ✅ **NEU v1.0.0:** Vollständig dunkles Chatbot-Design mit perfekter Lesbarkeit
- ✅ **NEU v1.0.0:** Spezialisierungs-aware KI-Personalisierung
- ✅ Multi-Source Trend-Analyse (Google Trends + Reddit OAuth)
- ✅ Prozentuale Preissuggestionen mit deterministischer Berechnung
- ✅ Manuelle Validierung von AI-Vorschlägen vor Übernahme
- ✅ **NEU v1.0.0:** Vollständige WooCommerce-Integration ohne Platzhalter
- ✅ **NEU v1.0.0:** Support-Tickets mit HTML-Bereinigung
- ✅ **NEU v1.0.0:** Produktideen-Scoring ohne Zufallswerte

## ⚙️ Technologie

### Backend Stack

| Technologie | Version | Verwendung |
|-------------|---------|------------|
| Node.js | 18+ | Server Runtime |
| Fastify | 5.2.1 | REST API Framework |
| TypeScript | 5.8.3 | Type-Safe Development |
| OpenAI SDK | Latest | GPT-4, DALL-E, Embeddings |
| Vitest | 2.1.8 | Testing Framework |

### Frontend Stack

| Technologie | Version | Verwendung |
|-------------|---------|------------|
| React | 18.3.1 | UI Framework |
| Vite | 6.0.5 | Build Tool |
| Shadcn/ui | Latest | Component Library |
| Tailwind CSS | 3.4.17 | Styling |
| Framer Motion | Latest | Animations |

### 🤖 KI & ML Integration

- **GPT-4:** Planning Engine, Content Generation
- **GPT-4o-mini:** Schnelle Analysen, User-Favor-Detection
- **DALL-E:** Automatische Bild-Generierung
- **Embeddings:** Semantic Search & Matching
- **Custom ML:** Trend-Analyse, Sentiment Detection, Pattern Recognition

### 🔐 Authentifizierung

- **Aktuell:** Temporäre In-Memory-Authentifizierung (ENV-konfiguriert)
- **Geplant:** Automattic-Integration für Produktiv-Umgebung
- **WooCommerce-Daten:** Direkt von WooCommerce API (connection.json)
- **Support-Tickets:** Awesome Support Plugin Integration mit HTML-Bereinigung

## 🔧 Tool-Übersicht

### 📊 Analytics (13 Tools)

- **Shop Metrics:** Live-KPIs (Umsatz, Bestellungen, Conversion)
- **Conversion Analysis:** Funnel-Analyse mit Drop-Off-Detection
- **Feedback Analysis:** Review & Ticket Sentiment-Analyse
- **Trend Analysis:** KI-gestützte Trend-Erkennung
- **Real Analytics:** Echtzeit-Dashboard
- **Shop Health Report:** 360° Shop-Audit
- **Premium/Standard/Mini Audit:** Verschiedene Audit-Tiefen

### 📦 Product Management (8 Tools)

- **Product Analyzer:** ML-basierte Produkt-Optimierung
- **Auto Product Creator:** KI-Content-Generierung
- **Categories Manager:** Intelligente Kategorie-Verwaltung
- **Product Bundles:** Bundle-Erstellung mit KI-Vorschlägen
- **Freebies Creator:** Automatische Gratis-Produkte
- **Notes Feature:** Lagerort-Tracking mit Autosave

### 💳 Payment & Finances (13 Tools)

- **Payment Verifier:** ML-basierte Transaction Verification
- **Payment Tester:** Automatisierte Payment-Flow-Tests
- **Payment Emergency:** KI-Notfall-Analyse mit GPT-4o-mini
- **Payment Expansion:** KI-Expansionsplanung
- **Payment Success:** Success-Rate-Tracking
- **+8 weitere Payment-Tools** mit ML-Integration

### 📧 Marketing & Content (10 Tools)

- **AI Email Generator:** Personalisierte Email-Entwürfe
- **Social Media Poster:** Multi-Plattform-Upload
  - ✅ **Facebook:** Vollständig funktional
  - ✅ **YouTube:** Funktional (Daily Upload Limit: 6 Videos/Tag)
  - ✅ **LinkedIn:** API-Integration bereit (erfordert gültige Credentials)
  - ⚠️ **Twitter/X:** Erfordert kostenpflichtiges API-Guthaben
  - ⚠️ **Instagram:** Erfordert Meta Business Review
  - ⚠️ **TikTok:** Erfordert TikTok Developer Account
- **Blogpost Generator:** SEO-optimierte Blogposts
- **Image Analyzer:** KI-Bild-Qualitätsprüfung
- **German Content Generator:** Deutsche Marketing-Texte
- **+5 weitere Content-Tools**

### 🧠 Advanced AI (9 Tools)

- **Context Generator:** KI-Prompt-Optimierung
- **Memory System:** Persistent AI Context
- **System Health:** Real-time Monitoring
- **User Management:** Customer Intelligence mit ML-Personalization
- **Real Web Analytics:** Multi-Source Trend Analysis
- **+4 weitere Advanced-Tools**

> **💡 Wichtig:**
Payment Verifier: ML-basierte Transaction Verification
Payment Tester: Automatisierte Payment-Flow-Tests
Payment Emergency: KI-Notfall-Analyse mit GPT-4o-mini
Payment Expansion: KI-Expansionsplanung
Payment Success: Success-Rate-Tracking
Weitere 8 Payment-Tools mit ML-Integration

## 📊 Status & Roadmap

### ✅ Aktueller Status

| Metrik | Status |
|--------|--------|
| **Version** | 6.0.0 – Production-Ready |
| **Tests** | 350/350 ✅ |
| **Workflows** | 44 automatisierte Jobs |
| **Sprachen** | Deutsch & Englisch |
| **Stabil seit** | Dezember 2025 |

### 🤖 ML/KI Integration Status

| Kategorie | Tools | ML/KI | Status |
|-----------|-------|-------|--------|
| Analytics | 13 | 🟢 13/13 | **100%** |
| Products | 8 | 🟢 8/8 | **100%** |
| Payments | 13 | 🟢 13/13 | **100%** |
| Marketing | 10 | 🟢 10/10 | **100%** |
| Advanced | 9 | 🟢 9/9 | **100%** |
| **GESAMT** | **53** | **🟢 53/53** | **100%** |

### 🔭 Roadmap (ohne Datenbankpflicht)

- Leichtgewichtiger Wissensspeicher: FAQs/Antwort-Snippets als JSON/YAML im Repo (git-versioniert); Vektor-Store nur als optionale, spätere Erweiterung.
- Feedback-Loop light: Thumbs-Up/Down im Frontend, Speicherung in kleinen JSON-/CSV-Logs mit Rotation; Auswertung bei Bedarf offline.
- Mehr Live-Daten-Intents: Umsatz heute, Top-Seller, Low-Stock direkt über bestehende WooCommerce-APIs, keine Persistenz.
- Tests & Observability: Golden-Chat-Tests (Vitest/Playwright), einfache Request-/Fallback-Logs mit Rotation; Kennzahlen aus Logs parsbar.
- Feature Flags ohne DB: Env-Variablen oder kleine Config-Dateien für neue Intents/Prompts; Umschalten per Deploy.

---

## 🛡️ Sicherheit & Compliance

### 🔐 Authentifizierung

| Service | Methode |
|---------|---------|
| **WooCommerce** | OAuth 1.0a |
| **WordPress** | Basic Auth mit Application Passwords |
| **OpenAI** | API Key Authentication |

### 🔒 Datenschutz

## 📚 Dokumentation

| Dokument | Beschreibung | Link |
|----------|--------------|------|
| 📖 **Bedienungsanleitung** | Vollständige User-Anleitung | [docs/german/Bedienungsanleitung.md](docs/german/Bedienungsanleitung.md) |
| 🔧 **Tool-Dokumentation** | Alle 53 Tools im Detail | [docs/german/TOOLS_DOCUMENTATION.md](docs/german/TOOLS_DOCUMENTATION.md) |
| 💡 **User FAQ** | Häufige Fragen für Shop-Betreiber | [docs/german/USER_FAQ.md](docs/german/USER_FAQ.md) |
| 🛠️ **Developer FAQ** | Technische FAQ für Entwickler | [docs/german/DEVELOPER_FAQ.md](docs/german/DEVELOPER_FAQ.md) |
| 🛡️ **Security** | Sicherheit & Best Practices | [docs/german/SECURITY.md](docs/german/SECURITY.md) |
| 🧪 **Testing** | Test-Coverage & Qualität | [docs/german/TESTING.md](docs/german/TESTING.md) |
| 🚀 **Deployment** | Server-Setup & Installation | [docs/german/DEPLOYMENT_GUIDE.md](docs/german/DEPLOYMENT_GUIDE.md) |

---

### ⚖️ Lizenz & Infrastruktur-Nutzungsrechte ari-cloud.de

#### 1. Bereitstellungsmodell: Infrastructure as a Service (IaaS)
A.R.I. wird als Infrastructure as a Service (IaaS) bereitgestellt. Dies umfasst den Zugang zur dedizierten Recheninfrastruktur, den spezialisierten KI-Server-Instanzen sowie den proprietären Algorithmen (Agentic Loops).

#### 2. Urheberrecht und Geistiges Eigentum
Der Quellcode ist unter AGPL-lizenzierter Open-Source-Basis verfügbar. Maßgeblich sind die Bedingungen in [LICENSE](LICENSE), inklusive der dort definierten Zusatzbedingungen zur Signaturprüfung und zur Nutzung proprietärer Spezialisierungsdateien (.ari-spec).

**Strikte Zusatzbedingungen gemäß LICENSE:**
- Die Signaturprüfung für Spezialisierungen darf nicht entfernt, deaktiviert oder umgangen werden.
- Der im Verifier eingebettete öffentliche Schlüssel darf nicht ausgetauscht werden.
- `SKIP_SIGNATURE_VERIFICATION=true` ist in Produktionsumgebungen unzulässig.
- Verstöße führen zum Verlust des Nutzungsrechts unter der Lizenz.

#### 3. Nutzungsrecht und Verantwortung
Dem Nutzer wird ein exklusives Nutzungsrecht an der bereitgestellten Infrastruktur für den Betrieb seines WooCommerce-Shops eingeräumt.

**Kommerzielle Nutzung:**
- Kommerzielle und nicht-kommerzielle Nutzung des Grundmodells ist unter der AGPL zulässig, sofern alle AGPL-Pflichten eingehalten werden.
- Unberührt davon bleiben die strikten Vorgaben zu Signaturprüfung, eingebettetem Schlüssel und proprietären signierten `.ari-spec` Dateien.

**Faktenbasierte Kontrolle:** Da A.R.I. als digitaler Mitarbeiter die Infrastruktur für Content und Analysen stellt, obliegt die finale Prüfung und Ausführung (z. B. Copy & Paste von Marketing-Texten) der Eigenverantwortung des Nutzers.

**Untersagte Nutzungen:**
- Die Software oder Teile davon zu vervielfältigen, zu vermieten oder an Dritte unterzulizenzieren.
- A.R.I. zur Erstellung von Konkurrenzprodukten oder zur automatisierten Datenextraktion (Scraping) zu verwenden.
- Signierte Spezialisierungsdateien (.ari-spec) weiterzuverbreiten, weiterzuverkaufen oder zurückzuentwickeln.

#### 4. Skalierbarkeit und Performance
Die Infrastruktur ist für professionelles Wachstum ausgelegt und ermöglicht eine kurzfristige Skalierung der Server-Instanzen bei steigender Last. Der Nutzer hat Anspruch auf die vereinbarte Rechenleistung innerhalb der gesicherten 1.0.0-Produktionsumgebung.

#### 5. Gewährleistung und Haftung
A.R.I. wird als „Infrastructure as a Service" (IaaS) bereitgestellt. Trotz einer Testabdeckung von über 365 automatisierten Tests und einer Fehlerquote von 0 % im Release-Zustand erfolgt die Bereitstellung ohne Mängelgewähr für spezifische wirtschaftliche Erfolge.

Die finale Kontrolle über die Veröffentlichung von KI-generierten Inhalten (z. B. via Copy & Paste) obliegt allein dem Nutzer.

---

## 💬 Support

- **E-Mail:** info@ari-cloud.de
- **Website:** [ari-cloud.de](https://ari-cloud.de)

---

## 🙏 Credits

**Entwickelt mit ❤️ von André Zabel ([@AndreZ1971](https://github.com/AndreZ1971))**

### Powered by:

![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![WooCommerce](https://img.shields.io/badge/WooCommerce-96588A?style=for-the-badge&logo=woocommerce&logoColor=white)
![WordPress](https://img.shields.io/badge/WordPress-21759B?style=for-the-badge&logo=wordpress&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

<div align="center">

### 🎯 Gebaut für Shop-Betreiber, die ihre Zeit für die wichtigen Entscheidungen nutzen wollen.

[🚀 Installation](docs/german/DEPLOYMENT_GUIDE.md) • [📚 Dokumentation](docs/german/Bedienungsanleitung.md) • [💬 Support](#support)

