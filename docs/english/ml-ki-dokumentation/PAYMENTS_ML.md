# 💳 Payment-ML/KI Dokumentation

> **Technische Dokumentation:** Was die KI/ML-Systeme beim Payment-Processing im Hintergrund tun

**Zielgruppe:** Entwickler, ML-Engineers, Architekten (nicht für End-User!)

---

## 📋 Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Payment Fraud Detection](#payment-fraud-detection)
3. [Smart Amount Suggestions](#smart-amount-suggestions)
4. [Payment Success Prediction](#payment-success-prediction)
5. [UX Quick Wins & Conversion Lift](#ux-quick-wins--conversion-lift)
6. [Payment Verification & Risk Assessment](#payment-verification--risk-assessment)
7. [Success Metrics & Analytics](#success-metrics--analytics)
8. [ML Events System](#ml-events-system)
9. [Performance & Metriken](#performance--metriken)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Überblick

Das Payment-ML-System besteht aus **5 Haupt-Komponenten**, die zusammen ein sicheres, optimiertes und datengestütztes Payment-Ökosystem bilden:

| Tool | Zweck | LLM-Model | Input | Output |
|------|-------|-----------|-------|--------|
| **Fraud Detection** | Betrugsrisiko erkennen | gpt-4o-mini | Transaktion | Risk-Score (0-100) |
| **Amount Suggestions** | Preise optimieren | gpt-4o-mini | Kategorie + Währung | 5 empfohlene Beträge |
| **Success Prediction** | Erfolgswahrscheinlichkeit | Regelbasiert | Transaktion | Probability (0-1) |
| **UX Check** | Checkout-Optimierung | gpt-4o-mini | Flow-Daten | Quick Wins + Lift |
| **Verification** | Transaktion validieren | gpt-4o-mini | Signatur + Daten | Valid/Risk-Level |

**Gemein samen Features:**
- ✅ OpenAI GPT-4o-mini als Primär-LLM
- ✅ Event-basierte Metrik-Erfassung (confidence, success)
- ✅ Async-Verarbeitung für Performance
- ✅ Fehlertoleranz mit Fallback-Logik

---

## 🔍 Payment Fraud Detection

### 📌 Zweck
Erkennt Betrugsmuster in Payment-Transaktionen durch Analyse von:
- Email-Domain-Reputation (Wegwerf-Domains)
- Betragshöhe (Anomalien)
- IP-Adresse Geographie
- Email-Struktur Verdächtigkeit

### 🧠 KI-Modell: GPT-4o-mini

```
Model: gpt-4o-mini
Temperature: 0.3 (niedrig = konsistent, deterministisch)
Max Tokens: default
System Role: "Payment-Security-Experte mit 15 Jahren Erfahrung"
```

### 📝 Prompt-Strategie

**System-Prompt:**
```
Du bist Payment-Security-Experte mit 15 Jahren Erfahrung in Fraud-Detection. 
Deine Analysen sind präzise und datenbasiert.
```

**Input-Format:**
```json
{
  "amount": 250.50,
  "currency": "EUR",
  "customerEmail": "user@gmail.com",
  "ipAddress": "192.168.1.1"
}
```

**Analyse-Kriterien:**

| Kriterium | Low Risk | Medium Risk | High Risk | Critical |
|-----------|----------|-------------|-----------|----------|
| **Wegwerf-Email** | — | — | +15 pts | +40 pts |
| **Betrag > €500** | — | — | +20 pts | — |
| **Betrag > €1000** | — | — | — | +40 pts |
| **Verdächtige Email-Struktur** | — | — | +15 pts | — |
| **Neue/Unbekannte Domain** | — | +10 pts | — | — |

**Scoring:**
- **0-25:** Low risk → ✅ Genehmigen
- **26-50:** Medium risk → ⚠️ Weitere Checks
- **51-75:** High risk → 🚫 Manuelle Prüfung
- **76-100:** Critical risk → ❌ Ablehnen

### 📤 Output-Format

```json
{
  "riskScore": 35,
  "riskLevel": "medium",
  "flags": [
    "Neue E-Mail Domain erkannt",
    "Betrag liegt über Durchschnitt"
  ],
  "recommendation": "Manuelle Prüfung erforderlich",
  "confidence": 0.87,
  "reasoning": "Domain ist jung (registriert vor 3 Monaten), aber Email-Struktur legitim",
  "analyzedAt": "2025-12-11T08:02:57.000Z"
}
```

### 🔄 Workflow

```
1. Frontend/API sendet Transaktion
   ↓
2. Backend extrahiert Features (domain, amount, ip)
   ↓
3. OpenAI bewertet mit Fraud-Prompt
   ↓
4. Risk-Score und Flags berechnen
   ↓
5. ML-Event aufzeichnen (confidence)
   ↓
6. Response mit Recommendation zurück
```

### ⚙️ Konfiguration

**Endpoint:**
```
POST /api/payments/ml/fraud-check
Content-Type: application/json

{
  "amount": 100,
  "currency": "EUR",
  "customerEmail": "user@example.com",
  "ipAddress": "optional"
}
```

**Timeout:** 10s (falls OpenAI nicht antwortet, Fallback)

### 📈 Performance Metriken

**Gemessene Events:**
- `payments.fraud-check` → success: boolean, confidence: 0-1

**Typische Konfidenz:**
- Klartext-Betrüge: 0.95
- Grenzfälle: 0.60
- Neue User: 0.75

### 💾 Backend-Code-Location
- **Route:** `backend/routes/app/api/payments.ts` (Zeile ~55-170)
- **Service:** Direkt in Route (keine separate Service)
- **ML-Event:** `recordMlEvent('payments.fraud-check', success, confidence)`

---

## 💰 Smart Amount Suggestions

### 📌 Zweck
Empfiehlt psychologisch optimale Preise für maximale Conversion-Rate basierend auf:
- Produktkategorie
- Währung
- Psychologischer Preisgestaltung (Charm Pricing, Prestige Pricing)

### 🧠 KI-Modell: GPT-4o-mini

```
Model: gpt-4o-mini
Temperature: 0.7 (höher = kreativ bei Preisen)
System Role: "Pricing-Strategie-Experte mit Fokus auf psychologische Preisgestaltung"
```

### 📝 Prompt-Strategie

**Psychologische Prinzipien im Prompt:**

```
- Charm Pricing: 9,99 statt 10,00 (wirkt billiger)
- Prestige Pricing: Runde Zahlen für Premium (500€, 1000€)
- Anchoring: Mittlerer Preis als Referenz
- Sweet Spots: 49, 99, 149, 199, 299€
```

**Input-Format:**
```
GET /api/payments/ml/suggest-amounts?currency=EUR&category=digital-products
```

### 📤 Output-Format

```json
[
  {
    "amount": 49.99,
    "reason": "Einstiegspreis mit hoher Conversion (87%)",
    "conversionScore": 0.87,
    "targetAudience": "Preisbewusste Käufer",
    "psychologicalEffect": "Charm Pricing - unter 50€ Schwelle"
  },
  {
    "amount": 99.99,
    "reason": "Sweet Spot für Standard-Nutzer",
    "conversionScore": 0.72,
    "targetAudience": "Durchschnittliche Conversion",
    "psychologicalEffect": "Prestige Pricing - drei Neunen"
  }
]
```

### ⚙️ Konfiguration

**Supported Categories:**
```
- digital-products
- physical-goods
- services
- subscriptions
- bundles
- freebies
```

**Supported Currencies:**
```
- EUR, USD, GBP, CHF, SEK, NOK, DKK
```

### 📊 Conversion Score Interpretation

| Score | Bedeutung | Empfehlung |
|-------|-----------|------------|
| 0.85+ | Sehr hoch | ⭐⭐⭐⭐⭐ Primary Price |
| 0.70-0.85 | Hoch | ⭐⭐⭐⭐ Good Alternative |
| 0.50-0.70 | Mittel | ⭐⭐⭐ Possible Option |
| < 0.50 | Niedrig | ⚠️ Nur für Nischen |

### 💾 Backend-Code-Location
- **Route:** `backend/routes/app/api/payments.ts` (Zeile ~171-230)
- **ML-Event:** `recordMlEvent('payments.suggest-amounts', success, avgConfidence)`

---

## 🎲 Payment Success Prediction

### 📌 Zweck
Vorhersage, ob eine Payment-Transaktion erfolgreich sein wird basierend auf:
- Betragshöhe
- Email-Domain-Qualität
- Währung
- Historische Success-Rates

**Hinweis:** Derzeit **regelbasiert** (nicht LLM), kann später in echtes ML upgegraded werden

### 🧠 Modell: Heuristische Regelmaschine

```
Baseline Success-Probability: 85%

Dann anpassen nach:
+ Niedriger Betrag (<€10): +10%
- Hoher Betrag (>€500): -15%
+ Bekannte Email-Domain: +5%
+ EUR Währung: +3%
```

### 📤 Output-Format

```json
{
  "successProbability": 0.856,
  "factors": [
    "Niedriger Betrag erhöht Erfolgswahrscheinlichkeit",
    "Bekannte Email-Domain",
    "EUR hat höchste Erfolgsrate"
  ],
  "recommendation": "Payment durchführen - hohe Erfolgswahrscheinlichkeit"
}
```

### 🔄 Upgrade-Pfad

**Phase 1 (aktuell):** Regelbasiert  
**Phase 2:** Logistische Regression mit Transaktions-Features  
**Phase 3:** Gradient Boosting (XGBoost) mit historischen Daten  
**Phase 4:** Deep Learning mit zeitlichen Patterns  

### 💾 Backend-Code-Location
- **Route:** `backend/routes/app/api/payments.ts` (Zeile ~231-285)

---

## 🎨 UX Quick Wins & Conversion Lift

### 📌 Zweck
Analysiert den Checkout-Flow und schlägt kleine, sofort umsetzbare Verbesserungen vor, die die Conversion-Rate erhöhen können:
- Feldreduktion
- Trust-Signals
- Payment-Method-Reihenfolge
- Mobile-Optimierung

### 🧠 KI-Modell: GPT-4o-mini

```
Model: gpt-4o-mini
Temperature: 0.4 (moderat = Balance zwischen Kreativität und Konsistenz)
System Role: "Conversion-Rate-Optimization (CRO) Experte für Checkouts"
```

### 📝 Input-Format

```json
{
  "productName": "Advanced Analytics Suite",
  "amount": 299.99,
  "currency": "EUR",
  "flowType": "multi-step"
}
```

### 📤 Output-Format

```json
{
  "expectedLift": 0.12,
  "quickWins": [
    "Auto-Fill für Adresse aktivieren → +4% Conversion",
    "Trust-Badge auf Zahlungsmethode → +3% Conversion",
    "Gast-Checkout ermöglichen → +5% Conversion"
  ],
  "issues": [
    "Zu viele optionale Felder ablenken",
    "Security-Seals nicht sichtbar",
    "Keine Geld-zurück-Garantie erwähnt"
  ],
  "recommendedFlow": "One-Page mit Gast-Checkout und Auto-Fill"
}
```

**expectedLift (0.0 - 1.0):**
- 0.03 = 3% Conversion-Steigerung
- 0.12 = 12% Conversion-Steigerung (realistisch)
- 0.25+ = Sehr optimierungsbedürftig

### 💾 Backend-Code-Location
- **Route:** `backend/routes/app/api/payments.ts` (Zeile ~286-340)
- **ML-Event:** `recordMlEvent('payments.ux-check', success, expectedLift)`

---

## ✅ Payment Verification & Risk Assessment

### 📌 Zweck
Validiert eine **vollständige** Payment-Transaktion und führt finale Risikoanalyse durch:
- Signatur-Validierung
- Daten-Integrität
- Duplikats-Check
- Final Risk-Score

### 🧠 KI-Modell: GPT-4o-mini

```
Model: gpt-4o-mini
Temperature: 0.28 (sehr niedrig = höchste Sicherheit)
System Role: "Payment-Verification-Experte für PCI-DSS Compliance"
```

### 📝 Input-Format

```json
{
  "transactionId": "tx_12345abc",
  "amount": 150.00,
  "currency": "EUR",
  "customerEmail": "user@example.com",
  "ipAddress": "203.0.113.45",
  "paymentMethod": "card",
  "signature": "sig_abc123...",
  "payload": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "environment": "prod"
}
```

### 📤 Output-Format

```json
{
  "valid": true,
  "riskScore": 22,
  "riskLevel": "low",
  "flags": [
    "Signatur validiert",
    "Email-Domain bekannt",
    "Betrag im Normalbereich"
  ],
  "recommendedAction": "approve",
  "reasoning": "Alle Checks erfolgreich, Daten konsistent",
  "checks": [
    {
      "name": "Signature",
      "status": "pass",
      "detail": "HMAC-SHA256 validiert"
    },
    {
      "name": "Email",
      "status": "pass",
      "detail": "Domain: gmail.com (bekannt)"
    },
    {
      "name": "Amount",
      "status": "pass",
      "detail": "EUR 150.00 im normalen Bereich"
    },
    {
      "name": "Rate Limit",
      "status": "pass",
      "detail": "Letzter Payment: vor 4 Tagen"
    },
    {
      "name": "Duplicate",
      "status": "pass",
      "detail": "Keine doppelten Transaktionen gefunden"
    }
  ]
}
```

### ⚙️ Verifizierungschecks

| Check | Methode | Bestanden = | Fehlgeschlagen = |
|-------|---------|-------------|-----------------|
| **Signature** | HMAC-SHA256 Vergleich | ✅ | 🚫 Reject |
| **Email Format** | RFC 5322 Regex | ✅ | ⚠️ Warn |
| **Amount Range** | 0.01 - 100,000€ | ✅ | 🚫 Reject |
| **Duplicate** | Letzte 24h Transaktionen | ✅ | ⚠️ Manual-Review |
| **Rate Limit** | Max 10/Minute pro IP | ✅ | 🚫 Reject |
| **GeoIP Consistency** | Email-Domain vs IP | ✅ | ⚠️ Flag |

### 💾 Backend-Code-Location
- **Route:** `backend/routes/app/api/payments.ts` (Zeile ~341-450)
- **ML-Event:** `recordMlEvent('payments.verify', success, confidence)`

---

## 📊 Success Metrics & Analytics

### 📌 Zweck
Aggregiert alle Payment-ML Events in einem **Zeitraum** und berechnet:
- Gesamtanzahl Transaktionen
- Verifizierungsrate (% erfolgreich)
- Durchschnittliche KI-Konfidenz
- Events nach Feature (welches Tool wurde häufig genutzt?)
- Zeitraum-Statistiken

### 📤 Output-Format

```json
{
  "success": true,
  "data": {
    "total": 42,
    "valid": 38,
    "successRate": 0.90,
    "avgConfidence": 0.84,
    "byFeature": {
      "payments.fraud-check": 15,
      "payments.verify": 18,
      "payments.suggest-amounts": 9
    },
    "lastEvent": "2025-12-11T08:15:22.000Z"
  }
}
```

### ⚙️ Konfiguration

**Endpoint:**
```
POST /api/payments/ml/success-metrics
Content-Type: application/json

{
  "timeRange": "today" | "week" | "month" | "year"
}
```

**Zeitraum-Definition:**

| timeRange | Start-Zeitpunkt | Use-Case |
|-----------|-----------------|----------|
| **today** | Heute 00:00 UTC | Daily Dashboard |
| **week** | Montag 00:00 UTC | Weekly Reports |
| **month** | 1. des Monats 00:00 UTC | Monthly Reviews |
| **year** | 1. Januar 00:00 UTC | Yearly Analytics |

### 🔄 Workflow

```
1. Frontend ruft /api/payments/ml/success-metrics auf
   ↓
2. Backend holt alle ML-Events aus Speicher
   ↓
3. Filtert nach payments.* Feature und Zeitraum
   ↓
4. Aggregiert:
   - total = Alle Events
   - valid = Successful Events
   - successRate = valid / total
   - avgConfidence = Durchschnitt aller Confidences
   - byFeature = Gruppierung nach Feature-Name
   ↓
5. Rückgabe an Frontend
```

### 💾 Backend-Code-Location
- **Route:** `backend/routes/app/api/payments.ts` (Zeile ~719-775)
- **Service:** `backend/services/mlStats.ts` (getMlEvents)

---

## 🔬 ML Events System

### 📌 Zweck
Zentrales Eventing-System zum Aufzeichnen aller ML-Operationen für:
- Metrik-Aggregation
- Debugging
- Performance-Monitoring
- Audit-Trails

### 📝 Event-Struktur

```typescript
interface MlEvent {
  id: string;              // Unique ID
  feature: string;         // z.B. "payments.fraud-check"
  success: boolean;        // Operation erfolgreich?
  confidence: number;      // 0.0 - 1.0
  timestamp: number;       // ms seit Epoch
  metadata?: {             // Optional extra Daten
    riskScore?: number;
    flags?: string[];
    model?: string;
  }
}
```

### 🔄 Recording

**In jeder ML-Route aufrufen:**

```typescript
import { recordMlEvent } from '../../../services/mlStats.js';

// Bei erfolgreicher Analyse
recordMlEvent('payments.fraud-check', true, 0.87);

// Bei Fehler
recordMlEvent('payments.fraud-check', false, 0);
```

### 📤 Abrufen

```typescript
import { getMlEvents } from '../../../services/mlStats.js';

const allEvents = getMlEvents();
const last24h = allEvents.filter(e => 
  e.timestamp >= (Date.now() - 24 * 60 * 60 * 1000)
);
```

### 💾 Speicherung

**Aktuell:** In-Memory (verloren bei Server-Restart)  
**Langfristig:** Sollte in DB migriert werden (PostgreSQL, MongoDB)

### 💾 Backend-Code-Location
- **Service:** `backend/services/mlStats.ts`
- **Usage:** Alle `/api/payments/ml/*` Routes

---

## 📈 Performance & Metriken

### 🎯 KPIs (Key Performance Indicators)

| KPI | Ziel | Aktuell | Status |
|-----|------|---------|--------|
| **Fraud Detection Accuracy** | >95% | ⏳ TBD | Messung läuft |
| **False Positive Rate** | <5% | ⏳ TBD | Messung läuft |
| **Average Response Time** | <500ms | 50-150ms | ✅ Gut |
| **Amount Suggestion Conversion Lift** | >10% | ⏳ Validierung nötig | A/B Test geplant |
| **Success Prediction Accuracy** | >85% | ⏳ TBD | Nach Upgrade zu ML |
| **UX Check Actionability** | >80% hilfreich | ⏳ User-Feedback | Geplant |

### 🔍 Debug Metriken

**Pro Feature abrufen:**
```typescript
const stats = getMlStats();
// {
//   total: 150,
//   successful: 147,
//   successRate: 0.98,
//   avgConfidence: 0.86,
//   byFeature: {
//     "payments.fraud-check": { count: 50, avgConfidence: 0.88 },
//     "payments.verify": { count: 65, avgConfidence: 0.84 },
//     ...
//   }
// }
```

### 📊 Monitoring

**Events-pro-Minute Tracking:**
```typescript
const now = Date.now();
const lastMinute = getMlEvents().filter(e => 
  e.timestamp >= (now - 60 * 1000)
);
console.log(`ML Events/min: ${lastMinute.length}`);
```

### ⚡ Performance-Optimierungen

| Problem | Lösung | Status |
|---------|--------|--------|
| In-Memory Events wachsen unbegrenzt | Rollover nach 10k Events | 📋 Geplant |
| OpenAI API-Latenz | Caching + Fallbacks | ✅ Implementiert |
| Synchrone Verarbeitung | Async/Await überall | ✅ Implementiert |
| Keine Persistence | DB-Migration | 📋 Geplant |

---

## 🆘 Troubleshooting

### ❌ Problem: 404 auf `/api/payments/ml/success-metrics`

**Ursachen:**
1. Backend nicht gestartet
2. Port 3000 belegt
3. Route nicht registriert
4. Frontend-Proxy nicht konfiguriert

**Lösung:**
```bash
# 1. Check ob Backend läuft
curl http://localhost:3000/health

# 2. Port 3000 freigeben
Get-Process | Where {$_.Port -eq 3000} | Stop-Process -Force

# 3. Backend neu starten
cd backend && npm run dev

# 4. Check Proxy in vite.config.ts
# Sollte sein: '/api': { target: 'http://localhost:3000' }
```

### ❌ Problem: OpenAI API Error

**Symptom:** `"error": "OpenAI API rate limit"`

**Lösung:**
```typescript
// Implementiert: Exponential Backoff + Fallbacks
// Aber: Prüfe API Key in connection.json
// Und: Rate Limits im OpenAI Dashboard
```

### ❌ Problem: Fraud-Check gibt immer "low risk" zurück

**Ursachen:**
1. OpenAI antwortet mit Default-Wert
2. Prompt zu permissiv
3. Temperature zu hoch

**Lösung:**
```typescript
// Prüfe Temperature: sollte 0.3 sein
// Prüfe System-Prompt: sollte "Security-Experte" sein
// Check Backend Logs: console.log für Score
```

### ✅ Debug-Logs aktivieren

**In `payments.ts`:**
```typescript
console.log('🔍 Fraud check:', { amount, customerEmail });
console.log(`✅ Risk-Score: ${riskScore}, Confidence: ${confidence}`);
```

**Logs ansehen:**
```bash
# Terminal wo Backend läuft
# Oder: tail -f logs/backend.log (wenn Logging setup existiert)
```

### 📊 Metriken überprüfen

```bash
# Alle ML-Stats abrufen
curl http://localhost:3000/api/ml/stats

# Payment-Success-Metrics für heute
curl -X POST http://localhost:3000/api/payments/ml/success-metrics \
  -H "Content-Type: application/json" \
  -d '{"timeRange":"today"}'
```

---

## 🔐 Security & Compliance

### 🔒 PCI-DSS Beachtung

- ✅ Keine CVV/Kartennummern in Logs
- ✅ Signatur-Validierung vor Verarbeitung
- ✅ Email-Daten anonymisiert möglich
- ❌ **TODO:** Daten-Verschlüsselung at-rest

### 🛡️ Rate Limiting

```typescript
// Empfohlen (noch nicht implementiert):
// - Max 100 requests/minute pro IP
// - Max 10 Transaktionen/minute pro Email
// - Exponential Backoff bei Verdacht
```

### 📝 Audit Trail

```typescript
// Alle Fraud-Checks sollten geloggt werden:
// {
//   timestamp: "2025-12-11T08:02:57Z",
//   feature: "payments.fraud-check",
//   email: "user@example.com",
//   riskScore: 35,
//   decision: "manual-review"
// }
```

---

## 🚀 Roadmap & Enhancements

### Phase 1 (✅ Aktiv)
- [x] Fraud Detection mit GPT-4o-mini
- [x] Amount Suggestions
- [x] Success Prediction (regelbasiert)
- [x] UX Quick Wins
- [x] Payment Verification
- [x] ML Events & Metrics

### Phase 2 (📋 Geplant)
- [ ] ML Events in Datenbank speichern
- [ ] A/B Testing für Amount Suggestions
- [ ] Echtzeit-Monitoring Dashboard
- [ ] Webhook-Integration (Z.B. Zapier bei High-Risk)

### Phase 3 (🔮 Zukunft)
- [ ] Custom LLM Fine-Tuning mit historischen Daten
- [ ] Fraud-Detection ML Model (nicht LLM)
- [ ] Geo-IP und Device-Fingerprinting
- [ ] Multi-Factor Verification für High-Risk

### Phase 4 (🌟 Vision)
- [ ] Real-time Pattern Detection
- [ ] Anomaly Detection mit Isolation Forest
- [ ] Predictive Churn Analysis
- [ ] Personalisierte Payment-Flows pro User

---

## 📚 Verwandte Dokumentation

- [ML Architecture Overview](./ML_ARCHITECTURE.md) - Überblick aller ML-Systeme
- [PaymentSuccess Bedienungsanleitung](../bedienungsanleitungen/PaymentSuccess.md) - Für End-User
- [Backend API Docs](../../docs/api/) - Alle Payment-Endpoints

---

## 📞 Kontakt & Support

**Questions?**
- 👨‍💻 Developer: Siehe `/backend/routes/app/api/payments.ts`
- 📊 Metriken: Siehe `/backend/services/mlStats.ts`
- 🧠 KI-Prompts: Inline Comments in payments.ts

**Last Updated:** 11. Dezember 2025  
**Version:** 1.0  
**Maintainer:** KI-ML Team
