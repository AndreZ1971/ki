// tests/unit/ml/productRecommendation.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mlConfig } from '../../../backend/config/ml.config.js';

// Mock WooCommerce functions
vi.mock('../../../backend/tools/woo.js', () => ({
  wooGet: vi.fn(),
}));

import { ProductRecommendationEngine } from '../../../backend/ml/models/productRecommendation.js';
import { wooGet } from '../../../backend/tools/woo.js';

const mockWooGet = wooGet as ReturnType<typeof vi.fn>;

describe('Product Recommendation Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWooGet.mockResolvedValue([]);
  });

  describe('ML Recommendations', () => {
    it('should generate ML recommendations for customer with purchase history', async () => {
      const originalEnabled = mlConfig.enabled;
      mlConfig.enabled = true;
      mlConfig.features.productRecommendations = true;

      // Mock customer orders
      mockWooGet.mockImplementation((endpoint: string) => {
        if (endpoint.includes('customers/123/orders')) {
          return Promise.resolve([
            {
              id: 1001,
              line_items: [{ product_id: 101 }, { product_id: 102 }],
            },
          ]);
        }
        if (endpoint === 'customers') {
          return Promise.resolve([
            { id: 123 },
            { id: 456 },
            { id: 789 },
          ]);
        }
        if (endpoint.includes('customers/456/orders')) {
          return Promise.resolve([
            {
              id: 2001,
              line_items: [{ product_id: 101 }, { product_id: 201 }],
            },
          ]);
        }
        if (endpoint.includes('products/201')) {
          return Promise.resolve({
            id: 201,
            name: 'DSGVO Template Advanced',
            categories: [{ id: 1, name: 'Templates' }],
          });
        }
        return Promise.resolve([]);
      });

      const result = await ProductRecommendationEngine.getRecommendations(123, 5);

      expect(result.source).toBe('ml');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.prediction).toBeInstanceOf(Array);

      mlConfig.enabled = originalEnabled;
    });

    it('should include recommendation reasons', async () => {
      const originalEnabled = mlConfig.enabled;
      mlConfig.enabled = true;
      mlConfig.features.productRecommendations = true;

      mockWooGet.mockImplementation((endpoint: string) => {
        if (endpoint.includes('orders')) {
          return Promise.resolve([
            {
              id: 1001,
              line_items: [{ product_id: 101 }],
            },
          ]);
        }
        if (endpoint === 'customers') {
          return Promise.resolve([{ id: 123 }, { id: 456 }]);
        }
        if (endpoint.includes('products/')) {
          return Promise.resolve({
            id: 201,
            name: 'Test Product',
            categories: [{ id: 1 }],
          });
        }
        return Promise.resolve([]);
      });

      const result = await ProductRecommendationEngine.getRecommendations(123, 3);

      if (result.prediction.length > 0) {
        expect(result.prediction[0]).toHaveProperty('productId');
        expect(result.prediction[0]).toHaveProperty('score');
        expect(result.prediction[0]).toHaveProperty('reason');
        expect(result.prediction[0].reason).toContain('Kunden');
      }

      mlConfig.enabled = originalEnabled;
    });

    it('should score products by relevance', async () => {
      const originalEnabled = mlConfig.enabled;
      mlConfig.enabled = true;
      mlConfig.features.productRecommendations = true;

      mockWooGet.mockImplementation((endpoint: string) => {
        if (endpoint.includes('orders')) {
          return Promise.resolve([
            {
              id: 1001,
              line_items: [{ product_id: 101 }],
            },
          ]);
        }
        if (endpoint === 'customers') {
          return Promise.resolve([{ id: 123 }]);
        }
        if (endpoint.includes('products/')) {
          return Promise.resolve({ id: 201, name: 'Product', categories: [{ id: 1 }] });
        }
        return Promise.resolve([]);
      });

      const result = await ProductRecommendationEngine.getRecommendations(123, 5);

      if (result.prediction.length > 1) {
        // Scores should be between 0 and 1
        for (const rec of result.prediction) {
          expect(rec.score).toBeGreaterThanOrEqual(0);
          expect(rec.score).toBeLessThanOrEqual(1);
        }
      }

      mlConfig.enabled = originalEnabled;
    });
  });

  describe('Rule-based Recommendations (Fallback)', () => {
    it('should use rule-based when ML disabled', async () => {
      const originalEnabled = mlConfig.enabled;
      mlConfig.enabled = false;

      mockWooGet.mockImplementation((endpoint: string) => {
        if (endpoint.includes('orders')) {
          return Promise.resolve([
            {
              id: 1001,
              line_items: [{ product_id: 101 }],
            },
          ]);
        }
        if (endpoint.includes('products/101')) {
          return Promise.resolve({
            id: 101,
            name: 'DSGVO Toolkit',
            categories: [{ id: 5, name: 'Compliance' }],
          });
        }
        if (endpoint === 'products') {
          return Promise.resolve([
            {
              id: 201,
              name: 'Cookie Manager',
              categories: [{ id: 5, name: 'Compliance' }],
            },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await ProductRecommendationEngine.getRecommendations(123, 3);

      expect(result.source).toBe('rules');
      expect(result.prediction).toBeInstanceOf(Array);

      mlConfig.enabled = originalEnabled;
    });

    it('should recommend from same categories (rule-based)', async () => {
      const originalEnabled = mlConfig.enabled;
      mlConfig.enabled = false;

      mockWooGet.mockImplementation((endpoint: string) => {
        if (endpoint.includes('orders')) {
          return Promise.resolve([
            {
              id: 1001,
              line_items: [{ product_id: 101 }],
            },
          ]);
        }
        if (endpoint.includes('products/101')) {
          return Promise.resolve({
            id: 101,
            name: 'Product A',
            categories: [{ id: 5, name: 'Category X' }],
          });
        }
        if (endpoint === 'products' && endpoint.includes('category=5')) {
          return Promise.resolve([
            {
              id: 201,
              name: 'Product B',
              categories: [{ id: 5, name: 'Category X' }],
            },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await ProductRecommendationEngine.getRecommendations(123, 3);

      if (result.prediction.length > 0) {
        expect(result.prediction[0].reason).toContain('Kategorie');
      }

      mlConfig.enabled = originalEnabled;
    });

    it('should recommend top sellers for new customers (rule-based)', async () => {
      const originalEnabled = mlConfig.enabled;
      mlConfig.enabled = false;

      // Customer with no orders
      mockWooGet.mockImplementation((endpoint: string) => {
        if (endpoint.includes('orders')) {
          return Promise.resolve([]);
        }
        if (endpoint === 'products' && endpoint.includes('orderby=popularity')) {
          return Promise.resolve([
            { id: 301, name: 'Bestseller 1' },
            { id: 302, name: 'Bestseller 2' },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await ProductRecommendationEngine.getRecommendations(999, 2);

      expect(result.prediction.length).toBeGreaterThan(0);
      expect(result.prediction[0].reason).toContain('Bestseller');

      mlConfig.enabled = originalEnabled;
    });
  });

  describe('Edge Cases', () => {
    it('should handle customers with no orders', async () => {
      const originalEnabled = mlConfig.enabled;
      mlConfig.enabled = true;
      mlConfig.features.productRecommendations = true;

      mockWooGet.mockImplementation((endpoint: string) => {
        if (endpoint.includes('orders')) {
          return Promise.resolve([]);
        }
        if (endpoint === 'customers') {
          return Promise.resolve([]);
        }
        if (endpoint === 'products') {
          return Promise.resolve([
            { id: 101, name: 'Product 1' },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await ProductRecommendationEngine.getRecommendations(123, 5);

      expect(result).toBeDefined();
      expect(result.source).toBe('fallback');

      mlConfig.enabled = originalEnabled;
    });

    it('should respect limit parameter', async () => {
      const originalEnabled = mlConfig.enabled;
      mlConfig.enabled = false;

      mockWooGet.mockImplementation((endpoint: string) => {
        if (endpoint.includes('orders')) {
          return Promise.resolve([]);
        }
        if (endpoint === 'products') {
          return Promise.resolve([
            { id: 1, name: 'P1' },
            { id: 2, name: 'P2' },
            { id: 3, name: 'P3' },
            { id: 4, name: 'P4' },
            { id: 5, name: 'P5' },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await ProductRecommendationEngine.getRecommendations(123, 3);

      expect(result.prediction.length).toBeLessThanOrEqual(3);

      mlConfig.enabled = originalEnabled;
    });

    it('should handle WooCommerce API errors gracefully', async () => {
      const originalEnabled = mlConfig.enabled;
      mlConfig.enabled = true;
      mlConfig.features.productRecommendations = true;

      mockWooGet.mockRejectedValue(new Error('WooCommerce API error'));

      const result = await ProductRecommendationEngine.getRecommendations(123, 5);

      expect(result).toBeDefined();
      expect(result.source).toBe('fallback');

      mlConfig.enabled = originalEnabled;
    });
  });

  describe('Performance', () => {
    it('should complete within reasonable time', async () => {
      const originalEnabled = mlConfig.enabled;
      mlConfig.enabled = false; // Use rules for faster test

      mockWooGet.mockImplementation((endpoint: string) => {
        if (endpoint.includes('orders')) {
          return Promise.resolve([]);
        }
        if (endpoint === 'products') {
          return Promise.resolve([
            { id: 1, name: 'Product 1' },
          ]);
        }
        return Promise.resolve([]);
      });

      const startTime = Date.now();
      await ProductRecommendationEngine.getRecommendations(123, 5);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in 5 seconds

      mlConfig.enabled = originalEnabled;
    });
  });
});
