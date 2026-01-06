#!/bin/bash
# ===========================
# Hetzner Deployment Script
# ===========================

set -e  # Exit on error

echo "🚀 Starting Hetzner Deployment..."

# Configurable image settings (override via env: IMAGE_NAME, TAG, REGISTRY)
IMAGE_NAME=${IMAGE_NAME:-app-agent}
TAG=${TAG:-latest}
REGISTRY=${REGISTRY:-}

DOCKER_IMAGE="$IMAGE_NAME:$TAG"
if [ -n "$REGISTRY" ]; then
  DOCKER_IMAGE="$REGISTRY/$DOCKER_IMAGE"
fi

# 1. Build Docker Image
echo "📦 Building Docker image: $DOCKER_IMAGE"
docker build -t "$DOCKER_IMAGE" .

# 2. (Optional) Additional tag for Registry if you use a separate registry host
# Example: export REGISTRY=your-registry.com before running this script
# docker tag "$DOCKER_IMAGE" "$REGISTRY/$IMAGE_NAME:$TAG"

# 3. Push to Registry (optional)
# echo "⬆️  Pushing to registry..."
# docker push "$DOCKER_IMAGE"

# 4. Deploy to Hetzner via docker-compose
echo "🚢 Deploying to Hetzner..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

# 5. Health Check
echo "⏳ Waiting for service to start..."
sleep 10

echo "🔍 Checking health..."
if curl -f http://localhost:3000/health; then
  echo "✅ Deployment successful!"
  echo "🌐 Service running at http://your-hetzner-ip:3000"
else
  echo "❌ Health check failed!"
  docker-compose -f docker-compose.production.yml logs
  exit 1
fi

# 6. Show logs
echo "📋 Recent logs:"
docker-compose -f docker-compose.production.yml logs --tail=50
