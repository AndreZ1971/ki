# 🛠️ A.R.I. - Developer FAQ

**Version:** 1.0.0  
**Datum:** Januar 2026  
**Zielgruppe:** DevOps, Entwickler, System-Administratoren

---

## 📋 Inhaltsverzeichnis

1. [Setup & Installation](#setup--installation)
2. [Docker & Container](#docker--container)
3. [Konfiguration & Environment](#konfiguration--environment)
4. [Backend & APIs](#backend--apis)
5. [Frontend & Build](#frontend--build)
6. [Debugging & Logs](#debugging--logs)
7. [Performance & Optimization](#performance--optimization)
8. [Deployment & Updates](#deployment--updates)
9. [Sicherheit & Authentifizierung](#sicherheit--authentifizierung)
10. [Testing & Qualität](#testing--qualität)
11. [Tool Reference & Architektur](#tool-reference--architektur)
12. [Emergency Alerting & Monitoring](#emergency-alerting--monitoring)
13. [Machine Learning Integration](#machine-learning-integration)

---

## Setup & Installation

### Systemvoraussetzungen

**Minimum:**
- Docker 20.10+ & Docker Compose 2.0+
- 2 CPU Cores
- 4 GB RAM
- 10 GB Storage
- Node.js 18+ (für lokale Entwicklung)

**Empfohlen:**
- 4+ CPU Cores
- 8 GB RAM
- 20 GB SSD Storage
- Ubuntu 22.04 / Debian 11+

### Wie installiere ich A.R.I. lokal?

**1. Repository klonen:**
```bash
git clone https://github.com/AndreZ1971/ki.git
cd ki
```

**2. Environment-Datei erstellen:**
```bash
cp .env.example .env
# .env anpassen mit WooCommerce & OpenAI Keys
```

**3. Docker Compose starten:**
```bash
docker compose up -d
```

**4. Zugriff:**
- Frontend: http://localhost
- Backend: http://localhost:3001
- Health Check: http://localhost:3001/health

### Welche Ports werden verwendet?

| Service | Port | Zweck |
|---------|------|-------|
| Frontend | 80 | React UI |
| Backend | 3001 | Fastify API |
| MongoDB | 27017 | Optional (ML-Daten) |
| Redis | 6379 | Optional (Caching) |

**NGINX-Proxy:** Leitet Port 80 → Frontend/Backend weiter

### Wie baue ich das Projekt ohne Docker?

**Frontend:**
```bash
cd frontend
npm install
npm run build  # Produktions-Build → dist/
npm run dev    # Dev-Server → Port 5173
```

**Backend:**
```bash
cd backend
npm install
npm run build  # TypeScript → JavaScript
npm start      # Produktions-Server
npm run dev    # Dev-Server mit Hot-Reload
```

### Wie richte ich eine Entwicklungsumgebung ein?

**1. Lokaler Dev-Server (ohne Docker):**
```bash
# Terminal 1 - Frontend
cd frontend
npm run dev  # → http://localhost:5173

# Terminal 2 - Backend  
cd backend
npm run dev  # → http://localhost:3001
```

**2. Environment-Variablen (`.env`):**
```
VITE_BACKEND_URL=http://localhost:3001
WOO_URL=https://your-shop.com
WOO_CONSUMER_KEY=ck_...
WOO_CONSUMER_SECRET=cs_...
OPENAI_API_KEY=sk-proj-...
```

**3. Hot-Reload aktivieren:**
- Frontend: Automatisch via Vite
- Backend: Automatisch via `tsx watch`

---

## Docker & Container

### Container starten nicht - was tun?

**1. Logs prüfen:**
```bash
docker compose logs -f
```

**2. Port-Konflikte prüfen:**
```bash
# Port 80 bereits belegt?
sudo lsof -i :80

# Port 3001 bereits belegt?
sudo lsof -i :3001
```

**3. Container neu bauen:**
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

**4. Volumes löschen (⚠️ Datenverlust):**
```bash
docker compose down -v
docker compose up -d
```

### Wie sehe ich Container-Logs?

**Alle Services:**
```bash
docker compose logs -f
```

**Nur Frontend:**
```bash
docker compose logs -f frontend
```

**Nur Backend:**
```bash
docker compose logs -f backend
```

**Letzte 100 Zeilen:**
```bash
docker compose logs --tail=100 backend
```

### Container läuft, aber antwortet nicht

**1. Health Check prüfen:**
```bash
curl http://localhost:3001/health
# Erwartete Antwort: {"status":"ok","uptime":123}
```

**2. Container-Status prüfen:**
```bash
docker compose ps
# Alle Services sollten "Up" sein
```

**3. Netzwerk prüfen:**
```bash
docker network ls
docker network inspect ki_default
```

**4. In Container einloggen:**
```bash
docker compose exec backend sh
# Dann: curl http://localhost:3001/health
```

### Wie update ich Container-Images?

**1. Neue Images ziehen:**
```bash
docker compose pull
```

**2. Container neu starten:**
```bash
docker compose up -d
```

**3. Alte Images löschen:**
```bash
docker image prune -a
```

### Wie erstelle ich ein Production-Image?

**1. Build:**
```bash
docker build -f Dockerfile -t ari:latest .
```

**2. Tag für Registry:**
```bash
docker tag ari:latest registry.example.com/ari:v3.2.0
```

**3. Push:**
```bash
docker push registry.example.com/ari:v3.2.0
```

**Tipp:** Nutze `docker-compose.production.yml` für Prod-Deployments!

---

## Konfiguration & Environment

### Welche Environment-Variablen gibt es?

**Backend (.env):**
```bash
# WooCommerce Connection
WOO_URL=https://shop.com
WOO_CONSUMER_KEY=ck_...
WOO_CONSUMER_SECRET=cs_...

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# Server
PORT=3001
NODE_ENV=production

# Optional: ML Features
MONGODB_URI=mongodb://localhost:27017/ari
REDIS_URL=redis://localhost:6379

# Optional: External APIs
GOOGLE_TRENDS_API_KEY=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
```

**Frontend (.env):**
```bash
VITE_BACKEND_URL=http://localhost:3001
VITE_APP_VERSION=3.2.0
```

### Wie ändere ich die JWT-Secret-Rotation?

**1. Neuen Secret generieren:**
```bash
openssl rand -base64 32
```

**2. In `.env` aktualisieren:**
```bash
JWT_SECRET=your-new-secret
```

**3. Backend neu starten:**
```bash
docker compose restart backend
```

**⚠️ Warnung:** Alle aktiven Sessions werden ungültig!

### Wo werden Spezialisierungen gespeichert?

**Pfad:** `backend/data/specializations/`

**Struktur:**
```
backend/data/specializations/
  ├── fashion-mode-test.ari-spec       # Original-Datei
  ├── fashion-mode-test.ari-spec.sig   # RSA-Signatur
  └── active-specialization.json       # Aktive Config
```

**Signatur-Validierung:** RSA-2048, Public Key im Backend

### Wie aktiviere ich Debug-Logging?

**Option 1 - Environment:**
```bash
# In .env
LOG_LEVEL=debug
```

**Option 2 - Runtime:**
```bash
docker compose exec backend sh
export LOG_LEVEL=debug
```

**Logs zeigen:**
```bash
docker compose logs -f backend | grep DEBUG
```

### Kann ich mehrere Instanzen parallel laufen lassen?

**Ja!** Mit Port-Mapping:

**Instanz 1:**
```yaml
# docker-compose.yml
ports:
  - "80:80"
  - "3001:3001"
```

**Instanz 2:**
```yaml
# docker-compose-dev.yml
ports:
  - "8080:80"    # Frontend → http://localhost:8080
  - "3002:3001"  # Backend → http://localhost:3002
```

**Wichtig:** Separate `.env` Dateien mit unterschiedlichen JWT_SECRET!

---

## Backend & APIs

### Wie teste ich API-Endpoints?

**1. Health Check:**
```bash
curl http://localhost:3001/health
```

**2. Login (JWT holen):**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
  
# Response: {"token":"eyJhbGc..."}
```

**3. Protected Endpoint:**
```bash
curl http://localhost:3001/api/woo/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**4. Mit X-Language Header:**
```bash
curl http://localhost:3001/api/analytics/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Language: de"
```

### 400 Bad Request - was bedeutet das?

**Ursachen:**

**1. Fehlende Required-Felder:**
```json
{
  "error": "Validation failed",
  "details": {
    "body": {
      "productName": "Required"
    }
  }
}
```
→ `productName` fehlt im Request

**2. Falsches Datenformat:**
```json
{
  "error": "Invalid JSON"
}
```
→ JSON-Syntax-Fehler im Body

**3. Schema-Validierung fehlgeschlagen:**
```json
{
  "error": "Invalid input",
  "field": "price",
  "expected": "number",
  "received": "string"
}
```
→ `price` muss Number sein, nicht String

**Debugging:** Prüfe Request-Body mit Schema in Backend-Code

### 401 Unauthorized - JWT-Probleme

**Ursachen:**

**1. Token abgelaufen:**
```json
{"error": "Token expired"}
```
→ Neu einloggen

**2. Token ungültig:**
```json
{"error": "Invalid token"}
```
→ JWT_SECRET geändert? Neu einloggen.

**3. Token fehlt:**
```json
{"error": "No token provided"}
```
→ `Authorization: Bearer ...` Header vergessen

**Fix:**
```bash
# Neuen Token holen
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# Token verwenden
curl http://localhost:3001/api/analytics/health \
  -H "Authorization: Bearer $TOKEN"
```

### Wie füge ich einen neuen API-Endpoint hinzu?

**1. Route definieren (backend/routes/custom.ts):**
```typescript
import { FastifyInstance } from 'fastify';

export default async function customRoutes(fastify: FastifyInstance) {
  fastify.get('/api/custom/hello', async (request, reply) => {
    return { message: 'Hello World' };
  });
}
```

**2. Route registrieren (backend/server.ts):**
```typescript
import customRoutes from './routes/custom';
await fastify.register(customRoutes);
```

**3. Testen:**
```bash
curl http://localhost:3001/api/custom/hello
```

### Wie integriere ich einen neuen Service?

**1. Service erstellen (backend/services/myService.ts):**
```typescript
export class MyService {
  async doSomething(data: string): Promise<string> {
    return `Processed: ${data}`;
  }
}

export const myService = new MyService();
```

**2. In Route verwenden:**
```typescript
import { myService } from '../services/myService';

fastify.post('/api/custom/process', async (request, reply) => {
  const { data } = request.body as { data: string };
  const result = await myService.doSomething(data);
  return { result };
});
```

**3. Dependency Injection (optional):**
```typescript
fastify.decorate('myService', myService);
```

---

## Frontend & Build

### Frontend lädt nicht / weiße Seite

**Debugging-Schritte:**

**1. Browser-Konsole öffnen (F12):**
```
Fehler: Failed to fetch
→ Backend nicht erreichbar

Fehler: Unexpected token '<'
→ Build-Fehler, falsches MIME-Type
```

**2. Network-Tab prüfen:**
- HTTP 200 für `/assets/index-*.js`?
- 404 → Build fehlt, `npm run build` ausführen
- 500 → Backend-Fehler, Logs prüfen

**3. Backend-URL prüfen:**
```bash
# In frontend/.env
VITE_BACKEND_URL=http://localhost:3001

# Browser-Konsole:
console.log(import.meta.env.VITE_BACKEND_URL)
```

**4. CORS-Fehler?**
```
Access to fetch blocked by CORS
→ Backend CORS-Config prüfen (backend/server.ts)
```

### Wie baue ich das Frontend für Produktion?

**1. Build erstellen:**
```bash
cd frontend
npm run build  # → dist/
```

**2. Build testen:**
```bash
npm run preview  # → http://localhost:4173
```

**3. Build-Größe optimieren:**
```bash
# In vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'ui-vendor': ['@radix-ui/react-dialog', ...]
      }
    }
  }
}
```

**4. Deploy:**
```bash
# Nginx Webroot
cp -r dist/* /var/www/html/
```

### Vite Build schlägt fehl

**Häufige Fehler:**

**1. Out of Memory:**
```bash
FATAL ERROR: Reached heap limit
```
→ Node Memory erhöhen:
```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

**2. TypeScript-Fehler:**
```bash
error TS2307: Cannot find module
```
→ Types installieren:
```bash
npm install -D @types/node
```

**3. Import-Fehler:**
```bash
Failed to resolve import "./Component"
```
→ Dateiendung hinzufügen:
```typescript
import Component from './Component.tsx'  // ✅
```

### Wie füge ich eine neue Übersetzung hinzu?

**1. Frontend (frontend/src/i18n/translations.ts):**
```typescript
export const translations = {
  de: {
    'my.new.key': 'Deutscher Text',
    'my.new.description': 'Beschreibung auf Deutsch'
  },
  en: {
    'my.new.key': 'English Text',
    'my.new.description': 'Description in English'
  }
};
```

**2. In Component verwenden:**
```typescript
import { useTranslation } from '@/i18n/useTranslation';

const { t } = useTranslation();
return <h1>{t('my.new.key')}</h1>;
```

**3. Backend (backend/utils/i18n.ts):**
```typescript
export const translations = {
  de: { 'api.error': 'Fehler aufgetreten' },
  en: { 'api.error': 'Error occurred' }
};
```

**Tipp:** Siehe [I18N.md](I18N.md) für vollständige Anleitung!

---

## Debugging & Logs

### Wie aktiviere ich Verbose Logging?

**Backend:**
```bash
# .env
LOG_LEVEL=debug
DEBUG=*
```

**Frontend (Browser Console):**
```typescript
// In main.tsx
if (import.meta.env.DEV) {
  window.DEBUG = true;
}
```

**Docker Logs live:**
```bash
docker compose logs -f --tail=100
```

### Wo finde ich Error-Logs?

**Backend-Logs:**
```bash
# Container
docker compose logs backend | grep ERROR

# Lokaler Dev-Server
tail -f backend/logs/error.log
```

**Frontend-Logs:**
- Browser Console (F12)
- Network-Tab für API-Fehler
- Sources-Tab für Bundle-Errors

**Produktions-Logs:**
```bash
# Nginx Access Log
tail -f /var/log/nginx/access.log

# Nginx Error Log
tail -f /var/log/nginx/error.log
```

### API-Call schlägt fehl - wie debugge ich?

**Schritt-für-Schritt:**

**1. Network-Tab öffnen (F12):**
- Request-URL korrekt?
- Status Code? (400/401/500)
- Headers vorhanden? (Authorization, X-Language)

**2. Request inspizieren:**
```javascript
// Browser Console
fetch('http://localhost:3001/api/analytics/health', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'X-Language': 'de'
  }
}).then(r => r.json()).then(console.log);
```

**3. Backend-Logs prüfen:**
```bash
docker compose logs backend | grep "POST /api/analytics/health"
```

**4. cURL reproduzieren:**
```bash
curl -v http://localhost:3001/api/analytics/health \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Language: de"
```

**5. Typischer Fehler:**
```json
{
  "error": "WooCommerce connection failed",
  "details": "401 Unauthorized"
}
```
→ WooCommerce API-Keys ungültig, in .env prüfen

### OpenAI API gibt Timeout

**Ursachen:**

**1. Rate Limit erreicht:**
```json
{"error": "Rate limit exceeded"}
```
→ Warte 60 Sekunden

**2. Guthaben aufgebraucht:**
```json
{"error": "Insufficient quota"}
```
→ OpenAI-Account aufladen

**3. Netzwerk-Timeout:**
```
Error: connect ETIMEDOUT
```
→ Firewall/Proxy-Probleme, DNS prüfen

**4. Zu großer Prompt:**
```json
{"error": "Maximum context length exceeded"}
```
→ Input-Text kürzen

**Debugging:**
```bash
# Test mit kleinem Prompt
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role":"user","content":"Hi"}]
  }'
```

---

## Performance & Optimization

### Backend antwortet langsam

**Performance-Checks:**

**1. Response-Zeit messen:**
```bash
time curl http://localhost:3001/api/analytics/health
# Sollte < 200ms sein
```

**2. CPU/Memory prüfen:**
```bash
docker stats
# Backend sollte < 80% CPU nutzen
```

**3. Bottlenecks finden:**
```typescript
// In backend/server.ts
fastify.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
});

fastify.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - request.startTime;
  console.log(`${request.method} ${request.url} - ${duration}ms`);
});
```

**4. Caching aktivieren:**
```typescript
import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache WooCommerce Products für 5min
const cached = await redis.get('woo:products');
if (cached) return JSON.parse(cached);

const products = await wooClient.getProducts();
await redis.setex('woo:products', 300, JSON.stringify(products));
```

### Wie reduziere ich Frontend-Bundle-Größe?

**1. Analyse:**
```bash
npm run build -- --mode=analyze
# Öffnet Bundle-Visualizer
```

**2. Code-Splitting:**
```typescript
// Lazy Loading für Routes
const Dashboard = lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

**3. Tree-Shaking:**
```typescript
// ❌ Importiert ganze Library
import _ from 'lodash';

// ✅ Nur benötigte Funktion
import { debounce } from 'lodash-es';
```

**4. Compression:**
```bash
# In vite.config.ts
import viteCompression from 'vite-plugin-compression';

plugins: [
  viteCompression({ algorithm: 'gzip' })
]
```

### Datenbank-Performance optimieren

**Für MongoDB (ML-Features):**

**1. Indexes erstellen:**
```javascript
db.products.createIndex({ sku: 1 });
db.analytics.createIndex({ timestamp: -1 });
```

**2. Query-Performance messen:**
```javascript
db.products.find({ category: 'fashion' }).explain('executionStats');
```

**3. Connection Pooling:**
```typescript
// In backend/config.ts
const mongoClient = new MongoClient(MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 2
});
```

### Wie implementiere ich Rate Limiting?

**Backend (backend/middleware/rateLimiter.ts):**
```typescript
import rateLimit from '@fastify/rate-limit';

await fastify.register(rateLimit, {
  max: 100,              // 100 Requests
  timeWindow: '1 minute'  // Pro Minute
});
```

**Spezifisch pro Route:**
```typescript
fastify.post('/api/openai/generate', {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: '1 minute'
    }
  }
}, async (request, reply) => {
  // ...
});
```

---

## Deployment & Updates

### Wie deploye ich auf einem Production-Server?

**Schritt-für-Schritt:**

**1. Server vorbereiten (Ubuntu 22.04):**
```bash
# Docker installieren
curl -fsSL https://get.docker.com | sh

# Docker Compose installieren
sudo apt install docker-compose-plugin

# User zu Docker-Gruppe
sudo usermod -aG docker $USER
```

**2. Repository klonen:**
```bash
git clone https://github.com/AndreZ1971/ki.git /opt/ari
cd /opt/ari
```

**3. Production .env erstellen:**
```bash
cp .env.example .env
nano .env
# WOO_URL, API-Keys, JWT_SECRET setzen
```

**4. Production-Compose verwenden:**
```bash
docker compose -f docker-compose.production.yml up -d
```

**5. HTTPS mit Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ari.example.com
```

**6. Health Check:**
```bash
curl https://ari.example.com/health
```

### Wie führe ich Updates durch?

**Zero-Downtime Update:**

**1. Code pullen:**
```bash
cd /opt/ari
git pull origin master
```

**2. Neue Images bauen:**
```bash
docker compose -f docker-compose.production.yml build
```

**3. Rolling Update:**
```bash
docker compose -f docker-compose.production.yml up -d --no-deps --build backend
docker compose -f docker-compose.production.yml up -d --no-deps --build frontend
```

**4. Health Check:**
```bash
curl https://ari.example.com/health
```

**5. Alte Images löschen:**
```bash
docker image prune -f
```

### Wie rolle ich ein Update zurück?

**Option 1 - Git Checkout:**
```bash
git log --oneline  # Version finden
git checkout abc1234
docker compose -f docker-compose.production.yml up -d --build
```

**Option 2 - Docker Image Tag:**
```bash
docker pull registry.example.com/ari:v3.1.0  # Alte Version
docker tag registry.example.com/ari:v3.1.0 ari:latest
docker compose up -d
```

**Option 3 - Backup wiederherstellen:**
```bash
# Datenbank-Backup einspielen
mongorestore --uri="mongodb://localhost:27017/ari" dump/
```

### Automatische Backups einrichten

**Cron-Job erstellen:**
```bash
crontab -e
```

**Tägliches Backup um 3 Uhr:**
```bash
0 3 * * * /opt/ari/scripts/backup.sh
```

**Backup-Script (scripts/backup.sh):**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups/ari

# MongoDB Backup
docker compose exec -T mongodb mongodump --archive=/data/backup_$DATE.archive

# Config Backup
cp .env $BACKUP_DIR/env_$DATE
cp -r backend/data/specializations $BACKUP_DIR/spec_$DATE

# Alte Backups löschen (> 30 Tage)
find $BACKUP_DIR -mtime +30 -delete
```

---

## Sicherheit & Authentifizierung

### Wie ändere ich Standard-Credentials?

**⚠️ WICHTIG: Sofort ändern in Produktion!**

**1. Backend-Code anpassen (backend/routes/auth.ts):**
```typescript
// ❌ UNSICHER - Standard-Credentials
const VALID_USERS = {
  admin: 'admin123'  
};

// ✅ SICHER - Gehashte Credentials
import bcrypt from 'bcrypt';
const VALID_USERS = {
  admin: await bcrypt.hash('YOUR_SECURE_PASSWORD', 10)
};
```

**2. Passwort-Hashing implementieren:**
```typescript
import bcrypt from 'bcrypt';

async function login(username: string, password: string) {
  const hashedPassword = VALID_USERS[username];
  const valid = await bcrypt.compare(password, hashedPassword);
  
  if (!valid) throw new Error('Invalid credentials');
  
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
  return { token };
}
```

**3. Environment-basiert:**
```bash
# In .env
ADMIN_USERNAME=my_admin
ADMIN_PASSWORD_HASH=$2b$10$...  # Generiert mit bcrypt
```

### Wie implementiere ich Multi-User-Auth?

**1. User-Datenbank (MongoDB):**
```typescript
interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: Date;
}
```

**2. Registration-Endpoint:**
```typescript
fastify.post('/api/auth/register', async (request, reply) => {
  const { username, password } = request.body;
  
  // Check if exists
  const exists = await db.users.findOne({ username });
  if (exists) throw new Error('User exists');
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Save user
  await db.users.insertOne({
    id: uuidv4(),
    username,
    passwordHash,
    role: 'user',
    createdAt: new Date()
  });
  
  return { success: true };
});
```

**3. Login mit DB-Check:**
```typescript
fastify.post('/api/auth/login', async (request, reply) => {
  const { username, password } = request.body;
  
  const user = await db.users.findOne({ username });
  if (!user) throw new Error('Invalid credentials');
  
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');
  
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  return { token, user: { username: user.username, role: user.role } };
});
```

### Wie schütze ich API-Routes vor unbefugtem Zugriff?

**1. Auth-Middleware (backend/middleware/authMiddleware.ts):**
```typescript
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded;  // Attach user to request
  } catch (err) {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}
```

**2. Route schützen:**
```typescript
fastify.get('/api/protected', {
  preHandler: authMiddleware
}, async (request, reply) => {
  return { message: 'Protected data', user: request.user };
});
```

**3. Role-Based Access:**
```typescript
function requireRole(role: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authMiddleware(request, reply);
    
    if (request.user.role !== role) {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
  };
}

// Admin-only Route
fastify.delete('/api/users/:id', {
  preHandler: requireRole('admin')
}, async (request, reply) => {
  // Delete user
});
```

### CORS-Fehler beheben

**Problem:**
```
Access to fetch at 'http://backend' from origin 'http://frontend' has been blocked by CORS
```

**Lösung (backend/server.ts):**
```typescript
import cors from '@fastify/cors';

await fastify.register(cors, {
  origin: [
    'http://localhost:5173',    // Vite Dev
    'http://localhost',          // Production
    'https://ari.example.com'   // Production Domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});
```

**Dynamic CORS (für alle Subdomains):**
```typescript
await fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin || origin.endsWith('.example.com')) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'), false);
    }
  }
});
```

---

## Testing & Qualität

### Wie führe ich Tests aus?

**Alle Tests:**
```bash
npm test
```

**Nur Unit-Tests:**
```bash
npm run test:unit
```

**Nur Integration-Tests:**
```bash
npm run test:integration
```

**E2E-Tests (Playwright):**
```bash
npx playwright test
```

**Mit Coverage:**
```bash
npm run test:coverage
```

**Watch-Modus (für Entwicklung):**
```bash
npm run test:watch
```

### Test schlägt fehl - wie debugge ich?

**1. Test einzeln ausführen:**
```bash
npm test -- -t "should create product"
```

**2. Debug-Modus:**
```bash
node --inspect-brk node_modules/.bin/vitest run
# Chrome DevTools öffnen: chrome://inspect
```

**3. Console-Logs aktivieren:**
```typescript
import { describe, it, expect } from 'vitest';

it('should work', () => {
  console.log('Debug info:', data);
  expect(data).toBeDefined();
});
```

**4. Mock-Fehler prüfen:**
```typescript
// Mock nicht korrekt?
vi.mock('../services/wooService', () => ({
  getProducts: vi.fn().mockResolvedValue([])
}));

// Prüfen, ob Mock aufgerufen wurde
expect(getProducts).toHaveBeenCalledWith({ category: 'fashion' });
```

### Wie schreibe ich einen neuen Test?

**Unit-Test (backend/tests/unit/myService.test.ts):**
```typescript
import { describe, it, expect } from 'vitest';
import { myService } from '../../services/myService';

describe('MyService', () => {
  it('should process data correctly', async () => {
    const result = await myService.doSomething('test');
    expect(result).toBe('Processed: test');
  });
  
  it('should handle errors', async () => {
    await expect(myService.doSomething('')).rejects.toThrow('Empty input');
  });
});
```

**Integration-Test (backend/tests/integration/api.test.ts):**
```typescript
import { describe, it, expect } from 'vitest';
import { buildApp } from '../../server';

describe('API Integration', () => {
  it('should return health status', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });
    
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
```

**E2E-Test (tests/e2e/login.spec.ts):**
```typescript
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('http://localhost');
  
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

### Wie verbessere ich Test-Coverage?

**1. Coverage-Report ansehen:**
```bash
npm run test:coverage
# Öffne coverage/index.html im Browser
```

**2. Ungetestete Dateien finden:**
```bash
npm run test:coverage -- --reporter=json
# Prüfe coverage/coverage-summary.json
```

**3. Kritische Pfade testen:**
```typescript
// Alle Branches abdecken
it('should handle all cases', () => {
  expect(func(true)).toBe('case1');   // if-branch
  expect(func(false)).toBe('case2');  // else-branch
});
```

**4. Mocks für externe Services:**
```typescript
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'AI response' } }]
        })
      }
    }
  }))
}));
```

### Playwright-Tests schlagen fehl

**Häufige Probleme:**

**1. Browser nicht installiert:**
```bash
npx playwright install
```

**2. Timeout (Element nicht gefunden):**
```typescript
// ❌ Standard-Timeout zu kurz
await page.click('button');

