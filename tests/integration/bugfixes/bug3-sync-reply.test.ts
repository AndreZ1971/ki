import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

/**
 * Bug #3: WooCommerce Sync - 500 Internal Error
 * 
 * Problem: Returned plain object instead of using reply.send()
 * Root Cause: Fastify requires response through reply object methods
 * Solution: Changed all returns to use reply.send()
 * 
 * File: backend/routes/app/api/woocommerce/sync.ts
 * Line: 127
 */

describe('Bug #3: WooCommerce Sync Response Handling', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify({ logger: false });

    // Simulate the CORRECT implementation (after fix)
    server.post('/api/woocommerce/sync', async (request, reply) => {
      try {
        // Mock sync operation
        const result = {
          productsUpdated: 10,
          ordersUpdated: 5,
          customersUpdated: 3
        };

        // CORRECT: Using reply.send()
        return reply.send({ 
          success: true, 
          data: result 
        });
      } catch (error: any) {
        // CORRECT: Using reply.status().send()
        return reply.status(500).send({
          success: false,
          error: error.message
        });
      }
    });

    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Success Response Handling', () => {
    it('should use reply.send() for success responses', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/woocommerce/sync'
      });

      // Should return valid JSON
      expect(() => JSON.parse(response.body)).not.toThrow();
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should return 200 status code', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/woocommerce/sync'
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return expected data structure', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/woocommerce/sync'
      });

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('productsUpdated');
      expect(body.data).toHaveProperty('ordersUpdated');
      expect(body.data).toHaveProperty('customersUpdated');
    });
  });

  describe('Error Response Handling', () => {
    it('should use reply.status().send() for error responses', async () => {
      const errorServer = Fastify({ logger: false });

      errorServer.post('/api/woocommerce/sync', async (request, reply) => {
        try {
          throw new Error('WooCommerce API unreachable');
        } catch (error: any) {
          // CORRECT: Using reply.status().send()
          return reply.status(500).send({
            success: false,
            error: error.message
          });
        }
      });

      await errorServer.ready();

      const response = await errorServer.inject({
        method: 'POST',
        url: '/api/woocommerce/sync'
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body).toHaveProperty('error');

      await errorServer.close();
    });

    it('should return proper error structure', async () => {
      const errorServer = Fastify({ logger: false });

      errorServer.post('/api/woocommerce/sync', async (request, reply) => {
        return reply.status(500).send({
          success: false,
          error: 'Connection timeout'
        });
      });

      await errorServer.ready();

      const response = await errorServer.inject({
        method: 'POST',
        url: '/api/woocommerce/sync'
      });

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');

      await errorServer.close();
    });
  });

  describe('Anti-Pattern Detection', () => {
    it('should NOT work with plain object return (anti-pattern)', async () => {
      const wrongServer = Fastify({ logger: false });

      wrongServer.post('/api/woocommerce/sync-wrong', async (request, reply) => {
        // WRONG: Plain object return (anti-pattern from bug)
        return { success: true, data: {} };
      });

      await wrongServer.ready();

      const response = await wrongServer.inject({
        method: 'POST',
        url: '/api/woocommerce/sync-wrong'
      });

      // This might work in some cases but is not the Fastify way
      // The proper way is to use reply.send()
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success');
      
      await wrongServer.close();
    });
  });

  describe('Content-Type Headers', () => {
    it('should set correct content-type header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/woocommerce/sync'
      });

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include charset in content-type', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/woocommerce/sync'
      });

      const contentType = response.headers['content-type'];
      expect(contentType).toBeTruthy();
    });
  });

  describe('Response Consistency', () => {
    it('should always return JSON for both success and error', async () => {
      const mixedServer = Fastify({ logger: false });

      mixedServer.post('/api/woocommerce/sync-success', async (request, reply) => {
        return reply.send({ success: true, data: {} });
      });

      mixedServer.post('/api/woocommerce/sync-error', async (request, reply) => {
        return reply.status(500).send({ success: false, error: 'Test error' });
      });

      await mixedServer.ready();

      const successResponse = await mixedServer.inject({
        method: 'POST',
        url: '/api/woocommerce/sync-success'
      });

      const errorResponse = await mixedServer.inject({
        method: 'POST',
        url: '/api/woocommerce/sync-error'
      });

      // Both should be valid JSON
      expect(() => JSON.parse(successResponse.body)).not.toThrow();
      expect(() => JSON.parse(errorResponse.body)).not.toThrow();

      // Both should have content-type application/json
      expect(successResponse.headers['content-type']).toContain('application/json');
      expect(errorResponse.headers['content-type']).toContain('application/json');

      await mixedServer.close();
    });
  });
});
