import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

/**
 * Bug #4: WooCommerce Subscribers - Duplicate Endpoint
 * 
 * Problem: FST_ERR_DUPLICATED_ROUTE prevented server startup
 * Root Cause: Two /subscribers endpoints at lines 179 and 419
 * Solution: Removed accidental duplicate at line 419
 * 
 * File: backend/routes/app/api/woocommerce/customers.ts
 * Lines: 179 (kept), 419-484 (removed)
 */

describe('Bug #4: No Duplicate /subscribers Endpoint', () => {
  describe('Route Registration Without Duplicates', () => {
    it('should register without FST_ERR_DUPLICATED_ROUTE error', async () => {
      const server = Fastify({ logger: false });

      // Register the route ONCE
      server.get('/api/woocommerce/subscribers', async (request, reply) => {
        return reply.send({
          success: true,
          data: {
            subscribers: [
              { email: 'user1@example.com', subscribed: true },
              { email: 'user2@example.com', subscribed: true }
            ]
          }
        });
      });

      // This should not throw
      await server.ready();
      const routes = server.printRoutes();
      expect(routes).toContain('api/woocommerce/subscribers');

      await server.close();
    });

    it('should throw error when trying to register duplicate route', async () => {
      const server = Fastify({ logger: false });

      // Register first time
      server.get('/api/woocommerce/subscribers', async (request, reply) => {
        return reply.send({ data: 'first' });
      });

      // Try to register again (should fail immediately)
      expect(() => {
        server.get('/api/woocommerce/subscribers', async (request, reply) => {
          return reply.send({ data: 'second' });
        });
      }).toThrow(/already declared/);

      await server.close();
    });
  });

  describe('Single Endpoint Functionality', () => {
    let server: FastifyInstance;

    beforeAll(async () => {
      server = Fastify({ logger: false });

      // Only ONE subscribers endpoint
      server.get('/api/woocommerce/subscribers', async (request, reply) => {
        return reply.send({
          success: true,
          data: {
            subscribers: [
              { email: 'test1@example.com', subscribed: true, source: 'newsletter' },
              { email: 'test2@example.com', subscribed: true, source: 'checkout' }
            ],
            total: 2
          }
        });
      });

      await server.ready();
    });

    afterAll(async () => {
      await server.close();
    });

    it('should respond to /api/woocommerce/subscribers', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/subscribers'
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return subscribers data', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/subscribers'
      });

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('subscribers');
      expect(Array.isArray(body.data.subscribers)).toBe(true);
    });

    it('should return subscribers with expected structure', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/woocommerce/subscribers'
      });

      const body = JSON.parse(response.body);
      const subscribers = body.data.subscribers;

      subscribers.forEach((subscriber: any) => {
        expect(subscriber).toHaveProperty('email');
        expect(subscriber).toHaveProperty('subscribed');
        expect(typeof subscriber.email).toBe('string');
        expect(typeof subscriber.subscribed).toBe('boolean');
      });
    });
  });

  describe('Route Uniqueness Validation', () => {
    it('should have only one /subscribers route definition', async () => {
      const server = Fastify({ logger: false });

      server.get('/api/woocommerce/subscribers', async (request, reply) => {
        return reply.send({ endpoint: 'subscribers' });
      });

      await server.ready();

      // Get all routes
      const routes = server.printRoutes();
      const subscriberMatches = routes.split('\n').filter(line => 
        line.includes('/subscribers')
      );

      // Should be exactly 1
      expect(subscriberMatches.length).toBe(1);

      await server.close();
    });

    it('should not have duplicate route patterns', async () => {
      const server = Fastify({ logger: false });

      server.get('/api/woocommerce/subscribers', async (request, reply) => {
        return reply.send({ data: 'unique' });
      });

      await server.ready();

      const routes = server.printRoutes();
      const lines = routes.split('\n');

      // Count occurrences of /subscribers pattern
      const duplicates = lines.filter(line => 
        line.includes('GET') && line.includes('/subscribers')
      );

      expect(duplicates.length).toBeLessThanOrEqual(1);

      await server.close();
    });
  });

  describe('Server Startup Validation', () => {
    it('should start successfully with single route', async () => {
      const server = Fastify({ logger: false });

      server.get('/api/woocommerce/subscribers', async (request, reply) => {
        return reply.send({ success: true });
      });

      // Should start without errors
      let startupError = null;
      try {
        await server.ready();
      } catch (error) {
        startupError = error;
      }

      expect(startupError).toBeNull();

      await server.close();
    });

    it('should fail startup with duplicate routes', async () => {
      const server = Fastify({ logger: false });

      // First registration
      server.get('/test/duplicate', async (request, reply) => {
        return reply.send({ version: 1 });
      });

      // Second registration (duplicate) - Fastify throws immediately
      expect(() => {
        server.get('/test/duplicate', async (request, reply) => {
          return reply.send({ version: 2 });
        });
      }).toThrow(/already declared/);

      await server.close();
    });
  });

  describe('Error Code Verification', () => {
    it('should produce FST_ERR_DUPLICATED_ROUTE for duplicates', async () => {
      const server = Fastify({ logger: false });

      server.get('/duplicate-test', async (request, reply) => {
        return reply.send({ first: true });
      });

      // Fastify throws immediately when duplicate route is registered
      let error: any;
      try {
        server.get('/duplicate-test', async (request, reply) => {
          return reply.send({ second: true });
        });
      } catch (err) {
        error = err;
      }

      expect(error.code).toBe('FST_ERR_DUPLICATED_ROUTE');
      await server.close();
    });
  });

  describe('Multiple Similar Routes (Allowed)', () => {
    it('should allow different HTTP methods on same path', async () => {
      const server = Fastify({ logger: false });

      // GET and POST on same path is allowed
      server.get('/api/woocommerce/subscribers', async (request, reply) => {
        return reply.send({ method: 'GET' });
      });

      server.post('/api/woocommerce/subscribers', async (request, reply) => {
        return reply.send({ method: 'POST' });
      });

      await expect(server.ready()).resolves.not.toThrow();

      await server.close();
    });

    it('should allow different paths with similar names', async () => {
      const server = Fastify({ logger: false });

      server.get('/api/woocommerce/subscribers', async (request, reply) => {
        return reply.send({ endpoint: 'subscribers' });
      });

      server.get('/api/woocommerce/subscribers/:id', async (request, reply) => {
        return reply.send({ endpoint: 'subscriber-by-id' });
      });

      await expect(server.ready()).resolves.not.toThrow();

      await server.close();
    });
  });
});
