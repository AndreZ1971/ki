// backend/server.ts - KOMPLETT KORRIGIERT
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import Fastify from 'fastify';

// 🔥 ERROR HANDLING SYSTEM
import { setupErrorHandling } from './error-handling';

// 🔥 KORRIGIERTE IMPORTS FÜR NEUE STRUKTUR
import shopMetricsRoutes from './routes/app/api/analytics/metrics/shop-metrics';
import wooCommerceRoutes from './routes/app/api/products/woocommerce';
import memoryRoutes from './routes/app/api/system/memory/memory';
import systemRoutes from './routes/app/api/system/health/system';
import productOptimizerRoutes from './routes/app/api/products/optimizer/product-optimizer';
import reviewsRoutes from './routes/app/api/analytics/reviews';
import aiEmailRoutes from './routes/app/api/ai/email/ai-email';

// 🔥 NEUE IMPORTS FÜR CUSTOMERS UND EMAIL
import customersRoutes from './routes/app/api/woocommerce/customers';
import emailSenderRoutes from './routes/app/api/email/email-sender';
import emailTestRoutes from './routes/emailTest';
import healthRoutes from './routes/app/api/health';

// 🔥 PRODUCT MANAGEMENT ROUTES
import productManagementRoutes from './routes/app/api/products/product-management';
import categoryRoutes from './routes/app/api/products/categories';
import bundleRoutes from './routes/app/api/products/bundles';
import freebieRoutes from './routes/app/api/products/freebies';

// 🔥 MARKETING ROUTES
import marketingRoutes from './routes/app/api/marketing/marketing-routes';

// 🔥 ML CONFIGURATION ROUTES
import mlConfigRoutes from './routes/app/api/ml/config';
import mlTestRoutes from './routes/app/api/ml/test';

// Umgebungsvariablen laden mit erweiterter Fehlerbehandlung
dotenv.config();

// 🔥 ERROR HANDLING INITIALISIERUNG
console.log('🛡️ Initializing Error Handling System...');
setupErrorHandling();
console.log('✅ Error Handling System active');

// DEBUG: Überprüfe ob Umgebungsvariablen geladen werden
console.log('[dotenv] Geladene Umgebungsvariablen:');
console.log('- OPENAI_API_KEY vorhanden:', !!process.env.OPENAI_API_KEY);
console.log('- WOOCOMMERCE_URL vorhanden:', !!process.env.WOOCOMMERCE_URL);
console.log('- CONSUMER_KEY vorhanden:', !!process.env.CONSUMER_KEY);
console.log('- CONSUMER_SECRET vorhanden:', !!process.env.CONSUMER_SECRET);

// Fallback für Development
if (!process.env.OPENAI_API_KEY) {
  console.warn('❌ OPENAI_API_KEY nicht in .env gefunden!');
  console.warn('💡 Stelle sicher, dass deine .env Datei im Root-Verzeichnis liegt und korrekt formatiert ist.');
}

// Memory Management
const agentMemory = {
  messages: [] as Array<{ role: string; content: string; timestamp: number }>,
  
  addMessage(role: string, content: string) {
    this.messages.push({ role, content, timestamp: Date.now() });
  },
  
  addMessages(messages: Array<{ role: string; content: string; timestamp?: number }>) {
    this.messages.push(...messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp || Date.now()
    })));
  },
  
  getMessages() {
    return [...this.messages];
  },
  
  clearMessages() {
    this.messages = [];
  },
  
  getStats() {
    return {
      totalMessages: this.messages.length,
      memorySize: this.messages.reduce((size, msg) => 
        size + JSON.stringify(msg).length, 0
      )
    };
  }
};

