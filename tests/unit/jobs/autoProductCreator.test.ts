import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as wooTools from '../../../backend/tools/woo';

// Mock the dependencies
vi.mock('../../../backend/tools/woo', () => ({
  wooPost: vi.fn(),
  wooGet: vi.fn(),
}));

vi.mock('../../../backend/agent/jobs/trendAnalysis', () => ({
  trendAnalysisJob: vi.fn(),
}));

// Import after mocking
const { autoProductCreatorJob } = await import('../../../backend/agent/jobs/autoProductCreator');
const { trendAnalysisJob } = await import('../../../backend/agent/jobs/trendAnalysis');

describe('Auto Product Creator Job', () => {
  const mockTrendData = {
    keyword: 'digitale produkte',
    geo: 'DE',
    analysisDate: new Date().toISOString(),
    source: 'google-trends' as const,
    trendingProducts: [
      {
        niche: 'Bitcoin Investment Guide',
        demandScore: 85,
        competition: 25,
        priceRange: { min: 40, max: 80 },
        keywords: ['bitcoin', 'investment', 'guide'],
        seasonality: ['Q4 peak']
      },
      {
        niche: 'DSGVO Compliance Toolkit',
        demandScore: 90,
        competition: 20,
        priceRange: { min: 50, max: 100 },
        keywords: ['dsgvo', 'compliance', 'datenschutz'],
        seasonality: ['year-round']
      },
      {
        niche: 'Social Media Templates',
        demandScore: 75,
        competition: 35,
        priceRange: { min: 20, max: 40 },
        keywords: ['social', 'media', 'templates'],
        seasonality: ['Q1 peak']
      },
      {
        niche: 'Low Demand Product',
        demandScore: 40,
        competition: 60,
        priceRange: { min: 10, max: 20 },
        keywords: ['low', 'demand'],
        seasonality: []
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Default mock implementations
    vi.mocked(trendAnalysisJob).mockResolvedValue(mockTrendData);
    vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Job Configuration', () => {
    it('should use default configuration when no config provided', async () => {
      await autoProductCreatorJob();

      expect(trendAnalysisJob).toHaveBeenCalledWith({
        keyword: 'digitale produkte',
        geo: 'DE'
      });
    });

    it('should accept custom keyword and geo configuration', async () => {
      await autoProductCreatorJob({
        keyword: 'online kurse',
        geo: 'AT'
      });

      expect(trendAnalysisJob).toHaveBeenCalledWith({
        keyword: 'online kurse',
        geo: 'AT'
      });
    });

    it('should respect maxProducts limit', async () => {
      await autoProductCreatorJob({
        maxProducts: 2
      });

      // Should only create 2 products despite 3 eligible trends
      expect(wooTools.wooPost).toHaveBeenCalledTimes(2);
    });

    it('should filter trends by minDemandScore', async () => {
      await autoProductCreatorJob({
        minDemandScore: 80
      });

      // Only 2 trends have score >= 80
      expect(wooTools.wooPost).toHaveBeenCalledTimes(2);
    });

    it('should filter trends by maxCompetition', async () => {
      await autoProductCreatorJob({
        maxCompetition: 30
      });

      // Only 2 trends have competition <= 30
      expect(wooTools.wooPost).toHaveBeenCalledTimes(2);
    });
  });

  describe('Trend Analysis Integration', () => {
    it('should call trendAnalysisJob with correct parameters', async () => {
      await autoProductCreatorJob({
        keyword: 'test keyword',
        geo: 'CH'
      });

      expect(trendAnalysisJob).toHaveBeenCalledWith({
        keyword: 'test keyword',
        geo: 'CH'
      });
      expect(trendAnalysisJob).toHaveBeenCalledTimes(1);
    });

    it('should handle empty trend results', async () => {
      vi.mocked(trendAnalysisJob).mockResolvedValue({
        keyword: 'test',
        geo: 'DE',
        analysisDate: new Date().toISOString(),
        source: 'google-trends' as const,
        trendingProducts: []
      });

      const result = await autoProductCreatorJob();

      expect(result).toBeUndefined();
      expect(wooTools.wooPost).not.toHaveBeenCalled();
    });

    it('should filter out trends not meeting criteria', async () => {
      await autoProductCreatorJob({
        minDemandScore: 90,
        maxCompetition: 20
      });

      // Only DSGVO Compliance meets both criteria
      expect(wooTools.wooPost).toHaveBeenCalledTimes(1);
    });
  });

  describe('Product Creation', () => {
    it('should create products with correct structure', async () => {
      await autoProductCreatorJob();

      const firstCall = vi.mocked(wooTools.wooPost).mock.calls[0];
      const [endpoint, productData] = firstCall;

      expect(endpoint).toBe('/products');
      expect(productData).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        short_description: expect.any(String),
        regular_price: expect.any(String),
        type: 'simple',
        virtual: true,
        downloadable: true,
        stock_status: 'instock'
      });
    });

    it('should set products to draft by default', async () => {
      await autoProductCreatorJob({
        autoPublish: false
      });

      const allCalls = vi.mocked(wooTools.wooPost).mock.calls;
      allCalls.forEach((call) => {
        const productData = call[1] as any;
        expect(productData?.status).toBe('draft');
      });
    });

    it('should publish products when autoPublish is true', async () => {
      await autoProductCreatorJob({
        autoPublish: true
      });

      const allCalls = vi.mocked(wooTools.wooPost).mock.calls;
      allCalls.forEach((call) => {
        const productData = call[1] as any;
        expect(productData?.status).toBe('publish');
      });
    });

    it('should generate enhanced product names', async () => {
      await autoProductCreatorJob();

      const productNames = vi.mocked(wooTools.wooPost).mock.calls.map(
        call => (call[1] as any)?.name
      );

      productNames.forEach((name: any) => {
        expect(name).toBeTruthy();
        expect(typeof name).toBe('string');
        // Should have prefix like Premium, Ultimate, etc.
        expect(['Premium', 'Ultimate', 'Pro', 'Expert', 'Complete'].some(
          prefix => name.includes(prefix)
        )).toBe(true);
      });
    });

    it('should include trend keywords in product tags', async () => {
      await autoProductCreatorJob();

      const allTags = vi.mocked(wooTools.wooPost).mock.calls.flatMap(
        call => (call[1] as any)?.tags?.map((tag: any) => tag.name) || []
      );

      expect(allTags.length).toBeGreaterThan(0);
      expect(allTags).toContain('bitcoin');
      expect(allTags).toContain('dsgvo');
    });
  });

  describe('Price Calculation', () => {
    it('should calculate optimal prices from price ranges', async () => {
      await autoProductCreatorJob();

      const prices = vi.mocked(wooTools.wooPost).mock.calls.map(
        call => parseFloat((call[1] as any)?.regular_price)
      );

      prices.forEach(price => {
        expect(price).toBeGreaterThan(0);
        expect(price % 5).toBe(0); // Should be rounded to nearest 5
      });
    });

    it('should use midpoint of price range', async () => {
      await autoProductCreatorJob({
        maxProducts: 1
      });

      const price = parseFloat(
        (vi.mocked(wooTools.wooPost).mock.calls[0][1] as any)?.regular_price
      );

      // Bitcoin guide: (40 + 80) / 2 = 60, rounded to 60
      expect(price).toBe(60);
    });
  });

  describe('Category Assignment', () => {
    it('should assign appropriate categories based on niche', async () => {
      await autoProductCreatorJob();

      const categories = vi.mocked(wooTools.wooPost).mock.calls.map(
        call => (call[1] as any)?.categories
      );

      categories.forEach((cats: any) => {
        expect(Array.isArray(cats)).toBe(true);
        expect(cats.length).toBeGreaterThan(0);
        expect(cats[0]).toHaveProperty('id');
      });
    });

    it('should use Online-Kurse for Bitcoin products', async () => {
      await autoProductCreatorJob({
        maxProducts: 1 // Get Bitcoin guide
      });

      const categories = (vi.mocked(wooTools.wooPost).mock.calls[0][1] as any)?.categories;
      expect(categories[0].id).toBe(145); // Online-Kurse
    });
  });

  describe('Virtual Product Configuration', () => {
    it('should set all products as virtual and downloadable', async () => {
      await autoProductCreatorJob();

      const allVirtual = vi.mocked(wooTools.wooPost).mock.calls.every(
        call => (call[1] as any)?.virtual === true && (call[1] as any)?.downloadable === true
      );

      expect(allVirtual).toBe(true);
    });

    it('should disable stock management for virtual products', async () => {
      await autoProductCreatorJob();

      const allCalls = vi.mocked(wooTools.wooPost).mock.calls;
      allCalls.forEach((call) => {
        const productData = call[1] as any;
        expect(productData?.manage_stock).toBe(false);
        expect(productData?.stock_status).toBe('instock');
      });
    });

    it('should disable shipping for virtual products', async () => {
      await autoProductCreatorJob();

      const allCalls = vi.mocked(wooTools.wooPost).mock.calls;
      allCalls.forEach((call) => {
        const productData = call[1] as any;
        expect(productData?.shipping_class).toBe('');
        expect(productData?.shipping_class_id).toBe(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle WooCommerce API errors gracefully', async () => {
      vi.mocked(wooTools.wooPost).mockRejectedValueOnce(
        new Error('API Error')
      );

      const result = await autoProductCreatorJob();

      expect(result).toBeDefined();
      expect(console.warn).toHaveBeenCalled();
      // Job uses simulation fallback, creates all products with simulated status
    });

    it('should continue creating products after one fails', async () => {
      vi.mocked(wooTools.wooPost)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValue({ id: 123 });

      const result = await autoProductCreatorJob();

      // Should have tried to create 3 eligible products
      expect(wooTools.wooPost).toHaveBeenCalledTimes(3);
      expect(result?.createdProducts).toBe(3); // All created (1 simulated + 2 real)
    });

    it('should provide simulation fallback on API failure', async () => {
      vi.mocked(wooTools.wooPost).mockRejectedValue(
        new Error('WooCommerce unavailable')
      );

      const result = await autoProductCreatorJob();

      expect(result).toBeDefined();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('WooCommerce fehlgeschlagen')
      );
    });
  });

  describe('Return Value', () => {
    it('should return summary with correct counts', async () => {
      const result = await autoProductCreatorJob();

      expect(result).toMatchObject({
        analyzedTrends: 4,
        eligibleTrends: 3,
        createdProducts: 3,
        products: expect.any(Array)
      });
    });

    it('should include product details in return value', async () => {
      const result = await autoProductCreatorJob();

      expect(result?.products).toBeDefined();
      expect(result?.products.length).toBe(3);
      result?.products.forEach(product => {
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('trend');
        expect(product).toHaveProperty('status');
      });
    });

    it('should track WooCommerce IDs for successful creations', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 456 });

      const result = await autoProductCreatorJob();

      result?.products.forEach(product => {
        expect(product.wooCommerceId).toBe(456);
        expect(product.source).toBe('woocommerce');
      });
    });
  });

  describe('Content Generation', () => {
    it('should generate descriptions with trend data', async () => {
      await autoProductCreatorJob();

      const descriptions = vi.mocked(wooTools.wooPost).mock.calls.map(
        call => (call[1] as any)?.description
      );

      descriptions.forEach(desc => {
        expect(desc).toContain('Score:');
        expect(desc).toContain('Keywords:');
        expect(desc).toContain('Saisonale Stärke:');
      });
    });

    it('should include demand score in short description', async () => {
      await autoProductCreatorJob();

      const shortDescs = vi.mocked(wooTools.wooPost).mock.calls.map(
        call => (call[1] as any)?.short_description
      );

      shortDescs.forEach(desc => {
        expect(desc).toContain('/100');
        expect(desc).toContain('Nachfrage');
      });
    });
  });
});
