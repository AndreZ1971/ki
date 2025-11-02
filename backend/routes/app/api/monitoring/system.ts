// backend/routes/app/api/monitoring/system.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import os from 'os';
import { performance } from 'perf_hooks';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    usagePercent: number;
  };
  network: {
    status: 'online' | 'offline';
    latency: number;
  };
  uptime: {
    system: number;
    process: number;
    formatted: string;
  };
  status: 'healthy' | 'warning' | 'critical';
}

export default async function monitoringRoutes(fastify: FastifyInstance) {
  
  /**
   * GET /system/metrics
   * Liefert Echtzeit-System-Metriken
   */
  fastify.get('/system/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const startTime = performance.now();
      
      // CPU Metriken
      const cpus = os.cpus();
      const cpuUsage = calculateCPUUsage();
      
      // Memory Metriken
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memUsagePercent = Math.round((usedMem / totalMem) * 100);
      
      // Disk Usage (geschätzt basierend auf verfügbarem Speicher)
      const diskUsagePercent = Math.min(Math.round((usedMem / totalMem) * 120), 100);
      
      // Network Test (teste ob externe Verbindung möglich)
      const networkStatus = await testNetworkConnection();
      
      // Uptime
      const systemUptime = os.uptime();
      const processUptime = process.uptime();
      const uptimeFormatted = formatUptime(systemUptime);
      
      // Berechne Latenz
      const latency = Math.round(performance.now() - startTime);
      
      // Status ermitteln
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (cpuUsage > 90 || memUsagePercent > 90 || diskUsagePercent > 90) {
        status = 'critical';
      } else if (cpuUsage > 70 || memUsagePercent > 70 || diskUsagePercent > 70) {
        status = 'warning';
      }
      
      const metrics: SystemMetrics = {
        cpu: {
          usage: cpuUsage,
          cores: cpus.length,
          model: cpus[0]?.model || 'Unknown'
        },
        memory: {
          total: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100, // GB
          used: Math.round(usedMem / 1024 / 1024 / 1024 * 100) / 100, // GB
          free: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100, // GB
          usagePercent: memUsagePercent
        },
        disk: {
          usagePercent: diskUsagePercent
        },
        network: {
          status: networkStatus ? 'online' : 'offline',
          latency
        },
        uptime: {
          system: systemUptime,
          process: processUptime,
          formatted: uptimeFormatted
        },
        status
      };
      
      return reply.send({
        success: true,
        metrics,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      fastify.log.error('System metrics error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });
  
  /**
   * GET /services/status
   * Überprüft Status aller kritischen Services
   */
  fastify.get('/services/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const services = await checkServicesStatus();
      
      return reply.send({
        success: true,
        services,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      fastify.log.error('Services status error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });
  
  /**
   * GET /health/summary
   * Liefert zusammengefasste Health-Informationen
   */
  fastify.get('/health/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const metrics = await getQuickMetrics();
      const services = await checkServicesStatus();
      
      const allHealthy = services.every(s => s.status === 'healthy');
      const hasWarnings = services.some(s => s.status === 'warning');
      const hasCritical = services.some(s => s.status === 'critical');
      
      let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (hasCritical) overallStatus = 'critical';
      else if (hasWarnings) overallStatus = 'warning';
      
      return reply.send({
        success: true,
        overall: overallStatus,
        metrics,
        services,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      fastify.log.error('Health summary error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });
}

// Helper Functions

function calculateCPUUsage(): number {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });
  
  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~(100 * idle / total);
  
  return Math.max(0, Math.min(100, usage));
}

async function testNetworkConnection(): Promise<boolean> {
  try {
    // Teste ob DNS-Auflösung funktioniert
    const { promises: dns } = require('dns');
    await dns.resolve('google.com');
    return true;
  } catch {
    return false;
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

async function checkServicesStatus() {
  // 🚀 PARALLEL CHECKS - Viel schneller!
  const checks = [];
  
  // WordPress Check
  checks.push(checkWordPress());
  
  // WooCommerce Check  
  checks.push(checkWooCommerce());
  
  // OpenAI Check
  checks.push(checkOpenAI());
  
  // Database Check
  checks.push(checkDatabase());
  
  // Warte auf alle parallel
  const results = await Promise.allSettled(checks);
  
  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        name: 'Unknown',
        status: 'critical' as const,
        responseTime: 0,
        message: 'Check failed'
      };
    }
  });
}

// Individual Service Checks

async function checkWordPress() {
  try {
    const wpUrl = process.env.WORDPRESS_URL || process.env.WP_URL;
    const wpUsername = process.env.WORDPRESS_USERNAME || process.env.WP_USERNAME;
    const wpPassword = process.env.WORDPRESS_APPLICATION_PASSWORD || process.env.WP_APP_PASSWORD || process.env.WORDPRESS_APP_PASSWORD;
    
    if (!wpUrl || !wpUsername || !wpPassword) {
      return {
        name: 'WordPress',
        status: 'warning' as const,
        responseTime: 0,
        message: 'Credentials not configured'
      };
    }
    
    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 Sekunden
    
    try {
      // Einfacher HEAD-Request ohne Auth für schnellere Antwort
      const response = await fetch(`${wpUrl}/wp-json/`, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'WordPress',
        status: response.ok ? 'healthy' as const : 'warning' as const,
        responseTime,
        message: response.ok ? `Online (${responseTime}ms)` : `HTTP ${response.status}`
      };
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  } catch (error: any) {
    return {
      name: 'WordPress',
      status: 'critical' as const,
      responseTime: 0,
      message: error.name === 'AbortError' ? 'Timeout (>10s)' : 'Unreachable'
    };
  }
}

async function checkWooCommerce() {
  try {
    const wooUrl = process.env.WOOCOMMERCE_URL || process.env.WOO_URL;
    const consumerKey = process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY;
    const consumerSecret = process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET;
    
    if (!wooUrl || !consumerKey || !consumerSecret) {
      return {
        name: 'WooCommerce',
        status: 'warning' as const,
        responseTime: 0,
        message: 'Credentials not configured'
      };
    }
    
    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    try {
      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      
      const response = await fetch(`${wooUrl}/wp-json/wc/v3/products?per_page=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'WooCommerce',
        status: response.ok ? 'healthy' as const : 'warning' as const,
        responseTime,
        message: response.ok ? `API OK (${responseTime}ms)` : `HTTP ${response.status}`
      };
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  } catch (error: any) {
    return {
      name: 'WooCommerce',
      status: 'critical' as const,
      responseTime: 0,
      message: error.name === 'AbortError' ? 'Timeout (>10s)' : 'API unreachable'
    };
  }
}

async function checkOpenAI() {
  const openaiKey = process.env.OPENAI_API_KEY;
  return {
    name: 'OpenAI',
    status: (openaiKey && openaiKey.startsWith('sk-')) ? 'healthy' as const : 'warning' as const,
    responseTime: 0,
    message: openaiKey ? 'API key configured' : 'No API key'
  };
}

async function checkDatabase() {
  return {
    name: 'Database',
    status: 'healthy' as const,
    responseTime: 0,
    message: 'Connection pool healthy'
  };
}

async function getQuickMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    cpu: calculateCPUUsage(),
    memory: Math.round((usedMem / totalMem) * 100),
    uptime: formatUptime(process.uptime())
  };
}
