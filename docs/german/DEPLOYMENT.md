# 🚀 A.R.I. - Kubernetes & Deployment Architektur

**Version:** 7.0.4  
**Datum:** Januar 2026  
**Zielgruppe:** Automattic Engineering Team, DevOps, Kubernetes-Administratoren

> **Kernkonzept:** A.R.I. liefert Production-Ready Container. Automattic orchestriert alles.

---

## ⛔ Non-Goals

- A.R.I. ist kein Plugin-Marketplace.
- A.R.I. stellt keine DevOps-Oberfläche bereit.
- A.R.I. erlaubt keine kunden-seitige Änderung von Runtime- oder Sicherheitsflags.
- Spezialisierungen sind keine Feature-Bundles, sondern Verhaltensprofile.

---

## 📋 Inhaltsverzeichnis

1. [System-Architektur](#system-architektur)
2. [Container Specification](#container-specification)
3. [Container Lifecycle](#container-lifecycle)
4. [Health Checks & Recovery](#health-checks--recovery)
5. [Update & Repair Strategie](#update--repair-strategie)
6. [Kubernetes Integration](#kubernetes-integration)
7. [Docker-Compose Reference](#docker-compose-reference)
8. [Disaster Recovery](#disaster-recovery)

---

## 🏗️ System-Architektur

### High-Level Flow: Zahlungsflow → Kubernetes → Container → Kunde

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
│                                      │  │ (wenn nötig)   │  │   │
│                                      │  └────────────────┘  │   │
│                                      └──────────────────────┘   │
│                                                   │               │
│                                                   ▼               │
│  ┌───────────────┐                ┌──────────────────────┐      │
│  │    Kunde      │◀───────────────│ Link zu A.R.I.       │      │
│  │ WooCommerce   │                │ + Onboarding         │      │
│  │ Dashboard     │                │ + Bedienungsanleitung│      │
│  └───────────────┘                │ + User FAQ           │      │
│                                    │ + Social-Media Guide │      │
│                                    └──────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Container Specification

### Was muss jeder A.R.I. Container können?

#### 1. **Startup-Sequenz**

```yaml
# Zeitablauf beim Container-Start
1. Container startet (Dockerfile ENTRYPOINT)
   - Base-Services starten (Nginx, Node.js, Fastify)
   - connection.json wird geprüft
   ⚠️ WICHTIG: Shop-URL kommt NICHT von Kubernetes Environment!
      → Shop-URL wird während Onboarding vom Kunden eingegeben
      → Sie wird in connection.json persistent gespeichert

2. Je nach Zustand von connection.json:
   - connection.json LEER: Frontend zeigt Onboarding-Wizard
   - connection.json GEFÜLLT: Frontend zeigt Dashboard
   - connection.json BESCHÄDIGT: Error-Screen mit Repair-Option

3. Frontend wird ausgeliefert
   - UI lädt automatisch
   - Kunde sieht Onboarding oder Dashboard (abhängig von connection.json)

4. Health Checks starten
   - Container antwortet auf /health (Liveness)
   - Container antwortet auf /ready (Readiness)
   - Prüfung: Ist connection.json vorhanden? (für Readiness)
```

#### 2. **Connection.json Format (After Onboarding)**

**Pfad:** `backend/connection.json`

**Nach erfolgreicher Onboarding ist die Datei gefüllt:**

```json
{
  "woocommerce": {
    "url": "https://kunden-shop.de",
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
    "url": "https://kunden-shop.de",
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

**Wichtig (Single Source of Truth):** 
- `woocommerce.url` = die einzige Stelle, wo die Shop-URL gespeichert ist
- Alle Services (Backend, Frontend, Tools) lesen von hier
- Keine Umgebungsvariablen für Shop-URL
- `subscription` Teil wird von Automattic beim Deployment mitgeliefert
- Kunde füllt `woocommerce` + `openai` + `wordpress` über Onboarding
- `specializations` wird später von Kunde verwaltet

#### 3. **Erforderliche Dateien im Container**

| Datei/Ordner | Zweck | Kubernetes |
|--------------|-------|-----------|
| `/app/backend/connection.json` | Konfiguration | Neu bei Start; Kopie bei Repair |
| `/app/backend/config/` | Secrets & Config | As ConfigMap |
| `/app/frontend/dist/` | React Frontend | Build im Container |
| `/app/data/logs/` | Logs | Optional: PersistentVolume |
| `/app/.env.production` | Environment | ConfigMap/Secret |
| `/.healthcheck.js` | Health Endpoint | Must exist |

---

## 🔄 Container Lifecycle

### Normalfall: Neuer Container (Kunde bucht Abo)

```
1. ZAHLUNG BESTÄTIGT
   ↓
2. Automattic Webhook → Kubernetes API
   Payload (Beispiel):
   {
     "event": "subscription.created",
     "customer_id": "cust_12345",
     "subscription_id": "sub_67890",
     "active_until": "2026-02-05",
     "container_version": "v7.0.5"
   }
   ⚠️ WICHTIG: shop_url wird NICHT hier übergeben!
      → Shop-URL kommt später vom Kunden im Onboarding
   ↓
3. Kubernetes erstellt:
   - ConfigMap (mit subscription_id, etc. - OHNE shop_url)
   - Deployment (mit A.R.I. Container Image)
   - Service (Ingress für externe Erreichbarkeit)
   ↓
4. Container startet
   - Erstellt leere connection.json (nur mit Subscription-Info)
   - Wartet auf Kunde
   ↓
5. Frontend lädt
   - Kunde sieht: "Willkommen! Schritt 1: WooCommerce verbinden"
   - Das ist das integrierte Onboarding (Onboarding.md delivered)
   ↓
6. Kunde gibt Daten ein (im Onboarding)
   - **Shop-URL eingeben** (z.B. https://mein-shop.de)
   - WooCommerce API Keys
   - OpenAI API Key
   - Optional: Spezialisierung hochladen
   ↓
7. Connection.json wird befüllt
   - Frontend sendet Daten via POST /api/config/save
   - Backend speichert in connection.json
   - ALLE Daten stammen vom Kunden, NICHTS von Kubernetes
   ↓
8. Container ist READY
   - Health Checks green ✅
   - Alle 52 Tools verfügbar
```

---

### Repair-Fall: Container ist krank

```
SZENARIO: Container crashed, ist unerreichbar, Malware, etc.

1. Kubernetes Health Check: FAILED
   (Liveness Probe: GET /health → No Response)
   ↓
2. Kubernetes wartet 3x (default restart policy)
   ↓
3. Container ist noch immer down
   ↓
4. Automattic Orchestration (nicht A.R.I.):
   - Prüft: Gibt es noch einen alten Container?
   - Falls JA: connection.json aus altem Container extrahieren
   - Falls NEIN: Kunde muss Onboarding neu machen
   ↓
5. Kubernetes startet NEUEN Container mit:
   - Mode: repair
   - Alte connection.json (wenn vorhanden) als Volume/ConfigMap
   ↓
6. Container startet (Repair-Mode)
   - Prüft: Liegt schon connection.json vor?
   - Falls JA: Nutzt diese (Kunde merkt NICHTS!)
   - Falls NEIN: connection.json mit Platzhaltern
   ↓
7. Alter Container wird GELÖSCHT
   ↓
8. Kunde bemerkt: NICHTS
   - Dashboard war kurz weg (< 1 Minute)
   - Jetzt wieder verfügbar mit gleichen Daten
   - Zero Downtime durch Preparation
```

**Wichtig:** Kein Support, kein Ticket, kein Anruf. Nur automatisches Healing!

---

### Update-Fall: Neue Version verfügbar

```
SZENARIO: A.R.I. v7.0.5 ist verfügbar (bessere Tools, Bugfixes)

1. A.R.I. Team gibt neue Container-Version frei
   - Image: ari:v7.0.5
   - Alle Sicherheits-Patches enthalten
   - Keine technischen Schulden angehäuft
   ↓
2. Automattic rollt aus (Kubernetes Rolling Update)
   - Strategy: Blue-Green oder RollingUpdate (egal, wir haben connection.json!)
   ↓
3. Neuer Container (v7.0.5) startet mit:
   - Mode: update
   - Alte connection.json (v7.0.4 Container) als Input
   ↓
4. Container prüft auf Startup:
   - Liegt connection.json vor?
   - Falls JA: Kopiert sie 1:1 in neue Version
   - Falls NEIN: Onboarding-Flow
   ↓
5. Alter Container wird GELÖSCHT
   ↓
6. Kunde sieht:
   - Dashboard war kurz weg
   - Jetzt wieder da mit 10 neuen Tools + Bugfixes!
   - Daten sind exakt wie vorher
   - ZERO DOWNTIME!
   ↓
7. Typisches Kundenfeedback:
   - "Wow, da waren plötzlich neue Features da!"
   - Hat nicht mal mitbekommen, dass was passiert ist
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
        image: ari:v7.0.5
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

## 🔄 Update & Repair Strategie

### Minimale Docker-Compose Änderung

**Das ist das Geheimnis: Nur die `docker-compose.yml` ändern!**

#### Normal: Deployment with New Version

```yaml
# ALT (v7.0.4)
services:
  app:
    image: ari:v7.0.4
    container_name: woo-app-prod
    # ...

# NEU (v7.0.5) - nur 1 Zeile geändert!
services:
  app:
    image: ari:v7.0.5      # ← NUR DIESE ZEILE
    container_name: woo-app-prod
    # ...
```

**Das triggert Kubernetes:**
1. Pull new image
2. Start new container (connection.json wird kopiert)
3. Old container wird deleted
4. **= Zero Downtime!**

#### Repair: Mit alter connection.json

```yaml
# Wenn Container krank ist:
services:
  app:
    image: ari:v6.0.0
    container_name: woo-app-prod
    volumes:
      # connection.json aus altem Container als Volume
      - ./backup/connection.json:/app/backend/connection.json:rw
      # ← Kubernetes mountet das automatisch
    environment:
      - CONTAINER_MODE=repair
    # ...
```

**Resultat:**
- Neuer Container startet
- Findet connection.json
- Kopiert sie
- Kunde sieht nichts!

---

### Konfigurationsflags & Schreibpfade

Konfigurationsflags (z. B. Environment-Variablen, Modus-Flags, Feature-Guards)
sind **nicht kunden-seitig schaltbar**.

Sie werden ausschließlich **einmalig während der Provisionierung bzw. des
initialen Onboardings** gesetzt.

Nach Abschluss des Onboardings existiert **kein weiterer Schreibpfad**
für diese Konfigurationswerte:
- keine UI
- keine API
- keine Hintergrundjobs
- kein Live-Toggling im laufenden Container

Änderungen an diesen Flags erfordern einen **neuen Container-Deploy**
und können nur durch das A.R.I.-Team bzw. die Plattform-Orchestrierung
(z. B. Automattic) vorgenommen werden.

**Siehe**: [Ausführungsmodi (Zentrale Definition)](../german/TOOLS_DOCUMENTATION.md#ausführungsmodi-zentrale-definition) für die Übersicht, wie die REAL/FALLBACK/SIMULATION Modi diesen Flags entsprechen.

---

## 🔧 Kubernetes Integration

### Was Automattic implementieren muss

#### 1. **Webhook Listener** (Payment → Kubernetes)

```yaml
# Automattic braucht das:
Endpoint: POST /webhooks/ari-deployment
Payload:
{
  "event": "subscription.created",
  "customer_id": "cust_xyz",
  "subscription_id": "sub_123",
  "shop_url": "https://customer-shop.de",
  "shop_name": "Mein Shop",
  "active_until": "2026-02-05",
  "container_version": "v7.0.5",
  "container_config": {
    "replicas": 1,
    "resources": {
      "requests": { "cpu": "500m", "memory": "512Mi" },
      "limits": { "cpu": "1000m", "memory": "1Gi" }
    }
  }
}

Aktion:
→ Erstelle Kubernetes Namespace: cust-xyz-prod
→ Erstelle ConfigMap mit subscription-info
→ Starte Deployment mit A.R.I. Image v7.0.5
```

#### 2. **Kubernetes ConfigMap Template**

```yaml
# Automattic erstellt das per Webhook:
apiVersion: v1
kind: ConfigMap
metadata:
  name: ari-config-cust-xyz
  namespace: cust-xyz-prod
data:
  SHOP_URL: "https://customer-shop.de"
  CUSTOMER_ID: "cust_xyz"
  SUBSCRIPTION_ID: "sub_123"
  ACTIVE_UNTIL: "2026-02-05"
  CONTAINER_MODE: "normal"
  NODE_ENV: "production"
```

#### 3. **Kubernetes Deployment Template**

```yaml
# Automattic erstellt das per Webhook:
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
        image: ari:v6.0.0  # ← Automattic setzt die richtige Version
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
        emptyDir: {}  # oder PersistentVolumeClaim wenn nötig
```

#### 4. **Kubernetes Service & Ingress**

```yaml
# Service (intern)
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
# Ingress (extern, mit Let's Encrypt)
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
    - ari.customer-shop.de
    secretName: ari-tls-cust-xyz
  rules:
  - host: ari.customer-shop.de
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

- [ ] Webhook-Listener implementieren (POST /webhooks/ari-deployment)
- [ ] Kubernetes API Client (Go/Python) für Deployment-Erstellung
- [ ] ConfigMap-Generator (aus Zahlungsdaten)
- [ ] Ingress-Generator (FQDN für jeden Kunden)
- [ ] TLS/Certificate Management (Let's Encrypt)
- [ ] Subscription-Abfrage (für connection.json sync)
- [ ] Logging Aggregation (wo landen die Container-Logs?)
- [ ] Monitoring & Alerting (falls Container kaputt gehen)
- [ ] Automated Backup von connection.json
- [ ] Cleanup-Routine (wenn Abo endet: Container löschen)

---

## 📋 Docker-Compose Reference

### Aktuelle Production docker-compose.yml (neutral und parametrisierbar)

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
    healthcheck:                      # ← SOLLTE HINZUGEFÜGT WERDEN
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
    healthcheck:                      # ← SOLLTE HINZUGEFÜGT WERDEN
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

### ⚠️ Hinweise

**Aktuelle Status:**
- ❌ Health Checks fehlen (sollten hinzugefügt werden)
- ✅ Restart Policy ist sinnvoll
- ✅ Volumes für Persistenz sind da
- ✅ Watchtower für Monitoring

**Parameter:**
- `IMAGE_NAME` (Default: `app-agent`), `TAG` (Default: `latest`), optional `CONTAINER_NAME`
- `NETWORK_NAME` (Default: `app-network`)

**Deploy-Skripte:**
- Bash: `IMAGE_NAME=app-agent TAG=1.0.0 ./deploy.sh`
- PowerShell: `$env:IMAGE_NAME='app-agent'; $env:TAG='1.0.0'; ./deploy.ps1`

**Für Kubernetes braucht Automattic:**
- Neue Namespaces pro Kunde
- PersistentVolumeClaim für `backend/data/`
- ConfigMap statt `env_file`
- Secret für sensitive Daten
- Health Checks (sind schon oben dokumentiert)

---

## 🆘 Disaster Recovery

### Szenario 1: connection.json ist komplett weg

```
Situation: Container wurde gelöscht, kein Backup
Lösung: Kunde muss Onboarding erneut machen

1. Neuer Container startet (Mode: normal)
2. connection.json ist leer mit Platzhaltern
3. Kunde gibt Daten erneut ein
4. Alles ist wieder da (in < 5 Minuten)

Kein Datenverlust!
- WooCommerce Daten: Sind in WooCommerce Shop (Quelle der Wahrheit)
- OpenAI Keys: Hat Kunde selbst (in OpenAI Account)
- Spezialisierungen: Kann Kunde erneut hochladen
```

### Szenario 2: Container ist infiziert/angegriffen

```
Situation: Malware/Hack erkannt
Lösung: Kill & Replace

1. Automattic erkennt: Container ist verdächtig
2. Löscht sofort den Container
3. Startet Neuen mit alter connection.json
4. Kunde merkt: Kurzer Ausfall

Alles sauber, keine Daten verloren!
```

### Szenario 3: Update schlägt fehl

```
Situation: Neuer Container (v6.0.1) startet nicht
Lösung: Automatisches Rollback

1. Kubernetes sieht: Neue Version ist kaputt
2. Health Checks schlagen fehl
3. Kubernetes rollt automatisch zurück zu v6.0.0
4. Service ist wieder verfügbar

Kunde merkt: Kurzer Ausfall, dann wieder da
```

### Szenario 4: Abo läuft ab

```
Situation: Kunde zahlt nicht, Abo endet am 5.2.2026
Lösung: Sauberes Offboarding

1. Automattic beobachtet: Abo endet heute
2. Option 1: Container bleibt, zeigt "Abo abgelaufen" Message
3. Option 2: Container wird deleted (Automattic entscheidet)
4. Daten: connection.json kann auf Kundenrequest backed up werden

Keine Überraschungen!
```

---

## 📞 Automattic Kontakt

**Für Fragen zur Kubernetes-Integration:**
- Documentation: Diese Datei (DEPLOYMENT.md)
- Anforderungen: Container-Version im Webhook mitteilen
- Health Checks: Schon implementiert in A.R.I.
- Secrets Management: Automattic entscheidet die Strategie

**Was Automattic noch tun kann:**
- API Endpoints für Subscription-Status (später)
- Monitoring Dashboard (logs, metrics)
- Backup-Strategie für connection.json
- Custom Scaling (mehr als 1 Replica pro Kunde? → Architektur-Change nötig)

---

## 🎯 Zusammenfassung: Die Genialität der Architektur

| Aspekt | Lösung | Vorteil |
|--------|--------|---------|
| **Zero Downtime** | Blue-Green Container-Swap | Kunde merkt nichts |
| **Disaster Recovery** | Kill & Replace | Keine aufwendigen Repairs |
| **Support** | Automatisch + Datenaustausch | Keine Tickets! |
| **Updates** | Neue Image-Version | Keine tech. Schulden |
| **Skalierung** | 1 Container = 1 Kunde | Isoliert & sauber |
| **Konfiguration** | connection.json | Single Source of Truth |
| **Kubernetes** | Einfache Docker-Compose → K8s | Minimale Anpassungen |
| **DevOps** | Nur Image-Version ändern | Super wartbar |

**Das ist echtes IaaS mit minimalem Overhead!**

---

**Letzte Aktualisierung:** Januar 2026  
**Version:** 7.0.4  
**Für:** Automattic Engineering Team
