// backend/routes/app/api/woocommerce/customers.ts
import { FastifyPluginAsync } from 'fastify';

import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import config from '../../../../config';

const customersRoutes: FastifyPluginAsync = async (fastify, _options) => {
  // Helper: Prüfe, ob WooCommerce konfiguriert ist (Onboarding kann Placeholder setzen)
  const isWooConfigured = (): boolean => {
    const woo = config.woocommerce || ({} as any);
    const missing = !woo.url || !woo.consumerKey || !woo.consumerSecret;
    const looksPlaceholder = (v: string) =>
      typeof v === 'string' && (v.startsWith('PLEASE_SET') || v.trim() === '');

    if (missing) return false;
    if (
      looksPlaceholder(woo.url) ||
      looksPlaceholder(woo.consumerKey) ||
      looksPlaceholder(woo.consumerSecret)
    )
      return false;
    return true;
  };

  // WooCommerce Client initialisieren
  const WooCommerce = new WooCommerceRestApi({
    url: config.woocommerce?.url || '',
    consumerKey: config.woocommerce?.consumerKey || '',
    consumerSecret: config.woocommerce?.consumerSecret || '',
    version: 'wc/v3',
  });

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

      // Echte WooCommerce API Integration - robust mit Fallback-Parametern
      let response: any;
      try {
        response = await WooCommerce.get('customers', {
          per_page: 100, // Hole bis zu 100 Kunden
          orderby: 'registered_date',
          order: 'desc',
          // role: 'all', // Manche Installationen unterstützen diesen Filter nicht zuverlässig
        });
      } catch (primaryErr: any) {
        console.warn(
          '⚠️ Woo customers primary query failed, retrying with fallback params...',
          primaryErr?.response?.status || primaryErr?.message
        );
        response = await WooCommerce.get('customers', {
          per_page: 100,
          orderby: 'id',
          order: 'desc',
        });
      }

      const customers = response.data.map((customer: any) => ({
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
        // ✅ Zusätzliche Metriken
        status: customer.status || 'aktiv',
        last_login: customer.last_login || customer.date_created,
        visit_count: Math.floor(Math.random() * 20) + 1, // TODO: Aus Analytics-DB abrufen
        role: customer.role,
      }));

      console.log(`✅ ${customers.length} Kunden erfolgreich geladen`);

      return {
        success: true,
        data: customers,
        total: customers.length,
        message: `${customers.length} Kunden erfolgreich geladen`,
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

      // ✅ ECHTE Subscriber aus WooCommerce (User mit Rolle "subscriber") – robust mit Fallback
      let response: any;
      try {
        response = await WooCommerce.get('customers', {
          per_page: 100,
          orderby: 'registered_date',
          order: 'desc',
          role: 'subscriber', // Nur Subscriber-Rolle
        });
      } catch (primaryErr: any) {
        console.warn(
          '⚠️ Woo subscribers primary query failed, retrying with fallback params...',
          primaryErr?.response?.status || primaryErr?.message
        );
        response = await WooCommerce.get('customers', {
          per_page: 100,
          orderby: 'id',
          order: 'desc',
          role: 'subscriber',
        });
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

  // GET: WooCommerce Health (Connectivity & Config Überblick)
  fastify.get('/health', async (_request, reply) => {
    const woo = (config as any).woocommerce || {};
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
        const res = await WooCommerce.get('customers', { per_page: 1 });
        status = typeof res?.status === 'number' ? res.status : 200;
        connectivity = status >= 200 && status < 300;
      } catch (e: any) {
        status = e?.response?.status || 500;
        error = e?.response?.data || e?.message || String(e);
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
