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
  const headerTotal =
    (response as any).headers?.['x-wp-total'] ??
    (response as any).headers?.['X-WP-Total'];
  const total = headerTotal
    ? Number(headerTotal)
    : Array.isArray((response as any).data)
      ? (response as any).data.length
      : 0;
  return Number.isFinite(total) ? total : 0;
};

const syncRoutes: FastifyPluginAsync = async (fastify) => {
  const wooCfg = (config as any).woocommerce || {};

  const isWooConfigured = (): boolean => {
    const missing =
      !wooCfg.url || !wooCfg.consumerKey || !wooCfg.consumerSecret;
    const looksPlaceholder = (v: string) =>
      typeof v === 'string' && (v.startsWith('PLEASE_SET') || v.trim() === '');
    if (missing) return false;
    if (
      looksPlaceholder(wooCfg.url) ||
      looksPlaceholder(wooCfg.consumerKey) ||
      looksPlaceholder(wooCfg.consumerSecret)
    )
      return false;
    const validUrl = (u: string) =>
      typeof u === 'string' && /^(https?:\/\/)/i.test(u);
    if (!validUrl(wooCfg.url)) return false;
    return true;
  };

  const createWooClient = (useQueryStringAuth: boolean) =>
    new WooCommerceRestApi({
      url: wooCfg.url || '',
      consumerKey: wooCfg.consumerKey || '',
      consumerSecret: wooCfg.consumerSecret || '',
      version: 'wc/v3',
      queryStringAuth: useQueryStringAuth,
      axiosConfig: {
        timeout: wooCfg.timeoutMs || 30000,
      },
    });

  const preferQuery = wooCfg?.authMode === 'query';
  const wooPrimary = createWooClient(preferQuery);
  const wooFallback = createWooClient(!preferQuery);

  fastify.post('/sync', async (request, reply) => {
    const body = (request.body || {}) as { type?: string };
    const type = (body.type || 'full') as SyncResult['type'];

    if (!isWooConfigured()) {
      return reply.status(500).send({
        success: false,
        error:
          'WooCommerce API nicht konfiguriert. Bitte URL, consumerKey, consumerSecret setzen.',
      });
    }

    const started = Date.now();
    try {
      const fetchWithAuthFallback = async (
        resource: string
      ): Promise<number> => {
        try {
          return await fetchCount(wooPrimary, resource);
        } catch (_e1) {
          // Retry with alternate auth mode
          return await fetchCount(wooFallback, resource);
        }
      };

      const products =
        type === 'full' || type === 'products'
          ? await fetchWithAuthFallback('products')
          : 0;
      const orders =
        type === 'full' || type === 'orders'
          ? await fetchWithAuthFallback('orders')
          : 0;
      const customers =
        type === 'full' || type === 'customers'
          ? await fetchWithAuthFallback('customers')
          : 0;

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
    } catch (error: any) {
      const status = error?.response?.status || 500;
      const data = error?.response?.data;
      const message =
        error instanceof Error
          ? error.message
          : 'WooCommerce Sync fehlgeschlagen';
      request.log.error({ err: error, status, data }, 'WooCommerce Sync Error');
      return reply.status(status).send({
        success: false,
        error: message,
        status,
        details: typeof data === 'object' ? data : undefined,
      });
    }
  });
};

export default syncRoutes;
