# UI/UX Flow Diagram: Multi-Step AI Error Tracking & Rate-Limit Transparency

## Before: Problem State

```
User clicks "Alle analysieren (5)"
       ↓
API calls start
       ↓
Toast 1: "✅ Trend-Preis erfolgreich"
Toast 2: "✅ Reddit-Sentiment erfolgreich"
Toast 3: "❌ SEO-Optimierung fehlgeschlagen" (ERRORS)
       ↓
User confused: Which product failed? Which route? What's the error?
App appears frozen: No progress indication, no ETA shown
```

## After: Solution State

```
User clicks "Alle analysieren (5)"
       ↓
┌─────────────────────────────────────┐
│ ⏱️ Rate-Limit aktiv                │
│ Fortschritt: 0/5 Produkte           │
│ Geschätzte Dauer: ~7s               │
│ ████░░░░░░ 0%                       │
└─────────────────────────────────────┘
       ↓ (while processing)
┌─────────────────────────────────────┐
│ 📊 KI-Analyse Status                │
│                                     │
│ ✅ Produkt A                        │
│   💰: ✅ 💬: ✅ 📝: ✅              │
│                                     │
│ ⚠️ Produkt B                        │
│   💰: ✅ 💬: ❌ 📝: ✅              │
│   Fehler: Rate limit exceeded       │
│                                     │
│ ⏳ Produkt C                        │
│   💰: ⏳ 💬: 💰 📝: ℹ️              │
└─────────────────────────────────────┘
       ↓ (after completion)
┌─────────────────────────────────────┐
│ ✅ Batch erfolgreich abgeschlossen  │
│                                     │
│ ✅ 4/5 erfolgreich                  │
│ ⚠️ 1 partiell erfolgreich           │
│                                     │
│ 🔍 Details zu Fehlern:             │
│ Produkt B:                          │
│   💬: Rate limit exceeded           │
│   📝: Invalid description format    │
│ Produkt D:                          │
│   💰: Category not found            │
└─────────────────────────────────────┘
       ↓
User knows exactly what happened, why, and for which products
```

---

## Component Hierarchy

```
WooProductUpdate
├── Update-Typ-Section
├── AI/ML-Dashboard
│   ├── Price Limits
│   ├── Auto-Apply Toggle
│   ├── Analyze Button
│   │   └── onClick: 
│   │       - setRateLimitInfo({active: true, current: 0, total: X})
│   │       - Loop through products:
│   │         * analyzeTrendPricing(product)
│   │         * setAiCallStatus(...)
│   │         * setAiCallErrors(...)
│   │         * setRateLimitInfo({...current++})
│   │         * setTimeout(1500)
│   │       - setRateLimitInfo({active: false})
│   │
│   ├── [PANEL 1] Rate-Limit Transparenz
│   │   ├── Condition: rateLimitInfo.active === true
│   │   ├── Shows: Progress, ETA, Progress bar
│   │   └── Updates: Every 1.5s during batch
│   │
│   ├── [PANEL 2] AI Call Status Matrix
│   │   ├── Condition: Object.keys(aiCallStatus).length > 0
│   │   ├── Shows: Per-product status badges
│   │   │   └── For each product:
│   │   │       - Product name
│   │   │       - 3 columns (💰/💬/📝)
│   │   │       - Status icons (✅/⏳/❌/ℹ️)
│   │   │       - Error text if failed
│   │   └── Updates: Real-time as analysis progresses
│   │
│   ├── [PANEL 3] Batch Analysis Summary
│   │   ├── Condition: !rateLimitInfo.active && aiCallStatus.length > 0
│   │   ├── Shows: Summary statistics
│   │   │   - Success count: X/Y
│   │   │   - Partial count: X
│   │   │   - Failure count: X
│   │   │   - Detailed error breakdown
│   │   └── Styling: Color coded (🟢/🟡/🔴)
│   │
│   └── [Existing] Reddit Sentiment Panel
│       └── (unchanged)
```

---

## State Management Flow

```
Initial State:
{
  aiCallStatus: {},
  aiCallErrors: {},
  rateLimitInfo: { active: false, current: 0, total: 0 }
}

User clicks "Alle analysieren (5)":
{
  aiCallStatus: {},
  aiCallErrors: {},
  rateLimitInfo: { active: true, current: 0, total: 5 }  ← UI shows panel
}

First product starts (Product A):
{
  aiCallStatus: {
    1: { trendPricing: 'loading', redditSentiment: 'idle', descriptionOptimize: 'idle' }
  },
  aiCallErrors: {},
  rateLimitInfo: { active: true, current: 0, total: 5 }  ← Status panel appears
}

First product succeeds:
{
  aiCallStatus: {
    1: { trendPricing: 'ok', redditSentiment: 'idle', descriptionOptimize: 'idle' }
  },
  aiCallErrors: {},
  rateLimitInfo: { active: true, current: 1, total: 5 }  ← Progress updates
}

Second product starts with partial failure (Product B):
{
  aiCallStatus: {
    1: { trendPricing: 'ok', ... },
    2: { trendPricing: 'ok', redditSentiment: 'loading', descriptionOptimize: 'idle' }
  },
  aiCallErrors: {},
  rateLimitInfo: { active: true, current: 1, total: 5 }
}

Second product Redis route fails:
{
  aiCallStatus: {
    1: { trendPricing: 'ok', ... },
    2: { trendPricing: 'ok', redditSentiment: 'failed', descriptionOptimize: 'idle' }
  },
  aiCallErrors: {
    2: { redditSentiment: 'Rate limit exceeded' }  ← Error captured
  },
  rateLimitInfo: { active: true, current: 2, total: 5 }  ← Show error in panel
}

All products complete:
{
  aiCallStatus: {
    1: { trendPricing: 'ok', ... },
    2: { trendPricing: 'ok', redditSentiment: 'failed', descriptionOptimize: 'ok' },
    3: { trendPricing: 'ok', ... },
    4: { trendPricing: 'ok', ... },
    5: { trendPricing: 'ok', ... }
  },
  aiCallErrors: {
    2: { redditSentiment: 'Rate limit exceeded' }
  },
  rateLimitInfo: { active: false, current: 5, total: 5 }  ← Summary panel appears
}
```

