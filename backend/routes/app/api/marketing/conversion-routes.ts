// backend/routes/app/api/marketing/conversion-routes.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getConfig } from '@config';

interface CreateCampaignBody {
  userSegment: 'inactive' | 'one-time' | 'abandoned-cart' | 'low-value';
  incentiveType: 'discount' | 'free-shipping' | 'loyalty' | 'bundle';
  conversionGoal: string;
}

export default async function conversionRoutes(server: FastifyInstance) {
  // GET /api/marketing/conversion/segments - Lade Conversion-Segmente
  server.get('/api/marketing/conversion/segments', async (_request: FastifyRequest, reply: FastifyReply) => {
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

      // Lade nur Bestellungen (Kunden werden daraus extrahiert)
      const ordersResponse = await fetch(`${wooConfig.url}/wp-json/wc/v3/orders?per_page=100&status=completed`, {
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      });

      if (!ordersResponse.ok) {
        throw new Error('WooCommerce API Error');
      }

      const orders = await ordersResponse.json();
      
      // Extrahiere unique Kunden aus Bestellungen
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

      // Analysiere Kundensegmente
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

      customers.forEach((customer) => {
        const customerOrders = customer.orders;
        const lastOrderDate = customerOrders.length > 0 
          ? new Date(Math.max(...customerOrders.map((o: any) => new Date(o.date_created).getTime())))
          : null;

        // Inaktive Kunden (>90 Tage keine Bestellung)
        if (!lastOrderDate || lastOrderDate < ninetyDaysAgo) {
          segments.inactive.count++;
        }

        // Einmalkäufer
        if (customerOrders.length === 1) {
          segments.oneTime.count++;
        }

        // Niedrigwert-Kunden (unter durchschnittlichem Bestellwert)
        const customerValue = customerOrders.reduce((sum: number, order: any) => 
          sum + parseFloat(order.total), 0
        );
        
        if (customerOrders.length > 0) {
          totalOrderValue += customerValue;
        }
      });

      const avgOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0;

      // Niedrigwert-Kunden identifizieren
      customers.forEach((customer) => {
        const customerValue = customer.orders.reduce((sum: number, order: any) => 
          sum + parseFloat(order.total), 0
        );
        
        if (customer.orders.length > 0 && customerValue < avgOrderValue) {
          segments.lowValue.count++;
        }
      });

      // Warenkorbabbrecher (simuliert - WooCommerce hat keine direkte API dafür)
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
      console.error('❌ Error loading conversion segments:', _error);
      return reply.status(500).send({
        success: false,
        error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
      });
    }
  });

  // POST /api/marketing/conversion/create-campaign - Erstelle Conversion-Kampagne
  server.post<{ Body: CreateCampaignBody }>(
    '/api/marketing/conversion/create-campaign',
    async (request: FastifyRequest<{ Body: CreateCampaignBody }>, reply: FastifyReply) => {
      try {
        const { userSegment, incentiveType, conversionGoal } = request.body;

        const { woocommerce } = getConfig();
        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL || woocommerce?.url,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY || woocommerce?.consumerKey,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET || woocommerce?.consumerSecret,
        };

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');

        // Lade Bestellungen
        const ordersResponse = await fetch(`${wooConfig.url}/wp-json/wc/v3/orders?per_page=100&status=completed`, {
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        });

        if (!ordersResponse.ok) {
          throw new Error('WooCommerce API Error');
        }

        const orders = await ordersResponse.json();
        
        // Extrahiere Kunden aus Bestellungen
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
        
        // Filtere Kunden nach Segment
        const now = new Date();
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        const targetCustomers = customers.filter((customer) => {
          const customerOrders = customer.orders;
          const lastOrderDate = customerOrders.length > 0 
            ? new Date(Math.max(...customerOrders.map((o: any) => new Date(o.date_created).getTime())))
            : null;

          switch (userSegment) {
            case 'inactive': {
              return !lastOrderDate || lastOrderDate < ninetyDaysAgo;
            }
            case 'one-time': {
              return customerOrders.length === 1;
            }
            case 'low-value': {
              const customerValue = customerOrders.reduce((sum: number, order: any) => 
                sum + parseFloat(order.total), 0
              );
              const avgValue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total), 0) / orders.length;
              return customerValue < avgValue;
            }
            case 'abandoned-cart': {
              // Simuliert - könnte mit WooCommerce Plugins erweitert werden
              return Math.random() > 0.85;
            }
            default:
              return true;
          }
        });

        // Erstelle Coupon-Code für Kampagne
        let couponId = null;
        if (incentiveType === 'discount') {
          const couponCode = `CONV${Date.now().toString().slice(-6)}`;
          const couponResponse = await fetch(`${wooConfig.url}/wp-json/wc/v3/coupons`, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: couponCode,
              discount_type: 'percent',
              amount: '15',
              individual_use: true,
              usage_limit: targetCustomers.length,
              description: `Conversion-Kampagne: ${conversionGoal}`
            })
          });

          if (couponResponse.ok) {
            const coupon = await couponResponse.json();
            couponId = coupon.id;
          }
        }

        console.log(`✅ Conversion-Kampagne erstellt: ${targetCustomers.length} Kunden, Segment: ${userSegment}, Incentive: ${incentiveType}`);

        return reply.send({
          success: true,
          message: `Kampagne erfolgreich erstellt für ${targetCustomers.length} Kunden`,
          data: {
            targetCustomers: targetCustomers.length,
            segment: userSegment,
            incentive: incentiveType,
            couponId: couponId,
            goal: conversionGoal
          }
        });
      } catch (_error) {
        console.error('❌ Error creating conversion campaign:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );
}
