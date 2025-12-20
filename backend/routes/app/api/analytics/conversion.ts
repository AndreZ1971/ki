import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { registerConversionMLAnalysis } from './conversion/ml-analysis';
import { registerConversionReportMLAnalysis } from './conversion/ml-report-analysis';
import config from '../../../../config';

export default async function conversionRoutes(fastify: FastifyInstance) {
  // Registriere ML-Analysis Sub-Routes
  await fastify.register(registerConversionMLAnalysis, { prefix: '/ml' });
  await fastify.register(registerConversionReportMLAnalysis, { prefix: '/ml' });

  // GET /api/analytics/conversion/analysis
  fastify.get(
    '/analysis',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const wooConfig = {
          url: config.woocommerce?.url,
          consumerKey: config.woocommerce?.consumerKey,
          consumerSecret: config.woocommerce?.consumerSecret,
        };

        if (
          !wooConfig.url ||
          !wooConfig.consumerKey ||
          !wooConfig.consumerSecret
        ) {
          throw new Error(
            'WooCommerce Konfiguration fehlt (url/consumerKey/consumerSecret). Bitte connection.json prüfen.'
          );
        }

        const auth = Buffer.from(
          `${wooConfig.consumerKey}:${wooConfig.consumerSecret}`
        ).toString('base64');
        // Bestellungen der letzten 30 Tage abrufen
        const now = new Date();
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        const ordersResponse = await fetch(
          `${wooConfig.url}/wp-json/wc/v3/orders?per_page=100&status=completed&after=${thirtyDaysAgo.toISOString()}`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!ordersResponse.ok) {
          throw new Error('WooCommerce API Error');
        }
        const orders: any[] = await ordersResponse.json();
        // Kunden extrahieren
        const customerMap = new Map<string, { email: string; orders: any[] }>();
        orders.forEach((order: any) => {
          const email = order.billing?.email;
          if (!email) return;
          if (customerMap.has(email)) {
            customerMap.get(email)!.orders.push(order);
          } else {
            customerMap.set(email, { email, orders: [order] });
          }
        });
        const customers = Array.from(customerMap.values());
        // Conversion-Kennzahlen berechnen
        const totalOrders = orders.length;
        const totalCustomers = customers.length;
        const totalSales = orders.reduce(
          (sum: number, o: any) => sum + parseFloat(o.total),
          0
        );
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        // Conversion-Rate: Anteil Kunden, die bestellt haben (vereinfachte Logik)
        const conversionRate =
          totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;
        return reply.send({
          success: true,
          data: {
            totalOrders,
            totalCustomers,
            totalSales: Math.round(totalSales * 100) / 100,
            avgOrderValue: Math.round(avgOrderValue * 100) / 100,
            conversionRate: Math.round(conversionRate * 10) / 10,
            period: 'last30Days',
            lastUpdated: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error('Conversion Analysis Error:', error);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        });
      }
    }
  );

  // POST /api/analytics/conversion/analyze
  fastify.post(
    '/analyze',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Keine echten Datenquelle angebunden
      return reply.status(404).send({
        success: false,
        error: 'Keine Conversion-Datenquelle angebunden.',
      });
    }
  );

  // GET /api/analytics/conversion/funnel
  fastify.get(
    '/funnel',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        success: true,
        funnel: [
          { step: 'Landing Page', visitors: 5420, rate: 100 },
          { step: 'Product View', visitors: 3890, rate: 71.8 },
          { step: 'Add to Cart', visitors: 1240, rate: 31.9 },
          { step: 'Checkout Start', visitors: 840, rate: 67.7 },
          { step: 'Order Complete', visitors: 152, rate: 18.1 },
        ],
        dropoffAnalysis: {
          'Landing to Product': { lost: 1530, rate: 28.2 },
          'Product to Cart': { lost: 2650, rate: 68.1 },
          'Cart to Checkout': { lost: 400, rate: 32.3 },
          'Checkout to Complete': { lost: 688, rate: 81.9 },
        },
        timestamp: new Date().toISOString(),
      });
    }
  );
}
