# Deployment Guide - WooCommerce AI Agent

## Übersicht

Dieser Guide beschreibt das vollständige Deployment des WooCommerce AI Agent Systems in einer Production-Umgebung. Das System läuft in Docker-Containern und ist optimiert für einen dedizierten Server.

---

## 1. Server-Anforderungen

### 1.1 Dedizierter Agent-Server

**Wichtig**: WordPress und WooCommerce laufen auf einem **separaten Server**. Der Agent-Server ist ausschließlich für den AI Agent reserviert.

**Minimale Spezifikationen**:
- **vCPU**: 3 Cores
- **RAM**: 4 GB
- **Disk**: 80 GB SSD
- **OS**: Ubuntu 22.04 LTS / Debian 12 / Rocky Linux 9
- **Docker**: Version 24.0+
- **Docker Compose**: Version 2.20+

**Ressourcen-Aufteilung**:
```
┌─────────────────────────────────────┐
│  Server: 3 vCPU, 4 GB RAM           │
├─────────────────────────────────────┤
│  AI Agent:                          │
│  - Average: 1.2 GB RAM, 20-40% CPU  │
│  - Peak:    2.5 GB RAM, 80% CPU     │
│                                     │
│  Headroom: ~1.5 GB RAM, 1 vCPU      │
│  - OS Overhead                      │
│  - Docker Overhead                  │
│  - Monitoring Tools                 │
└─────────────────────────────────────┘
```

**Warum diese Specs ausreichen**:
- ✅ Kein WordPress/WooCommerce auf diesem Server
- ✅ Nur AI Agent + Error-Handling + Jobs
- ✅ Node.js optimiert mit `--max-old-space-size=2048`
- ✅ Circuit Breaker verhindert Ressourcen-Verschwendung
- ✅ Connection Pooling reduziert Memory-Usage

### 1.2 Netzwerk-Anforderungen

**Outbound Connections**:
- WordPress Server (REST API): Port 443 (HTTPS)
- WooCommerce Server (REST API): Port 443 (HTTPS)
- OpenAI API: Port 443 (HTTPS)
- SMTP Server (Email Alerts): Port 587 (TLS)
- Slack Webhooks: Port 443 (HTTPS)

**Inbound Connections** (Optional):
- Frontend Dashboard: Port 3000 (kann hinter Reverse Proxy)
- Health Check: Port 3000 (intern)

**Firewall Rules**:
```bash
# Allow HTTPS Outbound
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT

# Allow SMTP Outbound
iptables -A OUTPUT -p tcp --dport 587 -j ACCEPT

# Allow Frontend (Optional, hinter Reverse Proxy)
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

---

## 2. Pre-Deployment Setup

### 2.1 System-Vorbereitung

**1. System Updates**:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Rocky Linux/CentOS
sudo dnf update -y
```

**2. Docker Installation**:
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

**3. Git Installation** (für Code-Updates):
```bash
sudo apt install git -y
```

**4. Verzeichnisse erstellen**:
```bash
mkdir -p /opt/woo-ki-agent
mkdir -p /opt/woo-ki-agent/data
mkdir -p /opt/woo-ki-agent/logs
mkdir -p /opt/woo-ki-agent/data/dlq

# Permissions
sudo chown -R $USER:$USER /opt/woo-ki-agent
```

### 2.2 Repository klonen

```bash
cd /opt/woo-ki-agent
git clone https://github.com/AndreZ1971/ki.git .
```

---

## 3. Environment Configuration

### 3.1 Production Environment Variables

**Datei**: `.env.production`

