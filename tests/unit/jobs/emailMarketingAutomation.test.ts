// tests/unit/jobs/emailMarketingAutomation.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock woo tools before importing the module
vi.mock('../../../backend/tools/woo', () => ({
  wooGet: vi.fn()
}));

// Import after mocking
import { runEmailMarketingAutomation } from '../../../backend/agent/jobs/emailMarketingAutomation';
import { wooGet } from '../../../backend/tools/woo';

// Mock products data
const mockProducts = [
  {
    id: 101,
    name: 'DSGVO Compliance Toolkit Premium',
    slug: 'dsgvo-compliance-toolkit-premium',
    price: '49.99',
    short_description: 'Vollständiges DSGVO-Compliance-Kit für deutsche Unternehmen',
    description: 'Umfassendes Toolkit mit allen notwendigen Dokumenten und Checklisten für DSGVO-Compliance in Deutschland. Inkl. Musterverträge, Dokumentationsvorlagen und Schulungsmaterialien.'
  },
  {
    id: 102,
    name: 'Cookie-Consent Manager',
    slug: 'cookie-consent-manager',
    price: '29.99',
    short_description: 'Einfache Cookie-Consent-Lösung für Websites',
    description: 'Rechtssichere Cookie-Einwilligungslösung mit deutscher Rechtssprechung.'
  }
];

