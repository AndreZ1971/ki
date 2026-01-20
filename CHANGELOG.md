# Changelog

All notable changes to this project will be documented in this file.

## [7.0.0] - 2026-01-20

### Production Release - Complete Real-Data Integration

This is the first production-ready release of A.R.I. with complete elimination of mock data and full real-time API integration.

#### Added
- ✅ Real WooCommerce API integration (wooCreateProduct, wooUpdateProduct, wooListCategories jobs)
- ✅ Support Ticket HTML sanitization with decodeHtmlEntities function
- ✅ Real-time health checks (Performance, Security, SEO, Inventory)
- ✅ Deterministic scoring algorithms (no Math.random())
- ✅ Production-grade user authentication with SHA-256 hashing
- ✅ 12 comprehensive debugging tools for payment issue resolution
- ✅ Complete configuration guides (English & German)
- ✅ Enhanced documentation for v7.0.0

#### Changed
- 🔄 All health check endpoints now use real API calls
- 🔄 Customer data fields aligned with WooCommerce standards
- 🔄 Feedback analysis uses deterministic heuristics
- 🔄 Email templates use real engagement data

#### Removed
- ❌ Mock data fields: visit_count, last_login
- ❌ Mock route: /api/health/history
- ❌ Fake email template: abandoned-cart
- ❌ Random number generation in scoring

#### Security
- ✅ HTML entity decoding in all ticket systems
- ✅ Real TLS certificate validation
- ✅ Verified HSTS/CSP/X-Frame headers
- ✅ Admin role enforcement
- ✅ Last-admin protection

#### Performance
- ✅ No degradation in response times
- ✅ Optimized inventory queries
- ✅ Efficient health check caching
- ✅ Bundle size: 1,786.87 kB (466.60 kB gzip)

#### Testing
- ✅ ESLint: 0 errors
- ✅ Build: Successful (9.91s)
- ✅ Type checking: Passed
- ✅ Git status: Clean

#### Breaking Changes
- NONE - Fully backward compatible with v6.x

#### Migration
- No action required
- Automatic data migration on first run
- See RELEASE_NOTES_v7.0.0.md for details

---

## [6.9.1] - 2026-01-20

### Pre-release - Beta Quality

#### Added
- Initial mock data removal
- Basic health check refactoring
- Support for real WooCommerce APIs

---
