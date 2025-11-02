import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import OpenAI from 'openai';

interface CreateProductBody {
  count: number;
  category: string;
  productType?: 'simple' | 'virtual' | 'downloadable';
  optimization: 'low' | 'medium' | 'high';
}

interface WooProductBody {
  name: string;
  description?: string;
  price: number;
  category: string;
  type: 'simple' | 'virtual' | 'downloadable' | 'variable' | 'grouped' | 'external';
  stock?: number;
}

interface UpdateProductBody {
  type: 'prices' | 'inventory' | 'descriptions' | 'all';
  productIds?: number[];
  changes?: any;
}

export default async function productRoutes(server: FastifyInstance) {
  
  // Auto Product Creator
  server.post<{ Body: CreateProductBody }>(
    '/auto-create',
    {
      schema: {
        tags: ['products'],
        description: 'Erstellt automatisch Produkte mit AI',
        body: {
          type: 'object',
          required: ['count', 'category', 'optimization'],
          properties: {
            count: { type: 'number' },
            category: { type: 'string' },
            productType: { type: 'string', enum: ['simple', 'virtual', 'downloadable'] },
            optimization: { type: 'string', enum: ['low', 'medium', 'high'] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateProductBody }>, reply: FastifyReply) => {
      try {
        const { count, category, productType = 'simple', optimization } = request.body;
        console.log('🤖 Auto-creating products:', { count, category, productType, optimization });

        // WooCommerce Config
        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
        };

        if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
          throw new Error('WooCommerce API nicht konfiguriert');
        }

        // OpenAI für Produktideen
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });

        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OpenAI API Key nicht konfiguriert');
        }

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');
        const createdProducts: any[] = [];
        const errors: string[] = [];

        // Generiere Produktideen mit OpenAI
        const prompt = `Generiere ${count} kreative Produktideen für einen WooCommerce Shop.
Kategorie-ID: ${category}
Produkttyp: ${productType}
Qualität: ${optimization}

Für jedes Produkt erstelle:
- name: Produktname (kreativ, einzigartig)
- description: Detaillierte Beschreibung (${optimization === 'high' ? '200-300' : optimization === 'medium' ? '100-150' : '50-80'} Wörter)
- price: Preis in Euro (realistisch, zwischen 9.99 und 299.99)

Antworte mit einem JSON Objekt im Format: {"products": [...]}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          response_format: { type: 'json_object' }
        });

        const responseContent = completion.choices[0].message.content || '{"products": []}';
        console.log('🤖 OpenAI Response:', responseContent);
        
        let productsData: any[];
        try {
          const parsed = JSON.parse(responseContent);
          productsData = Array.isArray(parsed) ? parsed : (parsed.products || []);
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError);
          throw new Error('Fehler beim Parsen der AI Antwort');
        }
        
        console.log(`✅ Generated ${productsData.length} product ideas`);

        // Erstelle Produkte in WooCommerce
        for (const productIdea of productsData) {
          try {
            // Type Mapping
            let wooType = productType;
            let isVirtual = false;
            let isDownloadable = false;
            
            if (productType === 'virtual') {
              wooType = 'simple';
              isVirtual = true;
            } else if (productType === 'downloadable') {
              wooType = 'simple';
              isDownloadable = true;
            }

            const wooPayload = {
              name: productIdea.name,
              type: wooType,
              regular_price: productIdea.price.toString(),
              description: productIdea.description,
              categories: category && category !== 'all' ? [{ id: parseInt(category, 10) }] : [],
              virtual: isVirtual,
              downloadable: isDownloadable,
              status: 'publish'
            };

            const response = await fetch(`${wooConfig.url}/wp-json/wc/v3/products`, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(wooPayload)
            });

            if (response.ok) {
              const created = await response.json();
              createdProducts.push(created);
              console.log(`✅ Created product: ${created.name} (ID: ${created.id})`);
            } else {
              const errorText = await response.text();
              errors.push(`${productIdea.name}: ${errorText}`);
            }
          } catch (err) {
            errors.push(`${productIdea.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        
        const now = new Date();
        const estimatedMinutes = Math.ceil(count * 0.5);
        
        return reply.send({
          success: true,
          data: {
            success: true,
            message: `${createdProducts.length} von ${count} Produkten erfolgreich erstellt`,
            productsCreated: createdProducts.length,
            estimatedTime: `${estimatedMinutes} Minuten`,
            errors: errors.length > 0 ? errors : undefined,
            timestamp: now.toISOString(),
            products: createdProducts
          }
        });
      } catch (_error) {
        console.error('❌ Error in auto-create:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // Get All Products
  server.get(
    '/',
    {
      schema: {
        tags: ['products'],
        description: 'Holt alle Produkte'
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // TODO: WooCommerce API Integration
        return reply.send({
          success: true,
          data: []
        });
      } catch (_error) {
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // Create WooCommerce Product
  server.post<{ Body: WooProductBody }>(
    '/woo/create',
    {
      schema: {
        tags: ['products'],
        description: 'Erstellt ein neues WooCommerce Produkt',
        body: {
          type: 'object',
          required: ['name', 'price', 'category', 'type'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            category: { type: 'string' },
            type: { type: 'string', enum: ['simple', 'virtual', 'downloadable', 'variable', 'grouped', 'external'] },
            stock: { type: 'number' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: WooProductBody }>, reply: FastifyReply) => {
      try {
        const productData = request.body;
        console.log('📥 Received product data:', JSON.stringify(productData, null, 2));

        // ✅ WooCommerce API Integration
        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
        };

        if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
          throw new Error('WooCommerce API nicht konfiguriert');
        }

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');
        
        // Parse category ID
        const categoryId = productData.category ? parseInt(productData.category, 10) : null;
        if (productData.category && isNaN(categoryId as number)) {
          throw new Error(`Invalid category ID: ${productData.category}`);
        }
        
        // WooCommerce Product Type Mapping
        // virtual und downloadable sind KEINE Types, sondern Flags!
        let wooType = productData.type;
        let isVirtual = false;
        let isDownloadable = false;
        
        if (productData.type === 'virtual') {
          wooType = 'simple';
          isVirtual = true;
        } else if (productData.type === 'downloadable') {
          wooType = 'simple';
          isDownloadable = true;
        }
        
        // WooCommerce Product Payload
        const wooPayload: any = {
          name: productData.name,
          type: wooType, // simple, grouped, external, variable
          regular_price: productData.price.toString(),
          description: productData.description || '',
          categories: categoryId ? [{ id: categoryId }] : [],
          virtual: isVirtual,
          downloadable: isDownloadable,
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
          console.error('❌ WooCommerce API Error:', response.status, errorText);
          const errorData = JSON.parse(errorText || '{}');
          throw new Error(errorData.message || `WooCommerce API Error: ${response.status}`);
        }

        const createdProduct = await response.json();
        console.log('✅ Product created:', createdProduct.id);

        return reply.send({
          success: true,
          data: createdProduct,
          message: 'Produkt erfolgreich in WooCommerce erstellt'
        });
      } catch (_error) {
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // List WooCommerce Products
  server.get(
    '/woo/list',
    {
      schema: {
        tags: ['products'],
        description: 'Lädt alle WooCommerce Produkte'
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
        };

        if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
          throw new Error('WooCommerce-Konfiguration fehlt');
        }

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');

        // Lade alle Produkte (max 100 pro Request)
        const response = await fetch(`${wooConfig.url}/wp-json/wc/v3/products?per_page=100`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`WooCommerce API Error: ${response.status} - ${errorText}`);
        }

        const products = await response.json();
        console.log(`✅ Loaded ${products.length} products from WooCommerce`);

        return reply.send({
          success: true,
          data: products,
          total: products.length
        });
      } catch (_error) {
        console.error('❌ Error loading products:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // Update WooCommerce Products
  server.put<{ Body: UpdateProductBody }>(
    '/woo/update',
    {
      schema: {
        tags: ['products'],
        description: 'Aktualisiert WooCommerce Produkte',
        body: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: ['prices', 'inventory', 'descriptions', 'all'] },
            productIds: { type: 'array', items: { type: 'number' } },
            changes: { type: 'object' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: UpdateProductBody }>, reply: FastifyReply) => {
      try {
        const { type, productIds } = request.body;
        console.log(`🔄 Updating ${productIds?.length || 0} products (${type})`);

        if (!productIds || productIds.length === 0) {
          throw new Error('Keine Produkt-IDs angegeben');
        }

        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
        };

        if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
          throw new Error('WooCommerce-Konfiguration fehlt');
        }

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');

        // Batch Update mit WooCommerce API
        const updateData: any = {};
        
        switch (type) {
          case 'prices':
            // Preise um 5% erhöhen (Beispiel)
            updateData.increase_price = true;
            break;
          case 'inventory':
            // Lagerbestand synchronisieren (Beispiel)
            updateData.manage_stock = true;
            break;
          case 'descriptions':
            // Beschreibungen optimieren (würde AI verwenden)
            updateData.update_descriptions = true;
            break;
          case 'all':
            updateData.full_update = true;
            break;
        }

        const updatedProducts = [];
        const errors = [];

        // Update jedes Produkt einzeln
        for (const productId of productIds) {
          try {
            // Lade aktuelles Produkt
            const getResponse = await fetch(`${wooConfig.url}/wp-json/wc/v3/products/${productId}`, {
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
              }
            });

            if (!getResponse.ok) continue;

            const product = await getResponse.json();
            const updatePayload: any = {};

            // Erstelle Update basierend auf Typ
            if (type === 'prices' || type === 'all') {
              const currentPrice = parseFloat(product.regular_price || product.price || '0');
              if (currentPrice > 0) {
                updatePayload.regular_price = (currentPrice * 1.05).toFixed(2); // 5% Erhöhung
              }
            }

            if (type === 'inventory' || type === 'all') {
              updatePayload.manage_stock = true;
              if (!product.stock_quantity) {
                updatePayload.stock_quantity = 10; // Standard-Lagerbestand
              }
            }

            if (type === 'descriptions' || type === 'all') {
              // Füge Hinweis zur Beschreibung hinzu
              updatePayload.description = (product.description || '') + '\n\n✨ Aktualisiert am ' + new Date().toLocaleDateString('de-DE');
            }

            // Sende Update
            const updateResponse = await fetch(`${wooConfig.url}/wp-json/wc/v3/products/${productId}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updatePayload)
            });

            if (updateResponse.ok) {
              const updated = await updateResponse.json();
              updatedProducts.push(updated);
              console.log(`✅ Updated product ${productId}`);
            } else {
              const errorText = await updateResponse.text();
              errors.push(`Product ${productId}: ${errorText}`);
            }
          } catch (err) {
            errors.push(`Product ${productId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        return reply.send({
          success: true,
          message: `${updatedProducts.length} von ${productIds.length} Produkten aktualisiert (${type})`,
          updatedCount: updatedProducts.length,
          errors: errors.length > 0 ? errors : undefined,
          products: updatedProducts
        });
      } catch (_error) {
        console.error('❌ Error updating products:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );
}