---

## UI Panel Visibility Timeline

```
Time        Rate-Limit Panel  Status Matrix  Summary Panel
─────────────────────────────────────────────────────────
0s          ───────────────   ─────────────  ──────────
            │ APPEARS          │ APPEARS
1s          │ Progress: 1/5    │ Product A
2.5s        │ Progress: 2/5    │ Product A, B
4s          │ Progress: 3/5    │ Product A, B, C
5.5s        │ Progress: 4/5    │ Product A, B, C, D
7s          │ Progress: 5/5    │ All products
7.5s        ├─ DISAPPEARS      │ Still visible
            │                  │                │ APPEARS
            │                  │                │ ✅ 4/5 ok
            │                  │                │ ⚠️ 1 partial
            │                  │                │ [Error details]
```

---

## Error Handling Examples

### Scenario 1: All Three Routes Fail

```
⚠️ Produkt A
┌─────────────────────────────────────────┐
│ 💰 Trend-Preis: ❌                     │
│ Fehler: Category not found              │
│                                         │
│ 💬 Reddit: ❌                          │
│ Fehler: API timeout after 30s           │
│                                         │
│ 📝 SEO: ❌                             │
│ Fehler: Description length exceeds 500  │
└─────────────────────────────────────────┘

Summary:
❌ Batch mit Fehlern
❌ Komplett fehlgeschlagen: 1/1

Details:
Produkt A: 💰 Category not found • 💬 API timeout after 30s • 📝 Description length exceeds 500
```

### Scenario 2: Mixed Success & Partial Failure

```
✅ Produkt A              ⚠️ Produkt B
┌───────────────┐         ┌─────────────────────────────┐
│ 💰: ✅        │         │ 💰: ✅                     │
│ 💬: ✅        │         │ Fehler: -                   │
│ 📝: ✅        │         │                             │
└───────────────┘         │ 💬: ❌                     │
                          │ Fehler: Rate limit exceeded │
❌ Produkt C             │                             │
┌───────────────┐        │ 📝: ✅                     │
│ 💰: ❌        │        │ Fehler: -                   │
│ Fehler: -     │        └─────────────────────────────┘
│               │
│ 💬: ❌        │
│ Fehler: -     │
│               │
│ 📝: ❌        │
│ Fehler: -     │
└───────────────┘

Summary:
⚠️ Batch partiell erfolgreich

✅ 1/3 erfolgreich
⚠️ 1 partiell erfolgreich
❌ 1 komplett fehlgeschlagen

Details:
Produkt B: 💬 Rate limit exceeded
Produkt C: 💰 [error] • 💬 [error] • 📝 [error]
```

---

## Responsive Behavior

### Wide Screen (≥800px)
```
┌──────────────────────────────────────────┐
│ ⏱️ Rate-Limit Transparenz Panel (full)  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ 📊 KI-Analyse Status (3 columns)         │
│ ┌──────────────────────────────────────┐ │
│ │ Product: 💰 ✅ | 💬 ⏳ | 📝 ❌      │ │
│ │ Product: 💰 ✅ | 💬 ✅ | 📝 ✅      │ │
│ │ Product: 💰 ✅ | 💬 ❌ | 📝 ✅      │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Narrow Screen (<600px)
```
┌──────────────────────────────────────────┐
│ ⏱️ Rate-Limit (responsive)               │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ 📊 KI-Analyse (stacked)                  │
│ Product: 💰 ✅ 💬 ⏳ 📝 ❌               │
│ [inline, wrapped as needed]              │
└──────────────────────────────────────────┘
```

---

## Color Legend

| Status | Color | Emoji | Meaning |
|--------|-------|-------|---------|
| Success | #10b981 | ✅ | AI route completed successfully |
| Loading | #f59e0b | ⏳ | AI route currently processing |
| Failed | #ef4444 | ❌ | AI route encountered error |
| Idle | #9ca3af | ℹ️ | AI route not attempted yet |
| Rate-Limit | #fbbf24 | ⏱️ | Batch in progress with 1.5s delays |
| Partial | #fbbf24 | ⚠️ | Product has both successes and failures |

---

## Key UX Improvements

1. **Transparency**: Users see exactly what's happening at each step
2. **Actionability**: Error details explain what failed and why
3. **Predictability**: Rate-Limit ETA manages expectations
4. **Scannability**: Color coding + emoji = quick status assessment
5. **Context**: Per-product AND per-route visibility
6. **Completeness**: Summary gives total picture after batch
