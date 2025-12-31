# Deployment Guide - WooCommerce AI Agent

## Overview

This guide describes the full deployment of the WooCommerce AI Agent system in a production environment. The system runs in Docker containers and is optimized for a dedicated server.

---

## 1. Server requirements

### 1.1 Dedicated agent server

**Important**: WordPress and WooCommerce run on a **separate server**. The agent server is reserved solely for the AI Agent.

**Minimum specs**:
- **vCPU**: 3 cores
- **RAM**: 4 GB
- **Disk**: 80 GB SSD
- **OS**: Ubuntu 22.04 LTS / Debian 12 / Rocky Linux 9
- **Docker**: version 24.0+
- **Docker Compose**: version 2.20+

**Resource allocation**:
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

**Why these specs are sufficient**:
- ✅ No WordPress/WooCommerce on this server
- ✅ Only AI Agent + error handling + jobs
- ✅ Node.js optimized with `--max-old-space-size=2048`
- ✅ Circuit breaker prevents resource waste
- ✅ Connection pooling reduces memory usage

### 1.2 Network requirements

**Outbound connections**:
- WordPress server (REST API): port 443 (HTTPS)
- WooCommerce server (REST API): port 443 (HTTPS)
- OpenAI API: port 443 (HTTPS)
- SMTP server (email alerts): port 587 (TLS)
- Slack webhooks: port 443 (HTTPS)

**Inbound connections** (optional):
- Frontend dashboard: port 3000 (can sit behind reverse proxy)
- Health check: port 3000 (internal)

**Firewall rules**:
```bash
# Allow HTTPS Outbound
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT

# Allow SMTP Outbound
iptables -A OUTPUT -p tcp --dport 587 -j ACCEPT

# Allow Frontend (optional, behind reverse proxy)
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

---

## 2. Pre-deployment setup

### 2.1 System preparation

**1. System updates**:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Rocky Linux/CentOS
sudo dnf update -y
```

**2. Install Docker**:
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

**3. Install Git** (for code updates):
```bash
sudo apt install git -y
```

**4. Create directories**:
```bash
mkdir -p /opt/woo-ki-agent
mkdir -p /opt/woo-ki-agent/data
mkdir -p /opt/woo-ki-agent/logs
mkdir -p /opt/woo-ki-agent/data/dlq

# Permissions
sudo chown -R $USER:$USER /opt/woo-ki-agent
```

### 2.2 Clone repository

```bash
cd /opt/woo-ki-agent
git clone https://github.com/AndreZ1971/ki.git .
```

---

## 3. Environment configuration

### 3.1 Production environment variables

**File**: `.env.production`

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

**Security note**:
```bash
# Set permissions
chmod 600 .env.production

# Nie in Git committen!
echo ".env.production" >> .gitignore
```

### 3.2 Environment variable validation

**Validation script** (`scripts/validate-env.sh`):
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

**Run**:
```bash
chmod +x scripts/validate-env.sh
./scripts/validate-env.sh
```

---

## 4. Docker deployment

### 4.1 Docker configuration

**Dockerfile** (already provided):
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

**docker-compose.yml** (already provided):
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

  # Optional: Watchtower for automatic updates
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup
    restart: unless-stopped
```

### 4.2 Build & deploy

**1. Build Docker image**:
```bash
cd /opt/woo-ki-agent
docker-compose build --no-cache
```

**2. Start containers**:
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

**Expected output**:
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

### 4.3 Container management

**Stop containers**:
```bash
docker-compose down
```

**Restart containers**:
```bash
docker-compose restart
```

**View logs**:
```bash
# All logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100 ki-agent

# Since timestamp
docker-compose logs --since 2025-11-01T10:00:00
```

**Access container shell**:
```bash
docker exec -it woo-ki-agent sh
```

---

## 5. Watchtower - auto-updates

### 5.1 Watchtower configuration

**What is Watchtower?**
- Automatic Docker image updates
- Monitors Docker Hub / GitHub Container Registry
- Pulls new images and restarts containers

**Configuration in docker-compose.yml**:
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
    - WATCHTOWER_POLL_INTERVAL=300  # 5 minutes
```

**Manual trigger**:
```bash
# Force check now
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --run-once \
  woo-ki-agent
```

### 5.2 Update strategy

**Rolling updates**:
1. Watchtower checks every 5 minutes
2. New image available → pull
3. Stop old container
4. Start new container
5. Health check
6. Cleanup old image

**Zero-downtime updates** (optional):
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

## 6. Monitoring & alerting setup

### 6.1 Error-handling monitoring

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

### 6.2 Email alerting setup

