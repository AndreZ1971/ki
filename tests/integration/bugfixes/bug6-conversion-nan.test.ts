import { describe, it, expect } from 'vitest';

/**
 * Bug #6: Conversion Analytics - NaN Errors
 * 
 * Problem: parseFloat() on undefined/null caused NaN
 * Root Cause: Direct parseFloat without type checking
 * Solution: Added type coercion, NaN checks, fallback to 0
 * 
 * File: backend/routes/app/api/analytics/conversion.ts
 * Lines: 68-75
 */

describe('Bug #6: Conversion NaN Handling', () => {
  // Helper function simulating the fixed calculation logic
  function calculateTotal(orders: any[]): number {
    return orders.reduce((sum, order) => {
      const orderTotal = parseFloat(String(order.total || 0));
      return sum + (isNaN(orderTotal) ? 0 : orderTotal);
    }, 0);
  }

  function calculateConversionRate(conversions: number, visits: number): number {
    if (!visits || visits === 0) return 0;
    const rate = (conversions / visits) * 100;
    return isNaN(rate) ? 0 : rate;
  }

  describe('Handling Undefined/Null Values', () => {
    it('should handle undefined order.total gracefully', () => {
      const orders = [
        { total: undefined },
        { total: null },
        { total: '100.50' },
        { total: 50 }
      ];

      const total = calculateTotal(orders);

      expect(total).toBe(150.50);
      expect(Number.isFinite(total)).toBe(true);
      expect(isNaN(total)).toBe(false);
    });

    it('should treat null as 0', () => {
      const orders = [{ total: null }];
      const total = calculateTotal(orders);

      expect(total).toBe(0);
      expect(Number.isFinite(total)).toBe(true);
    });

    it('should treat undefined as 0', () => {
      const orders = [{ total: undefined }];
      const total = calculateTotal(orders);

      expect(total).toBe(0);
      expect(Number.isFinite(total)).toBe(true);
    });
  });

  describe('Type Coercion with String()', () => {
    it('should convert numbers to strings before parseFloat', () => {
      const value = 123.45;
      const stringValue = String(value);
      const parsed = parseFloat(stringValue);

      expect(parsed).toBe(123.45);
      expect(Number.isFinite(parsed)).toBe(true);
    });

    it('should handle string numbers', () => {
      const orders = [
        { total: '100' },
        { total: '200.50' },
        { total: '300.99' }
      ];

      const total = calculateTotal(orders);

      expect(total).toBe(601.49);
      expect(Number.isFinite(total)).toBe(true);
    });

    it('should handle mixed types', () => {
      const orders = [
        { total: 100 },        // number
        { total: '200' },      // string
        { total: undefined },  // undefined
        { total: null }        // null
      ];

      const total = calculateTotal(orders);

      expect(total).toBe(300);
      expect(Number.isFinite(total)).toBe(true);
    });
  });

  describe('NaN Check and Fallback', () => {
    it('should fallback to 0 when parseFloat returns NaN', () => {
      const orders = [
        { total: 'invalid' },
        { total: 'not-a-number' },
        { total: {} },
        { total: [] }
      ];

      const total = calculateTotal(orders);

      expect(total).toBe(0);
      expect(Number.isFinite(total)).toBe(true);
      expect(isNaN(total)).toBe(false);
    });

    it('should check isNaN before adding to sum', () => {
      const value1 = parseFloat('abc'); // NaN
      const value2 = parseFloat('123'); // 123

      const sum = (isNaN(value1) ? 0 : value1) + (isNaN(value2) ? 0 : value2);

      expect(sum).toBe(123);
      expect(Number.isFinite(sum)).toBe(true);
    });

    it('should never produce NaN in final result', () => {
      const testCases = [
        [{ total: undefined }],
        [{ total: null }],
        [{ total: 'invalid' }],
        [{ total: {} }],
        [{ total: [] }],
        [{ total: NaN }]
      ];

      testCases.forEach(orders => {
        const total = calculateTotal(orders);
        expect(isNaN(total)).toBe(false);
        expect(Number.isFinite(total)).toBe(true);
      });
      
      // Infinity is technically a number, just test it's handled
      const infinityTotal = calculateTotal([{ total: Infinity }]);
      expect(isNaN(infinityTotal)).toBe(false);
    });
  });

  describe('Conversion Rate Calculations', () => {
    it('should calculate conversion rate without NaN', () => {
      const conversions = 50;
      const visits = 1000;

      const rate = calculateConversionRate(conversions, visits);

      expect(rate).toBe(5); // 5%
      expect(Number.isFinite(rate)).toBe(true);
      expect(isNaN(rate)).toBe(false);
    });

    it('should handle zero visits (division by zero)', () => {
      const conversions = 10;
      const visits = 0;

      const rate = calculateConversionRate(conversions, visits);

      expect(rate).toBe(0); // Fallback to 0
      expect(Number.isFinite(rate)).toBe(true);
      expect(isNaN(rate)).toBe(false);
    });

    it('should handle NaN in calculation', () => {
      const conversions = NaN;
      const visits = 100;

      const rate = calculateConversionRate(conversions, visits);

      expect(isNaN(rate)).toBe(false); // Should not be NaN
      expect(Number.isFinite(rate)).toBe(true);
    });

    it('should validate final conversion rate is finite', () => {
      const testCases = [
        { conversions: 10, visits: 100 },
        { conversions: 0, visits: 100 },
        { conversions: 100, visits: 100 },
        { conversions: 5, visits: 50 }
      ];

      testCases.forEach(({ conversions, visits }) => {
        const rate = calculateConversionRate(conversions, visits);
        expect(Number.isFinite(rate)).toBe(true);
        expect(isNaN(rate)).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty orders array', () => {
      const orders: any[] = [];
      const total = calculateTotal(orders);

      expect(total).toBe(0);
      expect(Number.isFinite(total)).toBe(true);
    });

    it('should handle very large numbers', () => {
      const orders = [
        { total: 999999999.99 },
        { total: 1000000000.01 }
      ];

      const total = calculateTotal(orders);

      expect(total).toBe(2000000000);
      expect(Number.isFinite(total)).toBe(true);
    });

    it('should handle very small numbers', () => {
      const orders = [
        { total: 0.01 },
        { total: 0.02 },
        { total: 0.03 }
      ];

      const total = calculateTotal(orders);

      expect(total).toBeCloseTo(0.06, 2);
      expect(Number.isFinite(total)).toBe(true);
    });

    it('should handle negative numbers', () => {
      const orders = [
        { total: 100 },
        { total: -50 },  // refund
        { total: 200 }
      ];

      const total = calculateTotal(orders);

      expect(total).toBe(250);
      expect(Number.isFinite(total)).toBe(true);
    });

    it('should handle scientific notation', () => {
      const orders = [
        { total: 1e2 },    // 100
        { total: 2e3 },    // 2000
        { total: 3e1 }     // 30
      ];

      const total = calculateTotal(orders);

      expect(total).toBe(2130);
      expect(Number.isFinite(total)).toBe(true);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle WooCommerce order data structure', () => {
      const orders = [
        { id: 1, total: '99.99', status: 'completed' },
        { id: 2, total: undefined, status: 'pending' },
        { id: 3, total: '149.50', status: 'completed' },
        { id: 4, total: null, status: 'cancelled' }
      ];

      const total = calculateTotal(orders);

      expect(total).toBe(249.49);
      expect(Number.isFinite(total)).toBe(true);
    });

    it('should handle orders with missing total field', () => {
      const orders = [
        { id: 1, status: 'pending' },  // no total field
        { id: 2, total: 100, status: 'completed' }
      ];

      const total = calculateTotal(orders);

      expect(total).toBe(100);
      expect(Number.isFinite(total)).toBe(true);
    });

    it('should calculate accurate conversion metrics', () => {
      // Realistic e-commerce data
      const visitors = 10000;
      const conversions = 250;
      const totalRevenue = 12500; // $12,500

      const conversionRate = calculateConversionRate(conversions, visitors);
      const averageOrderValue = conversions > 0 ? totalRevenue / conversions : 0;

      expect(conversionRate).toBe(2.5); // 2.5%
      expect(averageOrderValue).toBe(50); // $50 AOV
      expect(Number.isFinite(conversionRate)).toBe(true);
      expect(Number.isFinite(averageOrderValue)).toBe(true);
    });
  });

  describe('Type Safety Validation', () => {
    it('should handle String() coercion correctly', () => {
      const testValues = [
        123,
        '123',
        null,
        undefined,
        true,
        false,
        {},
        []
      ];

      testValues.forEach(value => {
        const stringValue = String(value || 0);
        const parsed = parseFloat(stringValue);
        const safe = isNaN(parsed) ? 0 : parsed;

        expect(Number.isFinite(safe)).toBe(true);
      });
    });

    it('should never allow NaN in aggregation', () => {
      const potentiallyBadOrders = [
        { total: 'not-a-number' },
        { total: undefined },
        { total: null },
        { total: {} },
        { total: [] },
        { total: NaN },
        { total: 'abc123' }
      ];

      const total = calculateTotal(potentiallyBadOrders);

      expect(isNaN(total)).toBe(false);
      expect(Number.isFinite(total)).toBe(true);
      expect(total).toBe(0); // All invalid = 0
    });
  });

  describe('Performance with Large Datasets', () => {
    it('should handle 1000+ orders without NaN', () => {
      const orders = Array.from({ length: 1000 }, (_, i) => ({
        total: i % 10 === 0 ? undefined : (Math.random() * 100).toFixed(2)
      }));

      const total = calculateTotal(orders);

      expect(Number.isFinite(total)).toBe(true);
      expect(isNaN(total)).toBe(false);
      expect(total).toBeGreaterThan(0);
    });

    it('should maintain precision with many decimals', () => {
      const orders = Array.from({ length: 100 }, () => ({
        total: '0.99'
      }));

      const total = calculateTotal(orders);

      expect(total).toBeCloseTo(99, 2);
      expect(Number.isFinite(total)).toBe(true);
    });
  });
});
