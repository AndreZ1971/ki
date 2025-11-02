import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface Bundle {
  id: number;
  name: string;
  products: string[];
  price: number;
  discount: number;
  active: boolean;
  description?: string;
  createdAt?: string;
}

interface CreateBundleBody {
  name: string;
  products: string[];
  price: number;
  discount: number;
  active: boolean;
  description?: string;
}

type UpdateBundleBody = Partial<CreateBundleBody>;

export default async function bundleRoutes(server: FastifyInstance) {
  
  // Get All Bundles
  server.get(
    '/',
    {
      schema: {
        tags: ['bundles'],
        description: 'Holt alle Bundles - analysiert häufig zusammen gekaufte Produkte'
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // ✅ ECHTE Bundle-Vorschläge aus WooCommerce Order-Daten
        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
        };

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');
        
        // Lade abgeschlossene Orders der letzten 90 Tage
        const ordersResponse = await fetch(
          `${wooConfig.url}/wp-json/wc/v3/orders?status=completed&per_page=100&after=${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()}`,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!ordersResponse.ok) {
          throw new Error(`WooCommerce API Error: ${ordersResponse.status}`);
        }

        const orders = await ordersResponse.json() as any[];
        
        // Analysiere welche Produkte häufig zusammen gekauft werden
        const productCombinations = new Map<string, number>();
        
        for (const order of orders) {
          const lineItems = order.line_items || [];
          const productIds = lineItems.map((item: any) => item.product_id).sort();
          
          // Alle 2er-Kombinationen zählen
          for (let i = 0; i < productIds.length - 1; i++) {
            for (let j = i + 1; j < productIds.length; j++) {
              const key = `${productIds[i]}-${productIds[j]}`;
              productCombinations.set(key, (productCombinations.get(key) || 0) + 1);
            }
          }
        }
        
        // Top 5 häufigste Kombinationen
        const topCombinations = Array.from(productCombinations.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        
        // Erstelle Bundle-Vorschläge
        const bundles: Bundle[] = await Promise.all(
          topCombinations.map(async ([combo, count], index) => {
            const [productId1, productId2] = combo.split('-');
            
            // Lade Produkt-Details
            const [prod1Response, prod2Response] = await Promise.all([
              fetch(`${wooConfig.url}/wp-json/wc/v3/products/${productId1}`, {
                headers: { 'Authorization': `Basic ${auth}` }
              }),
              fetch(`${wooConfig.url}/wp-json/wc/v3/products/${productId2}`, {
                headers: { 'Authorization': `Basic ${auth}` }
              })
            ]);
            
            const prod1 = await prod1Response.json();
            const prod2 = await prod2Response.json();
            
            const totalPrice = parseFloat(prod1.price) + parseFloat(prod2.price);
            const discount = count > 5 ? 20 : count > 3 ? 15 : 10; // Mehr Käufe = mehr Rabatt
            
            return {
              id: index + 1,
              name: `${prod1.name} + ${prod2.name}`,
              products: [prod1.name, prod2.name],
              price: parseFloat((totalPrice * (1 - discount / 100)).toFixed(2)),
              discount,
              active: true,
              description: `Häufig zusammen gekauft (${count}x)`,
              createdAt: new Date().toISOString()
            };
          })
        );

        return reply.send({
          success: true,
          data: bundles,
          total: bundles.length,
          source: 'woocommerce-order-analysis',
          ordersAnalyzed: orders.length
        });
      } catch (_error) {
        console.error('Bundles API Error:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // Create Bundle
  server.post<{ Body: CreateBundleBody }>(
    '/',
    {
      schema: {
        tags: ['bundles'],
        description: 'Erstellt ein neues Bundle',
        body: {
          type: 'object',
          required: ['name', 'products', 'price', 'discount', 'active'],
          properties: {
            name: { type: 'string' },
            products: { type: 'array', items: { type: 'string' } },
            price: { type: 'number' },
            discount: { type: 'number' },
            active: { type: 'boolean' },
            description: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateBundleBody }>, reply: FastifyReply) => {
      try {
        const bundleData = request.body;
        console.log('📦 Creating bundle:', bundleData);

        // ✅ ECHTE WooCommerce Bundle-Erstellung
        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
        };

        if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
          throw new Error('WooCommerce-Konfiguration fehlt');
        }

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');

        // Erstelle ein "Grouped Product" in WooCommerce
        // Grouped Products können mehrere Kind-Produkte enthalten (Bundle-Komponenten)
        const wooPayload = {
          name: bundleData.name,
          type: 'grouped',
          description: bundleData.description || `Bundle bestehend aus: ${bundleData.products.join(', ')}`,
          status: bundleData.active ? 'publish' : 'draft',
          // Grouped products haben keinen eigenen Preis - der Preis wird aus den Kind-Produkten berechnet
          // Aber wir speichern den Bundle-Preis und Rabatt in meta_data
          meta_data: [
            {
              key: '_bundle_price',
              value: bundleData.price.toString()
            },
            {
              key: '_bundle_discount',
              value: bundleData.discount.toString()
            },
            {
              key: '_bundle_products',
              value: bundleData.products.join(',')
            }
          ]
        };

        console.log('📤 Sending to WooCommerce:', JSON.stringify(wooPayload, null, 2));

        const response = await fetch(`${wooConfig.url}/wp-json/wc/v3/products`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(wooPayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ WooCommerce Error:', errorText);
          throw new Error(`WooCommerce API Error: ${response.status} - ${errorText}`);
        }

        const wooBundle = await response.json();
        console.log('✅ Bundle created in WooCommerce:', wooBundle.id);

        const newBundle: Bundle = {
          id: wooBundle.id,
          name: wooBundle.name,
          products: bundleData.products,
          price: bundleData.price,
          discount: bundleData.discount,
          active: wooBundle.status === 'publish',
          description: wooBundle.description,
          createdAt: wooBundle.date_created
        };

        return reply.send({
          success: true,
          data: newBundle,
          message: `Bundle "${newBundle.name}" erfolgreich in WooCommerce erstellt`,
          woocommerceId: wooBundle.id,
          permalink: wooBundle.permalink
        });
      } catch (_error) {
        console.error('❌ Bundle creation error:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // Update Bundle
  server.put<{ Params: { id: string }; Body: UpdateBundleBody }>(
    '/:id',
    {
      schema: {
        tags: ['bundles'],
        description: 'Aktualisiert ein Bundle',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateBundleBody }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const updates = request.body;

        // TODO: Database Integration
        const updatedBundle: Bundle = {
          id: parseInt(id),
          name: updates.name || 'Updated Bundle',
          products: updates.products || [],
          price: updates.price || 0,
          discount: updates.discount || 0,
          active: updates.active !== undefined ? updates.active : true,
          description: updates.description
        };

        return reply.send({
          success: true,
          data: updatedBundle,
          message: 'Bundle erfolgreich aktualisiert'
        });
      } catch (_error) {
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );
}