```bash
# ==========================================
# PRODUCTION ENVIRONMENT VARIABLES
# ==========================================

# ---- Node Environment ----
NODE_ENV=production
LOG_LEVEL=info

# ---- OpenAI API ----
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
# Get from: https://platform.openai.com/api-keys

# ---- WooCommerce API ----
WOOCOMMERCE_URL=https://dein-shop.de
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Get from: WooCommerce → Settings → Advanced → REST API

# ---- WordPress API ----
WORDPRESS_URL=https://dein-shop.de
WORDPRESS_USER=admin
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
# Get from: WordPress → Users → Application Passwords

# ---- Email Alerting (SMTP) ----
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=alerts@dein-shop.de
SMTP_PASS=xxxxxxxxxxxxxxxx
ALERT_EMAIL_FROM=alerts@dein-shop.de
ALERT_EMAIL_TO=admin@dein-shop.de
# For Gmail: Use App Password (https://myaccount.google.com/apppasswords)

# ---- Slack Alerting (Optional) ----
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
# Get from: Slack → Apps → Incoming Webhooks

# ---- Custom Webhook Alerting (Optional) ----
WEBHOOK_URL=https://your-monitoring-service.com/webhook
# For custom monitoring integrations

# ---- Circuit Breaker Configuration (Optional) ----
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60000
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2

# ---- Dead Letter Queue Configuration (Optional) ----
DLQ_MAX_RETRIES=3
DLQ_RETRY_DELAY=300000

# ---- Server Configuration ----
PORT=3000
HOST=0.0.0.0

# ---- Rate Limiting (Optional) ----
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

**Sicherheitshinweis**:
```bash
# Permissions setzen
chmod 600 .env.production

# Nie in Git committen!
echo ".env.production" >> .gitignore
```

### 3.2 Environment Variable Validation

**Validierungs-Script** (`scripts/validate-env.sh`):
```bash
#!/bin/bash

echo "🔍 Validating environment variables..."

# Required Variables
REQUIRED_VARS=(
  "OPENAI_API_KEY"
  "WOOCOMMERCE_URL"
  "WOOCOMMERCE_CONSUMER_KEY"
  "WOOCOMMERCE_CONSUMER_SECRET"
  "WORDPRESS_URL"
  "WORDPRESS_USER"
  "WORDPRESS_APP_PASSWORD"
)

# Load .env.production
source .env.production

# Check each variable
MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
    MISSING=1
  else
    echo "✅ Found: $var"
  fi
done

if [ $MISSING -eq 1 ]; then
  echo ""
  echo "❌ Validation failed. Please set missing variables in .env.production"
  exit 1
else
  echo ""
  echo "✅ All required environment variables are set!"
  exit 0
fi
```

**Ausführen**:
```bash
chmod +x scripts/validate-env.sh
./scripts/validate-env.sh
```

---

## 4. Docker Deployment

### 4.1 Docker Configuration

**Dockerfile** (bereits vorhanden):
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build TypeScript
RUN npm run build

# Health check
COPY healthcheck.ts ./
RUN npx tsc healthcheck.ts

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "--max-old-space-size=2048", "dist/server.js"]
```

**docker-compose.yml** (bereits vorhanden):
```yaml
version: '3.8'

services:
  ki-agent:
    build: .
    container_name: woo-ki-agent
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    env_file:
      - .env.production
    volumes:
      - ./data:/app/data:rw
      - ./logs:/app/logs:rw
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    ports:
      - "3000:3000"

  # Optional: Watchtower für automatische Updates
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup
    restart: unless-stopped
```

### 4.2 Build & Deploy

**1. Build Docker Image**:
```bash
cd /opt/woo-ki-agent
docker-compose build --no-cache
```

**2. Start Containers**:
```bash
docker-compose up -d
```

**3. Verify**:
```bash
# Check Container Status
docker-compose ps

# Check Logs
docker-compose logs -f ki-agent

# Check Health
curl http://localhost:3000/api/health
```

**Expected Output**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T10:00:00.000Z",
  "uptime": 123.456,
  "memory": {
    "used": 1200000000,
    "total": 4000000000
  }
}
```

### 4.3 Container Management

**Stop Containers**:
```bash
docker-compose down
```

**Restart Containers**:
```bash
docker-compose restart
```

**View Logs**:
```bash
# All logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100 ki-agent

# Since timestamp
docker-compose logs --since 2025-11-01T10:00:00
```

**Access Container Shell**:
```bash
docker exec -it woo-ki-agent sh
```

---

## 5. Watchtower - Auto-Updates

### 5.1 Watchtower Konfiguration

**Was ist Watchtower?**
- Automatische Docker Image Updates
- Überwacht Docker Hub / GitHub Container Registry
- Pulled neue Images und startet Container neu

**Konfiguration in docker-compose.yml**:
```yaml
watchtower:
  image: containrrr/watchtower
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  command: --interval 300 --cleanup
  restart: unless-stopped
  environment:
    - WATCHTOWER_CLEANUP=true
    - WATCHTOWER_INCLUDE_STOPPED=false
    - WATCHTOWER_POLL_INTERVAL=300  # 5 Minuten
