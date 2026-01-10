// backend/routes/app/api/marketing/content-routes.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getConfig } from '@config';
import { logger } from '../../../../logger';

interface CreateDigitalProductBody {
  contentTitle: string;
  contentType: string;
  monetizationStrategy: string;
  pricing: number;
}

export default async function contentRoutes(server: FastifyInstance) {
  // GET /api/marketing/content/price-recommendation - KI/heuristische Preisempfehlung
  server.get('/api/marketing/content/price-recommendation', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query: any = request.query || {};
      const contentType = query.contentType || 'digital';
      const strategy = query.strategy || 'one-time';
      const basePrice = parseFloat(query.basePrice) || 49;

      // simple heuristic
      const multipliers: Record<string, number> = {
        'digital': 1.0,
        'downloadable': 0.85,
        'virtual': 1.2,
        'subscription': 0.6,
        'course': 1.6,
        'template': 1.1
      };

      const strategyBoost: Record<string, number> = {
        'one-time': 1.0,
        'subscription': 1.05,
        'freemium': 0.9,
        'tiered': 1.15
      };

      const mult = (multipliers[contentType] || 1) * (strategyBoost[strategy] || 1);
      const recommended = Math.max(5, Math.round(basePrice * mult * 100) / 100);
      const floor = Math.max(3, Math.round(recommended * 0.85 * 100) / 100);
      const ceil = Math.round(recommended * 1.15 * 100) / 100;

      return reply.send({
        success: true,
        data: {
          recommendedPrice: recommended,
          range: { min: floor, max: ceil },
          reasoning: `Basierend auf ${contentType} + ${strategy} empfehlen wir ~€${recommended}.`
        }
      });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // POST /api/marketing/content/generate-copy - KI Offer Copy
  server.post('/api/marketing/content/generate-copy', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body: any = request.body || {};
      const { contentTitle = 'Dein Produkt', contentType = 'digital', monetizationStrategy = 'one-time', pricing = 49 } = body;

      const { openAI } = getConfig();
      const apiKey = process.env.OPENAI_API_KEY || openAI?.apiKey;
      const model = process.env.OPENAI_MODEL || openAI?.model || 'gpt-4o-mini';

      const prompt = `Schreibe eine kurze Angebotsbeschreibung (max 80 Wörter) für ein Produkt.
Titel: ${contentTitle}
Typ: ${contentType}
Monetarisierung: ${monetizationStrategy}
Preis: €${pricing}
Liefer ein JSON { "headline": "...", "body": "...", "cta": "..." }.`;

      let copy; 
      if (apiKey) {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.6, max_tokens: 220 })
        });
        if (!res.ok) throw new Error(`OpenAI Error ${res.status}`);
        const json: any = await res.json();
        try {
          copy = JSON.parse(json.choices?.[0]?.message?.content || '{}');
        } catch {
          copy = undefined;
        }
      }

      if (!copy || !copy.headline) {
        copy = {
          headline: `${contentTitle}: Jetzt sichern`,
          body: `Starte sofort mit unserem ${contentType}. Bequem online, fairer Preis (€${pricing}), ideal für ${monetizationStrategy}.`,
          cta: 'Jetzt kaufen'
        };
      }

      return reply.send({ success: true, data: copy });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  // GET /api/marketing/content/revenue-forecast - simple forecast
  server.get('/api/marketing/content/revenue-forecast', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      // reuse revenue calculation by calling internal handler would be ideal; recompute minimal
      const { woocommerce } = getConfig();
      const wooConfig = {
        url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL || woocommerce?.url,
        consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY || woocommerce?.consumerKey,
        consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET || woocommerce?.consumerSecret,
      };
      if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
        throw new Error('WooCommerce Konfiguration fehlt (url/consumerKey/consumerSecret).');
      }
      const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');
      const ordersResponse = await fetch(`${wooConfig.url}/wp-json/wc/v3/orders?per_page=100&status=completed`, {
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      });
      if (!ordersResponse.ok) throw new Error('WooCommerce API Error');
      const orders = await ordersResponse.json();

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      let weekSum = 0;
      let dayCount = 0;
      const revenuePerDay: Record<string, number> = {};

      orders.forEach((order: any) => {
        const orderDate = new Date(order.date_created);
        const dayKey = orderDate.toISOString().slice(0, 10);
        if (!revenuePerDay[dayKey]) revenuePerDay[dayKey] = 0;
        revenuePerDay[dayKey] += parseFloat(order.total);
      });

      Object.entries(revenuePerDay).forEach(([day, value]) => {
        const d = new Date(day);
        if (d >= sevenDaysAgo) {
          weekSum += value;
          dayCount += 1;
        }
      });

      const avgDay = dayCount ? weekSum / dayCount : 0;
      const forecastWeek = Math.round(avgDay * 7 * 100) / 100;
      const forecastMonth = Math.round(avgDay * 30 * 100) / 100;

      return reply.send({ success: true, data: { forecastWeek, forecastMonth, avgDay } });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
  // GET /api/marketing/content/revenue - Lade Revenue-Daten
  server.get('/api/marketing/content/revenue', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { woocommerce } = getConfig();
      const wooConfig = {
        url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL || woocommerce?.url,
        consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY || woocommerce?.consumerKey,
        consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET || woocommerce?.consumerSecret,
      };

      if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
        throw new Error('WooCommerce Konfiguration fehlt (url/consumerKey/consumerSecret).');
      }

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
      logger.error({ error: _error instanceof Error ? _error.message : 'Unknown', function: 'loadRevenueData' }, 'Error loading revenue data');
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

        const { woocommerce } = getConfig();
        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL || woocommerce?.url,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY || woocommerce?.consumerKey,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET || woocommerce?.consumerSecret,
        };

        if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
          throw new Error('WooCommerce Konfiguration fehlt (url/consumerKey/consumerSecret).');
        }

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

        logger.info({ productId: product.id, productName: product.name }, 'Digital product created');

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
        logger.error({ error: _error instanceof Error ? _error.message : 'Unknown', function: 'createDigitalProduct' }, 'Error creating digital product');
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );
}
