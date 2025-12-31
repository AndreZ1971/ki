# 🔄 Update & Deployment Strategie

**Version:** 1.0.0 | **Datum:** Dezember 2025

> **Hinweis:** Dieses Dokument beschreibt wie Updates verwaltet, getestet und deployed werden. Es berücksichtigt Backward Compatibility und zeigt einen klaren Upgrade-Pfad für Nutzer.

---

## 📋 Inhaltsverzeichnis

1. [Versionierung](#versionierung)
2. [Release-Types](#release-types)
3. [Deployment-Prozess](#deployment-prozess)
4. [Update-Prozess für Nutzer](#update-prozess-für-nutzer)
5. [Migration & Backward Compatibility](#migration--backward-compatibility)
6. [Rollback Strategie](#rollback-strategie)
7. [Testing & QA](#testing--qa)
8. [Container-Update Guide](#container-update-guide)

---

## 🏷️ Versionierung

Wir nutzen **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

```
v5.0.0  (MAJOR.MINOR.PATCH)
 │       │      │
 │       │      └─ PATCH: Bugfixes (v5.0.1, v5.0.2, v5.0.3)
 │       └────────  MINOR: Neue Features, backward-compatible (v5.1.0, v5.2.0)
 └────────────────  MAJOR: Breaking Changes (v6.0.0)
```

### Versionierungs-Beispiele

| Version       | Änderungen                   | Nutzer Action            |
| ------------- | ---------------------------- | ------------------------ |
| 5.0.0 → 5.0.1 | Bugfix in SMTP               | ✅ Auto-Update safe       |
| 5.0.0 → 5.1.0 | Neue Loop Schedules Feature  | ✅ Auto-Update safe       |
| 5.1.0 → 6.0.0 | connection.json → PostgreSQL | ⚠️ Migration erforderlich |

---

## 📦 Release-Types

### 🟢 **STABLE (Produktionsreife)**

- **Kadenz:** Monatlich (z.B. 1. Jedes Monats)
- **Dauer in vorheriger Phase:** 3-4 Wochen Testing
- **Deployment:** Production sofort, mit Release Notes
- **Beispiel:** v5.0.0, v5.1.0, v6.0.0

**Feature-Set:**
- Alle Features ausgiebig getestet
- Keine bekannten Bugs
- Performance optimiert
- Dokumentation vollständig

---

### 🟡 **RC - Release Candidate (Fast-Ready)**

- **Kadenz:** Nach Bedarf (1-2 Wochen vor Stable)
- **Dauer:** 1-2 Wochen Testing mit early Adopters
- **Deployment:** Staging + Early-Adopter Program
- **Beispiel:** v5.1.0-rc1, v5.1.0-rc2

**Vorbedingungen:**
- Alle Features funktionieren
- Bekannte Bugs sind documented
- Performance akzeptabel

---

### 🟠 **BETA (Feature-Complete, Stabilisierung)**

- **Kadenz:** Bi-wöchentlich
- **Dauer:** 2-3 Wochen
- **Deployment:** Staging + Beta-Tester Gruppe
- **Beispiel:** v5.1.0-beta.1, v5.1.0-beta.2

**Vorbedingungen:**
- Alle geplanten Features implementiert
- Grundlegende Integration getestet
- Known Issues gelistet

---

### 🔴 **ALPHA (In Entwicklung, Breaking möglich)**

- **Kadenz:** Wöchentlich (Mittwoch)
- **Dauer:** 1-2 Wochen bis RC
- **Deployment:** Dev nur, oder Docker nightly Builds
- **Beispiel:** v5.1.0-alpha.1, v5.1.0-alpha.2

**Vorbedingungen:**
- Neue Features in aktiver Entwicklung
- Breaking Changes möglich
- Nicht produktionsreif

---

## 🚀 Deployment-Prozess

### Schritt 1: Code Review & Testing (Dev Phase)

```bash
# Developer Branch: feature/config-hardening
npm run lint          # ✅ Zero warnings
npm run build         # ✅ TypeScript OK
npm run test          # ✅ >80% Coverage
```

**Checks:**
- [ ] TypeScript kompiliert ohne Fehler
- [ ] ESLint: 0 Warnings
- [ ] Unit Tests: ≥80% Coverage
- [ ] No console errors in dev mode

---

### Schritt 2: Integration Testing (QA Phase)

```bash
# In Staging Environment
npm run test:integration  # Test APIs
npm run test:e2e         # Test UI Flows
docker-compose up        # Full stack test
```

**Test Matrix:**

| Component              | Test Type          | Requirement              |
| ---------------------- | ------------------ | ------------------------ |
| Config Validator       | Unit + Integration | ✅ All cases pass         |
| Connection Test API    | Integration        | ✅ All services tested    |
| Settings UI            | E2E                | ✅ Save/Load/Backup flows |
| Error Handling         | Unit               | ✅ All error types        |
| Backward Compatibility | Integration        | ✅ Old configs migrate    |

---

### Schritt 3: Performance Testing

```bash
# Response times baseline
GET  /api/settings/connection     → <100ms
POST /api/settings/connection/test → <5s (per service)
GET  /api/health                  → <100ms
```

---

### Schritt 4: Security Review (für sensitive changes)

- [ ] No secrets in code
- [ ] No SQL injection risks
- [ ] API authentication working
- [ ] OWASP Top 10 checked

---

### Schritt 5: Documentation

- [ ] README.md aktualisiert
- [ ] API Docs aktualisiert
- [ ] Changelog.md aktualisiert
- [ ] Migration Guide (falls MAJOR version)

---

### Schritt 6: Tag & Release

```bash
# Tag erstellen
git tag v5.1.0
git push origin v5.1.0

# Docker Image bauen
docker build -t agentic-backend:v5.1.0 .
docker push registry.example.com/agentic-backend:v5.1.0

# GitHub Release erstellen
# - Title: "v5.1.0 - Configuration Hardening"
# - Description: Changelog + migration notes
# - Assets: Docker image, configs
```

---

## 👥 Update-Prozess für Nutzer

### Szenario 1: Auto-Update aktiviert (Empfohlen)

```
┌────────────────────────────────────────┐
│ Update Checker (täglich um 2:00 UTC)   │
│ Prüft auf neue STABLE Versions         │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Nutzer erhält Notification             │
│ "Update v5.1.0 verfügbar              │
│  - 5 neue Features                     │
│  - 3 Bugfixes                          │
│  - Upgrade empfohlen: JA ✅"            │
└──────────────┬─────────────────────────┘
               │
         [Nutzer klickt Update]
               │
               ▼
┌────────────────────────────────────────┐
│ 1. Pre-Update Checks                   │
│    - Config Backup erstellen ✓         │
│    - Health Check: Alle Services OK ✓  │
│    - Speicher verfügbar: 2GB ✓         │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ 2. Update Execute                      │
│    - New Image download: v5.1.0        │
│    - Graceful shutdown (30s timeout)   │
│    - New container start               │
│    - Pre-startup checks                │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ 3. Post-Update Validation              │
│    - Config migration (falls nötig)    │
│    - Database migration                │
│    - Health check starten              │
│    - Smoke tests durchführen           │
└──────────────┬─────────────────────────┘
               │
        [Alles OK?]
               │
        ┌──────┴──────┐
        │              │
       JA             NEIN
        │              │
        ▼              ▼
      ✅             ⚠️
   Success       Rollback
```

---

### Szenario 2: Manuelles Update

```bash
# 1. Aktuelle Version checken
curl http://localhost:3000/api/health
# → Shows: "version": "5.0.0"

# 2. Update durchführen
docker pull my-registry.de/agentic-backend:5.1.0
docker-compose up -d

# 3. Upgrade verifyzen
curl http://localhost:3000/api/health
# → Shows: "version": "5.1.0"

# 4. Config checken (falls migration)
curl http://localhost:3000/api/settings/connection
# → Shows all new fields (z.B. socialMedia)
```

---

## 🔄 Migration & Backward Compatibility

### Richtlinie: Alte Versionen Support

```
Aktuell:   v5.0.0
Release:   v5.1.0
Timeline:
  - v5.1.0: Full Support (3 Monate)
  - v6.0.0: v5.x wird auf Security-Only Mode
  - v7.0.0: v5.x wird EOL (End of Life)
```

---

### Migration Beispiel: v5.0 → v5.1 (connection.json mit Social Media erweitern)

**Vorher (v5.0):**
```json
{
  "wordpress": {...},
  "woocommerce": {...},
  "openAI": {...}
}
```

**Nachher (v5.1):**
```json
{
  "wordpress": {...},
  "woocommerce": {...},
  "openAI": {...},
  "socialMedia": {
    "linkedin": {...},
    "facebook": {...}
  }
}
```

**Migrations-Prozess beim Startup:**

```typescript
// backend/server.ts
async function migrateConfigIfNeeded() {
  const currentVersion = getConfigVersion();
  
  if (currentVersion === "5.0") {
    console.log("🔄 Migriere von v5.0 → v5.1");
    
    // 1. Load alte Config
    const oldConfig = loadConfig();
    
    // 2. Merge mit Defaults für neue Felder
    const migratedConfig = {
      ...oldConfig,
      socialMedia: defaultSocialMediaConfig,
      onboarding: {
        completed: false,
        // ... mark für user to configure new fields
      }
    };
    
    // 3. Backup alte Config
    backupConfig(`connection.v5.0.${Date.now()}.json`);
    
    // 4. Speichern neue Config
    saveConfig(migratedConfig);
    
    console.log("✅ Migration erfolgreich");
  }
}
```

---

### Backward Compatibility Regeln

✅ **IMMER erlaubt:**
- Neue Features hinzufügen (MINOR)
- Neue Felder (mit Default Values)
- Neue Endpoints (alte bleiben)
- Neue Optional Parameters

⚠️ **Mit Warnung (1-2 Versions vorher):**
- API Endpoints deprecieren
- Parameter umbennen
- Response Format ändern (nur wenn additive)

❌ **NUR in MAJOR Version:**
- Alte Endpoints entfernen
- Datentypen ändern
- Database Schema ändern
- Config-Format komplett neu

---

## 🔙 Rollback Strategie

### Automatischer Rollback bei Fehler

```
Update schlägt fehl → Automatischer Rollback
                  ↓
          Alte Version lädt
                  ↓
          Config Backup restore
                  ↓
          Admin erhält Alert
```

### Manueller Rollback

```bash
# 1. Alte Image Version
docker pull my-registry.de/agentic-backend:5.0.0

# 2. Alte Config restore
docker cp agentic-backend:/app/data/backups/connection.v5.0.json \
          /app/connection.json

# 3. Container restart mit alter Version
docker-compose down
docker-compose up -d
```

### Rollback Bedingungen

Automatischer Rollback triggered wenn:

```typescript
// Nach Update:
const health = await checkHealth();

// Kriterien für Rollback:
if (
  !health.services.wordpress.status === 'disconnected' ||
  !health.services.woocommerce.status === 'disconnected' ||
  !health.services.openai.status === 'disconnected' ||
  health.uptime < 5 * 60 * 1000 // Weniger als 5 Min laufen
) {
  console.error("❌ Update fehlgeschlagen - Rollback starten");
  await rollbackToVersion(previousVersion);
}
```

---

## 🧪 Testing & QA

### Test Pyramid

```
                    /\
                   /  \       E2E Tests (5%)
                  /────\      - Full user flows
                 /      \     - UI + API + DB
                /────────\
               /          \    Integration Tests (25%)
              /────────────\   - API endpoints
             /              \  - Database
            /────────────────\ - Service integrations
           /                  \
          /────────────────────\ Unit Tests (70%)
         /                      \ - Functions
        /────────────────────────\ - Classes
       /                          \ - Components
```

### Pre-Release Checklist

- [ ] All commits squashed and rebased
- [ ] Tests passing: `npm run test`
- [ ] Build passing: `npm run build`
- [ ] Lint clean: `npm run lint`
- [ ] E2E tests: Playwright passing
- [ ] Manual smoke tests:
  - [ ] Create config
  - [ ] Test connection
  - [ ] Backup/restore
  - [ ] API responses
- [ ] Security review passed
- [ ] Docs updated
- [ ] Changelog updated
- [ ] Version bumped (package.json)
- [ ] Docker image built
- [ ] GitHub release created

---

## 🐳 Container-Update Guide

### Für lokale Entwicklung

```bash
# 1. Pull latest
git pull origin master

# 2. Rebuild Backend
cd backend
npm install  # Falls Dependencies geändert
npm run build

# 3. Restart Container
docker-compose down
docker-compose up -d

# 4. Verify
curl http://localhost:3000/api/health
```

### Für Produktion (Kubernetes)

```bash
# 1. Update image tag im Deployment
kubectl set image deployment/agentic-backend \
  agentic-backend=registry.example.com/agentic-backend:v5.1.0

# 2. Check rollout
kubectl rollout status deployment/agentic-backend

# 3. Verify health
kubectl exec deployment/agentic-backend -- \
  curl localhost:3000/api/health

# 4. Check logs
kubectl logs -f deployment/agentic-backend
```

### Für Docker Compose (Single Host)

```bash
# docker-compose.production.yml
version: '3.8'
services:
  backend:
    image: my-registry.de/agentic-backend:v5.1.0
    # ... rest config
```

```bash
# Update durchführen
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Verify
docker ps  # Sollte neue version zeigen
docker logs agentic-backend
```

---

## 📊 Monitoring nach Update

### Health Check Endpoints

```bash
# Basis-Health
curl http://localhost:3000/api/health

# Response:
{
  "status": "healthy",
  "version": "5.1.0",
  "uptime": 1234567,
  "services": {
    "wordpress": { "status": "connected", "responseTime": "234ms" },
    "woocommerce": { "status": "connected", "responseTime": "123ms" },
    "openai": { "status": "connected", "responseTime": "456ms" }
  },
  "timestamp": "2025-12-19T14:32:45Z"
}
```

### Error Monitoring

Nach Update sollten folgende Metriken überwacht werden:

```
✓ Error Rate: Sollte nicht ansteigen
✓ Response Times: Sollten nicht degradieren
✓ Service Connections: Sollten alle OK sein
✓ Memory Usage: Sollte stabil sein
✓ CPU Usage: Sollte normal sein
```

---

## 📈 Version History & Timeline

| Version | Release Date | EOL Date    | Status    | Focus            |
| ------- | ------------ | ----------- | --------- | ---------------- |
| v5.0.0  | 15 Dec 2025  | 15 Mar 2026 | ✅ Stable  | Beta Foundation  |
| v5.1.0  | 20 Dec 2025  | TBD         | 🔨 Dev     | Config Hardening |
| v5.2.0  | 27 Dec 2025  | TBD         | 📋 Planned | Safety Features  |
| v5.3.0  | 06 Jan 2026  | TBD         | 📋 Planned | UX Improvements  |
| v5.4.0  | 20 Jan 2026  | TBD         | 📋 Planned | Security         |
| v6.0.0  | 28 Feb 2026  | TBD         | 📋 Planned | Multi-Tenant     |

---

## 🔗 Verwandte Dokumentationen

- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) - Feature Roadmap
- [deployment.md](./deployment.md) - Deployment-Guides
- [AGENTIC_CONFIGURATION.md](./AGENTIC_CONFIGURATION.md) - Config Schema
- [Onboarding.md](./Onboarding.md) - User Setup Guide

---

**Letztes Update:** Dezember 19, 2025  
**Nächste Review:** Dezember 27, 2025  
**Verantwortlich:** Devops + Development Team
