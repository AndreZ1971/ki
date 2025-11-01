// backend/ml/mlService.ts
// ML Service with automatic fallback to rule-based systems

import { isMLEnabled, getModelConfig, mlConfig } from '../config/ml.config.js';
import { logger } from '../logger.js';

export interface MLPrediction<T> {
  prediction: T;
  confidence: number;
  source: 'ml' | 'rules' | 'fallback';
  inferenceTime: number; // ms
  modelVersion?: string;
}

export class MLService {
  /**
   * Execute ML prediction with automatic fallback
   */
  static async predict<T>(
    feature: keyof typeof mlConfig.features,
    mlFunction: () => Promise<MLPrediction<T>>,
    fallbackFunction: () => Promise<T>
  ): Promise<MLPrediction<T>> {
    const startTime = Date.now();

    // If ML not enabled, use fallback
    if (!isMLEnabled(feature)) {
      logger.info(`ML disabled for ${feature}, using fallback`);
      const result = await fallbackFunction();
      return {
        prediction: result,
        confidence: 1.0,
        source: 'rules',
        inferenceTime: Date.now() - startTime,
      };
    }

    try {
      // Try ML prediction with timeout
      const prediction = await Promise.race([
        mlFunction(),
        this.timeout(mlConfig.performance.maxInferenceTime),
      ]);

      if (!prediction) {
        throw new Error('ML prediction timeout');
      }

      // Check confidence threshold
      const modelConfig = this.getModelConfigForFeature(feature);
      if (prediction.confidence < modelConfig.minConfidence) {
        logger.warn(
          `ML confidence ${prediction.confidence} below threshold ${modelConfig.minConfidence}, using fallback`
        );
        
        if (modelConfig.fallback) {
          const fallbackResult = await fallbackFunction();
          return {
            prediction: fallbackResult,
            confidence: 1.0,
            source: 'fallback',
            inferenceTime: Date.now() - startTime,
          };
        }
      }

      logger.info(
        `ML prediction for ${feature}: confidence=${prediction.confidence}, time=${prediction.inferenceTime}ms`
      );
      return prediction;

    } catch (_error) {
      logger.error(`ML prediction failed for ${feature}: ${error}`);
      
      // Always fallback on error
      const fallbackResult = await fallbackFunction();
      return {
        prediction: fallbackResult,
        confidence: 1.0,
        source: 'fallback',
        inferenceTime: Date.now() - startTime,
      };
    }
  }

  private static timeout(ms: number): Promise<null> {
    return new Promise((resolve) => setTimeout(() => resolve(null), ms));
  }

  private static getModelConfigForFeature(feature: string): {
    minConfidence: number;
    fallback: boolean;
  } {
    // Map features to model configs
    const mapping: Record<string, keyof typeof mlConfig.models> = {
      productRecommendations: 'productRecommendation',
      trendForecasting: 'trendForecasting',
      emailOptimization: 'emailSendTime',
    };

    const modelKey = mapping[feature];
    if (modelKey) {
      const config = mlConfig.models[modelKey];
      return {
        minConfidence: config.minConfidence,
        fallback: config.enabled && ('fallbackToRules' in config ? config.fallbackToRules : 
                                     'fallbackToGoogleTrends' in config ? config.fallbackToGoogleTrends : 
                                     config.fallbackToDefaultTime),
      };
    }

    return { minConfidence: 0.7, fallback: true };
  }
}
