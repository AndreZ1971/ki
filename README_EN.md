# 🚀 A.R.I. - Artificial Retail Intelligence

**Version:** 6.0.0  
**Status:** Production-Ready

AI-powered automation system for WooCommerce shops. Automates product creation, content generation, analytics, and marketing via WooCommerce/WordPress REST API.

---

## 📋 Features

### 🤖 Automation
- **44 Job Workflows** for product management, content, analytics, marketing, and shop health
- **Cron-based scheduling** with node-cron
- **Circuit breakers** for automatic error handling
- **Dead letter queue** with automatic retry

### 📊 Analytics & Reporting
- Shop metrics (revenue, orders, conversion rate)
- Real-time analytics (live visitors, current orders)
- Conversion funnel analysis with drop-off detection
- Google Trends integration for keyword research

### 🎨 Content & Marketing
- **GPT-4o-mini integration** for product descriptions, emails, blog posts
- **DALL-E integration** for automatic image generation
- **Social media automation** (Facebook, Instagram, LinkedIn, Twitter)
- **Email marketing** (abandoned cart, welcome series, win-back)

### 🏗️ Architecture
- **Stateless design** - No persistent data storage
- **Zero-data architecture** - All data retrieved via WooCommerce API
- **Kubernetes-ready** - Horizontal scaling possible
- **Multi-language** - German & English (react-i18next)

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (optional)
- WooCommerce shop with enabled REST API
- OpenAI API Key

### 1. Clone repository
```bash
git clone https://github.com/AndreZ1971/ki.git
cd ki
```

### 2. Create configuration

Create `connection.json` in root directory:

```json
{
  "woocommerce": {
    "url": "https://your-shop.com",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_..."
  },
  "openai": {
    "apiKey": "sk-proj-...",
    "model": "gpt-4o-mini"
  },
  "wordpress": {
    "url": "https://your-shop.com",
    "username": "admin",
    "appPassword": "xxxx xxxx xxxx xxxx"
  }
}
```

### 3. Installation & Start

**With Docker (recommended):**
```bash
docker compose up -d
```

**Without Docker:**
```bash
# Backend
cd backend
npm install
npm run build
npm start

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### 4. Access
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/documentation

---

## 📡 API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/conversion` - Conversion analysis
- `GET /api/analytics/real-time` - Real-time data

### Content & AI
- `POST /api/marketing/content/generate-copy` - AI product copy
- `POST /api/marketing/ai-images` - DALL-E image generation
- `POST /api/marketing/social/post` - Social media post

### Jobs & Automation
- `GET /api/jobs` - List all jobs
- `POST /api/jobs/:jobId/run` - Run job manually
- `GET /api/jobs/:jobId/status` - Get job status

**Full documentation:** [docs/english/api/README.md](docs/english/api/README.md)

---

## 🔧 Configuration

### Environment Variables

The system does **not** require database credentials. All data is retrieved via WooCommerce REST API.

**Backend (.env optional):**
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### Enable WooCommerce REST API

1. WordPress Admin → WooCommerce → Settings → Advanced → REST API
2. Click "Add key"
3. Permissions: "Read/Write"
4. Copy Consumer Key and Secret → `connection.json`

### OpenAI API Key

1. https://platform.openai.com/api-keys
2. "Create new secret key"
3. Copy key → `connection.json`

---

## 🧪 Testing

```bash
# All tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

**Test coverage:** 350/350 tests ✅

---

## 📋 Documentation

| Document | Description |
|----------|-------------|
| [API Reference](docs/english/api/README.md) | Complete API documentation |
| [Workflows](docs/english/workflows/README.md) | 44 job workflows in detail |
| [User Guide](docs/english/AI-Agent-User-Guide.md) | Complete guide for all features |
| [Deployment Guide](docs/english/deployment.md) | Production setup & troubleshooting |
| [Social Media Setup](docs/english/SOCIAL_MEDIA_GUIDE.md) | Meta, TikTok, LinkedIn integration |

---

## 🔒 Privacy

### Zero-Data Architecture
- No database - all data retrieved via WooCommerce API
- No persistent storage of customer data
- Temporary data only in RAM (max. 5000 events)
- Server restart deletes all temporary data

### OpenAI API Usage
- Product descriptions, emails, and content are sent to GPT-4o-mini
- OpenAI stores API data according to their privacy policy
- API data is **not** used for model training

**GDPR Notice:** As an operator, you must mention AI usage in your privacy policy.

---

## 📝 Changelog

### v6.0.0 (January 2026)
- ✅ Production-ready release
- ✅ 350/350 tests passing
- ✅ 44 automated job workflows
- ✅ Premium specializations (10 industries)
- ✅ Circuit breakers & dead letter queue
- ✅ Multi-language support (DE/EN)

### v5.1.1 (January 2026)
- 🐛 8 critical bugfixes (analytics, routing, auth)
- ✅ Server stability: 0 errors on startup

### v5.1.0 (December 2025)
- 🌍 100% i18n coverage (64 pages)
- 🇩🇪🇬🇧 German & English support
- 💾 LocalStorage language persistence

### v5.0.0-alpha (November 2025)
- 🔄 Dynamic config reload
- 🐋 Container-ready architecture

---

## 📞 Support

- **Documentation:** [/docs](./docs)
- **Issues:** [GitHub Issues](https://github.com/AndreZ1971/ki/issues)
- **Email:** info@kaufe-es.eu

---

## 📄 License

ISC License