// ✅ Timeout erhöhen
await page.click('button', { timeout: 10000 });
```

**3. Flaky Tests (manchmal pass, manchmal fail):**
```typescript
// ❌ Race Condition
await page.click('button');
expect(page.locator('.result')).toBeVisible();

// ✅ Warten auf Element
await page.click('button');
await page.waitForSelector('.result');
expect(page.locator('.result')).toBeVisible();
```

**4. Headless-Modus debuggen:**
```bash
# Mit Browser-UI testen
npx playwright test --headed

# Debug-Modus mit Pause
npx playwright test --debug
```

---

## Häufige Fehler (Quick-Fixes)

### `Module not found` - Fehler

✅ `npm install` ausgeführt?  
✅ `node_modules` vorhanden?  
✅ TypeScript-Pfade korrekt? (tsconfig.json)  
✅ Dateiendung `.ts` oder `.tsx`?  

### `Port already in use`

✅ Port 80/3001 bereits belegt?  
```bash
# Windows
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001

# Prozess killen
kill -9 <PID>
```

### `ECONNREFUSED` - Verbindungsfehler

✅ Backend läuft?  
✅ `VITE_BACKEND_URL` korrekt?  
✅ Firewall blockiert Port?  
✅ Docker-Container gestartet?  

### TypeScript-Fehler trotz korrektem Code

✅ VS Code TypeScript-Server neu starten (Cmd+Shift+P → "Restart TS Server")  
✅ `node_modules` löschen, `npm install` neu  
✅ `tsconfig.json` Syntax korrekt?  

### Build schlägt fehl mit Memory-Error

✅ Node Memory erhöhen:  
```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

