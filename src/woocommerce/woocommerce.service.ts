import { FastifyInstance } from 'fastify';

export class WooCommerceService {
  private baseUrl: string;
  private auth: string;
  private isConfigured: boolean = false;

  constructor() {
    const baseUrl = process.env.WOOCOMMERCE_URL;
    const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
    
    if (!baseUrl || !consumerKey || !consumerSecret) {
      console.warn('⚠️ WooCommerce API nicht konfiguriert - bitte WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY und WOOCOMMERCE_CONSUMER_SECRET in .env setzen');
      this.isConfigured = false;
      // Dummy-Werte zuweisen, um TypeScript-Fehler zu vermeiden
      this.baseUrl = '';
      this.auth = '';
      return;
    }

    this.baseUrl = baseUrl;
    this.auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    this.isConfigured = true;
    console.log('✅ WooCommerce Service initialisiert');
  }

  async updateProduct(productId: number, updateData: any, server: FastifyInstance) {
    if (!this.isConfigured) {
      throw new Error('WooCommerce API nicht konfiguriert. Bitte Environment Variables prüfen.');
    }

    try {
      const url = `${this.baseUrl}/wp-json/wc/v3/products/${productId}`;
      
      server.log.info(`Updating WooCommerce product ${productId}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Product-Optimizer/1.0'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        server.log.error(`WooCommerce API Error: ${response.status} - ${errorText}`);
        throw new Error(`WooCommerce update failed: ${response.status} ${response.statusText}`);
      }

      const updatedProduct = await response.json();
      server.log.info(`✅ WooCommerce product ${productId} updated successfully`);
      
      return updatedProduct;

    } catch (error: any) {
      server.log.error('WooCommerce service error:', error);
      throw error;
    }
  }

  async getProduct(productId: number, server: FastifyInstance) {
    if (!this.isConfigured) {
      throw new Error('WooCommerce API nicht konfiguriert');
    }

    try {
      const url = `${this.baseUrl}/wp-json/wc/v3/products/${productId}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'User-Agent': 'Product-Optimizer/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`WooCommerce fetch failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error: any) {
      server.log.error('WooCommerce get product error:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isConfigured;
  }
}

// Singleton Instance
export const wooCommerceService = new WooCommerceService();