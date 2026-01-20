# v7.0.0 Deployment Guide

**Release Date**: January 20, 2026  
**Status**: ✅ PRODUCTION READY  
**Version**: 7.0.0

---

## 📋 Pre-Deployment

### Prerequisites
- [ ] Git access to repository
- [ ] Docker installed (if using containers)
- [ ] Node.js 18+ (if local deployment)
- [ ] WooCommerce API credentials ready
- [ ] OpenAI API key ready
- [ ] Backup of current environment

### Verification
```bash
# Verify tag exists and is signed
git tag -v v7.0.0

# View tag details
git show v7.0.0

# Show what changed since last release
git log --oneline v6.9.0..v7.0.0
```

---

## 🚀 Deployment Options

### Option 1: Docker Deployment (Recommended)

#### 1.1 Build Docker Image
```bash
# Clone/pull the repository
git clone https://github.com/AndreZ1971/ki.git
cd ki

# Checkout the v7.0.0 tag
git checkout v7.0.0

# Build Docker image
docker build -t ari:v7.0.0 \
  --build-arg NODE_ENV=production \
  --build-arg VITE_API_BASE=/api \
  .

# Verify image
docker images | grep ari:v7.0.0
```

#### 1.2 Run Container
```bash
# Create environment file (.env)
cat > .env.production << 'EOF'
# WooCommerce Configuration
WOOCOMMERCE_URL=https://yourdomain.com
CONSUMER_KEY=ck_your_key_here
CONSUMER_SECRET=cs_your_secret_here

# OpenAI Configuration
OPENAI_API_KEY=sk_your_key_here

# Admin User (optional)
ADMIN_USER=admin
ADMIN_PASS=YourSecurePassword123
ADMIN_EMAIL=admin@yourdomain.com

# Node Environment
NODE_ENV=production
PORT=3000
EOF

# Run container
docker run -d \
  --name ari-v7.0.0 \
  --restart always \
  -p 3000:3000 \
  --env-file .env.production \
  -v /data/ari/logs:/app/logs \
  -v /data/ari/data:/app/data \
  ari:v7.0.0

# Verify container is running
docker logs ari-v7.0.0
docker ps | grep ari-v7.0.0
```

#### 1.3 Update Reverse Proxy
```nginx
# /etc/nginx/sites-available/ari.conf
upstream ari_backend {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://ari_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Reload nginx
nginx -s reload
```

### Option 2: Local Deployment

#### 2.1 Setup Environment
```bash
# Checkout tag
git checkout v7.0.0

# Install dependencies
npm install

# Create config file
cp connection.json.example connection.json
# Edit connection.json with your credentials
```

#### 2.2 Build Application
```bash
# Build backend
npm run build

# Build frontend
npm run build:frontend

# Verify builds
ls -la dist/
ls -la frontend/dist/
```

#### 2.3 Start Services
```bash
# Start backend server
npm start

# In another terminal, start agent (optional)
npm run start:agent

# Or in production with PM2
pm2 start dist/server.js --name "ari-v7.0.0"
pm2 start dist/agent/planner.js --name "ari-agent"
```

### Option 3: Kubernetes Deployment

#### 3.1 Create Deployment
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ari-v7-0-0
  labels:
    app: ari
    version: v7.0.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ari
  template:
    metadata:
      labels:
        app: ari
        version: v7.0.0
    spec:
      containers:
      - name: ari
        image: ari:v7.0.0
        ports:
        - containerPort: 3000
        env:
        - name: WOOCOMMERCE_URL
          valueFrom:
            configMapKeyRef:
              name: ari-config
              key: woocommerce-url
        - name: CONSUMER_KEY
          valueFrom:
            secretKeyRef:
              name: ari-secrets
              key: consumer-key
        - name: CONSUMER_SECRET
          valueFrom:
            secretKeyRef:
              name: ari-secrets
              key: consumer-secret
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ari-secrets
              key: openai-key
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 3.2 Apply Deployment
```bash
# Create namespace
kubectl create namespace ari-prod

# Create secrets
kubectl create secret generic ari-secrets \
  --from-literal=consumer-key=ck_... \
  --from-literal=consumer-secret=cs_... \
  --from-literal=openai-key=sk_... \
  -n ari-prod

# Create config
kubectl create configmap ari-config \
  --from-literal=woocommerce-url=https://yourdomain.com \
  -n ari-prod

# Deploy
kubectl apply -f k8s-deployment.yaml -n ari-prod

# Check status
kubectl get pods -n ari-prod
kubectl logs -f deployment/ari-v7-0-0 -n ari-prod
```

---

## ✅ Post-Deployment Verification

