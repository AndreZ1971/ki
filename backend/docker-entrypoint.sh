#!/bin/sh
set -e

###############################################################################
# A.R.I. Backend Container Entrypoint
# 
# Verwaltet:
# 1. Verzeichnis-Struktur (data, logs, backups)
# 2. Berechtigungen setzen
# 3. connection.json mit ALLEN Feldern initialisieren
# 4. Database Migrations (Falls nötig)
# 5. Backend Server starten
#
# Version: 5.1.0 | Updated: Dec 2025
###############################################################################

echo "[Entrypoint] 🚀 Starte A.R.I. Backend Container: $(date)"
echo "[Entrypoint] Benutzer: $(id -un) UID: $(id -u) GID: $(id -g)"

# 1. VERZEICHNISSE ERSTELLEN
echo "[Entrypoint] 📁 Erstelle benötigte Verzeichnisse..."
# Stellen sicher, dass Specializations-Verzeichnis existiert, falls der Host-Mount leer ist
mkdir -p /app/data/dlq /app/data/backups /app/logs /app/data/specializations 2>/dev/null || true

# 2. BERECHTIGUNGEN SETZEN (läuft als root, daher kann chown auf Mounts greifen)
echo "[Entrypoint] 🔐 Setze korrekte Berechtigungen..."
# Rechte-Harmonisierung für alle App-Verzeichnisse
chown -R 1001:1001 /app/public /app/dist /app/data /app/logs 2>/dev/null || true
chmod -R 755 /app/public /app/dist /app/data /app/logs 2>/dev/null || true
echo "[Entrypoint] ✅ Berechtigungen für public, dist, data, logs harmonisiert"

# 3. CONNECTION.JSON INITIALISIEREN (NUR WENN NICHT VORHANDEN)
if [ ! -f /app/connection.json ]; then
  echo "[Entrypoint] 📝 Erstelle connection.json mit ALLEN erforderlichen Feldern..."

  # 🔐 Generiere sicheren Encryption Key für Spezialisierungen (32 Bytes = 64 Hex Chars)
  SPEC_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  echo "[Entrypoint] 🔐 Generiere Verschlüsselungs-Key für Spezialisierungen..."

  cat <<'CONNECTION_JSON' > /app/connection.json
{
  "_description": "A.R.I. Configuration File - ALLE Felder müssen in UI gefüllt werden",
  
  "wordpress": {
    "_comment": "WordPress REST API Credentials",
    "url": "https://your-shop.com",
    "username": "your-wordpress-username",
    "appPassword": "xxxx xxxx xxxx xxxx xxxx"
  },

  "woocommerce": {
    "_comment": "WooCommerce REST API Credentials",
    "url": "https://your-shop.com",
    "consumerKey": "ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "consumerSecret": "cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "authMode": "basic",
    "timeoutMs": 30000
  },

  "openAI": {
    "_comment": "OpenAI API Credentials für KI-Features",
    "apiKey": "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "model": "gpt-4o-mini"
  },

  "smtp": {
    "_comment": "Email-Server für Benachrichtigungen und Marketing",
    "host": "mail.example.com",
    "port": 465,
    "secure": true,
    "user": "info@example.com",
    "password": "your-email-password",
    "from": "info@example.com"
  },

  "job": {
    "_comment": "Agentic Loop Execution Config (Zeitplan wird in loop-schedules.json verwaltet)",
    "mode": "once",
    "intervalMs": 900000
  },

  "features": {
    "_comment": "Opt-in Features - Aktivieren/Deaktivieren je nach Bedarf",
    "enableAnalytics": true,
    "enableAutoProducts": true,
    "enableEmailMarketing": true
  },

  "reddit": {
    "_comment": "Reddit OAuth Credentials (optional, für Social Media Integration)",
    "clientId": "xxxxxxxxxxxx",
    "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxx"
  },

  "support": {
    "_comment": "Support Ticket System Configuration",
    "ticketsEndpoint": "/wp-json/awesome-support/v1/tickets",
    "perPage": 20,
    "provider": "auto",
    "cptSlug": "wpas_ticket"
  },

  "ml": {
    "_comment": "Machine Learning & AI Feature Configuration",
    "enabled": true,
    "productRecommendations": true,
    "trendForecasting": true,
    "dynamicPricing": false,
    "emailOptimization": true,
    "churnPrediction": false,
    "sentimentAnalysis": false,
    "fraudDetection": false,
    "productRecMinConfidence": 0.7,
    "productRecFallback": true,
    "trendMinConfidence": 0.6,
    "trendFallback": true,
    "emailMinConfidence": 0.65,
    "emailFallback": true,
    "emailDefaultTime": "09:00",
    "maxInferenceTime": 5000,
    "cacheResults": true,
    "cacheTtl": 3600
  },

  "socialMedia": {
    "_comment": "Social Media Credentials (YouTube, Facebook, Twitter, LinkedIn)",
    "linkedin": {
      "enabled": false,
      "accessToken": "",
      "refreshToken": ""
    },
    "facebook": {
      "enabled": false,
      "accessToken": "",
      "pageId": ""
    },
    "twitter": {
      "enabled": false,
      "apiKey": "",
      "apiSecret": "",
      "accessToken": "",
      "accessTokenSecret": ""
    },
    "youtube": {
      "enabled": false,
      "accessToken": "",
      "refreshToken": "",
      "channelId": ""
    }
  },

  "onboarding": {
    "_comment": "Onboarding Status - wird von Backend automatisch verwaltet",
    "completed": false,
    "lastUpdated": null,
    "requiredFieldsComplete": false,
    "missingOptionalFields": [
      "reddit",
      "socialMedia.linkedin",
      "socialMedia.facebook",
      "socialMedia.twitter",
      "socialMedia.youtube"
    ]
  },

  "metadata": {
    "_comment": "Internal Metadata - nicht in UI editieren",
    "version": "5.1.0",
    "createdAt": "2025-12-19T00:00:00Z",
    "updatedAt": "2025-12-19T00:00:00Z",
    "environment": "production",
    "backups": []
  },

  "specialization": {
    "_comment": "ARI Specialization Encryption - Auto-generiert beim Container-Start",
    "encryptionKey": "SPEC_KEY_PLACEHOLDER"
  },

  "auth": {
    "_comment": "Login Credentials - Wird beim ersten Start leer sein, beim Setup gefüllt",
    "passwordHash": "",
    "isFirstLoginComplete": false,
    "lastPasswordSetAt": null,
    "passwordExpiry": null
  }
}
CONNECTION_JSON
  # 🔐 Ersetze Placeholder mit echtem Key
  sed -i "s/SPEC_KEY_PLACEHOLDER/$SPEC_ENCRYPTION_KEY/g" /app/connection.json

  echo "[Entrypoint] ✅ connection.json erfolgreich erstellt"
  echo "[Entrypoint] 🔐 Verschlüsselungs-Key für Spezialisierungen generiert"