async function buildServer() {
  const server = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty'
      }
    },
    // Body Limit erhöhen
    bodyLimit: 1048576 * 10, // 10MB
  });

  try {
    // SWAGGER zuerst registrieren
    await server.register(swagger, {
      swagger: {
        info: {
          title: 'WooCommerce AI Agent API',
          description: 'API für WooCommerce Integration mit AI-Funktionen',
          version: '1.0.0'
        },
        host: 'localhost:3000',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
          { name: 'woocommerce', description: 'WooCommerce Operations' },
          { name: 'memory', description: 'Agent Memory Management' },
          { name: 'system', description: 'System Operations' },
          { name: 'product-optimizer', description: 'AI Product Optimization' },
          { name: 'reviews', description: 'Review Analysis & Sentiment' },
          { name: 'ai', description: 'AI Content Generation' },
          { name: 'shop-metrics', description: 'Shop Analytics & Dashboard' },
          { name: 'analytics', description: 'Analytics & Reports' },
          { name: 'customers', description: 'Customer Management' },
          { name: 'email', description: 'Email Sending' },
          { name: 'products', description: 'Product Management & Creation' },
          { name: 'categories', description: 'Category Management' },
          { name: 'bundles', description: 'Product Bundle Management' },
          { name: 'freebies', description: 'Freebie Management' }
        ]
      }
    });

    await server.register(swaggerUi, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false
      }
    });

    // CORS
    await server.register(cors, {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    });

    // 🔥 KORRIGIERTE ROUTE REGISTRATION
    await server.register(shopMetricsRoutes, { prefix: '/api/analytics/metrics' });
    console.log('✅ Shop Metrics Routes erfolgreich registriert');

    await server.register(wooCommerceRoutes, { prefix: '/api/products' });
    console.log('✅ WooCommerce Routes erfolgreich registriert');

    // 🔥 FIX: systemRoutes mit korrekten Parametern
    await server.register(systemRoutes);
    console.log('✅ System Routes erfolgreich registriert');

    // 🔥 FIX: memoryRoutes ohne agentMemory Spread
    await server.register(memoryRoutes, { 
      prefix: '/api/system/memory'
    });
    console.log('✅ Memory Routes erfolgreich registriert');

    await server.register(productOptimizerRoutes, { prefix: '/api/products/optimizer' });
    console.log('✅ Product Optimizer Routes erfolgreich registriert');

    await server.register(reviewsRoutes, { prefix: '/api/analytics/reviews' });
    console.log('✅ Reviews Routes erfolgreich registriert');

    await server.register(aiEmailRoutes, { prefix: '/api/ai/email' });
    console.log('✅ AI Email Routes erfolgreich registriert');

    // 🔥 NEUE ROUTES REGISTRIEREN
    await server.register(customersRoutes, { prefix: '/api/woocommerce' });
    console.log('✅ Customers Routes erfolgreich registriert');

    // 🔥 FIX: Email Routes in korrekter Reihenfolge registrieren
    await server.register(emailSenderRoutes, { prefix: '/api/email' });
    console.log('✅ Email Sender Routes erfolgreich registriert');

    await server.register(emailTestRoutes, { prefix: '/api/email' });
    console.log('✅ Email Test Routes erfolgreich registriert');

    // 🔥 Health Routes für Shop Health Report
    await server.register(healthRoutes, { prefix: '/api/health' });
    console.log('✅ Health Routes erfolgreich registriert');

    // 🔥 PRODUCT MANAGEMENT ROUTES
    await server.register(productManagementRoutes, { prefix: '/api/products' });
    console.log('✅ Product Management Routes erfolgreich registriert');

    await server.register(categoryRoutes, { prefix: '/api/categories' });
    console.log('✅ Category Routes erfolgreich registriert');

    await server.register(bundleRoutes, { prefix: '/api/bundles' });
    console.log('✅ Bundle Routes erfolgreich registriert');

    await server.register(freebieRoutes, { prefix: '/api/freebies' });
    console.log('✅ Freebie Routes erfolgreich registriert');

    // 🔥 ML CONFIGURATION ROUTES
    await server.register(mlConfigRoutes, { prefix: '/api/ml' });
    console.log('✅ ML Config Routes erfolgreich registriert');

    // 🧪 ML TEST ROUTES (Development/Testing)
    await server.register(mlTestRoutes, { prefix: '/api/ml/test' });
    console.log('✅ ML Test Routes erfolgreich registriert');

    // 🔥 MARKETING ROUTES
    await server.register(marketingRoutes, { prefix: '/api/marketing' });
    console.log('✅ Marketing Routes erfolgreich registriert');

    // Global Error Handler
    server.setErrorHandler((error, request, reply) => {
      console.error('🚨 Server Error:', error);
      reply.status(500).send({
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
      });
    });

    // Health Check Endpoint
    server.get('/health', async (request, reply) => {
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        memory: agentMemory.getStats(),
        services: ['api', 'memory', 'ai', 'woocommerce', 'customers', 'email']
      };
    });

    // System Health Endpoint
    server.get('/api/system/health', async (request, reply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        agentMemory: agentMemory.getStats()
      };
    });

    // 🔥 KORRIGIERT: Debug Route für alle registrierten Routes
    server.get('/api/debug/routes', async (request, reply) => {
      // Manuelle Route-Sammlung für Debug-Zwecke
      const routeList = [
        { method: 'GET', url: '/health' },
        { method: 'GET', url: '/api/system/health' },
        { method: 'GET', url: '/api/debug/routes' },
        { method: 'GET', url: '/api/analytics/metrics/shop-metrics' },
        { method: 'GET', url: '/api/products' },
        { method: 'GET', url: '/api/products/optimizer' },
        { method: 'GET', url: '/api/analytics/reviews' },
        { method: 'GET', url: '/api/ai/email' },
        { method: 'GET', url: '/api/woocommerce/customers' },
        { method: 'GET', url: '/api/email/send' },
        { method: 'GET', url: '/api/email/test-email-config' },
        { method: 'GET', url: '/api/email/test' },
        { method: 'GET', url: '/documentation' }
      ];
      
      return {
        totalRoutes: routeList.length,
        emailRoutes: routeList.filter(r => r.url.includes('/email')),
        allRoutes: routeList
      };
    });

    // 🔥 KORRIGIERT: 404 Handler ohne routes Property
    server.setNotFoundHandler((request, reply) => {
      const availableEmailRoutes = [
        'GET /api/email/send',
        'GET /api/email/test-email-config', 
        'GET /api/email/test'
      ];
      
      reply.status(404).send({
        success: false,
        error: 'Route not found',
        path: request.url,
        availableEmailRoutes: availableEmailRoutes
      });
    });

    return server;

  } catch (error) {
    console.error('❌ Fehler beim Server Setup:', error);
    throw error;
  }
}

