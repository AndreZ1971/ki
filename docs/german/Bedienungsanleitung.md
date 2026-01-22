# A.R.I. Bedienungsanleitung

## ⚠️ Hinweis zu Shop-Metriken und Mock-Daten

**Wichtig:** Die Umsatzkurven in den Shop-Metriken verwenden derzeit **absichtlich Mock-Daten** anstelle von Live-WooCommerce-Daten.

### Warum Mock-Daten?

Diese Visualisierungen dienen als **Vision und Richtungsweiser** für die zukünftige Entwicklung von A.R.I.:

- 📊 **Konzept-Demonstration**: Zeigt, wie umfassende Umsatzanalysen aussehen werden
- 🎯 **Feature-Roadmap**: Verdeutlicht geplante Analytics-Funktionen
- 💡 **User Experience Preview**: Gibt Nutzern einen Vorgeschmack auf kommende Dashboards
- 🔮 **Entwicklungsziel**: Symbolisiert die angestrebte Datenintegration

### Was ist betroffen?

- **Nur** die Umsatzkurve im Dashboard (Revenue Chart)

Alles andere nutzt Live-Daten.

### Echte Daten vs. Mock-Daten

✅ **Echte WooCommerce-Daten werden verwendet für:**
- Produktlisten und Inventar
- Bestellhistorie (Analytics Insights Loop)
- Kategorien und Attribute
- Kundendaten

⚠️ **Mock-Daten werden verwendet für:**
- Umsatzkurve im Dashboard

### Zukünftige Entwicklung

Diese Mock-Visualisierungen werden schrittweise durch echte WooCommerce-Datenintegration ersetzt, sobald:
1. WooCommerce Analytics API vollständig integriert ist
2. Performance-Optimierungen für große Datensätze implementiert sind
3. Caching-Mechanismen für Echtzeit-Metriken verfügbar sind

---
 v7.0.7 (Januar 2026)

**Status:** Production Ready mit erweiterten Trend-Analysen und Preisoptimierungen

---

## 🎯 Schnelleinstieg

### Was brauche ich?
- WooCommerce Shop mit aktiver API
- WordPress Benutzerkonto
- OpenAI API Key (in `connection.json` eintragen)
- Optional: Reddit OAuth Credentials (für echte Kundenmeinungen)
- Optional: YouTube OAuth (für Video-Upload auf YouTube)

### Was passiert automatisch?
A.R.I. liest deine Daten (Produkte, Bestellungen, Trends) und erstellt **Hinweise, Entwürfe und Vorschläge**. Du prüfst und entscheidest – keine autonomen Änderungen am Shop ohne dein OK.

---

## 🎥 Social Media & Marketing

### 🆕 Social Media Poster (mit YouTube Video Upload)
**Was es tut:** Veröffentliche Marketing-Content auf mehreren Plattformen (LinkedIn, TikTok, Instagram, X/Twitter, Facebook, **YouTube**).

**Neu in v6.4:**
- **YouTube Video Upload**: Lade Videos direkt hoch mit Auto-Metadaten
- **Metadata Auto-Generierung**: Titel, Tags, Beschreibung aus deinem Text
- **Platform-übergreifend**: Schreibe einmal, veröffentliche auf mehreren Kanälen

**Verwendung:**
1. Öffne "Social Media Poster"
2. Schreibe deinen Content-Text (erster Satz wird Titel)
3. Nutze Hashtags im Text → werden automatisch zu YouTube-Tags
4. **Für YouTube:** Wähle Video-Datei (MP4, MOV, AVI, etc.)
5. Sehe Preview: Titel, Tags, Beschreibung
6. Klicke "Veröffentlichen auf YouTube"
7. Video wird mit Metadaten hochgeladen

**Beispiel:**
```
Content-Text:
"🚀 Unser neuer Kurs ist live! #KünstlicheIntelligenz #Lernen #Tech

Lerne die Grundlagen von KI in 4 Stunden mit praktischen Projekten..."

YouTube Metadaten (auto-generiert):
- Titel: "🚀 Unser neuer Kurs ist live!"
- Tags: ["KünstlicheIntelligenz", "Lernen", "Tech"]
- Beschreibung: "Lerne die Grundlagen von KI in 4 Stunden mit praktischen Projekten..."
```

