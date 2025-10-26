import { FastifyInstance } from 'fastify';

export default async function systemRoutes(server: FastifyInstance, getMemorySize: () => number) {
  
  // System Health Information
  server.get('/system/health', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      platform: process.platform
    };
  });

  // Memory Information
  server.get('/system/memory', async (request, reply) => {
    const memoryUsage = process.memoryUsage();
    return {
      agentMemory: getMemorySize(),
      processMemory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
      }
    };
  });

  // Environment Information (ohne sensible Daten)
  server.get('/system/environment', async (request, reply) => {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      pid: process.pid,
      cwd: process.cwd(),
      features: {
        openai: !!process.env.OPENAI_API_KEY,
        woocommerce: !!(process.env.WOOCOMMERCE_URL && process.env.WOOCOMMERCE_CONSUMER_KEY)
      }
    };
  });

  // Server Statistics
  server.get('/system/stats', async (request, reply) => {
    return {
      timestamp: new Date().toISOString(),
      requests: (server as any).requestCount || 0,
      routes: server.printRoutes().split('\n').filter(line => line.trim())
      // plugins Zeile entfernt - nicht verfügbar in Fastify
    };
  });

  // Configuration Status
  server.get('/system/config-status', async (request, reply) => {
    return {
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        status: process.env.OPENAI_API_KEY ? '✅ Konfiguriert' : '❌ Nicht konfiguriert'
      },
      woocommerce: {
        configured: !!(process.env.WOOCOMMERCE_URL && process.env.WOOCOMMERCE_CONSUMER_KEY),
        status: (process.env.WOOCOMMERCE_URL && process.env.WOOCOMMERCE_CONSUMER_KEY) 
          ? '✅ Konfiguriert' 
          : '❌ Nicht konfiguriert',
        url: process.env.WOOCOMMERCE_URL || 'Nicht gesetzt'
      },
      server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development'
      }
    };
  });

  // Request Counter Middleware (für Stats)
  server.addHook('onRequest', async (request, reply) => {
    if (!(server as any).requestCount) {
      (server as any).requestCount = 0;
    }
    (server as any).requestCount++;
  });
}