---

## Tool Reference & Architektur

> **Für Entwickler:** Dieser Abschnitt zeigt **was die Tools machen** (Kundensicht) und **wie sie technisch gebaut sind** (Developer-Sicht).

### Tool-Kategorien Übersicht

A.R.I. hat **51 assistierende Tools** in 4 Kategorien:

| Kategorie | Anzahl | Backend-Pfad | Zweck |
|-----------|--------|--------------|-------|
| **Analytics** | 13 | `backend/tools/analytics/` | Daten-Analyse, Reporting, Metriken |
| **Products** | 9 | `backend/tools/products/` | Produktmanagement, WooCommerce-Integration |
| **Payments** | 12 | `backend/tools/payments/` | Zahlungs-Verarbeitung, Checkout-Optimierung |
| **Marketing** | 10 | `backend/tools/marketing/` | Content-Generierung, E-Mail, Social Media |
| **Advanced** | 7 | `backend/tools/advanced/` | System-Tools, Sync, Memory |

**Wichtiges Prinzip:** Alle Tools sind **assistierend, nicht autonom**. Änderungen gehen nur mit User-Freigabe live.

---

### Analytics Tools (13)

#### 1. Shop Metrics

**Was es tut:**  
Liest Basis-KPIs aus WooCommerce (Umsatz, Bestellungen, Conversion, Kunden).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/analytics/shop-metrics.ts`
- **API-Endpoint:** `GET /api/analytics/shop-metrics`
- **Dependencies:** WooCommerce REST API (`/wp-json/wc/v3/reports`)
- **Response-Format:**
```typescript
interface ShopMetrics {
  revenue: number;
  orders: number;
  conversion_rate: number;
  customers: number;
  avg_order_value: number;
  period: string;
}
```

**WooCommerce API-Calls:**
- `GET /wp-json/wc/v3/reports/sales`
- `GET /wp-json/wc/v3/reports/orders/totals`
- `GET /wp-json/wc/v3/customers`

---

#### 2. Conversion Analysis

**Was es tut:**  
Analysiert Conversion-Funnel (wo brechen Nutzer ab?).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/analytics/conversion-analysis.ts`
- **API-Endpoint:** `POST /api/analytics/conversion`
- **Request-Payload:**
```typescript
{
  dateRange: { start: string; end: string };
  funnelSteps: string[];
}
```
- **OpenAI Integration:** `gpt-4o-mini` für Funnel-Analyse
- **Output:** Funnel-Bericht mit Drop-Off-Punkten

