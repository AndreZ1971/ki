# Swagger Test JSONs für Product Management

Diese Test-Dateien können in Swagger UI verwendet werden, um die API-Endpunkte zu testen.

## Verwendung:

1. **Backend starten**: `cd backend && npm run dev`
2. **Swagger öffnen**: http://localhost:3000/documentation
3. **Endpunkt auswählen** und "Try it out" klicken
4. **JSON kopieren** aus den entsprechenden Dateien unten
5. **Execute** drücken

## Test-Dateien:

### 1. Woo Product Create - Simple (1-woo-create-simple.json)
**Endpunkt**: `POST /api/products/woo/create`
```json
{
  "name": "Test Produkt Simple",
  "description": "Ein einfaches Test-Produkt erstellt via Swagger",
  "price": 29.99,
  "category": "15",
  "type": "simple",
  "stock": 10
}
```
**Erwartetes Ergebnis**: Neues Simple-Produkt in WooCommerce mit Lagerbestand

---

### 2. Woo Product Create - Virtual (2-woo-create-virtual.json)
**Endpunkt**: `POST /api/products/woo/create`
```json
{
  "name": "Test Produkt Virtual",
  "description": "Ein virtuelles Produkt (kein Versand) erstellt via Swagger",
  "price": 19.99,
  "category": "15",
  "type": "virtual"
}
```
**Erwartetes Ergebnis**: Virtuelles Produkt (virtual=true, kein Versand erforderlich)

---

### 3. Woo Product Create - Downloadable (3-woo-create-downloadable.json)
**Endpunkt**: `POST /api/products/woo/create`
```json
{
  "name": "Test Produkt Downloadable",
  "description": "Ein digitales Download-Produkt erstellt via Swagger",
  "price": 9.99,
  "category": "15",
  "type": "downloadable"
}
```
**Erwartetes Ergebnis**: Download-Produkt (downloadable=true)

---

### 4. Auto Product Creator (4-auto-create-products.json)
**Endpunkt**: `POST /api/products/auto-create`
```json
{
  "count": 3,
  "category": "15",
  "productType": "simple",
  "optimization": "high"
}
```
**Erwartetes Ergebnis**: 3 automatisch generierte Produkte mit AI-Optimierung

---

### 5. Create Bundle (5-create-bundle.json)
**Endpunkt**: `POST /api/bundles`
```json
{
  "name": "Test Bundle Paket",
  "products": ["15", "16", "17"],
  "price": 99.99,
  "discount": 20,
  "active": true,
  "description": "Ein Test Bundle mit 20% Rabatt"
}
```
**Erwartetes Ergebnis**: Neues Produkt-Bundle mit 20% Rabatt

---

### 6. Create Freebie (6-create-freebie.json)
**Endpunkt**: `POST /api/freebies`
```json
{
  "name": "Test Freebie - Kostenloses Ebook",
  "type": "ebook",
  "downloads": 0,
  "created": "2025-11-02",
  "description": "Ein kostenloses Test-Ebook",
  "fileUrl": "https://example.com/test-ebook.pdf"
}
```
**Erwartetes Ergebnis**: Kostenloses Produkt (Preis = 0) in WooCommerce

---

### 7. Create Category (7-create-category.json)
**Endpunkt**: `POST /api/categories`
```json
{
  "name": "Test Kategorie",
  "slug": "test-kategorie",
  "productCount": 0,
  "needsOptimization": false,
  "description": "Eine Test-Kategorie erstellt via Swagger"
}
```
**Erwartetes Ergebnis**: Neue Kategorie in WooCommerce

---

### 8. Auto-Create Freebie (8-auto-create-freebie.json) ✨ NEU
**Endpunkt**: `POST /api/freebies/auto-create`
```json
{
  "type": "ebook"
}
```
**Erwartetes Ergebnis**: AI-generiertes kostenloses E-Book mit automatischem Titel und Beschreibung

**Verfügbare Typen**:
- `ebook` - E-Book
- `checklist` - Checkliste
- `templates` - Vorlagen-Set
- `guide` - Schritt-für-Schritt Anleitung

---

## Hinweise:

- **Category ID ändern**: Ersetze `"category": "117"` mit einer echten Kategorie-ID aus deinem WooCommerce
- **Product IDs ändern**: Für Bundles verwende echte Produkt-Namen (werden als grouped product erstellt)
- **Fehlermeldungen prüfen**: Wenn ein Test fehlschlägt, prüfe die Response auf Details
- **OpenAI API Key**: Für Auto-Create Endpoints muss `OPENAI_API_KEY` in `.env` gesetzt sein

## API Features:

✅ **Woo Product Create**: Vollständige WooCommerce Integration mit Type Mapping
✅ **Auto Product Creator**: OpenAI-generierte Produktideen + WooCommerce Integration
✅ **Bundles**: Grouped Products mit Rabatt-Metadata
✅ **Freebies**: Kostenlose Produkte (Preis = 0) mit Download-Support
✅ **Auto-Create Freebie**: AI-generierte kostenlose Produkte
✅ **Categories**: Echte WooCommerce Kategorien

## Debugging:

1. **Backend Logs**: Terminal wo Backend läuft zeigt detaillierte Logs (📦, 🤖, ✅, ❌)
2. **Swagger Response**: "Response Body" zeigt genaue Fehlermeldung
3. **WooCommerce**: Admin Panel → Products/Categories prüfen ob erstellt wurde
4. **Console Logs**: Backend gibt JSON-Payloads aus die an WooCommerce gesendet werden
