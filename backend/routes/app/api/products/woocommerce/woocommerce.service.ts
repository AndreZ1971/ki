import { FastifyInstance } from 'fastify';
import { getConfig } from '@config';
import { logger } from '../../../../../logger';

export class WooCommerceService {
  constructor() {
    logger.info('WooCommerce Service initialized');
  }

  // ✅ KRITISCH: getConfig() bei JEDER Anfrage aufrufen, nicht nur im Constructor!
  private getCredentials() {
    const config = getConfig();
    const cfg = config.woocommerce || {};
    
    const baseUrl = cfg.url || process.env.WOOCOMMERCE_URL;
    const consumerKey = cfg.consumerKey || process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.CONSUMER_KEY;
    const consumerSecret = cfg.consumerSecret || process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.CONSUMER_SECRET;

    if (!baseUrl || !consumerKey || !consumerSecret) {
      logger.error({
        hasBaseUrl: !!baseUrl,
        hasConsumerKey: !!consumerKey,
        hasConsumerSecret: !!consumerSecret
      }, 'WooCommerce configuration missing');
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
      logger.debug({ url, productId }, 'WooCommerce PUT request');
      
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
      logger.info({ productId }, 'Product updated successfully');
      
      return updatedProduct;

    } catch (error: any) {
      logger.error({ error: error.message, productId, function: 'updateProduct' }, 'WooCommerce update error');
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
      logger.debug({ url, productId }, 'WooCommerce GET request');
      
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
      logger.debug({ productId, name: product.name }, 'Product loaded');
      return product;

    } catch (error: any) {
      logger.error({ error: error.message, productId, function: 'getProduct' }, 'WooCommerce get product error');
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
      logger.debug({ url }, 'WooCommerce POST request');
      
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
        logger.error({ status: response.status, error: errorText }, 'WooCommerce HTTP error');
        throw new Error(`WooCommerce create failed: ${response.status} ${response.statusText}`);
      }

      const newProduct = await response.json();
      logger.info({ productId: newProduct.id }, 'Product created');
      
      return newProduct;

    } catch (error: any) {
      logger.error({ error: error.message, function: 'createProduct' }, 'WooCommerce create product error');
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
      logger.debug({ url, params }, 'WooCommerce GET request for products list');
      
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
      logger.debug({ count: Array.isArray(products) ? products.length : 'unknown' }, 'Products listed');
      return products;

    } catch (error: any) {
      logger.error({ error: error.message, function: 'listProducts' }, 'WooCommerce list products error');
      server.log.error('WooCommerce list products error:', error);
      throw error;
    }
  }


  getConfigurationStatus() {
    const creds = this.getCredentials();
    return {
      isConfigured: this.isReady(),
      baseUrl: creds?.baseUrl ? '✅ Gesetzt' : '❌ Fehlt',
      hasAuth: creds?.auth ? '✅ Gesetzt' : '❌ Fehlt'
    };
  }
}

// Singleton Instance
export const wooCommerceService = new WooCommerceService();