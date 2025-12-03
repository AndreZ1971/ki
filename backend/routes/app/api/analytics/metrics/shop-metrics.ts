// routes/api/analytics/metrics/shop-metrics.ts

import { FastifyInstance } from 'fastify';
import config from '../../../../../config';

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
  server.get('/dashboard', async () => {
    try {

      const wooCommerceConfig = {
        url: config.woocommerce?.url || '',
        consumerKey: config.woocommerce?.consumerKey || '',
        consumerSecret: config.woocommerce?.consumerSecret || '',
      };

      // Validate WooCommerce configuration
      if (!wooCommerceConfig.url || !wooCommerceConfig.consumerKey || !wooCommerceConfig.consumerSecret) {
        return {
          success: false,
          error: 'WooCommerce configuration missing',
          timestamp: new Date().toISOString()
        };
      }

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

      if (!ordersResponse.ok || !customersResponse.ok || !productsResponse.ok) {
        throw new Error(`WooCommerce API Error: Orders: ${ordersResponse.status}, Customers: ${customersResponse.status}, Products: ${productsResponse.status}`);
      }

      const orders: WooCommerceOrder[] = await ordersResponse.json();
      const customers: WooCommerceCustomer[] = await customersResponse.json();
      const products: WooCommerceProduct[] = await productsResponse.json();

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
      
      // Conversion Rate (verbesserte Version)
      const conversionRate = customers.length > 0 ? (orders.length / customers.length * 100) : 0;

      const metrics = {
        totalSales: parseFloat(totalSales.toFixed(2)),
        todaySales: parseFloat(todaySales.toFixed(2)),
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        totalCustomers: customers.length,
        todayCustomers: todayCustomers.length,
        totalProducts: products.length,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        lastUpdated: new Date().toISOString()
      };

      return {
        success: true,
        data: metrics
      };

    } catch (error) {
      console.error('Shop Metrics Error:', error);
      return {
        success: false,
        error: 'Failed to fetch shop metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
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
        configured: !!(process.env.CONSUMER_KEY && process.env.CONSUMER_SECRET)
      }
    };
  });

  // WooCommerce Status Endpoint
  server.get('/woocommerce', async () => {
    const wooCommerceConfig = {
      url: config.woocommerce?.url || '',
      consumerKey: config.woocommerce?.consumerKey || '',
      consumerSecret: config.woocommerce?.consumerSecret || '',
    };

    return {
      configured: !!(wooCommerceConfig.url && wooCommerceConfig.consumerKey && wooCommerceConfig.consumerSecret),
      url: wooCommerceConfig.url ? '✅ Gesetzt' : '❌ Fehlt',
      consumerKey: wooCommerceConfig.consumerKey ? '✅ Gesetzt' : '❌ Fehlt',
      consumerSecret: wooCommerceConfig.consumerSecret ? '✅ Gesetzt' : '❌ Fehlt',
      timestamp: new Date().toISOString()
    };
  });
} // ← Fehlende schließende Klammer hinzugefügt