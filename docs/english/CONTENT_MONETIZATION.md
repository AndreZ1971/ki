# 💸 Content Monetization – Konsolidierte Anleitung & API

Version: 3.2.1
Letzte Aktualisierung: Dezember 2025

---

## Übersicht

Dieses Dokument vereint die Bedienungsanleitung und die technische API-Referenz für die Content Monetization Features:
- KI-Preisvorschlag
- KI-Produkttext Generator
- Revenue Forecast Badges
- Erstellung digitaler Produkte (WooCommerce)

---

## Features

- KI-Preisvorschlag: Empfiehlt Preise basierend auf Typ und Strategie, inkl. Begründung und min/max Bereich.
- KI-Produkttext Generator: Erzeugt Headline, Body und CTA; nutzt OpenAI mit Fallback.
- Revenue Forecast: Zeigt Wochen- und Monatsprognose basierend auf letzten 7 Tagen.
- Digitales Produkt erstellen: Legt Produkte in WooCommerce an und liefert Meta-Daten zurück.

---

## Nutzung (Frontend Flow)

1. Marketing & Content → Content Monetized öffnen.
2. Content-Titel, Typ, Strategie und Basispreis eingeben.
3. Optional: KI-Preisvorschlag und KI-Text generieren.
4. Produkt erstellen und im Dashboard prüfen.

Best Practices:
- Preisvorschlag als Ausgangspunkt nutzen, A/B testen.
- Mehrere Textvarianten generieren, beste auswählen.
- Forecasts zur Planung und Priorisierung verwenden.

---

## API-Referenz

### Price Recommendation

- Endpoint: GET /api/marketing/content/price-recommendation
- Parameter: contentType (string, erforderlich), strategy (string, erforderlich), basePrice (number, erforderlich)
- Beispiel:
  curl "http://localhost:3000/api/marketing/content/price-recommendation?contentType=course&strategy=one-time&basePrice=49"
- Response:
  { success: true, data: { recommendedPrice, range: { min, max }, reasoning } }

Preislogik (Beispiele):
- course one-time → 3.0x
- template one-time → 1.2x
- digital subscription → 0.7x/month
- subscription freemium → 1.5x

### Generate Copy

- Endpoint: POST /api/marketing/content/generate-copy
- Body: { contentTitle: string (erforderlich), contentType?: string, monetizationStrategy?: string, pricing?: number }
- Response:
  { success: true, data: { headline, body, cta } }
- Fallback, falls OpenAI nicht verfügbar: Standardtexte mit headline/body/cta.

### Revenue Forecast

- Endpoint: GET /api/marketing/content/revenue-forecast
- Response:
  { success: true, data: { avgDay, forecastWeek, forecastMonth, periodAnalyzed } }
- Berechnung:
  avgDay = SUM(7 Tage) / 7; forecastWeek = avgDay × 7; forecastMonth = avgDay × 30

### Create Digital Product

- Endpoint: POST /api/marketing/content/create-digital-product
- Body: { contentTitle: string (erforderlich), contentType?: string, monetizationStrategy?: string, pricing: number (erforderlich) }
- Response (201):
  { success: true, message, data: { productId, productTitle, price, wooCommerceUrl, createdAt } }

---

## Authentifizierung

- Cookie-basierte Sessions
- Optional: API Key Header (X-API-Key)

Beispiel:
curl -H "X-API-Key: your-api-key" "http://localhost:3000/api/marketing/content/..."

---

## Fehlerbehandlung

Standardformate:
- 400: { success: false, error, code: "INVALID_PARAMETER" }
- 401: { success: false, error, code: "AUTH_REQUIRED" }
- 500: { success: false, error, code: "INTERNAL_ERROR" }

WooCommerce-spezifisch:
- 500: { success: false, error: "WooCommerce connection failed. Check settings." }

---

## Performance & Rate Limits

| Endpoint | Rate Limit | Cache |
| /price-recommendation | 100/min | 1 Stunde |
| /generate-copy | 50/min | none |
| /revenue-forecast | 100/min | 5 Minuten |
| /create-digital-product | 20/min | none |

---

## Konfiguration

Environment Variablen:
- OPENAI_API_KEY, OPENAI_MODEL (z.B. gpt-4o-mini)
- WOO_SHOP_URL, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET

connection.json Beispiel:
{
  "openai": { "apiKey": "sk-proj-...", "model": "gpt-4o-mini" },
  "woocommerce": { "url": "https://shop.example.de", "consumerKey": "ck_...", "consumerSecret": "cs_..." }
}

---

## Beispiele

Preisvorschlag:
curl "http://localhost:3000/api/marketing/content/price-recommendation?contentType=course&strategy=one-time&basePrice=50"

Text generieren:
curl -X POST "http://localhost:3000/api/marketing/content/generate-copy" -H "Content-Type: application/json" -d '{"contentTitle":"Mein Produkt"}'

Forecast:
curl "http://localhost:3000/api/marketing/content/revenue-forecast"

JavaScript:
// fetch('/api/marketing/content/price-recommendation?...') → JSON mit recommendedPrice
// fetch('/api/marketing/content/generate-copy', { method: 'POST', body: JSON.stringify({ contentTitle: 'Python Kurs' }) })

---

## Häufige Fragen

- Preisvorschlag funktioniert nicht → Base Price, Typ, Strategie prüfen.
- KI-Text generiert nicht → contentTitle setzen, OpenAI Verfügbarkeit prüfen, Fallback aktiv.
- Revenue zeigt 0 → Datenbasis/Verbindung prüfen, 7 Tage abwarten.
- Produkt wird nicht erstellt → Titel/Preis erforderlich, Woo-Verbindung und Logs prüfen.

---

## Roadmap

- Produkt-Bundles mit KI-Empfehlungen
- A/B-Tests für Preise & Texte
- Automatische Email-Kampagnen
- Multi-Language Support
- Customer Segmentation

---

Siehe auch:
- Bedienungsanleitung-KI-Agent.md
- README.md → API Endpoints