```

**Manuelle Trigger**:
```bash
# Force check now
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --run-once \
  woo-ki-agent
```

### 5.2 Update Strategy

**Rolling Updates**:
1. Watchtower checkt alle 5 Minuten
2. Neues Image verfügbar → Pull
3. Stop alter Container
4. Start neuer Container
5. Health Check
6. Cleanup altes Image

**Zero-Downtime Updates** (Optional):
```yaml
ki-agent:
  deploy:
    update_config:
      parallelism: 1
      delay: 10s
      order: start-first
  healthcheck:
    test: ["CMD", "node", "healthcheck.js"]
    interval: 10s
    timeout: 5s
    retries: 3
```

---

## 6. Monitoring & Alerting Setup

### 6.1 Error-Handling Monitoring

**Circuit Breaker Status**:
```bash
# API Endpoint
curl http://localhost:3000/api/error-handling/circuit-breakers

# Expected Response
{
  "wooCommerce": {
    "state": "CLOSED",
    "failures": 0,
    "successes": 125
  },
  "wordPress": {
    "state": "CLOSED",
    "failures": 1,
    "successes": 98
  },
  "openAI": {
    "state": "CLOSED",
    "failures": 0,
    "successes": 45
  }
}
```

**Dead Letter Queue Stats**:
```bash
# API Endpoint
curl http://localhost:3000/api/error-handling/dlq/stats