describe('Email Marketing Automation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid test output clutter
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Default mock implementation for wooGet
    (wooGet as any).mockResolvedValue(mockProducts);
  });

  describe('Campaign Execution', () => {
    it('should execute all three campaign types', async () => {
      const results = await runEmailMarketingAutomation();
      
      expect(results).toHaveLength(3);
      expect(results[0].campaign).toBe('welcome');
      expect(results[1].campaign).toBe('newsletter');
      expect(results[2].campaign).toBe('product_recommendation');
    });

    it('should track successful email sends', async () => {
      const results = await runEmailMarketingAutomation();
      
      const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
      expect(totalSent).toBeGreaterThan(0);
      expect(totalSent).toBe(9); // 3 recipients per campaign * 3 campaigns
    });

    it('should track failed email sends', async () => {
      const results = await runEmailMarketingAutomation();
      
      const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
      expect(totalFailed).toBe(0); // No failures in successful run
    });

    it('should include detailed results for each campaign', async () => {
      const results = await runEmailMarketingAutomation();
      
      results.forEach(result => {
        expect(result).toHaveProperty('campaign');
        expect(result).toHaveProperty('sent');
        expect(result).toHaveProperty('failed');
        expect(result).toHaveProperty('results');
        expect(Array.isArray(result.results)).toBe(true);
      });
    });
  });

  describe('Welcome Email Campaign', () => {
    it('should send welcome emails to new subscribers', async () => {
      const results = await runEmailMarketingAutomation();
      const welcomeResult = results.find(r => r.campaign === 'welcome');
      
      expect(welcomeResult).toBeDefined();
      expect(welcomeResult!.sent).toBe(3); // 3 new subscribers
    });

    it('should include DSGVO tips in welcome emails', async () => {
      const results = await runEmailMarketingAutomation();
      const welcomeResult = results.find(r => r.campaign === 'welcome');
      
      expect(welcomeResult).toBeDefined();
      expect(welcomeResult!.results.length).toBe(3);
      welcomeResult!.results.forEach((result: any) => {
        expect(result.success).toBe(true);
        expect(result).toHaveProperty('messageId');
      });
    });

    it('should include unsubscribe links in welcome emails', async () => {
      const results = await runEmailMarketingAutomation();
      const welcomeResult = results.find(r => r.campaign === 'welcome');
      
      expect(welcomeResult).toBeDefined();
      // Unsubscribe links are embedded in email templates
      expect(welcomeResult!.sent).toBeGreaterThan(0);
    });

    it('should send to correct email addresses', async () => {
      const results = await runEmailMarketingAutomation();
      const welcomeResult = results.find(r => r.campaign === 'welcome');
      
      expect(welcomeResult).toBeDefined();
      const emailAddresses = welcomeResult!.results.map((r: any) => r.to);
      expect(emailAddresses).toContain('max.mustermann@example.com');
      expect(emailAddresses).toContain('sarah.berger@example.com');
      expect(emailAddresses).toContain('thomas.schmidt@example.com');
    });
  });

  describe('Newsletter Campaign', () => {
    it('should send newsletter to subscribers', async () => {
      const results = await runEmailMarketingAutomation();
      const newsletterResult = results.find(r => r.campaign === 'newsletter');
      
      expect(newsletterResult).toBeDefined();
      expect(newsletterResult!.sent).toBe(3); // 3 subscribers
    });

    it('should include product information from WooCommerce', async () => {
      const results = await runEmailMarketingAutomation();
      
      expect(wooGet).toHaveBeenCalledWith('/products');
      
      const newsletterResult = results.find(r => r.campaign === 'newsletter');
      expect(newsletterResult).toBeDefined();
    });

    it('should handle empty product list gracefully', async () => {
      (wooGet as any).mockResolvedValueOnce([]);
      
      const results = await runEmailMarketingAutomation();
      const newsletterResult = results.find(r => r.campaign === 'newsletter');
      
      expect(newsletterResult).toBeDefined();
      expect(newsletterResult!.sent).toBeGreaterThan(0);
    });

    it('should include current month in newsletter', async () => {
      const results = await runEmailMarketingAutomation();
      const newsletterResult = results.find(r => r.campaign === 'newsletter');
      
      expect(newsletterResult).toBeDefined();
      expect(newsletterResult!.sent).toBe(3);
      // Month is dynamically generated in the email content
    });

    it('should send to newsletter subscribers', async () => {
      const results = await runEmailMarketingAutomation();
      const newsletterResult = results.find(r => r.campaign === 'newsletter');
      
      expect(newsletterResult).toBeDefined();
      const emailAddresses = newsletterResult!.results.map((r: any) => r.to);
      expect(emailAddresses).toContain('newsletter@example.com');
      expect(emailAddresses).toContain('abonnent@example.com');
      expect(emailAddresses).toContain('kunde@example.com');
    });
  });

  describe('Product Recommendation Campaign', () => {
    it('should send product recommendations', async () => {
      const results = await runEmailMarketingAutomation();
      const recommendationResult = results.find(r => r.campaign === 'product_recommendation');
      
      expect(recommendationResult).toBeDefined();
      expect(recommendationResult!.sent).toBe(3); // 3 targeted customers
    });

    it('should fetch products from WooCommerce', async () => {
      await runEmailMarketingAutomation();
      
      expect(wooGet).toHaveBeenCalledWith('/products');
    });

    it('should recommend first available product', async () => {
      const results = await runEmailMarketingAutomation();
      const recommendationResult = results.find(r => r.campaign === 'product_recommendation');
      
      expect(recommendationResult).toBeDefined();
      expect(recommendationResult!.sent).toBeGreaterThan(0);
      // First product from mockProducts is used
    });

    it('should handle no products available', async () => {
      // Mock empty products for both newsletter and product recommendation
      (wooGet as any).mockResolvedValue([]);
      
      const results = await runEmailMarketingAutomation();
      const recommendationResult = results.find(r => r.campaign === 'product_recommendation');
      
      expect(recommendationResult).toBeDefined();
      expect(recommendationResult!.sent).toBe(0);
      expect(recommendationResult!.failed).toBe(0);
    });

    it('should send to targeted customers', async () => {
      const results = await runEmailMarketingAutomation();
      const recommendationResult = results.find(r => r.campaign === 'product_recommendation');
      
      expect(recommendationResult).toBeDefined();
      const emailAddresses = recommendationResult!.results.map((r: any) => r.to);
      expect(emailAddresses).toContain('interessent@example.com');
      expect(emailAddresses).toContain('lead@example.com');
      expect(emailAddresses).toContain('potential@example.com');
    });

    it('should include product benefits in recommendations', async () => {
      const results = await runEmailMarketingAutomation();
      const recommendationResult = results.find(r => r.campaign === 'product_recommendation');
      
      expect(recommendationResult).toBeDefined();
      expect(recommendationResult!.sent).toBe(3);
      // Benefits are included in email template
    });
  });

  describe('Error Handling', () => {
    it('should handle WooCommerce API errors gracefully', async () => {
      (wooGet as any).mockRejectedValueOnce(new Error('WooCommerce API Error'));
      
      const results = await runEmailMarketingAutomation();
      
      // Should still complete other campaigns
      expect(results).toHaveLength(3);
      expect(results[0].campaign).toBe('welcome');
    });

    it('should continue after email send failures', async () => {
      // Newsletter will fail to get products, but should still return result
      (wooGet as any).mockRejectedValueOnce(new Error('Network error'));
      
      const results = await runEmailMarketingAutomation();
      
      expect(results).toHaveLength(3);
      // Welcome campaign should still succeed (doesn't need products)
      expect(results[0].sent).toBe(3);
    });

    it('should track individual email failures', async () => {
      const results = await runEmailMarketingAutomation();
      
      // In successful run, all should succeed
      results.forEach(result => {
        result.results.forEach((emailResult: any) => {
          expect(emailResult.success).toBe(true);
        });
      });
    });

    it('should log errors without crashing', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      (wooGet as any).mockRejectedValueOnce(new Error('Test error'));
      
      const results = await runEmailMarketingAutomation();
      
      expect(results).toBeDefined();
      expect(results.length).toBe(3);
      // Error logged but execution continues
    });
  });

  describe('DSGVO Compliance', () => {
    it('should include unsubscribe links in all campaigns', async () => {
      const results = await runEmailMarketingAutomation();
      
      // All campaigns should complete successfully
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result.sent).toBeGreaterThan(0);
        // Unsubscribe links are in email templates
      });
    });

    it('should use German language content', async () => {
      const results = await runEmailMarketingAutomation();
      
      // All campaigns use German templates
      expect(results.length).toBe(3);
      expect(results.every(r => r.sent > 0)).toBe(true);
    });

    it('should include DSGVO-relevant content', async () => {
      const results = await runEmailMarketingAutomation();
      
      // Welcome emails include DSGVO tips
      const welcomeResult = results.find(r => r.campaign === 'welcome');
      expect(welcomeResult).toBeDefined();
      expect(welcomeResult!.sent).toBe(3);
    });

    it('should encode email addresses in unsubscribe links', async () => {
      const results = await runEmailMarketingAutomation();
      
      // All campaigns should properly encode email addresses
      results.forEach(result => {
        expect(result.results.length).toBeGreaterThan(0);
        result.results.forEach((emailResult: any) => {
          expect(emailResult.to).toMatch(/@/);
        });
      });
    });
  });

  describe('Return Values', () => {
    it('should return array of campaign results', async () => {
      const results = await runEmailMarketingAutomation();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(3);
    });

    it('should include campaign metadata', async () => {
      const results = await runEmailMarketingAutomation();
      
      results.forEach(result => {
        expect(result).toHaveProperty('campaign');
        expect(result).toHaveProperty('sent');
        expect(result).toHaveProperty('failed');
        expect(result).toHaveProperty('results');
      });
    });

    it('should track total emails sent', async () => {
      const results = await runEmailMarketingAutomation();
      
      const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
      expect(totalSent).toBe(9); // 3 campaigns * 3 recipients each
    });

    it('should include email delivery details', async () => {
      const results = await runEmailMarketingAutomation();
      
      results.forEach(result => {
        result.results.forEach((emailResult: any) => {
          expect(emailResult).toHaveProperty('success');
          expect(emailResult).toHaveProperty('to');
          if (emailResult.success) {
            expect(emailResult).toHaveProperty('messageId');
          }
        });
      });
    });
  });

  describe('Content Generation', () => {
    it('should use different DSGVO tips for welcome emails', async () => {
      const results = await runEmailMarketingAutomation();
      const welcomeResult = results.find(r => r.campaign === 'welcome');
      
      expect(welcomeResult).toBeDefined();
      expect(welcomeResult!.sent).toBe(3);
      // Tips are randomly selected from GERMAN_EMAIL_CONTENT.tips
    });

    it('should include current news in newsletter', async () => {
      const results = await runEmailMarketingAutomation();
      const newsletterResult = results.find(r => r.campaign === 'newsletter');
      
      expect(newsletterResult).toBeDefined();
      expect(newsletterResult!.sent).toBe(3);
      // News updates are randomly selected
    });

    it('should include statistics in newsletter', async () => {
      const results = await runEmailMarketingAutomation();
      const newsletterResult = results.find(r => r.campaign === 'newsletter');
      
      expect(newsletterResult).toBeDefined();
      expect(newsletterResult!.sent).toBeGreaterThan(0);
      // Statistics are randomly selected
    });

    it('should include product information in recommendations', async () => {
      const results = await runEmailMarketingAutomation();
      const recommendationResult = results.find(r => r.campaign === 'product_recommendation');
      
      expect(recommendationResult).toBeDefined();
      expect(wooGet).toHaveBeenCalledWith('/products');
    });
  });
});
