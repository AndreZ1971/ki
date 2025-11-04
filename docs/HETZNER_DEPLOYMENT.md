# 🚀 Hetzner Deployment Guide

## 📋 Voraussetzungen

- **Hetzner Server**: CPX11 (2 vCPU, 2GB RAM) oder höher
- **Ubuntu 22.04 LTS** installiert
- **SSH-Zugang** zum Server
- **Domain** (optional, für HTTPS)

---

## 🏗️ Server Setup

### 1️⃣ SSH zum Server verbinden

```bash
ssh root@your-hetzner-ip
```

### 2️⃣ System aktualisieren

```bash
apt update && apt upgrade -y
```

### 3️⃣ Docker installieren

```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose installieren
apt install docker-compose -y

# Docker ohne sudo
usermod -aG docker $USER
```

### 4️⃣ Git installieren

```bash
apt install git -y
```

---

## 📦 Deployment

### 1️⃣ Repository klonen (oder Code hochladen)

```bash
# Option A: Git Clone (wenn du GitHub/GitLab verwendest)
git clone https://github.com/your-username/ki.git
cd ki

# Option B: Manuell hochladen via SCP
# Lokal auf deinem PC:
# scp -r C:\Entwicklung\neuer-git-ordner\ki root@your-hetzner-ip:/root/ki
```

### 2️⃣ .env.production anpassen

```bash
cd /root/ki
nano .env.production
```

**Trage deine echten Werte ein:**

```bash
# Shop Config
SHOP_ID=kaufe-es
SHOP_NAME="Kaufe-Es.eu"

# WooCommerce
WOOCOMMERCE_URL=https://kaufe-es.eu
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deine@email.de
SMTP_PASS=app-password-hier

# Server
NODE_ENV=production
PORT=3000
```

**Speichern**: `Ctrl+X` → `Y` → `Enter`

### 3️⃣ Deployment starten

```bash
# Deployment Script ausführbar machen
chmod +x deploy.sh

# Deployment starten
./deploy.sh
```

---

## 🔍 Prüfen ob alles läuft

### Health Check

```bash
curl http://localhost:3000/health
```

**Erwartete Ausgabe:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-04T...",
  "memory": {...},
  "services": ["api", "memory", "ai", "woocommerce"]
}
```

### Logs anschauen

```bash
# Alle Logs
docker-compose -f docker-compose.production.yml logs

# Live-Logs (laufend)
docker-compose -f docker-compose.production.yml logs -f

# Nur letzte 50 Zeilen
docker-compose -f docker-compose.production.yml logs --tail=50
```

### Container Status

```bash
docker ps
```

**Erwartete Ausgabe:**
```
CONTAINER ID   IMAGE                     STATUS        PORTS
abc123def456   kaufe-es-agent:latest     Up 2 minutes  0.0.0.0:3000->3000/tcp
```

---

## 🌐 Domain & HTTPS einrichten (Optional)

### 1️⃣ Nginx installieren

```bash
apt install nginx certbot python3-certbot-nginx -y
```

### 2️⃣ Nginx Config erstellen

```bash
nano /etc/nginx/sites-available/kaufe-es-agent
```

**Config einfügen:**

```nginx
server {
    listen 80;
    server_name agent.kaufe-es.eu;  # Deine Subdomain!

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3️⃣ Config aktivieren

```bash
# Symlink erstellen
ln -s /etc/nginx/sites-available/kaufe-es-agent /etc/nginx/sites-enabled/

# Nginx testen
nginx -t

# Nginx neustarten
systemctl restart nginx
```

### 4️⃣ SSL-Zertifikat (HTTPS)

```bash
certbot --nginx -d agent.kaufe-es.eu
```

**Certbot fragt nach:**
- Email-Adresse
- Terms of Service (Yes)
- Redirect HTTP → HTTPS (Yes)

**Fertig!** 🎉 Jetzt läuft dein Agent auf:
- ✅ `https://agent.kaufe-es.eu`

---

## 🔄 Updates deployen

### 1️⃣ Code aktualisieren

```bash
cd /root/ki
git pull  # Wenn du Git verwendest
# ODER manuell hochladen via SCP
```

### 2️⃣ Neu deployen

```bash
./deploy.sh
```

**Das war's!** 🚀

---

## 🛠️ Troubleshooting

### Container startet nicht?

```bash
# Logs anschauen
docker-compose -f docker-compose.production.yml logs

# Container neustarten
docker-compose -f docker-compose.production.yml restart
```

### Port 3000 schon belegt?

```bash
# Prüfen welcher Prozess Port 3000 verwendet
lsof -i :3000

# Prozess killen (vorsichtig!)
kill -9 <PID>
```

### Build Error?

```bash
# Docker neu bauen (ohne Cache)
docker-compose -f docker-compose.production.yml build --no-cache
```

### Health Check schlägt fehl?

```bash
# Prüfen ob Backend läuft
docker exec -it kaufe-es-agent ps aux

# Manuell in Container reingehen
docker exec -it kaufe-es-agent sh
```

---

## 📊 Monitoring

### Resource Usage

```bash
# CPU + RAM Usage
docker stats kaufe-es-agent
```

### Disk Space

```bash
# Disk Usage
df -h

# Docker Cleanup (alte Images löschen)
docker system prune -a
```

---

## 🔐 Sicherheit

### Firewall einrichten

```bash
# UFW installieren
apt install ufw -y

# SSH erlauben (WICHTIG!)
ufw allow 22/tcp

# HTTP/HTTPS erlauben
ufw allow 80/tcp
ufw allow 443/tcp

# Port 3000 NICHT nach außen öffnen (nur Nginx)
# ufw deny 3000/tcp

# Firewall aktivieren
ufw enable
```

### Automatische Updates

```bash
# Unattended Upgrades installieren
apt install unattended-upgrades -y
dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 🎉 Fertig!

Dein Agent läuft jetzt auf Hetzner! 🚀

**Nächste Schritte:**
- ✅ Domain einrichten (HTTPS)
- ✅ Monitoring aufsetzen (optional: Uptime Robot)
- ✅ Backups einrichten (optional: Hetzner Snapshots)
- ✅ CI/CD Pipeline (optional: GitHub Actions)
