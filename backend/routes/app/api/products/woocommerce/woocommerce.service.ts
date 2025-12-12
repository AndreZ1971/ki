import { FastifyInstance } from 'fastify';
import config from '../../../../../config';

export class WooCommerceService {
  private baseUrl: string;
  private auth: string;
  private isConfigured: boolean = false;

  constructor() {
    const envBaseUrl = process.env.WOOCOMMERCE_URL;
    const envConsumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.CONSUMER_KEY;
    const envConsumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.CONSUMER_SECRET;

    const cfg = config.woocommerce || {};
    const baseUrl = envBaseUrl || cfg.url;
    const consumerKey = envConsumerKey || cfg.consumerKey;
    const consumerSecret = envConsumerSecret || cfg.consumerSecret;
    
    if (!baseUrl || !consumerKey || !consumerSecret) {
      // console.warn('⚠️ WooCommerce API nicht konfiguriert - bitte WOOCOMMERCE_URL, CONSUMER_KEY und CONSUMER_SECRET in .env setzen');
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

  async createProduct(productData: any, server: FastifyInstance) {
    if (!this.isConfigured) {
      throw new Error('WooCommerce API nicht konfiguriert');
    }

    try {
      const url = `${this.baseUrl}/wp-json/wc/v3/products`;
      
      server.log.info('Creating new WooCommerce product');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Product-Optimizer/1.0'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        server.log.error(`WooCommerce API Error: ${response.status} - ${errorText}`);
        throw new Error(`WooCommerce create failed: ${response.status} ${response.statusText}`);
      }

      const newProduct = await response.json();
      server.log.info(`✅ WooCommerce product created successfully (ID: ${newProduct.id})`);
      
      return newProduct;

    } catch (error: any) {
      server.log.error('WooCommerce create product error:', error);
      throw error;
    }
  }

  async listProducts(params: any = {}, server: FastifyInstance) {
    if (!this.isConfigured) {
      throw new Error('WooCommerce API nicht konfiguriert');
    }

    try {
      const urlParams = new URLSearchParams(params).toString();
      const url = `${this.baseUrl}/wp-json/wc/v3/products${urlParams ? `?${urlParams}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'User-Agent': 'Product-Optimizer/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`WooCommerce list products failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error: any) {
      server.log.error('WooCommerce list products error:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getConfigurationStatus() {
    return {
      isConfigured: this.isConfigured,
      baseUrl: this.baseUrl ? '✅ Gesetzt' : '❌ Fehlt',
      hasAuth: this.auth ? '✅ Gesetzt' : '❌ Fehlt'
    };
  }
}

// Singleton Instance
export const wooCommerceService = new WooCommerceService();