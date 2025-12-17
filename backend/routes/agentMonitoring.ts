// backend/routes/agentMonitoring.ts
/**
 * Monitoring API für Agentic Loops (Fastify)
 * Endpoints für Status, History, Stats, Trends
 */

import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { logger } from '../logger';

// Get services from global context (initialized in server.ts)
function getServices() {
  const executionLogger = (global as any).executionLogger;
  const persistentMemory = (global as any).persistentMemory;
  const loopScheduler = (global as any).loopScheduler;

  return { executionLogger, persistentMemory, loopScheduler };
}

export default async function agentMonitoringRoutes(fastify: FastifyInstance) {
  /**
   * GET /status
   * Hole aktuellen Status aller Loops
   */
  fastify.get('/status', async (_request, _reply) => {
    try {
      const { loopScheduler } = getServices();

      if (!loopScheduler || typeof loopScheduler.getStatus !== 'function') {
        return {
          success: true,
          scheduler: {
            isRunning: false,
            loops: {
              'anomaly-detection': {
                scheduled: false,
                lastRun: null,
                nextRun: null,
              },
              'product-optimization': {
                scheduled: false,
                lastRun: null,
                nextRun: null,
              },
              'payment-recovery': {
                scheduled: false,
                lastRun: null,
                nextRun: null,
              },
              'analytics-insights': {
                scheduled: false,
                lastRun: null,
                nextRun: null,
              },
            },
          },
        };
      }

      const status = loopScheduler.getStatus();

      return {
        success: true,
        scheduler: {
          isRunning: status.isRunning,
          loops: {
            'anomaly-detection': {
              scheduled: status.anomalyDetection.scheduled,
              lastRun: status.anomalyDetection.lastRun,
              nextRun: status.anomalyDetection.nextRun,
            },
            'product-optimization': {
              scheduled: status.productOptimization.scheduled,
              lastRun: status.productOptimization.lastRun,
              nextRun: status.productOptimization.nextRun,
            },
            'payment-recovery': {
              scheduled: status.paymentRecovery.scheduled,
              lastRun: status.paymentRecovery.lastRun,
              nextRun: status.paymentRecovery.nextRun,
            },
            'analytics-insights': {
              scheduled: status.analyticsInsights.scheduled,
              lastRun: status.analyticsInsights.lastRun,
              nextRun: status.analyticsInsights.nextRun,
            },
          },
        },
      };
    } catch (error) {
      logger.error(`Failed to get status: ${error}`);
      return {
        success: true,
        scheduler: {
          isRunning: false,
          loops: {
            'anomaly-detection': {
              scheduled: false,
              lastRun: null,
              nextRun: null,
            },
            'product-optimization': {
              scheduled: false,
              lastRun: null,
              nextRun: null,
            },
            'payment-recovery': {
              scheduled: false,
              lastRun: null,
              nextRun: null,
            },
            'analytics-insights': {
              scheduled: false,
              lastRun: null,
              nextRun: null,
            },
          },
        },
      };
    }
  });

  /**
   * GET /history/:loopType
   * Hole Execution History für einen Loop
   */
  fastify.get<{
    Params: { loopType: string };
    Querystring: { limit?: string };
  }>('/history/:loopType', async (request, _reply) => {
    try {
      const { loopType } = request.params;
      const limit = parseInt(request.query.limit ?? '50') || 50;
      const { executionLogger } = getServices();

      if (!executionLogger) {
        _reply.status(503);
        return {
          success: false,
          error: 'Execution Logger not initialized',
        };
      }

      const history = await executionLogger.getHistory(loopType, limit);

      return {
        success: true,
        loopType,
        count: history.length,
        history,
      };
    } catch (error) {
      logger.error(`Failed to get history: ${error}`);
      _reply.status(500);
      return {
        success: false,
        error: 'Failed to get history',
      };
    }
  });

  /**
   * GET /stats/:loopType
   * Hole Statistics für einen Loop
   */
  fastify.get<{ Params: { loopType: string }; Querystring: { days?: string } }>(
    '/stats/:loopType',
    async (request, _reply) => {
      try {
        const { loopType } = request.params;
        const days = parseInt(request.query.days ?? '7') || 7;
        const { executionLogger } = getServices();

        if (!executionLogger) {
          _reply.status(503);
          return {
            success: false,
            error: 'Execution Logger not initialized',
          };
        }

        const stats = await executionLogger.getStats(loopType, days);

        return {
          success: true,
          loopType,
          period: `${days} days`,
          stats,
        };
      } catch (error) {
        logger.error(`Failed to get stats: ${error}`);
        _reply.status(500);
        return {
          success: false,
          error: 'Failed to get stats',
        };
      }
    }
  );

  /**
   * GET /trends/:loopType
   * Hole Trend-Daten für Visualisierung
   */
  fastify.get<{ Params: { loopType: string }; Querystring: { days?: string } }>(
    '/trends/:loopType',
    async (request, _reply) => {
      try {
        const { loopType } = request.params;
        const days = parseInt(request.query.days ?? '30') || 30;
        const { executionLogger } = getServices();

        if (!executionLogger) {
          _reply.status(503);
          return {
            success: false,
            error: 'Execution Logger not initialized',
          };
        }

        const trends = await executionLogger.getTrends(loopType, days);

        return {
          success: true,
          loopType,
          period: `${days} days`,
          trends,
        };
      } catch (error) {
        logger.error(`Failed to get trends: ${error}`);
        _reply.status(500);
        return {
          success: false,
          error: 'Failed to get trends',
        };
      }
    }
  );

  /**
   * GET /insights/:loopType
   * Hole Learnings/Insights
   */
  fastify.get<{ Params: { loopType: string } }>(
    '/insights/:loopType',
    async (request, _reply) => {
      try {
        const { loopType } = request.params;
        const { persistentMemory } = getServices();

        if (!persistentMemory) {
          _reply.status(503);
          return {
            success: false,
            error: 'Persistent Memory not initialized',
          };
        }

        const insights = await persistentMemory.getInsights(loopType);

        return {
          success: true,
          loopType,
          insightCount: insights.length,
          insights,
        };
      } catch (error) {
        logger.error(`Failed to get insights: ${error}`);
        _reply.status(500);
        return {
          success: false,
          error: 'Failed to get insights',
        };
      }
    }
  );

  /**
   * POST /scheduler/start
   * Starte Scheduler
   */
  fastify.post('/scheduler/start', async (_request, _reply) => {
    try {
      const { loopScheduler } = getServices();

      if (!loopScheduler) {
        return {
          success: false,
          error: 'Loop Scheduler not initialized',
        };
      }

      try {
        loopScheduler.startAll();
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : 'Failed to start scheduler',
        };
      }

      return {
        success: true,
        message: 'Scheduler started',
        status: loopScheduler.getStatus(),
      };
    } catch (error) {
      logger.error(`Failed to start scheduler: ${error}`);
      return {
        success: false,
        error: 'Failed to start scheduler',
      };
    }
  });

  /**
   * POST /scheduler/stop
   * Stoppe Scheduler
   */
  fastify.post('/scheduler/stop', async (_request, _reply) => {
    try {
      const { loopScheduler } = getServices();

      if (!loopScheduler) {
        return {
          success: false,
          error: 'Loop Scheduler not initialized',
        };
      }

      try {
        loopScheduler.stopAll();
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : 'Failed to stop scheduler',
        };
      }

      return {
        success: true,
        message: 'Scheduler stopped',
        status: loopScheduler.getStatus(),
      };
    } catch (error) {
      logger.error(`Failed to stop scheduler: ${error}`);
      return {
        success: false,
        error: 'Failed to stop scheduler',
      };
    }
  });

  /**
   * GET /health
   * Allgemeiner Health Check
   */
  fastify.get('/health', async (_request, _reply) => {
    const { loopScheduler, persistentMemory, executionLogger } = getServices();

    return {
      success: true,
      scheduler: {
        running: loopScheduler ? loopScheduler.isActive() : false,
        status: loopScheduler ? loopScheduler.getStatus() : null,
      },
      memory: {
        initialized: persistentMemory !== null,
      },
      logger: {
        initialized: executionLogger !== null,
      },
      timestamp: new Date().toISOString(),
    };
  });

  /**
   * GET /export
   * Liefert aggregierte, datenschutzkonforme Monitoring-Daten (keine PII)
   * Optional: write=1 schreibt JSON nach METRICS_EXPORT_DIR oder Default /app/data/exports
   */
  fastify.get<{
    Querystring: { days?: string; write?: string };
  }>('/export', async (request, _reply) => {
    try {
      const { executionLogger, persistentMemory, loopScheduler } =
        getServices();

      const days = parseInt(request.query.days ?? '30') || 30;
      const loopTypes = [
        'anomaly-detection',
        'product-optimization',
        'payment-recovery',
        'analytics-insights',
      ];

      // Sammle aggregierte Daten pro LoopType
      const loops: Record<string, any> = {};
      for (const lt of loopTypes) {
        const stats = executionLogger
          ? await executionLogger.getStats(lt, days)
          : {
              totalRuns: 0,
              successCount: 0,
              failureCount: 0,
              avgDuration: 0,
              successRate: 0,
              lastRun: null,
            };
        const trends = executionLogger
          ? await executionLogger.getTrends(lt, days)
          : [];
        const insights = persistentMemory
          ? await persistentMemory.getInsights(lt)
          : [];

        loops[lt] = {
          stats,
          trends,
          insightCount: Array.isArray(insights) ? insights.length : 0,
          topInsights: (insights || []).slice(0, 5),
        };
      }

      const payload = {
        success: true,
        generatedAt: new Date().toISOString(),
        periodDays: days,
        scheduler: loopScheduler ? loopScheduler.getStatus() : null,
        loops,
        privacy: {
          piiStored: false,
          storage: 'in-memory',
          note: 'Aggregierte, anonyme Metriken – keine personenbezogenen Daten',
        },
      };

      // Optional: In Datei schreiben, wenn write=1
      const shouldWrite = request.query.write === '1';
      if (shouldWrite) {
        const exportDir = process.env.METRICS_EXPORT_DIR || '/app/data/exports';
        try {
          const dir = path.resolve(exportDir);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          const filePath = path.join(dir, `agent-monitoring-${ts}.json`);
          fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
          return { ...payload, writtenTo: filePath };
        } catch (err) {
          logger.warn(`Export write failed: ${err}`);
          // Fallback: nur payload zurückgeben
        }
      }

      return payload;
    } catch (error) {
      logger.error(`Failed to export monitoring: ${error}`);
      _reply.status(500);
      return { success: false, error: 'Failed to export monitoring' };
    }
  });
}
