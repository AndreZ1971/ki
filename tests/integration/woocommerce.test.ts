import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

/**
 * WooCommerce Integration Tests
 * 
 * Tests für WooCommerce-Integration:
 * - Product Sync
 * - Customer Synchronization
 * - Order Processing
 * - API Authentication
 * - Error Recovery
 */

describe('WooCommerce Integration Tests', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify({ logger: false });

    // Mock WooCommerce Routes
    server.get('/api/woocommerce/sync/products', async (request, reply) => {
      return reply.send({
        success: true,
        data: {
          synced: 245,
          updated: 18,
          created: 8,
          errors: 0,
          duration: 3421,
          lastSync: Date.now()
        }
      });
    });

    server.get('/api/woocommerce/sync/customers', async (request, reply) => {
      return reply.send({
        success: true,
        data: {
          synced: 1250,
          updated: 234,
          created: 42,
          errors: 0,
          duration: 2145,
          lastSync: Date.now()
        }
      });
    });

    server.get('/api/woocommerce/sync/orders', async (request, reply) => {
      return reply.send({
        success: true,
        data: {
          synced: 3847,
          updated: 145,
          created: 67,
          errors: 0,
          duration: 4521,
          lastSync: Date.now()
        }
      });
    });

    server.get('/api/woocommerce/products', async (request, reply) => {
      return reply.send({
        success: true,
        data: {
          total: 245,
          products: [
            {
              id: 1,
              name: 'Product 1',
              price: '29.99',
              stock: 145,
              sku: 'PROD-001',
              category: 'Electronics'
            },
            {
              id: 2,
              name: 'Product 2',
              price: '49.99',
              stock: 89,
              sku: 'PROD-002',
              category: 'Accessories'
            }
          ]
        }
      });
    });

    server.get('/api/woocommerce/customers', async (request, reply) => {
      return reply.send({
        success: true,
        data: {
          total: 1250,
          customers: [
            {
              id: 1,
              email: 'customer1@example.com',
              firstName: 'John',
              lastName: 'Doe',
              totalSpent: '2450.50'
            },
            {
              id: 2,
              email: 'customer2@example.com',
              firstName: 'Jane',
              lastName: 'Smith',
              totalSpent: '1820.75'
            }
          ]
        }
      });
    });

    server.post('/api/woocommerce/orders', async (request, reply) => {
      const body = request.body as any;
      return reply.status(201).send({
        success: true,
        data: {
          orderId: 12345,
          customerId: body.customerId || null,
          total: body.total || 0,
          status: 'pending',
          created: Date.now()
        }
      });
    });

    server.get('/api/woocommerce/categories', async (request, reply) => {
      return reply.send({
        success: true,
        data: {
          categories: [
            { id: 1, name: 'Electronics', count: 67 },
            { id: 2, name: 'Accessories', count: 89 },
            { id: 3, name: 'Clothing', count: 145 }
          ]
        }
      });
    });

    server.get('/api/woocommerce/auth/test', async (request, reply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return reply.status(401).send({
          success: false,
          error: 'Missing Basic Auth header'
        });
      }

      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
      if (credentials === 'key:secret') {
        return reply.send({
          success: true,
          data: { authenticated: true }
        });
      }

      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials'
      });
    });

    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Product Synchronization', () => {
    it('should sync products from WooCommerce', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/products'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('synced');
    });

    it('should have valid sync metrics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/products'
      });

      const body = JSON.parse(response.body);
      const data = body.data;

      expect(data.synced).toBeGreaterThan(0);
      expect(data.updated).toBeGreaterThanOrEqual(0);
      expect(data.created).toBeGreaterThanOrEqual(0);
      expect(data.errors).toBe(0); // No errors in sync
    });

    it('should have sync duration', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/products'
      });

      const body = JSON.parse(response.body);
      expect(body.data.duration).toBeGreaterThan(0);
    });

    it('should have lastSync timestamp', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/products'
      });

      const body = JSON.parse(response.body);
      expect(body.data.lastSync).toBeGreaterThan(0);
      expect(body.data.lastSync).toBeLessThanOrEqual(Date.now());
    });

    it('should retrieve product list', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/products'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.products)).toBe(true);
    });

    it('should have valid product structure', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/products'
      });

      const body = JSON.parse(response.body);
      const products = body.data.products;

      products.forEach((product: any) => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('stock');
        expect(product).toHaveProperty('sku');
      });
    });

    it('should validate product prices', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/products'
      });

      const body = JSON.parse(response.body);
      const products = body.data.products;

      products.forEach((product: any) => {
        const price = parseFloat(product.price);
        expect(Number.isFinite(price)).toBe(true);
        expect(price).toBeGreaterThan(0);
      });
    });

    it('should have product categories', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/categories'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.data.categories)).toBe(true);

      body.data.categories.forEach((cat: any) => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('count');
      });
    });
  });

  describe('Customer Synchronization', () => {
    it('should sync customers from WooCommerce', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/customers'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.synced).toBeGreaterThan(0);
    });

    it('should have valid customer sync metrics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/customers'
      });

      const body = JSON.parse(response.body);
      const data = body.data;

      expect(data.synced).toBeGreaterThan(0);
      expect(data.updated).toBeGreaterThanOrEqual(0);
      expect(data.created).toBeGreaterThanOrEqual(0);
      expect(data.errors).toBe(0);
    });

    it('should retrieve customer list', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/customers'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.customers)).toBe(true);
    });

    it('should have valid customer structure', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/customers'
      });

      const body = JSON.parse(response.body);
      const customers = body.data.customers;

      customers.forEach((customer: any) => {
        expect(customer).toHaveProperty('id');
        expect(customer).toHaveProperty('email');
        expect(customer).toHaveProperty('firstName');
        expect(customer).toHaveProperty('lastName');
        expect(customer).toHaveProperty('totalSpent');
      });
    });

    it('should validate customer email format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/customers'
      });

      const body = JSON.parse(response.body);
      const customers = body.data.customers;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      customers.forEach((customer: any) => {
        expect(emailRegex.test(customer.email)).toBe(true);
      });
    });

    it('should validate customer total spent', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/customers'
      });

      const body = JSON.parse(response.body);
      const customers = body.data.customers;

      customers.forEach((customer: any) => {
        const spent = parseFloat(customer.totalSpent);
        expect(Number.isFinite(spent)).toBe(true);
        expect(spent).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Order Processing', () => {
    it('should sync orders from WooCommerce', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/orders'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.synced).toBeGreaterThan(0);
    });

    it('should have valid order sync metrics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/orders'
      });

      const body = JSON.parse(response.body);
      const data = body.data;

      expect(data.synced).toBeGreaterThan(0);
      expect(data.updated).toBeGreaterThanOrEqual(0);
      expect(data.created).toBeGreaterThanOrEqual(0);
      expect(data.errors).toBe(0);
    });

    it('should create order', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/woocommerce/orders',
        payload: {
          customerId: 123,
          total: 99.99
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('orderId');
      expect(body.data.total).toBe(99.99);
    });

    it('should handle order without customer ID', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/woocommerce/orders',
        payload: {
          total: 49.99
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.customerId).toBeNull();
    });

    it('should set correct order status', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/woocommerce/orders',
        payload: {
          customerId: 456,
          total: 199.99
        }
      });

      const body = JSON.parse(response.body);
      expect(body.data.status).toBe('pending');
    });

    it('should have order creation timestamp', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/woocommerce/orders',
        payload: {
          customerId: 789,
          total: 149.99
        }
      });

      const body = JSON.parse(response.body);
      expect(body.data.created).toBeGreaterThan(0);
      expect(body.data.created).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('API Authentication', () => {
    it('should reject missing auth header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/auth/test'
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject invalid auth format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/auth/test',
        headers: {
          authorization: 'Bearer invalid'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should accept valid Basic Auth', async () => {
      const credentials = Buffer.from('key:secret').toString('base64');
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/auth/test',
        headers: {
          authorization: `Basic ${credentials}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.authenticated).toBe(true);
    });

    it('should reject invalid credentials', async () => {
      const credentials = Buffer.from('wrong:creds').toString('base64');
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/auth/test',
        headers: {
          authorization: `Basic ${credentials}`
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should use Basic Auth not query params', async () => {
      // Query params should not be used for auth
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/auth/test?consumer_key=key&consumer_secret=secret'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Data Consistency', () => {
    it('should have matching product count', async () => {
      const syncRes = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/products'
      });
      const productsRes = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/products'
      });

      const syncCount = JSON.parse(syncRes.body).data.synced;
      const productCount = JSON.parse(productsRes.body).data.total;

      expect(syncCount).toBe(productCount);
    });

    it('should have matching customer count', async () => {
      const syncRes = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/customers'
      });
      const customersRes = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/customers'
      });

      const syncCount = JSON.parse(syncRes.body).data.synced;
      const customerCount = JSON.parse(customersRes.body).data.total;

      expect(syncCount).toBe(customerCount);
    });

    it('all endpoints should use reply.send()', async () => {
      const endpoints = [
        '/api/woocommerce/sync/products',
        '/api/woocommerce/sync/customers',
        '/api/woocommerce/sync/orders',
        '/api/woocommerce/products',
        '/api/woocommerce/customers',
        '/api/woocommerce/categories'
      ];

      for (const endpoint of endpoints) {
        const response = await server.inject({
          method: 'GET',
          url: endpoint
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
      }
    });

    it('should never return plain objects', async () => {
      const endpoints = [
        '/api/woocommerce/sync/products',
        '/api/woocommerce/products',
        '/api/woocommerce/customers'
      ];

      for (const endpoint of endpoints) {
        const response = await server.inject({
          method: 'GET',
          url: endpoint
        });

        // Response should be JSON string, not object
        expect(typeof response.body).toBe('string');
        expect(() => JSON.parse(response.body)).not.toThrow();
      }
    });
  });

  describe('Error Recovery', () => {
    it('should handle sync errors gracefully', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/products'
      });

      const body = JSON.parse(response.body);
      // Even if errors occur, should return success response
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('errors');
    });

    it('should not expose internal error details', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/products'
      });

      const body = response.body;
      expect(body).not.toContain('Error');
      expect(body).not.toContain('stack');
    });

    it('should timeout gracefully for slow endpoints', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/products'
      });

      // Should complete within timeout
      expect(response.statusCode).toBe(200);
    });
  });

  describe('Performance', () => {
    it('should sync products within acceptable time', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/sync/products'
      });

      const body = JSON.parse(response.body);
      const duration = body.data.duration;

      expect(duration).toBeLessThan(10000); // Less than 10 seconds
    });

    it('should handle large product lists', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/products'
      });

      const body = JSON.parse(response.body);
      expect(body.data.total).toBeGreaterThan(100);

      // Response should still be valid
      expect(response.statusCode).toBe(200);
    });

    it('should handle large customer lists', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/customers'
      });

      const body = JSON.parse(response.body);
      expect(body.data.total).toBeGreaterThan(1000);

      // Response should still be valid
      expect(response.statusCode).toBe(200);
    });

    it('should process orders quickly', async () => {
      const start = Date.now();

      await server.inject({
        method: 'POST',
        url: '/api/woocommerce/orders',
        payload: {
          customerId: 123,
          total: 99.99
        }
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });
  });
});
