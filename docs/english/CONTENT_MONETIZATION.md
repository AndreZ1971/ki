# 💸 Content Monetization – Consolidated Guide & API

Version: 3.2.1  
Last updated: December 2025

---

## Overview

This document combines the user guide and technical API reference for the Content Monetization features:
- AI Price Recommendation
- AI Product Copy Generator
- Revenue Forecast Badges
- Creation of Digital Products (WooCommerce)

---

## Features

- AI Price Recommendation: Suggests prices based on type and strategy, including rationale and min/max range.
- AI Product Copy Generator: Produces headline, body, and CTA; uses OpenAI with fallback.
- Revenue Forecast: Shows weekly and monthly projections based on the last 7 days.
- Create Digital Product: Creates products in WooCommerce and returns metadata.

---

## Usage (Frontend Flow)

1. Open Marketing & Content → Content Monetized.
2. Enter content title, type, strategy, and base price.
3. Optional: Generate AI price recommendation and AI copy.
4. Create product and review in the dashboard.

Best practices:
- Use the price recommendation as a starting point; run A/B tests.
- Generate multiple copy variants and pick the best.
- Use forecasts for planning and prioritization.

---

## API Reference

### Price Recommendation

- Endpoint: GET /api/marketing/content/price-recommendation
- Params: contentType (string, required), strategy (string, required), basePrice (number, required)
- Example:
  curl "http://localhost:3000/api/marketing/content/price-recommendation?contentType=course&strategy=one-time&basePrice=49"
- Response:
  { success: true, data: { recommendedPrice, range: { min, max }, reasoning } }

Pricing logic (examples):
- course one-time → 3.0x
- template one-time → 1.2x
- digital subscription → 0.7x/month
- subscription freemium → 1.5x

### Generate Copy

- Endpoint: POST /api/marketing/content/generate-copy
- Body: { contentTitle: string (required), contentType?: string, monetizationStrategy?: string, pricing?: number }
- Response:
  { success: true, data: { headline, body, cta } }
- Fallback if OpenAI is unavailable: Standard texts with headline/body/cta.

### Revenue Forecast

- Endpoint: GET /api/marketing/content/revenue-forecast
- Response:
  { success: true, data: { avgDay, forecastWeek, forecastMonth, periodAnalyzed } }
- Calculation:
  avgDay = SUM(7 days) / 7; forecastWeek = avgDay × 7; forecastMonth = avgDay × 30

### Create Digital Product

- Endpoint: POST /api/marketing/content/create-digital-product
- Body: { contentTitle: string (required), contentType?: string, monetizationStrategy?: string, pricing: number (required) }
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
