#!/bin/bash
# ===========================
# Hetzner Deployment Script
# ===========================

set -e  # Exit on error

echo "🚀 Starting Hetzner Deployment..."

# 1. Build Docker Image
echo "📦 Building Docker image..."
docker build -t kaufe-es-agent:latest .

# 2. Tag for Registry (optional - falls du Docker Registry verwendest)
# docker tag kaufe-es-agent:latest your-registry.com/kaufe-es-agent:latest

# 3. Push to Registry (optional)
# echo "⬆️  Pushing to registry..."
# docker push your-registry.com/kaufe-es-agent:latest

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
