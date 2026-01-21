# Developer Quick Reference: WooProductUpdate AI Error Handling

## Quick Start

### To Track a New AI Route Error:

1. Add to `AiCallStatus` interface:
   ```typescript
   newRoute: 'idle' | 'loading' | 'ok' | 'failed';
   ```

2. Add to `AiCallError` interface:
   ```typescript
   newRoute?: string;
   ```

3. In your async function:
   ```typescript
   // Before API call
   setAiCallStatus(prev => ({
     ...prev,
     [product.id]: { ...prev[product.id], newRoute: 'loading' }
   }));
   
   try {
     const result = await apiClient.post('/api/products/ai/new-route', {...});
     
     if (result.success) {
       setAiCallStatus(prev => ({
         ...prev,
         [product.id]: { ...prev[product.id], newRoute: 'ok' }
       }));
       
       // Clear previous errors
       setAiCallErrors(prev => {
         const updated = { ...prev };
         if (updated[product.id]) {
           delete updated[product.id].newRoute;
         }
         return updated;
       });
     }
   } catch (error) {
     const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
     
     setAiCallStatus(prev => ({
       ...prev,
       [product.id]: { ...prev[product.id], newRoute: 'failed' }
     }));
     
     setAiCallErrors(prev => ({
       ...prev,
       [product.id]: { ...prev[product.id], newRoute: errorMsg }
     }));
   }
   ```

---

## State Management Patterns

### Get all succeeded products (all routes ok):
```typescript
const allSuccessful = Object.entries(aiCallStatus)
  .filter(([_, status]) => 
    status.trendPricing === 'ok' &&
    status.redditSentiment === 'ok' &&
    status.descriptionOptimize === 'ok'
  )
  .map(([productId]) => Number(productId));
```

### Get all failed products (any route failed):
```typescript
const anyFailed = Object.entries(aiCallStatus)
  .filter(([_, status]) => 
    status.trendPricing === 'failed' ||
    status.redditSentiment === 'failed' ||
    status.descriptionOptimize === 'failed'
  )
  .map(([productId]) => Number(productId));
```

### Get error message for specific product + route:
```typescript
const errorMsg = aiCallErrors[productId]?.trendPricing;
if (errorMsg) {
  console.log(`Trend pricing failed for product ${productId}: ${errorMsg}`);
}
```

### Count statistics:
```typescript
const stats = {
  totalAnalyzed: Object.keys(aiCallStatus).length,
  allSuccess: Object.values(aiCallStatus).filter(s => 
    s.trendPricing === 'ok' && s.redditSentiment === 'ok' && s.descriptionOptimize === 'ok'
  ).length,
  anyFailed: Object.values(aiCallStatus).filter(s =>
    s.trendPricing === 'failed' || s.redditSentiment === 'failed' || s.descriptionOptimize === 'failed'
  ).length
};
```

---

## Common Error Scenarios & Handling

### Scenario 1: API Timeout
```typescript
} catch (error) {
  if (error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
    setAiCallErrors(prev => ({
      ...prev,
      [product.id]: {
        ...prev[product.id],
        trendPricing: `API-Timeout nach ${timeout}ms`
      }
    }));
  }
}
```

### Scenario 2: Rate Limit (429)
```typescript
} catch (error) {
  if (error?.status === 429) {
    // Don't retry immediately, user sees error in UI
    setAiCallErrors(prev => ({
      ...prev,
      [product.id]: {
        ...prev[product.id],
        trendPricing: 'Rate limit exceeded - Bitte später erneut versuchen'
      }
    }));
  }
}
```

### Scenario 3: Invalid Input
```typescript
} catch (error) {
  if (error?.status === 400) {
    setAiCallErrors(prev => ({
      ...prev,
      [product.id]: {
        ...prev[product.id],
        trendPricing: `Ungültige Eingabe: ${error.message}`
      }
    }));
  }
}
```

---

## UI Rendering Patterns

### Conditional Panel Display:
```typescript
// Panel only shows if at least one analysis done
{Object.keys(aiCallStatus).length > 0 && (
  <div>{/* AI Status Panel */}</div>
)}

// Summary only shows when NOT actively processing
{!rateLimitInfo.active && Object.keys(aiCallStatus).length > 0 && (
  <div>{/* Summary Panel */}</div>
)}

// Rate-Limit only shows when actively processing
{rateLimitInfo.active && (
  <div>{/* Rate-Limit Panel */}</div>
)}
```

### Status-Based Styling:
```typescript
// Color based on overall product result
const status = aiCallStatus[productId];
const hasError = aiCallErrors[productId];
const backgroundColor = hasError ? 'rgba(239, 68, 68, 0.1)' 
  : status?.trendPricing === 'ok' ? 'rgba(16, 185, 129, 0.1)' 
  : 'rgba(255,255,255,0.05)';
```

### Error Display:
```typescript
{errors?.trendPricing && (
  <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>
    Fehler: {errors.trendPricing}
  </div>
)}
```

---

## Performance Considerations

