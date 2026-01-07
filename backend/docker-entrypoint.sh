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
chown -R nodeuser:nodejs /app/data /app/logs 2>/dev/null || echo "[Entrypoint] ℹ️  Berechtigungen bereits korrekt"
chmod -R 755 /app/data 2>/dev/null || true

# 3. CONNECTION.JSON INITIALISIEREN (ALLE FELDER - VOLLSTÄNDIG)
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
    "_comment": "Social Media Credentials (YouTube, TikTok, Instagram, Facebook, Twitter, LinkedIn)",
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
    "instagram": {
      "enabled": false,
      "accessToken": "",
      "businessAccountId": ""
    },
    "twitter": {
      "enabled": false,
      "apiKey": "",
      "apiSecret": "",
      "accessToken": "",
      "accessTokenSecret": ""
    },
    "tiktok": {
      "enabled": false,
      "accessToken": "",
      "refreshToken": ""
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
      "socialMedia.instagram",
      "socialMedia.twitter",
      "socialMedia.tiktok",
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
  }
}
CONNECTION_JSON

# 🔐 Ersetze Placeholder mit echtem Key
sed -i "s/SPEC_KEY_PLACEHOLDER/$SPEC_ENCRYPTION_KEY/g" /app/connection.json

echo "[Entrypoint] ✅ connection.json erfolgreich erstellt"
echo "[Entrypoint] 🔐 Verschlüsselungs-Key für Spezialisierungen generiert"

# 4. BERECHTIGUNGEN FÜR CONNECTION.JSON
echo "[Entrypoint] 🔒 Setze Berechtigungen für connection.json..."
chown nodeuser:nodejs /app/connection.json 2>/dev/null || true
chmod 600 /app/connection.json 2>/dev/null || true

# 5. VERIFIZIERUNG
echo "[Entrypoint] 📋 Final Setup Verification:"
echo "[Entrypoint]    ✓ connection.json size: $(stat -f%z /app/connection.json 2>/dev/null || stat -c%s /app/connection.json 2>/dev/null || echo 'unknown') bytes"
echo "[Entrypoint]    ✓ Data directory: /app/data (backups, dlq)"
echo "[Entrypoint]    ✓ NODE_ENV: ${NODE_ENV:-production}"
echo "[Entrypoint]    ✓ Port: ${PORT:-3000}"

# 6. STARTUP
echo "[Entrypoint] ✅ A.R.I. Backend Container startet jetzt..."
echo "[Entrypoint] 🚀 API verfügbar unter: http://localhost:3000"
echo "[Entrypoint] 📝 Bitte öffne Settings und fülle connection.json aus!"

# Privilegien absenken und Backend starten
exec su-exec nodeuser "$@"