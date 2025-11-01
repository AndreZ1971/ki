// backend/routes/app/api/ml/config.ts
import { FastifyPluginAsync } from 'fastify';
import { mlConfig } from '../../../../config/ml.config.js';
import { logger } from '../../../../logger.js';
import fs from 'fs/promises';
import path from 'path';

const mlConfigRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/ml/config - Get current ML configuration
  fastify.get('/config', async (request, reply) => {
    try {
      logger.info('📊 ML Config: Getting current configuration');
      
      return {
        enabled: mlConfig.enabled,
        features: mlConfig.features,
        models: mlConfig.models,
        performance: mlConfig.performance,
      };
    } catch (error) {
      logger.error(`ML Config GET error: ${error}`);
      reply.status(500).send({ error: 'Failed to get ML configuration' });
    }
  });

  // POST /api/ml/config - Update ML configuration
  fastify.post('/config', async (request, reply) => {
    try {
      const newConfig = request.body as typeof mlConfig;
      
      logger.info('💾 ML Config: Updating configuration');
      
      // Update in-memory config
      mlConfig.enabled = newConfig.enabled;
      mlConfig.features = { ...mlConfig.features, ...newConfig.features };
      mlConfig.models = {
        productRecommendation: { 
          ...mlConfig.models.productRecommendation, 
          ...newConfig.models.productRecommendation 
        },
        trendForecasting: { 
          ...mlConfig.models.trendForecasting, 
          ...newConfig.models.trendForecasting 
        },
        emailSendTime: { 
          ...mlConfig.models.emailSendTime, 
          ...newConfig.models.emailSendTime 
        },
      };
      mlConfig.performance = { ...mlConfig.performance, ...newConfig.performance };
      
      // Update .env file
      await updateEnvFile(newConfig);
      
      logger.info('✅ ML Config: Configuration updated successfully');
      
      return {
        success: true,
        config: mlConfig,
      };
    } catch (error) {
      logger.error(`ML Config POST error: ${error}`);
      reply.status(500).send({ error: 'Failed to update ML configuration' });
    }
  });

  // GET /api/ml/status - Get ML system status
  fastify.get('/status', async (request, reply) => {
    try {
      const activeFeatures = Object.entries(mlConfig.features)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name);

      return {
        enabled: mlConfig.enabled,
        activeFeatures,
        featureCount: activeFeatures.length,
        models: {
          productRecommendation: {
            enabled: mlConfig.models.productRecommendation.enabled,
            minConfidence: mlConfig.models.productRecommendation.minConfidence,
          },
          trendForecasting: {
            enabled: mlConfig.models.trendForecasting.enabled,
            minConfidence: mlConfig.models.trendForecasting.minConfidence,
          },
          emailSendTime: {
            enabled: mlConfig.models.emailSendTime.enabled,
            minConfidence: mlConfig.models.emailSendTime.minConfidence,
          },
        },
      };
    } catch (error) {
      logger.error(`ML Status error: ${error}`);
      reply.status(500).send({ error: 'Failed to get ML status' });
    }
  });
};

async function updateEnvFile(config: typeof mlConfig) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch {
      logger.warn('.env file not found, creating new one');
    }

    // Update or add ML config values
    const updates: Record<string, string> = {
      ML_ENABLED: config.enabled.toString(),
      ML_PRODUCT_RECOMMENDATIONS: config.features.productRecommendations.toString(),
      ML_TREND_FORECASTING: config.features.trendForecasting.toString(),
      ML_DYNAMIC_PRICING: config.features.dynamicPricing.toString(),
      ML_EMAIL_OPTIMIZATION: config.features.emailOptimization.toString(),
      ML_CHURN_PREDICTION: config.features.churnPrediction.toString(),
      ML_SENTIMENT_ANALYSIS: config.features.sentimentAnalysis.toString(),
      ML_FRAUD_DETECTION: config.features.fraudDetection.toString(),
      ML_PRODUCT_REC_MIN_CONFIDENCE: config.models.productRecommendation.minConfidence.toString(),
      ML_PRODUCT_REC_FALLBACK: config.models.productRecommendation.fallbackToRules.toString(),
      ML_TREND_MIN_CONFIDENCE: config.models.trendForecasting.minConfidence.toString(),
      ML_TREND_FALLBACK: config.models.trendForecasting.fallbackToGoogleTrends.toString(),
      ML_EMAIL_MIN_CONFIDENCE: config.models.emailSendTime.minConfidence.toString(),
      ML_EMAIL_FALLBACK: config.models.emailSendTime.fallbackToDefaultTime.toString(),
      ML_EMAIL_DEFAULT_TIME: config.models.emailSendTime.defaultTime,
      ML_MAX_INFERENCE_TIME: config.performance.maxInferenceTime.toString(),
      ML_CACHE_RESULTS: config.performance.cacheResults.toString(),
      ML_CACHE_TTL: config.performance.cacheTTL.toString(),
    };

    let newEnvContent = envContent;

    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(newEnvContent)) {
        newEnvContent = newEnvContent.replace(regex, `${key}=${value}`);
      } else {
        newEnvContent += `\n${key}=${value}`;
      }
    }

    await fs.writeFile(envPath, newEnvContent, 'utf-8');
    logger.info('✅ .env file updated with ML configuration');
  } catch (error) {
    logger.error(`Failed to update .env file: ${error}`);
    throw error;
  }
}

export default mlConfigRoutes;
