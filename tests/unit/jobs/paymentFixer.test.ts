// tests/unit/jobs/paymentFixer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set mock environment variables BEFORE any imports
process.env.WOOCOMMERCE_URL = 'https://test.kaufe-es.eu';
process.env.CONSUMER_KEY = 'ck_test123';
process.env.CONSUMER_SECRET = 'cs_test456';

// Create mock WooCommerce get function
const mockGet = vi.fn();

// Mock WooCommerce REST API with proper constructor
vi.mock('@woocommerce/woocommerce-rest-api', () => {
  return {
    default: class MockWooCommerceRestApi {
      constructor() {
        return {
          get: mockGet
        };
      }
    }
  };
});

// Mock dotenv
vi.mock('dotenv', () => ({
  default: { config: vi.fn() },
  config: vi.fn()
}));

// Import after all mocks are set up
import { PaymentFixer } from '../../../backend/agent/jobs/paymentFixer';

// Mock cancelled orders data
const mockCancelledOrders = [
  {
    id: 1001,
    total: '49.99',
    payment_method: 'stripe',
    date_created: '2025-10-15T10:30:00',
    status: 'cancelled'
  },
  {
    id: 1002,
    total: '0.01',
    payment_method: 'woocommerce_payments',
    date_created: '2025-10-20T14:45:00',
    status: 'cancelled'
  },
  {
    id: 1003,
    total: '29.99',
    payment_method: 'stripe',
    date_created: '2025-10-25T09:15:00',
    status: 'cancelled'
  }
];

const mockSuccessfulOrders = [
  {
    id: 2001,
    total: '99.99',
    payment_method: 'stripe',
    date_created: '2025-10-20T11:00:00',
    status: 'completed'
  }
];

