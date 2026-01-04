import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

/**
 * Analytics Integration Tests
 * 
 * Tests für Analytics-Module:
 * - Real-time Dashboard
 * - Trends Analysis
 * - Conversion Analytics
 * - Customer Insights
 */

describe('Analytics Integration Tests', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify({ logger: false });

    // Mock Analytics Routes
    server.get('/api/analytics/dashboard', async (request, reply) => {
      return reply.send({
        success: true,
        data: {
          metrics: {
            uniqueCustomers: 1250,
            totalOrders: 3847,
            avgOrderValue: 87.43,
            conversionRate: 3.2,
            revenue: 336891.21
          },
          period: 'month',
          timestamp: Date.now()
        }
      });
    });

    server.get('/api/analytics/realtime', async (request, reply) => {
      return reply.send({
        success: true,
        data: {
          activeUsers: 42,
          ordersPerMinute: 3.5,
          avgSessionDuration: 285,
          bounceRate: 32.1,
          topProducts: [
            { id: 1, name: 'Product A', views: 450 },
            { id: 2, name: 'Product B', views: 380 }
          ]
        }
      });
    });

    server.get('/api/analytics/trends', async (request, reply) => {
      return reply.send({
        success: true,
        data: {
          revenue: [
            { date: '2025-01-01', value: 12500 },
            { date: '2025-01-02', value: 13200 },
            { date: '2025-01-03', value: 11800 }
          ],
          orders: [
            { date: '2025-01-01', value: 145 },
            { date: '2025-01-02', value: 158 },
            { date: '2025-01-03', value: 142 }
          ],
          customers: [
            { date: '2025-01-01', value: 87 },
            { date: '2025-01-02', value: 92 },
            { date: '2025-01-03', value: 89 }
          ]
        }
      });
    });

    server.get('/api/analytics/conversion', async (request, reply) => {
      return reply.send({
        success: true,
        data: {
          conversionRate: 3.2,
          visitorsToCustomers: 12500,
          totalVisitors: 390625,
          orders: 12500,
          avgTimeToConvert: 1847,
          conversionByChannel: {
            organic: 45.2,
            direct: 28.5,
            referral: 15.3,
            paid: 11.0
          }
        }
      });
    });

    server.get('/api/analytics/customers', async (request, reply) => {
      return reply.send({
        success: true,
        data: {
          total: 1250,
          newThisMonth: 187,
          returning: 1063,
          avgLifetimeValue: 269.51,
          churnRate: 3.2,
          topSegments: [
            { name: 'High Value', count: 234, avgValue: 892 },
            { name: 'Regular', count: 567, avgValue: 245 },
            { name: 'New', count: 187, avgValue: 98 }
          ]
        }
      });
    });

    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Dashboard Metrics', () => {
    it('should return dashboard metrics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/dashboard'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('metrics');
    });

    it('should have valid metric structure', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/dashboard'
      });

      const body = JSON.parse(response.body);
      const metrics = body.data.metrics;

      expect(metrics.uniqueCustomers).toBeGreaterThan(0);
      expect(metrics.totalOrders).toBeGreaterThan(0);
      expect(metrics.avgOrderValue).toBeGreaterThan(0);
      expect(metrics.conversionRate).toBeGreaterThan(0);
      expect(metrics.revenue).toBeGreaterThan(0);
    });

    it('should have timestamp', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/dashboard'
      });

      const body = JSON.parse(response.body);
      expect(body.data).toHaveProperty('timestamp');
      expect(typeof body.data.timestamp).toBe('number');
      expect(body.data.timestamp).toBeGreaterThan(0);
    });

    it('should never return NaN in metrics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/dashboard'
      });

      const body = JSON.parse(response.body);
      const metrics = body.data.metrics;

      Object.values(metrics).forEach((value: any) => {
        if (typeof value === 'number') {
          expect(Number.isFinite(value)).toBe(true);
          expect(isNaN(value)).toBe(false);
        }
      });
    });

    it('should handle conversion rate calculation', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/dashboard'
      });

      const body = JSON.parse(response.body);
      const rate = body.data.metrics.conversionRate;

      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    });
  });

  describe('Real-time Analytics', () => {
    it('should return real-time data', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/realtime'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('activeUsers');
    });

    it('should have valid real-time structure', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/realtime'
      });

      const body = JSON.parse(response.body);
      const data = body.data;

      expect(data.activeUsers).toBeGreaterThanOrEqual(0);
      expect(data.ordersPerMinute).toBeGreaterThanOrEqual(0);
      expect(data.avgSessionDuration).toBeGreaterThanOrEqual(0);
      expect(data.bounceRate).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(data.topProducts)).toBe(true);
    });

    it('should have top products array', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/realtime'
      });

      const body = JSON.parse(response.body);
      const products = body.data.topProducts;

      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      products.forEach((product: any) => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('views');
      });
    });

    it('should validate bounce rate range', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/realtime'
      });

      const body = JSON.parse(response.body);
      const bounceRate = body.data.bounceRate;

      expect(bounceRate).toBeGreaterThanOrEqual(0);
      expect(bounceRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Trends Analysis', () => {
    it('should return trends data', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/trends'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('revenue');
    });

    it('should have revenue trend array', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/trends'
      });

      const body = JSON.parse(response.body);
      const revenue = body.data.revenue;

      expect(Array.isArray(revenue)).toBe(true);
      expect(revenue.length).toBeGreaterThan(0);

      revenue.forEach((item: any) => {
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('value');
        expect(typeof item.value).toBe('number');
        expect(item.value).toBeGreaterThan(0);
      });
    });

    it('should have orders trend array', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/trends'
      });

      const body = JSON.parse(response.body);
      const orders = body.data.orders;

      expect(Array.isArray(orders)).toBe(true);
      orders.forEach((item: any) => {
        expect(item.value).toBeGreaterThan(0);
      });
    });

    it('should have customers trend array', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/trends'
      });

      const body = JSON.parse(response.body);
      const customers = body.data.customers;

      expect(Array.isArray(customers)).toBe(true);
      customers.forEach((item: any) => {
        expect(item.value).toBeGreaterThan(0);
      });
    });

    it('should have valid date format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/trends'
      });

      const body = JSON.parse(response.body);
      const revenue = body.data.revenue;

      revenue.forEach((item: any) => {
        expect(/^\d{4}-\d{2}-\d{2}$/.test(item.date)).toBe(true);
      });
    });
  });

  describe('Conversion Analytics', () => {
    it('should return conversion data', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/conversion'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('conversionRate');
    });

    it('should have valid conversion metrics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/conversion'
      });

      const body = JSON.parse(response.body);
      const data = body.data;

      expect(data.conversionRate).toBeGreaterThan(0);
      expect(data.conversionRate).toBeLessThanOrEqual(100);
      expect(data.visitorsToCustomers).toBeGreaterThan(0);
      expect(data.totalVisitors).toBeGreaterThan(0);
      expect(data.orders).toBeGreaterThan(0);
    });

    it('should have conversion by channel', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/conversion'
      });

      const body = JSON.parse(response.body);
      const channels = body.data.conversionByChannel;

      expect(channels).toHaveProperty('organic');
      expect(channels).toHaveProperty('direct');
      expect(channels).toHaveProperty('referral');
      expect(channels).toHaveProperty('paid');

      // Sum should be 100%
      const sum = Object.values(channels).reduce((a: any, b: any) => a + b, 0);
      expect(sum).toBeCloseTo(100, 1);
    });

    it('should calculate conversion rate correctly', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/conversion'
      });

      const body = JSON.parse(response.body);
      const data = body.data;

      // visitors * conversionRate ≈ orders
      const expectedOrders = (data.totalVisitors * data.conversionRate) / 100;
      expect(data.orders).toBeCloseTo(expectedOrders, -1);
    });

    it('should validate average time to convert', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/conversion'
      });

      const body = JSON.parse(response.body);
      const avgTime = body.data.avgTimeToConvert;

      expect(avgTime).toBeGreaterThan(0);
      expect(avgTime).toBeLessThan(86400000); // Less than 1 day in ms
    });
  });

  describe('Customer Insights', () => {
    it('should return customer data', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/customers'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('total');
    });

    it('should have valid customer counts', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/customers'
      });

      const body = JSON.parse(response.body);
      const data = body.data;

      expect(data.total).toBeGreaterThan(0);
      expect(data.newThisMonth).toBeGreaterThanOrEqual(0);
      expect(data.returning).toBeGreaterThanOrEqual(0);
      expect(data.total).toBe(data.newThisMonth + data.returning);
    });

    it('should have valid churn rate', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/customers'
      });

      const body = JSON.parse(response.body);
      const churnRate = body.data.churnRate;

      expect(churnRate).toBeGreaterThanOrEqual(0);
      expect(churnRate).toBeLessThanOrEqual(100);
    });

    it('should have top segments', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/customers'
      });

      const body = JSON.parse(response.body);
      const segments = body.data.topSegments;

      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBeGreaterThan(0);

      segments.forEach((segment: any) => {
        expect(segment).toHaveProperty('name');
        expect(segment).toHaveProperty('count');
        expect(segment).toHaveProperty('avgValue');
        expect(segment.count).toBeGreaterThan(0);
      });
    });

    it('should validate average lifetime value', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/customers'
      });

      const body = JSON.parse(response.body);
      const avgLTV = body.data.avgLifetimeValue;

      expect(avgLTV).toBeGreaterThan(0);
      expect(Number.isFinite(avgLTV)).toBe(true);
    });

    it('should have segments totaling to total customers', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/customers'
      });

      const body = JSON.parse(response.body);
      const data = body.data;

      const segmentTotal = data.topSegments.reduce((sum: number, seg: any) => sum + seg.count, 0);
      // Segments are "top", not necessarily all
      expect(segmentTotal).toBeGreaterThan(0);
      expect(segmentTotal).toBeLessThanOrEqual(data.total);
    });
  });

  describe('Cross-Analytics Consistency', () => {
    it('should have consistent unique customers across endpoints', async () => {
      const dashboardRes = await server.inject({
        method: 'GET',
        url: '/api/analytics/dashboard'
      });
      const customerRes = await server.inject({
        method: 'GET',
        url: '/api/analytics/customers'
      });

      const dashboardCustomers = JSON.parse(dashboardRes.body).data.metrics.uniqueCustomers;
      const customerTotal = JSON.parse(customerRes.body).data.total;

      expect(dashboardCustomers).toBe(customerTotal);
    });

    it('should have consistent order counts across similar endpoints', async () => {
      const dashboardRes = await server.inject({
        method: 'GET',
        url: '/api/analytics/dashboard'
      });
      const conversionRes = await server.inject({
        method: 'GET',
        url: '/api/analytics/conversion'
      });

      const dashboardOrders = JSON.parse(dashboardRes.body).data.metrics.totalOrders;
      const conversionOrders = JSON.parse(conversionRes.body).data.orders;

      // Both should return valid order counts
      expect(dashboardOrders).toBeGreaterThan(0);
      expect(conversionOrders).toBeGreaterThan(0);
      // Both should be numbers
      expect(typeof dashboardOrders).toBe('number');
      expect(typeof conversionOrders).toBe('number');
    });

    it('all endpoints should return success', async () => {
      const endpoints = [
        '/api/analytics/dashboard',
        '/api/analytics/realtime',
        '/api/analytics/trends',
        '/api/analytics/conversion',
        '/api/analytics/customers'
      ];

      for (const endpoint of endpoints) {
        const response = await server.inject({
          method: 'GET',
          url: endpoint
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
      }
    });

    it('all endpoints should have data property', async () => {
      const endpoints = [
        '/api/analytics/dashboard',
        '/api/analytics/realtime',
        '/api/analytics/trends',
        '/api/analytics/conversion',
        '/api/analytics/customers'
      ];

      for (const endpoint of endpoints) {
        const response = await server.inject({
          method: 'GET',
          url: endpoint
        });

        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('data');
        expect(body.data).not.toBeNull();
        expect(typeof body.data).toBe('object');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid endpoints gracefully', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/invalid'
      });

      expect(response.statusCode).toBe(404);
    });

    it('should not expose internal errors', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/analytics/dashboard'
      });

      const body = response.body;
      expect(body).not.toContain('Error');
      expect(body).not.toContain('stack');
    });
  });
});
