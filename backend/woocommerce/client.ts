// woocommerce/client.ts
import { getWooConfig, WooCommerceConfig } from './config.js';

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
        throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`WooCommerce API timeout after ${this.config.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get(endpoint: string): Promise<any> {
    return this.request(endpoint);
  }

  async post(endpoint: string, data: any): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT', 
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string): Promise<any> {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}