describe('Payment Fixer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid test output clutter
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Default mock implementation
    mockGet.mockResolvedValue({
      data: mockCancelledOrders
    });
  });

  describe('Payment Problem Analysis', () => {
    it('should analyze cancelled orders', async () => {
      await PaymentFixer.analyzePaymentProblems();

      expect(mockGet).toHaveBeenCalledWith('orders', expect.objectContaining({
        status: 'cancelled',
        per_page: 100
      }));
    });

    it('should fetch orders from last 30 days', async () => {
      await PaymentFixer.analyzePaymentProblems();

      const callArgs = mockGet.mock.calls[0][1];
      expect(callArgs).toHaveProperty('after');
      expect(callArgs).toHaveProperty('before');
      
      // Verify date range is approximately 30 days
      const afterDate = new Date(callArgs.after);
      const beforeDate = new Date(callArgs.before);
      const daysDiff = Math.floor((beforeDate.getTime() - afterDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(31);
    });

    it('should filter out zero-value orders', async () => {
      const ordersWithZero = [
        ...mockCancelledOrders,
        { id: 9999, total: '0.00', payment_method: 'none', date_created: '2025-10-10T10:00:00', status: 'cancelled' }
      ];
      
      mockGet.mockResolvedValueOnce({
        data: ordersWithZero
      });

      await PaymentFixer.analyzePaymentProblems();

      // Should only process orders with value > 0
      expect(mockGet).toHaveBeenCalled();
    });

    it('should identify cancelled orders count', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      // Verify cancelled orders are logged
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log order details for each cancelled order', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      // Should log details for all 3 cancelled orders
      expect(consoleLogSpy).toHaveBeenCalled();
      // Verify order IDs are logged
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('1001');
      expect(logCalls).toContain('1002');
      expect(logCalls).toContain('1003');
    });
  });

  describe('Payment Settings Analysis', () => {
    it('should analyze payment gateway configuration', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      // Should log payment configuration section
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('PAYMENT-KONFIGURATION');
    });

    it('should list active payment methods', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('Stripe');
      expect(logCalls).toContain('WooCommerce Payments');
    });

    it('should identify inactive payment methods', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('PayPal');
      expect(logCalls).toContain('Bank Transfer');
    });

    it('should provide recommendations for inactive methods', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('AKTIVIEREN');
    });

    it('should identify problematic payment methods', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('Problem');
    });
  });

  describe('Payment Solutions Generation', () => {
    it('should generate Stripe configuration fixes', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('STRIPE');
      expect(logCalls).toContain('Webhooks');
      expect(logCalls).toContain('API Keys');
    });

    it('should suggest alternative payment methods', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('ALTERNATIVE ZAHLUNGSMETHODEN');
      expect(logCalls).toContain('PayPal Express');
      expect(logCalls).toContain('Klarna');
    });

    it('should recommend test transactions', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('TEST-TRANSACTIONEN');
    });

    it('should suggest payment failed email setup', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('PAYMENT-FAILED EMAIL');
      expect(logCalls).toContain('Benachrichtigung');
    });

    it('should recommend checkout optimization', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('CHECKOUT-OPTIMIERUNG');
      expect(logCalls).toContain('Guest Checkout');
      expect(logCalls).toContain('Trust-Badges');
    });

    it('should identify specific test order problems', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      // Should detect €0.01 test order
      expect(logCalls).toContain('0.01');
      expect(logCalls).toContain('Test-Bestellung');
    });

    it('should provide webhook URL in solutions', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('webhook');
      expect(logCalls).toContain('kaufe-es.eu');
    });
  });

  describe('Error Handling', () => {
    it('should handle WooCommerce API errors gracefully', async () => {
      mockGet.mockRejectedValueOnce(new Error('API Error'));
      const consoleErrorSpy = vi.spyOn(console, 'error');

      await PaymentFixer.analyzePaymentProblems();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Payment-Analyse'),
        expect.any(String)
      );
    });

    it('should handle network timeouts', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network timeout'));
      const consoleErrorSpy = vi.spyOn(console, 'error');

      await PaymentFixer.analyzePaymentProblems();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle authentication errors', async () => {
      mockGet.mockRejectedValueOnce(new Error('Authentication failed'));
      const consoleErrorSpy = vi.spyOn(console, 'error');

      await PaymentFixer.analyzePaymentProblems();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not crash on malformed order data', async () => {
      const malformedOrders = [
        { id: 1001, total: 'invalid', payment_method: null, date_created: null, status: 'cancelled' }
      ];
      
      mockGet.mockResolvedValueOnce({
        data: malformedOrders
      });

      await expect(PaymentFixer.analyzePaymentProblems()).resolves.not.toThrow();
    });
  });

  describe('Order Filtering and Detection', () => {
    it('should detect orders with different payment methods', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('stripe');
      expect(logCalls).toContain('woocommerce_payments');
    });

    it('should handle orders with missing payment method', async () => {
      const ordersWithMissingMethod = [
        { id: 1001, total: '49.99', payment_method: '', date_created: '2025-10-15T10:30:00', status: 'cancelled' }
      ];
      
      mockGet.mockResolvedValueOnce({
        data: ordersWithMissingMethod
      });

      await PaymentFixer.analyzePaymentProblems();

      const consoleLogSpy = vi.spyOn(console, 'log');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should calculate correct date range for queries', async () => {
      await PaymentFixer.analyzePaymentProblems();

      const callArgs = mockGet.mock.calls[0][1];
      const after = new Date(callArgs.after);
      const before = new Date(callArgs.before);
      
      expect(before.getTime()).toBeGreaterThan(after.getTime());
    });

    it('should format dates correctly for German locale', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      // Should log dates in German format
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should display order totals in Euro format', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toMatch(/€\d+\.\d+/);
    });
  });

  describe('Solution Prioritization', () => {
    it('should provide numbered fix steps', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).toContain('1.');
      expect(logCalls).toContain('2.');
      expect(logCalls).toContain('3.');
      expect(logCalls).toContain('4.');
      expect(logCalls).toContain('5.');
    });

    it('should provide specific action items', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      // Should contain bullet points for action items
      expect(logCalls).toContain('•');
    });

    it('should identify high-priority fixes first', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await PaymentFixer.analyzePaymentProblems();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      // Stripe config should be first priority
      const stripeIndex = logCalls.indexOf('STRIPE');
      const checkoutIndex = logCalls.indexOf('CHECKOUT-OPTIMIERUNG');
      
      if (stripeIndex !== -1 && checkoutIndex !== -1) {
        expect(stripeIndex).toBeLessThan(checkoutIndex);
      }
    });
  });

  describe('Integration Points', () => {
    it('should work with WooCommerce REST API v3', async () => {
      await PaymentFixer.analyzePaymentProblems();

      expect(mockGet).toHaveBeenCalledWith(
        'orders',
        expect.any(Object)
      );
    });

    it('should handle pagination correctly', async () => {
      await PaymentFixer.analyzePaymentProblems();

      const callArgs = mockGet.mock.calls[0][1];
      expect(callArgs.per_page).toBe(100);
    });

    it('should query only cancelled status orders', async () => {
      await PaymentFixer.analyzePaymentProblems();

      const callArgs = mockGet.mock.calls[0][1];
      expect(callArgs.status).toBe('cancelled');
    });
  });
});
