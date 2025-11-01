// backend/ml/models/productRecommendation.ts
// Product Recommendation: ML vs. Rule-based

import { MLPrediction, MLService } from '../mlService.js';
import { wooGet } from '../../tools/woo.js';
import { logger } from '../../logger.js';
import { isMLEnabled } from '../../config/ml.config.js';
import { getOpenAIClient } from '../../utils/openai.js';

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
   * ML-based recommendations (OpenAI-powered)
   */
  private static async mlRecommendations(
    customerId: number,
    limit: number
  ): Promise<MLPrediction<ProductRecommendation[]>> {
    const startTime = Date.now();
    
    logger.info(`🤖 ML (OpenAI): Generating recommendations for customer ${customerId}`);

    try {
      // 1. Get customer data
      const customer = await wooGet(`customers/${customerId}`) as any;
      const orders = await wooGet(`customers/${customerId}/orders`, { per_page: 20 }) as any[];
      
      // 2. Extract purchase history
      const purchasedProducts: Array<{name: string; category: string; price: number}> = [];
      const purchasedProductIds = new Set<number>();
      
      for (const order of orders) {
        for (const item of order.line_items) {
          purchasedProductIds.add(item.product_id);
          purchasedProducts.push({
            name: item.name,
            category: item.categories?.[0]?.name || 'Allgemein',
            price: parseFloat(item.price)
          });
        }
      }

      // 3. Get available products (exclude already purchased)
      const allProducts = await wooGet('products', { per_page: 50, status: 'publish' }) as any[];
      const availableProducts = allProducts
        .filter((p: any) => !purchasedProductIds.has(p.id))
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          price: parseFloat(p.price),
          categories: p.categories.map((c: any) => c.name).join(', '),
          shortDescription: p.short_description?.replace(/<[^>]*>/g, '').substring(0, 100)
        }));

      // 4. OpenAI-powered recommendation
      const openai = getOpenAIClient();
      
      const prompt = `
Als E-Commerce Empfehlungs-Experte analysiere das Kaufverhalten und empfehle passende Produkte.

KUNDE:
- E-Mail: ${customer.email}
- Vorname: ${customer.first_name || 'Unbekannt'}
- Bestellungen: ${orders.length}

GEKAUFTE PRODUKTE (letzte ${purchasedProducts.length}):
${purchasedProducts.slice(0, 10).map(p => `- ${p.name} (${p.category}, €${p.price.toFixed(2)})`).join('\n')}

VERFÜGBARE PRODUKTE (${availableProducts.length} zur Auswahl):
${availableProducts.slice(0, 30).map(p => `- ID: ${p.id} | ${p.name} | €${p.price} | ${p.categories}`).join('\n')}

AUFGABE:
Empfehle ${limit} Produkte die zu den Kaufgewohnheiten passen.
Berücksichtige: Kategorien, Preissegment, Cross-Selling Potenzial

ANTWORT FORMAT (JSON):
{
  "recommendations": [
    {
      "productId": 123,
      "score": 0.95,
      "reason": "Passt perfekt zu bisherigen Käufen in Kategorie X"
    }
  ],
  "confidence": 0.85,
  "reasoning": "Kunde kauft primär..."
}
`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein E-Commerce Recommendation Engine. Analysiere Kaufverhalten und empfehle passende Produkte. Antworte immer in JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(aiResponse);
      const recommendations: ProductRecommendation[] = parsed.recommendations || [];
      const confidence = parsed.confidence || 0.75;

      logger.info(`✅ OpenAI: Generated ${recommendations.length} recommendations (confidence: ${confidence})`);
      logger.info(`🧠 Reasoning: ${parsed.reasoning?.substring(0, 100)}`);

      return {
        prediction: recommendations.slice(0, limit),
        confidence,
        source: 'ml',
        inferenceTime: Date.now() - startTime,
        modelVersion: 'gpt-4o-mini',
      };

    } catch (_error) {
      logger.error(`ML recommendation failed: ${_error}`);
      throw _error;
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

    } catch (_error) {
      logger.error(`Rule-based recommendation failed: ${_error}`);
      
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
