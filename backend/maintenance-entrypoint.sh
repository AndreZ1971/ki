#!/bin/sh
set -e

###############################################################################
# A.R.I. Maintenance Container Entrypoint (Update/Kill Mode)
# 
# Verwaltet:
# 1. Verzeichnis-Struktur (data, logs, backups)
# 2. Berechtigungen setzen
# 3. connection.json & .env.production VOM ALTEN CONTAINER KOPIEREN
# 4. Alten Container übernimmt -> Neuer Container läuft
#
# Version: 6.9.1 | Updated: Jan 2026
#
# UNTERSCHIED zu docker-entrypoint.sh:
# - connection.json wird NICHT neu erstellt, sondern aus /mnt/old kopiert
# - .env.production wird NICHT neu erstellt, sondern aus /mnt/old kopiert
#
# VERWENDUNG:
# Docker Compose: maintenance-docker-compose.yml
# Kubernetes: Job/CronJob mit shared volumes zum alten Container
###############################################################################

MODE=${MODE:-update}

echo "[Maintenance] 🔧 Starte A.R.I. Maintenance Container: $MODE Mode - $(date)"
echo "[Maintenance] Benutzer: $(id -un) UID: $(id -u) GID: $(id -g)"

# 1. VERZEICHNISSE ERSTELLEN
echo "[Maintenance] 📁 Erstelle benötigte Verzeichnisse..."
mkdir -p /app/data/dlq /app/data/backups /app/logs /app/data/specializations 2>/dev/null || true

# 2. BERECHTIGUNGEN SETZEN
echo "[Maintenance] 🔐 Setze korrekte Berechtigungen..."
chown -R nodeuser:nodejs /app/data /app/logs 2>/dev/null || echo "[Maintenance] ℹ️  Berechtigungen bereits korrekt"
chmod -R 755 /app/data 2>/dev/null || true

# 3. CONNECTION.JSON KOPIEREN (NICHT ERSTELLEN!)
echo "[Maintenance] 📋 Kopiere connection.json vom alten Container..."
if [ ! -f /mnt/old/connection.json ]; then
  echo "[Maintenance] ❌ FEHLER: /mnt/old/connection.json nicht gefunden!"
  echo "[Maintenance] Shared Volume zum alten Container fehlt oder connection.json existiert nicht."
  exit 1
fi

cp /mnt/old/connection.json /app/connection.json
echo "[Maintenance] ✅ connection.json kopiert ($(stat -c%s /app/connection.json 2>/dev/null || stat -f%z /app/connection.json 2>/dev/null || echo '?') bytes)"

# 4. .ENV.PRODUCTION KOPIEREN (NICHT ERSTELLEN!)
echo "[Maintenance] 📋 Kopiere .env.production vom alten Container..."
if [ ! -f /mnt/old/data/.env.production ]; then
  echo "[Maintenance] ❌ FEHLER: /mnt/old/data/.env.production nicht gefunden!"
  echo "[Maintenance] Shared Volume zum alten Container fehlt oder .env.production existiert nicht."
  exit 1
fi

cp /mnt/old/data/.env.production /app/data/.env.production
echo "[Maintenance] ✅ .env.production kopiert"

# Lade .env.production
if [ -f /app/data/.env.production ]; then
  echo "[Maintenance] 📋 Lade .env.production..."
  export $(cat /app/data/.env.production | grep -v '^#' | xargs)
  if [ -n "$SHOP_URL" ]; then
    echo "[Maintenance] ✅ SHOP_URL geladen: $SHOP_URL"
  fi
fi

# 5. BERECHTIGUNGEN FÜR KOPIERTE DATEIEN
echo "[Maintenance] 🔒 Setze Berechtigungen für connection.json und .env.production..."
chown nodeuser:nodejs /app/connection.json 2>/dev/null || true
chmod 600 /app/connection.json 2>/dev/null || true
chown nodeuser:nodejs /app/data/.env.production 2>/dev/null || true
chmod 600 /app/data/.env.production 2>/dev/null || true

# 6. VERIFIZIERUNG
echo "[Maintenance] 📋 Final Setup Verification:"
echo "[Maintenance]    ✓ connection.json: $(stat -c%s /app/connection.json 2>/dev/null || stat -f%z /app/connection.json 2>/dev/null || echo 'unknown') bytes (kopiert)"
echo "[Maintenance]    ✓ .env.production: vorhanden (kopiert)"
echo "[Maintenance]    ✓ Data directory: /app/data (backups, dlq)"
echo "[Maintenance]    ✓ NODE_ENV: ${NODE_ENV:-production}"
echo "[Maintenance]    ✓ Port: ${PORT:-3000}"
echo "[Maintenance]    ✓ Mode: $MODE"

# 7. STARTUP
echo "[Maintenance] ✅ A.R.I. Maintenance Container ($MODE) bereit..."
echo "[Maintenance] 🚀 API verfügbar unter: http://localhost:3000"
echo "[Maintenance] 📝 Configs übernommen - Onboarding nicht erforderlich!"
echo "[Maintenance] ⚠️  Alter Container kann jetzt gestoppt werden"

# Privilegien absenken und Backend starten
exec su-exec nodeuser "$@"