### Health Checks
```bash
# Test basic health endpoint
curl https://yourdomain.com/health

# Check API connectivity
curl https://yourdomain.com/api/health

# Full health report
curl -X POST https://yourdomain.com/api/health/performance-report

# Security scan
curl -X POST https://yourdomain.com/api/health/security-scan
```

### Application Status
```bash
# Via Docker
docker exec ari-v7.0.0 npm run health-report

# Via Local
npm run health-report

# Via HTTP
curl https://yourdomain.com/api/health/inventory-metrics
```

### Data Verification
```bash
# Check WooCommerce connectivity
curl -H "Authorization: Basic $(echo -n ck_:cs_ | base64)" \
  https://yourdomain.com/wp-json/wc/v3/products

# Check authentication
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"xxx"}'
```

---

## 🔄 Rollback Plan

If critical issues arise during deployment:

### Immediate Rollback (Docker)
```bash
# Stop current container
docker stop ari-v7.0.0

# Remove current container
docker rm ari-v7.0.0

# Run previous version
docker run -d \
  --name ari-v6.9.0 \
  --restart always \
  -p 3000:3000 \
  --env-file .env.production \
  ari:v6.9.0

# Verify
docker logs ari-v6.9.0
```

### Rollback (Local)
```bash
# Checkout previous version
git checkout v6.9.0

# Rebuild
npm install
npm run build
npm run build:frontend

# Restart service
pm2 restart ari-v7.0.0
```

### Rollback (Kubernetes)
```bash
# Rollback deployment
kubectl rollout undo deployment/ari-v7-0-0 -n ari-prod

# Or use previous image
kubectl set image deployment/ari-v7-0-0 \
  ari=ari:v6.9.0 \
  -n ari-prod

# Check status
kubectl rollout status deployment/ari-v7-0-0 -n ari-prod
```

---

## 📊 Monitoring Post-Deployment

### Performance Monitoring
```bash
# View request logs
docker logs -f ari-v7.0.0 | grep "ms"

# Monitor memory usage
docker stats ari-v7.0.0

# Check CPU usage
top | grep node
```

### Error Monitoring
```bash
# Check error logs
tail -f /data/ari/logs/error.log

# Filter payment errors
grep "payment" /data/ari/logs/error.log

# View last 100 errors
tail -100 /data/ari/logs/error.log
```

### Health Dashboard
```bash
# Weekly health report
curl -X POST https://yourdomain.com/api/health/performance-report > perf-report.json

# Check inventory health
curl https://yourdomain.com/api/health/inventory-metrics > inv-report.json

# Security scan
curl -X POST https://yourdomain.com/api/health/security-scan > sec-report.json
```

---

## 🚨 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs ari-v7.0.0

# Verify image
docker inspect ari:v7.0.0

# Check port availability
lsof -i :3000

# Rebuild image
docker build --no-cache -t ari:v7.0.0 .
```

### API Not Responding
```bash
# Check if container is running
docker ps | grep ari

# Check network connectivity
docker exec ari-v7.0.0 curl http://localhost:3000/health

# Verify environment variables
docker exec ari-v7.0.0 env | grep WOOCOMMERCE
```

### WooCommerce Connection Issues
```bash
# Test WooCommerce API from container
docker exec ari-v7.0.0 npm run test:woo-connection

# Check credentials
docker exec ari-v7.0.0 echo $CONSUMER_KEY

# Verify connectivity
curl -u "ck_:cs_" https://yourdomain.com/wp-json/wc/v3/system_status
```

---

## 📋 Post-Deployment Checklist

- [ ] Tag v7.0.0 deployed successfully
- [ ] Health checks passing (all endpoints)
- [ ] WooCommerce API responding
- [ ] OpenAI API responding
- [ ] Authentication working
- [ ] Database connectivity verified
- [ ] No error logs appearing
- [ ] Performance metrics normal
- [ ] Monitoring activated
- [ ] Backup completed
- [ ] Rollback plan tested
- [ ] Team notified of deployment

---

## 🎉 Deployment Complete!

Your A.R.I. v7.0.0 instance is now running in production.

### Next Steps
1. Monitor application for 24 hours
2. Review error logs regularly
3. Schedule health check automation
4. Set up alerting for critical issues
5. Plan periodic backups
6. Document your deployment setup

### Resources
- [Release Notes](./RELEASE_NOTES_v7.0.0.md)
- [Configuration Guide](./docs/english/CONFIGURATION_GUIDE.md)
- [Debugging Tools](./backend/agent/jobs/debugging/README.md)
- [Tools Documentation](./docs/english/TOOLS_DOCUMENTATION.md)

---

**v7.0.0 Deployment - Production Ready 🚀**

Date: January 20, 2026  
Status: APPROVED ✅