---

#### 3. Feedback Analysis

**Was es tut:**  
Analysiert WooCommerce-Reviews und Support-Tickets (via Awesome Support Plugin).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/analytics/feedback-analysis.ts`
- **API-Endpoints:**
  - `GET /api/analytics/feedback`
  - `POST /api/analytics/sentiment`
- **Dependencies:**
  - WooCommerce Reviews API
  - Awesome Support REST API
- **OpenAI Call:** Sentiment-Analyse mit GPT-4o-mini
- **Output-Format:**
```typescript
interface FeedbackAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // 0-100
  insights: string[];
  priorities: Array<{issue: string; severity: 'high' | 'medium' | 'low'}>;
}
```

---

#### 4. Conversion Reported

**Was es tut:**  
Erstellt automatisierte Conversion-Reports.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/analytics/conversion-reported.ts`
- **API-Endpoint:** `POST /api/analytics/conversion-report`
- **Output:** PDF/Excel-Report (via `jsPDF` / `exceljs`)
- **Schedule:** Optional via `backend/scheduler.ts`

---

#### 5. Trend Analysis

**Was es tut:**  
Erkennt Trends in Verkäufen/Traffic/Nachfrage.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/analytics/trend-analysis.ts`
- **API-Endpoint:** `GET /api/analytics/trends`
- **Algorithmus:** Zeit-Reihen-Analyse mit Moving Average
- **OpenAI:** Trend-Interpretation mit GPT-4o-mini
- **Output:** Trend-Verlauf, Prognosen

---

#### 6. Run Trend Analysis

**Was es tut:**  
Startet Trend-Analyse-Job manuell.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/analytics/run-trend-analysis.ts`
- **API-Endpoint:** `POST /api/analytics/trends/run`
- **Job-Queue:** Nutzt `backend/scheduler.ts` für async execution

---

#### 7. Real Analytics

**Was es tut:**  
Zeigt Live-Metriken in Echtzeit.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/analytics/real-analytics.ts`
- **API-Endpoint:** `GET /api/analytics/realtime` (WebSocket)
- **Technology:** WebSocket-Connection für Live-Updates
- **Update-Intervall:** Alle 5 Sekunden

---

#### 8. Real Web Analytics

**Was es tut:**  
Web-Analytics in Echtzeit (Besucher, Klicks, Sessions).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/analytics/real-web-analytics.ts`
- **API-Endpoint:** `WS /api/analytics/web-realtime`
- **Tracking:** Custom Analytics (keine Google Analytics Dependency)
- **Data-Source:** `backend/data/analytics-events.json`

---

#### 9. Analytic Regioning

**Was es tut:**  
Geo-/Regionen-Analyse (wo kommen Kunden her?).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/analytics/analytic-regioning.ts`
- **API-Endpoint:** `GET /api/analytics/regions`
- **Data-Source:** WooCommerce Order-Daten (Shipping Address)
- **Geo-Mapping:** GeoJSON für Heatmap-Rendering

---

#### 10. Shop Health Report

**Was es tut:**  
Umfassender Shop-Gesundheitscheck (Performance, SEO, Security).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/analytics/shop-health-report.ts`
- **API-Endpoint:** `POST /api/analytics/health-check`
- **Checks:**
  - Lighthouse API (Performance)
  - SEO Crawler
  - Security Headers Check
- **Output:** Health-Score (0-100), Problemliste

---

#### 11. Premium Audit

**Was es tut:**  
Tiefgehender Business-Audit (Wettbewerb, Markt, Finanzen).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/analytics/premium-audit.ts`
- **API-Endpoint:** `POST /api/analytics/premium-audit`
- **OpenAI Call:** GPT-4o-mini für Markt-Analyse
- **Data Sources:** WooCommerce + User-Input (Competitor URLs)

---

#### 12. Standard Audit

**Was es tut:**  
Standard-Audit (Performance, SEO, UX).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/analytics/standard-audit.ts`
- **API-Endpoint:** `POST /api/analytics/standard-audit`
- **Lighter Version** von Premium Audit

---

#### 13. Mini Audit

**Was es tut:**  
Schneller Audit-Light (Ladezeiten, Mobile, Basics).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/analytics/mini-audit.ts`
- **API-Endpoint:** `POST /api/analytics/mini-audit`
- **Duration:** < 30 Sekunden
- **Checks:** Nur kritische Performance-Metriken

---

### Products Tools (9)

#### 14. Auto Product Creator

**Was es tut:**  
Erstellt Marketing-Material für Produkte (Texte, Bild-Prompts) mit KI. **Nicht** das Produkt selbst.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/products/auto-product-creator.ts`
- **API-Endpoint:** `POST /api/products/auto-create`
- **OpenAI Call:** GPT-4o-mini für Beschreibungen, DALL-E für Bild-Prompts
- **Request-Payload:**
```typescript
{
  title: string;
  category: string;
  keywords: string[];
  tone: 'professional' | 'casual' | 'enthusiastic';
}
```
- **Output:** Beschreibungsentwurf, Bild-Prompt (kein WooCommerce-Upload!)

---

#### 15. Run Auto Product Creator

**Was es tut:**  
Startet Auto-Product-Creator-Job sofort.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/products/run-auto-product-creator.ts`
- **API-Endpoint:** `POST /api/products/auto-create/run`
- **Job-Trigger:** Synchroner API-Call

---

#### 16. Woo Product Create

**Was es tut:**  
Legt neues WooCommerce-Produkt an.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/products/woo-product-create.ts`
- **API-Endpoint:** `POST /api/products/create`
- **WooCommerce API:** `POST /wp-json/wc/v3/products`
- **Request-Payload:**
```typescript
{
  name: string;
  type: 'simple' | 'variable' | 'virtual' | 'downloadable';
  regular_price: string;
  description: string;
  short_description: string;
  categories: Array<{id: number}>;
  images: Array<{src: string}>;
}
```
- **User-Freigabe:** Erforderlich via Frontend-Confirmation

