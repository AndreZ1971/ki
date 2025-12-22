// backend/services/shopData.ts
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { getConfig } from '@config';

const getWooConfig = () => {
  const config = getConfig();
  const woo = config.woocommerce || {};
  return {
    url: woo.url || '',
    consumerKey: woo.consumerKey || '',
    consumerSecret: woo.consumerSecret || '',
    version: 'wc/v3' as const
  };
};

const wooCommerce = new WooCommerceRestApi(getWooConfig());

export async function getShopStats() {
  // Beispiel: Hole Umsatz und Bestellungen heute
  let salesToday = 0;
  let ordersToday = 0;
  let products = 0;
  const config = getConfig();
  const shopName = (config as any).shopName || 'Dein Shop';
  try {
    // Orders heute
    const today = new Date().toISOString().slice(0, 10);
    const ordersRes = await wooCommerce.get('orders', { after: today + 'T00:00:00', per_page: 100 });
    const orders = ordersRes.data || [];
    ordersToday = orders.length;
    salesToday = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0);
    // Produkte
    const productsRes = await wooCommerce.get('products', { per_page: 1 });
    products = productsRes.headers['x-wp-total'] ? parseInt(productsRes.headers['x-wp-total']) : 0;
  } catch (_e) {
    // Fehlerbehandlung
  }
  return { shopName, salesToday, ordersToday, products };
}


export async function getSystemHealth() {
  // Hole Systemstatus von Monitoring-API
  try {
    const res = await fetch('http://localhost:3000/api/monitoring/system/metrics');
    if (!res.ok) throw new Error('System-API nicht erreichbar');
    const data = await res.json();
    return {
      status: data.metrics?.status || 'unknown',
      cpu: data.metrics?.cpu?.usage ?? '–',
      memory: data.metrics?.memory?.usagePercent ?? '–',
      disk: data.metrics?.disk?.usagePercent ?? '–',
      network: data.metrics?.network?.status ?? 'unknown',
      uptime: data.metrics?.uptime?.formatted ?? '–'
    };
  } catch (_e) {
    return { status: 'unknown', cpu: '–', memory: '–', disk: '–', network: 'unknown', uptime: '–' };
  }
}