### Rate-Limiting Loop:
```typescript
// ✅ CORRECT: 1.5s between calls prevents backend overload
for (const productId of selectedProducts) {
  await analyzeTrendPricing(product);
  if (analyzed < selectedProducts.length) {
    await new Promise(r => setTimeout(r, 1500));
  }
}

// ❌ WRONG: No delay = potential 429 errors
for (const productId of selectedProducts) {
  await analyzeTrendPricing(product); // No pause!
}
```

### State Updates:
```typescript
// ✅ CORRECT: Per-product update prevents full array re-renders
setAiCallStatus(prev => ({
  ...prev,
  [product.id]: { ...prev[product.id], trendPricing: 'ok' }
}));

// ⚠️ SUBOPTIMAL: Replaces entire object
setAiCallStatus({ 
  ...aiCallStatus, 
  [product.id]: {...}
});
```

### Cleanup:
```typescript
// After batch completes, reset rate-limit info
setRateLimitInfo({ active: false, current: 0, total: 0 });

// Don't clear aiCallStatus/aiCallErrors - user wants to see results!
// Only clear on new batch or manual reset
```

---

## Testing Checklist

### Unit Testing:
- [ ] Individual AI function error handling
- [ ] State update calculations (success/fail counts)
- [ ] Error message formatting
- [ ] Rate-limit delay logic

### Integration Testing:
- [ ] Batch analyze button state transitions
- [ ] All three panels appear/disappear correctly
- [ ] Error details display properly
- [ ] Toast messages correlate with UI state

### Manual Testing:
- [ ] Trigger each route failure individually
- [ ] Trigger multiple route failures on same product
- [ ] Verify progress bar updates smoothly
- [ ] Verify ETA calculation is reasonable
- [ ] Verify summary counts match displayed results
- [ ] Verify error messages are readable and helpful

### Edge Cases:
- [ ] Zero products selected
- [ ] Single product
- [ ] All products fail
- [ ] All products succeed
- [ ] Network timeout mid-batch
- [ ] User closes panel mid-batch
- [ ] User refreshes page during batch

---

## Debugging Tips

### To inspect current state:
```typescript
console.log('Status:', aiCallStatus);
console.log('Errors:', aiCallErrors);
console.log('Rate-Limit:', rateLimitInfo);
```

### To manually trigger error for testing:
```typescript
// In browser console:
// Simulate failure for product 1
setAiCallStatus(prev => ({
  ...prev,
  1: { trendPricing: 'failed', redditSentiment: 'ok', descriptionOptimize: 'ok' }
}));

setAiCallErrors(prev => ({
  ...prev,
  1: { trendPricing: 'Test error message' }
}));
```

### To trace batch progress:
```typescript
// Add console.log in batch loop:
for (const productId of selectedProducts) {
  console.log(`[${new Date().toISOString()}] Analyzing product ${productId}`);
  await analyzeTrendPricing(product);
  console.log(`[${new Date().toISOString()}] Complete, waiting...`);
  if (analyzed < selectedProducts.length) {
    await new Promise(r => setTimeout(r, 1500));
  }
}
```

---

## Migration Path (if adding to other components)

1. **Copy interfaces** to new component:
   ```typescript
   interface AiCallStatus { /* ... */ }
   interface AiCallError { /* ... */ }
   ```

2. **Create state vars**:
   ```typescript
   const [aiCallStatus, setAiCallStatus] = useState<Record<number, AiCallStatus>>({});
   const [aiCallErrors, setAiCallErrors] = useState<Record<number, AiCallError>>({});
   ```

3. **Wrap API calls** with status updates (see patterns above)

4. **Add UI panels** (copy JSX, adjust styling as needed)

5. **Test thoroughly** before deploying

---

## Related Documentation

- See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for full implementation details
- See [UI_FLOW_DIAGRAM.md](./UI_FLOW_DIAGRAM.md) for visual flow and state transitions
- See [WooProductUpdate.tsx](./frontend/src/pages/ProductManagement/WooProductUpdate.tsx) for actual code

---

## Support & Troubleshooting

### "Panels not appearing"
- Check: Is `aiCallStatus` populated? (Use console.log)
- Check: Is `rateLimitInfo.active` correct for which panel should show?
- Check: Are conditions in JSX correct? (e.g., `Object.keys(aiCallStatus).length > 0`)

### "Errors not showing"
- Check: Is `aiCallErrors` being set in catch block?
- Check: Is error key matching the route name? (trendPricing, redditSentiment, descriptionOptimize)
- Check: Is error text rendering in JSX? (verify conditional render)

### "Progress bar not updating"
- Check: Is `setRateLimitInfo` called after each product? (inside loop)
- Check: Is progress bar width calculation correct? `width: ${(current/total)*100}%`
- Check: Is div visible? Check CSS background/border

### "Rate-limit timeout"
- Check: Expected duration = `total * 1.5 seconds`
- Check: Is 1500ms timeout too short? (May need increase if backend is slow)
- Check: Are other requests interfering? (Use browser DevTools Network tab)

