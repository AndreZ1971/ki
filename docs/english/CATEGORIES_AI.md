# Categories AI Features (Status 2025-12-11)

## Overview
- Goal: AI-powered category suggestions and optimization for WooCommerce categories.
- Frontend: `CategoriesManager.tsx` (ProductManagement), `MLCategorySuggester.tsx` (Inline-Suggester).
- Backend: Fastify route `backend/routes/app/api/products/categories.ts` with OpenAI integration.
- API Service: `categoryApi.suggestCategories` (Frontend) for consistent error handling.

## Endpoints
- `POST /api/categories/ml/suggest`
  - Input: `{ title: string; description: string; maxSuggestions?: number }`
  - Output: `{ success: true, suggestions: { name: string; confidence: number; reason: string }[] }`
  - Model: `gpt-4o-mini`, temperature 0.2, JSON response.
  - Context: Known WooCommerce categories (up to 100) are included; no new categories should be invented.

- `POST /api/categories/optimize`
  - Currently a stub, can be extended for actual optimization (generate description, detect duplicates).

## Frontend Flows
- **Fetch Suggestions per Category**
  - Button "🤖 Suggestions" in `CategoriesManager.tsx`
  - Calls `categoryApi.suggestCategories` → displays Confidence + Reason inline.
  - "Apply" currently sets the name UI-side and `needsOptimization=false` (backend update can be added optionally).

- **Inline-Suggester Demo**
  - `MLCategorySuggester.tsx` uses the same endpoint via `categoryApi`.

## Data Structures
- `CategorySuggestion` (frontend `types/product.ts`): `{ name: string; confidence: number; reason: string }`

## Extension Ideas (Next)
1) Backend-Apply: PUT to WooCommerce for name/description, including validation.
2) Optimize-All implementation: generate missing descriptions, detect duplicate suggestions.
3) Caching/Embeddings for cost reduction; rate-limiting per user.
4) UI: Badge "AI Updated", history of suggestions, undo functionality.

## Security & Robustness
- OpenAI key only in backend (`connection.json` via `config`).
- Response format strictly JSON, response parsed defensively; confidence clamped to [0,1].
- Errors are generic; no secrets exposed to client.

## File Touchpoints
- Backend: `backend/routes/app/api/products/categories.ts`
- Frontend: `frontend/src/pages/ProductManagement/CategoriesManager.tsx`
- Frontend: `frontend/src/pages/ProductManagement/MLCategorySuggester.tsx`
- Service: `frontend/src/services/productApi.ts`
- Types: `frontend/src/types/product.ts`

## Last Update
- Date: 2025-12-11
- Commit: pending (local)
