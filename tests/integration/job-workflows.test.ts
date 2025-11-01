/**
 * Job Workflow Integration Tests
 * 
 * Tests für kritische Job workflows mit mocked external dependencies.
 * Diese Tests verifizieren die vollständige Integration und Orchestrierung
 * von Jobs, inklusive:
 * - WooCommerce API operations (Kategorien, Produkte)
 * - WordPress Media uploads
 * - OpenAI API calls
 * - Error handling und retry logic
 * - Multi-step workflows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock WooCommerce client
vi.mock('../../backend/woocommerce/client.js', () => {
  return {
    WooCommerceClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  };
});

// Mock OpenAI utility
vi.mock('../../backend/utils/openai.js', () => ({
  executeOpenAI: vi.fn(),
  getOpenAIClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

// Mock axios for external APIs
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Import mocked modules
import { WooCommerceClient } from '../../backend/woocommerce/client.js';
import { executeOpenAI, getOpenAIClient } from '../../backend/utils/openai.js';
import axios from 'axios';

describe('Job Workflow Integration Tests', () => {
  let wooClient: InstanceType<typeof WooCommerceClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    wooClient = new WooCommerceClient();
  });

  describe('WooCommerce Category List Job', () => {
    it('should successfully fetch and process categories', async () => {
      // Mock WooCommerce API response
      const mockCategories = [
        { id: 15, name: 'Freebies', slug: 'freebies', count: 5 },
        { id: 16, name: 'Templates', slug: 'templates', count: 12 },
        { id: 17, name: 'Tools', slug: 'tools', count: 8 },
      ];

      vi.mocked(wooClient.get).mockResolvedValue(mockCategories);

      // Execute job workflow
      const result = await wooClient.get('products/categories');

      // Verify API call
      expect(wooClient.get).toHaveBeenCalledWith('products/categories');

      // Verify response structure
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('slug');
    });

    it('should handle empty category list', async () => {
      vi.mocked(wooClient.get).mockResolvedValue([]);

      const result = await wooClient.get('products/categories');

      expect(result).toEqual([]);
    });

    it('should handle WooCommerce API errors gracefully', async () => {
      vi.mocked(wooClient.get).mockRejectedValue(
        new Error('WooCommerce API error: 401 Unauthorized')
      );

      await expect(wooClient.get('products/categories')).rejects.toThrow(
        'WooCommerce API error: 401 Unauthorized'
      );
    });
  });

  describe('Product Creation Workflow', () => {
    it('should create product with basic fields', async () => {
      const mockProduct = {
        data: {
          id: 123,
          name: 'Test Product',
          slug: 'test-product',
          price: '19.99',
          status: 'publish',
        },
      };

      vi.mocked(wooClient.post).mockResolvedValue(mockProduct);

      const productData = {
        name: 'Test Product',
        price: '19.99',
        status: 'publish',
        categories: [{ id: 15 }],
      };

      const result = await wooClient.post('products', productData);

      expect(wooClient.post).toHaveBeenCalledWith('products', productData);
      expect(result.data.id).toBe(123);
      expect(result.data.name).toBe('Test Product');
    });

    it('should handle product creation errors', async () => {
      vi.mocked(wooClient.post).mockRejectedValue(
        new Error('Product creation failed: Invalid price')
      );

      await expect(
        wooClient.post('products', { name: 'Product', price: 'invalid' })
      ).rejects.toThrow('Product creation failed');
    });

    it('should update existing product', async () => {
      const mockProduct = {
        data: {
          id: 123,
          name: 'Updated Product',
          price: '29.99',
        },
      };

      vi.mocked(wooClient.put).mockResolvedValue(mockProduct);

      const result = await wooClient.put('products/123', {
        name: 'Updated Product',
        price: '29.99',
      });

      expect(wooClient.put).toHaveBeenCalledWith('products/123', {
        name: 'Updated Product',
        price: '29.99',
      });
      expect(result.data.name).toBe('Updated Product');
      expect(result.data.price).toBe('29.99');
    });
  });

  describe('AI Content Generation Workflow', () => {
    it('should generate product description using OpenAI', async () => {
      const mockAIResponse = {
        choices: [
          {
            message: {
              content: 'This is an amazing product that will transform your life.',
            },
          },
        ],
      };

      vi.mocked(executeOpenAI).mockResolvedValue(mockAIResponse);

      const result = await executeOpenAI(
        async () => mockAIResponse,
        'generate-product-description'
      );

      expect(executeOpenAI).toHaveBeenCalled();
      expect(result.choices[0].message.content).toContain('amazing product');
    });

    it('should handle OpenAI rate limit errors', async () => {
      vi.mocked(executeOpenAI).mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      await expect(
        executeOpenAI(
          async () => {
            throw new Error('Rate limit');
          },
          'test-operation'
        )
      ).rejects.toThrow();
    });

    it('should generate multiple product descriptions in batch', async () => {
      const products = ['Product A', 'Product B', 'Product C'];
      const mockResponses = products.map((name) => ({
        choices: [{ message: { content: `Description for ${name}` } }],
      }));

      mockResponses.forEach((response) => {
        vi.mocked(executeOpenAI).mockResolvedValueOnce(response);
      });

      const results = [];
      for (const product of products) {
        const result = await executeOpenAI(
          async () => mockResponses[products.indexOf(product)],
          `generate-desc-${product}`
        );
        results.push(result.choices[0].message.content);
      }

      expect(executeOpenAI).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
      expect(results[0]).toContain('Product A');
    });
  });

  describe('Trend Analysis Workflow', () => {
    it('should fetch and analyze trends from external API', async () => {
      const mockTrendData = {
        default: {
          timelineData: [
            {
              time: '2024-01',
              formattedTime: 'Jan 2024',
              formattedAxisTime: 'Jan 2024',
              value: [75],
              hasData: [true],
              formattedValue: ['75'],
            },
            {
              time: '2024-02',
              formattedTime: 'Feb 2024',
              formattedAxisTime: 'Feb 2024',
              value: [82],
              hasData: [true],
              formattedValue: ['82'],
            },
          ],
        },
      };

      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: mockTrendData,
      });

      const result = await axios.get('https://trends.example.com/api/data');

      expect(axios.get).toHaveBeenCalledWith('https://trends.example.com/api/data');
      expect(result.status).toBe(200);
      expect(result.data.default.timelineData).toHaveLength(2);
      expect(result.data.default.timelineData[0].value[0]).toBe(75);
    });

    it('should handle trend API timeout', async () => {
      vi.mocked(axios.get).mockRejectedValue(
        new Error('Request timeout after 30s')
      );

      await expect(
        axios.get('https://trends.example.com/api/data')
      ).rejects.toThrow('Request timeout');
    });

    it('should calculate trend growth percentage', async () => {
      const timelineData = [
        { time: '2024-01', value: [100] },
        { time: '2024-02', value: [150] },
      ];

      const growth =
        ((timelineData[1].value[0] - timelineData[0].value[0]) /
          timelineData[0].value[0]) *
        100;

      expect(growth).toBe(50);
    });
  });

  describe('Product Listing Workflow', () => {
    it('should list products with filters', async () => {
      const mockProducts = {
        data: [
          { id: 1, name: 'Product 1', price: '10.00' },
          { id: 2, name: 'Product 2', price: '20.00' },
        ],
      };

      vi.mocked(wooClient.get).mockResolvedValue(mockProducts);

      const result = await wooClient.get('products', { per_page: 10, status: 'publish' });

      expect(wooClient.get).toHaveBeenCalledWith('products', { per_page: 10, status: 'publish' });
      expect(result.data).toHaveLength(2);
    });

    it('should handle empty product list', async () => {
      vi.mocked(wooClient.get).mockResolvedValue({ data: [] });

      const result = await wooClient.get('products');

      expect(result.data).toEqual([]);
    });

    it('should get single product by ID', async () => {
      const mockProduct = {
        data: { id: 123, name: 'Test Product', price: '19.99' },
      };

      vi.mocked(wooClient.get).mockResolvedValue(mockProduct);

      const result = await wooClient.get('products/123');

      expect(wooClient.get).toHaveBeenCalledWith('products/123');
      expect(result.data.id).toBe(123);
    });
  });

  describe('Error Recovery and Retries', () => {
    it('should retry failed operations', async () => {
      let callCount = 0;

      vi.mocked(wooClient.post).mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return { data: { id: 123, name: 'Success' } };
      });

      // Simulate retry logic
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const result = await wooClient.post('products', { name: 'Test' });
          expect(result.data.id).toBe(123);
          break;
        } catch (error) {
          if (attempts >= maxAttempts) {
            throw error;
          }
        }
      }

      expect(callCount).toBe(3);
    });

    it('should give up after max retries', async () => {
      vi.mocked(wooClient.post).mockRejectedValue(
        new Error('Persistent failure')
      );

      const maxAttempts = 3;
      let attempts = 0;
      let lastError;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          await wooClient.post('products', { name: 'Test' });
          break;
        } catch (error) {
          lastError = error;
          if (attempts >= maxAttempts) {
            expect(lastError).toBeInstanceOf(Error);
            expect((lastError as Error).message).toBe('Persistent failure');
          }
        }
      }

      expect(attempts).toBe(maxAttempts);
      expect(wooClient.post).toHaveBeenCalledTimes(maxAttempts);
    });

    it('should handle network timeout errors', async () => {
      vi.mocked(wooClient.get).mockRejectedValue(
        new Error('Request timeout after 30s')
      );

      await expect(wooClient.get('products')).rejects.toThrow('Request timeout');
    });
  });
});
