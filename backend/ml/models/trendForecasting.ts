// backend/ml/models/trendForecasting.ts
// Trend Forecasting: ML vs. Google Trends

import { MLPrediction, MLService } from '../mlService.js';
// Types are defined in ../../types/google-trends-api.d.ts
// ...existing code...
import googleTrends from 'google-trends-api';
import { logger } from '../../logger.js';
import { getOpenAIClient } from '../../utils/openai.js';

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
   * ML-based trend forecasting (OpenAI + Google Trends Hybrid)
   */
  private static async mlForecast(
    keywords: string[]
  ): Promise<MLPrediction<TrendForecast[]>> {
    const startTime = Date.now();
    
    logger.info(`🤖 ML (OpenAI + Google Trends): Forecasting ${keywords.length} keywords`);

    try {
      // 1. Get Google Trends data for context
      const trendsData: Array<{keyword: string; values: number[]}> = [];
      
      for (const keyword of keywords) {
        try {
          const results = await googleTrends.interestOverTime({
            keyword,
            startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days
            geo: 'DE',
          });
          
          const parsed = JSON.parse(results);
          const values = parsed.default?.timelineData?.map((d: any) => d.value[0]) || [];
          trendsData.push({ keyword, values });
        } catch (_err) {
          logger.warn(`Failed to get trends for ${keyword}`);
          trendsData.push({ keyword, values: [50] }); // Fallback
        }
      }

      // 2. OpenAI analysis
      const openai = getOpenAIClient();
      
      const prompt = `
Als Markt-Trend-Analyst analysiere die Google Trends Daten und prognostiziere Entwicklungen.

DATEN (letzte 90 Tage):
${trendsData.map(t => `${t.keyword}: [${t.values.slice(-10).join(', ')}] (letzte 10 Werte)`).join('\n')}

AUFGABE:
1. Analysiere den Trend: rising/stable/falling
2. Bewerte die Stärke (Score 0-100)
3. Prognostiziere die nächsten 30 Tage
4. Begründe deine Einschätzung

ANTWORT FORMAT (JSON):
{
  "forecasts": [
    {
      "keyword": "Keyword",
      "score": 75,
      "trend": "rising",
      "confidence": 0.8,
      "reasoning": "Starker Aufwärtstrend in den letzten 30 Tagen..."
    }
  ],
  "overallTrend": "E-Commerce zeigt positive Entwicklung...",
  "recommendations": ["Fokus auf Keyword X", "Keyword Y abnehmend"]
}
`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein E-Commerce Trend-Analyst mit Expertise in Google Trends Interpretation und Marktprognosen. Antworte in JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(aiResponse);
      const forecasts: TrendForecast[] = parsed.forecasts || [];
      const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;

      logger.info(`✅ OpenAI: Analyzed ${forecasts.length} trends`);
      logger.info(`📊 Overall: ${parsed.overallTrend?.substring(0, 100)}`);

      return {
        prediction: forecasts,
        confidence: avgConfidence,
        source: 'ml',
        inferenceTime: Date.now() - startTime,
        modelVersion: 'gpt-4o-mini',
      };

    } catch (_error) {
      logger.error(`ML trend forecast failed: ${_error}`);
      throw _error;
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

      } catch (_error) {
        logger.error(`Google Trends failed for "${keyword}": ${_error}`);
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
