# 🔧 A.R.I. – Configuration & Bootstrapping Model (Final)

## Overview

A.R.I. is designed as an IaaS-style, containerized system.
The container intentionally runs in an unconfigured ("dumb") state until proper configuration is provided.

**This behavior is by design, not a defect.**

---

## Single Source of Truth: connection.json

### connection.json is the only source of truth

`connection.json` contains ALL shop-specific configuration data:

- **Shop Base URL** (e.g. WooCommerce)
- **API Credentials** (WooCommerce, OpenAI, WordPress)
- **Integration and System Parameters**
- **Runtime-relevant Configuration**

This file is:

- ✅ **Persistent** – Survives container updates
- ✅ **Update & Replacement Safe** – Not deleted on repair/update
- ✅ **Part of Onboarding** – Populated by customer
- ✅ **Required for Operation** – Without it, container is non-functional

**Without a valid connection.json, A.R.I. is intentionally non-operational.**

### Where is connection.json stored?

```
/app/backend/connection.json
```

### Who writes to connection.json?

| Source | When? | Content |
|--------|-------|---------|
| **Onboarding UI** | During setup | Shop URL, WooCommerce Keys, OpenAI Key |
| **System (Auto)** | At container start | Subscription Info (from Kubernetes ConfigMap) |
| **Customer** | Later | Specializations, additional integrations |

---

## Environment Configuration: .env.production

### .env.production is NOT for shop data

`.env.production` is used **exclusively for generic runtime configuration**:

- ✅ `NODE_ENV` – "production"
- ✅ `PORT` – Port number (e.g. 3000)
- ✅ `LOG_LEVEL` – Logging verbosity (debug, info, warn, error)
- ✅ `ADMIN_USER` / `ADMIN_PASS_HASH` – Fallback credentials (for emergencies)

### What does NOT belong in .env.production?

| ❌ DO NOT use | ✅ Use instead |
|---------------|----------------|
| SHOP_URL | connection.json → woocommerce.url |
| WOOCOMMERCE_KEY | connection.json → woocommerce.consumerKey |
| WOOCOMMERCE_SECRET | connection.json → woocommerce.consumerSecret |
| OPENAI_API_KEY | connection.json → openAI.apiKey |
| WORDPRESS_URL | connection.json → wordpress.url |

**Important:**

- `.env.production` is not part of the system's functional configuration
- `.env.production` can change between deployments (it's ephemeral)
- **Shop data MUST be in connection.json**

---

## ⚠️ Deprecation: Environment-Based Shop Injection

### The old model (deprecated)

Earlier versions of A.R.I. supported injecting shop endpoints via **environment variables**:

```bash
# ❌ DEPRECATED - DO NOT USE!
SHOP_URL=https://my-shop.com
WOOCOMMERCE_URL=https://my-shop.com/wp-json/wc/v3
```

This approach was intentionally replaced for good reasons:

### Why is this deprecated?

| Problem | Impact |
|---------|--------|
| **Ephemeral Data** | Env variables disappear when container restarts |
| **Re-Onboarding Required** | After each update, shop URL must be entered again |
| **No Persistence** | Configuration is lost on container replacement |
| **Not Cloud-Native** | Contradicts IaaS design (container = stateless) |
| **Kubelet Overhead** | Using Kubernetes Secrets for non-critical data is overkill |

### The new model (current)

**Persistent connection.json populated by customer and retained:**

```json
{
  "woocommerce": {
    "url": "https://my-shop.com",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_..."
  }
}
```

Benefits:

- ✅ Data survives container replacement
- ✅ No re-authentication on updates
- ✅ Container can be migrated/replicated
- ✅ Configuration state is explicit and visible
- ✅ No hidden configuration sources

---

## 🔄 Bootstrapping Flow

### Scenario 1: First Start (New Customer)

```
1. Container starts
   ↓
2. Check: Does connection.json exist?
   → NO!
   ↓
3. Load Frontend
   - Show: "Welcome to A.R.I.!"
   - Load Onboarding wizard
   ↓
4. Customer enters data
   - Shop URL: https://my-shop.com
   - WooCommerce Keys
   - OpenAI API Key
   ↓
5. POST /api/config/save
   - Backend saves to connection.json
   ↓
6. Container is READY
   - All tools available
```

### Scenario 2: Container Restart (after update/repair)

```
1. Container starts
   ↓
2. Check: Does connection.json exist?
   → YES! (inherited from old container)
   ↓
3. Load connection.json
   - Check: Are all required fields filled?
   - Validate: Are credentials still valid?
   ↓
4. Load Dashboard
   - No onboarding (we already have data!)
   - Customer sees their data
   ↓
5. Health Checks: GREEN ✅
   - Services update automatically
```

### Scenario 3: Corrupted connection.json

```
1. Container starts
   ↓
2. connection.json exists but corrupted
   - JSON parse error
   - Fields missing
   ↓
3. Frontend shows: "Configuration Error"
   - With recovery option
   - Customer can restart onboarding
   ↓
4. If customer chooses repair
   - New connection.json is created
   - Customers can re-enter old data (if available)
```

---

## 🏗️ Design Rationale

This model ensures that:

| Requirement | Implementation |
|-------------|-----------------|
| **No Volatility** | Configuration not tied to container runtime |
| **Cloud-Agnostic** | Docker, Kubernetes, bare metal = identical |
| **IaaS-Typical** | Container = replicas, not unique |
| **Service-Oriented** | A.R.I. operates as a managed service layer |
| **State Explicit** | System state is clear, auditable, reproducible |
| **Secure** | Secrets are local, not in orchestration system |

---

## 📋 Summary (EN)

| Question | Answer |
|----------|--------|
| **Where is the shop URL?** | In `connection.json` → `woocommerce.url` |
| **Where do WooCommerce keys come from?** | From customer during onboarding, stored in `connection.json` |
| **Where does shop URL come from Kubernetes?** | ❌ NOWHERE - That's deprecated! |
| **Can I set SHOP_URL in .env.production?** | ❌ NO - Only in `connection.json`! |
| **What is the single source of truth?** | `connection.json` – not .env, not Secrets, not ConfigMap |
| **What if container restarts?** | `connection.json` is preserved, customer notices nothing |
| **What if connection.json is missing?** | Onboarding wizard is displayed |
| **Is this a bug or design?** | ✅ **Design** – Intentionally so! |

---

## 🔗 See Also

- [DEPLOYMENT.md](./DEPLOYMENT.md) – Kubernetes Integration
- [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md) – Technical Configuration
- [Onboarding.md](./Onboarding.md) – Customer Experience
