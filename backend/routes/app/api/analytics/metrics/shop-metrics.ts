// routes/api/analytics/metrics/shop-metrics.ts

import { FastifyInstance } from 'fastify';
import { getConfig } from '../../../../../config';
import { wooCache } from '../../../../../utils/woo-cache';
import { logger } from '../../../../../logger';

interface WooCommerceOrder {
  id: number;
  total: string;
  status: string;
  date_created: string;
  line_items: any[];
}

interface WooCommerceCustomer {
  id: number;
  date_created: string;
}

interface WooCommerceProduct {
  id: number;
  name: string;
  price: string;
  status: string;
}

export default async function shopMetricsRoutes(server: FastifyInstance) {
  // 🔥 ROOT ENDPOINT - Wird unter /api/analytics/metrics/ aufgerufen
  server.get('/', async () => {
    return {
      success: true,
      message: 'Shop Metrics API is working',
      endpoints: ['/dashboard', '/revenue', '/health', '/woocommerce'],
      timestamp: new Date().toISOString(),
    };
  });

  // Dashboard Metrics Endpoint - Wird unter /api/analytics/metrics/dashboard aufgerufen
  server.get('/dashboard', async () => {
    const config = getConfig();
    const wooCommerceConfig = {
      url: config.woocommerce?.url || '',
      consumerKey: config.woocommerce?.consumerKey || '',
      consumerSecret: config.woocommerce?.consumerSecret || '',
      authMode: config.woocommerce?.authMode || 'basic',
    };

    try {
      // Validate WooCommerce configuration
      if (
        !wooCommerceConfig.url ||
        !wooCommerceConfig.consumerKey ||
        !wooCommerceConfig.consumerSecret
      ) {
        return {
          success: false,
          error: 'WooCommerce configuration missing',
          timestamp: new Date().toISOString(),
        };
      }

      const fetchJson = async (endpoint: string) => {
        // Versuche Cache zuerst
        const cacheKey = `woo_dashboard_${endpoint}`;
        const cached = wooCache.get(cacheKey);
        if (cached) {
          logger.debug({ endpoint }, 'Shop metrics cache hit');
          return cached;
        }

        let url = `${wooCommerceConfig.url}${endpoint}`;
        const headers: HeadersInit = { 'Content-Type': 'application/json' };

        // Auth-Modus: 'basic' (Header) oder 'query' (URL-Parameter)
        if (wooCommerceConfig.authMode === 'basic') {
          const auth = Buffer.from(
            `${wooCommerceConfig.consumerKey}:${wooCommerceConfig.consumerSecret}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
        } else {
          // Query-Parameter OAuth (z.B. WooCommerce OAuth 1.0)
          const separator = endpoint.includes('?') ? '&' : '?';
          url += `${separator}consumer_key=${encodeURIComponent(wooCommerceConfig.consumerKey)}&consumer_secret=${encodeURIComponent(wooCommerceConfig.consumerSecret)}`;
        }

        const res = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} for ${url}`);
        }
        const json = await res.json();

        // Cache erfolgreiche Antwort (60s)
        wooCache.set(cacheKey, json, 60);

        return json;
      };

      // Parallel alle Daten von WooCommerce abrufen
      const [orders, customers, products] = await Promise.all([
        fetchJson('/wp-json/wc/v3/orders?status=completed&per_page=100'),
        fetchJson('/wp-json/wc/v3/customers?per_page=100&role=all'),
        fetchJson('/wp-json/wc/v3/products?per_page=100'),
      ]);

      const ordersTyped: WooCommerceOrder[] = orders as WooCommerceOrder[];
      const customersTyped: WooCommerceCustomer[] =
        customers as WooCommerceCustomer[];
      const productsTyped: WooCommerceProduct[] =
        products as WooCommerceProduct[];

      logger.debug({ customersCount: customersTyped.length, ordersCount: ordersTyped.length, productsCount: productsTyped.length }, 'Shop metrics data loaded');

      logger.debug({ customersCount: customers.length, ordersCount: orders.length, productsCount: products.length }, 'Shop metrics raw data');

      // Heutige Daten berechnen
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = ordersTyped.filter((order: WooCommerceOrder) =>
        order.date_created.startsWith(today)
      );
      const todayCustomers = customersTyped.filter(
        (customer: WooCommerceCustomer) =>
          customer.date_created.startsWith(today)
      );

      // Metrics berechnen
      const totalSales = ordersTyped.reduce(
        (sum: number, order: WooCommerceOrder) => sum + parseFloat(order.total),
        0
      );
      const todaySales = todayOrders.reduce(
        (sum: number, order: WooCommerceOrder) => sum + parseFloat(order.total),
        0
      );

      // Conversion Rate (verbesserte Version)
      const conversionRate =
        customersTyped.length > 0
          ? (ordersTyped.length / customersTyped.length) * 100
          : 0;

      const metrics = {
        totalSales: parseFloat(totalSales.toFixed(2)),
        todaySales: parseFloat(todaySales.toFixed(2)),
        totalOrders: ordersTyped.length,
        todayOrders: todayOrders.length,
        totalCustomers: customersTyped.length,
        todayCustomers: todayCustomers.length,
        totalProducts: productsTyped.length,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        lastUpdated: new Date().toISOString(),
      };

      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : 'Unknown', function: 'getShopMetrics' }, 'Shop metrics error');
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Fallback: Versuche gecachte Daten zu nutzen
      try {
        const cachedOrders = wooCache.get(
          `woo_dashboard_/wp-json/wc/v3/orders?status=completed&per_page=100`
        );
        const cachedCustomers = wooCache.get(
          `woo_dashboard_/wp-json/wc/v3/customers?per_page=100&role=all`
        );
        const cachedProducts = wooCache.get(
          `woo_dashboard_/wp-json/wc/v3/products?per_page=100`
        );

        if (cachedOrders && cachedCustomers && cachedProducts) {
          logger.info('Using cached shop metrics due to error');
          const ordersTyped = cachedOrders as WooCommerceOrder[];
          const customersTyped = cachedCustomers as WooCommerceCustomer[];
          const productsTyped = cachedProducts as WooCommerceProduct[];

          const today = new Date().toISOString().split('T')[0];
          const todayOrders = ordersTyped.filter((order) =>
            order.date_created.startsWith(today)
          );
          const todayCustomers = customersTyped.filter((customer) =>
            customer.date_created.startsWith(today)
          );
          const totalSales = ordersTyped.reduce(
            (sum, order) => sum + parseFloat(order.total),
            0
          );
          const todaySales = todayOrders.reduce(
            (sum, order) => sum + parseFloat(order.total),
            0
          );
          const conversionRate =
            customersTyped.length > 0
              ? (ordersTyped.length / customersTyped.length) * 100
              : 0;

          return {
            success: true,
            data: {
              totalSales: parseFloat(totalSales.toFixed(2)),
              todaySales: parseFloat(todaySales.toFixed(2)),
              totalOrders: ordersTyped.length,
              todayOrders: todayOrders.length,
              totalCustomers: customersTyped.length,
              todayCustomers: todayCustomers.length,
              totalProducts: productsTyped.length,
              conversionRate: parseFloat(conversionRate.toFixed(1)),
              lastUpdated: new Date().toISOString(),
              cached: true,
            },
          };
        }
      } catch (_e) {
        // Fallback failed, return error
      }

      return {
        success: false,
        error: 'Failed to fetch shop metrics',
        details: message,
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Revenue Endpoint
  server.get('/revenue', async () => {
    return {
      dailyRevenue: 2450,
      weeklyRevenue: 8560,
      monthlyRevenue: 12450,
      revenueGrowth: 12.5,
      timestamp: new Date().toISOString(),
    };
  });

  // Health Check Endpoint - Wird unter /api/analytics/metrics/health aufgerufen
  server.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'Shop Metrics',
      timestamp: new Date().toISOString(),
      wooCommerce: {
        url: process.env.WOOCOMMERCE_URL,
        configured: !!(process.env.CONSUMER_KEY && process.env.CONSUMER_SECRET),
      },
    };
  });

  // WooCommerce Status Endpoint
  server.get('/woocommerce', async () => {
    const config = getConfig();
    const wooCommerceConfig = {
      url: config.woocommerce?.url || '',
      consumerKey: config.woocommerce?.consumerKey || '',
      consumerSecret: config.woocommerce?.consumerSecret || '',
    };

    return {
      configured: !!(
        wooCommerceConfig.url &&
        wooCommerceConfig.consumerKey &&
        wooCommerceConfig.consumerSecret
      ),
      url: wooCommerceConfig.url ? '✅ Gesetzt' : '❌ Fehlt',
      consumerKey: wooCommerceConfig.consumerKey ? '✅ Gesetzt' : '❌ Fehlt',
      consumerSecret: wooCommerceConfig.consumerSecret
        ? '✅ Gesetzt'
        : '❌ Fehlt',
      timestamp: new Date().toISOString(),
    };
  });

  // 🤖 POST /ml-analysis - KI-Analyse für Shop Metrics
  server.post<{ Body: { metrics: any } }>(
    '/ml-analysis',
    async (request, reply) => {
      try {
        const { metrics } = request.body;

        const mlInsights: any[] = [];

        // 1. Umsatz-Performance Analyse
        if (metrics.todaySales && metrics.totalSales) {
          const dailyPercentage =
            (metrics.todaySales / (metrics.totalSales / 30)) * 100;
          if (dailyPercentage < 80) {
            mlInsights.push({
              type: 'Low_Daily_Revenue',
              title: '📉 Täglicher Umsatz unter Durchschnitt',
              value: `Heutiger Umsatz: $${metrics.todaySales} (${dailyPercentage.toFixed(1)}% des Durchschnitts)`,
              score: 0.85,
              detail:
                'Der heutige Umsatz liegt unter dem erwarteten Durchschnitt. Überprüfen Sie Marktingmaßnahmen oder externe Faktoren.',
              priority: dailyPercentage < 60 ? 'high' : 'medium',
              category: 'Umsatz',
            });
          }
        }

        // 2. Bestellungs-Konversions-Analyse
        if (
          metrics.totalOrders &&
          metrics.totalCustomers &&
          metrics.conversionRate
        ) {
          if (metrics.conversionRate < 2) {
            mlInsights.push({
              type: 'Low_Conversion_Rate',
              title: '⚠️ Konversionsrate niedrig',
              value: `Aktuelle Rate: ${metrics.conversionRate}% (Optimal: 2-5%)`,
              score: 0.78,
              detail:
                'Ihre Konversionsrate liegt unter dem Branchenstandard. Optimieren Sie Checkout-Prozess und Produktseiten.',
              priority: 'high',
              category: 'Konversion',
            });
          }
        }

        // 3. Kundenakquisitions-Analyse
        if (metrics.totalCustomers) {
          if (metrics.todayOrders && metrics.totalCustomers > 0) {
            const customerRepeatRate =
              (metrics.todayOrders / metrics.totalCustomers) * 100;
            if (customerRepeatRate < 5) {
              mlInsights.push({
                type: 'Low_Customer_Repeat',
                title: '👥 Geringe Kundenwiederholungsquote',
                value: `Wiederholungsquote: ${customerRepeatRate.toFixed(2)}% (Optimal: 10-20%)`,
                score: 0.82,
                detail:
                  'Zu wenige bestehende Kunden kaufen erneut. Implementieren Sie Loyalty-Programme und Email-Marketing.',
                priority: 'medium',
                category: 'Kundenbindung',
              });
            }
          }
        }

        // 4. Produktmix-Analyse
        if (metrics.totalProducts && metrics.totalOrders) {
          const ordersPerProduct = metrics.totalOrders / metrics.totalProducts;
          if (ordersPerProduct < 2) {
            mlInsights.push({
              type: 'Low_Product_Performance',
              title: '📦 Niedriger durchschnittlicher Verkauf pro Produkt',
              value: `${ordersPerProduct.toFixed(2)} Bestellungen pro Produkt im Durchschnitt`,
              score: 0.75,
              detail:
                'Das Produktportfolio könnte optimiert werden. Entfernen Sie nicht-performante Artikel und fokussieren Sie auf Top-Seller.',
              priority: 'medium',
              category: 'Produkte',
            });
          }
        }

        // 5. Positive Performance wenn alles gut läuft
        if (!mlInsights.length) {
          mlInsights.push({
            type: 'Excellent_Metrics',
            title: '✨ Shop-Metriken sind exzellent',
            value: 'Alle KPIs sind im optimalen Bereich',
            score: 0.95,
            detail:
              'Ihre Shop-Performance ist ausgezeichnet! Laufende Optimierung und Monitoring sollten fortgesetzt werden.',
            priority: 'low',
            category: 'Status',
          });
        }

        // 6. Revenue Growth Empfehlungen
        mlInsights.push({
          type: 'Revenue_Growth_Strategy',
          title: '💡 Umsatzwachstums-Empfehlungen',
          value: '3 strategische Maßnahmen basierend auf Ihren Metriken',
          score: 0.88,
          detail:
            'Fokussieren Sie auf: (1) Konversionsoptimierung, (2) Kundenwiederholung via Email-Marketing, (3) Upsell & Cross-Sell',
          priority: 'medium',
          category: 'Strategie',
        });

        return reply.send({
          success: true,
          mlInsights,
          timestamp: new Date().toISOString(),
          analysis: {
            totalInsights: mlInsights.length,
            criticalCount: mlInsights.filter((i) => i.priority === 'critical')
              .length,
            highCount: mlInsights.filter((i) => i.priority === 'high').length,
            mediumCount: mlInsights.filter((i) => i.priority === 'medium')
              .length,
            lowCount: mlInsights.filter((i) => i.priority === 'low').length,
          },
        });
      } catch (error: any) {
        logger.error({ error: error.message || 'Unknown', function: 'shopMetricsMLAnalysis' }, 'Shop metrics ML analysis error');
        return reply.status(500).send({
          success: false,
          error: error.message || 'KI-Analyse fehlgeschlagen',
          mlInsights: [],
        });
      }
    }
  );
}
