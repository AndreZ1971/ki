# A.R.I. Tool-Referenz (51 Tools, assistiert, nicht autonom)

**Grundprinzip:** Alle Tools arbeiten assistierend. Entwürfe, Analysen und Hinweise werden erzeugt; Freigaben und Live-Änderungen erfordern deinen Klick.

---

## Analytics (13)

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