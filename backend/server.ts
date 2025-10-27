// backend/server.ts - KOMPLETT AKTUALISIERT
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import Fastify, { FastifyRegisterOptions } from 'fastify';

import shopMetricsRoutes from './routes/shop-metrics';
import wooCommerceRoutes from './routes/woocommerce';
import memoryRoutes from './routes/memory';
import systemRoutes from './routes/system';
import productOptimizerRoutes from './routes/product-optimizer';
import reviewsRoutes from './routes/reviews';
import aiEmailRoutes from './routes/ai-email';

// Umgebungsvariablen laden mit erweiterter Fehlerbehandlung
dotenv.config();

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

const getMemorySize = () => {
  return agentMemory.getStats().memorySize;
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
          { name: 'shop-metrics', description: 'Shop Analytics & Dashboard' } // 🔥 NEU
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

    // 🔥 SHOP METRICS ROUTES REGISTRIEREN - ZUERST!
    await server.register(shopMetricsRoutes);
    console.log('✅ Shop Metrics Routes erfolgreich registriert');

    // Andere Routes - MIT DYNAMIC IMPORTS für besseres Error Handling
try {
  await server.register(wooCommerceRoutes);
  await server.register(memoryRoutes, { prefix: '/memory', ...agentMemory });
  await server.register(systemRoutes, getMemorySize);
  await server.register(productOptimizerRoutes, { prefix: '/product-optimizer' });
  await server.register(reviewsRoutes, { prefix: '/reviews' });
  await server.register(aiEmailRoutes, { prefix: '/ai' });
      
      console.log('✅ Alle Routes erfolgreich registriert');
    } catch (routeError) {
      console.error('❌ Fehler beim Registrieren der Routes:', routeError);
    }

    // Global Error Handler
    server.setErrorHandler((error, request, reply) => {
      console.error('🚨 Server Error:', error);
      reply.status(500).send({
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
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
    console.log('📊 Shop Metrics: http://localhost:3000/api/shop-metrics'); // 🔥 NEU

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