**Besonderheiten:**
- Alle Plattformen optional (aktivier/deaktivier wie du möchtest)
- OAuth-Verbindung einmalig, danach automatisch
- Video-Upload läuft im Hintergrund
- Phase 2 (geplant): Auto-Video-Generierung aus Text

**Benötigte Verbindungen:**
- YouTube OAuth (s. Social Media Onboarding Guide)
- Weitere Plattformen optional (LinkedIn, TikTok, etc.)

**YouTube Setup (einmalig):**
1. Gehe zu Settings → Social Media Connections → YouTube
2. Klicke "Mit YouTube verbinden"
3. Melde dich mit deinem Google-Account an
4. Bestätige die Berechtigungen
5. Done! Tokens werden automatisch gespeichert

---

## 📦 Produktverwaltung

### 🆕 Woo Product Update (mit Trend-Analyse)
**Was es tut:** Aktualisiert WooCommerce-Preise basierend auf Google Trends + Reddit Kundenmeinungen.  
**Neu in v6.3:**
- **Prozentuale Preislimits**: Max +20% Erhöhung / -15% Reduktion (anpassbar)
- **Multi-Source Trends**: Google Trends (Suchinteresse) + Reddit (Kundenmeinungen)
- **Intelligente Fallbacks**: Wenn Trend-Daten schwach sind, nutzt AI automatisch skalierte Prozentbereich
- **Manual Override**: Du kannst jeden Vorschlag vor Speicherung prüfen/ändern

**Verwendung:**
1. Produkt in "Woo Product Updater" wählen
2. `maxPriceIncreasePercent` und `maxPriceDecreasePercent` eingeben (z.B. +20 / -15)
3. **"Trend-Analyse starten"** klicken
4. AI schlägt neuen Preis vor (mit Begründung: Google Trends Score, Reddit Sentiment, Confidence %)
5. **Entweder:** "✓ Übernehmen" (speichert sofort) **oder** "Manuell anpassen" (editieren + speichern)

**Beispiel:**
- Aktueller Preis: €50
- Max Increase: +20% → €60
- Max Decrease: -15% → €42.50
- Google Trends Score: 65/100 (interesse fallend)
- Reddit: Kunden wünschen sich niedrigeren Preis
- **AI Vorschlag:** €47 (-6%) mit 78% Confidence
- ✓ Du klickst "Übernehmen" → Preis wird auf €47 gesetzt

**Grenzen:** Prozentuale Limits sind Richtlinien, nicht absolute Grenzen – AI kann davon abweichen, wenn Trend-Daten sehr stark sind. Bei Speicherung nochmal prüfen!

### Product Analyzer  
**Was es tut:** 360°-Check deines Produkts (SEO-Score, Beschreibungsqualität, Preispositionierung).  
**Input:** Produkt-ID.  
**Output:** Score-Karte mit Insights & Verbesserungsvorschlägen.  
**Grenzen:** Analyse-Hinweise; keine Auto-Änderungen.

### Auto Product Creator
**Was es tut:** Generiert Produkttexte, Bild-Prompts, Keywords mit KI.  
**Input:** Produkttitel, Kategorie, Keywords.  
**Output:** Beschreibungsentwurf + DALL-E Bild-Prompt.  
**Grenzen:** Du speicherst manuell in WooCommerce.

### Categories Manager
**Was es tut:** Erstellt/bearbeitet WooCommerce-Kategorien.  
**Input:** Kategoriedaten.  
**Output:** Kategorien in WooCommerce (nur nach deinem Klick).  
**Grenzen:** Manuelles Speichern erforderlich.

### Create Freebies  
**Was es tut:** Erstellt digitale Freebie-Produkte (0 €, Download).  
**Input:** Deine ZIP/PDF-Datei, Produktinfos.  
**Output:** Freebie-Eintrag in WooCommerce (mit deiner Datei).  
**Grenzen:** Du bereitest Datei; A.R.I. erstellt keinen Content.

### Product Bundles
**Was es tut:** Kombiniert mehrere Produkte zu Bundles.  
**Input:** Produkt-IDs, Bundle-Name.  
**Output:** Bundle-Entwurf.  
**Grenzen:** Du speicherst in WooCommerce.

---

## 📊 Analytics & Insights

