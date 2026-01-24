# 🚀 Release Notes v7.0.9

**Release Date:** 24. Januar 2026  
**Type:** Bugfix Release

---

## 🐛 Critical Bug Fixes

### Agentic Loops - 400 Bad Request Fix
**Problem:** Agentic Loops endpoints returned `400 Bad Request` errors when called with `Content-Type: application/json` header but without request body.

**Root Cause:** Fastify's default JSON parser rejects empty bodies when the `Content-Type: application/json` header is set, throwing error `FST_ERR_CTP_EMPTY_JSON_BODY`.

**Solution:** 
- Added custom Content-Type parser in `server.ts` that accepts empty JSON bodies and treats them as `{}`
- This allows POST requests to Agentic Loops endpoints without requiring a body
- All 4 loop types now work correctly:
  - `anomaly-detection`
  - `product-performance`
  - `payment-recovery`
  - `analytics-insights`

**Files Changed:**
- `backend/server.ts` - Added custom JSON parser for empty body handling
- `frontend/src/components/TransparencyBadges/AgenticLoopsDashboard.tsx` - Added `body: JSON.stringify({})` for compatibility

**Technical Details:**
```typescript
// Custom Content-Type Parser
server.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = body === '' ? {} : JSON.parse(body as string);
    done(null, json);
  } catch (err: any) {
    err.statusCode = 400;
    done(err, undefined);
  }
});
```

---

## 📦 Version Updates

All package versions updated to `7.0.9`:
- ✅ Root `package.json`
- ✅ Backend `package.json`
- ✅ Frontend `package.json`
- ✅ All documentation files

---

## 🔄 Migration from v7.0.8

**No breaking changes.** Simply update and deploy:

```bash
git pull origin master
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
```

---

## ✅ Verification

Test Agentic Loops functionality:
```bash
# Test POST endpoint without body
curl -X POST http://localhost:3000/api/agent/loops/anomaly-detection/run \
  -H "Content-Type: application/json"

# Expected: 200 OK with loop execution results
# Previous: 400 Bad Request with FST_ERR_CTP_EMPTY_JSON_BODY
```

---

## 🎯 Affected Components

- **Backend:** Fastify server configuration
- **Frontend:** Agentic Loops Dashboard
- **API Routes:** All `/api/agent/loops/:type/run` endpoints

---

## 📝 Notes

This release specifically addresses the regression where previously working Agentic Loops functionality started returning 400 errors. The fix ensures backward compatibility while maintaining proper JSON handling.

---

**Full Changelog:** https://github.com/AndreZ1971/ki/compare/v7.0.8...v7.0.9
