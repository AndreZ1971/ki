# Kategorien KI-Features (Stand 2025-12-11)

## Überblick
- Ziel: KI-gestützte Kategorie-Vorschläge und Optimierung für WooCommerce-Kategorien.
- Frontend: `CategoriesManager.tsx` (ProductManagement), `MLCategorySuggester.tsx` (Inline-Suggester).
- Backend: Fastify-Route `backend/routes/app/api/products/categories.ts` mit OpenAI-Anbindung.
- API-Service: `categoryApi.suggestCategories` (Frontend) für konsistente Fehlerbehandlung.

## Endpoints
- `POST /api/categories/ml/suggest`
  - Eingabe: `{ title: string; description: string; maxSuggestions?: number }`
  - Ausgabe: `{ success: true, suggestions: { name: string; confidence: number; reason: string }[] }`
  - Modell: `gpt-4o-mini`, Temperatur 0.2, JSON-Antwort.
  - Kontext: bekannte WooCommerce-Kategorien (bis 100) werden mitgegeben; es dürfen keine neuen Kategorien erfunden werden.

- `POST /api/categories/optimize`
  - Aktuell Stub, kann für echte Optimierung (Beschreibung generieren, Dubletten erkennen) erweitert werden.

## Frontend-Flows
- **Pro Kategorie Vorschläge holen**
  - Button „🤖 Vorschläge“ in `CategoriesManager.tsx`
  - Ruft `categoryApi.suggestCategories` → zeigt Confidence + Reason inline.
  - „Übernehmen“ setzt aktuell UI-seitig den Namen und `needsOptimization=false` (Backend-Update optional ergänzbar).

- **Inline-Suggester Demo**
  - `MLCategorySuggester.tsx` nutzt denselben Endpoint über `categoryApi`.

## Datenstrukturen
- `CategorySuggestion` (frontend `types/product.ts`): `{ name: string; confidence: number; reason: string }`

## Erweiterungsideen (next)
1) Backend-Apply: PUT zu WooCommerce für Name/Beschreibung, inkl. Validierung.
2) Optimize-All echt implementieren: fehlende Beschreibungen generieren, Dubletten-Vorschläge.
3) Caching/Embeddings für Kostensenkung; Rate-Limiting pro User.
4) UI: Badge „KI aktualisiert“, History der Vorschläge, Undo.

## Sicherheit & Robustheit
- OpenAI-Key nur im Backend (`connection.json` via `config`).
- Antwortformat strikt JSON, Antwort wird defensiv geparst; Confidence auf [0,1] geklemmt.
- Fehler sind generisch; keine Secrets im Client.

## Dateien (Touchpoints)
- Backend: `backend/routes/app/api/products/categories.ts`
- Frontend: `frontend/src/pages/ProductManagement/CategoriesManager.tsx`
- Frontend: `frontend/src/pages/ProductManagement/MLCategorySuggester.tsx`
- Service: `frontend/src/services/productApi.ts`
- Typen: `frontend/src/types/product.ts`

## Letztes Update
- Datum: 2025-12-11
- Commit: pending (lokal)
