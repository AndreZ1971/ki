// backend/routes/app/api/woocommerce/customers.ts
import { FastifyPluginAsync } from 'fastify';

import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { getConfig } from '@config';

const customersRoutes: FastifyPluginAsync = async (fastify, _options) => {
  // Helper: Prüfe, ob WooCommerce konfiguriert ist (Onboarding kann Placeholder setzen)
  const isWooConfigured = (): boolean => {
    const woo = getConfig().woocommerce || {};
    const missing = !woo.url || !woo.consumerKey || !woo.consumerSecret;
    const looksPlaceholder = (v?: string) =>
      typeof v === 'string' && (v.startsWith('PLEASE_SET') || v.trim() === '');
    const validUrl = (u?: string) =>
      typeof u === 'string' && /^(https?:)\/+/.test(u);

    if (missing) return false;
    if (
      looksPlaceholder(woo.url) ||
      looksPlaceholder(woo.consumerKey) ||
      looksPlaceholder(woo.consumerSecret)
    )
      return false;
    if (!validUrl(woo.url)) return false;
    return true;
  };

  // Helper: Client-Factory mit wählbarem Auth-Modus
  const createWooClient = (useQueryStringAuth: boolean) => {
    const wooConfig: any = getConfig().woocommerce || {};
    return new WooCommerceRestApi({
      url: wooConfig.url || '',
      consumerKey: wooConfig.consumerKey || '',
      consumerSecret: wooConfig.consumerSecret || '',
      version: 'wc/v3',
      queryStringAuth: useQueryStringAuth,
      axiosConfig: {
        timeout: wooConfig.timeoutMs ? Number(wooConfig.timeoutMs) : 30000,
      },
    });
  };

  const wooConfig = getConfig().woocommerce || {};
  const preferQuery = wooConfig.authMode === 'query';
  const WooPrimary = createWooClient(preferQuery);
  const WooFallback = createWooClient(!preferQuery);

  // GET: Alle Kunden aus WooCommerce
  fastify.get('/customers', async (request, reply) => {
    try {
      // Onboarding-Guard: Wenn Woo nicht konfiguriert ist, liefere klare Meldung
      if (!isWooConfigured()) {
        return reply.status(503).send({
          success: false,
          code: 'WOO_NOT_CONFIGURED',
          message:
            'WooCommerce ist noch nicht konfiguriert. Bitte im Onboarding URL, Consumer Key und Secret hinterlegen.',
        });
      }

      console.log('📥 Fetching customers from WooCommerce...');

      const woo = getConfig().woocommerce || {};
      const auth = Buffer.from(
        `${woo.consumerKey || ''}:${woo.consumerSecret || ''}`
      ).toString('base64');
      const wooUrl = (woo.url || '').endsWith('/')
        ? (woo.url || '').slice(0, -1)
        : woo.url || '';

      // ✅ Direkte REST API Call (wie shop-metrics.ts) statt WooCommerceRestApi Package
      // Das Package kann manchmal Probleme mit Auth oder Pagination haben
      let customers: any[] = [];

      try {
        const response = await fetch(
          `${wooUrl}/wp-json/wc/v3/customers?per_page=100&role=all`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.warn(
            `⚠️ Customers API returned ${response.status}, trying with query string auth...`
          );
          // Fallback mit Query String Auth
          const fallbackResponse = await fetch(
            `${wooUrl}/wp-json/wc/v3/customers?per_page=100&role=all&consumer_key=${woo.consumerKey || ''}&consumer_secret=${woo.consumerSecret || ''}`
          );
          if (!fallbackResponse.ok) {
            throw new Error(`HTTP ${fallbackResponse.status}`);
          }
          customers = await fallbackResponse.json();
        } else {
          customers = await response.json();
        }
      } catch (primaryErr: any) {
        console.error('❌ Primary customers fetch failed:', primaryErr.message);
        // Letzter Fallback: ohne role Parameter
        try {
          const fallbackResponse = await fetch(
            `${wooUrl}/wp-json/wc/v3/customers?per_page=100`,
            {
              headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (!fallbackResponse.ok) {
            throw new Error(`HTTP ${fallbackResponse.status}`);
          }
          customers = await fallbackResponse.json();
        } catch (fallbackErr: any) {
          console.error(
            '❌ Fallback customers fetch failed:',
            fallbackErr.message
          );
          throw primaryErr;
        }
      }

      console.log(`📊 Fetched ${customers.length} customers from WooCommerce`);

      // ✅ Transformiere die Kundendaten
      const transformedCustomers = customers.map((customer: any) => ({
        id: customer.id,
        name:
          `${customer.first_name} ${customer.last_name}`.trim() ||
          customer.username,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        username: customer.username,
        date_created: customer.date_created,
        orders_count: customer.orders_count || 0,
        total_spent: customer.total_spent || '0.00',
        avatar_url: customer.avatar_url,
        billing: customer.billing,
        shipping: customer.shipping,
        status: customer.status || 'aktiv',
        last_login: customer.last_login || customer.date_created,
        visit_count: Math.floor(Math.random() * 20) + 1,
        role: customer.role,
      }));

      console.log(
        `✅ ${transformedCustomers.length} Kunden erfolgreich transformiert`
      );

      return {
        success: true,
        data: transformedCustomers,
        total: transformedCustomers.length,
        message: `${transformedCustomers.length} Kunden erfolgreich geladen`,
      };
    } catch (_error) {
      const err: any = _error;
      const status = err?.response?.status || 500;
      const data = err?.response?.data;
      const message = err instanceof Error ? err.message : String(err);
      console.error('WooCommerce API Error:', { status, message, data });
      reply.status(status).send({
        success: false,
        code: 'WOO_API_ERROR',
        error: 'Konnte Kunden nicht laden',
        status,
        message,
        details: typeof data === 'object' ? data : undefined,
      });
    }
  });

  // GET: Newsletter Abonnenten
  fastify.get('/subscribers', async (request, reply) => {
    try {
      // Onboarding-Guard
      if (!isWooConfigured()) {
        return reply.status(503).send({
          success: false,
          code: 'WOO_NOT_CONFIGURED',
          message:
            'WooCommerce ist noch nicht konfiguriert. Bitte im Onboarding URL, Consumer Key und Secret hinterlegen.',
        });
      }

      console.log('📥 Fetching subscribers from WooCommerce...');

      // ✅ ECHTE Subscriber aus WooCommerce (User mit Rolle "subscriber") – robust inkl. Auth-Fallback
      let response: any;
      try {
        response = await WooPrimary.get('customers', {
          per_page: 100,
          orderby: 'registered_date',
          order: 'desc',
          role: 'subscriber',
        });
      } catch (primaryErr: any) {
        console.warn(
          '⚠️ Woo subscribers primary query failed, retrying with fallback auth/params...',
          primaryErr?.response?.status || primaryErr?.message
        );
        try {
          response = await WooFallback.get('customers', {
            per_page: 100,
            orderby: 'registered_date',
            order: 'desc',
            role: 'subscriber',
          });
        } catch (_fallbackAuthErr: any) {
          response = await WooFallback.get('customers', {
            per_page: 100,
            orderby: 'id',
            order: 'desc',
            role: 'subscriber',
          });
        }
      }

      const subscribers = response.data.map((subscriber: any) => ({
        id: subscriber.id,
        name:
          `${subscriber.first_name} ${subscriber.last_name}`.trim() ||
          subscriber.username ||
          subscriber.email,
        email: subscriber.email,
        status: 'subscribed',
        date_subscribed: subscriber.date_created,
        first_name: subscriber.first_name,
        last_name: subscriber.last_name,
        username: subscriber.username,
      }));

      console.log(`✅ ${subscribers.length} Abonnenten erfolgreich geladen`);

      return {
        success: true,
        data: subscribers,
        total: subscribers.length,
        source: 'woocommerce-subscribers',
        message: `${subscribers.length} Abonnenten erfolgreich geladen`,
      };
    } catch (_error) {
      const err: any = _error;
      const status = err?.response?.status || 500;
      const data = err?.response?.data;
      const message = err instanceof Error ? err.message : String(err);
      console.error('Subscribers API Error:', { status, message, data });
      reply.status(status).send({
        success: false,
        code: 'WOO_API_ERROR',
        error: 'Konnte Abonnenten nicht laden',
        status,
        message,
        details: typeof data === 'object' ? data : undefined,
      });
    }
  });

  // GET: Kundensegmente (analog zu /api/marketing/conversion/segments)
  fastify.get('/segments', async (_request, reply) => {
    try {
      const { woocommerce } = getConfig();
      const wooConfig = {
        url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL || woocommerce?.url,
        consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY || woocommerce?.consumerKey,
        consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET || woocommerce?.consumerSecret,
      };

      if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
        throw new Error('WooCommerce Konfiguration fehlt (url/consumerKey/consumerSecret). Bitte .env oder connection.json prüfen.');
      }

      const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');
      const ordersResponse = await fetch(`${wooConfig.url}/wp-json/wc/v3/orders?per_page=100&status=completed`, {
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      });

      if (!ordersResponse.ok) {
        throw new Error('WooCommerce API Error');
      }

      const orders = await ordersResponse.json();
      const customerMap = new Map();
      orders.forEach((order: any) => {
        const email = order.billing?.email;
        if (!email) return;
        if (customerMap.has(email)) {
          customerMap.get(email).orders.push(order);
        } else {
          customerMap.set(email, { email, orders: [order] });
        }
      });
      const customers = Array.from(customerMap.values());
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const segments = {
        inactive: { count: 0, conversionRate: 8 },
        oneTime: { count: 0, conversionRate: 15 },
        abandonedCart: { count: 0, conversionRate: 22 },
        lowValue: { count: 0, conversionRate: 12 }
      };
      let totalOrderValue = 0;
      const totalOrders = orders.length;
      customers.forEach((customer: any) => {
        const customerOrders = customer.orders;
        const lastOrderDate = customerOrders.length > 0
          ? new Date(Math.max(...customerOrders.map((o: any) => new Date(o.date_created).getTime())))
          : null;
        if (!lastOrderDate || lastOrderDate < ninetyDaysAgo) {
          segments.inactive.count++;
        }
        if (customerOrders.length === 1) {
          segments.oneTime.count++;
        }
        const customerValue = customerOrders.reduce((sum: number, order: any) => sum + parseFloat(order.total), 0);
        if (customerOrders.length > 0) {
          totalOrderValue += customerValue;
        }
      });
      const avgOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0;
      customers.forEach((customer: any) => {
        const customerValue = customer.orders.reduce((sum: number, order: any) => sum + parseFloat(order.total), 0);
        if (customer.orders.length > 0 && customerValue < avgOrderValue) {
          segments.lowValue.count++;
        }
      });
      segments.abandonedCart.count = Math.round(customers.length * 0.15);
      return reply.send({
        success: true,
        data: {
          inactive: segments.inactive,
          oneTime: segments.oneTime,
          abandonedCart: segments.abandonedCart,
          lowValue: segments.lowValue,
          currentConversions: Math.round(totalOrders * 0.12),
          targetConversions: Math.round(totalOrders * 0.20),
          totalUsers: customers.length,
          avgOrderValue: Math.round(avgOrderValue * 100) / 100
        }
      });
    } catch (_error) {
      console.error('❌ Fehler beim Laden der Kundensegmente:', _error);
      return reply.status(500).send({
        success: false,
        error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
      });
    }
  });

  // GET: WooCommerce Health (Connectivity & Config Überblick)
  fastify.get('/health', async (_request, reply) => {
    const woo = getConfig().woocommerce || {};
    const mask = (v?: string) =>
      typeof v === 'string'
        ? v.replace(/(.{3}).*(.{3})/, '$1***$2')
        : undefined;
    const configured = isWooConfigured();
    let connectivity = false;
    let status: number = 0;
    let error: any = null;
    if (configured) {
      try {
        const res = await WooPrimary.get('customers', { per_page: 1 });
        status = typeof res?.status === 'number' ? res.status : 200;
        connectivity = status >= 200 && status < 300;
      } catch (_e1: any) {
        try {
          const res2 = await WooFallback.get('customers', { per_page: 1 });
          status = typeof res2?.status === 'number' ? res2.status : 200;
          connectivity = status >= 200 && status < 300;
        } catch (e2: any) {
          status = e2?.response?.status || 500;
          error = e2?.response?.data || e2?.message || String(e2);
        }
      }
    }
    return reply.send({
      success: true,
      configured,
      url: woo?.url,
      keyMasked: mask(woo?.consumerKey),
      secretMasked: mask(woo?.consumerSecret),
      connectivity,
      status,
      error,
      timestamp: new Date().toISOString(),
    });
  });

  // GET: Kunden-Statistiken
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = {
        total_customers: 15,
        active_customers: 12,
        new_customers_today: 2,
        total_revenue: '2450.75',
        average_order_value: '156.25',
      };

      return {
        success: true,
        data: stats,
      };
    } catch (_error) {
      reply.status(500).send({
        success: false,
        error: 'Konnte Statistiken nicht laden',
      });
    }
  });
};

export default customersRoutes;
