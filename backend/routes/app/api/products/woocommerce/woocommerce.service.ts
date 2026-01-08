import { FastifyInstance } from 'fastify';
import { getConfig } from '@config';

export class WooCommerceService {
  constructor() {
    console.log('✅ WooCommerce Service initialisiert');
  }

  // ✅ KRITISCH: getConfig() bei JEDER Anfrage aufrufen, nicht nur im Constructor!
  private getCredentials() {
    const config = getConfig();
    const cfg = config.woocommerce || {};
    
    const baseUrl = cfg.url || process.env.WOOCOMMERCE_URL;
    const consumerKey = cfg.consumerKey || process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.CONSUMER_KEY;
    const consumerSecret = cfg.consumerSecret || process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.CONSUMER_SECRET;

    if (!baseUrl || !consumerKey || !consumerSecret) {
      console.error('[WooCommerceService] ❌ Konfiguration fehlt:', {
        baseUrl: baseUrl ? '✓' : '✗',
        consumerKey: consumerKey ? '✓' : '✗',
        consumerSecret: consumerSecret ? '✓' : '✗'
      });
      return null;
    }

    return {
      baseUrl,
      auth: Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
    };
  }

  isReady(): boolean {
    return this.getCredentials() !== null;
  }

  async updateProduct(productId: number, updateData: any, server: FastifyInstance) {
    const creds = this.getCredentials();
    if (!creds) {
      throw new Error('WooCommerce API nicht konfiguriert. Bitte connection.json prüfen.');
    }

    try {
      const url = `${creds.baseUrl}/wp-json/wc/v3/products/${productId}`;
      
      server.log.info(`[WooCommerce] Updating product ${productId}`);
      console.log(`[WooCommerce] 📤 PUT ${url}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${creds.auth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Product-Performance/1.0'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        server.log.error(`[WooCommerce] HTTP ${response.status}: ${errorText}`);
        throw new Error(`WooCommerce update failed: ${response.status} ${response.statusText}`);
      }

      const updatedProduct = await response.json();
      console.log(`[WooCommerce] ✅ Product ${productId} updated successfully`);
      
      return updatedProduct;

    } catch (error: any) {
      console.error('[WooCommerce] ❌ Update error:', error.message);
      server.log.error('WooCommerce update error:', error);
      throw error;
    }
  }

  async getProduct(productId: number, server: FastifyInstance) {
    const creds = this.getCredentials();
    if (!creds) {
      throw new Error('WooCommerce API nicht konfiguriert. Bitte connection.json prüfen.');
    }

    try {
      const url = `${creds.baseUrl}/wp-json/wc/v3/products/${productId}`;
      console.log(`[WooCommerce] 📥 GET ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${creds.auth}`,
          'User-Agent': 'Product-Performance/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`WooCommerce fetch failed: ${response.status} ${response.statusText}`);
      }

      const product = await response.json();
      console.log(`[WooCommerce] ✅ Product ${productId} loaded (${product.name})`);
      return product;

    } catch (error: any) {
      console.error('[WooCommerce] ❌ Get product error:', error.message);
      server.log.error('WooCommerce get product error:', error);
      throw error;
    }
  }

  async createProduct(productData: any, server: FastifyInstance) {
    const creds = this.getCredentials();
    if (!creds) {
      throw new Error('WooCommerce API nicht konfiguriert. Bitte connection.json prüfen.');
    }

    try {
      const url = `${creds.baseUrl}/wp-json/wc/v3/products`;
      console.log(`[WooCommerce] 📤 POST ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${creds.auth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Product-Performance/1.0'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[WooCommerce] ❌ HTTP ${response.status}: ${errorText}`);
        throw new Error(`WooCommerce create failed: ${response.status} ${response.statusText}`);
      }

      const newProduct = await response.json();
      console.log(`[WooCommerce] ✅ Product created (ID: ${newProduct.id})`);
      
      return newProduct;

    } catch (error: any) {
      console.error('[WooCommerce] ❌ Create product error:', error.message);
      server.log.error('WooCommerce create product error:', error);
      throw error;
    }
  }

  async listProducts(params: any = {}, server: FastifyInstance) {
    const creds = this.getCredentials();
    if (!creds) {
      throw new Error('WooCommerce API nicht konfiguriert. Bitte connection.json prüfen.');
    }

    try {
      const urlParams = new URLSearchParams(params).toString();
      const url = `${creds.baseUrl}/wp-json/wc/v3/products${urlParams ? `?${urlParams}` : ''}`;
      console.log(`[WooCommerce] 📥 GET ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${creds.auth}`,
          'User-Agent': 'Product-Performance/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`WooCommerce list products failed: ${response.status} ${response.statusText}`);
      }

      const products = await response.json();
      console.log(`[WooCommerce] ✅ Listed ${Array.isArray(products) ? products.length : 'unknown'} products`);
      return products;

    } catch (error: any) {
      console.error('[WooCommerce] ❌ List products error:', error.message);
      server.log.error('WooCommerce list products error:', error);
      throw error;
    }
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