else
  echo "[Entrypoint] 📄 Bestehende connection.json gefunden – Überschreiben wird übersprungen"
fi

# 4. .ENV.PRODUCTION INITIALISIEREN (FÜR SHOP_URL)
if [ ! -f /app/data/.env.production ]; then
  echo "[Entrypoint] 📝 Erstelle leere .env.production (wird beim Onboarding gefüllt)..."
  echo "# A.R.I. Production Configuration" > /app/data/.env.production
  echo "# Wird beim Onboarding befüllt" >> /app/data/.env.production
  echo "SHOP_URL=" >> /app/data/.env.production
else
  echo "[Entrypoint] ✅ .env.production gefunden"
fi

# Lade .env.production falls vorhanden
if [ -f /app/data/.env.production ]; then
  echo "[Entrypoint] 📋 Lade .env.production..."
  export $(cat /app/data/.env.production | grep -v '^#' | xargs)
  if [ -n "$SHOP_URL" ]; then
    echo "[Entrypoint] ✅ SHOP_URL geladen: $SHOP_URL"
  fi
fi

# 5. BERECHTIGUNGEN FÜR CONNECTION.JSON
echo "[Entrypoint] 🔒 Setze Berechtigungen für connection.json und .env.production..."
chown nodeuser:nodejs /app/connection.json 2>/dev/null || true
chmod 600 /app/connection.json 2>/dev/null || true
chown nodeuser:nodejs /app/data/.env.production 2>/dev/null || true
chmod 600 /app/data/.env.production 2>/dev/null || true

# 6. VERIFIZIERUNG
echo "[Entrypoint] 📋 Final Setup Verification:"
echo "[Entrypoint]    ✓ connection.json size: $(stat -f%z /app/connection.json 2>/dev/null || stat -c%s /app/connection.json 2>/dev/null || echo 'unknown') bytes"
echo "[Entrypoint]    ✓ .env.production: $([ -f /app/data/.env.production ] && echo 'vorhanden' || echo 'nicht gefunden')"
echo "[Entrypoint]    ✓ Data directory: /app/data (backups, dlq)"
echo "[Entrypoint]    ✓ NODE_ENV: ${NODE_ENV:-production}"
echo "[Entrypoint]    ✓ Port: ${PORT:-3000}"

# 7. STARTUP
echo "[Entrypoint] ✅ A.R.I. Backend Container startet jetzt..."
echo "[Entrypoint] 🚀 API verfügbar unter: http://localhost:3000"
if [ -f /app/connection.json ]; then
  echo "[Entrypoint] 📝 connection.json geladen. Änderungen über Settings möglich."
else
  echo "[Entrypoint] 📝 Bitte öffne Settings und fülle connection.json aus!"
fi

# Privilegien absenken und Backend starten
exec su-exec nodeuser "$@"