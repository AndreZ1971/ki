# Backend Dockerfile (nur API/Server)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app
ENV HUSKY=0
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY --from=build /app/dist ./dist
COPY healthcheck.js ./
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/
RUN apk add --no-cache shadow && \
  groupadd -g 1001 nodejs && \
  useradd -m -u 1001 -g nodejs nodeuser && \
  mkdir -p /app/data /app/data/dlq /app/logs /app/backend && \
  chown -R nodeuser:nodejs /app /app/data /app/logs /app/backend
USER nodeuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node healthcheck.js
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
