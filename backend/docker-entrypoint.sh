#!/bin/sh
set -e


# Sicherstellen, dass das Zielverzeichnis existiert
mkdir -p /app/backend
# Sicherstellen, dass connection.json existiert und sicher ist
if [ ! -f /app/backend/connection.json ]; then
  echo '{}' > /app/backend/connection.json
  chown node:node /app/backend/connection.json 2>/dev/null || true
  chmod 600 /app/backend/connection.json
fi

exec "$@"
