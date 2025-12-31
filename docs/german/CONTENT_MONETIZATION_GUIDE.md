# 💸 Content Monetization – Veraltet (konsolidiert)

Diese Datei ist veraltet. Die konsolidierte und aktuelle Anleitung inkl. API befindet sich in:

- CONTENT_MONETIZATION.md

Version: 3.2.0 (deprecated)
Letzte Aktualisierung: Dezember 2025

—

Ursprünglicher Inhalt folgt unten zur Referenz.

---

## 📋 Übersicht

Die **Content Monetization Seite** ermöglicht es dir, digitale Produkte zu erstellen, zu verwalten und zu monetarisieren. Drei neue **KI-gestützte Features** helfen dir dabei:

1. **🤖 KI-Preisvorschlag** – Intelligente Preisempfehlungen basierend auf Produkttyp & Strategie
2. **⚡ KI-Produkttext Generator** – Automatische Generierung von Überschriften, Beschreibungen & CTAs
3. **📊 Revenue Forecast Badges** – Prognose von Wochengewinnen und monatlichen Umsätzen

---

## 🎯 Neue KI-Features (v3.2.0)

### 1️⃣ KI-Preisvorschlag

**Was macht es?**
- Analysiert Produkttyp, Monetarisierungsstrategie und Basispreis
- Berechnet automatisch eine intelligente Preisempfehlung
- Zeigt Preisbereich (min/max) und Begründung

**Wie nutze ich es?**

1. Gehe zu **Marketing & Content** → **Content Monetized**
2. Fülle die Felder aus:
   - **Content-Titel** (z.B. "Python Anfänger Kurs")
   - **Content-Typ** (Digital, Download, Kurs, Template, etc.)
   - **Monetarisierungsstrategie** (Einmalzahlung, Abo, Freemium, Preis-Stufen)
   - **Basispreis** (z.B. 49.99€)
3. Klicke auf **🤖 Preisvorschlag**
4. Das System zeigt:
   - 📌 Empfohlener Preis
   - 📊 Preisbereich (z.B. €45 - €65)
   - 💡 Begründung (z.B. "Online-Kurse in Premium-Segment")
5. Klicke **Übernehmen** um den Preis zu aktualisieren

**Preislogik:**
- **Online-Kurse**: +200% Aufschlag (€149-€299)
- **Templates/Themes**: +20% Aufschlag (€59-€79)
- **Abo-Modelle**: -30% Rabatt (€14-€24/Monat)
- **Freemium**: Basis + 50% (frühe Adopter Vorteil)

---

### 2️⃣ KI-Produkttext Generator

**Was macht es?**
- Generiert professionelle Marketing-Texte automatisch
- Erzeugt **Headline, Body-Text und Call-to-Action (CTA)**
- Nutzt OpenAI GPT-4o-mini für hochwertige Inhalte

**Wie nutze ich es?**

1. Gehe zu **Marketing & Content** → **Content Monetized**
2. Gib mindestens einen **Content-Titel** ein
3. (Optional) Wähle **Content-Typ** und **Strategie** für bessere Ergebnisse
4. Klicke **⚡ KI-Text generieren**
5. Das System generiert:
   ```
   📌 Headline:
   "Python für Anfänger: Der komplette Schritt-für-Schritt Kurs"
   
   📝 Body:
   "Lerne Python von Grund auf mit 50+ praktischen Übungen.
    Perfekt für Einsteiger – kein Vorwissen erforderlich.
    Zugang auf Lebenszeit + regelmäßige Updates."
   
   🎯 CTA:
   "Jetzt Kurs kaufen - Nur €49.99"
   ```
6. Kopiere den Text in deine Produktbeschreibung

**Verfügbare Parameter:**
- Content-Titel (erforderlich)
- Content-Typ (beeinflusst Ton & Fokus)
- Monetarisierungsstrategie (passt CTA an)
- Preis (berücksichtigt Preisposition)

**Fallback-Texte:**
Wenn OpenAI nicht verfügbar ist, verwendet das System Standard-Templates automatisch.

---

### 3️⃣ Revenue Forecast Badges

**Was macht es?**
- Zeigt Prognosen für Wochengewinne und Monatsumsätze
- Basiert auf durchschnittlichen Tagesumsätzen der letzten 7 Tage
- Aktualisiert sich automatisch

**Wo sehe ich die Badges?**
- Oben auf der **Content Monetized Seite**
- Grüner Badge: 📊 Forecast Woche
- Blauer Badge: 📊 Forecast Monat

**Berechnung:**
```
Durchschnitt (letzte 7 Tage) = Summe Tagesumsätze / 7
Wochenprognose = Durchschnitt × 7
Monatsprognose = Durchschnitt × 30
```

