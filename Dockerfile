# ===========================
# Multi-Stage Build für Production
# ===========================

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
# No build dependencies needed - using pure JS session libraries (@fastify/session + @fastify/cookie)
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine
WORKDIR /app

# HUSKY deaktivieren VOR npm install
ENV HUSKY=0

# Install su-exec for user switching in entrypoint (no other build tools needed)
RUN apk add --no-cache su-exec

# Install production dependencies (no native modules needed - pure JS libraries)
COPY backend/package*.json ./
RUN npm ci

# Create runtime user and directories
RUN addgroup -g 1001 nodejs && \
  adduser -u 1001 -G nodejs -D nodeuser && \
  mkdir -p /app/data /app/data/dlq /app/logs /app/backend /app/data/specializations && \
  chown -R nodeuser:nodejs /app && \
  chmod 755 /app/data /app/data/specializations

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist
# Copy module-alias.js explizit ins dist-Verzeichnis
COPY backend/module-alias.js ./dist/module-alias.js

# Copy built frontend (wird vom Backend als static files geserved)
COPY --from=frontend-builder /app/frontend/dist ./public

# Copy health check
COPY healthcheck.js ./

USER root
EXPOSE 3000

# Entrypoint-Skript für sichere connection.json-Erstellung
COPY --chmod=755 backend/docker-entrypoint.sh /usr/local/bin/

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node healthcheck.js

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]