// backend/routes/app/api/woocommerce/sync.ts
import { FastifyPluginAsync } from 'fastify';
import { getConfig } from '@config';

interface SyncResult {
  products: number;
  orders: number;
  customers: number;
  lastSync: string;
  durationMs: number;
  type: 'full' | 'products' | 'orders' | 'customers';
}

/**
 * Fetch WooCommerce resource count using native fetch (works like /products/analyzer)
 */
const fetchCount = async (
  baseUrl: string,
  consumerKey: string,
  consumerSecret: string,
  resource: string,
  useQueryAuth: boolean
): Promise<number> => {
  let url: string;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'ARI-WooSync/1.0'
  };

  if (useQueryAuth) {
    // Query String Auth
    url = `${baseUrl}/wp-json/wc/v3/${resource}?per_page=1&consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`;
  } else {
    // Basic Auth
    url = `${baseUrl}/wp-json/wc/v3/${resource}?per_page=1`;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  console.log(`[WooSync] Fetching count for ${resource} from ${url.replace(/consumer_(key|secret)=[^&]+/g, 'consumer_$1=***')}`);

  const response = await fetch(url, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const total = response.headers.get('x-wp-total');
  return total ? Number(total) : 0;
};

const syncRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper: Lade Config DYNAMISCH bei jedem Aufruf (nicht cachen!)
  const getWooCfg = () => getConfig().woocommerce || {};

  const isWooConfigured = (): boolean => {
    const wooCfg = getWooCfg(); // Dynamisch laden
    const missing =
      !wooCfg.url || !wooCfg.consumerKey || !wooCfg.consumerSecret;
    const looksPlaceholder = (v?: string) =>
      typeof v === 'string' && (v.startsWith('PLEASE_SET') || v.trim() === '');
    if (missing) return false;
    if (
      looksPlaceholder(wooCfg.url) ||
      looksPlaceholder(wooCfg.consumerKey) ||
      looksPlaceholder(wooCfg.consumerSecret)
    )
      return false;
    const validUrl = (u?: string) =>
      typeof u === 'string' && /^(https?:\/\/)/i.test(u);
    if (!validUrl(wooCfg.url)) return false;
    return true;
  };

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

    // Config dynamisch laden
    const wooCfg = getWooCfg();
    const { url, consumerKey, consumerSecret } = wooCfg;
    const preferQuery = wooCfg?.authMode === 'query';

    const started = Date.now();
    try {
      const fetchWithAuthFallback = async (
        resource: string
      ): Promise<number> => {
        try {
          return await fetchCount(url!, consumerKey!, consumerSecret!, resource, preferQuery);
        } catch (_e1) {
          // Retry with alternate auth mode
          console.log(`[WooSync] Retry ${resource} with ${preferQuery ? 'basic' : 'query'} auth`);
          return await fetchCount(url!, consumerKey!, consumerSecret!, resource, !preferQuery);
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

      return reply.send({
        success: true,
        data: result,
        message: `Sync (${type}) erfolgreich`,
      });
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

  // 🔍 DEBUG: Zeige aktuelle WooCommerce-Config
  fastify.get('/debug-config', async (request, reply) => {
    const cfg = getWooCfg();
    return reply.send({
      url: cfg.url,
      consumerKey: cfg.consumerKey ? `${cfg.consumerKey.substring(0, 8)}...` : 'MISSING',
      consumerSecret: cfg.consumerSecret ? 'SET' : 'MISSING',
      authMode: cfg.authMode || 'basic (default)',
      isConfigured: isWooConfigured()
    });
  });

  // 🔍 DEBUG: Test WooCommerce-Verbindung direkt mit fetch
  fastify.get('/debug-test', async (request, reply) => {
    if (!isWooConfigured()) {
      return reply.status(500).send({
        success: false,
        error: 'WooCommerce nicht konfiguriert'
      });
    }

    try {
      const wooCfg = getWooCfg();
      const preferQuery = wooCfg?.authMode === 'query';
      const count = await fetchCount(
        wooCfg.url!,
        wooCfg.consumerKey!,
        wooCfg.consumerSecret!,
        'products',
        preferQuery
      );
      return reply.send({
        success: true,
        productCount: count,
        message: 'WooCommerce-Verbindung funktioniert!',
        authMode: preferQuery ? 'query' : 'basic'
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });
};

export default syncRoutes;
