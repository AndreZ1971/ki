// backend/agent/jobs/autoProductCreatorML.ts
// Auto Product Creator WITH ML Integration

import { TrendForecastingEngine } from '../../ml/models/trendForecasting.js';
import { ProductRecommendationEngine } from '../../ml/models/productRecommendation.js';
import { wooPost } from '../../tools/woo.js';
import { logger } from '../../logger.js';
import { isMLEnabled } from '../../config/ml.config.js';

export class AutoProductCreatorML {
  /**
   * Create products based on ML trend forecasting or Google Trends
   */
  static async createProductsFromTrends(limit: number = 5) {
    logger.info(`🚀 Auto Product Creator (ML: ${isMLEnabled('trendForecasting')})`);

    try {
      // 1. Get trend keywords (you'd have a list or fetch from somewhere)
      const keywords = [
        'DSGVO Compliance',
        'Cookie Management',
        'Datenschutz Software',
        'Newsletter DSGVO',
        'Datenschutz Audit'
      ];

      // 2. Forecast trends using ML or Google Trends (automatic fallback)
      const trendForecast = await TrendForecastingEngine.forecast(keywords);

      logger.info(
        `📊 Trend Forecast (${trendForecast.source}): confidence=${trendForecast.confidence}`
      );

      // 3. Filter for rising trends only
      const risingTrends = trendForecast.prediction
        .filter(t => t.trend === 'rising' && t.score > 30)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      logger.info(`📈 Found ${risingTrends.length} rising trends`);

      // 4. Create products for rising trends
      const createdProducts = [];

      for (const trend of risingTrends) {
        const product = await this.createProductFromTrend(trend.keyword);
        createdProducts.push(product);
        
        logger.info(`✅ Created: "${(product as any).name}" (trend score: ${trend.score})`);
      }

      // 5. Log ML performance metrics
      logger.info(`
        📊 Performance Metrics:
        - Source: ${trendForecast.source} (${trendForecast.source === 'ml' ? '🤖 ML' : '📋 Rules'})
        - Confidence: ${(trendForecast.confidence * 100).toFixed(1)}%
        - Inference Time: ${trendForecast.inferenceTime}ms
        - Products Created: ${createdProducts.length}
        ${trendForecast.modelVersion ? `- Model Version: ${trendForecast.modelVersion}` : ''}
      `);

      return createdProducts;

    } catch (_error) {
      logger.error(`Auto Product Creator failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get product bundle recommendations using ML or rules
   */
  static async createProductBundle(customerId: number) {
    logger.info(`🎁 Creating bundle for customer ${customerId} (ML: ${isMLEnabled('productRecommendations')})`);

    try {
      // Get recommendations using ML or rule-based system
      const recommendations = await ProductRecommendationEngine.getRecommendations(
        customerId,
        5
      );

      logger.info(
        `💡 Recommendations (${recommendations.source}): confidence=${recommendations.confidence}`
      );

      // Create bundle product with recommended items
      const bundleProduct = await wooPost('products', {
        name: `Empfohlenes Bundle für Kunde ${customerId}`,
        type: 'grouped',
        grouped_products: recommendations.prediction.map(r => r.productId),
        regular_price: '199.00',
        description: `
          <h2>Speziell für Sie zusammengestellt</h2>
          <p>Basierend auf ${recommendations.source === 'ml' ? 'KI-Analyse' : 'Kaufhistorie'}:</p>
          <ul>
            ${recommendations.prediction.map(r => 
              `<li>${r.reason} (Relevanz: ${(r.score * 100).toFixed(0)}%)</li>`
            ).join('\n')}
          </ul>
        `,
        status: 'publish',
      });

      logger.info(`
        📊 Bundle Performance:
        - Source: ${recommendations.source} (${recommendations.source === 'ml' ? '🤖 ML' : '📋 Rules'})
        - Confidence: ${(recommendations.confidence * 100).toFixed(1)}%
        - Inference Time: ${recommendations.inferenceTime}ms
        - Products in Bundle: ${recommendations.prediction.length}
      `);

      return bundleProduct;

    } catch (_error) {
      logger.error(`Bundle creation failed: ${error}`);
      throw error;
    }
  }

  private static async createProductFromTrend(keyword: string) {
    // Create product from trend keyword
    // (reuse logic from existing autoProductCreator.ts)
    const product = await wooPost('products', {
      name: `${keyword} - Premium Guide`,
      type: 'virtual',
      regular_price: '49.99',
      description: `Umfassender Guide zum Thema ${keyword}`,
      short_description: `Alles was Sie über ${keyword} wissen müssen`,
      status: 'publish',
      categories: [{ id: 1 }],
    });

    return product;
  }
}
