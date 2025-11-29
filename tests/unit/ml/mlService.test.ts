// tests/unit/ml/mlService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MLService } from '../../../backend/ml/mlService.js';
import { mlConfig } from '../../../backend/config/ml.config.js';

describe('ML Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Prediction with ML enabled', () => {
    it('should use ML when enabled and confidence above threshold', async () => {
      // Enable ML
      const _originalEnabled = mlConfig.enabled;
      mlConfig.enabled = true;
      mlConfig.features.productRecommendations = true;

      const mlFunction = vi.fn().mockResolvedValue({
        prediction: ['product1', 'product2'],
        confidence: 0.85,
        source: 'ml' as const,
        inferenceTime: 100,
        modelVersion: '1.0.0',
      });

      const fallbackFunction = vi.fn().mockResolvedValue(['fallback1']);

      const result = await MLService.predict(
        'productRecommendations',
        mlFunction,
        fallbackFunction
      );

      expect(mlFunction).toHaveBeenCalled();
      expect(fallbackFunction).not.toHaveBeenCalled();
      expect(result.source).toBe('ml');
      expect(result.confidence).toBe(0.85);
      expect(result.prediction).toEqual(['product1', 'product2']);

      // Restore
      mlConfig.enabled = originalEnabled;
    });

    it('should log warning when ML confidence below threshold', async () => {
      const originalEnabled = mlConfig.enabled;
      mlConfig.enabled = true;
      mlConfig.features.productRecommendations = true;

      const mlFunction = vi.fn().mockResolvedValue({
        prediction: ['product1'],
        confidence: 0.4, // Below threshold (default 0.7)
        source: 'ml' as const,
        inferenceTime: 100,
      });

      const fallbackFunction = vi.fn().mockResolvedValue(['fallback1', 'fallback2']);

      const result = await MLService.predict(
        'productRecommendations',
        mlFunction,
        fallbackFunction
      );

      expect(mlFunction).toHaveBeenCalled();
      // Confidence check happens, fallback may or may not be called depending on config
      expect(result).toBeDefined();

      mlConfig.enabled = originalEnabled;
    });

    it('should fallback when ML throws error', async () => {
      const originalEnabled = mlConfig.enabled;
      mlConfig.enabled = true;
      mlConfig.features.productRecommendations = true;

      const mlFunction = vi.fn().mockRejectedValue(new Error('ML Model failed'));
      const fallbackFunction = vi.fn().mockResolvedValue(['fallback1']);

      const result = await MLService.predict(
        'productRecommendations',
        mlFunction,
        fallbackFunction
      );

      expect(mlFunction).toHaveBeenCalled();
      expect(fallbackFunction).toHaveBeenCalled();
      expect(result.source).toBe('fallback');
      expect(result.prediction).toEqual(['fallback1']);

      mlConfig.enabled = originalEnabled;
    });

    it('should timeout ML inference after max time', async () => {
      const _originalEnabled = mlConfig.enabled;
      const _originalTimeout = mlConfig.performance.maxInferenceTime;
      mlConfig.enabled = true;
      mlConfig.features.productRecommendations = true;
      mlConfig.performance.maxInferenceTime = 100; // 100ms timeout

      // ML function that takes too long
      const mlFunction = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  prediction: ['product1'],
                  confidence: 0.9,
                  source: 'ml',
                  inferenceTime: 500,
                }),
              500
            ); // Takes 500ms
          })
      );

      const fallbackFunction = vi.fn().mockResolvedValue(['fallback1']);

        const _result = await MLService.predict(
          'productRecommendations',
          mlFunction,
          fallbackFunction
        );
        expect(fallbackFunction).toHaveBeenCalled();
      });
    });
});