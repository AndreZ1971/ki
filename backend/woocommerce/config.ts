// woocommerce/config.ts
export interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
  version: string;
  authMode: 'query' | 'basic';
  timeout: number;
}

export const getWooConfig = (): WooCommerceConfig => {
  // Hole zentrale Konfiguration
  const config = require('../config').default;
  const woo = config.woocommerce || {};
  return {
    url: woo.url || '',
    consumerKey: woo.consumerKey || '',
    consumerSecret: woo.consumerSecret || '',
    version: woo.version || 'wc/v3',
    authMode: woo.authMode || 'basic',
    timeout: typeof woo.timeoutMs === 'number' ? woo.timeoutMs : 30000
  };
};