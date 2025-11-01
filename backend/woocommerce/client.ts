// woocommerce/client.ts
import { getWooConfig, WooCommerceConfig } from './config.js';
import { wooCommerceBreaker, standardRetry, alertError } from '../error-handling/index.js';

export class WooCommerceClient {
  private config: WooCommerceConfig;

  constructor() {
    this.config = getWooConfig();
  }

  private buildUrl(endpoint: string): string {
    const baseUrl = `${this.config.url}/wp-json/${this.config.version}/${endpoint}`;
    
    if (this.config.authMode === 'query') {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}consumer_key=${this.config.consumerKey}&consumer_secret=${this.config.consumerSecret}`;
    }
    
    return baseUrl;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Agent/1.0'
    };

    if (this.config.authMode === 'basic') {
      const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    return headers;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = this.buildUrl(endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal: controller.signal,
        ...options,
      });

      if (!response.ok) {
        const error = new Error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
        (error as any).statusCode = response.status;
        throw error;
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error(`WooCommerce API timeout after ${this.config.timeout}ms`);
        (timeoutError as any).code = 'ETIMEDOUT';
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * GET Request mit Circuit Breaker & Retry Protection
   */
  async get(endpoint: string): Promise<any> {
    return standardRetry.execute(() => 
      wooCommerceBreaker.execute(() => this.request(endpoint))
    );
  }

  /**
   * POST Request mit Circuit Breaker & Retry Protection
   */
  async post(endpoint: string, data: any): Promise<any> {
    try {
      return await standardRetry.execute(() => 
        wooCommerceBreaker.execute(() => this.request(endpoint, {
          method: 'POST',
          body: JSON.stringify(data),
        }))
      );
    } catch (error) {
      await alertError(
        'WooCommerce POST Failed',
        `Failed to POST to ${endpoint}`,
        'WooCommerceClient',
        error instanceof Error ? error : new Error(String(error)),
        { endpoint, dataKeys: Object.keys(data) }
      );
      throw error;
    }
  }

  /**
   * PUT Request mit Circuit Breaker & Retry Protection
   */
  async put(endpoint: string, data: any): Promise<any> {
    try {
      return await standardRetry.execute(() => 
        wooCommerceBreaker.execute(() => this.request(endpoint, {
          method: 'PUT', 
          body: JSON.stringify(data),
        }))
      );
    } catch (error) {
      await alertError(
        'WooCommerce PUT Failed',
        `Failed to PUT to ${endpoint}`,
        'WooCommerceClient',
        error instanceof Error ? error : new Error(String(error)),
        { endpoint, dataKeys: Object.keys(data) }
      );
      throw error;
    }
  }

  /**
   * DELETE Request mit Circuit Breaker & Retry Protection
   */
  async delete(endpoint: string): Promise<any> {
    return standardRetry.execute(() => 
      wooCommerceBreaker.execute(() => this.request(endpoint, {
        method: 'DELETE',
      }))
    );
  }

  /**
   * Gibt aktuellen Circuit Breaker Status zurück
   */
  getCircuitState() {
    return wooCommerceBreaker.getState();
  }

  /**
   * Gibt Circuit Breaker Statistiken zurück
   */
  getCircuitStats() {
    return wooCommerceBreaker.getStats();
  }
}