**SMTP testing**:
```bash
# Test Email
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "admin@dein-shop.de", "subject": "Test Alert"}'
```

**Gmail SMTP setup**:
1. Enable 2-factor authentication
2. Create app password: https://myaccount.google.com/apppasswords
3. Use app password in `.env.production`:
   ```
   SMTP_USER=alerts@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```

**Alert types**:
- **CRITICAL**: payment failures, API outages
- **ERROR**: job failures, circuit breaker OPEN
- **WARNING**: high memory, slow responses
- **INFO**: successful deployments, daily reports

### 6.3 Slack alerting setup

**1. Create Slack app**:
- Go to: https://api.slack.com/apps
- Create new app → From Scratch
- App name: "WooCommerce AI Agent"
- Workspace: your workspace

**2. Enable incoming webhooks**:
- Features → Incoming Webhooks → Activate
- Add new webhook to workspace
- Select channel: #alerts
- Copy webhook URL

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

**Alert format**:
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

## 7. Health checks & monitoring

### 7.1 Docker health check

**Configuration** (in docker-compose.yml):
```yaml
healthcheck:
  test: ["CMD", "node", "healthcheck.js"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Health check script** (`healthcheck.ts`):
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

**Check status**:
```bash
docker inspect --format='{{.State.Health.Status}}' woo-ki-agent
# Output: healthy / unhealthy / starting
```

### 7.2 System monitoring

**API endpoints**:

**1. Health check**:
```bash
GET /api/health
```

**2. System stats**:
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

**3. Memory stats**:
```bash
GET /api/system/memory/memory

{
  "totalMessages": 1250,
  "memorySize": 5242880,
  "oldestMessage": "2025-11-01T00:00:00.000Z"
}
```

### 7.3 Log monitoring

**Log files**:
```
/opt/woo-ki-agent/logs/
├── app.log              # Application Logs
├── error.log            # Error Logs
├── access.log           # HTTP Access Logs
└── dlq/                 # Dead Letter Queue Logs
    ├── failed-job-1.json
    └── failed-job-2.json
```

**Log rotation** (with logrotate):
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

## 8. Backup & recovery

### 8.1 Backup strategy

**What needs to be backed up?**
1. **Dead Letter Queue**: `/opt/woo-ki-agent/data/dlq/`
2. **Logs**: `/opt/woo-ki-agent/logs/`
3. **Environment variables**: `.env.production`
4. **Docker volumes**: `data/`, `logs/`

**Backup script** (`scripts/backup.sh`):
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

**Cron job** (daily at 2am):
```bash
crontab -e

# Add:
0 2 * * * /opt/woo-ki-agent/scripts/backup.sh
```

### 8.2 Disaster recovery

**Restore backup**:
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

**Recovery steps**:
1. Stop container: `docker-compose down`
2. Restore backup: `./scripts/restore.sh backup_20251101_020000.tar.gz`
3. Verify environment: `./scripts/validate-env.sh`
4. Start container: `docker-compose up -d`
5. Check health: `curl http://localhost:3000/api/health`

---

## 9. Troubleshooting

### 9.1 Common issues

#### **Container does not start**

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

**Common causes**:
- ❌ Missing environment variables → run `./scripts/validate-env.sh`
- ❌ Port 3000 already in use → `lsof -i :3000` and kill process
- ❌ Docker disk full → `docker system prune -a`

#### **Circuit breaker OPEN**

**Symptom**: API calls fail with "Circuit Breaker OPEN"

**Debug**:
```bash
# Check Circuit Breaker Status
curl http://localhost:3000/api/error-handling/circuit-breakers

# Check External API
curl https://dein-shop.de/wp-json/wc/v3/products
```

**Fix**:
1. Check external API status (WooCommerce/WordPress reachable?)
2. Verify credentials in `.env.production`
3. Wait for auto-recovery (60 seconds)
4. Manual reset: restart container

#### **High memory usage**

**Symptom**: Container uses >3 GB RAM

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

#### **DLQ full of failed jobs**

**Symptom**: Many jobs in the Dead Letter Queue

**Debug**:
```bash
# Check DLQ Stats
curl http://localhost:3000/api/error-handling/dlq/stats

# List Failed Jobs
ls -la /opt/woo-ki-agent/data/dlq/
```

**Fix**:
1. Check job errors in DLQ files
2. Correct job parameters
3. Manual retry:
   ```bash
   curl -X POST http://localhost:3000/api/error-handling/dlq/retry
   ```
4. Clean DLQ:
   ```bash
   rm -rf /opt/woo-ki-agent/data/dlq/*
   docker-compose restart
   ```

### 9.2 Log analysis

**Search error logs**:
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

