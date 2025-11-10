# ===========================
# Multi-Stage Build für Production
# ===========================

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/.env.production .env.production
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

    # Stage 3: Production Image
    FROM node:20-alpine
WORKDIR /app
WORKDIR /app

# Install production dependencies (skip prepare scripts like husky)
ENV HUSKY=0
COPY backend/package*.json ./
RUN npm ci --omit=dev
# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist
# Copy built frontend (wird vom Backend als static files geserved)
COPY --from=frontend-builder /app/frontend/dist ./public
# Copy .env.production explicitly to /app/frontend/.env.production
COPY --from=frontend-builder /app/frontend/.env.production ./frontend/.env.production
# Copy health check
COPY healthcheck.js ./
# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs && \
    mkdir -p /app/data/dlq /app/logs && \
    chown -R nodeuser:nodejs /app
USER nodeuser
# Expose port (Backend serves frontend + API)
EXPOSE 3000
# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node healthcheck.js
# Start backend (serves frontend + API)
CMD ["node", "dist/server.js"]