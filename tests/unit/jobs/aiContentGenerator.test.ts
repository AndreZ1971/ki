import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as wooTools from '../../../backend/tools/woo';

// Mock the woo tools
vi.mock('../../../backend/tools/woo', () => ({
  wooPost: vi.fn(),
  wooGet: vi.fn(),
}));

// Import after mocking
const { createAIProducts } = await import('../../../backend/agent/jobs/aiContentGenerator');

describe('AI Content Generator Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Product Creation', () => {
    it('should create AI-generated products successfully', async () => {
      // Mock successful product creation
      vi.mocked(wooTools.wooPost).mockResolvedValue({
        id: 123,
        name: 'Premium DSGVO Compliance Toolkit Pro Edition',
        price: '49.99'
      });

      const result = await createAIProducts();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should call wooPost for each product template', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      // Should have called wooPost for each product in GERMAN_AI_PRODUCTS (5 products)
      expect(wooTools.wooPost).toHaveBeenCalledTimes(5);
    });

    it('should generate products with correct structure', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      const firstCall = vi.mocked(wooTools.wooPost).mock.calls[0];
      const [endpoint, productData] = firstCall;

      expect(endpoint).toBe('/products');
      expect(productData).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        short_description: expect.any(String),
        regular_price: expect.any(String),
        type: 'simple',
        status: 'draft',
        virtual: true,
        downloadable: true
      });
    });

    it('should generate AI-enhanced product names with variants', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      const productNames = vi.mocked(wooTools.wooPost).mock.calls.map(
        call => call[1].name
      );

      // All names should be non-empty
      productNames.forEach(name => {
        expect(name).toBeTruthy();
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(10);
      });

      // Names should include variant prefixes/suffixes
      const hasVariants = productNames.some(name => 
        name.includes('Premium') || 
        name.includes('Ultimate') || 
        name.includes('Pro') ||
        name.includes('2024') ||
        name.includes('Edition')
      );
      expect(hasVariants).toBe(true);
    });
  });

  describe('AI Content Generation', () => {
    it('should generate descriptions with benefits section', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      const descriptions = vi.mocked(wooTools.wooPost).mock.calls.map(
        call => call[1].description
      );

      descriptions.forEach(desc => {
        expect(desc).toContain('Vorteile');
        expect(desc).toContain('✅');
        expect(desc).toContain('<h2>');
        expect(desc).toContain('<ul>');
        expect(desc).toContain('DSGVO');
      });
    });

    it('should generate short descriptions', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      const shortDescriptions = vi.mocked(wooTools.wooPost).mock.calls.map(
        call => call[1].short_description
      );

      shortDescriptions.forEach(desc => {
        expect(desc).toBeTruthy();
        expect(typeof desc).toBe('string');
        expect(desc.length).toBeGreaterThan(20);
        expect(desc.length).toBeLessThan(300);
      });
    });

    it('should generate varied prices around base price', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      const prices = vi.mocked(wooTools.wooPost).mock.calls.map(
        call => parseFloat(call[1].regular_price)
      );

      prices.forEach(price => {
        expect(price).toBeGreaterThan(20); // Min reasonable price
        expect(price).toBeLessThan(150); // Max reasonable price
        expect(typeof price).toBe('number');
        expect(isNaN(price)).toBe(false);
      });
    });

    it('should include DSGVO-relevant keywords in tags', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      const allTags = vi.mocked(wooTools.wooPost).mock.calls.flatMap(
        call => call[1].tags?.map((tag: any) => tag.name) || []
      );

      const dsgvoRelevantKeywords = [
        'dsgvo', 'compliance', 'datenschutz', 'cookie', 
        'consent', 'dokumente', 'schulung'
      ];

      const hasDsgvoKeywords = allTags.some(tag =>
        dsgvoRelevantKeywords.some(keyword => 
          tag.toLowerCase().includes(keyword)
        )
      );

      expect(hasDsgvoKeywords).toBe(true);
    });
  });

  describe('Product Configuration', () => {
    it('should set products as virtual and downloadable', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      const allVirtual = vi.mocked(wooTools.wooPost).mock.calls.every(
        call => call[1].virtual === true && call[1].downloadable === true
      );

      expect(allVirtual).toBe(true);
    });

    it('should set products to draft status by default', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      const allDraft = vi.mocked(wooTools.wooPost).mock.calls.every(
        call => call[1].status === 'draft'
      );

      expect(allDraft).toBe(true);
    });

    it('should assign correct categories', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      const hasCategories = vi.mocked(wooTools.wooPost).mock.calls.every(
        call => Array.isArray(call[1].categories) && call[1].categories.length > 0
      );

      expect(hasCategories).toBe(true);
    });

    it('should set stock status to instock', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      const allInStock = vi.mocked(wooTools.wooPost).mock.calls.every(
        call => call[1].stock_status === 'instock'
      );

      expect(allInStock).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      vi.mocked(wooTools.wooPost).mockRejectedValueOnce(
        new Error('WooCommerce API Error')
      );
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      const result = await createAIProducts();

      // Should continue creating other products despite one failure
      expect(result).toBeDefined();
      expect(console.error).toHaveBeenCalled();
    });

    it('should continue with remaining products after one fails', async () => {
      // First product fails, rest succeed
      vi.mocked(wooTools.wooPost)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValue({ id: 123 });

      const result = await createAIProducts();

      // Should have tried all 5 products
      expect(wooTools.wooPost).toHaveBeenCalledTimes(5);
      // Should have 4 successful products (one failed)
      expect(result.length).toBe(4);
    });

    it('should log errors with product context', async () => {
      vi.mocked(wooTools.wooPost).mockRejectedValueOnce(
        new Error('Test Error')
      );

      await createAIProducts();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Fehler bei'),
        expect.any(String)
      );
    });
  });

  describe('Return Value', () => {
    it('should return array of created product info', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({
        id: 456,
        name: 'Test Product',
        price: '49.99'
      });

      const result = await createAIProducts();

      expect(Array.isArray(result)).toBe(true);
      result.forEach(product => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('original');
      });
    });

    it('should track successful creation count', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      const result = await createAIProducts();

      // All 5 products should be created successfully
      expect(result.length).toBe(5);
    });
  });

  describe('Content Quality', () => {
    it('should generate unique product names', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      const names = vi.mocked(wooTools.wooPost).mock.calls.map(
        call => call[1].name
      );

      // Check for uniqueness (allowing some randomness)
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBeGreaterThan(1);
    });

    it('should include legal disclaimer in descriptions', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      const descriptions = vi.mocked(wooTools.wooPost).mock.calls.map(
        call => call[1].description
      );

      descriptions.forEach(desc => {
        expect(desc).toContain('Hinweis');
        expect(desc).toContain('Rechtsberatung');
      });
    });

    it('should use German language consistently', async () => {
      vi.mocked(wooTools.wooPost).mockResolvedValue({ id: 123 });

      await createAIProducts();

      const allContent = vi.mocked(wooTools.wooPost).mock.calls.flatMap(call => [
        call[1].name,
        call[1].description,
        call[1].short_description
      ]);

      // Check for German-specific content
      const germanWords = ['für', 'und', 'Ihre', 'von', 'mit'];
      const hasGermanContent = allContent.some(content =>
        germanWords.some(word => content.includes(word))
      );

      expect(hasGermanContent).toBe(true);
    });
  });
});
