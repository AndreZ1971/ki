// backend/ml/models/trendForecasting.ts
// Trend Forecasting: ML vs. Google Trends

import { MLPrediction, MLService } from '../mlService.js';
// @ts-expect-error - no types available for google-trends-api
import googleTrends from 'google-trends-api';
import { logger } from '../../logger.js';

export interface TrendForecast {
  keyword: string;
  score: number; // 0-100
  trend: 'rising' | 'stable' | 'falling';
  confidence: number;
}

export class TrendForecastingEngine {
  /**
   * Forecast trend (ML or Google Trends)
   */
  static async forecast(
    keywords: string[]
  ): Promise<MLPrediction<TrendForecast[]>> {
    return MLService.predict(
      'trendForecasting',
      () => this.mlForecast(keywords),
      () => this.googleTrendsForecast(keywords)
    );
  }

  /**
   * ML-based trend forecasting (Time Series Analysis)
   */
  private static async mlForecast(
    keywords: string[]
  ): Promise<MLPrediction<TrendForecast[]>> {
    const startTime = Date.now();
    
    logger.info(`🤖 ML: Forecasting trends for ${keywords.length} keywords`);

    try {
      const forecasts: TrendForecast[] = [];

      for (const keyword of keywords) {
        // 1. Get historical Google Trends data (last 12 months)
        const historicalData = await this.getHistoricalTrendData(keyword, 12);
        
        // 2. Calculate trend direction using simple linear regression
        const trendDirection = this.calculateTrendDirection(historicalData);
        
        // 3. Forecast next month using moving average
        const forecast = this.forecastNextPeriod(historicalData);
        
        // 4. Determine trend status
        let trend: 'rising' | 'stable' | 'falling';
        if (trendDirection > 0.1) trend = 'rising';
        else if (trendDirection < -0.1) trend = 'falling';
        else trend = 'stable';

        forecasts.push({
          keyword,
          score: Math.round(forecast),
          trend,
          confidence: this.calculateConfidence(historicalData),
        });
      }

      // Average confidence across all keywords
      const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;

      return {
        prediction: forecasts,
        confidence: avgConfidence,
        source: 'ml',
        inferenceTime: Date.now() - startTime,
        modelVersion: '1.0.0',
      };

    } catch (error) {
      logger.error(`ML trend forecast failed: ${error}`);
      throw error;
    }
  }

  /**
   * Google Trends-based forecasting (fallback)
   */
  private static async googleTrendsForecast(
    keywords: string[]
  ): Promise<TrendForecast[]> {
    logger.info(`📊 Google Trends: Fetching trends for ${keywords.length} keywords`);

    const forecasts: TrendForecast[] = [];

    for (const keyword of keywords) {
      try {
        const results = await googleTrends.interestOverTime({
          keyword,
          startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // last 90 days
          geo: 'DE',
        });

        const data = JSON.parse(results);
        const timelineData = data.default.timelineData;

        if (timelineData && timelineData.length > 0) {
          // Get latest score
          const latestScore = timelineData[timelineData.length - 1].value[0];
          
          // Compare with 30 days ago
          const oldScore = timelineData[Math.max(0, timelineData.length - 30)]?.value[0] || 0;
          
          let trend: 'rising' | 'stable' | 'falling';
          if (latestScore > oldScore * 1.1) trend = 'rising';
          else if (latestScore < oldScore * 0.9) trend = 'falling';
          else trend = 'stable';

          forecasts.push({
            keyword,
            score: latestScore,
            trend,
            confidence: 0.7, // Google Trends baseline confidence
          });
        } else {
          forecasts.push({
            keyword,
            score: 0,
            trend: 'stable',
            confidence: 0.3,
          });
        }

      } catch (error) {
        logger.error(`Google Trends failed for "${keyword}": ${error}`);
        forecasts.push({
          keyword,
          score: 0,
          trend: 'stable',
          confidence: 0.1,
        });
      }
    }

    return forecasts;
  }

  /**
   * Helper: Get historical trend data
   */
  private static async getHistoricalTrendData(
    keyword: string,
    months: number
  ): Promise<number[]> {
    try {
      const results = await googleTrends.interestOverTime({
        keyword,
        startTime: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000),
        geo: 'DE',
      });

      const data = JSON.parse(results);
      return data.default.timelineData.map((d: any) => d.value[0]);
    } catch {
      return [];
    }
  }

  /**
   * Helper: Calculate trend direction (linear regression slope)
   */
  private static calculateTrendDirection(data: number[]): number {
    if (data.length < 2) return 0;

    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Helper: Forecast next period using exponential moving average
   */
  private static forecastNextPeriod(data: number[]): number {
    if (data.length === 0) return 0;
    if (data.length === 1) return data[0];

    // Simple exponential smoothing (alpha = 0.3)
    const alpha = 0.3;
    let forecast = data[0];

    for (let i = 1; i < data.length; i++) {
      forecast = alpha * data[i] + (1 - alpha) * forecast;
    }

    return forecast;
  }

  /**
   * Helper: Calculate confidence based on data quality
   */
  private static calculateConfidence(data: number[]): number {
    if (data.length < 6) return 0.4; // Not enough data
    if (data.length < 12) return 0.6; // Some data
    
    // Check variance (more stable = higher confidence)
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower variance = higher confidence
    const coefficientOfVariation = stdDev / mean;
    
    if (coefficientOfVariation < 0.2) return 0.9; // Very stable
    if (coefficientOfVariation < 0.4) return 0.75; // Stable
    return 0.6; // Variable
  }
}
