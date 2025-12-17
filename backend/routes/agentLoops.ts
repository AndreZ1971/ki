// backend/routes/agentLoops.ts
/**
 * Fastify Routes für Agentic Loops
 * POST /api/agent/loops/:type/run
 * Unterstützte Types: anomaly-detection, product-optimization, payment-recovery, analytics-insights
 */

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { logger } from '../logger';

// Import all loops
import { AgenticLoop } from '../agent/agenticLoop';
import { AnomalyDetectionLoop } from '../agent/loops/anomalyDetectionLoop';
import { ProductOptimizationLoop } from '../agent/loops/productOptimizationLoop';
import { PaymentRecoveryLoop } from '../agent/loops/paymentRecoveryLoop';
import { AnalyticsInsightsLoop } from '../agent/loops/analyticsInsightsLoop';

// Type-safe loop factory
type LoopType =
  | 'anomaly-detection'
  | 'product-optimization'
  | 'payment-recovery'
  | 'analytics-insights';

interface LoopResponse {
  success: boolean;
  loopType: string;
  startedAt: string;
  completedAt: string;
  executionTime: number;
  result: any;
  insights?: string[];
  recommendations?: string[];
  errors?: string[];
}

/**
 * LoopFactory: Erstelle Loop basierend auf Type
 */
function createLoop(type: LoopType): AgenticLoop | null {
  switch (type) {
    case 'anomaly-detection':
      return new AnomalyDetectionLoop();
    case 'product-optimization':
      return new ProductOptimizationLoop();
    case 'payment-recovery':
      return new PaymentRecoveryLoop();
    case 'analytics-insights':
      return new AnalyticsInsightsLoop();
    default:
      return null;
  }
}

const agentLoopsRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  fastify.post('/:type/run', async (request, reply) => {
    const startTime = Date.now();
    const { type } = request.params as { type: LoopType };
    const { maxIterations = 4 } = (request.query || {}) as {
      maxIterations?: number | string;
    };

    try {
      const validTypes: LoopType[] = [
        'anomaly-detection',
        'product-optimization',
        'payment-recovery',
        'analytics-insights',
      ];

      if (!validTypes.includes(type)) {
        logger.warn(`Invalid loop type requested: ${type}`);
        return reply.code(400).send({
          success: false,
          error: `Invalid loop type. Must be one of: ${validTypes.join(', ')}`,
        });
      }

      logger.info(`🤖 Starting Agentic Loop: ${type}`);

      const loop = createLoop(type);
      if (!loop) {
        throw new Error(`Failed to create loop: ${type}`);
      }

      if (maxIterations && typeof maxIterations === 'string') {
        (loop as any).context.maxIterations = parseInt(maxIterations, 10);
      }

      const result = await loop.execute();
      const executionTime = Date.now() - startTime;

      logger.info(`✅ Agentic Loop complete: ${type} (${executionTime}ms)`);

      const response: LoopResponse = {
        success: result.success,
        loopType: type,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        executionTime,
        result: (loop as any).getSummary?.() || result.context,
        insights: result.insights,
        recommendations: result.recommendations as string[],
      };

      return reply.send(response);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(
        `❌ Agentic Loop failed: ${type} - ${error instanceof Error ? error.message : String(error)}`
      );

      return reply.code(500).send({
        success: false,
        loopType: type,
        executionTime,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  fastify.get('/status', async (_request, reply) => {
    const loops: Record<LoopType, { description: string; status: string }> = {
      'anomaly-detection': {
        description: 'Detect payment anomalies in orders',
        status: 'active',
      },
      'product-optimization': {
        description: 'A/B test products to improve conversion',
        status: 'active',
      },
      'payment-recovery': {
        description: 'Execute payment recovery strategies',
        status: 'active',
      },
      'analytics-insights': {
        description: 'Generate dashboard insights from analytics',
        status: 'active',
      },
    };

    return reply.send({
      availableLoops: loops,
      endpoint: 'POST /api/agent/loops/:type/run',
      validTypes: Object.keys(loops),
    });
  });

  fastify.get('/:type/schema', async (request, reply) => {
    const { type } = request.params as { type: LoopType };

    const schemas: Record<LoopType, any> = {
      'anomaly-detection': {
        name: 'Anomaly Detection Loop',
        description:
          'Detect payment anomalies (failed_payment, unusual_amount, etc.)',
        phases: ['sense', 'think', 'act', 'learn'],
        output: {
          totalAnomalies: 'number',
          byType: 'Record<string, number>',
          bySeverity: 'Record<string, number>',
          recommendations: 'string[]',
        },
        example: {
          totalAnomalies: 45,
          byType: { failed_payment: 20, unusual_amount: 15 },
          bySeverity: { high: 30, medium: 15 },
        },
      },
      'product-optimization': {
        name: 'Product Optimization Loop',
        description: 'A/B test product attributes (price, title, description)',
        phases: ['sense', 'think', 'act', 'learn'],
        output: {
          totalTests: 'number',
          winners: 'number',
          avgImprovement: 'string',
          topOpportunities: 'Array<{productId, attribute, improvement}>',
        },
        example: {
          totalTests: 150,
          winners: 42,
          avgImprovement: '8.7%',
          topOpportunities: [
            { productId: 123, attribute: 'price', improvement: '23%' },
          ],
        },
      },
      'payment-recovery': {
        name: 'Payment Recovery Loop',
        description:
          'Execute payment recovery strategies (retry, discount, etc.)',
        phases: ['sense', 'think', 'act', 'learn'],
        output: {
          totalAttempts: 'number',
          successCount: 'number',
          successRate: 'string',
          totalRecovered: 'string (€)',
          byStrategy: 'Record<string, {success, total}>',
        },
        example: {
          totalAttempts: 42,
          successCount: 15,
          successRate: '35.7%',
          totalRecovered: '€2,100.50',
        },
      },
      'analytics-insights': {
        name: 'Analytics Insights Loop',
        description: 'Generate dashboard insights and detect anomalies',
        phases: ['sense', 'think', 'act', 'learn'],
        output: {
          totalInsights: 'number',
          highPriority: 'number',
          anomaliesDetected: 'number',
          insights: 'Array<InsightCard>',
        },
        example: {
          totalInsights: 8,
          highPriority: 3,
          anomaliesDetected: 2,
          insights: [
            {
              title: '📈 Revenue Growth',
              trend: 'up',
              recommendation: 'Maintain strategy',
            },
          ],
        },
      },
    };

    const schema = schemas[type];

    if (!schema) {
      return reply.code(404).send({
        error: `No schema found for loop type: ${type}`,
      });
    }

    return reply.send(schema);
  });
};

export default agentLoopsRoutes;