**Docker logs**:
```bash
# Real-time
docker-compose logs -f ki-agent

# Filter by Error
docker-compose logs ki-agent | grep ERROR

# Last 24 hours
docker-compose logs --since 24h ki-agent
```

---

## 10. Performance tuning

### 10.1 Node.js optimization

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

### 10.2 Circuit breaker tuning

**Aggressive** (tolerate fewer failures):
```env
CIRCUIT_BREAKER_THRESHOLD=3         # 3 failures until OPEN
CIRCUIT_BREAKER_TIMEOUT=30000       # 30s until HALF_OPEN
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=3 # 3 successes until CLOSED
```

**Conservative** (tolerate more failures):
```env
CIRCUIT_BREAKER_THRESHOLD=10        # 10 failures until OPEN
CIRCUIT_BREAKER_TIMEOUT=120000      # 2min until HALF_OPEN
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=5 # 5 successes until CLOSED
```

### 10.3 Connection pooling

**HTTP keep-alive agents** (already enabled):
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

## 11. Security hardening

### 11.1 Docker security

**Non-root user**:
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

**Read-only root filesystem**:
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

### 11.2 Network security

**Firewall rules**:
```bash
# UFW (Ubuntu Firewall)
sudo ufw allow 22/tcp        # SSH
sudo ufw allow 3000/tcp      # Frontend (Optional)
sudo ufw enable
```

**Docker network isolation**:
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

### 11.3 Secrets management

**Docker secrets** (Docker Swarm):
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

**Vault integration** (HashiCorp Vault):
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

## 12. Scaling & high availability

### 12.1 Horizontal scaling

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

### 12.2 Database integration (future)

**PostgreSQL** for persistent storage:
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

## 13. Production checklist

### 13.1 Pre-deployment

- [ ] Server specs met (3 vCPU, 4 GB RAM, 80 GB disk)
- [ ] Docker & Docker Compose installed
- [ ] `.env.production` fully configured
- [ ] Environment variables validated (`./scripts/validate-env.sh`)
- [ ] WooCommerce API reachable (test)
- [ ] WordPress API reachable (test)
- [ ] OpenAI API key valid (test)
- [ ] SMTP server configured (email test)
- [ ] Slack webhook configured (optional)
- [ ] Backup strategy defined
- [ ] Firewall rules configured

### 13.2 Post-deployment

- [ ] Container running (`docker-compose ps`)
- [ ] Health check successful (`curl /api/health`)
- [ ] Error handling active (check logs)
- [ ] Circuit breaker CLOSED (API check)
- [ ] DLQ empty (`curl /api/error-handling/dlq/stats`)
- [ ] Email alerts working (test email)
- [ ] Slack alerts working (test message)
- [ ] Watchtower active (auto-update check)
- [ ] Log rotation configured
- [ ] Backup cron job active
- [ ] Monitoring dashboard reachable (optional)

### 13.3 Ongoing maintenance

**Daily**:
- [ ] Check container status
- [ ] Review error logs
- [ ] Check DLQ stats

**Weekly**:
- [ ] Review circuit breaker stats
- [ ] Analyze alert history
- [ ] Check disk space

**Monthly**:
- [ ] Update Docker images
- [ ] Review backup strategy
- [ ] Security audit
- [ ] Performance review

---

## 14. Support & resources

### 14.1 Documentation

- **Architecture**: `docs/architecture.md`
- **API reference**: `docs/api/`
- **Workflows**: `docs/workflows/`
- **Error handling**: `backend/error-handling/README.md`

### 14.2 Monitoring URLs

- **Health check**: `http://localhost:3000/api/health`
- **System stats**: `http://localhost:3000/api/system/health/system`
- **Circuit breakers**: `http://localhost:3000/api/error-handling/circuit-breakers`
- **DLQ stats**: `http://localhost:3000/api/error-handling/dlq/stats`
- **Swagger API docs**: `http://localhost:3000/docs`

### 14.3 Contact

**GitHub**: https://github.com/AndreZ1971/ki  
**Issues**: https://github.com/AndreZ1971/ki/issues  
**Version**: 1.8.0  
**Last update**: November 2025

---

## Summary

This deployment setup provides:

✅ **Production-ready**: Docker + Watchtower + health checks  
✅ **Resilient**: circuit breaker + retry + DLQ  
✅ **Monitored**: multi-channel alerting (email + Slack)  
✅ **Secure**: environment variables + secrets management  
✅ **Scalable**: horizontal scaling + load balancing  
✅ **Maintainable**: automated backups + log rotation  

**Optimized for**: 3 vCPU, 4 GB RAM, 80 GB disk (dedicated agent server)

**Ready for production deployment! 🚀**