---

#### 17. Woo Product Update

**Was es tut:**  
Aktualisiert bestehendes WooCommerce-Produkt.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/products/woo-product-update.ts`
- **API-Endpoint:** `PUT /api/products/:id`
- **WooCommerce API:** `PUT /wp-json/wc/v3/products/:id`

---

#### 18. Product Analysis

**Was es tut:**  
Analysiert Produkte (Score, Metriken, Empfehlungen).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/products/product-analysis.ts`
- **API-Endpoint:** `GET /api/products/:id/analyze`
- **Metrics:**
  - SEO Score
  - Image Quality Score
  - Pricing Analysis
  - Conversion Potential
- **OpenAI:** Recommendations mit GPT-4o-mini

---

#### 19. Categories Manager

**Was es tut:**  
Verwaltet WooCommerce-Kategorien (erstellen, umbenennen).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/products/categories-manager.ts`
- **API-Endpoints:**
  - `GET /api/categories`
  - `POST /api/categories`
  - `PUT /api/categories/:id`
  - `DELETE /api/categories/:id`
- **WooCommerce API:** `/wp-json/wc/v3/products/categories`

---

#### 20. Create Freebies

**Was es tut:**  
Erstellt Freebie-Produkteinträge (0 €, digital, downloadable). **User muss Datei bereitstellen.**

**Technische Details:**
- **Backend-Pfad:** `backend/tools/products/create-freebies.ts`
- **API-Endpoint:** `POST /api/products/freebies`
- **File-Upload:** Via `multer` (ZIP/PDF)
- **WooCommerce API:**
  - Upload File: `POST /wp-json/wp/v2/media`
  - Create Product: `POST /wp-json/wc/v3/products` (type: `downloadable`, price: 0)

---

#### 21. Run Create Freebies

**Was es tut:**  
Startet Freebie-Job sofort.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/products/run-create-freebies.ts`
- **API-Endpoint:** `POST /api/products/freebies/run`

---

#### 22. Product Bundles

**Was es tut:**  
Erstellt Produkt-Bundles (mehrere Produkte zusammen).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/products/product-bundles.ts`
- **API-Endpoint:** `POST /api/products/bundles`
- **WooCommerce Plugin:** Erfordert "WooCommerce Product Bundles" Plugin
- **Fallback:** Wenn Plugin fehlt → Grouped Product erstellen

---

### Payments Tools (12)

#### 23. Payment Fast

**Was es tut:**  
Beschleunigt Zahlungs-Verarbeitung (One-Click, Tokenization).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/payments/payment-fast.ts`
- **API-Endpoint:** `POST /api/payments/fast`
- **Optimization:**
  - Pre-fill checkout fields
  - Tokenization für returning customers
  - Express checkout buttons (Apple Pay, Google Pay)

---

#### 24. Payment Simplified

**Was es tut:**  
Vereinfacht Checkout (weniger Schritte, Auto-Fill).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/payments/payment-simplified.ts`
- **API-Endpoint:** `POST /api/payments/simplify`
- **Changes:**
  - Remove unnecessary fields
  - Auto-fill shipping = billing
  - Guest checkout enabled

---

#### 25. Payment Tester

**Was es tut:**  
Testet Payment-Flows automatisch.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/payments/payment-tester.ts`
- **API-Endpoint:** `POST /api/payments/test`
- **Test-Scenarios:**
  - Valid card → Success
  - Invalid card → Decline
  - Network timeout → Retry
- **Output:** Test-Bericht mit Erfolgsquoten

---

#### 26. Payment Verifier

**Was es tut:**  
Verifiziert Zahlungen (Fraud-Check, Validierung).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/payments/payment-verifier.ts`
- **API-Endpoint:** `POST /api/payments/verify`
- **Fraud-Checks:**
  - Card BIN validation
  - AVS (Address Verification)
  - CVV check
  - IP-Geolocation match

---

#### 27. Payment Success

**Was es tut:**  
Überwacht Erfolgsraten, Conversion.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/payments/payment-success.ts`
- **API-Endpoint:** `GET /api/payments/success-rate`
- **Metrics:**
  - Success rate (%)
  - Decline reasons
  - Average processing time

---

#### 28. Payment Validation

**Was es tut:**  
Validiert Zahlungen (Karte, Identität, Risiko).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/payments/payment-validation.ts`
- **API-Endpoint:** `POST /api/payments/validate`
- **Validation-Rules:**
  - Luhn algorithm (card number)
  - Expiry date check
  - CVV format

---

#### 29. Payment Issued Detector

**Was es tut:**  
Erkennt Payment-Probleme (Fehler, Declines).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/payments/payment-issued-detector.ts`
- **API-Endpoint:** `GET /api/payments/issues`
- **Detection:**
  - Parse payment gateway logs
  - Identify error codes
  - Categorize issues

---

#### 30. Payment User Favor

**Was es tut:**  
Optimiert Payment-UX (bevorzugte Zahlarten).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/payments/payment-user-favor.ts`
- **API-Endpoint:** `POST /api/payments/personalize`
- **Personalization:**
  - Remember last payment method
  - Show preferred method first
  - Country-specific defaults

---

#### 31. Payment Delivery

**Was es tut:**  
Managt Payment-Delivery-Flow (Versand nach Zahlung).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/payments/payment-delivery.ts`
- **API-Endpoint:** `GET /api/payments/delivery-status`
- **Integration:** WooCommerce Order Status Webhooks

---

#### 32. Payment Emergency

**Was es tut:**  
Notfall-Modus bei Payment-Problemen (Systemausfall).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/payments/payment-emergency.ts`
- **API-Endpoint:** `POST /api/payments/emergency`
- **Emergency-Actions:**
  - Fallback to alternative gateway
  - Manual payment instructions
  - Email admin

---

#### 33. Payment Expansion

**Was es tut:**  
Erweitert Payment-Optionen (internationale Währungen, neue Methoden).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/payments/payment-expansion.ts`
- **API-Endpoint:** `POST /api/payments/expand`
- **New-Methods:**
  - Cryptocurrency
  - Buy Now Pay Later (Klarna, Affirm)
  - Regional methods (iDEAL, Giropay)

---

#### 34. Payment Quick Check

**Was es tut:**  
Schneller Payment-Status-Check.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/payments/payment-quick-check.ts`
- **API-Endpoint:** `GET /api/payments/:transactionId/status`
- **Response:**
```typescript
{
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  amount: number;
  gateway: string;
}
```

---

### Marketing Tools (10)

#### 35. AI Email Generator

**Was es tut:**  
Erstellt E-Mail-Entwürfe mit KI.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/marketing/ai-email-generator.ts`
- **API-Endpoint:** `POST /api/marketing/email/generate`
- **OpenAI Call:** GPT-4o-mini
- **Request-Payload:**
```typescript
{
  subject: string;
  audience: string;
  tone: 'professional' | 'casual' | 'friendly';
  length: 'short' | 'medium' | 'long';
}
```
- **Output:** HTML + Plain-Text Email

---

#### 36. German Content Generator

**Was es tut:**  
Generiert deutsche Marketing-Texte.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/marketing/german-content-generator.ts`
- **API-Endpoint:** `POST /api/marketing/content/german`
- **OpenAI Call:** GPT-4o-mini mit German prompt
- **Content-Types:**
  - Blog posts
  - Product descriptions
  - Social media posts
  - Ad copy

---

#### 37. Email Marketing Automation

**Was es tut:**  
Erstellt E-Mail-Sequenzen (Welcome, Winback).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/marketing/email-marketing-automation.ts`
- **API-Endpoint:** `POST /api/marketing/email/sequence`
- **Sequence-Types:**
  - Welcome series (3-5 emails)
  - Abandoned cart (2-3 emails)
  - Winback campaign (2-4 emails)
- **OpenAI:** Email-Generierung mit GPT-4o-mini

---

#### 38. Social Media Audio

**Was es tut:**  
Erstellt Audio-Content für Social Media.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/marketing/social-media-audio.ts`
- **API-Endpoint:** `POST /api/marketing/audio/generate`
- **TTS:** OpenAI TTS API
- **Voices:** `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`
- **Output:** MP3 file

---

#### 39. Social Media Poster

**Was es tut:**  
Erstellt Social-Post-Entwürfe für LinkedIn, Facebook, Instagram, TikTok, X, YouTube.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/marketing/social-media-poster.ts`
- **API-Endpoint:** `POST /api/marketing/social/post`
- **Request-Payload:**
```typescript
{
  topic: string;
  audience: string;
  tone: string;
  platforms: Array<'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'youtube'>;
  includeHashtags: boolean;
  includeEmojis: boolean;
}
```
- **OpenAI:** Platform-specific post generation
- **Post-Publishing:** Requires API tokens in `Settings → Social Media`
  - LinkedIn: OAuth2 Token
  - Facebook/Instagram: Graph API Token
  - Twitter: OAuth 1.0a
  - TikTok: API Token
  - YouTube: Google API Token
- **Siehe auch:** `social_media_onboarding.md` für Token-Setup

---

#### 40. Free to Post Converter

