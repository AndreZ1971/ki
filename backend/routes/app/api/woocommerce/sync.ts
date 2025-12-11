// backend/routes/app/api/woocommerce/sync.ts
import { FastifyPluginAsync } from 'fastify';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import config from '../../../../config';

interface SyncResult {
  products: number;
  orders: number;
  customers: number;
  lastSync: string;
  durationMs: number;
  type: 'full' | 'products' | 'orders' | 'customers';
}

const fetchCount = async (client: WooCommerceRestApi, resource: string) => {
  const response = await client.get(resource, { per_page: 1 });
  const headerTotal = response.headers?.['x-wp-total'];
  const total = headerTotal ? Number(headerTotal) : Array.isArray(response.data) ? response.data.length : 0;
  return Number.isFinite(total) ? total : 0;
};

const syncRoutes: FastifyPluginAsync = async (fastify) => {
  const wooCfg = config.woocommerce || {};
  const client = new WooCommerceRestApi({
    url: wooCfg.url || '',
    consumerKey: wooCfg.consumerKey || '',
    consumerSecret: wooCfg.consumerSecret || '',
    version: 'wc/v3',
    timeout: 10000
  });

  fastify.post('/sync', async (request, reply) => {
    const body = (request.body || {}) as { type?: string };
    const type = (body.type || 'full') as SyncResult['type'];

    if (!wooCfg.url || !wooCfg.consumerKey || !wooCfg.consumerSecret) {
      return reply.status(500).send({
        success: false,
        error: 'WooCommerce API nicht konfiguriert. Bitte URL, consumerKey, consumerSecret setzen.'
      });
    }

    const started = Date.now();
    try {
      const products = type === 'full' || type === 'products' ? await fetchCount(client, 'products') : 0;
      const orders = type === 'full' || type === 'orders' ? await fetchCount(client, 'orders') : 0;
      const customers = type === 'full' || type === 'customers' ? await fetchCount(client, 'customers') : 0;

      const result: SyncResult = {
        products,
        orders,
        customers,
        lastSync: new Date().toISOString(),
        durationMs: Date.now() - started,
        type,
      };

      return {
        success: true,
        data: result,
        message: `Sync (${type}) erfolgreich`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'WooCommerce Sync fehlgeschlagen';
      request.log.error({ err: error }, 'WooCommerce Sync Error');
      return reply.status(500).send({ success: false, error: message });
    }
  });
};

export default syncRoutes;
