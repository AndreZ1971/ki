// backend/routes/app/api/marketing/content-routes.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface CreateDigitalProductBody {
  contentTitle: string;
  contentType: string;
  monetizationStrategy: string;
  pricing: number;
}

export default async function contentRoutes(server: FastifyInstance) {
  // GET /api/marketing/content/revenue - Lade Revenue-Daten
  server.get('/api/marketing/content/revenue', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const wooConfig = {
        url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
        consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
        consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
      };

      const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');

      // Lade Bestellungen und Produkte
      const [ordersResponse, productsResponse] = await Promise.all([
        fetch(`${wooConfig.url}/wp-json/wc/v3/orders?per_page=100&status=completed`, {
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        }),
        fetch(`${wooConfig.url}/wp-json/wc/v3/products?per_page=100`, {
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        })
      ]);

      if (!ordersResponse.ok || !productsResponse.ok) {
        throw new Error('WooCommerce API Error');
      }

      const orders = await ordersResponse.json();
      const products = await productsResponse.json();

      // Filtere digitale/downloadable Produkte
      const digitalProducts = products.filter((p: any) => 
        p.downloadable || p.virtual || p.type === 'subscription'
      );

      // Berechne Revenue
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let todayRevenue = 0;
      let weekRevenue = 0;
      let monthRevenue = 0;
      let totalRevenue = 0;

      orders.forEach((order: any) => {
        const orderDate = new Date(order.date_created);
        const orderTotal = parseFloat(order.total);

        // Prüfe ob Bestellung digitale Produkte enthält
        const hasDigitalProducts = order.line_items?.some((item: any) => {
          const product = digitalProducts.find((p: any) => p.id === item.product_id);
          return product !== undefined;
        });

        if (hasDigitalProducts) {
          totalRevenue += orderTotal;

          if (orderDate > oneDayAgo) {
            todayRevenue += orderTotal;
          }

          if (orderDate > sevenDaysAgo) {
            weekRevenue += orderTotal;
          }

          if (orderDate > thirtyDaysAgo) {
            monthRevenue += orderTotal;
          }
        }
      });

      return reply.send({
        success: true,
        data: {
          today: Math.round(todayRevenue * 100) / 100,
          week: Math.round(weekRevenue * 100) / 100,
          month: Math.round(monthRevenue * 100) / 100,
          total: Math.round(totalRevenue * 100) / 100,
          productCount: digitalProducts.length
        }
      });
    } catch (_error) {
      console.error('❌ Error loading revenue data:', _error);
      return reply.status(500).send({
        success: false,
        error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
      });
    }
  });

  // POST /api/marketing/content/create-digital-product - Erstelle digitales Produkt
  server.post<{ Body: CreateDigitalProductBody }>(
    '/api/marketing/content/create-digital-product',
    async (request: FastifyRequest<{ Body: CreateDigitalProductBody }>, reply: FastifyReply) => {
      try {
        const { contentTitle, contentType, monetizationStrategy, pricing } = request.body;

        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
        };

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');

        // Erstelle WooCommerce-Produkt
        const productData: any = {
          name: contentTitle,
          type: monetizationStrategy === 'subscription' ? 'subscription' : 'simple',
          regular_price: pricing.toString(),
          downloadable: contentType === 'downloadable' || contentType === 'digital',
          virtual: contentType === 'virtual' || contentType === 'digital',
          description: `Digitales Produkt: ${contentType}`,
          short_description: `Monetarisiert über: ${monetizationStrategy}`,
          manage_stock: false,
          status: 'publish'
        };

        const response = await fetch(`${wooConfig.url}/wp-json/wc/v3/products`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData)
        });

        if (!response.ok) {
          throw new Error(`WooCommerce API Error: ${response.status}`);
        }

        const product = await response.json();

        console.log(`✅ Digitales Produkt erstellt: ${product.name} (ID: ${product.id})`);

        return reply.send({
          success: true,
          message: `Digitales Produkt "${product.name}" erfolgreich erstellt`,
          data: {
            productId: product.id,
            name: product.name,
            price: product.regular_price,
            permalink: product.permalink
          }
        });
      } catch (_error) {
        console.error('❌ Error creating digital product:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );
}