### 🆕 Trend Analysis (Multi-Source)
**Was es tut:** Erkennt Trends via **Google Trends**, **Reddit Diskussionen**, **Wikipedia Pageviews**, **Google News** und mehr.  
**Neu in v6.3:**
- **Google Trends**: 7-Tage-Durchschnitt der Suchanfragen
- **Reddit OAuth**: Echte Kundenmeinungen aus r/ecommerce, r/shopping, etc. (nicht bloß Public API)
- **Wikipedia**: International Trend-Indikatoren
- **Google News**: Nachrichtentrends im Bereich
- **Geplant (Phase 1):** YouTube Trending Videos

**Verwendung:**
1. Produktname eingeben (z.B. "Laptop-Rucksack")
2. "Trends analysieren" klicken
3. Sehe: Google Trend Score (0-100), Reddit Sentiment (Pos/Neg/Neutral), Confidence %
4. AI kombiniert Daten → Preisvorschlag

**Beispiel:**
- Google Trends: 72/100 (hohes Suchinteresse)
- Reddit: +65 Upvotes für "gute Qualität für den Preis", -30 für "zu teuer"
- Confidence: 82%
- **Vorschlag:** Mittlerer Preis mit guter Qualitäts-Botschaft

**Grenzen:** Trends sind verzögert (Google Trends max 7 Tage alt). Reddit-Daten nur für englische Diskussionen (momentan).

### Shop Metrics
**Was es tut:** Live-KPIs aus WooCommerce (Umsatz, Bestellungen, Conversion).  
**Input:** WooCommerce-API.  
**Output:** Dashboard mit Echtzeitdaten.  
**Grenzen:** Nur Lesezugriff.

### Conversion Analysis
**Was es tut:** Analysiert, wo Nutzer aus dem Funnel abspringen.  
**Input:** Analytics-Daten, Zeitraum.  
**Output:** Funnel mit Drop-Off-Punkten.  
**Grenzen:** Hinweise; keine Auto-Fixes.

### Feedback Analysis
**Was es tut:** Sentiment-Analyse von Reviews + Support-Tickets.  
**Input:** WooCommerce-Reviews, Awesome Support Tickets.  
**Output:** Sentiment-Bericht, Top-Issues, Prioritäten.  
**Grenzen:** Analyse-Hinweise; keine Auto-Antworten.

### Real Analytics
**Was es tut:** Live-Dashboard mit Besuchern, Klicks, Sessions.  
**Input:** Tracking-Code installiert.  
**Output:** Echtzeit-Metriken.  
**Grenzen:** Nur Anzeige.

### Shop Health Report
**Was es tut:** 360°-Shop-Audit (Performance, SEO, Security, Conversion).  
**Input:** Shop-URL.  
**Output:** Score + Problemliste mit Prioritäten.  
**Grenzen:** Keine Auto-Reparatur.

### Premium/Standard/Mini Audit
**Was es tut:** Verschiedene Audit-Tiefen (Premium = detailliert; Mini = schnell).  
**Input:** Shop-URL, Audit-Typ.  
**Output:** Audit-Bericht.  
**Grenzen:** Hinweise; du setzt um.

---

## 💳 Zahlungsverarbeitung

### Payment Verifier
**Was es tut:** Prüft Zahlungen auf Betrug/Fehler.  
**Input:** Transaktionen.  
**Output:** Verifikations-Status (OK/Verdächtig/Fehler).  
**Grenzen:** Hinweise; keine Auto-Blocks.

### Payment Tester
**Was es tut:** Testet Payment-Flows automatisch (Erfolgsrate, Geschwindigkeit).  
**Input:** Test-Szenarien.  
**Output:** Test-Report.  
**Grenzen:** Nur Tests.

### Payment Emergency
**Was es tut:** Notfall-Analyse bei Payment-Problemen (Systemausfall).  
**Input:** Incident-Trigger.  
**Output:** Response-Plan.  
**Grenzen:** Du aktivierst Notfallmaßnahmen.

### Payment Expansion
**Was es tut:** Plant Erweiterung von Zahlungsoptionen (neue Länder, Währungen).  
**Input:** Neue Payment-Provider.  
**Output:** Integrations-Plan.  
**Grenzen:** Du setzt um.

---

## 📧 Marketing

### 🆕 Social Media Poster (6 Plattformen)
**Was es tut:** Erstellt Post-Entwürfe für LinkedIn, Facebook, Instagram, TikTok, X (Twitter), YouTube.  
**Input:** Thema, Zielgruppe, Tonalität.  
**Output:** Plattformspezifische Post-Entwürfe (mit Hashtags, Emojis, Timing-Vorschlägen).  
**Neu in v6.3:**
- Dark Glass UI für bessere Lesbarkeit
- Prozentuale Engagement-Prognosen
- Copy/Paste-Option (ohne API-Token)