**Beispiel:**
- Durchschnittlicher Tagesumsatz: €15
- Wochenprognose: €15 × 7 = **€105**
- Monatsprognose: €15 × 30 = **€450**

---

## 📊 Revenue Dashboard

Das Dashboard zeigt deine aktuellen Umsatzdaten:

| Metrik | Bedeutung |
|--------|-----------|
| **Heute** | Umsatz des heutigen Tages |
| **Diese Woche** | Kumuliert seit Montag |
| **Dieser Monat** | Kumuliert seit Monatsanfang |
| **Gesamt** | Gesamtumsatz aller Zeiten |
| **Produkte** | Anzahl digitaler Produkte |

---

## 💾 Produkte Erstellen

**Schritt-für-Schritt:**

1. **Content-Details eingeben**
   - Titel (erforderlich)
   - Typ wählen (z.B. "Online-Kurs")
   - Strategie auswählen (z.B. "Einmalzahlung")
   - Preis setzen (erforderlich)

2. **Optional: KI-Features nutzen**
   - 🤖 Preisvorschlag erhalten
   - ⚡ Produkttext generieren

3. **Produkt Erstellen**
   - Klicke **💸 Content Monetarisieren**
   - Produkt wird in WooCommerce angelegt
   - Revenue-Daten werden automatisch aktualisiert

4. **Nach Erstellung**
   - Produkt ist sofort sichtbar im Dashboard
   - Wechsle zu WooCommerce für weitere Bearbeitung
   - Produkt-Link wird automatisch generiert

---

## 🔧 Technische Details

### API-Endpoints

#### Price Recommendation
```bash
GET /api/marketing/content/price-recommendation
  ?contentType=course
  &strategy=one-time
  &basePrice=49

Response:
{
  "success": true,
  "data": {
    "recommendedPrice": 149,
    "range": { "min": 129, "max": 199 },
    "reasoning": "Online-Kurse in Premium-Segment"
  }
}
```

#### Generate Copy
```bash
POST /api/marketing/content/generate-copy

{
  "contentTitle": "Python Kurs",
  "contentType": "course",
  "monetizationStrategy": "one-time",
  "pricing": 149
}

Response:
{
  "success": true,
  "data": {
    "headline": "Python für Anfänger...",
    "body": "Lerne Python von Grund auf...",
    "cta": "Jetzt kaufen"
  }
}
```

#### Revenue Forecast
```bash
GET /api/marketing/content/revenue-forecast

Response:
{
  "success": true,
  "data": {
    "avgDay": 15,
    "forecastWeek": 105,
    "forecastMonth": 450
  }
}
```

### Konfiguration

**Erforderliche Einstellungen in `connection.json`:**

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
  }
}
```

---

## 🆘 Häufige Fragen & Probleme

### ❓ Der Preisvorschlag funktioniert nicht
**Lösung:**
- Prüfe, ob **Base Price** eingegeben ist
- Fülle **Content-Typ** und **Strategie** aus
- System braucht diese Parameter für Berechnung

### ❓ KI-Text wird nicht generiert
**Lösung:**
- Gib mindestens einen **Content-Titel** ein
- Prüfe deine **OpenAI API-Verfügbarkeit**
- Der Fallback-Text wird automatisch verwendet

### ❓ Revenue-Daten zeigen 0€
**Lösung:**
- Warte 7 Tage, bis Daten gesammelt werden
- Prüfe WooCommerce-Verbindung in Settings
- Manuelle Umsätze können hinzugefügt werden

### ❓ Produkt wird nicht erstellt
**Lösung:**
- **Titel** und **Preis** sind erforderlich
- WooCommerce-Verbindung prüfen (Settings → Verbindung)
- Logs prüfen unter `/api/debug/logs`

---

## 📈 Best Practices

**Preisgestaltung:**
- Nutze den KI-Preisvorschlag als Orientierung
- Teste unterschiedliche Preise im A/B-Test
- Monitoriere Conversions bei Preisänderungen

**Produkttext:**
- Generiere mehrere Varianten und wähle beste aus
- Passe Ton & Fokus manuell nach Bedarf an
- Verwende gute Headline für höhere Click-Rates

**Revenue-Optimierung:**
- Nutze Forecasts für Budgetplanung
- Priorisiere Top-Performer Produkte
- Teste neue Monetarisierungsstrategien

---

## 🚀 Roadmap

**Geplant für nächste Versionen:**
- 📦 Produkt-Bundles mit KI-Empfehlungen
- 💳 A/B-Test Framework für Preise & Texte
- 📧 Automatische Email-Kampagnen für Produkte
- 🌐 Multi-Language Support für Produkttexte
- 🎯 Customer Segmentation für gezieltes Marketing

---

**Fragen?** Kontaktiere den Support oder nutze den KI-Chatbot Ari im Dashboard! 🤖
