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
      const { loopScheduler, executionLogger } = getServices();

      if (!loopScheduler) {
        return {
          success: false,
          error: 'Loop Scheduler not initialized',
        };
      }

      try {
        loopScheduler.startAll(undefined, executionLogger);
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
   * POST /scheduler/trigger/:loopType
   * Trigger einen Loop manuell
   */
  fastify.post<{
    Params: { loopType: string };
  }>('/scheduler/trigger/:loopType', async (request, _reply) => {
    try {
      const { loopType } = request.params;
      const { loopScheduler } = getServices();

      if (!loopScheduler) {
        _reply.status(503);
        return {
          success: false,
          error: 'Loop Scheduler not initialized',
        };
      }

      logger.info(`🔥 Manual trigger requested for: ${loopType}`);
      const result = await loopScheduler.triggerManual(loopType);

      return {
        success: true,
        loopType,
        result: {
          success: result.success,
          insights: result.insights.length,
          recommendations: result.recommendations.length,
          executionTime: result.executionTime,
        },
      };
    } catch (error) {
      logger.error(`Failed to trigger loop: ${error}`);
      _reply.status(500);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to trigger loop',
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
   * GET /debug/memory-store
   * Debug: Zeige memoryStore vom ExecutionLogger
   */
  fastify.get('/debug/memory-store', async (_request, _reply) => {
    try {
      const { executionLogger } = getServices();

      if (!executionLogger) {
        return {
          success: false,
          error: 'ExecutionLogger not initialized',
        };
      }

      // Access private memoryStore via any cast
      const memoryStore = (executionLogger as any).memoryStore || [];

      return {
        success: true,
        count: memoryStore.length,
        store: memoryStore.slice(0, 10), // First 10 records
      };
    } catch (error) {
      logger.error(`Failed to get memory store: ${error}`);
      return {
        success: false,
        error: 'Failed to get memory store',
      };
    }
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

  /**
   * GET /export/:loopType/:format
   * Exportiere Loop-Daten in verschiedenen Formaten
   * Formate: json, csv, pdf
   */
  fastify.get<{
    Params: { loopType: string; format: string };
    Querystring: { days?: string; limit?: string };
  }>('/export/:loopType/:format', async (request, reply) => {
    try {
      const { loopType, format } = request.params;
      const days = parseInt(request.query.days ?? '30') || 30;
      const limit = parseInt(request.query.limit ?? '100') || 100;
      const { executionLogger } = getServices();

      if (!executionLogger) {
        reply.status(503);
        return { success: false, error: 'Execution Logger not initialized' };
      }

      // Hole Daten
      const history = await executionLogger.getHistory(loopType, limit);
      const stats = await executionLogger.getStats(loopType, days);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${loopType}-export-${timestamp}`;

      // JSON Export
      if (format === 'json') {
        const data = {
          exportDate: new Date().toISOString(),
          loopType,
          period: { days, limit },
          stats,
          history,
        };
        reply.header('Content-Type', 'application/json');
        reply.header(
          'Content-Disposition',
          `attachment; filename="${filename}.json"`
        );
        return data;
      }

      // CSV Export
      if (format === 'csv') {
        const csvRows = [
          // Header
          [
            'Run ID',
            'Start Time',
            'Duration (ms)',
            'Status',
            'Iterations',
            'Success Rate',
            'Findings',
            'Insights',
          ].join(','),
          // Data rows
          ...history.map((record: any) =>
            [
              record.runId,
              record.startTime.toISOString(),
              record.duration,
              record.status,
              record.iterations,
              ((record.metrics?.successRate ?? 0) * 100).toFixed(1) + '%',
              record.result?.findings?.length ?? 0,
              record.insights?.length ?? 0,
            ].join(',')
          ),
        ];
        const csvContent = csvRows.join('\n');
        reply.header('Content-Type', 'text/csv');
        reply.header(
          'Content-Disposition',
          `attachment; filename="${filename}.csv"`
        );
        return csvContent;
      }

      // PDF Export (Simple HTML-to-PDF approach)
      if (format === 'pdf') {
        // For now, return HTML that can be printed to PDF
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${loopType} Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #06b6d4; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #06b6d4; color: white; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
    .stat-card { background: #f0f9ff; padding: 20px; border-radius: 8px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #06b6d4; }
    .stat-label { color: #64748b; margin-top: 8px; }
  </style>
</head>
<body>
  <h1>🤖 ${loopType} Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <p>Period: Last ${days} days</p>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-value">${stats.totalRuns}</div>
      <div class="stat-label">Total Runs</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${(stats.successRate * 100).toFixed(1)}%</div>
      <div class="stat-label">Success Rate</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.avgDuration.toFixed(0)}ms</div>
      <div class="stat-label">Avg Duration</div>
    </div>
  </div>

  <h2>Execution History</h2>
  <table>
    <thead>
      <tr>
        <th>Run ID</th>
        <th>Start Time</th>
        <th>Duration</th>
        <th>Status</th>
        <th>Iterations</th>
        <th>Findings</th>
        <th>Insights</th>
      </tr>
    </thead>
    <tbody>
      ${history
        .map(
          (record: any) => `
        <tr>
          <td>${record.runId}</td>
          <td>${new Date(record.startTime).toLocaleString()}</td>
          <td>${record.duration}ms</td>
          <td>${record.status}</td>
          <td>${record.iterations}</td>
          <td>${record.result?.findings?.length ?? 0}</td>
          <td>${record.insights?.length ?? 0}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <footer style="margin-top: 40px; color: #64748b; font-size: 12px;">
    <p>Export created by AI Agent System | Print to PDF: Ctrl+P or Cmd+P</p>
  </footer>
</body>
</html>`;
        reply.header('Content-Type', 'text/html');
        return htmlContent;
      }

      // Unknown format
      reply.status(400);
      return {
        success: false,
        error: `Unknown format: ${format}. Supported: json, csv, pdf`,
      };
    } catch (error) {
      logger.error(`Failed to export: ${error}`);
      reply.status(500);
      return { success: false, error: 'Export failed' };
    }
  });

  // ===== SCHEDULE MANAGEMENT ENDPOINTS =====

  /**
   * GET /schedules - Alle Loop Schedules abrufen
   */
  fastify.get('/schedules', async () => {
    const { loopScheduleManager } =
      await import('../services/loopScheduleManager.js');
    return {
      success: true,
      schedules: loopScheduleManager.getAllSchedules(),
    };
  });

  /**
   * GET /schedules/:loopType - Schedule für einen spezifischen Loop
   */
  fastify.get<{
    Params: { loopType: string };
  }>('/schedules/:loopType', async (request, reply) => {
    const { loopScheduleManager } =
      await import('../services/loopScheduleManager.js');
    const { loopType } = request.params;

    const validLoopTypes = [
      'anomaly-detection',
      'payment-recovery',
      'product-optimization',
      'analytics-insights',
    ];

    if (!validLoopTypes.includes(loopType)) {
      return reply.code(400).send({
        success: false,
        error: `Invalid loopType. Must be one of: ${validLoopTypes.join(', ')}`,
      });
    }

    return {
      success: true,
      schedule: loopScheduleManager.getSchedule(loopType as any),
    };
  });

  /**
   * PUT /schedules/:loopType - Schedule für einen spezifischen Loop aktualisieren
   */
  fastify.put<{
    Params: { loopType: string };
    Body: {
      enabled: boolean;
      type: 'daily' | 'weekly' | 'interval';
      time?: string;
      weekdays?: string[];
      minutes?: number;
    };
  }>('/schedules/:loopType', async (request, reply) => {
    const { loopScheduleManager } =
      await import('../services/loopScheduleManager.js');
    const { loopType } = request.params;
    const config = request.body;

    const validLoopTypes = [
      'anomaly-detection',
      'payment-recovery',
      'product-optimization',
      'analytics-insights',
    ];

    if (!validLoopTypes.includes(loopType)) {
      return reply.code(400).send({
        success: false,
        error: `Invalid loopType. Must be one of: ${validLoopTypes.join(', ')}`,
      });
    }

    // Validation
    if (typeof config.enabled !== 'boolean') {
      return reply.code(400).send({
        success: false,
        error: 'enabled must be a boolean',
      });
    }

    if (!['daily', 'weekly', 'interval'].includes(config.type)) {
      return reply.code(400).send({
        success: false,
        error: 'type must be daily, weekly, or interval',
      });
    }

    // Type-spezifische Validation
    if (config.type === 'daily' && !config.time?.match(/^\d{2}:\d{2}$/)) {
      return reply.code(400).send({
        success: false,
        error: 'daily type requires time in HH:MM format',
      });
    }

    if (config.type === 'weekly') {
      if (!config.time?.match(/^\d{2}:\d{2}$/)) {
        return reply.code(400).send({
          success: false,
          error: 'weekly type requires time in HH:MM format',
        });
      }
      if (!Array.isArray(config.weekdays) || config.weekdays.length === 0) {
        return reply.code(400).send({
          success: false,
          error:
            'weekly type requires weekdays array (e.g., ["Monday", "Friday"])',
        });
      }
    }

    if (
      config.type === 'interval' &&
      config.minutes !== undefined &&
      ![15, 30, 45, 60].includes(config.minutes)
    ) {
      return reply.code(400).send({
        success: false,
        error: 'interval type requires minutes to be 15, 30, 45, or 60',
      });
    }

    try {
      loopScheduleManager.updateSchedule(loopType as any, config as any);

      // Scheduler aktualisieren (wenn er läuft)
      const { loopScheduler } = getServices();
      if (loopScheduler && loopScheduler.getIsRunning()) {
        await loopScheduler.rescheduleLoop(loopType as any, config as any);
      }

      return {
        success: true,
        message: `Schedule für ${loopType} aktualisiert`,
        schedule: config,
      };
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to update schedule',
        details: error.message,
      });
    }
  });

  /**
   * POST /schedules/:loopType/toggle - Loop aktivieren/deaktivieren
   */
  fastify.post<{
    Params: { loopType: string };
    Body: { enabled: boolean };
  }>('/schedules/:loopType/toggle', async (request, reply) => {
    const { loopScheduleManager } =
      await import('../services/loopScheduleManager.js');
    const { loopType } = request.params;
    const { enabled } = request.body;

    const validLoopTypes = [
      'anomaly-detection',
      'payment-recovery',
      'product-optimization',
      'analytics-insights',
    ];

    if (!validLoopTypes.includes(loopType)) {
      return reply.code(400).send({
        success: false,
        error: `Invalid loopType. Must be one of: ${validLoopTypes.join(', ')}`,
      });
    }

    if (typeof enabled !== 'boolean') {
      return reply.code(400).send({
        success: false,
        error: 'enabled must be a boolean',
      });
    }

    try {
      loopScheduleManager.setEnabled(loopType as any, enabled);

      // Scheduler aktualisieren
      const { loopScheduler } = getServices();
      if (loopScheduler && loopScheduler.getIsRunning()) {
        if (enabled) {
          const config = loopScheduleManager.getSchedule(loopType as any);
          await loopScheduler.rescheduleLoop(loopType as any, config);
        } else {
          await loopScheduler.stopLoop(loopType as any);
        }
      }

      return {
        success: true,
        message: `Loop ${loopType} ${enabled ? 'aktiviert' : 'deaktiviert'}`,
        enabled,
      };
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to toggle loop',
        details: error.message,
      });
    }
  });
}
