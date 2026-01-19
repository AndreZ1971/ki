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
import { getConfig } from '../config.js';

export const getWooConfig = (): WooCommerceConfig => {
  // Hole zentrale Konfiguration: erst lokale connection.json (dist/connection), dann backend/connection.json, dann root.
  const candidatePaths = [
    // dist/connection.json (if copied)
    path.resolve(__dirname, '../connection.json'),
    // backend/connection.json
    path.resolve(__dirname, '../../connection.json'),
    // repository root connection.json
    path.resolve(__dirname, '../../../connection.json')
  ];

  let woo: any = {};
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        woo = parsed.woocommerce || {};
        break;
      } catch {
        woo = {};
      }
    }
  }

  // Fallback: nutze zentrales getConfig, falls Dateien fehlen
  if (!woo.url) {
    const cfg = getConfig();
    woo = cfg.woocommerce || woo;
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