# Expected Response
{
  "totalMessages": 3,
  "readyForRetry": 1,
  "messagesByJobType": {
    "createProduct": 2,
    "sendEmail": 1
  }
}
```

### 6.2 Email Alerting Setup

**SMTP Testing**:
```bash
# Test Email
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "admin@dein-shop.de", "subject": "Test Alert"}'
```

**Gmail SMTP Setup**:
1. Enable 2-Factor Authentication
2. Create App Password: https://myaccount.google.com/apppasswords
3. Use App Password in `.env.production`:
   ```
   SMTP_USER=alerts@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```

**Alert Types**:
- **CRITICAL**: Payment Failures, API Outages
- **ERROR**: Job Failures, Circuit Breaker OPEN
- **WARNING**: High Memory, Slow Responses
- **INFO**: Successful Deployments, Daily Reports

### 6.3 Slack Alerting Setup

**1. Create Slack App**:
- Go to: https://api.slack.com/apps
- Create New App → From Scratch
- App Name: "WooCommerce AI Agent"
- Workspace: Your Workspace

**2. Enable Incoming Webhooks**:
- Features → Incoming Webhooks → Activate
- Add New Webhook to Workspace
- Select Channel: #alerts
- Copy Webhook URL

**3. Configure in `.env.production`**:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

**4. Test**:
```bash
curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text": "🚀 AI Agent deployed successfully!"}'
```

**Alert Format**:
```json
{
  "text": "🔴 CRITICAL: Payment Failure",
  "attachments": [{
    "color": "danger",
    "fields": [
      {"title": "Error", "value": "WooCommerce API Timeout"},
      {"title": "Order ID", "value": "12345"},
      {"title": "Timestamp", "value": "2025-11-01 10:30:00"}
    ]
  }]
}
```

---

## 7. Health Checks & Monitoring

### 7.1 Docker Health Check

**Konfiguration** (in docker-compose.yml):
```yaml
healthcheck:
  test: ["CMD", "node", "healthcheck.js"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Health Check Script** (`healthcheck.ts`):
```typescript
// Simple HTTP check
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0); // Healthy
  } else {
    process.exit(1); // Unhealthy
  }
});

req.on('error', () => process.exit(1));
req.on('timeout', () => process.exit(1));
req.end();
```

**Check Status**:
```bash
docker inspect --format='{{.State.Health.Status}}' woo-ki-agent
# Output: healthy / unhealthy / starting
```

### 7.2 System Monitoring

**API Endpoints**:

**1. Health Check**:
```bash
GET /api/health
```

**2. System Stats**:
```bash
GET /api/system/health/system

{
  "status": "healthy",
  "uptime": 86400,
  "memory": {
    "used": 1200000000,
    "total": 4000000000,
    "percentage": 30
  },
  "cpu": {
    "usage": 25.5
  }
}
```

**3. Memory Stats**:
```bash
GET /api/system/memory/memory

{
  "totalMessages": 1250,
  "memorySize": 5242880,
  "oldestMessage": "2025-11-01T00:00:00.000Z"
}
```

### 7.3 Log Monitoring

**Log Files**:
```
/opt/woo-ki-agent/logs/
├── app.log              # Application Logs
├── error.log            # Error Logs
├── access.log           # HTTP Access Logs
└── dlq/                 # Dead Letter Queue Logs
    ├── failed-job-1.json
    └── failed-job-2.json
```

**Log Rotation** (mit Logrotate):
```bash
# /etc/logrotate.d/woo-ki-agent
/opt/woo-ki-agent/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    sharedscripts
    postrotate
        docker-compose -f /opt/woo-ki-agent/docker-compose.yml restart ki-agent
    endscript
}
```

---

## 8. Backup & Recovery

### 8.1 Backup Strategy

**Was muss gesichert werden?**
1. **Dead Letter Queue**: `/opt/woo-ki-agent/data/dlq/`
2. **Logs**: `/opt/woo-ki-agent/logs/`
3. **Environment Variables**: `.env.production`
4. **Docker Volumes**: `data/`, `logs/`

**Backup Script** (`scripts/backup.sh`):
```bash
#!/bin/bash

BACKUP_DIR="/opt/backups/woo-ki-agent"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"

mkdir -p $BACKUP_DIR

echo "🗂️ Creating backup..."

tar -czf $BACKUP_FILE \
  -C /opt/woo-ki-agent \
  data/ \
  logs/ \
  .env.production

echo "✅ Backup created: $BACKUP_FILE"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete
```

**Cron Job** (täglich um 2 Uhr):
```bash
crontab -e

# Add:
0 2 * * * /opt/woo-ki-agent/scripts/backup.sh
```

### 8.2 Disaster Recovery

**Restore Backup**:
```bash
#!/bin/bash

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup-file>"
  exit 1
fi

echo "🔄 Restoring from: $BACKUP_FILE"

# Stop containers
docker-compose down

# Extract backup
tar -xzf $BACKUP_FILE -C /opt/woo-ki-agent

# Restart containers
docker-compose up -d

echo "✅ Restore complete!"
```

**Recovery Steps**:
1. Stop Container: `docker-compose down`
2. Restore Backup: `./scripts/restore.sh backup_20251101_020000.tar.gz`
3. Verify Environment: `./scripts/validate-env.sh`
4. Start Container: `docker-compose up -d`
5. Check Health: `curl http://localhost:3000/api/health`

---

## 9. Troubleshooting

### 9.1 Common Issues

#### **Container startet nicht**

**Symptom**: `docker-compose up -d` failed

**Debug**:
```bash
# Check logs
docker-compose logs ki-agent

# Check environment
docker-compose config

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

**Häufige Ursachen**:
- ❌ Missing Environment Variables → Run `./scripts/validate-env.sh`
- ❌ Port 3000 bereits belegt → `lsof -i :3000` und Process killen
- ❌ Docker Disk Full → `docker system prune -a`

#### **Circuit Breaker OPEN**

**Symptom**: API Calls schlagen fehl mit "Circuit Breaker OPEN"

**Debug**:
```bash
# Check Circuit Breaker Status
curl http://localhost:3000/api/error-handling/circuit-breakers

# Check External API
curl https://dein-shop.de/wp-json/wc/v3/products
```

**Fix**:
1. Prüfe External API Status (WooCommerce/WordPress erreichbar?)
2. Checke Credentials in `.env.production`
3. Warte auf Auto-Recovery (60 Sekunden)
4. Manuelles Reset: Container restart

#### **High Memory Usage**

**Symptom**: Container verwendet >3 GB RAM

**Debug**:
```bash
# Docker Stats
docker stats woo-ki-agent

# Memory Stats API
curl http://localhost:3000/api/system/memory/memory
```

**Fix**:
```bash
# Increase Node.js Heap Size
# In Dockerfile:
CMD ["node", "--max-old-space-size=3072", "dist/server.js"]

# Rebuild & Restart
docker-compose build --no-cache
docker-compose restart
```

#### **DLQ voll mit Failed Jobs**

**Symptom**: Viele Jobs in Dead Letter Queue

**Debug**:
```bash
# Check DLQ Stats
curl http://localhost:3000/api/error-handling/dlq/stats

# List Failed Jobs
ls -la /opt/woo-ki-agent/data/dlq/
```

**Fix**:
1. Prüfe Job-Errors in DLQ Files
2. Korrigiere Job-Parameter
3. Manuelle Retry:
   ```bash
   curl -X POST http://localhost:3000/api/error-handling/dlq/retry
   ```
4. DLQ bereinigen:
   ```bash
   rm -rf /opt/woo-ki-agent/data/dlq/*
   docker-compose restart
   ```

### 9.2 Log Analysis

**Error Logs durchsuchen**:
```bash
# All Errors
grep "ERROR" /opt/woo-ki-agent/logs/error.log

# Circuit Breaker Events
grep "Circuit Breaker" /opt/woo-ki-agent/logs/app.log

# Failed Jobs
grep "Job Failed" /opt/woo-ki-agent/logs/app.log

# API Errors
grep "API Error" /opt/woo-ki-agent/logs/error.log
```

**Docker Logs**:
```bash
# Real-time
docker-compose logs -f ki-agent

# Filter by Error
docker-compose logs ki-agent | grep ERROR

# Last 24 hours
docker-compose logs --since 24h ki-agent
```

---

## 10. Performance Tuning

### 10.1 Node.js Optimierung

**Heap Size**:
```dockerfile
# Dockerfile
CMD ["node", "--max-old-space-size=2048", "dist/server.js"]
```

**Garbage Collection**:
```dockerfile
CMD ["node", 
  "--max-old-space-size=2048",
  "--gc-interval=100",
  "dist/server.js"]
```

### 10.2 Circuit Breaker Tuning

**Aggressive** (weniger Ausfälle tolerieren):
```env
CIRCUIT_BREAKER_THRESHOLD=3         # 3 Fehler bis OPEN
CIRCUIT_BREAKER_TIMEOUT=30000       # 30s bis HALF_OPEN
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=3 # 3 Erfolge bis CLOSED
```

**Conservative** (mehr Ausfälle tolerieren):
```env
CIRCUIT_BREAKER_THRESHOLD=10        # 10 Fehler bis OPEN
CIRCUIT_BREAKER_TIMEOUT=120000      # 2min bis HALF_OPEN
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=5 # 5 Erfolge bis CLOSED
```

### 10.3 Connection Pooling

**HTTP Keep-Alive Agents** (bereits aktiviert):
```typescript
// In backend/tools/woo.ts & wp.ts
const KEEP_ALIVE_HTTP = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000
});
```

---

## 11. Security Hardening

### 11.1 Docker Security

**Non-Root User**:
```dockerfile
# Dockerfile
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Switch to non-root user
USER nodejs

WORKDIR /app
```

**Read-Only Root Filesystem**:
```yaml
# docker-compose.yml
ki-agent:
  security_opt:
    - no-new-privileges:true
  read_only: true
  tmpfs:
    - /tmp
    - /app/logs
```

### 11.2 Network Security

**Firewall Rules**:
```bash
# UFW (Ubuntu Firewall)
sudo ufw allow 22/tcp        # SSH
sudo ufw allow 3000/tcp      # Frontend (Optional)
sudo ufw enable
```

**Docker Network Isolation**:
```yaml
# docker-compose.yml
networks:
  agent-network:
    driver: bridge
    internal: true

services:
  ki-agent:
    networks:
      - agent-network
```

### 11.3 Secrets Management

**Docker Secrets** (Docker Swarm):
```yaml
secrets:
  openai_key:
    external: true
  woo_consumer_key:
    external: true

services:
  ki-agent:
    secrets:
      - openai_key
      - woo_consumer_key
```

**Vault Integration** (HashiCorp Vault):
```bash
# Install Vault
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt install vault

# Store Secret
vault kv put secret/woo-ki-agent \
  openai_key="sk-..." \
  woo_consumer_key="ck_..."
```

---

## 12. Scaling & High Availability

### 12.1 Horizontal Scaling

**Docker Compose Scale**:
```bash
docker-compose up --scale ki-agent=3 -d
```

**Load Balancer** (Nginx):
```nginx
upstream ki-agent {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    location / {
        proxy_pass http://ki-agent;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 12.2 Database Integration (Future)

**PostgreSQL** für Persistent Storage:
```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data

  ki-agent:
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/ki_agent
```

---

## 13. Production Checklist

### 13.1 Pre-Deployment

- [ ] Server-Spezifikationen erfüllt (3 vCPU, 4 GB RAM, 80 GB Disk)
- [ ] Docker & Docker Compose installiert
- [ ] `.env.production` vollständig konfiguriert
- [ ] Environment Variables validiert (`./scripts/validate-env.sh`)
- [ ] WooCommerce API erreichbar (Test)
- [ ] WordPress API erreichbar (Test)
- [ ] OpenAI API Key gültig (Test)
- [ ] SMTP Server konfiguriert (Email-Test)
- [ ] Slack Webhook konfiguriert (Optional)
- [ ] Backup-Strategie definiert
- [ ] Firewall Rules konfiguriert

### 13.2 Post-Deployment

- [ ] Container läuft (`docker-compose ps`)
- [ ] Health Check erfolgreich (`curl /api/health`)
- [ ] Error-Handling aktiv (Logs prüfen)
- [ ] Circuit Breaker CLOSED (API Check)
- [ ] DLQ leer (`curl /api/error-handling/dlq/stats`)
- [ ] Email Alerts funktionieren (Test-Email)
- [ ] Slack Alerts funktionieren (Test-Message)
- [ ] Watchtower aktiv (Auto-Update Check)
- [ ] Log Rotation konfiguriert
- [ ] Backup Cron Job aktiv
- [ ] Monitoring Dashboard erreichbar (Optional)

### 13.3 Ongoing Maintenance

**Daily**:
- [ ] Check Container Status
- [ ] Review Error Logs
- [ ] Check DLQ Stats

**Weekly**:
- [ ] Review Circuit Breaker Stats
- [ ] Analyze Alert History
- [ ] Check Disk Space

**Monthly**:
- [ ] Update Docker Images
- [ ] Review Backup Strategy
- [ ] Security Audit
- [ ] Performance Review

---

## 14. Support & Resources

### 14.1 Documentation

- **Architecture**: `docs/architecture.md`
- **API Reference**: `docs/api/`
- **Workflows**: `docs/workflows/`
- **Error Handling**: `backend/error-handling/README.md`

### 14.2 Monitoring URLs

- **Health Check**: `http://localhost:3000/api/health`
- **System Stats**: `http://localhost:3000/api/system/health/system`
- **Circuit Breakers**: `http://localhost:3000/api/error-handling/circuit-breakers`
- **DLQ Stats**: `http://localhost:3000/api/error-handling/dlq/stats`
- **Swagger API Docs**: `http://localhost:3000/docs`

### 14.3 Contact

**GitHub**: https://github.com/AndreZ1971/ki  
**Issues**: https://github.com/AndreZ1971/ki/issues  
**Version**: 1.8.0  
**Last Update**: November 2025

---

## Zusammenfassung

Dieses Deployment-Setup bietet:

✅ **Production-Ready**: Docker + Watchtower + Health Checks  
✅ **Resilient**: Circuit Breaker + Retry + DLQ  
✅ **Monitored**: Multi-Channel Alerting (Email + Slack)  
✅ **Secure**: Environment Variables + Secrets Management  
✅ **Scalable**: Horizontal Scaling + Load Balancing  
✅ **Maintainable**: Automated Backups + Log Rotation  

**Optimiert für**: 3 vCPU, 4 GB RAM, 80 GB Disk (Dedizierter Agent-Server)

**Ready for Production Deployment! 🚀**
