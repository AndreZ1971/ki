# 🚀 Deployment Guide - ARI System v5.1.1

**Version:** 5.1.1  
**Last Updated:** January 4, 2026  
**Status:** Production-Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Configuration](#configuration)
7. [Health Checks & Monitoring](#health-checks--monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Bugfixes v5.1.1](#bugfixes-v511)

---

## 🎯 Overview

The ARI System can be deployed in various ways:

- **Local Development:** Node.js + npm directly
- **Docker Development:** docker-compose.yml
- **Production Docker:** docker-compose.production.yml
- **Kubernetes:** Helm Charts (helm/)

---

## ✅ Prerequisites

### **System Requirements**

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Node.js** | 18.x | 20.x |
| **RAM** | 2 GB | 4 GB |
| **CPU** | 2 Cores | 4 Cores |
| **Disk** | 10 GB | 20 GB |
| **Docker** | 20.10+ | Latest |

### **External Services**

- **WooCommerce:** REST API v3 with Consumer Key/Secret
- **WordPress:** REST API (optional)
- **OpenAI:** API Key (gpt-4o-mini)
- **SMTP:** Email Server (Port 465/587)

---

## 💻 Local Development

### **1. Clone Repository**

```bash
git clone https://github.com/yourusername/ki.git
cd ki
```

### **2. Install Dependencies**

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

### **3. Configure Environment Variables**

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

# WooCommerce (stored in connection.json)
# These are configured via Settings UI
```

**frontend/.env:**
```bash
VITE_API_URL=http://localhost:3000
```

### **4. Create connection.json**

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

### **5. Start Servers**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server running on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend running on http://localhost:5173
```

### **6. Health Check**

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## 🐳 Docker Deployment

### **Development Setup**

**1. Start Docker Compose:**

```bash
docker-compose up -d
```

**docker-compose.yml Structure:**
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

**2. View Logs:**

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

**3. Restart Services:**

```bash
docker-compose restart backend
docker-compose restart frontend
```

### **Production Setup**

**1. Production Build:**

```bash
docker-compose -f docker-compose.production.yml build
```

**2. Start Production:**

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

### **Server Setup (Hetzner/DigitalOcean)**

**1. Prepare Server:**

```bash
# Ubuntu 22.04 LTS
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**2. Deploy Project:**

```bash
# Clone repository
git clone https://github.com/yourusername/ki.git
cd ki

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit with nano/vim
nano backend/.env
nano frontend/.env

# Production build
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

### **SSL with Let's Encrypt:**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Create SSL certificate
sudo certbot --nginx -d my-working-space.de

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## ⚙️ Configuration

### **Backend Configuration**

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
    ttl: 60 * 1000, // 60 seconds
    maxSize: 100
  }
};
```

### **Frontend Configuration**

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

### **Health Endpoints**

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

### **Startup Validation (v5.1.1)**

After the bugfix release, these checks should succeed:

```bash
# 1. Server starts without errors
✅ Server läuft auf http://localhost:3000

# 2. All 130+ routes registered
✅ No FST_ERR_DUPLICATED_ROUTE errors

# 3. Critical endpoints available
curl http://localhost:3000/api/analytics/real-time/dashboard
curl http://localhost:3000/api/customers/segments
curl http://localhost:3000/api/woocommerce/subscribers

# 4. WooCommerce connection
curl http://localhost:3000/api/woocommerce/health
```

---

## 🐛 Troubleshooting

### **Server Won't Start**

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find port process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### **CORS Errors in Frontend**

**Problem:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
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

### **WooCommerce API Errors**

**Problem:** `401 Unauthorized` or `403 Forbidden`

**Solution:**
```typescript
// Ensure Basic Auth is used (v5.1.1 fix)
const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
headers: { 'Authorization': `Basic ${auth}` }
```

### **OpenAI JSON Parse Errors**

**Problem:** `SyntaxError: Unexpected token in JSON`

**Solution (since v5.1.1):**
```typescript
// Automatic JSON repair implemented
import { repairJSON } from '../utils/openaiHelper';

