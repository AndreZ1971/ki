#!/bin/sh
set -e



# Sicherstellen, dass die nötigen Verzeichnisse existieren und Rechte korrekt sind
mkdir -p /app/backend
mkdir -p /app/data/dlq
chown -R node:node /app/backend /app/data 2>/dev/null || true
chmod 700 /app/backend /app/data /app/data/dlq 2>/dev/null || true

# Sicherstellen, dass connection.json existiert und mit Platzhaltern befüllt ist
if [ ! -f /app/backend/connection.json ]; then
  cat <<EOF > /app/backend/connection.json
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
  chown node:node /app/backend/connection.json 2>/dev/null || true
  chmod 600 /app/backend/connection.json
fi

exec "$@"
