# 🚀 A.R.I. - Kubernetes & Deployment Architecture

**Version:** 7.0.3  
**Date:** January 2026  
**Target Audience:** Automattic Engineering Team, DevOps, Kubernetes Administrators

> **Core Concept:** A.R.I. provides production-ready containers. Automattic orchestrates everything.

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Container Specification](#container-specification)
3. [Container Lifecycle](#container-lifecycle)
4. [Health Checks & Recovery](#health-checks--recovery)
5. [Update & Repair Strategy](#update--repair-strategy)
6. [Kubernetes Integration](#kubernetes-integration)
7. [Docker-Compose Reference](#docker-compose-reference)
8. [Disaster Recovery](#disaster-recovery)

---

## 🏗️ System Architecture

### High-Level Flow: Payment Flow → Kubernetes → Container → Customer

```
┌─────────────────────────────────────────────────────────────────┐
│                      AUTOMATTIC PLATFORM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────┐       ┌──────────────┐      ┌──────────────┐   │
│  │ Payment    │──────▶│  Webhook     │─────▶│ Kubernetes   │   │
│  │ Processing │       │  Trigger     │      │  API Server  │   │
│  └────────────┘       └──────────────┘      └──────────────┘   │
│                                                   │               │
│                                                   ▼               │
│                                      ┌──────────────────────┐   │
│                                      │   Kubernetes Cluster │   │
│                                      │  ┌────────────────┐  │   │
│                                      │  │ ConfigMap      │  │   │
│                                      │  │ (Shop URL)     │  │   │
│                                      │  └────────────────┘  │   │
│                                      │  ┌────────────────┐  │   │
│                                      │  │ Container ABC  │  │   │
│                                      │  │ (A.R.I.)       │  │   │
│                                      │  │ - Nginx        │  │   │
│                                      │  │ - Backend      │  │   │
│                                      │  │ - connection.json  │   │
│                                      │  └────────────────┘  │   │
│                                      │  ┌────────────────┐  │   │
│                                      │  │ PersistentVol. │  │   │
│                                      │  │ (if needed)    │  │   │
│                                      │  └────────────────┘  │   │
│                                      └──────────────────────┘   │
│                                                   │               │
│                                                   ▼               │
│  ┌───────────────┐                ┌──────────────────────┐      │
│  │    Customer   │◀───────────────│ Link to A.R.I.       │      │
│  │ WooCommerce   │                │ + Onboarding         │      │
│  │ Dashboard     │                │ + User Manual         │      │
│  └───────────────┘                │ + User FAQ            │      │
│                                    │ + Social-Media Guide │      │
│                                    └──────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Container Specification

### What must every A.R.I. container be able to do?

#### 1. **Startup Sequence**

```yaml
# Timeline when container starts
1. Container starts (Dockerfile ENTRYPOINT)
   - Base services start (Nginx, Node.js, Fastify)
   - connection.json is checked
   ⚠️ IMPORTANT: Shop URL does NOT come from Kubernetes Environment!
      → Shop URL is entered by customer during Onboarding
      → It is persistently stored in connection.json

2. Depending on connection.json state:
   - connection.json EMPTY: Frontend shows Onboarding wizard
   - connection.json FILLED: Frontend shows Dashboard
   - connection.json CORRUPTED: Error screen with repair option

3. Frontend is served
   - UI loads automatically
   - Customer sees Onboarding or Dashboard (depending on connection.json)

4. Health Checks start
   - Container responds to /health (Liveness)
   - Container responds to /ready (Readiness)
   - Check: Is connection.json present? (for Readiness)
```

#### 2. **Connection.json Format (After Onboarding)**

**Path:** `backend/connection.json`

**After successful onboarding, the file is filled:**

```json
{
  "woocommerce": {
    "url": "https://customer-shop.com",
    "consumerKey": "ck_abc123xyz",
    "consumerSecret": "cs_def456uvw",
    "validated": true,
    "connected_at": "2026-01-05T10:30:00Z"
  },
  "openAI": {
    "apiKey": "sk-proj-abc123xyz",
    "model": "gpt-4o-mini",
    "organization": null,
    "validated": true,
    "connected_at": "2026-01-05T10:35:00Z"
  },
  "wordpress": {
    "url": "https://customer-shop.com",
    "username": "admin",
    "appPassword": "xxxx xxxx xxxx xxxx"
  },
  "subscription": {
    "customer_id": "AUTOMATTIC_CUSTOMER_ID",
    "subscription_id": "AUTOMATTIC_SUBSCRIPTION_ID",
    "active_until": "2026-02-05",
    "status": "active"
  },
  "specializations": {
    "current": null,
    "available": []
  },
  "created_at": "2026-01-05T10:30:00Z",
  "last_updated": "2026-01-05T10:35:00Z"
}
```

**Important (Single Source of Truth):** 
- `woocommerce.url` = the only place where shop URL is stored
- All services (Backend, Frontend, Tools) read from here
- No environment variables for shop URL
- `subscription` part is delivered by Automattic during deployment
- Customer fills `woocommerce` + `openai` + `wordpress` via Onboarding
- `specializations` is later managed by customer

#### 3. **Required Files in Container**

| File/Folder | Purpose | Kubernetes |
|-------------|---------|-----------|
| `/app/backend/connection.json` | Configuration | New at start; Copy at Repair |
| `/app/backend/config/` | Secrets & Config | As ConfigMap |
| `/app/frontend/dist/` | React Frontend | Build in container |
| `/app/data/logs/` | Logs | Optional: PersistentVolume |
| `/app/.env.production` | Environment | ConfigMap/Secret |
| `/.healthcheck.js` | Health Endpoint | Must exist |

---

## 🔄 Container Lifecycle

### Normal Case: New Container (Customer purchases subscription)

```
1. PAYMENT CONFIRMED
   ↓
2. Automattic Webhook → Kubernetes API
   Payload (Example):
   {
     "event": "subscription.created",
     "customer_id": "cust_12345",
     "subscription_id": "sub_67890",
     "active_until": "2026-02-05",
     "container_version": "v7.0.5"
   }
   ⚠️ IMPORTANT: shop_url is NOT passed here!
      → Shop URL comes later from customer during Onboarding
   ↓
3. Kubernetes creates:
   - ConfigMap (with subscription_id, etc. - WITHOUT shop_url)
   - Deployment (with A.R.I. container image)
   - Service (ingress for external accessibility)
   ↓
4. Container starts
   - Creates empty connection.json (only with subscription info)
   - Waits for customer
   ↓
5. Frontend loads
   - Customer sees: "Welcome! Step 1: Connect WooCommerce"
   - This is the integrated Onboarding (Onboarding.md delivered)
   ↓
6. Customer enters data (in Onboarding)
   - **Enter Shop URL** (e.g. https://my-shop.com)
   - WooCommerce API Keys
   - OpenAI API Key
   - Optional: Upload specialization
   ↓
7. Connection.json is filled
   - Frontend sends data via POST /api/config/save
   - Backend saves to connection.json
   - ALL data comes from customer, NOTHING from Kubernetes
   ↓
8. Container is READY
   - Health Checks green ✅
   - All 52 tools available
```

---

### Repair Case: Container is sick

```
SCENARIO: Container crashed, is unreachable, malware, etc.

1. Kubernetes Health Check: FAILED
   (Liveness Probe: GET /health → No Response)
   ↓
2. Kubernetes waits 3x (default restart policy)
   ↓
3. Container is still down
   ↓
4. Automattic Orchestration (not A.R.I.):
   - Checks: Is there still an old container?
   - If YES: Extract connection.json from old container
   - If NO: Customer must do Onboarding again
   ↓
5. Kubernetes starts NEW container with:
   - Mode: repair
   - Old connection.json (if available) as volume/ConfigMap
   ↓
6. Container starts (Repair mode)
   - Checks: Does connection.json already exist?
   - If YES: Uses it (Customer notices NOTHING!)
   - If NO: connection.json with placeholders
   ↓
7. Old container is DELETED
   ↓
8. Customer notices: NOTHING
   - Dashboard was briefly down (< 1 minute)
   - Now available again with same data
   - Zero downtime through preparation
```

**Important:** No support, no ticket, no phone call. Just automatic healing!

---

### Update Case: New version available

```
SCENARIO: A.R.I. v6.0.1 is available (better tools, bugfixes)

1. A.R.I. Team releases new container version
   - Image: ari:v6.0.1
   - All security patches included
   - No technical debt accumulated
   ↓
2. Automattic rolls out (Kubernetes Rolling Update)
   - Strategy: Blue-Green or RollingUpdate (doesn't matter, we have connection.json!)
   ↓
3. New container (v6.0.1) starts with:
   - Mode: update
   - Old connection.json (v6.0.0 container) as input
   ↓
4. Container checks on startup:
   - Does connection.json exist?
   - If YES: Copies it 1:1 to new version
   - If NO: Onboarding flow
   ↓
5. Old container is DELETED
   ↓
6. Customer sees:
   - Dashboard was briefly down
   - Now back with 10 new tools + bugfixes!
   - Data is exactly as before
   - ZERO DOWNTIME!
   ↓
7. Typical customer feedback:
   - "Wow, there were suddenly new features there!"
   - Didn't even notice anything happened
```

---

## 🏥 Health Checks & Recovery

### Kubernetes Health Check Konfiguration

```yaml
# Das sollte Automattic in ihren K8s-Manifests setzen:

apiVersion: apps/v1
kind: Deployment
metadata:
  name: ari-container-customer-xyz
spec:
  template:
    spec:
      containers:
      - name: ari
        image: ari:v6.0.0
        ports:
        - containerPort: 3000
        
        # LIVENESS: Ist der Container noch am Leben?
        # Falls FAILED: Kubernetes killt & restart
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30      # Warte 30s bis erste Prüfung
          periodSeconds: 10            # Prüfe alle 10s
          failureThreshold: 3          # 3x fehlgeschlagen = kill
          timeoutSeconds: 5
        
        # READINESS: Kann der Container Traffic verarbeiten?
        # Falls FAILED: Kein Traffic, aber Container läuft noch
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10      # Schneller als Liveness
          periodSeconds: 5
          failureThreshold: 2
          timeoutSeconds: 3
        
        # RESTART: Was wenn Container kaputt geht?
        restartPolicy: OnFailure       # Automatisch neustarten
        
      # REPLACEMENT: Was wenn alles kaputt geht?
      replicas: 1                      # Für Produktiv: 1 ist OK (customer=container)
      revisionHistoryLimit: 2          # Nur letzte 2 Versionen behalten
```

### Health Endpoint Implementierung

**A.R.I. muss diese Endpoints bereitstellen:**

#### `/health` (Liveness Probe)

```javascript
// Ein einfacher Health-Check
app.get('/health', (req, res) => {
  try {
    // Prüfe: Sind die wichtigsten Services up?
    const woocommerceConnected = checkWooCommerceConnection();
    const databaseAlive = checkDatabaseConnection();
    
    if (woocommerceConnected && databaseAlive) {
      res.status(200).json({ status: 'healthy' });
    } else {
      res.status(503).json({ status: 'unhealthy' });
    }
  } catch (error) {
    res.status(503).json({ status: 'error' });
  }
});
```

#### `/ready` (Readiness Probe)

```javascript
// Bin ich bereit, Requests zu verarbeiten?
app.get('/ready', (req, res) => {
  try {
    // Prüfe: Ist Frontend da? Sind Routes initialisiert?
    const frontendLoaded = checkFrontendBuild();
    const routesInitialized = checkRoutesInitialization();
    const configLoaded = checkConfigLoaded();
    
    if (frontendLoaded && routesInitialized && configLoaded) {
      res.status(200).json({ ready: true });
    } else {
      res.status(503).json({ ready: false });
    }
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});
```

### Automatische Recovery ohne Support

| Fehler | Kubernetes-Aktion | Kunde bemerkt | Support? |
|--------|------------------|---------------|----------|
| Container crashed | Restart (3x) | Kurzer Ausfall | ❌ NEIN |
| Permanent kaputt | Neuer Container | < 1 Min Downtime | ❌ NEIN |
| Out of Memory | Kill & Restart | Kurzer Ausfall | ❌ NEIN |
| Port konflikt | Neuer Port (Pod) | Transparant | ❌ NEIN |
| Netzwerk Issue | Service-Level Healing | Kurzer Ausfall | ❌ NEIN |

**Philosophie:** Der Container ist weg und Kubernetes ersetzt ihn. Nicht reparieren, ersetzen!

---

## 🔄 Update & Repair Strategy

### Minimal Docker-Compose Change

**This is the secret: Only change the `docker-compose.yml`!**

#### Normal: Deployment with New Version

```yaml
# OLD (v6.0.0)
services:
  app:
    image: ari:v6.0.0
    container_name: woo-app-prod
    # ...

# NEW (v6.0.1) - only 1 line changed!
services:
  app:
    image: ari:v6.0.1      # ← ONLY THIS LINE
    container_name: woo-app-prod
    # ...
```

**This triggers Kubernetes:**
1. Pull new image
2. Start new container (connection.json is copied)
3. Old container is deleted
4. **= Zero downtime!**

#### Repair: With old connection.json

```yaml
# If container is sick:
services:
  app:
    image: ari:v6.0.0
    container_name: woo-app-prod
    volumes:
      # connection.json from old container as volume
      - ./backup/connection.json:/app/backend/connection.json:rw
      # ← Kubernetes mounts this automatically
    environment:
      - CONTAINER_MODE=repair
    # ...
```

**Result:**
- New container starts
- Finds connection.json
- Copies it
- Customer sees nothing!

---

## 🔧 Kubernetes Integration

### What Automattic must implement

#### 1. **Webhook Listener** (Payment → Kubernetes)

```yaml
# Automattic needs this:
Endpoint: POST /webhooks/ari-deployment
Payload:
{
  "event": "subscription.created",
  "customer_id": "cust_xyz",
  "subscription_id": "sub_123",
  "shop_url": "https://customer-shop.com",
  "shop_name": "My Shop",
  "active_until": "2026-02-05",
  "container_version": "v6.0.0",
  "container_config": {
    "replicas": 1,
    "resources": {
      "requests": { "cpu": "500m", "memory": "512Mi" },
      "limits": { "cpu": "1000m", "memory": "1Gi" }
    }
  }
}

Action:
→ Create Kubernetes namespace: cust-xyz-prod
→ Create ConfigMap with subscription-info
→ Start Deployment with A.R.I. image v6.0.0
```

#### 2. **Kubernetes ConfigMap Template**

```yaml
# Automattic creates this per webhook:
apiVersion: v1
kind: ConfigMap
metadata:
  name: ari-config-cust-xyz
  namespace: cust-xyz-prod
data:
  SHOP_URL: "https://customer-shop.com"
  CUSTOMER_ID: "cust_xyz"
  SUBSCRIPTION_ID: "sub_123"
  ACTIVE_UNTIL: "2026-02-05"
  CONTAINER_MODE: "normal"
  NODE_ENV: "production"
```

#### 3. **Kubernetes Deployment Template**

```yaml
# Automattic creates this per webhook:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ari-cust-xyz
  namespace: cust-xyz-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ari-cust-xyz
  template:
    metadata:
      labels:
        app: ari-cust-xyz
        customer: cust-xyz
    spec:
      containers:
      - name: ari
        image: ari:v6.0.0  # ← Automattic sets the correct version
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: ari-config-cust-xyz
        volumeMounts:
        - name: connection-config
          mountPath: /app/backend/connection.json
          subPath: connection.json
        - name: data
          mountPath: /app/backend/data
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 2
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
      volumes:
      - name: connection-config
        configMap:
          name: ari-config-cust-xyz
      - name: data
        emptyDir: {}  # or PersistentVolumeClaim if needed
```

#### 4. **Kubernetes Service & Ingress**

```yaml
# Service (internal)
apiVersion: v1
kind: Service
metadata:
  name: ari-service-cust-xyz
  namespace: cust-xyz-prod
spec:
  selector:
    app: ari-cust-xyz
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP

---
# Ingress (external, with Let's Encrypt)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ari-ingress-cust-xyz
  namespace: cust-xyz-prod
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - ari.customer-shop.com
    secretName: ari-tls-cust-xyz
  rules:
  - host: ari.customer-shop.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ari-service-cust-xyz
            port:
              number: 80
```

### Automattic Automation Checklist

- [ ] Implement webhook listener (POST /webhooks/ari-deployment)
- [ ] Kubernetes API client (Go/Python) for deployment creation
- [ ] ConfigMap generator (from payment data)
- [ ] Ingress generator (FQDN for each customer)
- [ ] TLS/Certificate management (Let's Encrypt)
- [ ] Subscription query (for connection.json sync)
- [ ] Logging aggregation (where do container logs go?)
- [ ] Monitoring & alerting (if containers break)
- [ ] Automated backup of connection.json
- [ ] Cleanup routine (when subscription ends: delete container)

---

## 📋 Docker-Compose Reference

### Current Production docker-compose.yml (neutral and parameterized)

```yaml
version: '3.8'

services:
  app:
    image: "${IMAGE_NAME:-app-agent}:${TAG:-latest}"
    container_name: "${CONTAINER_NAME:-app-agent}"
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    environment:
      - NODE_ENV=production
    volumes:
      - ./backend/data:/app/data:rw
      - ./.env.production:/app/.env.production:ro
    networks:
      - app-network
    healthcheck:                      # ← SHOULD BE ADDED
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s

  nginx:
    image: nginx:latest
    container_name: woo-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./frontend/dist:/app/public:ro
    depends_on:
      - app
    networks:
      - app-network
    healthcheck:                      # ← SHOULD BE ADDED
      test: ["CMD", "curl", "-f", "http://localhost:80/"]
      interval: 10s
      timeout: 5s
      retries: 2
      start_period: 10s

  watchtower:
    image: containrrr/watchtower
    container_name: ki-watchtower-1
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    name: ${NETWORK_NAME:-app-network}
    driver: bridge

volumes:
  ari_data:
    driver: local
```

### ⚠️ Notes

**Current Status:**
- ❌ Health checks missing (should be added)
- ✅ Restart policy is reasonable
- ✅ Volumes for persistence are there
- ✅ Watchtower for monitoring

**Parameters:**
- `IMAGE_NAME` (default: `app-agent`), `TAG` (default: `latest`), optional `CONTAINER_NAME`
- `NETWORK_NAME` (default: `app-network`)

**Deploy Scripts:**
- Bash: `IMAGE_NAME=app-agent TAG=1.0.0 ./deploy.sh`
- PowerShell: `$env:IMAGE_NAME='app-agent'; $env:TAG='1.0.0'; ./deploy.ps1`

**For Kubernetes, Automattic needs:**
- New namespaces per customer
- PersistentVolumeClaim for `backend/data/`
- ConfigMap instead of `env_file`
- Secret for sensitive data
- Health checks (already documented above)

---

## 🆘 Disaster Recovery

### Scenario 1: connection.json is completely gone

```
Situation: Container was deleted, no backup
Solution: Customer must do Onboarding again

1. New container starts (Mode: normal)
2. connection.json is empty with placeholders
3. Customer enters data again
4. Everything is back (in < 5 minutes)

No data loss!
- WooCommerce data: In WooCommerce shop (source of truth)
- OpenAI keys: Customer has (in OpenAI account)
- Specializations: Customer can upload again
```

### Scenario 2: Container is infected/attacked

```
Situation: Malware/hack detected
Solution: Kill & replace

1. Automattic detects: Container is suspicious
2. Deletes immediately
3. Starts new one with old connection.json
4. Customer notices: Brief downtime

Everything clean, no data lost!
```

### Scenario 3: Update fails

```
Situation: New container (v6.0.1) doesn't start
Solution: Automatic rollback

1. Kubernetes sees: New version is broken
2. Health checks fail
3. Kubernetes automatically rolls back to v6.0.0
4. Service is available again

Customer notices: Brief downtime, then back
```

### Scenario 4: Subscription ends

```
Situation: Customer doesn't pay, subscription ends 2/5/2026
Solution: Clean offboarding

1. Automattic observes: Subscription ends today
2. Option 1: Container stays, shows "Subscription expired" message
3. Option 2: Container is deleted (Automattic decides)
4. Data: connection.json can be backed up upon customer request

No surprises!
```

---

## 📞 Automattic Contact

**For Kubernetes integration questions:**
- Documentation: This file (DEPLOYMENT.md)
- Requirements: Pass container version in webhook
- Health checks: Already implemented in A.R.I.
- Secrets management: Automattic decides strategy

**What Automattic can still do:**
- API endpoints for subscription status (later)
- Monitoring dashboard (logs, metrics)
- Backup strategy for connection.json
- Custom scaling (more than 1 replica per customer? → architecture change needed)

---

## 🎯 Summary: The Brilliance of the Architecture

| Aspect | Solution | Advantage |
|--------|----------|-----------|
| **Zero downtime** | Blue-Green container swap | Customer notices nothing |
| **Disaster recovery** | Kill & replace | No tedious repairs |
| **Support** | Automatic + data exchange | No tickets! |
| **Updates** | New image version | No tech debt |
| **Scaling** | 1 container = 1 customer | Isolated & clean |
| **Configuration** | connection.json | Single source of truth |
| **Kubernetes** | Simple docker-compose → K8s | Minimal adjustments |
| **DevOps** | Only change image version | Super maintainable |

**This is real IaaS with minimal overhead!**

---

**Last Updated:** January 2026  
**Version:** 7.0.3  
**For:** Automattic Engineering Team
