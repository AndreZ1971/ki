// backend/routes/app/api/health/index.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../../../logger';
import {
  runCacheClear,
  runPerformanceReport,
  runSecurityScan,
  runSeoAnalysis,
  runInventoryMetrics,
} from '../../../health-helpers';

export default async function healthRoutes(fastify: FastifyInstance) {
  
  /**
   * POST /clear-cache
   * Leert verschiedene Cache-Bereiche
   */
  fastify.post('/clear-cache', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await runCacheClear();
      const status = result.success ? 200 : result.notConfigured ? 501 : 500;
      return reply.status(status).send(result);
    } catch (error: any) {
      logger.error({ error: error.message, function: 'clearCache' }, 'Cache clear error');
      return reply.status(500).send({
        success: false,
        message: 'Fehler beim Leeren des Cache',
        error: error.message
      });
    }
  });

  /**
   * POST /performance-report
   * Erstellt einen Performance-Report
   */
  fastify.post('/performance-report', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await runPerformanceReport();
      return reply.send(result);
    } catch (error: any) {
      logger.error({ error: error.message, function: 'performanceReport' }, 'Performance report error');
      return reply.status(500).send({
        success: false,
        message: 'Fehler beim Erstellen des Performance Reports',
        error: error.message
      });
    }
  });

  /**
   * POST /security-scan
   * Führt einen Sicherheits-Scan durch
   */
  fastify.post('/security-scan', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await runSecurityScan();
      return reply.send(result);
    } catch (error: any) {
      logger.error({ error: error.message, function: 'securityScan' }, 'Security scan error');
      return reply.status(500).send({
        success: false,
        message: 'Fehler beim Sicherheits-Scan',
        error: error.message
      });
    }
  });

  /**
   * POST /seo-analysis
   * Analysiert SEO-Metriken
   */
  fastify.post('/seo-analysis', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await runSeoAnalysis();
      return reply.send(result);
    } catch (error: any) {
      logger.error({ error: error.message, function: 'seoAnalysis' }, 'SEO analysis error');
      return reply.status(500).send({
        success: false,
        message: 'Fehler bei der SEO-Analyse',
        error: error.message
      });
    }
  });

  fastify.get('/inventory-metrics', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await runInventoryMetrics();
      const status = result.success ? 200 : 500;
      return reply.status(status).send(result);
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: 'Fehler bei der Inventory-Analyse',
        error: error.message
      });
    }
  });
}