**Verwendung:**
1. Thema eingeben (z.B. "Neuer Winter-Sale")
2. Plattformen wählen (einzeln oder alle)
3. Tonalität: Professionell / Spielerisch / Viral
4. "Posts generieren" klicken
5. **Entweder:** Posts (manuell) kopieren und posten **oder** API-Tokens in Settings eintragen für automatisches Posten

**Grenzen:** API-Tokens erforderlich für Auto-Post (siehe `social_media_onboarding.md` für Setup).

### AI Email Generator
**Was es tut:** Erstellt E-Mail-Entwürfe (Newsletter, Welcome, Winback).  
**Input:** Thema, Zielgruppe, Tonalität.  
**Output:** E-Mail-Draft mit Subject-Line und Body.  
**Grenzen:** Du versendest manuell (Mailchimp, Brevo, etc.).

### Blogpost Generator
**Was es tut:** Generiert Blog-Artikel-Entwürfe (SEO-optimiert).  
**Input:** Thema, Keywords, Länge (kurz/mittel/lang).  
**Output:** Artikel-Entwurf (Markdown).  
**Grenzen:** Du prüfst und publishst in WordPress.

### Kite Templates
**Was es tut:** Vorlagen-Bibliothek (E-Mails, Landing Pages, Posts).  
**Input:** Template-Typ.  
**Output:** Anpassbare Vorlage.  
**Grenzen:** Du editierst und publishst.

### Image Analyzer
**Was es tut:** Prüft Bilder (SEO Alt-Text, Qualität, Größe).  
**Input:** Bild-URL.  
**Output:** Analyse-Report mit Verbesserungsvorschlägen.  
**Grenzen:** Hinweise; keine Auto-Optimierung.

---

## 🧠 Erweiterte Funktionen

### Context Generator
**Was es tut:** Optimiert AI-Prompts für bessere Ergebnisse.  
**Input:** Use-Case / Anfrage.  
**Output:** Optimierter Kontext/Prompt.  
**Grenzen:** Du nutzt Output in anderen Tools.

### Memory System
**Was es tut:** KI lernt deine Vorlieben (Tonalität, Länge, Stil).  
**Input:** Deine Interaktionen.  
**Output:** Personalisierte Ergebnisse (z.B. "Wir wissen, dass du kurze prägnante Texte magst").  
**Grenzen:** RAM-basiert, wird beim Neustart zurückgesetzt.

### User Management
**Was es tut:** Analysiert Kunden-Verhalten (Top-Kunden, Churn-Risiko, personalisierte Angebote).  
**Input:** Kunden-Daten aus WooCommerce.  
**Output:** Kunden-Dashboard + personalisierte Vorschläge.  
**Grenzen:** Vorschläge; du entscheidest über Angebote.

### System Health
**Was es tut:** Prüft Gesundheitszustand (API-Status, CPU, Memory, Fehlerrate).  
**Input:** Monitoring.  
**Output:** Health-Dashboard mit Alerts.  
**Grenzen:** Nur Monitoring; keine Auto-Reparatur.

---

## ⚙️ Konfiguration

### Credentials einrichten
**Alle Credentials in:** `backend/connection.json` (Git-ignoriert)

```json
{
  "woocommerce": {
    "url": "https://dein-shop.de",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_..."
  },
  "openAI": {
    "apiKey": "sk-proj-...",
    "model": "gpt-4o-mini"
  },
  "reddit": {
    "clientId": "0Fju4VBi...",
    "clientSecret": "gVVZ2p6u..."
  }
}
```

