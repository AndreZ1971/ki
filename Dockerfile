# ===========================
# Dockerfile für Backend (woo-app)
# Frontend wird separat gebaut und via nginx geserved
# ===========================

# Stage 1: Build Backend
FROM node:20-alpine AS builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production --ignore-scripts
COPY backend/ ./
RUN npm run build

# Stage 2: Production Image
FROM node:20-alpine
WORKDIR /app

# HUSKY deaktivieren
ENV HUSKY=0

# 1. Backend Dependencies installieren
COPY --from=builder /app/backend/package*.json ./
RUN npm ci --only=production --ignore-scripts

# 2. Gebautes Backend kopieren
COPY --from=builder /app/backend/dist ./dist

# 3. Healthcheck
COPY backend/healthcheck.js ./

# 4. Non-root User erstellen
RUN addgroup -g 1001 nodejs && \
    adduser -u 1001 -S nodeuser -G nodejs && \
    mkdir -p /app/data /app/data/dlq /app/logs && \
    chown -R nodeuser:nodejs /app

# 5. connection.json mit Platzhaltern (für Onboarding)
RUN echo '{"openai":{"apiKey":"PLEASE_SET_YOUR_OPENAI_KEY"},"woocommerce":{"url":"PLEASE_SET_WOOCOMMERCE_URL","consumerKey":"PLEASE_SET_WOOCOMMERCE_KEY","consumerSecret":"PLEASE_SET_WOOCOMMERCE_SECRET"}}' > /app/connection.json && \
    chown nodeuser:nodejs /app/connection.json && \
    chmod 600 /app/connection.json

# 6. Entrypoint-Skript kopieren
COPY --chown=nodeuser:nodejs --chmod=755 docker-entrypoint.sh /usr/local/bin/

USER nodeuser
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]