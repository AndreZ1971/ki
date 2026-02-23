# 🤖 A.R.I. Chatbot Guide – Deutsch

**Version:** 7.5.0  
**Datum:** Januar 2026  
**Status:** Production Ready

---

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Architektur](#architektur)
3. [Verfügbare Intents & Funktionen](#verfügbare-intents--funktionen)
4. [Konfiguration](#konfiguration)
5. [Caching & Performance](#caching--performance)
6. [Troubleshooting](#troubleshooting)
7. [Entwickler-Guide](#entwickler-guide)
8. [Roadmap](#roadmap)

---

## Übersicht

Der A.R.I. Chatbot ist ein **intelligentes Assistenz-System**, das:

- **Live-Daten** aus deinem WooCommerce-Shop abruft (Produkte, Kategorien, Bestellungen, Kunden)
- **Natürlichsprachliche Abfragen** versteht und beantwortet
- **Fallback-Mechanismen** nutzt, wenn externe APIs nicht antworten
- **Caching** einsetzt für schnelle Antworten und Skalierbarkeit
- **Query-Verlauf** speichert für Kontext und Verbesserungen

### Use Cases

✅ **Kundenservice:** "Wie viele Produkte habt ihr?" → Live-Antwort  
✅ **Shop-Übersicht:** "Welche Kategorien gibt es?" → Real-time Daten  
✅ **Order-Tracking:** "Bestell-Status checken" → Integration mit Shop-Daten  
✅ **Allgemeine Fragen:** "Was ist euer Service?" → GPT-4o mit Kontext  

---

## Architektur

### Component Stack

```
Frontend (React)
    ↓
[chatbot-message.tsx]
    ↓ POST /api/app/chatbot-message
Backend (Fastify)
    ↓
[chatbot-message.ts] (Route)
    ↓
[chatbotFunctionCaller.ts] (Smart Intent Parser & Function Caller)
    ├→ WooCommerce API (Live-Daten)
    ├→ getShopStats (Fallback)
    └→ GPT-4o (Natural Language Processing)
    ↓
Response mit Live-Daten oder Fallback
    ↓
Frontend (Anzeige)
```

### Datenfluss

1. **User-Input** → Frontend sendet Nachricht
2. **Intent-Erkennung** → Regex-Patterns + NLP prüfen ob es Live-Daten sind
3. **Function Calling** → Wenn Live-Daten erkannt:
   - Abrufen aus WooCommerce API (5 Min Cache)
   - Falls Fehler: Fallback zu `getShopStats`
4. **Anreicherung** → System Prompt mit Live-Daten erweitern
5. **GPT-4o-Call** → Natural Language Response generieren
6. **Response** → An Frontend mit Quelle (live/cache/fallback)

---

## Verfügbare Intents & Funktionen

### 1. **Product Count** – Anzahl Produkte

**Erkennung:**
```
- "Wie viele Produkte habt ihr?"
- "Produktanzahl?"
- "Wieviele items im shop?"
- /produkte/i
```

**Live-Daten:**
```json
{
  "productCount": 42,
  "source": "woocommerce_api",
  "timestamp": "2026-01-10T19:00:00Z"
}
```

**Fallback:** `getShopStats().totalProducts`

---

### 2. **Category Count** – Anzahl Kategorien

**Erkennung:**
```
- "Wie viele Kategorien?"
- "Kategorien anzeigen"
- /kategorie/i
```

**Live-Daten:**
```json
{
  "categoryCount": 8,
  "categories": ["Elektronik", "Mode", ...],
  "source": "woocommerce_api"
}
```

---

### 3. **Total Orders** – Gesamtbestellungen

**Erkennung:**
```
- "Wie viele Bestellungen?"
- "Gesamtorders?"
- /bestellung/i
```

**Live-Daten:**
```json
{
  "totalOrders": 156,
  "todayOrders": 3,
  "source": "woocommerce_api"
}
```

---

### 4. **Total Customers** – Registrierte Kunden

**Erkennung:**
```
- "Wie viele Kunden?"
- "Kundenanzahl?"
- /kunde/i
```

**Live-Daten:**
```json
{
  "totalCustomers": 3,
  "thisMonthCustomers": 1,
  "source": "woocommerce_api"
}
```

---

### 5. **Top Products** – Best-Seller

**Erkennung:**
```
- "Top-Produkte?"
- "Bestseller?"
- "Meistverkauft?"
```

**Live-Daten:**
```json
{
  "topProducts": [
    {"name": "Produkt A", "sales": 15},
    {"name": "Produkt B", "sales": 12}
  ],
  "source": "woocommerce_api"
}
```

---

### 6. **Low Stock** – Bestände unter Minimum

**Erkennung:**
```
- "Welche Produkte sind niedrig?"
- "Low stock?"
- "Nachbestellungen nötig?"
```

**Live-Daten:**
```json
{
  "lowStockProducts": [
    {"name": "Produkt X", "stock": 2}
  ],
  "threshold": 5
}
```

---

## Konfiguration

### Backend Settings (`backend/services/chatbotFunctionCaller.ts`)

```typescript
// Cache-Einstellungen
const CACHE_TTL = 5 * 60 * 1000; // 5 Minuten

// Intent-Patterns (Regex)
const PATTERNS = {
  productCount: /wie viele|anzahl.*produkt|produktanzahl/i,
  categoryCount: /wie viele.*kategor|kategor.*anzahl/i,
  // ... weitere Patterns
};

// Function Timeouts
const FUNCTION_TIMEOUT = 5000; // 5 Sekunden

// Query-Verlauf Limit
const MAX_QUERY_HISTORY = 10;
```

### Frontend Settings (`frontend/src/pages/AnalyseMetrics/Chatbot.tsx`)

```typescript
// Chatbot UI
const CHATBOT_CONFIG = {
  maxMessages: 50,
  autoScroll: true,
  placeholder: "Frag mich etwas über deinen Shop...",
  suggestionPrompts: [
    "Wie viele Produkte?",
    "Top-Seller?",
    "Kundenzahl?"
  ]
};
```

---

## Caching & Performance

### Cache-Strategien

| Quelle | TTL | Fallback |
|--------|-----|----------|
| WooCommerce API | 5 Min | `getShopStats()` |
| Product Count | 5 Min | Letzter Wert oder 0 |
| Categories | 5 Min | Letzter Wert oder [] |
| Orders | 5 Min | `getShopStats().totalOrders` |
| Customers | 5 Min | `getShopStats().totalCustomers` |

### Cache-Hits & Misses

```json
{
  "cacheKey": "woo_products_count",
  "hit": true,
  "timestamp": "2026-01-10T19:00:00Z",
  "ttl_remaining": "4m 32s"
}
```

### Performance-Ziele

- **Cache-Hit:** < 50ms Antwort
- **Cache-Miss mit Fallback:** < 1s
- **Full Live-Data:** < 5s (WooCommerce API Limit)

---

## Troubleshooting

### Problem: Chatbot antwortet "Unbekannter Fehler"

**Ursachen & Lösungen:**

| Symptom | Ursache | Lösung |
|---------|--------|--------|
| Alle Intents schlagen fehl | WooCommerce API offline | Verbindung zu `kaufe-es.eu/wp-json/wc/v3/` prüfen |
| Nur Customers = 0 | API-Rolle zu niedrig | Siehe [WooCommerce Sync Fix](#woocommerce-kundensync) |
| Cache wirkt sich nicht aus | TTL zu kurz | TTL in Config erhöhen (min. 60s) |
| Timeout bei großen Shops | Rate Limit WooCommerce | Per-Page auf 100 reduzieren |

### Problem: Fallback wird ständig genutzt

**Debug-Schritte:**

1. **Server-Logs prüfen:**
   ```bash
   tail -f /var/log/ari/backend.log | grep "chatbot\|fallback"
   ```

2. **Live-Daten-Test:**
   ```bash
   curl -X GET "https://kaufe-es.eu/wp-json/wc/v3/products?per_page=1" \
     -u "key:secret" -v
   ```

3. **Cache prüfen:**
   ```bash
   # In Backend-Console
   wooCache.list() // Zeigt aktive Cache-Keys
   ```

### Problem: Sehr langsame Antworten (> 5s)

**Optimierungen:**

1. **Per-Page reduzieren:**
   ```typescript
   // In chatbotFunctionCaller.ts
   const ITEMS_PER_PAGE = 50; // statt 100
   ```

2. **Cache-TTL erhöhen:**
   ```typescript
   const CACHE_TTL = 10 * 60 * 1000; // 10 Min statt 5
   ```

3. **Parallele Requests:**
   ```typescript
   // Bereits optimiert mit Promise.all()
   const [products, categories] = await Promise.all([...]);
   ```

---

## Entwickler-Guide

### Neue Intent hinzufügen

**Schritt 1: Pattern definieren**

```typescript
// In chatbotFunctionCaller.ts

const intentPatterns = {
  // Neue Intent für "Durchschnittlicher Bestellwert"
  avgOrderValue: {
    patterns: [
      /durchschnittlicher.*order|avg.*value|average.*order/i,
      /wie.*teuer.*durchschnitt|mittlere.*order/i
    ]
  }
};
```

**Schritt 2: Funktion implementieren**

```typescript
async function getAverageOrderValue(): Promise<number> {
  const cacheKey = 'woo_avg_order_value';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const orders = await wooAPI.getOrders({ per_page: 100 });
    const total = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const avg = total / orders.length;
    
    cache.set(cacheKey, avg, CACHE_TTL);
    return avg;
  } catch (error) {
    return fallback.getShopStats().averageOrderValue || 0;
  }
}
```

**Schritt 3: In Chatbot integrieren**

```typescript
// In chatbot-message.ts

if (matchesIntent(userMessage, 'avgOrderValue')) {
  const value = await functionCaller.getAverageOrderValue();
  systemPrompt += `\nDurchschnittlicher Bestellwert: €${value.toFixed(2)}`;
}
```

**Schritt 4: Testen**

```typescript
// Lokal testen
const result = await getAverageOrderValue();
console.log(`Avg Order: €${result}`); // Sollte realistisch sein
```

---

### Fallback-Logik erweitern

**Aktuell:**
```typescript
try {
  const live = await wooAPI.getProducts();
  return live;
} catch (error) {
  const fallback = await getShopStats();
  return fallback.products; // Cached/Persistente Daten
}
```

**Erweitert (Multi-Fallback):**
```typescript
try {
  return await wooAPI.getProducts(); // Live
} catch (error1) {
  try {
    return await getShopStats(); // Cache
  } catch (error2) {
    return loadFromFile('products.json'); // File-Backup
  }
}
```

---

### Query-Verlauf nutzen

Der Chatbot speichert die letzten 10 User-Queries für Kontext:

```typescript
// In chatbotFunctionCaller.ts
const queryHistory = [
  "Wie viele Produkte?",
  "Was sind Top-Seller?",
  "Lagerbestand checken?"
];

// GPT-4o erhält zusätzlichen Context:
systemPrompt += `\nBisherige Fragen: ${queryHistory.join(", ")}`;
```

Das ermöglicht **kontextuelle Antworten** statt isolierter Responses.

---

## Roadmap

### Phase 1: Kurz (Q1 2026)

- ✅ Live-Daten für Produkte, Kategorien, Bestellungen, Kunden
- ✅ Fallback-Mechanismen
- ✅ Caching (5 Min TTL)
- ✅ Query-Verlauf (10 Einträge)
- 🔄 **Diese Doku** ← Du bist hier

### Phase 2: Mittel (Q2 2026)

- 📋 **Feedback-Loop Light:** Thumbs Up/Down auf Antworten
  - Speichert in JSON-Logs (keine DB!)
  - Basis für Prompt-Optimierung
  
- 📊 **Erweiterte Intents:**
  - Umsatz heute (Daily Revenue)
  - Conversion-Trichter
  - Retourenquote
  
- 🧠 **Query-History Persistenz:**
  - Speichert in LocalStorage (Frontend) oder Redis
  - Kontextuelle Folgefragen möglich

### Phase 3: Langfristig (Q3+ 2026)

- 📚 **Wissensspeicher:** JSON/YAML FAQs (git-versioniert)
  - "Wie lange dauert Versand?" → Antwort aus KB
  - Admin-UI zum Bearbeiten

- 🔄 **Langzeitlernen:** 
  - Häufige Fragen → FAQ hinzufügen
  - Schlechte Antworten → Prompt-Tuning

- 📈 **Analytik:**
  - Intent-Hit-Rate Dashboard
  - Fallback-Quote tracken
  - User-Satisfaction Score

- 🤖 **Erweiterte NLP:**
  - Entitäts-Erkennung ("Produkt XYZ" → ID laden)
  - Sentiment-Analyse
  - Multi-Turn Conversations

---

## FAQ für Nutzer

**F: Ist der Chatbot lernendes System?**  
A: Aktuell nein – er nutzt nur Kurz-Memory (Query-Verlauf). Langzeitlernen ist für Q2 2026 geplant.

**F: Warum manchmal 0 Kunden?**  
A: Das war ein Bug (fehlender `role=all` Parameter). Seit Commit `5762eba` behoben.

**F: Kann ich den Cache leeren?**  
A: Ja, Backend-Restart leert ihn. Oder per API (zukünftig).

**F: Welche Daten werden gespeichert?**  
A: Query-Verlauf (Memory), Cache (RAM), kein persistenter Log (außer Logs für Debugging).

---

## Support & Kontakt

- **Bugs:** Öffne Issue auf GitHub
- **Fragen:** Siehe [DEVELOPER_FAQ.md](DEVELOPER_FAQ.md)
- **Feature-Requests:** Erstelle Discussion auf GitHub

---

**Viel Erfolg mit deinem intelligenten Shop-Assistenten!** 🚀
