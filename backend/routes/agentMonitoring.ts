// backend/routes/agentMonitoring.ts
/**
 * Monitoring API für Agentic Loops (Fastify)
 * Endpoints für Status, History, Stats, Trends
 */

import { FastifyInstance } from 'fastify';
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

      if (!loopScheduler) {
        _reply.status(503);
        return {
          success: false,
          error: 'Loop Scheduler not initialized',
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
      _reply.status(500);
      return {
        success: false,
        error: 'Failed to get status',
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
        _reply.status(503);
        return {
          success: false,
          error: 'Loop Scheduler not initialized',
        };
      }

      loopScheduler.startAll();

      return {
        success: true,
        message: 'Scheduler started',
        status: loopScheduler.getStatus(),
      };
    } catch (error) {
      logger.error(`Failed to start scheduler: ${error}`);
      _reply.status(500);
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
        _reply.status(503);
        return {
          success: false,
          error: 'Loop Scheduler not initialized',
        };
      }

      loopScheduler.stopAll();

      return {
        success: true,
        message: 'Scheduler stopped',
        status: loopScheduler.getStatus(),
      };
    } catch (error) {
      logger.error(`Failed to stop scheduler: ${error}`);
      _reply.status(500);
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
}
