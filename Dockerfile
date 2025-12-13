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
COPY backend/package*.json ./
RUN npm ci --ignore-scripts
COPY backend/ ./
RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine
WORKDIR /app

# HUSKY deaktivieren VOR npm install
ENV HUSKY=0

# Install production dependencies - WICHTIG: --ignore-scripts HINZUFÜGEN!
COPY backend/package*.json ./
RUN npm ci  --ignore-scripts

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend (wird vom Backend als static files geserved)
COPY --from=frontend-builder /app/frontend/dist ./public

# Copy health check
COPY healthcheck.js ./


# Create non-root user (Debian/Ubuntu syntax)
RUN groupadd -g 1001 nodejs && \
  useradd -m -u 1001 -g nodejs nodeuser && \
  mkdir -p /app/data /app/data/dlq /app/logs /app/backend && \
  chown -R nodeuser:nodejs /app /app/data /app/logs /app/backend

USER nodeuser
EXPOSE 3000


# Entrypoint-Skript für sichere connection.json-Erstellung
COPY --chmod=755 backend/docker-entrypoint.sh /usr/local/bin/

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node healthcheck.js

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]