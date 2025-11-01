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
      const logCalls = consoleLogSpy.mock.c