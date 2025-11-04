// backend/server.ts - KOMPLETT KORRIGIERT
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import fs from 'fs';

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
import emailMarketingRoutes from './routes/app/api/marketing/email-marketing';
import conversionRoutes from './routes/app/api/marketing/conversion-routes';
import contentRoutes from './routes/app/api/marketing/content-routes';
import templateRoutes from './routes/app/api/marketing/template-routes';

// 🔥 SOCIAL MEDIA ROUTES
import oauthRoutes from './routes/app/api/social/oauth-routes';
import postRoutes from './routes/app/api/social/post-routes';
import bufferRoutes from './routes/app/api/social/buffer-routes';
import webhookRoutes from './routes/app/api/social/webhook-routes';

// 🔥 ML CONFIGURATION ROUTES
import mlConfigRoutes from './routes/app/api/ml/config';
import mlTestRoutes from './routes/app/api/ml/test';

// 🔥 TREND AGGREGATOR ROUTES
import { trendAggregatorRoutes } from './routes/app/api/trends/trends-routes';

// 🔥 SETTINGS ROUTES
import connectionRoutes from './routes/app/api/settings/connection';

// 🔥 MONITORING ROUTES
import monitoringRoutes from './routes/app/api/monitoring/system';

import path from 'path';

// Umgebungsvariablen laden mit erweiterter Fehlerbehandlung
// Try multiple .env locations: backend/.env, root/.env, .env.production
const envPaths = [
  path.resolve(__dirname, '../.env'),        // backend/.env (local dev)
  path.resolve(__dirname, '../../.env'),     // root/.env (docker)
  path.resolve(__dirname, '../../.env.production')  // root/.env.production (docker prod)
];

let envLoaded = false;
for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`✅ .env geladen von: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️ Keine .env Datei gefunden in:', envPaths);
}

// Error Handling Initialisierung
setupErrorHandling();

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
          { name: 'freebies', description: 'Freebie Management' },
          { name: 'Trends', description: 'Multi-Source Trend Analysis' }
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

    // 🔥 STATIC FILES (Frontend) - Production Only
    const staticPath = path.join(__dirname, '../public');
    
    if (process.env.NODE_ENV === 'production') {
      console.log(`📁 Serving static files from: ${staticPath}`);
      
      // Dynamic import for @fastify/static
      const fastifyStatic = await import('@fastify/static');
      await server.register(fastifyStatic.default, {
        root: staticPath,
        prefix: '/',
        decorateReply: false,
        wildcard: false, // Disable automatic wildcard to allow custom 404 handler
        setHeaders: (res: any, path: string) => {
          if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        }
      });

      console.log('✅ Frontend wird als Static Files geserved');
    }    // 🔥 KORRIGIERTE ROUTE REGISTRATION
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

    // 🔥 TREND AGGREGATOR ROUTES (Multi-Source Trend Analysis)
    await server.register(trendAggregatorRoutes, { prefix: '/api/trends' });
    console.log('✅ Trend Aggregator Routes erfolgreich registriert');

    // 🔥 MARKETING ROUTES
    await server.register(marketingRoutes, { prefix: '/api/marketing' });
    console.log('✅ Marketing Routes erfolgreich registriert');
    
    await server.register(emailMarketingRoutes); // Already has full paths
    console.log('✅ Email Marketing Routes erfolgreich registriert');
    
    await server.register(conversionRoutes); // Already has full paths
    console.log('✅ Conversion Routes erfolgreich registriert');
    
    await server.register(contentRoutes); // Already has full paths
    console.log('✅ Content Routes erfolgreich registriert');
    
    await server.register(templateRoutes); // Already has full paths
    console.log('✅ Template Routes erfolgreich registriert');

    // 🔥 SOCIAL MEDIA ROUTES (OAuth + Posting)
    await server.register(oauthRoutes, { prefix: '/api' }); // OAuth endpoints like /api/auth/facebook
    console.log('✅ Social Media OAuth Routes erfolgreich registriert');
    
    await server.register(postRoutes, { prefix: '/api' }); // Post endpoints like /api/social/post
    console.log('✅ Social Media Post Routes erfolgreich registriert');
    
    await server.register(bufferRoutes, { prefix: '/api' }); // Buffer API (einfacher als direktes OAuth!)
    console.log('✅ Buffer Routes erfolgreich registriert');
    
    await server.register(webhookRoutes, { prefix: '/api' }); // Make.com/Zapier Webhooks (Make = 1000 FREE!)
    console.log('✅ Webhook Routes erfolgreich registriert');

    // 🔥 SETTINGS ROUTES
    await server.register(connectionRoutes, { prefix: '/api/settings' });
    console.log('✅ Settings Routes erfolgreich registriert');

    // 🔥 MONITORING ROUTES (System Health & Performance)
    await server.register(monitoringRoutes, { prefix: '/api/monitoring' });
    console.log('✅ Monitoring Routes erfolgreich registriert');

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

    // 🔥 SPA FALLBACK - Serve index.html for all non-API routes
    // This must be registered AFTER all other routes
    server.setNotFoundHandler(async (request, reply) => {
      const url = request.url;
      
      // API routes → 404 JSON
      if (url.startsWith('/api/') || url.startsWith('/documentation') || url.startsWith('/health')) {
        return reply.status(404).send({ 
          success: false,
          error: 'Route not found',
          path: url 
        });
      }
      
      // All other routes → SPA (index.html)
      if (process.env.NODE_ENV === 'production') {
        const indexPath = path.join(staticPath, 'index.html');
        const indexHtml = await fs.promises.readFile(indexPath, 'utf-8');
        return reply.type('text/html').send(indexHtml);
      } else {
        return reply.status(404).send({ error: 'Not found (dev mode)' });
      }
    });

    return server;

  } catch (_error) {
    console.error('❌ Fehler beim Server Setup:', _error);
    throw _error;
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
    

      const host = process.env.HOST || 'localhost';
      const port = process.env.PORT || 3000;
      const baseUrl = `http://${host}:${port}`;
      console.log(`✅ Server läuft auf ${baseUrl}`);
      console.log(`📚 Documentation: ${baseUrl}/documentation`);
      console.log(`❤️  Health Check: ${baseUrl}/health`);
      console.log(`⚕️  System Health: ${baseUrl}/api/system/health`);
      console.log(`📊 Shop Metrics: ${baseUrl}/api/analytics/metrics`);
      console.log(`📧 AI Email: ${baseUrl}/api/ai/email`);
      console.log(`🛒 Products: ${baseUrl}/api/products`);
      console.log(`👥 Customers: ${baseUrl}/api/woocommerce/customers`);
      console.log(`📨 Email Sender: ${baseUrl}/api/email/send`);
      console.log(`🧪 Email Test: ${baseUrl}/api/email/test-email-config`);
      console.log(`🔍 Debug Routes: ${baseUrl}/api/debug/routes`);
      console.log(`📈 Analytics: ${baseUrl}/api/analytics`);

  } catch (_err) {
    console.error('💥 Server Start fehlgeschlagen:', _err);
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