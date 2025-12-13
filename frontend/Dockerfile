# ===========================
# Dockerfile für Frontend (nginx)
# ===========================

# Stage 1: Build Frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Stage 2: Production nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Frontend kopieren
COPY --from=builder /app/dist ./

# Nginx Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck für nginx
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80 443