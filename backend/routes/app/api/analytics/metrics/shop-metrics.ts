// routes/api/analytics/metrics/shop-metrics.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

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

export default async function shopMetricsRoutes(server: FastifyInstance, options: any) {
  
  // 🔥 ROOT ENDPOINT - Wird unter /api/analytics/metrics/ aufgerufen
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      success: true,
      message: 'Shop Metrics API is working',
      endpoints: [
        '/dashboard',
        '/revenue',
        '/health',
        '/woocommerce'
      ],
      timestamp: new Date().toISOString()
    };
  });

  // Dashboard Metrics Endpoint - Wird unter /api/analytics/metrics/dashboard aufgerufen
  server.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const wooCommerceConfig = {
        url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
        consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
        consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
      };

      // Basic Auth für WooCommerce API
      const auth = Buffer.from(`${wooCommerceConfig.consumerKey}:${wooCommerceConfig.consumerSecret}`).toString('base64');

      // Parallel alle Daten von WooCommerce abrufen
      const [ordersResponse, customersResponse, productsResponse] = await Promise.all([
        fetch(`${wooCommerceConfig.url}/wp-json/wc/v3/orders?status=completed&per_page=100`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${wooCommerceConfig.url}/wp-json/wc/v3/customers?per_page=100&role=all`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${wooCommerceConfig.url}/wp-json/wc/v3/products?per_page=100`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!ordersResponse.ok || !customersResponse.ok) {
        throw new Error('WooCommerce API Error');
      }

      const orders: WooCommerceOrder[] = await ordersResponse.json();
      const customers: WooCommerceCustomer[] = await customersResponse.json();
      const products = await productsResponse.json();

      console.log(`📊 Shop Metrics - Customers found: ${customers.length}`);
      console.log(`📊 Shop Metrics - Orders found: ${orders.length}`);
      console.log(`📊 Shop Metrics - Products found: ${products.length}`);

      // Heutige Daten berechnen
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(order => order.date_created.startsWith(today));
      const todayCustomers = customers.filter(customer => customer.date_created.startsWith(today));

      // Metrics berechnen
      const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const todaySales = todayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      
      // Conversion Rate (vereinfacht - kann später verfeinert werden)
      const conversionRate = orders.length > 0 ? (orders.length / 1000 * 100) : 0;

      const metrics = {
        totalSales,
        todaySales: parseFloat(todaySales.toFixed(2)),
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        totalCustomers: customers.length,
        todayCustomers: todayCustomers.length,
        totalProducts: products.length,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        lastUpdated: new Date().toISOString()
      };

      return reply.send({
        success: true,
        data: metrics
      });

    } catch (_error) {
      console.error('Shop Metrics Error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch shop metrics'
      });
    }
  });

  // Revenue Endpoint
  server.get('/revenue', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      dailyRevenue: 2450,
      weeklyRevenue: 8560,
      monthlyRevenue: 12450,
      revenueGrowth: 12.5,
      timestamp: new Date().toISOString()
    };
  });

  // Health Check Endpoint - Wird unter /api/analytics/metrics/health aufgerufen
  server.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ 
      status: 'healthy', 
      service: 'Shop Metrics',
      timestamp: new Date().toISOString(),
      wooCommerce: {
        url: process.env.WOOCOMMERCE_URL,
        configured: !!(process.env.CONSUMER_KEY && process.env.CONSUMER_SECRET)
      }
    });
  });

  // WooCommerce Status Endpoint
  server.get('/woocommerce', async (request: FastifyRequest, reply: FastifyReply) => {
    const wooCommerceConfig = {
      url: process.env.WOOCOMMERCE_URL,
      consumerKey: process.env.CONSUMER_KEY,
      consumerSecret: process.env.CONSUMER_SECRET,
    };

    return {
      configured: !!(wooCommerceConfig.url && wooCommerceConfig.consumerKey && wooCommerceConfig.consumerSecret),
      url: wooCommerceConfig.url ? '✅ Gesetzt' : '❌ Fehlt',
      consumerKey: wooCommerceConfig.consumerKey ? '✅ Gesetzt' : '❌ Fehlt',
      consumerSecret: wooCommerceConfig.consumerSecret ? '✅ Gesetzt' : '❌ Fehlt',
      timestamp: new Date().toISOString()
    };
  });
}