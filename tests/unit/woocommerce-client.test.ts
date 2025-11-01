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

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      await expect(client.get('products')).rejects.toThrow('Network failure');
    });
  });

  describe('POST Requests', () => {
    it('should perform successful POST request', async () => {
      const postData = { name: 'New Product', price: '29.99' };
      const mockResponse = { id: 123, ...postData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.post('products', postData);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('products'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });

    it('should include data in POST body', async () => {
      const postData = { name: 'Test', status: 'publish' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      await client.post('products', postData);

      const call = mockFetch.mock.calls[0];
      expect(call[1].method).toBe('POST');
      expect(call[1].body).toBe(JSON.stringify(postData));
    });

    it('should handle POST error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(client.post('products', {})).rejects.toThrow(
        'WooCommerce API Error: 400 Bad Request'
      );
    });
  });

  describe('PUT Requests', () => {
    it('should perform successful PUT request', async () => {
      const updateData = { name: 'Updated Product' };
      const mockResponse = { id: 1, ...updateData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.put('products/1', updateData);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('products/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should handle PUT errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      await expect(client.put('products/1', {})).rejects.toThrow();
    });
  });

  describe('DELETE Requests', () => {
    it('should perform successful DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, deleted: true }),
      });

      const result = await client.delete('products/1');

      expect(result).toEqual({ id: 1, deleted: true });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('products/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle DELETE errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(client.delete('products/999')).rejects.toThrow();
    });
  });

  describe('Error Status Codes', () => {
    it('should attach status code to errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      try {
        await client.get('products');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
        expect(error.message).toContain('401');
      }
    });

    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(client.get('products')).rejects.toThrow(
        'WooCommerce API Error: 500'
      );
    });

    it('should handle 429 rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(client.get('products')).rejects.toThrow();
    });
  });

  describe('JSON Response Parsing', () => {
    it('should parse valid JSON response', async () => {
      const data = { complex: { nested: { data: 'value' } } };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => data,
      });

      const result = await client.get('test');
      expect(result).toEqual(data);
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await client.get('test');
      expect(result).toEqual({});
    });

    it('should handle array responses', async () => {
      const data = [{ id: 1 }, { id: 2 }];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => data,
      });

      const result = await client.get('products');
      expect(result).toEqual(data);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Request Abort', () => {
    it('should handle AbortError as timeout', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(client.get('products')).rejects.toThrow();
    });

    it('should handle successful quick response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await client.get('products');
      expect(result).toEqual({ success: true });
    });
  });
});
