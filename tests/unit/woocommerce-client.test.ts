import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WooCommerceClient } from '../../backend/woocommerce/client';

// Mock fetch globally
global.fetch = vi.fn();

// Mock error-handling modules
vi.mock('../../backend/error-handling/index.js', () => ({
  wooCommerceBreaker: {
    execute: vi.fn((fn) => fn()),
  },
  standardRetry: {
    execute: vi.fn((fn) => fn()),
  },
  alertError: vi.fn(),
}));

// Mock config
vi.mock('../../backend/woocommerce/config.js', () => ({
  getWooConfig: vi.fn(() => ({
    url: 'https://test-shop.com',
    version: 'wc/v3',
    consumerKey: 'test_key',
    consumerSecret: 'test_secret',
    authMode: 'basic',
    timeout: 10000,
  })),
  WooCommerceConfig: {},
}));

describe('WooCommerceClient', () => {
  let client: WooCommerceClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockClear();
    client = new WooCommerceClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('URL Building', () => {
    it('should build correct URL with basic auth', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      await client.get('products');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-shop.com/wp-json/wc/v3/products',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Basic'),
          }),
        })
      );
    });

    it('should include endpoint path correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      await client.get('products/123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-shop.com/wp-json/wc/v3/products/123',
        expect.any(Object)
      );
    });
  });

  describe('Headers', () => {
    it('should include basic auth header when authMode is basic', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.get('products');

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers;
      
      expect(headers['Authorization']).toContain('Basic');
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['User-Agent']).toBe('AI-Agent/1.0');
    });

    it('should set correct content type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.get('products');

      const call = mockFetch.mock.calls[0];
      expect(call[1].headers['Content-Type']).toBe('application/json');
    });
  });

  describe('GET Requests', () => {
    it('should perform successful GET request', async () => {
      const mockData = { id: 1, name: 'Test Product' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await client.get('products/1');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(client.get('products/999')).rejects.toThrow(
        'WooCommerce API Error: 404 Not Found'
      );
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          setTimeout(() => reject(error), 50);
        })
      );

      await expect(client.get('products')).rejects.toThrow();
    });

    it('should 