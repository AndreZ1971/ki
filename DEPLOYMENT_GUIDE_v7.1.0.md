# A.R.I. Deployment Guide v7.1.0

**Version**: 7.1.0 | **Last Updated**: January 24, 2026  
**Status**: Production Ready | **Environment**: Docker, Node.js, PostgreSQL

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Local Setup](#local-setup)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Configuration](#configuration)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Hardware
- **CPU**: 2 cores minimum (4+ recommended for production)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Storage**: 20GB minimum (varies by database size)
- **Network**: Stable internet connection

### Software
- **Node.js**: 18.x or 20.x LTS
- **PostgreSQL**: 12.x or 13.x+
- **Docker**: 20.10+ (for containerized deployment)
- **npm**: 9.x or higher
- **Git**: For version management

### External Services
- **WooCommerce**: 5.0+ (REST API enabled)
- **Email Service**: SMTP configuration (optional)

---

## Pre-Deployment Checklist

- [ ] System meets hardware requirements
- [ ] All required software installed and verified
- [ ] Database backup created
- [ ] Environment variables configured
- [ ] SSL certificates obtained (for HTTPS)
- [ ] API keys and credentials secured
- [ ] Firewall rules configured
- [ ] Monitoring/logging setup (optional)
- [ ] Team trained on operations

---

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/AndreZ1971/ki.git
cd ki
```

### 2. Install Dependencies
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
npm --prefix tools/spec-creator install
```

### 3. Environment Configuration
```bash
# Copy example env file
cp backend/.env.example backend/.env

# Edit with your settings
nano backend/.env
```

### 4. Database Setup
```bash
# Create PostgreSQL database
createdb ari_production

# Run migrations (if available)
npm --prefix backend run migrate
```

### 5. Start Development Servers
```bash
# Terminal 1: Backend
npm --prefix backend run dev

# Terminal 2: Frontend
npm --prefix frontend run dev

# Terminal 3: Spec Creator (optional)
npm --prefix tools/spec-creator run dev
```

---

## Docker Deployment

### Using Docker Compose

#### For Development
```bash
docker-compose up -d
# Services start on:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3001
```

#### For Production
```bash
docker-compose -f docker-compose.production.yml up -d
# Services start with optimized settings
```

### Manual Docker Build

```bash
# Build frontend image
docker build -t ari-frontend:7.1.0 -f frontend/Dockerfile.prod .

# Build backend image
docker build -t ari-backend:7.1.0 -f backend/Dockerfile.prod .

# Run containers
docker run -d -p 3000:3000 --name ari-frontend ari-frontend:7.1.0
docker run -d -p 3001:3001 --name ari-backend ari-backend:7.1.0
```

### Docker Environment Variables
```bash
# In docker-compose.yml or docker-compose.production.yml
POSTGRES_DB=ari_production
POSTGRES_USER=ari_user
POSTGRES_PASSWORD=secure_password_here
NODE_ENV=production
PORT=3001
```

---

## Production Deployment

### Pre-Production Testing
```bash
# Build all components
npm run build

# Verify builds
ls backend/dist/
ls frontend/dist/

# Run tests (if available)
npm run test
```

### Starting Services

#### Backend Service
```bash
npm --prefix backend run build
npm --prefix backend run start

# Or with PM2
pm2 start ecosystem.config.cjs --env production
```

#### Frontend Service
```bash
npm --prefix frontend run build

# Serve with production server (nginx recommended)
# See nginx.conf for configuration
```

### Health Checks
```bash
# Backend health endpoint
curl http://localhost:3001/health

# Frontend availability
curl http://localhost:3000/

# Full verification
npm run verify  # if available
```

---

## Configuration

### Environment Variables

**Backend (.env)**
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/ari_production
WOOCOMMERCE_URL=https://yourshop.com
WOOCOMMERCE_KEY=your_api_key
WOOCOMMERCE_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret_key_here
LOG_LEVEL=info
```

**Frontend (.env)**
```
VITE_API_URL=https://api.yourshop.com
VITE_APP_NAME=A.R.I.
VITE_VERSION=7.1.0
```

### SSL/TLS Configuration

For HTTPS (highly recommended for production):

```bash
# Using Let's Encrypt
certbot certonly --standalone -d yourdomain.com
certbot renew --dry-run  # Test auto-renewal
```

Update nginx.conf:
```nginx
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

### Database Configuration

```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/ari_production"

# Connection pooling (recommended for production)
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
```

---

## Verification

### Post-Deployment Checks

```bash
# 1. Check Backend Health
curl -s http://localhost:3001/health | jq .

# 2. Check Frontend
curl -s http://localhost:3000/ | head -20

# 3. Database Connection
psql -U ari_user -d ari_production -c "SELECT version();"

# 4. Process Status
pm2 status

# 5. Logs Review
pm2 logs
tail -f backend/logs/app.log
```

### Performance Verification

```bash
# Response time test
time curl http://localhost:3001/api/status

# Load test (optional)
ab -n 1000 -c 10 http://localhost:3000/

# Memory usage
free -h
docker stats
```

---

## Maintenance

### Backups

```bash
# Database backup
pg_dump ari_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backups (cron job)
0 2 * * * /usr/local/bin/backup-ari.sh
```

### Monitoring

```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# Docker logs
docker logs -f container_name
```

### Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update
npm audit fix

# Rebuild after updates
npm run build
pm2 restart all
```

---

## Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check port availability
netstat -tuln | grep 3001

# Check logs
npm --prefix backend run dev  # Run in foreground

# Check database connection
psql -U ari_user -d ari_production -c "SELECT 1"
```

#### Frontend blank page
```bash
# Check browser console for errors (F12)
# Verify API URL in .env
# Check if backend is accessible

# Clear cache and rebuild
npm --prefix frontend run build
```

#### Database connection issues
```bash
# Verify credentials
psql -h localhost -U ari_user -d ari_production

# Check PostgreSQL status
systemctl status postgresql

# Restart database
systemctl restart postgresql
```

#### Docker issues
```bash
# Rebuild without cache
docker-compose build --no-cache

# Check logs
docker logs container_name

# Reset environment
docker-compose down -v
docker-compose up -d
```

---

## Performance Optimization

### Frontend
- Enable gzip compression (nginx)
- Implement HTTP/2
- Use CDN for static assets
- Enable browser caching

### Backend
- Connection pooling
- Query optimization
- Response caching
- Rate limiting

### Database
- Index frequently queried columns
- Regular VACUUM operations
- Monitor slow queries
- Backup strategy

---

## Security Checklist

- [ ] SSL/TLS enabled (HTTPS)
- [ ] Firewall configured
- [ ] Database credentials secured
- [ ] Environment variables not in git
- [ ] API keys rotated
- [ ] Regular security updates applied
- [ ] Backups stored securely
- [ ] Access logs monitored
- [ ] Rate limiting enabled
- [ ] CORS properly configured

---

## Version-Specific Notes

### v7.1.0 Changes
- Added Specialization Creator tool (internal use only)
- Improved deployment documentation
- Version consistency across all components
- Enhanced error handling in backend

### Upgrading from v7.0.4
- No breaking changes
- Database migration not required
- Configuration files compatible
- Drop-in replacement possible

---

## Support & Resources

- **Documentation**: See README.md and other .md files
- **Issues**: GitHub Issues
- **Logs**: Check backend/logs/ and frontend output
- **Health Endpoint**: GET /health (backend)

---

## Next Steps

1. ✅ Complete pre-deployment checklist
2. ✅ Configure environment variables
3. ✅ Set up database
4. ✅ Run health checks
5. ✅ Monitor logs
6. ✅ Set up automated backups
7. ✅ Plan maintenance schedule

---

**Last Updated**: January 24, 2026  
**Version**: 7.1.0  
**Maintained by**: A.R.I. Development Team  
**License**: MIT
