# Changelog

All notable changes to A.R.I. (Artificial Retail Intelligence) will be documented in this file.

## [7.4.0] - 2026-02-12

### 🔐 Security & Architecture
- **Simplified Subscription Management**: Removed API-based integration, replaced with direct profile link
- **Removed API Secrets**: wpSwingsSecret and subscriptionId no longer in client code
- **Eliminated Attack Surface**: Removed 1200+ lines of subscription API endpoint code
- **Improved Security Model**: Admin-only configuration, no customer-facing secrets

### ✨ Changes
- **Profile Link Feature**: Simple button to https://kaufe-es.eu/index.php/mein-konto/wps_subscriptions/
- **Removed Components**: /api/subscription/status endpoint, subscription config interface
- **Simplified Frontend**: ShopCredentials no longer has subscription fields
- **Updated Translations**: i18n keys updated to reflect link-based approach

### 🛡️ Benefits
- **No Configuration Required**: Works out of the box
- **Better Security**: No secrets in client configuration
- **Easier Maintenance**: Simpler codebase with fewer dependencies
- **Drop-in Compatible**: Fully compatible with v7.3.0, no breaking changes

### 📝 Documentation
- **RELEASE_NOTES_v7.4.0.md**: Complete release documentation
- **DEPLOYMENT_GUIDE_v7.4.0.md**: Updated deployment guide
- **v7.4.0_QUICK_REF.md**: Quick reference with changes
- **Version Consistency**: All documentation updated for 7.4.0

---

## [7.3.0] - 2026-02-09

### ✨ Added
- **Config Export Download**: Sanitized `ari-export.json` download after onboarding
- **Onboarding Download Button**: One-click export for customers after setup
- **Specialization Cards**: Product links now open shop product pages

### 🖼️ UI
- **Specialization Images**: Switched tiles to use PNGs from `frontend/public/images`

### 📝 Documentation
- **v7.3.0 Docs**: Updated README badges and added v7.3.0 release docs

---

## [7.2.0] - 2026-02-03

### 🔒 Security
- **RSA-4096 Digital Signatures**: All specializations are now cryptographically signed with RSA-4096 + SHA-256
- **Tamper Detection**: Automatic rejection of manipulated or unsigned specializations (HTTP 401)
- **Revenue Protection**: Only officially signed specializations from kaufe-es.eu can be uploaded
- **Session-based Authentication**: Secure login system with HTTPOnly cookies, bcrypt password hashing
- **Password Security**: 8-16 characters, mandatory special characters, secure validation

### ✨ Added
- **Specialization Management**: Delete inactive specializations with safety checks (409 if active)
- **Signature Verification**: Public key hardcoded in container, verifies all uploads
- **Auth System**: Complete two-flow authentication (setup/login) with connection.json storage
- **Frontend Auth**: SessionProvider, useSession hook, dual-form Login component
- **Backend Routes**: 6 auth routes (check/setup/login/logout/session/change-password)
- **Delete Button UI**: Red delete button with translations (DE/EN) for inactive specs
- **12 Signed Specializations**: All .ari-spec files in docs/Spezialisierungen/ are production-ready

### 🛡️ Infrastructure
- **Private Key Protection**: RSA Private Key secured on server (wp-config.php), never in repo
- **Gitignore Updated**: wp-config*.php and sensitive files excluded from version control
- **Test Suite**: 4 signature verification tests (all passing)

### 📝 Documentation
- **AGB Template**: Comprehensive legal framework for specialization IP protection
- **README_EINFACH.md**: Simple 2-step deployment guide for non-technical users
- **Security Documentation**: Complete RSA-4096 implementation details

### 🔧 Technical
- **signatureVerifier.ts**: RSA-4096 signature verification module
- **signatureTypes.ts**: TypeScript interfaces for signed specializations
- **Upload Route Integration**: Signature check before persistSpecialization()
- **ESLint Clean**: 0 warnings, all builds successful

---

## [7.1.0] - 2026-01-24

### ✨ Added
- Core improvements and documentation housekeeping

### 🚫 Removed / Externalized
- Internal spec-creator tool and zugehörige Routen/Docs wurden aus dem Repo entfernt (separate Anwendung).

### 📝 Documentation
- Bereinigt, um keine spec-creator Hinweise mehr zu führen
- Version consistency across documentation files

---

## [7.0.4] - 2026-01-23

### 🐛 Fixed
- Session summary generation
- Final verification processes
- Documentation consistency

---

## [7.0.1] - 2026-01-20

### ✨ Features
- Quick reference guides
- Release notes documentation

---

## [7.0.0] - 2026-01-15

### 🎉 Major Release
- Production-ready A.R.I. system
- Full WooCommerce integration
- Real-time analytics dashboard
- AI-powered content generation
- Deployment guide for production environments

---

## Format Notes

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Fixed**: Bug fixes
- **Removed**: Removed features
- **Deprecated**: Soon to be removed features
- **Security**: Security updates and patches

This project follows [Semantic Versioning](https://semver.org/) guidelines.
