import { FastifyPluginAsync } from 'fastify';
import { ProductRecommendationEngine } from '../../../../ml/models/productRecommendation.js';
import { TrendForecastingEngine } from '../../../../ml/models/trendForecasting.js';
import { logger } from '../../../../logger.js';

/**
 * ML Testing Routes
 * Test endpoints for ML features (development/testing only)
 */
const mlTestRoutes: FastifyPluginAsync = async (fastify) => {
  // Test Product Recommendations
  fastify.get<{
    Params: { customerId: string };
    Querystring: { limit?: string };
  }>('/recommendations/:customerId', async (request, reply) => {
    try {
      const customerId = parseInt(request.params.customerId);
      const limit = request.query.limit ? parseInt(request.query.limit) : 5;

      logger.info(`🧪 Testing ML Product Recommendations for customer ${customerId}`);

      const result = await ProductRecommendationEngine.getRecommendations(
        customerId,
        limit
      );

      return {
        success: true,
        customerId,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (_error) {
      const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
      logger.error(`Error testing product recommendations: ${errorMessage}`);
      return reply.status(500).send({
        success: false,
        error: errorMessage
      });
    }
  });

  // Test Trend Forecasting
  fastify.post<{
    Body: { keywords: string[] };
  }>('/trends', async (request, reply) => {
    try {
      const { keywords } = request.body;

      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Keywords array required'
        });
      }

      logger.info(`🧪 Testing ML Trend Forecasting for ${keywords.length} keywords`);

      const result = await TrendForecastingEngine.forecast(keywords);

      return {
        success: true,
        keywords,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (_error) {
      const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
      logger.error(`Error testing trend forecasting: ${errorMessage}`);
      return reply.status(500).send({
        success: false,
        error: errorMessage
      });
    }
  });

  // Health check for ML system
  fastify.get('/health', async (_request, _reply) => {
    return {
      success: true,
      message: 'ML test endpoints ready',
      endpoints: [
        'GET /api/ml/test/recommendations/:customerId?limit=5',
        'POST /api/ml/test/trends (body: {keywords: string[]})',
        'GET /api/ml/test/health'
      ]
    };
  });
};

export default mlTestRoutes;
