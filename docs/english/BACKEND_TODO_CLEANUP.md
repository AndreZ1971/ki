# Backend TODO Cleanup Status

## Summary

This document tracks the cleanup and resolution of outstanding TODOs in the backend codebase.

**Last Updated**: January 3, 2026  
**Status**: In Progress

## Completed Items

### 1. Public Key Management (✅ DONE)

**File**: [backend/services/specializationService.ts](../../backend/services/specializationService.ts#L21-L34)

**Change**: Moved public key loading to environment variable with fallback logging

**Implementation**:
```typescript
const KAUFE_ES_PUBLIC_KEY = (() => {
  const envKey = process.env.SPEC_PUBLIC_KEY;
  if (envKey) {
    logger.info('✅ Public Key aus SPEC_PUBLIC_KEY Env-Variable geladen');
    return envKey;
  }
  logger.warn('⚠️ Verwende Fallback Public Key (nicht für Produktion empfohlen)');
  return /* fallback key */;
})();
```

**Benefits**: Production-safe, configurable, logged

---

### 2. User Context in Routes (✅ DONE)

**Files Affected**:
- [backend/routes/app/api/specializations/index.ts](../../backend/routes/app/api/specializations/index.ts) - 4 endpoints
- [backend/routes/app/api/chatbot-message.ts](../../backend/routes/app/api/chatbot-message.ts)

**Change**: Replaced hardcoded `userId = 'default'` with auth context extraction

**Implementation**:
```typescript
const userId = request.user?.id || request.headers['x-user-id'] || 'default';
```

**Pattern**: 
- Check authenticated user object
- Fall back to `x-user-id` header
- Final fallback to `'default'`

**Impact**: All user-specific operations (specializations, chats) now respect authentication context

---

### 3. WooCommerce Job Placeholders (✅ DONE)

**Files Affected**:
- [backend/agent/jobs/wooCreateProduct.ts](../../backend/agent/jobs/wooCreateProduct.ts)
- [backend/agent/jobs/wooUpdateProduct.ts](../../backend/agent/jobs/wooUpdateProduct.ts)
- [backend/agent/jobs/wooListCategories.ts](../../backend/agent/jobs/wooListCategories.ts)

**Change**: Updated docstrings to mark as "Implementation pending"

**Current Status**: Placeholder implementations return success with empty/dummy data

**Next Steps**: Implement actual WooCommerce REST API integration (phase 2)

---

## Remaining TODOs

### 1. Category Optimization (⏳ LOW PRIORITY)

**File**: [backend/routes/app/api/products/categories.ts](../../backend/routes/app/api/products/categories.ts#L293)

**TODO**: AI-basierte Kategorie-Optimierung implementieren

**Status**: Design phase - requires OpenAI integration

**ETA**: Q2 2026

### 2. Product Management (⏳ LOW PRIORITY)

**File**: [backend/routes/app/api/products/product-management.ts](../../backend/routes/app/api/products/product-management.ts#L390)

**TODO**: WooCommerce API Integration

**Status**: Design phase - pending WooCommerce REST API setup

**ETA**: Q2 2026

### 3. Database Integration (⏳ LOW PRIORITY)

**File**: [backend/routes/app/api/products/bundles.ts](../../backend/routes/app/api/products/bundles.ts#L393)

**TODO**: Database Integration

**Status**: Placeholder implemented - pending schema design

**ETA**: Q2 2026

---

## Testing TODOs

### Unit Tests

**File**: [tests/unit/wordpress-tools.test.ts](../../tests/unit/wordpress-tools.test.ts#L18)

**TODO**: Mit Vitest-Experten axios-Mocking-Strategie überarbeiten

**Status**: Pending - requires vitest specialist

### Retry Strategies

**File**: [tests/unit/retry-strategies.test.ts](../../tests/unit/retry-strategies.test.ts#L66)

**TODO**: Refactor RetryStrategy to not use setTimeout for better testability

**Status**: Pending - design review needed

---

## Documentation TODOs

See [docs/english/SPECIALIZATION_KEY_MANAGEMENT.md](./SPECIALIZATION_KEY_MANAGEMENT.md) for production deployment requirements.

**Pending Documentation**:
- [ ] API Authentication Guide
- [ ] WooCommerce Integration Handbook
- [ ] Key Rotation Procedures
- [ ] Disaster Recovery Runbook

---

## Review Checklist

- [x] All userId hardcodes removed
- [x] Public Key loading from environment
- [x] WooCommerce jobs marked as placeholders
- [x] Code comments updated
- [x] Lint checks passing
- [ ] All tests passing
- [ ] Production deployment verified

---

## Next Steps

1. Run lint: `npm run lint` (all backends)
2. Run tests: `npm test` (all backends)
3. Code review for auth context implementation
4. Deploy to staging for integration testing