**Was es tut:**  
Konvertiert Free-User zu aktiven Postern (Aktivierungskampagnen).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/marketing/free-to-post-converter.ts`
- **API-Endpoint:** `POST /api/marketing/activation-campaign`
- **Campaign-Types:**
  - Email drip
  - Push notifications
  - In-app messages

---

#### 41. Content Monetized

**Was es tut:**  
Monetarisiert Inhalte (Paywall, Affiliate, Digital Products).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/marketing/content-monetized.ts`
- **API-Endpoint:** `POST /api/marketing/monetize`
- **Monetization-Strategies:**
  - Paywall integration
  - Affiliate links insertion
  - Digital product creation (PDF, Course)

---

#### 42. Kite Templates

**Was es tut:**  
Vorlagen-Bibliothek für E-Mails, Landing Pages, Posts.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/marketing/kite-templates.ts`
- **API-Endpoint:** `GET /api/marketing/templates`
- **Template-Types:**
  - Email templates (50+)
  - Landing page templates (20+)
  - Social post templates (30+)
- **Format:** HTML + CSS + Variables

---

#### 43. Blogpost Generator

**Was es tut:**  
Generiert Blogpost-Entwürfe.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/marketing/blogpost-generator.ts`
- **API-Endpoint:** `POST /api/marketing/blog/generate`
- **OpenAI Call:** GPT-4o-mini
- **Request-Payload:**
```typescript
{
  topic: string;
  keywords: string[];
  length: number; // words
  tone: string;
  outline: boolean; // Generate outline first?
}
```
- **Output:** Markdown blogpost mit H2/H3 headings, SEO-optimized

---

#### 44. Image Analyzer

**Was es tut:**  
Analysiert Bilder (SEO, Alt-Text, Qualität).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/marketing/image-analyzer.ts`
- **API-Endpoint:** `POST /api/marketing/image/analyze`
- **Analysis:**
  - Image dimensions
  - File size optimization
  - Alt-text quality
  - SEO score
  - Accessibility check
- **OpenAI Vision API:** Alt-text suggestions

---

### Advanced Tools (7)

#### 45. Context Generator

**Was es tut:**  
Generiert KI-Kontexte/Prompts für bessere Ergebnisse.

**Technische Details:**
- **Backend-Pfad:** `backend/tools/advanced/context-generator.ts`
- **API-Endpoint:** `POST /api/advanced/context`
- **Use-Cases:**
  - Improve existing prompts
  - Generate system context
  - Create few-shot examples

---

#### 46. String Generator

**Was es tut:**  
Generiert Strings/Patterns (Code, Test-Daten, UUIDs).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/advanced/string-generator.ts`
- **API-Endpoint:** `POST /api/advanced/strings`
- **String-Types:**
  - UUIDs
  - Random passwords
  - API keys
  - Test data (names, emails, addresses)
  - Code snippets

---

#### 47. Auto Framplementator

**Was es tut:**  
Erstellt Framework-/Boilerplate-Setup (React, Node, etc.).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/advanced/auto-framplementator.ts`
- **API-Endpoint:** `POST /api/advanced/framework-setup`
- **Supported-Frameworks:**
  - React (Vite, CRA)
  - Next.js
  - Node.js + Express/Fastify
  - Vue.js
  - Python + FastAPI

---

#### 48. WooCommerce Sync

**Was es tut:**  
Synchronisiert WooCommerce-Daten (Produkte, Orders, Kunden).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/advanced/woocommerce-sync.ts`
- **API-Endpoint:** `POST /api/advanced/woo-sync`
- **Sync-Intervals:** Manual, Hourly, Daily
- **Sync-Entities:**
  - Products
  - Orders
  - Customers
  - Categories
  - Coupons
- **WooCommerce API:** Batch requests für Performance

---

#### 49. Memory System

**Was es tut:**  
KI-Gedächtnis für personalisierte Ergebnisse (User-Präferenzen, Context).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/advanced/memory-system.ts`
- **API-Endpoints:**
  - `POST /api/memory/store`
  - `GET /api/memory/recall`
- **Storage:** In-Memory (Redis-ähnlich)
- **Persistence:** Temporär im RAM, kein Langzeit-Speicher
- **Use-Cases:**
  - Remember user preferences
  - Conversation context
  - Recent interactions

---

#### 50. System Health

**Was es tut:**  
Prüft Systemzustand (CPU, Memory, API-Status).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/advanced/system-health.ts`
- **API-Endpoint:** `GET /api/health` (auch für Kubernetes Liveness Probe!)
- **Checks:**
  - CPU usage
  - Memory usage
  - Disk space
  - API response times
  - Database connection
  - WooCommerce connection
  - OpenAI API status
- **Response:**
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  checks: {
    cpu: { status: string; value: number };
    memory: { status: string; value: number };
    apis: { woocommerce: string; openai: string };
  };
}
```

---

#### 51. User Management (Customer Intelligence)

**Was es tut:**  
Analysiert Kunden-Verhalten (Umsätze pro User, Bestellhistorie, Shop-Besuche, Engagement).

**Technische Details:**
- **Backend-Pfad:** `backend/tools/advanced/user-management.ts`
- **API-Endpoints:**
  - `GET /api/users` (Liste aller Kunden)
  - `GET /api/users/:id` (Einzelkunde mit Details)
  - `POST /api/users/:id/offers` (Personalisierte Angebote generieren)
- **WooCommerce API:**
  - `GET /wp-json/wc/v3/customers`
  - `GET /wp-json/wc/v3/customers/:id/orders`
- **OpenAI Call:** Personalisierte Angebots-Vorschläge mit GPT-4o-mini
- **Metrics:**
  - Total revenue per customer
  - Average order value
  - Order frequency
  - Last purchase date
  - Engagement score
- **Output:** Kunden-Dashboard + KI-generierte Offer-Suggestions

---

## Tool-Entwicklung: Ein neues Tool hinzufügen

### Tool-Anatomie

Jedes Tool besteht aus:

1. **Backend-Handler** (`backend/tools/[category]/[tool-name].ts`)
2. **API-Route** (`backend/routes/tools.ts`)
3. **Frontend-Component** (`frontend/src/components/tools/[ToolName].tsx`)
4. **Tool-Registration** (`backend/tools/index.ts`)

### Step-by-Step: Neues Tool erstellen

#### 1. Backend-Handler erstellen

```typescript
// backend/tools/marketing/my-new-tool.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { openaiService } from '@/services/openaiService';

interface MyToolRequest {
  input: string;
  options: Record<string, any>;
}

export async function myNewToolHandler(
  request: FastifyRequest<{ Body: MyToolRequest }>,
  reply: FastifyReply
) {
  try {
    const { input, options } = request.body;

    // Validation
    if (!input) {
      return reply.code(400).send({ error: 'Input required' });
    }

    // Business logic
    const result = await openaiService.generate({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: input }],
    });

    return reply.send({
      success: true,
      data: result,
    });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}
```

#### 2. API-Route registrieren

```typescript
// backend/routes/tools.ts
import { myNewToolHandler } from '@/tools/marketing/my-new-tool';

export async function toolRoutes(fastify) {
  // ... existing routes

  fastify.post('/api/tools/my-new-tool', myNewToolHandler);
}
```

#### 3. Frontend-Component erstellen

```tsx
// frontend/src/components/tools/MyNewTool.tsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

export function MyNewTool() {
  const [input, setInput] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { input: string }) =>
      api.post('/tools/my-new-tool', data),
  });

  const handleSubmit = () => {
    mutation.mutate({ input });
  };

  return (
    <div className="tool-container">
      <h2>My New Tool</h2>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your input..."
      />
      <button onClick={handleSubmit} disabled={mutation.isPending}>
        {mutation.isPending ? 'Processing...' : 'Generate'}
      </button>
      {mutation.data && (
        <div className="result">{mutation.data.data}</div>
      )}
    </div>
  );
}
```

#### 4. Tool registrieren

```typescript
// backend/tools/index.ts
export const TOOLS = {
  // ... existing tools
  MY_NEW_TOOL: {
    id: 'my-new-tool',
    name: 'My New Tool',
    category: 'marketing',
    description: 'Description of what it does',
    endpoint: '/api/tools/my-new-tool',
    handler: myNewToolHandler,
  },
};
```

#### 5. Frontend-Route hinzufügen

```tsx
// frontend/src/App.tsx
import { MyNewTool } from '@/components/tools/MyNewTool';

function App() {
  return (
    <Routes>
      {/* ... existing routes */}
      <Route path="/tools/my-new-tool" element={<MyNewTool />} />
    </Routes>
  );
}
```

### Best Practices für Tool-Entwicklung

✅ **Input-Validation:** Immer validieren (Zod, Joi)  
✅ **Error-Handling:** Try/Catch + sinnvolle Error-Messages  
✅ **Rate-Limiting:** Für OpenAI-Calls (max 10 req/min)  
✅ **Logging:** Alle Tool-Calls loggen (`backend/logger.ts`)  
✅ **User-Freigabe:** Bei WooCommerce-Mutations immer Confirmation  
✅ **Testing:** Unit-Tests für Backend-Handler (`tests/unit/tools/`)  
✅ **Documentation:** Beschreibung in Bedienungsanleitung.md hinzufügen

---

**Letzte Aktualisierung:** Januar 5, 2026  
**Version:** 1.0.0  
**Erstellt für:** Entwickler & System-Administratoren

---

## 12. Emergency Alerting & Monitoring

### Übersicht

Das Payment Emergency System nutzt **GPT-4o-mini** zur Analyse kritischer Incidents und sendet automatisch Alarme an konfigurierte Kanäle.

---

### Unterstützte Alerting-Kanäle

#### 1. Slack 💬
- **Typ**: Instant Messaging
- **Trigger**: Alle Notfälle (P0-P3)
- **Format**: Rich Message mit Ticket-ID, Severity, Impact, Escalation Path

**Setup:**
```bash
# 1. Slack Incoming Webhook erstellen
# https://api.slack.com/messaging/webhooks

