# 🚀 Deployment-Anleitung - ARI System v5.1.1

**Version:** 5.1.1  
**Letzte Aktualisierung:** 4. Januar 2026  
**Status:** Production-Ready

---

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Voraussetzungen](#voraussetzungen)
3. [Lokale Entwicklung](#lokale-entwicklung)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Konfiguration](#konfiguration)
7. [Health Checks & Monitoring](#health-checks--monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Bugfixes v5.1.1](#bugfixes-v511)

---

## 🎯 Übersicht

Das ARI System kann auf verschiedene Arten deployed werden:

- **Lokale Entwicklung:** Node.js + npm direkt
- **Docker Development:** docker-compose.yml
- **Production Docker:** docker-compose.production.yml
- **Kubernetes:** Helm Charts (helm/)

---

## ✅ Voraussetzungen

### **System-Requirements**

| Komponente | Minimum | Empfohlen |
|------------|---------|-----------|
| **Node.js** | 18.x | 20.x |
| **RAM** | 2 GB | 4 GB |
| **CPU** | 2 Cores | 4 Cores |
| **Disk** | 10 GB | 20 GB |
| **Docker** | 20.10+ | Latest |

### **Externe Services**

- **WooCommerce:** REST API v3 mit Consumer Key/Secret
- **WordPress:** REST API (optional)
- **OpenAI:** API Key (gpt-4o-mini)
- **SMTP:** Email-Server (Port 465/587)

---

## 💻 Lokale Entwicklung

### **1. Repository clonen**

```bash
git clone https://github.com/yourusername/ki.git
cd ki
```

### **2. Dependencies installieren**

```bash
# Root Dependencies
npm install

# Backend Dependencies
cd backend
npm install
cd ..

# Frontend Dependencies
cd frontend
npm install
cd ..
```

### **3. Environment-Variablen konfigurieren**

**backend/.env:**
```bash
NODE_ENV=development
PORT=3000

# OpenAI
OPENAI_API_KEY=sk-proj-...

# SMTP
SMTP_HOST=mail.example.com
SMTP_PORT=465
SMTP_USER=noreply@example.com
SMTP_PASS=yourpassword
SMTP_FROM=noreply@example.com

# WooCommerce (wird in connection.json gespeichert)
# Diese werden über die Settings-UI konfiguriert
```

**frontend/.env:**
```bash
VITE_API_URL=http://localhost:3000
```

### **4. connection.json erstellen**

**backend/config/connection.json:**
```json
{
  "woocommerce": {
    "url": "https://kaufe-es.eu",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_..."
  },
  "wordpress": {
    "url": "https://kaufe-es.eu",
    "username": "admin",
    "password": "your-app-password"
  },
  "openai": {
    "apiKey": "sk-proj-..."
  },
  "smtp": {
    "host": "mail.example.com",
    "port": 465,
    "secure": true,
    "auth": {
      "user": "noreply@example.com",
      "pass": "yourpassword"
    },
    "from": "noreply@example.com"
  }
}
```

### **5. Server starten**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server läuft auf http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend läuft auf http://localhost:5173
```

### **6. Health Check**

```bash
curl http://localhost:3000/health
# Erwartete Antwort: {"status":"ok","timestamp":"..."}
```

---

## 🐳 Docker Deployment

### **Development Setup**

**1. Docker Compose starten:**

```bash
docker-compose up -d
```

**docker-compose.yml Struktur:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - ./data:/app/data
    env_file:
      - backend/.env
    command: npm run dev

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
    env_file:
      - frontend/.env
    command: npm run dev
    depends_on:
      - backend
```

**2. Logs anzeigen:**

```bash
# Alle Services
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend
```

**3. Services neustarten:**

```bash
docker-compose restart backend
docker-compose restart frontend
```

### **Production Setup**

**1. Production Build:**

```bash
docker-compose -f docker-compose.production.yml build
```

**2. Production starten:**

```bash
docker-compose -f docker-compose.production.yml up -d
```

**docker-compose.production.yml:**
```yaml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always
```

---

## 🌐 Production Deployment

### **Server-Setup (Hetzner/DigitalOcean)**

**1. Server vorbereiten:**

```bash
# Ubuntu 22.04 LTS
sudo apt update && sudo apt upgrade -y

# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose installieren
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**2. Projekt deployen:**

```bash
# Git Repository clonen
git clone https://github.com/yourusername/ki.git
cd ki

# Environment-Dateien erstellen
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Bearbeiten mit nano/vim
nano backend/.env
nano frontend/.env

# Production Build
docker-compose -f docker-compose.production.yml up -d --build
```

### **Nginx Reverse Proxy (Optional)**

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name my-working-space.de;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### **SSL mit Let's Encrypt:**

```bash
# Certbot installieren
sudo apt install certbot python3-certbot-nginx -y

# SSL-Zertifikat erstellen
sudo certbot --nginx -d my-working-space.de

# Auto-Renewal testen
sudo certbot renew --dry-run
```

---

## ⚙️ Konfiguration

### **Backend-Konfiguration**

**backend/config.ts:**
```typescript
export const config = {
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  },
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? /\.my-working-space\.de$/
      : ['http://localhost:5173', 'http://localhost:3000']
  },
  openai: {
    model: 'gpt-4o-mini',
    maxTokens: 4000,
    temperature: 0.7
  },
  cache: {
    ttl: 60 * 1000, // 60 Sekunden
    maxSize: 100
  }
};
```

### **Frontend-Konfiguration**

**frontend/vite.config.ts:**
```typescript
export default defineConfig({
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

---

## 🏥 Health Checks & Monitoring

### **Health-Endpoints**

```bash
# Simple Health Check
GET /health
Response: {"status":"ok","timestamp":"2026-01-04T10:00:00.000Z"}

# Detailed System Health
GET /api/system/health
Response: {
  "status": "ok",
  "uptime": 12345,
  "memory": {
    "total": 4294967296,
    "free": 2147483648,
    "used": 2147483648
  },
  "services": {
    "woocommerce": "connected",
    "openai": "connected",
    "smtp": "connected"
  }
}

# Route Debugging
GET /api/debug/routes
Response: ["GET /api/analytics/metrics/dashboard", ...]
```

### **Startup-Validation (v5.1.1)**

Nach dem Bugfix-Release sollten folgende Checks erfolgreich sein:

```bash
# 1. Server startet ohne Fehler
✅ Server läuft auf http://localhost:3000

# 2. Alle 130+ Routes registriert
✅ No FST_ERR_DUPLICATED_ROUTE errors

# 3. Kritische Endpoints verfügbar
curl http://localhost:3000/api/analytics/real-time/dashboard
curl http://localhost:3000/api/customers/segments
curl http://localhost:3000/api/woocommerce/subscribers

# 4. WooCommerce-Verbindung
curl http://localhost:3000/api/woocommerce/health
```

---

## 🐛 Troubleshooting

### **Server startet nicht**

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Lösung:**
```bash
# Port-Prozess finden
lsof -i :3000

# Prozess beenden
kill -9 <PID>

# Oder anderen Port verwenden
PORT=3001 npm run dev
```

### **CORS-Fehler im Frontend**

**Problem:** `Access to XMLHttpRequest blocked by CORS policy`

**Lösung:**
```typescript
// backend/middleware/cors.ts
fastify.register(cors, {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    /\.my-working-space\.de$/
  ]
});
```

### **WooCommerce API Fehler**

**Problem:** `401 Unauthorized` oder `403 Forbidden`

**Lösung:**
```typescript
// Stelle sicher, dass Basic Auth verwendet wird (v5.1.1 Fix)
const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
headers: { 'Authorization': `Basic ${auth}` }
```

### **OpenAI JSON Parse Errors**

**Problem:** `SyntaxError: Unexpected token in JSON`

**Lösung (seit v5.1.1):**
```typescript
// Automatische JSON-Reparatur implementiert
import { repairJSON } from '../utils/openaiHelper';

const repaired = repairJSON(openaiResponse);
const parsed = JSON.parse(repaired);

// Fallback zu Popular Categories
if (!parsed || !parsed.categories) {
  return getPopularCategories();
}
```

### **NaN in Analytics**

**Problem:** `conversionRate: NaN` oder `totalRevenue: NaN`

**Lösung (seit v5.1.1):**
```typescript
// Type-Safe Calculations
const total = orders.reduce((sum, order) => {
  const orderTotal = parseFloat(String(order.total || 0));
  return sum + (isNaN(orderTotal) ? 0 : orderTotal);
}, 0);
```

---

## 🔧 Bugfixes v5.1.1

### **Validierung nach Bugfix-Release**

Nach dem Update auf v5.1.1 sollten folgende Tests erfolgreich sein:

#### **1. Unique Customer Count**
```bash
# Test: Guest Orders werden gezählt
curl http://localhost:3000/api/analytics/real-time/dashboard

# Erwartung: uniqueCustomers > 0 auch mit customer_id = 0
```

#### **2. Email Marketing Routes**
```bash
# Test: Endpoint ist registriert
curl http://localhost:3000/api/customers/segments

# Erwartung: 200 OK (nicht 404)
```

#### **3. WooCommerce Sync**
```bash
# Test: Reply-Handling korrekt
curl -X POST http://localhost:3000/api/woocommerce/sync

# Erwartung: JSON Response mit reply.send()
```

#### **4. Keine Duplicate Endpoints**
```bash
# Test: Nur 1x /subscribers
curl http://localhost:3000/api/debug/routes | grep subscribers

# Erwartung: Nur eine Zeile
```

#### **5. Basic Auth statt Query-String**
```bash
# Test: Authorization Header
# Logs überprüfen - keine consumer_key in URL
```

#### **6. NaN-freie Berechnungen**
```bash
# Test: Conversion-Analyse
curl -X POST http://localhost:3000/api/analytics/conversion/analyze

# Erwartung: Alle Zahlen sind Number.isFinite()
```

#### **7. Feedback-Analyse implementiert**
```bash
# Test: Endpoint liefert Daten
curl -X POST http://localhost:3000/api/analytics/feedback/analyze

# Erwartung: 200 OK mit data (nicht 404)
```

#### **8. JSON-Parsing robust**
```bash
# Test: Categories Suggestions
curl -X POST http://localhost:3000/api/categories/ml/suggest \
  -H "Content-Type: application/json" \
  -d '{"productName":"Test"}'

# Erwartung: Immer Suggestions (auch bei OpenAI Failure)
```

---

## 📊 Performance-Optimierung

### **Caching aktivieren**

```typescript
// 60s Cache für Dashboard-Metriken
const CACHE_TTL = 60 * 1000;
```

### **Request-Timeouts**

```typescript
// WooCommerce API
timeout: 30000  // 30 Sekunden

// OpenAI API
timeout: 60000  // 60 Sekunden
```

### **Concurrency-Control**

```typescript
// SimpleMutex seit v5.1.0
const mutex = new SimpleMutex();
const release = await mutex.acquire('specialization');
try {
  // Critical Section
} finally {
  release();
}
```

---

## 🔗 Weitere Ressourcen

- **[Production Bugfix Summary](./PRODUCTION_BUGFIX_SUMMARY.md)** - Details zu allen 8 Fixes
- **[Testing Guide](./TESTING_GUIDE.md)** - Vollständiger Test-Guide
- **[Troubleshooting](./Troubleshooting.md)** - Weitere Problem-Lösungen
- **[Architecture](./architecture.md)** - System-Architektur

---

## ✅ Deployment-Checkliste

### **Pre-Deployment**

- [ ] Environment-Variablen konfiguriert
- [ ] connection.json erstellt
- [ ] Dependencies installiert
- [ ] Health Check lokal erfolgreich
- [ ] Tests bestehen (npm run test)

### **Deployment**

- [ ] Docker Images gebaut
- [ ] Production Compose gestartet
- [ ] Logs auf Fehler überprüft
- [ ] Health Endpoint erreichbar
- [ ] API-Endpoints testen

### **Post-Deployment**

- [ ] SSL-Zertifikat aktiv
- [ ] Monitoring aktiv
- [ ] Error-Tracking aktiv
- [ ] Backup-Strategy implementiert
- [ ] Dokumentation aktualisiert

---

**Version:** 5.1.1  
**Maintained by:** AndreZ1971  
**Last Updated:** 4. Januar 2026
