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
  "openai": {
    "apiKey": "PLEASE_SET_YOUR_OPENAI_KEY"
  },
  "woocommerce": {
    "url": "PLEASE_SET_WOOCOMMERCE_URL",
    "consumerKey": "PLEASE_SET_WOOCOMMERCE_KEY",
    "consumerSecret": "PLEASE_SET_WOOCOMMERCE_SECRET"
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