# 2. In .env eintragen
SLACK_EMERGENCY_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Slack Message Beispiel:**
```
🚨 PAYMENT EMERGENCY

Ticket:           EMG-1733934567-A3B9F2
Priority:         CRITICAL
Severity:         P0
Customers:        1,523
Revenue at Risk:  €127,450
SLA Violation:    ❌ YES

Escalation Path:
1. L1 Support
2. Payment Lead
3. CTO
```

---

#### 2. Email 📧
- **Typ**: Email Notification
- **Trigger**: Alle Notfälle (P0-P3)
- **Format**: HTML Email mit vollständiger Incident-Analyse

**Setup:**
```bash
# In .env eintragen
EMERGENCY_ALERT_EMAIL=devops@your-company.com,oncall@your-company.com
```

**Voraussetzungen:**
- Nutzt dein bestehendes Email-System
- In `backend/services/emailService.ts` integrieren
- SMTP-Konfiguration erforderlich

---

#### 3. PagerDuty 📟
- **Typ**: Incident Management & On-Call Alerting
- **Trigger**: Nur P0/P1 (Critical/High)
- **Format**: PagerDuty Event mit Custom Details

**Setup:**
```bash
# 1. PagerDuty Service erstellen
# https://support.pagerduty.com/docs/services-and-integrations

# 2. Events API v2 Integration Key kopieren

# 3. In .env eintragen
PAGERDUTY_INTEGRATION_KEY=your-integration-key-here
```

**PagerDuty Features:**
- ✅ Automatische Incident Creation für P0/P1
- ✅ On-Call Engineer wird sofort benachrichtigt
- ✅ Escalation Policies werden befolgt
- ✅ Custom Details mit Ticket-ID, Impact, Revenue Risk

---

#### 4. Console Logging 📋
- **Typ**: Server Console Output
- **Trigger**: Immer aktiv (alle Notfälle)
- **Format**: Formatierter ASCII-Box Log

**Kein Setup erforderlich** - immer aktiv!

**Console Output Beispiel:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 PAYMENT EMERGENCY ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ticket:           EMG-1733934567-A3B9F2
Severity:         P0
Priority:         CRITICAL
Customers:        1,523
Revenue at Risk:  €127,450
SLA Violation:    YES ❌
Issue Type:       gateway-down

Escalation Path:
  1. L1 Support
  2. Payment Lead
  3. CTO

Alerts Sent: ✅ Slack notification sent, ✅ PagerDuty incident created, ✅ Email queued
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Konfiguration

**Backend (.env):**
```bash
# Slack
SLACK_EMERGENCY_WEBHOOK=https://hooks.slack.com/services/...

# Email
EMERGENCY_ALERT_EMAIL=devops@company.com

# PagerDuty (nur für P0/P1)
PAGERDUTY_INTEGRATION_KEY=your-key-here
```

**Alert Logic:**
```typescript
// In backend/routes/app/api/payments.ts

async function sendEmergencyAlerts(analysis: any): Promise<void> {
  // 1. Slack → Alle Notfälle
  if (process.env.SLACK_EMERGENCY_WEBHOOK) {
    await sendSlackAlert(analysis);
  }

  // 2. Email → Alle Notfälle
  if (process.env.EMERGENCY_ALERT_EMAIL) {
    await sendEmailAlert(analysis);
  }

  // 3. PagerDuty → Nur P0/P1
  if (process.env.PAGERDUTY_INTEGRATION_KEY && 
      (analysis.severity === 'P0' || analysis.severity === 'P1')) {
    await sendPagerDutyAlert(analysis);
  }

  // 4. Console → Immer
  console.log('🚨 PAYMENT EMERGENCY:', analysis);
}
```

---

### Severity Levels

| Severity | Priority | PagerDuty | Beschreibung |
|----------|----------|-----------|--------------|
| **P0** | CRITICAL | ✅ Ja | Total Outage, Umsatzverlust |
| **P1** | HIGH | ✅ Ja | Degraded Service, hoher Impact |
| **P2** | MEDIUM | ❌ Nein | Partielle Issues, mittlerer Impact |
| **P3** | LOW | ❌ Nein | Minor Issues, geringer Impact |

---

### Erweiterte Integration

**Jira/GitHub Issues:**
```typescript
// Jira Ticket
const jiraResponse = await fetch('https://your-domain.atlassian.net/rest/api/3/issue', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fields: {
      project: { key: 'PAYMENT' },
      summary: `[${analysis.severity}] Payment Emergency: ${analysis.metadata.issueType}`,
      description: analysis.communicationTemplate.internal,
      issuetype: { name: 'Bug' },
      priority: { name: analysis.priority }
    }
  })
});
```

**Microsoft Teams:**
```typescript
// Teams Webhook
const teamsPayload = {
  '@type': 'MessageCard',
  'title': `🚨 Payment Emergency: ${analysis.severity}`,
  'text': analysis.communicationTemplate.internal,
  'themeColor': analysis.severity === 'P0' ? 'FF3B30' : 'FF9500'
};
```

---

### Testing

**Test Emergency Alert:**
```bash
curl -X POST http://localhost:3000/api/payments/ml/emergency-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "issueType": "gateway-down",
    "description": "Payment Gateway nicht erreichbar seit 10 Minuten",
    "affectedCustomers": 1500,
    "financialImpact": 120000,
    "systemsAffected": ["Payment Gateway", "Checkout"]
  }'
```

**Erwartetes Verhalten:**
1. ✅ **GPT-4o-mini Analyse** läuft
2. ✅ **Severity** wird bestimmt (P0-P3)
3. ✅ **Slack Message** wird gesendet (falls konfiguriert)
4. ✅ **PagerDuty Incident** wird erstellt (P0/P1 nur)
5. ✅ **Console Log** wird ausgegeben
6. ✅ **Email** wird gequeued (falls konfiguriert)

---

### Security Best Practices

1. **Niemals** Webhook-URLs/Keys in Git committen
2. Nutze **Environment Variables** (.env)
3. In Production: **Secrets Management** (AWS Secrets Manager, Azure Key Vault, etc.)
4. **Rotate Keys** regelmäßig
5. **Monitor** Failed Alerts (z.B. via Sentry)

---

### Weitere Integrationen

- **Discord**: Ähnlich wie Slack Webhook
- **Telegram Bot**: Für mobile Alerts
- **Twilio SMS**: Für P0 Critical Alerts
- **Opsgenie**: Alternative zu PagerDuty
- **VictorOps/Splunk**: Enterprise Incident Management

---

## 13. Machine Learning Integration

### Übersicht

A.R.I. verfügt über ein **optionales ML-System** mit automatischem Fallback zu regelbasierten Algorithmen. ML-Features können pro Feature aktiviert/deaktiviert werden.

**Wichtiges Prinzip:** ML ist **nie zwingend** - alle Features haben Rule-based Fallbacks!

---

### ML-Features

A.R.I. unterstützt 7 ML-Features:

| Feature | Zweck | Fallback |
|---------|-------|----------|
| **Product Recommendations** | Personalisierte Produktempfehlungen | Regelbasierte Recommendations (Category-Match) |
| **Trend Forecasting** | Vorhersage von Verkaufstrends | Google Trends API |
| **Dynamic Pricing** | KI-basierte Preisoptimierung | Statische Pricing-Rules |
| **Email Optimization** | Beste Versandzeit für E-Mails | Default-Zeit (09:00 Uhr) |
| **Churn Prediction** | Kundenabwanderung vorhersagen | Activity-Score-Regeln |
| **Sentiment Analysis** | Review/Feedback-Analyse | Keyword-basierte Sentiment-Erkennung |
| **Fraud Detection** | Betrugserkennung bei Zahlungen | Threshold-basierte Rules |

---

### ML-Konfiguration

#### Backend (.env)

```bash
# ML Master Switch
ML_ENABLED=true

# Features (einzeln aktivierbar)
ML_PRODUCT_RECOMMENDATIONS=true
ML_TREND_FORECASTING=true
ML_DYNAMIC_PRICING=false
ML_EMAIL_OPTIMIZATION=true
ML_CHURN_PREDICTION=true
ML_SENTIMENT_ANALYSIS=true
ML_FRAUD_DETECTION=true

# Model Confidence Thresholds (0.0 - 1.0)
ML_PRODUCT_REC_MIN_CONFIDENCE=0.7
ML_TREND_MIN_CONFIDENCE=0.6
ML_EMAIL_MIN_CONFIDENCE=0.65

# Fallback Behavior
ML_PRODUCT_REC_FALLBACK=true
ML_TREND_FALLBACK=true
ML_EMAIL_FALLBACK=true
ML_EMAIL_DEFAULT_TIME=09:00

# Performance
ML_MAX_INFERENCE_TIME=5000  # Timeout in ms
ML_CACHE_RESULTS=true
ML_CACHE_TTL=3600  # Seconds
```

#### Frontend Settings (UI)

Nutzer können ML-Features auch über **Settings → ML Settings** konfigurieren:

