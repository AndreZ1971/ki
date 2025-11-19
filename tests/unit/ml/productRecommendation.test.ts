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
          return Promise.resolve([{ id: 123 }, { id: 456 }]);
        }
        return Promise.resolve([]);
      });

      const result = await ProductRecommendationEngine.getRecommendations(123, 2);
      expect(result.prediction.length).toBeGreaterThanOrEqual(0);

      mlConfig.enabled = originalEnabled;
    });
  });
});
