# ⚙️ A.R.I. - Settings & Backend Handbuch

**Version:** 7.5.0  
**Datum:** Januar 2026  
**Zielgruppe:** Shop-Betreiber, die A.R.I. konfigurieren möchten

> **Wichtig:** Dieses Handbuch erklärt dir, wie du **A.R.I. einrichtest und konfigurierst** (Backend/Settings).  
> Wie du die **52 Tools im Frontend nutzt**, findest du in der **Bedienungsanleitung**.

---

## 📋 Inhaltsverzeichnis

1. [WooCommerce verbinden](#woocommerce-verbinden)
2. [OpenAI konfigurieren](#openai-konfigurieren)
3. [Spezialisierungen hochladen](#spezialisierungen-hochladen)
4. [Backend-Dashboard verstehen](#backend-dashboard-verstehen)
5. [Agentic Loops verstehen](#agentic-loops-verstehen)
6. [Sicherheit & Datenschutz](#sicherheit--datenschutz)
7. [Troubleshooting](#troubleshooting)

---

## 🏪 WooCommerce verbinden

### Wie verbinde ich meinen WooCommerce Shop?

A.R.I. braucht Zugriff auf deinen WooCommerce Shop. Das geht über **sichere API-Keys**:

#### Schritt 1: WooCommerce-Schlüssel erstellen

1. Öffne deinen **WordPress Admin** (`https://dein-shop.de/wp-admin`)
2. Gehe zu **WooCommerce** → **Einstellungen**
3. Klick auf Tab **"Erweitert"** → **"REST API"**
4. Klick auf **"Schlüssel hinzufügen"**
5. Gib einen Namen ein (z.B. "A.R.I. Integration")

#### Schritt 2: Berechtigungen setzen

| Berechtigung | Notwendig? | Grund |
|--------------|-----------|-------|
| **Lesen (Read)** | ✅ JA | Um Daten abzurufen (Produkte, Bestellungen, Kunden) |
| **Schreiben (Write)** | ✅ JA | Um Änderungen zu speichern (Beschreibungen, Preise) |
| **Löschen (Delete)** | ❌ NEIN | A.R.I. löscht nichts |

**Wähle: "Lesen/Schreiben"** und speichere.

#### Schritt 3: Keys kopieren

Nach dem Speichern siehst du zwei Keys:
- **Consumer Key** (öffentlich)
- **Consumer Secret** (geheim!)

```
🔐 SICHERHEIT: Halte den Consumer Secret geheim!
Behandle ihn wie ein Passwort – teile ihn mit niemandem.
```

#### Schritt 4: Keys in A.R.I. eintragen

1. Öffne **A.R.I. Settings** (⚙️ Zahnrad)
2. Gehe zu Bereich **"WooCommerce"**
3. Trage ein:
   - **Shop-URL:** `https://dein-shop.de` (exakt wie deine Shop-Domain)
   - **Consumer Key:** (kopiert aus WooCommerce)
   - **Consumer Secret:** (kopiert aus WooCommerce)
4. Klick **"Verbindung testen"**
5. ✅ Erfolg? Dann bist du verbunden!

---

### Häufige Probleme bei WooCommerce-Verbindung

#### ❌ "REST API nicht erreichbar"

**Ursache:** REST API ist deaktiviert

**Lösung:**
1. WordPress Admin → **WooCommerce** → **Einstellungen**
2. Tab **"Erweitert"** → **"REST API"**
3. Prüfe: Ist "REST API aktiviert"? → **JA** ankreuzen
4. Speichern

#### ❌ "401 Unauthorized"

**Ursache:** Consumer Key oder Secret ist falsch

**Lösung:**
1. Lösche die Keys und erstelle sie **neu**
2. Kopiere sie **exakt** (ohne Leerzeichen)
3. Teste erneut

#### ❌ "403 Forbidden"

**Ursache:** Keys haben nicht die richtigen Berechtigungen

**Lösung:**
1. WordPress Admin → Keys editieren
2. Berechtigungen auf **"Lesen/Schreiben"** setzen
3. Speichern und Keys neu kopieren

---

## 🤖 OpenAI konfigurieren

### Warum brauche ich einen OpenAI Account?

A.R.I. nutzt OpenAI für alle KI-Features:
- 📝 Text-Generierung (Produktbeschreibungen, E-Mails)
- 🎨 Bild-Generierung (DALL-E)
- 📊 Daten-Analyse (Trends, Sentiment)

**Kosten:** Du zahlst **nur** für das, was du nutzt (~0,002$ pro Text).

### OpenAI Account einrichten

#### Schritt 1: Konto erstellen

1. Gehe zu [platform.openai.com](https://platform.openai.com)
2. Klick **"Sign Up"**
3. Registriere dich mit E-Mail oder Google/Microsoft-Account
4. Verifiziere deine E-Mail

#### Schritt 2: Guthaben hinzufügen

1. Gehe zu **"Billing"** (linkes Menü)
2. Klick **"Set up paid account"**
3. Gib deine Zahlungsdaten ein (Kreditkarte)
4. Lege dein **monatliches Limit** fest (z.B. 10$)
   - So kannst du nicht versehentlich zu viel ausgeben!

#### Schritt 3: API-Key erstellen

1. Gehe zu **"API keys"** (linkes Menü)
2. Klick **"Create new secret key"**
3. **Kopiere** den Key (beginnt mit `sk-proj-`)
4. **Speichere ihn sicher** (danach sichtbar nicht mehr!)

#### Schritt 4: API-Key in A.R.I. eintragen

1. A.R.I. Settings → Bereich **"OpenAI"**
2. Paste den API-Key
3. **Wähle das Modell:** `gpt-4o-mini` (schnell & günstig)
4. Klick **"Verbindung testen"**
5. ✅ Fertig!

---

### OpenAI Kosten verstehen

**Preis-Beispiele:**

| Aktion | Kosten |
|--------|--------|
| 1 Produktbeschreibung | ~0,002$ |
| 1000 Produktbeschreibungen | ~2$ |
| 100 E-Mails | ~0,20$ |
| 50 Social Media Posts | ~0,10$ |
| 1 DALL-E Bild | ~0,01$ |

**Monatlich:** Für einen kleinen Shop meist **unter 5$**

### OpenAI Guthaben prüfen

1. Gehe zu [platform.openai.com](https://platform.openai.com)
2. Klick auf **"Billing"** → **"Usage"**
3. Dort siehst du:
   - Aktuelles Guthaben
   - Verbrauch der letzten Tage
   - Projektionen für den Monat

---

## 📦 Spezialisierungen hochladen

### Was sind Spezialisierungen?

**Spezialisierungen** machen die KI branchenspezifisch smarter:
- ✨ Bessere Texte für deine Branche
- 🎯 Richtige Keywords & Fokus
- 📈 Höhere Conversion

**Verfügbare Spezialisierungen:**
- ✈️ Reisebüro, 🏠 Immobilien, 🛠️ Technik
- 👗 Mode, 🍕 Gastronomie, 💼 B2B
- 🎨 Kreativbranche, 🏋️ Fitness, 📚 Bildung
- 🏥 Gesundheit & Apotheke

### Spezialisierung aktivieren

#### Schritt 1: Spezialisierungen-Datei kaufen

1. Besuche [A.R.I.-shop.com](https://A.R.I.-shop.com)
2. Wähle deine Branche
3. Lade die `.ari-spec` Datei herunter
4. Speichere sie auf deinem Computer

#### Schritt 2: Datei hochladen

1. A.R.I. Settings → Bereich **"Spezialisierungen"**
2. Klick **"Datei hochladen"** oder Drag & Drop
3. System validiert die Signatur (Sicherheit)
4. ✅ Datei akzeptiert?

#### Schritt 3: Aktivieren

1. In der Liste siehst du deine hochgeladenen Spezialisierungen
2. Klick auf deine Spezialisierung
3. Klick **"Aktivieren"**
4. ✅ Fertig! Die KI passt sich jetzt an deine Branche an

### Mehrere Spezialisierungen nutzen

**Ja, du kannst mehrere hochladen – aber nur EINE kann aktiv sein!**

**Beispiel:**
- Du betreibst einen Mode-Shop
- Du möchtest aber auch Reise-Produkte verkaufen
- **Lösung:**
  1. Beide Spezialisierungen hochladen (Fashion + Travel)
  2. Fashion aktivieren für normale Arbeit
  3. Wenn du Reise-Produkte machst → zu Travel wechseln
  4. Fertig?
  5. Zurück zu Fashion

**Wechsel ist jederzeit möglich!**

---

## 📊 Backend-Dashboard verstehen

### Wo ist das Backend-Dashboard?

Das Backend ist **NICHT** für die tägliche Nutzung. Es zeigt:
- 🔧 Konfiguration (WooCommerce, OpenAI, etc.)
- 📈 System-Metriken (Logs, Fehler)
- ⚙️ Spezialisierungen
- 🔐 Sicherheit & Zugriffe

**Wichtig:** Die **52 Tools** nutzt du im **Frontend-Dashboard** (Bedienungsanleitung).

### Settings-Bereiche erklärt

| Bereich | Zeigt | Editierbar? |
|---------|-------|------------|
| **WooCommerce** | Shop-Verbindung | ✅ JA |
| **OpenAI** | KI-Konfiguration | ✅ JA |
| **Spezialisierungen** | Branchenoptionen | ✅ JA |
| **Sicherheit** | Zugriffe & Logs | ❌ NEIN (Info only) |
| **System** | Version, Status | ❌ NEIN (Info only) |
| **Benutzer** | Dein Account | ✅ Teilweise |

---

## � Agentic Loops verstehen

### Was sind Agentic Loops?

**Agentic Loops** sind automatische Prozesse, die deine Shop-Daten analysieren und Verbesserungen vorschlagen:

- **🚨 Anomaly Detection** → Findet verdächtige Zahlungen
- **📈 Product Performance** → Analysiert beste/schlechteste Produkte
- **💳 Payment Recovery** → Rettet fehlgeschlagene Bestellungen
- **📊 Analytics Insights** → Generiert automatische Reports

### Wie funktionieren die Loops?

**Die Loops sind "Batch-Prozesse"** – sie laufen nicht kontinuierlich, sondern führen eine **diskrete Analyse-Session** durch:

```
1. SENSE    → Daten sammeln (Bestellungen, Zahlungen, Produkte)
2. THINK    → Analysieren und Entscheidungen treffen
3. ACT      → Empfehlungen/Aktionen generieren
4. LEARN    → Ergebnisse speichern und lernen
5. STOP     → Loop ist fertig
```

**Jede Iteration dauert ca. 1 Sekunde.** Mit **5 Iterationen pro Durchlauf** = **~5 Sekunden Laufzeit**.

### "Die Loop stoppt nach ein paar Sekunden" – ist das normal?

**JA! Das ist völlig normal!** ✅

Das ist kein Fehler, sondern **designed so**:

| Was | Warum |
|-----|-------|
| **5 Iterationen pro Durchlauf** | Effiziente Datenverarbeitung (nicht die ganze Zeit laufen) |
| **~5 Sekunden Laufzeit** | Genug Zeit für gründliche Analyse |
| **Dann stoppen** | Loop hat ihre Arbeit erledigt |
| **Nächster Durchlauf via Cron** | Automatisch zu geplanter Zeit |

**Vergleich:** Es ist wie eine "Wartungsaufgabe" die regelmäßig läuft, nicht wie ein Server der 24/7 läuft.

### Wann laufen die Loops automatisch?

Die Loops sind **zeitgesteuert via Cron**:

| Loop | Zeitplan |
|------|----------|
| **Anomaly Detection** | Täglich 09:00 Uhr |
| **Product Performance** | Montag & Donnerstag 10:00 Uhr |
| **Payment Recovery** | Alle 30 Minuten |
| **Analytics Insights** | Täglich 20:00 Uhr |

### Kann ich eine Loop manuell starten?

**JA!** Im **Loop-Monitoring Dashboard**:

1. Gehe zu **Agent → Loop Monitoring**
2. Klick auf **"Start Scheduler"**
3. Der Scheduler startet – alle 4 Loops werden einzeln ausgeführt
4. Jede Loop läuft ~5 Sekunden (5 Iterationen)
5. ✅ Fertig – die Ergebnisse werden gespeichert

### Was passiert mit den Ergebnissen?

**Die Loops speichern:**
- ✅ Gefundene Anomalien/Insights in der Datenbank
- ✅ Empfehlungen für dich
- ✅ Performance-Statistiken
- ✅ Execution History (letzte Läufe)

**Du siehst die Ergebnisse in:**
- 📊 **Analytics Dashboard** (Zusammenfassungen)
- 🚨 **Anomaly Alerts** (wenn Probleme gefunden werden)
- 📈 **Performance Reports** (beste/schlechteste Produkte)
- 📋 **Loop History** (detaillierter Log aller Durchläufe)

### Warum nicht kontinuierlich?

**Batch-Prozesse sind besser weil:**

| Grund | Vorteil |
|-------|---------|
| **Ressourcen sparen** | Nicht die ganze Zeit CPU/Memory nutzen |
| **Kostengünstiger** | Weniger OpenAI-API-Calls |
| **Saubere Analysen** | Jede Session ist eine komplette Analyse |
| **Einfacher zu debuggen** | Klare Anfang/Ende Punkte |
| **Skalierbar** | Funktioniert auch bei 1000en von Produkten |

### Ich bin unsicher – ist wirklich alles ok?

**Ja!** Um dich zu beruhigen, schau dir die **Loop History** an:

1. Gehe zu **Agent → Loop Monitoring**
2. Scrolle zu **"Recent Executions"** (am Ende)
3. Du siehst:
   - ✅ Status (success/failed)
   - ⏱️ Laufzeit (~5 Sekunden = normal)
   - 📈 Iterationen (5 = normal)
   - 💡 Insights generiert

Wenn du **✅ success** und **~5 Sekunden** siehst = **alles läuft perfekt!**

---

## �🔐 Sicherheit & Datenschutz

### Ist A.R.I. DSGVO-konform?

**Ja, 100%!**

✅ **Deine Daten bleiben privat:**
- Produktdaten: In deinem WooCommerce Shop
- Kundendaten: In deiner WordPress-Datenbank
- Konfiguration: Verschlüsselt gespeichert
- Logs: Nach 7 Tagen automatisch gelöscht

✅ **OpenAI:** Nutzt deine Daten **NICHT** zum Training der KI

✅ **Keine Tracking:** A.R.I. trackt deine Besucher nicht

### Wo werden meine API-Keys gespeichert?

**Extrem sicher:**

| Was | Wo | Sicher? |
|-----|----|--------|
| WooCommerce Keys | Backend (Festplatte) | ✅ Verschlüsselt |
| OpenAI API-Key | Backend (Festplatte) | ✅ Verschlüsselt |
| Im Frontend sichtbar? | ❌ NEIN | ✅ Ja, sicher |

### API-Keys regelmäßig rotieren

**Empfehlung:** Alle 3-6 Monate neue Keys erstellen

**Warum?**
- Falls Key irgendwie kompromittiert wurde
- Sicherheits-Best-Practice
- Dein Shop bleibt sicher

**So geht's:**
1. Neuen Key in WooCommerce/OpenAI erstellen
2. In A.R.I. Settings eintragen
3. Alt Key löschen (in WooCommerce/OpenAI)

---

## ❓ Troubleshooting

### WooCommerce-Verbindung schlägt fehl

**❌ "Connection refused"**
- Prüfe: Shop-URL erreichbar? (`https://dein-shop.de`)
- Prüfe: REST API aktiviert?

**❌ "401 Unauthorized"**
- Consumer Key/Secret falsch?
- Neu erstellen und kopieren

**❌ "404 Not Found"**
- Shop existiert nicht
- URL prüfen (z.B. nicht `https://www.dein-shop.de/shop`, sondern `https://dein-shop.de`)

---

### OpenAI-Verbindung schlägt fehl

**❌ "Invalid API key"**
- Key falsch kopiert?
- Neu von platform.openai.com kopieren

**❌ "Insufficient quota"**
- Guthaben aufgebraucht
- Aufladen auf [platform.openai.com](https://platform.openai.com) → Billing

**❌ "Rate limit exceeded"**
- Zu viele Requests gleichzeitig
- Warte 60 Sekunden, versuche erneut

---

### Spezialisierung wird nicht akzeptiert

**❌ "Invalid signature"**
- Nur originale Dateien funktionieren
- Lade die Datei neu herunter

**❌ "File too large"**
- Datei ist beschädigt
- Lade sie neu herunter

---

### Allgemeine Fehler

**❌ "Verbindung testen fehlgeschlagen"**

**Schritt-für-Schritt Debugging:**
1. Browser-Reload (F5)
2. Alle Felder noch mal prüfen (keine Typos)
3. Falls mehrere Felder: Eins nach dem anderen testen
4. Logs prüfen (Settings → System → Logs)
5. Support kontaktieren

---

## 📞 Support

**E-Mail:** andre.zabel71@gmail.com  
**Live-Chat:** Im Frontend (unten rechts)  
**Telefon:** +49 XXX XXXXXXX (Business Hours)

---

**Letzte Aktualisierung:** Januar 2026  
**Version:** 7.5.0  
**Für:** Alle A.R.I. Shop-Betreiber

---

## Grundlagen

### Was ist A.R.I.?

**A.R.I. (Artificial Retail Intelligence)** ist eine KI-gestützte E-Commerce-Automatisierungsplattform für WooCommerce-Shops. Sie bietet:

- ✅ **52 AI-Tools** für Analytics, Marketing, Content, Payment
- ✅ **Automatisierte Workflows** für Produkterstellung, E-Mail-Marketing, Reporting
- ✅ **ML-basierte Empfehlungen** für Preise, Trends, Optimierungen
- ✅ **Multi-Language Support** (Deutsch & Englisch)
- ✅ **100% DSGVO-konform**

### Für wen ist A.R.I. gedacht?

- **E-Commerce Shop-Betreiber** - WooCommerce/WordPress-basierte Shops
- **Marketing-Manager** - Content-Erstellung, Social Media, E-Mail-Kampagnen
- **Online-Unternehmer** - Automatisierung von Routineaufgaben
- **Digitale Produktanbieter** - Downloads, Kurse, Templates

### Was unterscheidet A.R.I. von anderen Tools?

| Feature | A.R.I. | Andere Tools |
|---------|--------|--------------|
| **KI-Integration** | 100% (52/52 Tools) | Teilweise |
| **WooCommerce Native** | ✅ Direkte Integration | ❌ Nur über Plugins |
| **Spezialisierungen** | ✅ Branchenspezifisch | ❌ Generic |
| **Pricing** | Einmalig + Spezialisierungen | Monatlich/Jährlich |
| **DSGVO** | ✅ 100% Compliant | ⚠️ Oft US-basiert |

---

## Erste Schritte

### Wie starte ich A.R.I.?

**Voraussetzungen:**
- WooCommerce Shop (WordPress)
- OpenAI API Key
- Browser (Chrome, Firefox, Safari, Edge)

**Start in 3 Schritten:**

1. **Login** - Öffne `https://deine-domain.com` und logge dich ein
2. **Settings** - Verbinde WooCommerce & OpenAI unter Settings → Connection
3. **Dashboard** - Nutze die 52 Tools im Dashboard

**Tipp:** Nutze die **Quick-Import-Funktion** für WooCommerce-Zugangsdaten!

### Wo finde ich meine WooCommerce API Keys?

1. WordPress Admin → WooCommerce → Einstellungen
2. Tab "Erweitert" → REST API
3. "Schlüssel hinzufügen" klicken
4. Berechtigungen: "Lesen/Schreiben"
5. Consumer Key & Secret kopieren

### Wie verbinde ich meinen OpenAI Account?

1. Gehe zu [platform.openai.com](https://platform.openai.com/api-keys)
2. Erstelle einen neuen API Key
3. Kopiere den Key (beginnt mit `sk-proj-...`)
4. Füge ihn in A.R.I. Settings → OpenAI ein

**Kosten:** ~0,002$ pro generiertem Text (ca. 500 Texte für 1$)

### Wo finde ich was?

**Navigation:**
- **Dashboard** - Übersicht aller 52 Tools
- **Analytics** - Reports, Trends, Conversion-Analysen
- **Marketing** - Content-Generator, E-Mail, Social Media
- **Products** - Produktverwaltung, Bundles, Freebies
- **ML** - Machine Learning Tools, Personalisierung
- **Advanced** - Jobs, Audits, Premium-Features
- **Payments** - Zahlungsanalyse, Recovery
- **Settings** - Konfiguration, Spezialisierungen, Theme

---

## Features & Funktionen

### Welche Tools sind verfügbar?

**Übersicht (52 Tools):**

| Kategorie | Tools | Highlights |
|-----------|-------|------------|
| **Analytics** | 9 | Shop Health, Trends, Real-Time, Conversion |
| **Product Management** | 8 | Analyzer, Auto-Creator, Bundles, Freebies |
| **Payment & Finances** | 13 | Recovery, Reconciliation, Analytics |
| **Marketing & Content** | 10 | E-Mail AI, Social Media, Audio Scripts |
| **Advanced AI** | 12 | ML Personalization, Forecasting, Audits |

**Vollständige Liste:** Siehe [TOOLS_DOCUMENTATION.md](TOOLS_DOCUMENTATION.md)

### Wie nutze ich die KI-Produktbeschreibung?

1. Gehe zu **Product Management** → **Woo Product Create**
2. Gib Produktname ein
3. Klicke 🤖 **"Generate AI Description"**
4. Warte 2-5 Sekunden
5. Beschreibung wird automatisch eingefügt
6. Passe bei Bedarf an und speichere

**Tipp:** Aktiviere "SEO Optimize" für bessere Google-Rankings!

### Wie erstelle ich einen Report?

1. Gehe zu **Analytics** → **Shop Health Report**
2. Wähle Zeitraum (7/30/90 Tage)
3. Klicke **"Generate Report"**
4. Warte ~10 Sekunden
5. Report wird angezeigt mit:
   - Umsatz-Übersicht
   - Top-Produkte
   - Problembereiche
   - AI-Empfehlungen

**Export:** Klicke "Download PDF" für Offline-Nutzung

### Wie funktioniert Auto Product Creator?

**Workflow:**
1. Tool analysiert Google Trends
2. Findet trending Keywords
3. Generiert Produktideen mit AI
4. Erstellt Entwürfe in WooCommerce
5. Du prüfst und veröffentlichst

**Wichtig:** Produkte werden als **Draft** gespeichert - du entscheidest über Veröffentlichung!

### Was sind Freebies und wie erstelle ich sie?

**Freebies** = Kostenlose Lead-Magnets (PDFs, Checklisten, Templates)

**Erstellung:**
1. **ML** → **ML Freebie Generator**
2. Wähle Typ (Checklist, Template, Guide)
3. Gib Thema ein (z.B. "DSGVO für Einsteiger")
4. AI generiert Content
5. Automatisch als WooCommerce-Produkt (0€)

**Nutzen:** E-Mail-Liste aufbauen, Leads generieren

### Wie plane ich Social Media Posts?

1. **Marketing** → **Social Media Composer**
2. Wähle Plattform (Facebook, Instagram, LinkedIn)
3. Gib Thema ein oder wähle Produkt
4. AI generiert Post-Text + Hashtags
5. Optional: Scheduling für später

**Pro-Tipp:** Nutze "Batch Generator" für 7 Posts auf einmal!

---

## Sprachen & Lokalisierung

### Wie ändere ich die Sprache?

**UI-Sprache ändern:**
1. Klicke auf **Flaggen-Symbol** (oben rechts)
2. Wähle 🇩🇪 Deutsch oder 🇬🇧 English

**Sprache wird gespeichert** und bei jedem Login wiederhergestellt.

### In welcher Sprache antwortet die KI?

**Die KI passt sich automatisch an:**
- UI auf Deutsch → KI antwortet auf Deutsch
- UI auf Englisch → KI antwortet auf Englisch

**Ausnahme:** "German Content Generator" generiert immer auf Deutsch (speziell für deutsche SEO)

### Sind alle Features auf beiden Sprachen verfügbar?

**Ja!** Alle 52 Tools sind vollständig übersetzt:
- Alle Buttons & Labels
- Alle Fehlermeldungen
- Alle Tooltips & Hilfe-Texte
- Alle generierten Inhalte

**Coverage:** 165+ Übersetzungsschlüssel, 100% Parität

---

## KI & Automatisierung

### Wie funktioniert die KI-Integration?

**A.R.I. nutzt OpenAI GPT-4o-mini** für:
- Text-Generierung (Beschreibungen, E-Mails, Posts)
- Sentiment-Analyse (Kundenfeedback)
- Trend-Erkennung (Google Trends + Reddit)
- Preisempfehlungen (Marktanalyse)
- SEO-Optimierung (Keywords, Meta)

**Datenfluss:**
1. Du gibst Input (z.B. Produktname)
2. A.R.I. sendet optimierten Prompt an OpenAI
3. GPT generiert Antwort
4. A.R.I. zeigt Ergebnis an

**Deine Daten:** Werden NICHT zum Training verwendet (OpenAI API Policy)

### Was sind Spezialisierungen?

**Spezialisierungen** = Branchenspezifische KI-Anpassungen

**Verfügbar:**
- ✈️ Reisebüro
- 🏠 Immobilienmakler
- 🛠️ Technikshop
- 👗 Mode & Bekleidung
- 🍕 Gastronomie
- 💼 B2B Großhandel
- 🎨 Kreativbranche
- 🏋️ Fitness & Sport
- 📚 Bildung
- 🏥 Gesundheit & Apotheke

**Aktivierung:**
1. Settings → Specialization
2. Lade `.ari-spec` Datei hoch 
3. Klicke "Activate"
4. KI passt sich automatisch an deine Branche an

**Nutzen:** Bessere Texte, branchenspezifische Keywords, höhere Conversion

### Kann ich mehrere Spezialisierungen nutzen?

**Ja, aber nur eine aktiv!**
- Du kannst beliebig viele hochladen
- Nur eine kann gleichzeitig aktiv sein
- Wechsel jederzeit möglich

**Beispiel:** Fashion-Shop mit saisonalen Reise-Produkten → Fashion aktivieren, bei Bedarf zu Travel wechseln

### Wie oft kann ich KI-Features nutzen?

**Unbegrenzt** - aber achte auf:

**OpenAI API Kosten:**
- ~0,002$ pro generiertem Text
- ~0,01$ pro Bild (DALL-E)
- Monatliches Limit in OpenAI-Account setzen empfohlen

**Rate Limits:**
- 100 Requests/Minute (Backend)
- Automatische Warteschlange bei Überlast

**Tipp:** Nutze Batch-Funktionen für mehrere Produkte auf einmal!

---

## Sicherheit & Datenschutz

### Ist A.R.I. DSGVO-konform?

**Ja, 100%!**

- ✅ Keine Benutzer-Tracking
- ✅ Keine PII-Daten in APIs
- ✅ Logs werden nach 7 Tagen gelöscht
- ✅ Alle Daten auf deinem Server (Self-Hosted)
- ✅ OpenAI APInutzt Daten NICHT zum Training

**Zertifizierung:** DSGVO-compliant, keine externe Datenspeicherung

### Wo werden meine Daten gespeichert?

**Lokal auf deinem Server:**
- WooCommerce-Daten → Deine WordPress-Datenbank
- A.R.I. Einstellungen → Environment Variables
- Spezialisierungen → Verschlüsselt im Dateisystem
- Logs → 7 Tage Retention, dann automatisch gelöscht

**Extern (verschlüsselt):**
- OpenAI API → Nur für Textgenerierung, keine Speicherung

### Sind meine API-Keys sicher?

**Ja!**

**Schutzmaßnahmen:**
- Keys werden nur im Backend gespeichert
- Niemals im Frontend sichtbar
- Verschlüsselte Übertragung (HTTPS)
- Keine Logs von Secrets

**Empfehlung:** Rotiere Keys regelmäßig (alle 3-6 Monate)

### Wer kann auf meine A.R.I. Installation zugreifen?

**Nur du** (oder von dir autorisierte User)

**Zugangskontrolle:**
- JWT-basierte Authentifizierung
- Passwort-geschützt
- Session-basiert (24h Gültigkeit)
- Kein öffentlicher Zugriff

**Standard-Login:**
- Username: `admin`
- Passwort: `admin123` (⚠️ BITTE ÄNDERN in Produktion!)

---

## Kosten & Lizenzierung

### Was kostet A.R.I.?

**Basis-System:**
- Einmalige Lizenz 
- Keine monatlichen Gebühren
- Unbegrenzte Nutzung

**Zusatzkosten:**
- OpenAI API: ~0,002$ pro Text (~500 Texte für 1$)
- Spezialisierungen: Je nach Branche (einmalig)
- Hosting: Eigener Server oder Cloud (variabel)

**Keine versteckten Kosten!**

### Brauche ich ein OpenAI-Abo?

**Nein!** Du brauchst nur einen **API-Account** (Pay-as-you-go):

1. Registriere dich auf [platform.openai.com](https://platform.openai.com)
2. Füge Guthaben hinzu (ab 5$)
3. Erstelle API Key
4. Nutze in A.R.I.

**Kosten-Beispiel:**
- 1.000 Produktbeschreibungen: ~2$
- 100 E-Mails: ~0,20$
- 50 Social Media Posts: ~0,10$

### Gibt es eine kostenlose Testversion?

**Ja!** Du kannst A.R.I. testen mit:

- ✅ Eigene WooCommerce-Instanz (kostenlos)
- ✅ OpenAI Free Trial (5$ Guthaben geschenkt)
- ✅ Alle Features verfügbar

**Einschränkungen:**
- OpenAI Free Trial läuft nach 3 Monaten ab
- Produktions-Setup erfordert Lizenz

### Wie viele Shops kann ich betreiben?

**1 Lizenz = 1 Shop-Installation**

Für mehrere Shops:
- Separate Lizenzen erforderlich
- Jede Installation eigenständig
- Keine Daten-Synchronisation

---

## Support & Hilfe

### Wo finde ich weitere Dokumentation?

**Schritt-für-Schritt:**

1. **Fehler reproduzieren** - Tritt er wiederholt auf?
2. **Browser-Konsole prüfen** (F12 → Console-Tab)
3. **Screenshots machen** von Fehlermeldung
4. **Support kontaktieren** mit:
   - Fehlerbeschreibung
   - Screenshots
   - Browser & Version
   - Welches Tool betroffen

**Tipp:** Die meisten Fehler lösen sich durch Browser-Reload (F5) oder Re-Login!

### Wie bekomme ich Updates?

**Automatisch!**

- Updates werden auf deinem Server installiert
- Keine manuelle Aktion nötig
- Neue Features sofort verfügbar
- Changelog im Dashboard

### Dashboard lädt nicht

✅ Browser-Cache leeren (Strg+F5)  
✅ Anderen Browser testen  
✅ Erneut einloggen  

### KI antwortet nicht / Timeout

✅ OpenAI API Key gültig?  
✅ OpenAI-Guthaben vorhanden?  
✅ Internet-Verbindung stabil?  

### WooCommerce-Verbindung fehlgeschlagen

✅ Consumer Key & Secret korrekt?  
✅ Shop-URL erreichbar?  
✅ WordPress REST API aktiviert?  

### Spezialisierung wird nicht geladen

✅ Datei korrekt hochgeladen?  
✅ Signatur gültig?  
✅ Browser-Reload (F5)  

### Sprache wechselt nicht

✅ Flaggen-Symbol geklickt?  
✅ Browser-Reload (F5)  
✅ Cookies erlaubt?  

---

**Letzte Aktualisierung:** Januar 6, 2026  
**Version:** 7.5.0  
**Erstellt für:** Endnutzer & Shop-Betreiber