**URL:** `/settings/ml`

**Features:**
- ✅ ML Master Switch (Enable/Disable all)
- ✅ Individual Feature Toggles
- ✅ Confidence Threshold Sliders
- ✅ Fallback Configuration
- ✅ Live ML Stats (Success Rate, Avg Confidence)

---

### ML Service Architecture

#### Automatic Fallback Pattern

```typescript
// backend/ml/mlService.ts

import { MLService } from './ml/mlService';

// Beispiel: Product Recommendations
const result = await MLService.predict(
  'productRecommendations',
  
  // ML Function
  async () => {
    const prediction = await ProductRecommendationEngine.predict(userId);
    return {
      prediction,
      confidence: 0.85,
      source: 'ml',
      inferenceTime: 120,
      modelVersion: '1.0.0'
    };
  },
  
  // Fallback Function (wenn ML fails oder confidence zu niedrig)
  async () => {
    return getRuleBasedRecommendations(userId);
  }
);

// Result hat immer diese Struktur:
interface MLPrediction<T> {
  prediction: T;
  confidence: number;
  source: 'ml' | 'rules' | 'fallback';
  inferenceTime: number; // ms
  modelVersion?: string;
}
```

**Fallback-Logik:**
1. ✅ ML disabled → Fallback sofort
2. ✅ ML timeout (> 5s) → Fallback
3. ✅ ML error → Fallback + Error-Logging
4. ✅ Confidence < Threshold → Fallback
5. ✅ Fallback disabled → ML result trotzdem nutzen

---

### ML-Models

#### 1. Product Recommendation Engine

**Pfad:** `backend/ml/models/productRecommendation.ts`

**Input:**
- User ID
- Purchase History
- Browsing Behavior
- Cart Items

**Output:**
```typescript
{
  recommendations: [
    { productId: 123, score: 0.89, reason: 'Frequently Bought Together' },
    { productId: 456, score: 0.76, reason: 'Similar Category' }
  ],
  confidence: 0.85
}
```

**Fallback:** Regelbasiert (Kategorie-Match, Bestseller)

---

#### 2. Trend Forecasting Engine

**Pfad:** `backend/ml/models/trendForecasting.ts`

**Input:**
- Historical Sales Data (30-90 Tage)
- Seasonality
- External Trends (optional: Google Trends)

**Output:**
```typescript
{
  forecast: [
    { date: '2026-02-01', sales: 15000, confidence: 0.82 },
    { date: '2026-02-02', sales: 16200, confidence: 0.79 }
  ],
  trend: 'upward' | 'stable' | 'downward',
  confidence: 0.78
}
```

**Fallback:** Google Trends API + Moving Average

---

#### 3. Email Send Time Optimization

**Pfad:** `backend/ml/models/emailSendTime.ts`

**Input:**
- User Timezone
- Email Open History
- Click-Through Rates
- Industry Benchmarks

**Output:**
```typescript
{
  optimalTime: '14:30',
  expectedOpenRate: 0.42,
  confidence: 0.71
}
```

**Fallback:** Default-Zeit (09:00 Uhr)

---

### ML-API Endpoints

#### GET /api/ml/config
```bash
curl http://localhost:3000/api/ml/config

# Response:
{
  "enabled": true,
  "features": {
    "productRecommendations": true,
    "trendForecasting": true,
    ...
  },
  "models": {
    "productRecommendation": {
      "enabled": true,
      "minConfidence": 0.7
    }
  }
}
```

#### POST /api/ml/config
```bash
curl -X POST http://localhost:3000/api/ml/config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "features": {
      "productRecommendations": true,
      "trendForecasting": false
    }
  }'
```

#### GET /api/ml/status
```bash
curl http://localhost:3000/api/ml/status

# Response:
{
  "enabled": true,
  "activeFeatures": ["productRecommendations", "emailOptimization"],
  "featureCount": 2,
  "models": {
    "productRecommendation": {
      "enabled": true,
      "minConfidence": 0.7
    }
  }
}
```

#### GET /api/ml/stats
```bash
curl http://localhost:3000/api/ml/stats

# Response:
{
  "success": true,
  "data": {
    "totalPredictions": 1234,
    "successRate": 0.94,
    "avgConfidence": 0.78,
    "avgInferenceTime": 145,
    "byFeature": {
      "productRecommendations": {
        "count": 856,
        "successRate": 0.96,
        "avgConfidence": 0.82
      }
    }
  }
}
```

---

### ML Testing

#### Unit Tests (22 Tests ✅)

**Pfad:** `tests/unit/ml/mlService.test.ts`

```typescript
import { MLService } from '@/ml/mlService';
import { mlConfig } from '@/config/ml.config';

describe('ML Service', () => {
  it('should use ML when enabled and confidence above threshold', async () => {
    mlConfig.enabled = true;
    mlConfig.features.productRecommendations = true;

    const mlFunction = vi.fn().mockResolvedValue({
      prediction: ['product1', 'product2'],
      confidence: 0.85,
      source: 'ml',
      inferenceTime: 100
    });

    const fallbackFunction = vi.fn();

    const result = await MLService.predict(
      'productRecommendations',
      mlFunction,
      fallbackFunction
    );

    expect(mlFunction).toHaveBeenCalled();
    expect(fallbackFunction).not.toHaveBeenCalled();
    expect(result.source).toBe('ml');
    expect(result.confidence).toBe(0.85);
  });

  it('should fallback when confidence below threshold', async () => {
    mlConfig.enabled = true;
    
    const mlFunction = vi.fn().mockResolvedValue({
      prediction: ['product1'],
      confidence: 0.4, // Below threshold (0.7)
      source: 'ml',
      inferenceTime: 100
    });

    const fallbackFunction = vi.fn().mockResolvedValue(['fallback1', 'fallback2']);

    const result = await MLService.predict(
      'productRecommendations',
      mlFunction,
      fallbackFunction
    );

    expect(fallbackFunction).toHaveBeenCalled();
    expect(result.source).toBe('fallback');
  });

  it('should timeout ML inference after max time', async () => {
    mlConfig.enabled = true;
    mlConfig.performance.maxInferenceTime = 100;

    const mlFunction = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 200))
    );

    const fallbackFunction = vi.fn().mockResolvedValue(['fallback']);

    const result = await MLService.predict(
      'productRecommendations',
      mlFunction,
      fallbackFunction
    );

    expect(result.source).toBe('fallback');
  });
});
```

**Test-Coverage:** 92% für ML Service

---

### ML in Production

#### Performance Monitoring

```typescript
// backend/services/mlStats.ts

export function recordMlEvent(feature: string, success: boolean, confidence: number) {
  events.push({
    feature,
    success,
    confidence,
    timestamp: Date.now()
  });
}

// Usage in ML Service:
const result = await MLService.predict(...);
recordMlEvent('productRecommendations', true, result.confidence);
```

#### Health Checks

```bash
# Prüfen ob ML funktioniert
curl http://localhost:3000/api/ml/status

# Prüfen ob Predictions laufen
curl http://localhost:3000/api/ml/stats
```

#### Debugging

**Enable Verbose Logging:**
```bash
# In .env
LOG_LEVEL=debug
DEBUG=ml:*
```

**Check ML Logs:**
```bash
docker compose logs backend | grep "ML prediction"

# Expected Output:
# ✅ ML prediction for productRecommendations: confidence=0.85, time=120ms
# ⚠️ ML confidence 0.45 below threshold 0.7, using fallback
```

---

### Häufige ML-Probleme

#### ML funktioniert nicht

**Check:**
1. `ML_ENABLED=true` in .env?
2. Feature-Flag aktiviert? (`ML_PRODUCT_RECOMMENDATIONS=true`)
3. Backend neu gestartet nach .env-Änderung?
4. Logs prüfen: `docker compose logs backend | grep ML`

**Fix:**
```bash
# .env prüfen
cat .env | grep ML_

# Backend neu starten
docker compose restart backend

# Status prüfen
curl http://localhost:3000/api/ml/status
```

---

#### ML immer im Fallback-Modus

**Ursache:** Confidence unter Threshold

**Check:**
```bash
curl http://localhost:3000/api/ml/stats

# Prüfe avgConfidence
```

**Fix:** Threshold senken
```bash
# In .env
ML_PRODUCT_REC_MIN_CONFIDENCE=0.5  # Default: 0.7
```

---

#### ML Timeout-Fehler

**Ursache:** Inference dauert > 5s

**Fix:** Timeout erhöhen
```bash
# In .env
ML_MAX_INFERENCE_TIME=10000  # 10 Sekunden
```

---

### Best Practices

✅ **Immer Fallback implementieren** - Niemals nur ML ohne Fallback  
✅ **Confidence Threshold testen** - Start mit 0.6-0.7, dann optimieren  
✅ **ML-Stats monitoren** - Regelmäßig `/api/ml/stats` prüfen  
✅ **Feature-Flags nutzen** - ML pro Feature einzeln aktivierbar  
✅ **Cache aktivieren** - Performance-Boost für häufige Predictions  
✅ **Timeouts konfigurieren** - Nie länger als 5s warten  
✅ **Logging aktivieren** - Für Debugging und Monitoring  

❌ **Niemals:** ML ohne .env-Konfiguration nutzen  
❌ **Niemals:** Alle Features auf einmal aktivieren (erst testen!)  
❌ **Niemals:** Fallback deaktivieren in Production  
