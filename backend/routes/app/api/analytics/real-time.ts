import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getConfig } from '@config';
import { logger } from '../../../../logger';

const PER_PAGE = 100;
const MAX_PAGES = 5;

async function fetchAllDirect(path: string, params: Record<string, unknown> = {}) {
  const config = getConfig();
  const wooConfig = config.woocommerce;
  const base = wooConfig?.url?.replace(/\/+$|$/, '') || '';
  const key = wooConfig?.consumerKey || '';
  const secret = wooConfig?.consumerSecret || '';

  const baseURL = `${base}/wp-json/wc/v3`;
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');

  const all: any[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const queryParams = new URLSearchParams({
      per_page: String(PER_PAGE),
      page: String(page),
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    });

    const res = await fetch(`${baseURL}/${path}?${queryParams}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      logger.error({ path, page, status: res.status }, 'fetchAllDirect request failed');
      break;
    }

    const chunk = await res.json();
    logger.debug({
      path,
      page,
      isArray: Array.isArray(chunk),
      length: Array.isArray(chunk) ? chunk.length : 0
    }, 'fetchAllDirect page retrieved');

    if (Array.isArray(chunk)) {
      all.push(...chunk);
      if (chunk.length < PER_PAGE) break;
    }
  }
  return all;
}

function aggregateOrderStats(orders: any[]) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Montag als Wochenstart
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const completedOrders = orders.filter((o) => o?.status === 'completed');

  const sumForRange = (start: Date) =>
    completedOrders.reduce((sum: number, o: any) => {
      const created = o?.date_created ? new Date(o.date_created) : null;
      if (created && created >= start) {
        return sum + Number(o.total || 0);
      }
      return sum;
    }, 0);

  const countForRange = (start: Date) =>
    completedOrders.filter((o: any) => {
      const created = o?.date_created ? new Date(o.date_created) : null;
      return created && created >= start;
    }).length;

  const today = {
    total: sumForRange(startOfDay),
    orders: countForRange(startOfDay),
  };

  const thisWeek = {
    total: sumForRange(startOfWeek),
    orders: countForRange(startOfWeek),
  };

  const thisMonth = {
    total: sumForRange(startOfMonth),
    orders: countForRange(startOfMonth),
  };

  const avg = (total: number, ordersCount: number) => (ordersCount > 0 ? total / ordersCount : 0);

  return {
    completedOrders,
    failedOrders: orders.filter((o: any) => ['failed', 'cancelled', 'refunded', 'pending'].includes(o?.status)),
    today: { ...today, avgOrderValue: avg(today.total, today.orders) },
    thisWeek: { ...thisWeek, avgOrderValue: avg(thisWeek.total, thisWeek.orders) },
    thisMonth: { ...thisMonth, avgOrderValue: avg(thisMonth.total, thisMonth.orders) },
  };
}

function aggregateTopProducts(orders: any[]) {
  const productSales: Record<string, { quantity: number; revenue: number }> = {};
  for (const order of orders) {
    const items = Array.isArray(order?.line_items) ? order.line_items : [];
    for (const item of items) {
      const name = item?.name || 'Unbekanntes Produkt';
      const qty = Number(item?.quantity || 0);
      const revenue = Number(item?.total || 0);
      if (!productSales[name]) {
        productSales[name] = { quantity: 0, revenue: 0 };
      }
      productSales[name].quantity += qty;
      productSales[name].revenue += revenue;
    }
  }

  const topSelling = Object.entries(productSales)
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 10)
    .map(([name, stats], idx) => ({ id: idx + 1, name, sales: stats.quantity, revenue: stats.revenue }));

  const popularProduct = topSelling[0]?.name || 'Keine Daten';

  return { topSelling, popularProduct };
}

function computeUniqueCustomers(orders: any[], customers: any[]) {
  // Priorität 1: Direkter Customer-Count aus WooCommerce
  if (Array.isArray(customers) && customers.length > 0) {
    logger.debug({ count: customers.length }, 'Using direct customer count');
    return customers.length;
  }

  logger.warn('No direct customer data, calculating from orders');

  // Priorität 2: Eindeutige Billingingadressen (=kaufende Personen)
  const uniqueBillingAddresses = new Set<string>();
  const ids = new Set<string>();
  const emails = new Set<string>();

  for (const order of orders) {
    // Eindeutige ID des Kunden
    if (order?.customer_id && order.customer_id > 0) {
      ids.add(String(order.customer_id));
    }
    
    // E-Mail ist reliable Identifier
    const email = order?.billing?.email;
    if (email && typeof email === 'string') {
      emails.add(email.toLowerCase().trim());
    }
    
    // Billing-Adresse als Fingerprint
    const billing = order?.billing;
    if (billing?.first_name && billing?.last_name && billing?.email) {
      const fingerprint = `${billing.first_name}|${billing.last_name}|${billing.email}`.toLowerCase();
      uniqueBillingAddresses.add(fingerprint);
    }
  }

  // Nutze die zuverlässigste Metrik
  const emailCount = emails.size;
  const idCount = ids.size;
  const addressCount = uniqueBillingAddresses.size;

  // Fallback-Logik: 
  // - Wenn Emails > IDs, nutze Emails (=Gast-Orders haben keine IDs)
  // - Wenn Adressen > Emails, nutze Adressen (=mehrere Accounts pro Email)
  // - Fallback auf Orders-Länge als Worst-Case
  
  let uniqueCount = Math.max(emailCount, idCount, addressCount);
  if (uniqueCount === 0) {
    uniqueCount = orders.length; // Pessimistischer Fallback
  }

  logger.debug({
    totalOrders: orders.length,
    byId: idCount,
    byEmail: emailCount,
    byBillingAddress: addressCount,
    selected: uniqueCount
  }, 'Unique customers calculation');

  return uniqueCount;
}

export default async function realTimeRoutes(fastify: FastifyInstance) {
  // GET /api/analytics/real-time/dashboard
  fastify.get('/dashboard', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [products, orders, customers] = await Promise.all([
        fetchAllDirect('products', { status: 'publish' }),
        fetchAllDirect('orders', { status: 'completed' }),  // Nur completed Orders!
        fetchAllDirect('customers')
      ]);

      logger.debug({
        products: products.length,
        orders: orders.length,
        customers: customers.length,
        firstOrderCustomerId: orders[0]?.customer_id,
        firstOrderEmail: orders[0]?.billing?.email
      }, 'Dashboard raw data retrieved');

      const totalCustomers = computeUniqueCustomers(orders, customers);
      logger.debug({ totalCustomers }, 'Calculated total customers');

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const completedOrders = orders.filter((o: any) => o?.status === 'completed');
      const failedOrders = orders.filter((o: any) => ['failed', 'cancelled', 'refunded', 'pending'].includes(o?.status));

      const todaySales = completedOrders.reduce((sum: number, o: any) => {
        const created = o?.date_created ? new Date(o.date_created) : null;
        if (created && created >= startOfDay) {
          return sum + Number(o.total || 0);
        }
        return sum;
      }, 0);

      const conversionRate = orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0;

      const { popularProduct } = aggregateTopProducts(orders);

      return reply.send({
        success: true,
        data: {
          totalProducts: products.length,
          totalOrders: orders.length,
          totalCustomers,
          todaySales: Number(todaySales.toFixed(2)),
          conversionRate: Number(conversionRate.toFixed(2)),
          activeSessions: null, // nicht messbar ohne Tracking
          popularProduct,
          lastUpdated: new Date().toISOString(),
          activeUsers: null,
          avgSessionDuration: null,
          bounceRate: null,
          pageViews: null,
          failedOrders: failedOrders.length
        }
      });
    } catch (error: any) {
      logger.error({ error: error?.message }, 'Real-time dashboard failed');
      return reply.status(500).send({
        success: false,
        error: 'WooCommerce-Daten konnten nicht geladen werden',
        detail: error?.message || 'Unbekannter Fehler'
      });
    }
  });

  // GET /api/analytics/real-time/sales
  fastify.get('/sales', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orders = await fetchAllDirect('orders', { status: 'completed' });
      const { completedOrders, today, thisWeek, thisMonth } = aggregateOrderStats(orders);

      const recentOrders = completedOrders
        .sort((a: any, b: any) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
        .slice(0, 5)
        .map((o: any) => ({
          id: o.id,
          customer: o.billing?.first_name ? `${o.billing.first_name} ${o.billing?.last_name || ''}`.trim() : 'Gast',
          amount: Number(o.total || 0),
          createdAt: o.date_created
        }));

      return reply.send({
        success: true,
        sales: {
          today,
          thisWeek,
          thisMonth,
          realtimeOrders: recentOrders
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error({ error: error?.message }, 'Sales route failed');
      return reply.status(500).send({
        success: false,
        error: 'WooCommerce-Bestellungen konnten nicht geladen werden',
        detail: error?.message || 'Unbekannter Fehler'
      });
    }
  });

  // GET /api/analytics/real-time/visitors
  fastify.get('/visitors', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Keine Besucher-Tracking-Daten ohne Analytics-Integration
    return reply.status(501).send({
      success: false,
      error: 'Besucher-Tracking ist nicht integriert. Bitte Analytics-Tracking anbinden.',
      timestamp: new Date().toISOString()
    });
  });

  // GET /api/analytics/real-time/performance
  fastify.get('/performance', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(501).send({
      success: false,
      error: 'Performance-Metriken sind nicht integriert. Bitte Monitoring anbinden.',
      timestamp: new Date().toISOString()
    });
  });

  // GET /api/analytics/real-time/products
  fastify.get('/products', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [products, orders] = await Promise.all([
        fetchAllDirect('products', { status: 'publish' }),
        fetchAllDirect('orders', { status: 'completed' })  // Nur completed Orders!
      ]);

      const { topSelling } = aggregateTopProducts(orders);
      const lowStock = (Array.isArray(products) ? products : [])
        .filter((p: any) => Number(p?.stock_quantity ?? p?.stock_quantity) <= 5)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          stock: Number(p?.stock_quantity ?? 0)
        }));

      return reply.send({
        success: true,
        products: {
          topSelling,
          trending: [], // kein Tracking ohne Analytics
          lowStock
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error({ error: error?.message }, 'Products route failed');
      return reply.status(500).send({
        success: false,
        error: 'Produkte konnten nicht geladen werden',
        detail: error?.message || 'Unbekannter Fehler'
      });
    }
  });
}
