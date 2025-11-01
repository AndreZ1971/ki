// backend/ml/models/productRecommendation.ts
// Product Recommendation: ML vs. Rule-based

import { MLPrediction, MLService } from '../mlService.js';
import { wooGet } from '../../tools/woo.js';
import { logger } from '../../logger.js';
import { isMLEnabled } from '../../config/ml.config.js';

export interface ProductRecommendation {
  productId: number;
  score: number;
  reason: string;
}

export class ProductRecommendationEngine {
  /**
   * Get product recommendations (ML or Rule-based)
   */
  static async getRecommendations(
    customerId: number,
    limit: number = 5
  ): Promise<MLPrediction<ProductRecommendation[]>> {
    return MLService.predict(
      'productRecommendations',
      () => this.mlRecommendations(customerId, limit),
      () => this.ruleBasedRecommendations(customerId, limit)
    );
  }

  /**
   * ML-based recommendations (Collaborative Filtering)
   */
  private static async mlRecommendations(
    customerId: number,
    limit: number
  ): Promise<MLPrediction<ProductRecommendation[]>> {
    const startTime = Date.now();
    
    logger.info(`🤖 ML: Generating recommendations for customer ${customerId}`);

    try {
      // 1. Get customer's purchase history
      const orders = await wooGet(`customers/${customerId}/orders`, { per_page: 100 }) as any[];
      
      // 2. Extract purchased product IDs
      const purchasedProductIds = new Set<number>();
      for (const order of orders) {
        for (const item of order.line_items) {
          purchasedProductIds.add(item.product_id);
        }
      }

      // 3. Find similar customers (simple collaborative filtering)
      const allCustomers = await wooGet('customers', { per_page: 100 }) as any[];
      const similarCustomers = await this.findSimilarCustomers(
        customerId,
        allCustomers,
        purchasedProductIds
      );

      // 4. Get products bought by similar customers
      const recommendedProducts = await this.getProductsFromSimilarCustomers(
        similarCustomers,
        purchasedProductIds
      );

      // 5. Score and rank products
      const recommendations = recommendedProducts
        .slice(0, limit)
        .map((product, index) => ({
          productId: product.id,
          score: 1 - index / limit, // Simple scoring
          reason: `Kunden mit ähnlichem Kaufverhalten kauften auch "${product.name}"`,
        }));

      const confidence = recommendedProducts.length >= limit ? 0.85 : 0.6;

      return {
        prediction: recommendations,
        confidence,
        source: 'ml',
        inferenceTime: Date.now() - startTime,
        modelVersion: '1.0.0',
      };

    } catch (error) {
      logger.error(`ML recommendation failed: ${error}`);
      throw error;
    }
  }

  /**
   * Rule-based recommendations (fallback)
   */
  private static async ruleBasedRecommendations(
    customerId: number,
    limit: number
  ): Promise<ProductRecommendation[]> {
    logger.info(`📋 Rules: Generating recommendations for customer ${customerId}`);

    try {
      // 1. Get customer's purchase history
      const orders = await wooGet(`customers/${customerId}/orders`, { per_page: 50 }) as any[];
      
      // 2. Get purchased categories
      const purchasedCategories = new Set<number>();
      for (const order of orders) {
        for (const item of order.line_items) {
          const product = await wooGet(`products/${item.product_id}`) as any;
          for (const category of product.categories) {
            purchasedCategories.add(category.id);
          }
        }
      }

      // 3. If no history, recommend top sellers
      if (purchasedCategories.size === 0) {
        const topProducts = await wooGet('products', {
          orderby: 'popularity',
          per_page: limit,
        }) as any[];
        
        return topProducts.map((product: any, index: number) => ({
          productId: product.id,
          score: 1 - index / limit,
          reason: 'Bestseller in unserem Shop',
        }));
      }

      // 4. Recommend products from same categories
      const categoryIds = Array.from(purchasedCategories);
      const recommendations: ProductRecommendation[] = [];

      for (const categoryId of categoryIds) {
        if (recommendations.length >= limit) break;

        const products = await wooGet('products', {
          category: categoryId,
          per_page: Math.ceil(limit / categoryIds.length),
          orderby: 'popularity',
        }) as any[];

        for (const product of products) {
          if (recommendations.length >= limit) break;
          
          recommendations.push({
            productId: product.id,
            score: 0.7,
            reason: `Ähnliche Kategorie: ${product.categories[0]?.name}`,
          });
        }
      }

      return recommendations;

    } catch (error) {
      logger.error(`Rule-based recommendation failed: ${error}`);
      
      // Ultimate fallback: just recommend newest products
      const products = await wooGet('products', {
        orderby: 'date',
        order: 'desc',
        per_page: limit,
      }) as any[];

      return products.map((product: any, index: number) => ({
        productId: product.id,
        score: 0.5,
        reason: 'Neu in unserem Shop',
      }));
    }
  }

  private static async findSimilarCustomers(
    customerId: number,
    allCustomers: any[],
    purchasedProducts: Set<number>
  ): Promise<number[]> {
    // Simple Jaccard similarity
    const similarities: { customerId: number; score: number }[] = [];

    for (const customer of allCustomers) {
      if (customer.id === customerId) continue;

      const customerOrders = await wooGet(`customers/${customer.id}/orders`, {
        per_page: 100,
      }) as any[];
      
      const customerProducts = new Set<number>();
      for (const order of customerOrders) {
        for (const item of order.line_items) {
          customerProducts.add(item.product_id);
        }
      }

      const intersection = new Set(
        [...purchasedProducts].filter((x) => customerProducts.has(x))
      );
      const union = new Set([...purchasedProducts, ...customerProducts]);
      const similarity = intersection.size / union.size;

      if (similarity > 0.1) {
        similarities.push({ customerId: customer.id, score: similarity });
      }
    }

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((s) => s.customerId);
  }

  private static async getProductsFromSimilarCustomers(
    similarCustomerIds: number[],
    excludeProducts: Set<number>
  ): Promise<any[]> {
    const productFrequency = new Map<number, { product: any; count: number }>();

    for (const customerId of similarCustomerIds) {
      const orders = await wooGet(`customers/${customerId}/orders`, {
        per_page: 50,
      }) as any[];

      for (const order of orders) {
        for (const item of order.line_items) {
          if (excludeProducts.has(item.product_id)) continue;

          if (!productFrequency.has(item.product_id)) {
            const product = await wooGet(`products/${item.product_id}`);
            productFrequency.set(item.product_id, { product, count: 0 });
          }

          productFrequency.get(item.product_id)!.count++;
        }
      }
    }

    return Array.from(productFrequency.values())
      .sort((a, b) => b.count - a.count)
      .map((entry) => entry.product);
  }
}
