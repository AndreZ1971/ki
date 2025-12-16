// backend/routes/agentMonitoring.ts
/**
 * Monitoring API für Agentic Loops
 * Endpoints für Status, History, Stats, Trends
 */

import { Router, Request, Response } from 'express';
import { logger } from '../logger';
import { globalScheduler } from '../agent/scheduler';
import { executionLogger } from '../agent/logger/executionLogger';
import { persistentMemory } from '../agent/memory/persistentMemory';

const router = Router();

/**
 * GET /api/agent/monitoring/status
 * Hole aktuellen Status aller Loops
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = globalScheduler.getStatus();

    return res.json({
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
    });
  } catch (error) {
    logger.error(`Failed to get status: ${error}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to get status',
    });
  }
});

/**
 * GET /api/agent/monitoring/history/:loopType
 * Hole Execution History für einen Loop
 */
router.get('/history/:loopType', async (req: Request, res: Response) => {
  try {
    const { loopType } = req.params;
    const { limit = 50 } = req.query;

    if (!executionLogger) {
      return res.status(503).json({
        success: false,
        error: 'Execution Logger not initialized',
      });
    }

    const history = await executionLogger.getHistory(
      loopType,
      parseInt(String(limit)) || 50
    );

    return res.json({
      success: true,
      loopType,
      count: history.length,
      history,
    });
  } catch (error) {
    logger.error(`Failed to get history: ${error}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to get history',
    });
  }
});

/**
 * GET /api/agent/monitoring/stats/:loopType
 * Hole Statistics für einen Loop
 */
router.get('/stats/:loopType', async (req: Request, res: Response) => {
  try {
    const { loopType } = req.params;
    const { days = 7 } = req.query;

    if (!executionLogger) {
      return res.status(503).json({
        success: false,
        error: 'Execution Logger not initialized',
      });
    }

    const stats = await executionLogger.getStats(
      loopType,
      parseInt(String(days)) || 7
    );

    return res.json({
      success: true,
      loopType,
      period: `${days} days`,
      stats,
    });
  } catch (error) {
    logger.error(`Failed to get stats: ${error}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

/**
 * GET /api/agent/monitoring/trends/:loopType
 * Hole Trend-Daten für Visualisierung
 */
router.get('/trends/:loopType', async (req: Request, res: Response) => {
  try {
    const { loopType } = req.params;
    const { days = 30 } = req.query;

    if (!executionLogger) {
      return res.status(503).json({
        success: false,
        error: 'Execution Logger not initialized',
      });
    }

    const trends = await executionLogger.getTrends(
      loopType,
      parseInt(String(days)) || 30
    );

    return res.json({
      success: true,
      loopType,
      period: `${days} days`,
      trends,
    });
  } catch (error) {
    logger.error(`Failed to get trends: ${error}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to get trends',
    });
  }
});

/**
 * GET /api/agent/monitoring/insights/:loopType
 * Hole Learnings/Insights
 */
router.get('/insights/:loopType', async (req: Request, res: Response) => {
  try {
    const { loopType } = req.params;

    if (!persistentMemory) {
      return res.status(503).json({
        success: false,
        error: 'Persistent Memory not initialized',
      });
    }

    const insights = await persistentMemory.getInsights(loopType);

    return res.json({
      success: true,
      loopType,
      insightCount: insights.length,
      insights,
    });
  } catch (error) {
    logger.error(`Failed to get insights: ${error}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to get insights',
    });
  }
});

/**
 * POST /api/agent/monitoring/scheduler/start
 * Starte Scheduler
 */
router.post('/scheduler/start', (req: Request, res: Response) => {
  try {
    globalScheduler.startAll();

    return res.json({
      success: true,
      message: 'Scheduler started',
      status: globalScheduler.getStatus(),
    });
  } catch (error) {
    logger.error(`Failed to start scheduler: ${error}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to start scheduler',
    });
  }
});

/**
 * POST /api/agent/monitoring/scheduler/stop
 * Stoppe Scheduler
 */
router.post('/scheduler/stop', (req: Request, res: Response) => {
  try {
    globalScheduler.stopAll();

    return res.json({
      success: true,
      message: 'Scheduler stopped',
      status: globalScheduler.getStatus(),
    });
  } catch (error) {
    logger.error(`Failed to stop scheduler: ${error}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to stop scheduler',
    });
  }
});

/**
 * POST /api/agent/monitoring/health
 * Allgemeiner Health Check
 */
router.get('/health', (req: Request, res: Response) => {
  return res.json({
    success: true,
    scheduler: {
      running: globalScheduler.isActive(),
      status: globalScheduler.getStatus(),
    },
    memory: {
      initialized: persistentMemory !== null,
    },
    logger: {
      initialized: executionLogger !== null,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