const repaired = repairJSON(openaiResponse);
const parsed = JSON.parse(repaired);

// Fallback to popular categories
if (!parsed || !parsed.categories) {
  return getPopularCategories();
}
```

### **NaN in Analytics**

**Problem:** `conversionRate: NaN` or `totalRevenue: NaN`

**Solution (since v5.1.1):**
```typescript
// Type-safe calculations
const total = orders.reduce((sum, order) => {
  const orderTotal = parseFloat(String(order.total || 0));
  return sum + (isNaN(orderTotal) ? 0 : orderTotal);
}, 0);
```

---

## 🔧 Bugfixes v5.1.1

### **Validation After Bugfix Release**

After updating to v5.1.1, these tests should succeed:

#### **1. Unique Customer Count**
```bash
# Test: Guest orders are counted
curl http://localhost:3000/api/analytics/real-time/dashboard

# Expected: uniqueCustomers > 0 even with customer_id = 0
```

#### **2. Email Marketing Routes**
```bash
# Test: Endpoint is registered
curl http://localhost:3000/api/customers/segments

# Expected: 200 OK (not 404)
```

#### **3. WooCommerce Sync**
```bash
# Test: Reply handling correct
curl -X POST http://localhost:3000/api/woocommerce/sync

# Expected: JSON response with reply.send()
```

#### **4. No Duplicate Endpoints**
```bash
# Test: Only 1x /subscribers
curl http://localhost:3000/api/debug/routes | grep subscribers

# Expected: Only one line
```

#### **5. Basic Auth instead of Query String**
```bash
# Test: Authorization header
# Check logs - no consumer_key in URL
```

#### **6. NaN-free Calculations**
```bash
# Test: Conversion analysis
curl -X POST http://localhost:3000/api/analytics/conversion/analyze

# Expected: All numbers are Number.isFinite()
```

#### **7. Feedback Analysis Implemented**
```bash
# Test: Endpoint delivers data
curl -X POST http://localhost:3000/api/analytics/feedback/analyze

# Expected: 200 OK with data (not 404)
```

#### **8. JSON Parsing Robust**
```bash
# Test: Category suggestions
curl -X POST http://localhost:3000/api/categories/ml/suggest \
  -H "Content-Type: application/json" \
  -d '{"productName":"Test"}'

# Expected: Always suggestions (even with OpenAI failure)
```

---

## 📊 Performance Optimization

### **Enable Caching**

```typescript
// 60s cache for dashboard metrics
const CACHE_TTL = 60 * 1000;
```

### **Request Timeouts**

```typescript
// WooCommerce API
timeout: 30000  // 30 seconds

// OpenAI API
timeout: 60000  // 60 seconds
```

### **Concurrency Control**

```typescript
// SimpleMutex since v5.1.0
const mutex = new SimpleMutex();
const release = await mutex.acquire('specialization');
try {
  // Critical section
} finally {
  release();
}
```

---

## 🔗 Additional Resources

- **[Production Bugfix Summary](./PRODUCTION_BUGFIX_SUMMARY.md)** - Details on all 8 fixes
- **[Testing Guide](./TESTING_GUIDE.md)** - Complete testing guide
- **[Troubleshooting](./Troubleshooting.md)** - More problem solutions
- **[Architecture](./architecture.md)** - System architecture

---

## ✅ Deployment Checklist

### **Pre-Deployment**

- [ ] Environment variables configured
- [ ] connection.json created
- [ ] Dependencies installed
- [ ] Local health check successful
- [ ] Tests passing (npm run test)

### **Deployment**

- [ ] Docker images built
- [ ] Production compose started
- [ ] Logs checked for errors
- [ ] Health endpoint reachable
- [ ] API endpoints tested

### **Post-Deployment**

- [ ] SSL certificate active
- [ ] Monitoring active
- [ ] Error tracking active
- [ ] Backup strategy implemented
- [ ] Documentation updated

---

**Version:** 5.1.1  
**Maintained by:** AndreZ1971  
**Last Updated:** January 4, 2026
