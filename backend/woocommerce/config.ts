// woocommerce/config.ts
export interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
  version: string;
  authMode: 'query' | 'basic';
  timeout: number;
}

import fs from 'fs';
import path from 'path';

export const getWooConfig = (): WooCommerceConfig => {
  // Hole zentrale Konfiguration direkt aus connection.json, um ESM/CJS-Interop-Probleme in Tests zu vermeiden
  const configPath = path.resolve(__dirname, '../connection.json');
  let woo: any = {};
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      woo = parsed.woocommerce || {};
    } catch {
      woo = {};
    }
  }
  return {
    url: woo.url || '',
    consumerKey: woo.consumerKey || '',
    consumerSecret: woo.consumerSecret || '',
    version: woo.version || 'wc/v3',
    authMode: woo.authMode || 'basic',
    timeout: typeof woo.timeoutMs === 'number' ? woo.timeoutMs : 30000
  };
};