### Dark Glass Theme
Das System nutzt automatisch ein dunkles Glass-Morphism-Design mit:
- Rgba-Backgrounds (rgba(36,44,68,0.75))
- Blur-Effekte (backdrop-filter: blur(10px))
- Helle Schrift (#f7f9ff) auf dunklem Hintergrund
- Hohe Kontraste (WCAG 2.1 AA)

Keine zusätzliche Konfiguration erforderlich.

---

## 🆕 Prozentuale Preislimits erklärt

### Warum Prozente statt feste €-Werte?
- **Problem:** Ein Limit wie "max €10 Reduktion" funktioniert für €20-Produkte, aber nicht für €200-Produkte
- **Lösung:** Prozentuale Limits skalieren automatisch

### Wie funktioniert es?
```
Aktueller Preis: €100
maxPriceIncreasePercent: 20% → Maximum: €120
maxPriceDecreasePercent: 15% → Minimum: €85

AI Trend-Score: 65/100 (mittel)
Dynamischer Fallback: (65-50)/50 = 0.30 → 30% der max Reduktion nutzen
Berechnung: €100 - (€15 × 0.30) = €100 - €4.50 = €95.50

**Vorschlag: €95.50 statt hart auf €85**
```

### Was ist die "dynamische Fallback-Logik"?
Wenn Trend-Daten schwach sind (Score < 50), skaliert AI den Preisabschlag, um nicht immer das Maximum zu nehmen. Das verhindert, dass alle Preise auf der gleichen Untergrenze landen.

---

## 🔧 Häufige Probleme

### "Trend-Analyse funktioniert nicht"
1. **Check:** Sind Reddit-Credentials in `connection.json` eingetragen?
   - Falls Nein → Eintragen + Backend neustarten
   - Falls Ja → Nächster Schritt

2. **Check:** Ist OpenAI API-Key vorhanden?
   - Falls Nein → Eintragen + Backend neustarten

3. **Check:** Browser-Console (F12) öffnen → Errors prüfen

### "Preis wird nicht aktualisiert"
1. **Check:** Klickst du "Übernehmen" oder "Manuell anpassen"?
   - "Manuell anpassen" speichert NICHT automatisch
   - Du musst nochmal "Speichern" klicken

2. **Check:** Fehler in Browser-Console?

### "Posts werden nicht auf Social Media gepostet"
1. **Check:** Hast du API-Tokens in Settings → Social Media eingegeben?
   - Siehe `social_media_onboarding.md` für Anleitung

2. **Check:** Tokens sind gültig und nicht abgelaufen?
   - Reddit OAuth-Tokens: 1 Stunde gültig
   - Facebook/LinkedIn/TikTok: Verschiedene Refresh-Intervale

---

**Alle Tools arbeiten assistierend – deine Kontrolle bleibt immer erhalten. Viel Erfolg! 🚀**

### Shop Metrics
**Was es tut:** Liest Basis-KPIs aus WooCommerce (Umsatz, Bestellungen, Conversion, Kunden).  
**Input:** WooCommerce-API-Credentials.  
**Output:** Dashboard mit Live-Metriken.  
**Grenzen:** Nur Lesezugriff, keine Shop-Änderungen.

### Conversion Analysis
**Was es tut:** Analysiert Conversion-Funnel (wo brechen Nutzer ab?).  
**Input:** Analytics-Daten, Zeitraum.  
**Output:** Funnel-Bericht mit Drop-Off-Punkten.  
**Grenzen:** Hinweise nur; keine Auto-Fixes.

### Feedback Analysis
**Was es tut:** Analysiert WooCommerce-Reviews und Support-Tickets (via Awesome Support Plugin).  
**Input:** Reviews + Tickets aus WooCommerce/WordPress.  
**Output:** Sentiment-Analyse, Insights, Prioritäten.  
**Grenzen:** Keine Auto-Antworten, nur Analyse.

### Conversion Reported
**Was es tut:** Erstellt automatisierte Conversion-Reports.  
**Input:** Zeitraum, Conversion-Ziele.  
**Output:** PDF/Excel-Report.  
**Grenzen:** Nur Reporting, keine Live-Optimierung.

### Trend Analysis
**Was es tut:** Erkennt Trends in Verkäufen/Traffic/Nachfrage.  
**Input:** Historische Daten, Zeitreihen.  
**Output:** Trend-Verlauf, Prognosen.  
**Grenzen:** Hinweise, keine Auto-Maßnahmen.

### Run Trend Analysis
**Was es tut:** Startet Trend-Analyse-Job manuell.  
**Input:** Klick auf "Run".  
**Output:** Trend-Bericht.  
**Grenzen:** Manueller Trigger erforderlich.

### Real Analytics
**Was es tut:** Zeigt Live-Metriken in Echtzeit.  
**Input:** WooCommerce-Verbindung.  
**Output:** Echtzeit-Dashboard.  
**Grenzen:** Nur anzeigen, keine Änderungen.

### Real Web Analytics
**Was es tut:** Web-Analytics in Echtzeit (Besucher, Klicks, Sessions).  
**Input:** Tracking-Code installiert.  
**Output:** Live-Besucher-Daten.  
**Grenzen:** Nur Beobachtung.

### Analytic Regioning
**Was es tut:** Geo-/Regionen-Analyse (wo kommen Kunden her?).  
**Input:** Order-Daten mit Standorten.  
**Output:** Regionen-Heatmap, Top-Regionen.  
**Grenzen:** Nur Insights, keine Auto-Kampagnen.

### Shop Health Report
**Was es tut:** Umfassender Shop-Gesundheitscheck (Performance, SEO, Security).  
**Input:** Shop-URL.  
**Output:** Health-Score, Problemliste.  
**Grenzen:** Keine Auto-Reparatur.

### Premium Audit
**Was es tut:** Tiefgehender Business-Audit (Wettbewerb, Markt, Finanzen).  
**Input:** Shop-Daten, Markt-Infos.  
**Output:** Detaillierter Audit-Bericht.  
**Grenzen:** Nur Analyse, keine Umsetzung.

### Standard Audit
**Was es tut:** Standard-Audit (Performance, SEO, UX).  
**Input:** Shop-URL.  
**Output:** Audit-Bericht mit Empfehlungen.  
**Grenzen:** Hinweise nur.

### Mini Audit
**Was es tut:** Schneller Audit-Light (Ladezeiten, Mobile, Basics).  
**Input:** Shop-URL.  
**Output:** Schnell-Check-Bericht.  
**Grenzen:** Oberflächlich, keine Tiefenanalyse.

---

## Products (9)

### Auto Product Creator
**Was es tut:** Erstellt Marketing-Material für Produkte (Texte, Bild-Prompts) mit KI. **Nicht** das Produkt selbst.
**Input:** Titel, Kategorie, Keywords, Tonalität.
**Output:** Beschreibungsentwurf, Bild-Prompt.
**Grenzen:** Du musst das physische/digitale Produkt bereitstellen; A.R.I. erstellt nur Texte/Bilder. Manuelles Speichern in WooCommerce.
### Run Auto Product Creator
**Was es tut:** Startet Auto-Product-Creator-Job sofort (generiert Marketing-Material).
**Input:** Klick.
**Output:** Produktentwurf (Texte/Bilder). **Produkt selbst musst du bereitstellen.**
**Grenzen:** Manueller Trigger, kein Auto-Upload, keine Produkterstellung.
### Woo Product Create
**Was es tut:** Legt neues WooCommerce-Produkt an.  
**Input:** Produktdaten (Name, Preis, Beschreibung).  
**Output:** Produkt in WooCommerce.  
**Grenzen:** Nur nach deinem Klick auf "Speichern".

### Woo Product Update
**Was es tut:** Aktualisiert bestehendes WooCommerce-Produkt.  
**Input:** Produkt-ID, neue Daten.  
**Output:** Aktualisiertes Produkt.  
**Grenzen:** Nur nach Freigabe.

### Product Analysis
**Was es tut:** Analysiert Produkte (Score, Metriken, Empfehlungen).  
**Input:** Produkt-ID.  
**Output:** Analyse-Bericht mit Optimierungsvorschlägen.  
**Grenzen:** Hinweise nur, keine Auto-Änderungen.

### Categories Manager
**Was es tut:** Verwaltet WooCommerce-Kategorien (erstellen, umbenennen).  
**Input:** Kategorie-Daten.  
**Output:** Kategorien in WooCommerce.  
**Grenzen:** Nur nach Klick.

### Create Freebies
**Was es tut:** Erstellt Freebie-Produkteinträge in WooCommerce (0 €, digital, downloadable). **Du musst die Datei (ZIP/PDF) bereitstellen.**
**Input:** ZIP/Cover (von dir), Produktinfos.
**Output:** Freebie-Produkteintrag mit deiner Datei.
**Grenzen:** A.R.I. lädt nur hoch, was du bereitstellst; erstellt keine Inhalte. Manuelles Speichern.
### Run Create Freebies
**Was es tut:** Startet Freebie-Job sofort (Upload deiner bereitgestellten Datei).
**Input:** Klick + deine Datei (ZIP/PDF).
**Output:** Freebie-Entwurf mit deiner Datei.
**Grenzen:** Du musst Datei bereitstellen; A.R.I. erstellt keinen Content. Du speicherst.
### Product Bundles
**Was es tut:** Erstellt Produkt-Bundles (mehrere Produkte zusammen).  
**Input:** Produkt-IDs, Bundle-Name.  
**Output:** Bundle-Entwurf.  
**Grenzen:** Du legst Bundle in WooCommerce an.

---

## Payments (12)

### Payment Fast
**Was es tut:** Beschleunigt Zahlungs-Verarbeitung (One-Click, Tokenization).  
**Input:** Payment-Methoden.  
**Output:** Optimierte Checkout-Flows.  
**Grenzen:** Konfiguration erforderlich, keine Auto-Aktivierung.

### Payment Simplified
**Was es tut:** Vereinfacht Checkout (weniger Schritte, Auto-Fill).  
**Input:** Checkout-Prozess.  
**Output:** Vereinfachter Flow.  
**Grenzen:** Du aktivierst Änderungen.

### Payment Tester
**Was es tut:** Testet Payment-Flows automatisch.  
**Input:** Test-Szenarien.  
**Output:** Test-Bericht mit Erfolgsquoten.  
**Grenzen:** Nur Tests, keine Live-Fixes.

### Payment Verifier
**Was es tut:** Verifiziert Zahlungen (Fraud-Check, Validierung).  
**Input:** Transaktionen.  
**Output:** Verifikations-Status.  
**Grenzen:** Hinweise, keine Auto-Blocks.

### Payment Success
**Was es tut:** Überwacht Erfolgsraten, Conversion.  
**Input:** Payment-Daten.  
**Output:** Success-Rate-Dashboard.  
**Grenzen:** Nur Monitoring.

### Payment Validation
**Was es tut:** Validiert Zahlungen (Karte, Identität, Risiko).  
**Input:** Payment-Details.  
**Output:** Validierungs-Bericht.  
**Grenzen:** Hinweise nur.

### Payment Issued Detector
**Was es tut:** Erkennt Payment-Probleme (Fehler, Declines).  
**Input:** Transaktions-Logs.  
**Output:** Issue-Liste.  
**Grenzen:** Keine Auto-Fixes, nur Hinweise.

### Payment User Favor
**Was es tut:** Optimiert Payment-UX (bevorzugte Zahlarten).  
**Input:** User-Präferenzen.  
**Output:** Personalisierte Checkout-Optionen.  
**Grenzen:** Du aktivierst Änderungen.

### Payment Delivery
**Was es tut:** Managt Payment-Delivery-Flow (Versand nach Zahlung).  
**Input:** Order-Daten.  
**Output:** Delivery-Status.  
**Grenzen:** Keine Auto-Versand-Trigger.

### Payment Emergency
**Was es tut:** Notfall-Modus bei Payment-Problemen (Systemausfall).  
**Input:** Incident-Trigger.  
**Output:** Emergency-Response-Plan.  
**Grenzen:** Du aktivierst Notfallpläne.

### Payment Expansion
**Was es tut:** Erweitert Payment-Optionen (internationale Währungen, neue Methoden).  
**Input:** Neue Payment-Partner.  
**Output:** Integration-Plan.  
**Grenzen:** Du setzt um.

### Payment Quick Check
**Was es tut:** Schneller Payment-Status-Check.  
**Input:** Transaktions-ID.  
**Output:** Status (erfolgt/fehlgeschlagen).  
**Grenzen:** Nur Status, keine Reparatur.

---

## Marketing (10)

### AI Email Generator
**Was es tut:** Erstellt E-Mail-Entwürfe mit KI.  
**Input:** Thema, Zielgruppe, Tonalität.  
**Output:** E-Mail-Entwurf.  
**Grenzen:** Du versendest manuell oder per ESP.

### German Content Generator
**Was es tut:** Generiert deutsche Marketing-Texte.  
**Input:** Keywords, Zielgruppe.  
**Output:** Textentwurf (Blog, Social, Produkt).  
**Grenzen:** Du prüfst und veröffentlichst.

### Email Marketing Automation
**Was es tut:** Erstellt E-Mail-Sequenzen (Welcome, Winback).  
**Input:** Sequenztyp.  
**Output:** E-Mail-Serie.  
**Grenzen:** Du aktivierst in ESP/CRM.

### Social Media Audio
**Was es tut:** Erstellt Audio-Content für Social Media.  
**Input:** Text/Script.  
**Output:** Audio-Datei.  
**Grenzen:** Du postest manuell.

### Social Media Poster
**Was es tut:** Erstellt Social-Post-Entwürfe für LinkedIn, Facebook, Instagram, TikTok, X (Twitter), YouTube.  
**Input:** Thema, Zielgruppe, Tonalität, Plattform-Auswahl.  
**Output:** Fertige Post-Entwürfe mit Hashtags/Emojis (optional).  
**Grenzen:** Veröffentlichen erfordert API-Token-Eingabe in **Settings → Social Media** (Access Tokens pro Plattform) + deinen Klick. Ohne Tokens nur Copy/Paste möglich. Technische Token-Generierung siehe `social_media_onboarding.md`.

### Free to Post Converter
**Was es tut:** Konvertiert Free-User zu aktiven Postern (Aktivierungskampagnen).  
**Input:** User-Segmente.  
**Output:** Kampagnen-Entwurf.  
**Grenzen:** Du startest Kampagne.

### Content Monetized
**Was es tut:** Monetarisiert Inhalte (Paywall, Affiliate, Digital Products).  
**Input:** Content-Typ.  
**Output:** Monetarisierungs-Plan.  
**Grenzen:** Du setzt um.

### Kite Templates
**Was es tut:** Vorlagen-Bibliothek für E-Mails, Landing Pages, Posts.  
**Input:** Template-Typ.  
**Output:** Anpassbare Vorlage.  
**Grenzen:** Du editierst und veröffentlichst.

### Blogpost Generator
**Was es tut:** Generiert Blogpost-Entwürfe.  
**Input:** Thema, Keywords, Länge.  
**Output:** Blogpost-Entwurf.  
**Grenzen:** Du prüfst und publizierst in WordPress.

### Image Analyzer
**Was es tut:** Analysiert Bilder (SEO, Alt-Text, Qualität).  
**Input:** Bild-URL.  
**Output:** Analyse-Bericht.  
**Grenzen:** Hinweise nur, keine Auto-Optimierung.

---

## Advanced (7)

### Context Generator
**Was es tut:** Generiert KI-Kontexte/Prompts für bessere Ergebnisse.  
**Input:** Use-Case.  
**Output:** Optimierter Kontext/Prompt.  
**Grenzen:** Du nutzt Kontext in anderen Tools.

### String Generator
**Was es tut:** Generiert Strings/Patterns (Code, Test-Daten, UUIDs).  
**Input:** String-Typ, Format.  
**Output:** Generierte Strings.  
**Grenzen:** Nur Generierung, keine Auto-Integration.

### Auto Framplementator
**Was es tut:** Erstellt Framework-/Boilerplate-Setup (React, Node, etc.).  
**Input:** Framework-Typ, Projekt-Name.  
**Output:** Projekt-Setup.  
**Grenzen:** Du prüfst und deployst.

### WooCommerce Sync
**Was es tut:** Synchronisiert WooCommerce-Daten (Produkte, Orders, Kunden).  
**Input:** Sync-Bereiche, Intervall.  
**Output:** Sync-Bericht.  
**Grenzen:** Keine Auto-Mutations, nur Sync/Lesen.

### Memory System
**Was es tut:** KI-Gedächtnis für personalisierte Ergebnisse (User-Präferenzen, Context).  
**Input:** Interaktionen.  
**Output:** Personalisierte Vorschläge.  
**Grenzen:** Temporär im RAM, kein Langzeit-Speicher.

### System Health
**Was es tut:** Prüft Systemzustand (CPU, Memory, API-Status).  
**Input:** Monitoring-Bereiche.  
**Output:** Health-Dashboard.  
**Grenzen:** Nur Monitoring, keine Auto-Reparatur.

### User Management (Customer Intelligence)
**Was es tut:** Analysiert Kunden-Verhalten (Umsätze pro User, Bestellhistorie, Shop-Besuche, Engagement).  
**Input:** Kunden-Daten aus WooCommerce/WordPress.  
**Output:** Kunden-Dashboard mit Metriken; KI-generierte personalisierte Angebots-Vorschläge.  
**Grenzen:** Vorschläge/Analysen nur; du entscheidest über Angebote und Versand.

---

**Alle 51 Tools arbeiten assistierend. Änderungen gehen nur mit deiner Freigabe live. Keine autonomen Shop-Mutations, Posts oder Preisänderungen.**