// Server Start
const start = async () => {
  try {
    console.log('🚀 Starte Server...');
    const server = await buildServer();
    
    await server.listen({ 
      port: 3000, 
      host: '0.0.0.0' 
    });
    
    console.log('✅ Server läuft auf http://localhost:3000');
    console.log('📚 Documentation: http://localhost:3000/documentation');
    console.log('❤️  Health Check: http://localhost:3000/health');
    console.log('⚕️  System Health: http://localhost:3000/api/system/health');
    console.log('📊 Shop Metrics: http://localhost:3000/api/analytics/metrics');
    console.log('📧 AI Email: http://localhost:3000/api/ai/email');
    console.log('🛒 Products: http://localhost:3000/api/products');
    console.log('👥 Customers: http://localhost:3000/api/woocommerce/customers');
    console.log('📨 Email Sender: http://localhost:3000/api/email/send');
    console.log('🧪 Email Test: http://localhost:3000/api/email/test-email-config');
    console.log('🔍 Debug Routes: http://localhost:3000/api/debug/routes');
    console.log('📈 Analytics: http://localhost:3000/api/analytics');

  } catch (err) {
    console.error('💥 Server Start fehlgeschlagen:', err);
    process.exit(1);
  }
};

// Signal Handling für graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server wird beendet...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Server wird beendet...');
  process.exit(0);
});

start();