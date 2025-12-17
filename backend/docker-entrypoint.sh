#!/bin/sh
set -e

echo "[Entrypoint] Starte A.R.I. Backend Container: $(date)"
echo "[Entrypoint] Benutzer: $(id -un) UID: $(id -u) GID: $(id -g)"

# 1. Verzeichnisse erstellen
echo "[Entrypoint] Erstelle benötigte Verzeichnisse..."
mkdir -p /app/data/dlq /app/logs 2>/dev/null || true

# 2. Rechte setzen
echo "[Entrypoint] Setze korrekte Rechte..."
chown -R nodeuser:nodejs /app/data /app/logs 2>/dev/null || echo "[Entrypoint] Hinweis: Rechte bereits korrekt"

# 3. connection.json IMMER neu erstellen (für frisches Onboarding)
echo "[Entrypoint] Erstelle frische connection.json mit Platzhaltern..."
cat <<EOF > /app/connection.json
{
  "wordpress": {
    "url": "PLEASE_SET_WORDPRESS_URL",
    "username": "PLEASE_SET_WORDPRESS_USERNAME",
    "appPassword": "PLEASE_SET_WORDPRESS_APP_PASSWORD"
  },
  "woocommerce": {
    "url": "PLEASE_SET_WOOCOMMERCE_URL",
    "consumerKey": "PLEASE_SET_WOOCOMMERCE_KEY",
    "consumerSecret": "PLEASE_SET_WOOCOMMERCE_SECRET",
    "authMode": "basic",
    "timeoutMs": 30000
  },
  "openAI": {
    "apiKey": "PLEASE_SET_YOUR_OPENAI_KEY",
    "model": "gpt-4o-mini"
  },
  "smtp": {
    "host": "PLEASE_SET_SMTP_HOST",
    "port": 465,
    "secure": true,
    "user": "PLEASE_SET_SMTP_USER",
    "password": "PLEASE_SET_SMTP_PASSWORD",
    "from": "PLEASE_SET_SMTP_FROM"
  },
  "job": {
    "mode": "interval",
    "intervalMs": 900000
  },
  "features": {
    "enableAnalytics": false,
    "enableAutoProducts": false,
    "enableEmailMarketing": false
  },
  "reddit": {
    "clientId": "PLEASE_SET_REDDIT_CLIENT_ID",
    "clientSecret": "PLEASE_SET_REDDIT_CLIENT_SECRET"
  },
  "ml": {
    "enabled": false,
    "productRecommendations": false,
    "trendForecasting": false,
    "dynamicPricing": false,
    "emailOptimization": false,
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
  "support": {
    "ticketsEndpoint": "/wp-json/awesome-support/v1/tickets",
    "perPage": 20,
    "provider": "auto",
    "cptSlug": "wpas_ticket"
  }
}
EOF

# 4. Rechte für connection.json (Schreibzugriff für Onboarding)
chown nodeuser:nodejs /app/connection.json
chmod 600 /app/connection.json

# 5. Verifizierung
echo "[Entrypoint] Verifiziere Setup:"
ls -la /app/connection.json
ls -ld /app/data /app/logs
echo "[Entrypoint] Backend Dateien: $(ls -la /app/dist/ | wc -l)"

echo "[Entrypoint] ✅ A.R.I. Backend Container bereit!"
echo "[Entrypoint] 🔗 API unter Port 3000 verfügbar"
echo "[Entrypoint] 📝 Nginx (Frontend) wird auf User-Actions warten"

exec "$@"