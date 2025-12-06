#!/bin/sh
set -e

echo "[Entrypoint] Starte Skript: $(date)"
echo "[Entrypoint] Versuche Verzeichnisse anzulegen und Rechte zu setzen..."
mkdir -p /app/backend || echo "[Entrypoint] Fehler beim Anlegen von /app/backend!"
mkdir -p /app/data/dlq || echo "[Entrypoint] Fehler beim Anlegen von /app/data/dlq!"
chown -R node:node /app/backend /app/data 2>/dev/null || echo "[Entrypoint] Fehler beim chown!"
chmod 700 /app/backend /app/data /app/data/dlq 2>/dev/null || echo "[Entrypoint] Fehler beim chmod!"
ls -ld /app/backend /app/data /app/data/dlq


# Sicherstellen, dass connection.json im richtigen Pfad existiert und mit Platzhaltern befüllt ist
if [ ! -f /app/connection.json ]; then
  echo "[Entrypoint] connection.json nicht gefunden, lege Dummy-Datei an..."
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
  chown node:node /app/connection.json 2>/dev/null || echo "[Entrypoint] Fehler beim chown connection.json!"
  chmod 600 /app/connection.json || echo "[Entrypoint] Fehler beim chmod connection.json!"
else
  echo "[Entrypoint] connection.json existiert bereits."
fi
ls -l /app/connection.json

echo "[Entrypoint] Skript abgeschlossen: $(date)"


exec "$@"
