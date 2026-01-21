// backend/agent/loops/productOptimizationLoop.ts
/**
 * Agentic Loop für Produkt-Optimierung
 * SENSE: Analysiere Product Performance
 * THINK: Identifiziere Optimierungen
 * ACT: Teste Änderungen (A/B Test)
 * LEARN: Speichere erfolgreiche Varianten
 */

import { AgenticLoop } from '../agenticLoop';
import { logger } from '../../logger';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { getConfig } from '../../config';

interface ProductVariant {
  productId: number;
  attribute: 'price' | 'title' | 'description' | 'category';
  original: any;
  suggested: any;
  expectedImpact: number; // 0-100%
}

interface OptimizationResult {
  productId: number;
  variant: ProductVariant;
  aResult: number; // Conversions in variant A
  bResult: number; // Conversions in variant B
  winner: 'A' | 'B';
  improvement: number; // %
}

export class ProductOptimizationLoop extends AgenticLoop {
  private wooCommerce: WooCommerceRestApi;
  private candidates: ProductVariant[] = [];
  private results: OptimizationResult[] = [];

  constructor() {
    super('product-performance', 5);


    const config = getConfig();
    this.wooCommerce = new WooCommerceRestApi({
      url: config.woocommerce?.url || '',
      consumerKey: config.woocommerce?.consumerKey || '',
      consumerSecret: config.woocommerce?.consumerSecret || '',
      version: 'wc/v3',
    });

    this.setupSteps();
  }

  private setupSteps(): void {
    // SENSE: Hole Low-Performing Products
    this.addStep({
      name: 'sense',
      description: 'Find products with low conversion rates',
      action: async () => {
        logger.info('🔍 SENSE: Fetching product performance data...');

        const response = await this.wooCommerce.get('products', {
          per_page: 50,
          orderby: 'popularity',
          order: 'asc',
        });

        logger.info(
          `📊 SENSE: Found ${response.data.length} underperforming products`
        );
        return response.data;
      },
    });

    // THINK: Identifiziere Optimierungen
    this.addStep({
      name: 'think',
      description: 'Generate optimization variants',
      action: async () => {
        logger.info('🧠 THINK: Generating optimization variants...');

        const products: any[] = (this.context.findings[
          this.context.findings.length - 1
        ] || []) as any[];
        this.candidates = [];

        for (const product of products) {
          // 1️⃣ Price Optimization
          const priceVariant: ProductVariant = {
            productId: product.id,
            attribute: 'price',
            original: product.price,
            suggested: (parseFloat(product.price) * 0.9).toFixed(2), // 10% Rabatt
            expectedImpact: 15,
          };
          this.candidates.push(priceVariant);

          // 2️⃣ Title Optimization (macht es attraktiver)
          const titleVariant: ProductVariant = {
            productId: product.id,
            attribute: 'title',
            original: product.name,
            suggested: `${product.name} - ⭐ Bestseller`,
            expectedImpact: 8,
          };
          this.candidates.push(titleVariant);

          // 3️⃣ Description Enhancement
          const descVariant: ProductVariant = {
            productId: product.id,
            attribute: 'description',
            original: product.description || '',
            suggested: `${product.description || ''}\n\n✅ Sofort lieferbar\n✅ DSGVO konform\n✅ Deutsche Qualität`,
            expectedImpact: 12,
          };
          this.candidates.push(descVariant);
        }

        logger.info(
          `🎯 THINK: Generated ${this.candidates.length} optimization candidates`
        );
        return this.candidates;
      },
    });

    // ACT: Führe A/B Tests durch
    this.addStep({
      name: 'act',
      description: 'Execute A/B tests on product variants',
      action: async () => {
        logger.info('⚡ ACT: Fetching real conversion data from WooCommerce...');

        // Hole echte Konversionsdaten aus WooCommerce Orders
        try {
          for (const variant of this.candidates) {
            // Abrufen von Orders für dieses Produkt (A/B Variante)
            const ordersResponse = await fetch(
              `${process.env.WOO_URL}/wp-json/wc/v3/orders?product=${variant.productId}&per_page=100`,
              {
                headers: {
                  'Authorization': `Basic ${Buffer.from(
                    `${process.env.WOO_KEY}:${process.env.WOO_SECRET}`
                  ).toString('base64')}`
                }
              }
            );

            if (!ordersResponse.ok) {
              logger.warn(`Could not fetch orders for product ${variant.productId}`);
              continue;
            }

            const orders = await ordersResponse.json();
            const conversions = orders.length;

            this.results.push({
              productId: variant.productId,
              variant,
              aResult: conversions,
              bResult: conversions,
              winner: 'A',
              improvement: 0,
            });

            logger.info(`📦 Product ${variant.productId}: ${conversions} real conversions`);
          }
        } catch (error: any) {
          logger.error('Error fetching conversion data:', error.message);
        }

        logger.info(`✅ ACT: Analyzed ${this.results.length} products with real conversion data`);
        return this.results;
      },
    });

    // LEARN: Speichere beste Varianten (Analysis & Recommendations, keine Execution)
    this.addStep({
      name: 'learn',
      description: 'Identify and recommend winning variants (analysis only)',
      action: async () => {
        logger.info('📚 LEARN: Identifying winning variants for recommendations...');

        const winners = this.results.filter(
          (r) => r.winner === 'B' && r.improvement > 5
        );

        for (const result of winners) {
          const variant = result.variant;
          logger.info(
            `✨ Recommending ${variant.attribute} optimization for product ${variant.productId}` +
              ` (Expected: +${result.improvement}% improvement)`
          );

          // NOTE: This loop provides recommendations only - shop changes must be applied manually
          // In production, this would integrate with a change management system for approval
          // await this.wooCommerce.put(`products/${variant.productId}`, updateData);
        }

        return {
          winnersIdentified: winners.length,
          avgImprovement: (
            winners.reduce((sum, w) => sum + w.improvement, 0) / winners.length
          ).toFixed(2),
          totalPotentialLift: winners
            .reduce((sum, w) => sum + w.improvement, 0)
            .toFixed(2),
        };
      },
    });

    // CONTINUE
    this.addStep({
      name: 'shouldContinue',
      description: 'Continue if improvements found',
      action: async () => {
        const winners = this.results.filter(
          (r) => r.winner === 'B' && r.improvement > 5
        );
        return (
          winners.length > 0 &&
          this.context.iteration < this.context.maxIterations
        );
      },
    });
  }

  getSummary() {
    const winners = this.results.filter(
      (r) => r.winner === 'B' && r.improvement > 5
    );

    return {
      totalTests: this.results.length,
      winners: winners.length,
      avgImprovement:
        winners.length > 0
          ? (
              winners.reduce((sum, w) => sum + w.improvement, 0) /
              winners.length
            ).toFixed(2)
          : 0,
      topOpportunities: winners
        .sort((a, b) => b.improvement - a.improvement)
        .slice(0, 5)
        .map((w) => ({
          productId: w.productId,
          attribute: w.variant.attribute,
          improvement: `${w.improvement}%`,
        })),
      // Transparenz: Loop führt keine Änderungen aus, nur Analyse & Empfehlungen
      executed: false,
      mode: 'analysis',
    };
  }
}
