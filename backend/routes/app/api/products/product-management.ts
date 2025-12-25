import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import OpenAI from 'openai';
import { getConfig } from '../../../../config';

interface CreateProductBody {
  count: number;
  category: string;
  productType?: 'simple' | 'virtual' | 'downloadable';
  optimization: 'low' | 'medium' | 'high';
  keywords?: string;
  seoOptimized?: boolean;
  mlMarketAnalysis?: boolean;
  specializationPrompt?: string;
  generateImages?: boolean;
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
        const { 
          count, 
          category, 
          productType = 'simple', 
          optimization,
          keywords = '',
          seoOptimized = true,
          mlMarketAnalysis = true,
          specializationPrompt = '',
          generateImages = false
        } = request.body;
        console.log('🤖 Auto-creating products:', { count, category, productType, optimization, keywords, seoOptimized, mlMarketAnalysis, generateImages });

        // Debug: Logge OpenAI-Key und Model
        const openAIKey = getConfig().openAI?.apiKey;
        const openAIModel = getConfig().openAI?.model;
        console.log('[auto-create] OpenAI-Key:', openAIKey ? openAIKey.substring(0, 8) + '...' : 'NICHT VORHANDEN');
        console.log('[auto-create] OpenAI-Model:', openAIModel);

        // WooCommerce Config aus zentraler config.json
        const wooConfig = getConfig().woocommerce || {};
        if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
          throw new Error('WooCommerce API nicht konfiguriert');
        }

        // OpenAI für Produktideen
        const openai = new OpenAI({
          apiKey: openAIKey || ''
        });
        if (!openAIKey) {
          throw new Error('OpenAI API Key nicht konfiguriert');
        }

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');
        const createdProducts: any[] = [];
        const errors: string[] = [];

        // Generiere Produktideen mit OpenAI
        const keywordsText = keywords?.trim() ? `Schlagwörter/Keywords: ${keywords}` : 'Schlagwörter/Keywords: generiere passende Begriffe basierend auf Thema und Trenddaten';
        const specializationText = specializationPrompt?.trim() ? `Spezielle Anforderungen oder Stil: ${specializationPrompt}` : 'Keine speziellen Anforderungen angegeben, nutze Best Practices für diesen Shoptyp.';
        const seoText = seoOptimized ? 'SEO-optimierte Titel und Beschreibungen (natürlich klingend, keine Keyword-Stuffing).' : 'Keine explizite SEO-Optimierung gefordert.';
        const mlFilterText = mlMarketAnalysis ? 'Nutze Markt-/Trendwissen und ähnliche Shops, um nur passende Produkte vorzuschlagen.' : 'Kein ML-Filter, aber bleibe thematisch konsistent.';

        const prompt = `Generiere ${count} hochrelevante Produktideen für einen WooCommerce Shop.
      Shop-URL: ${getConfig().wordpress?.url || 'unbekannt'}
      Kategorie-ID: ${category}
      Produkttyp: ${productType}
      Optimierungsgrad: ${optimization}
      ${keywordsText}
      ${specializationText}
      ${seoText}
      ${mlFilterText}

      Für jede Idee liefere Felder:
      - name: Produktname (kreativ, einzigartig, thematisch passend)
      - description: ${optimization === 'high' ? '200-300' : optimization === 'medium' ? '120-180' : '60-90'} Wörter, klarer Nutzen, Zielgruppe, USPs, ggf. SEO-Keywords natürlich integriert
      - price: realistischer Preis in Euro (9.99 bis 299.99) passend zur Kategorie und Positionierung
      - category: kurzbezeichneter Kategoriename (nicht nur ID)
      - features: 3-5 Bullet Points (USP, Material, Einsatz)
      - keywords: 5-8 relevante Keywords

      Wichtige Regeln:
      - Passe Ideen strikt an Shop-Thema/Kategorie an.
      - Keine generischen Standardprodukte; meide Wiederholungen.
      - Für Produkttyp ${productType}: bei virtual/downloadable keine physischen Versanddetails.
      - Schreibe in Deutsch.
      - Antworte als JSON: {"products": [ ... ]}.`;

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

        // Hilfsfunktion: Berechne Qualitätsscore für ein Produkt
        const calculateQualityScore = (product: any, _idea: any): number => {
          let score = 50; // Basispunkte
          
          // Beschreibung: je länger, desto besser (max +20 Punkte)
          if (product.description) {
            const wordCount = product.description.split(/\s+/).length;
            score += Math.min((wordCount / 100) * 20, 20);
          }
          
          // Bild vorhanden: +15 Punkte
          if (product.images && product.images.length > 0) {
            score += 15;
          }
          
          // Kategorie gesetzt: +10 Punkte
          if (product.categories && product.categories.length > 0) {
            score += 10;
          }
          
          // Preis realistisch (nicht 0, nicht extrem hoch): +5 Punkte
          const price = parseFloat(product.regular_price || 0);
          if (price > 5 && price < 10000) {
            score += 5;
          }
          
          // Optimierungsgrad berücksichtigen
          if (optimization === 'high') {
            score += 10;
          } else if (optimization === 'medium') {
            score += 5;
          }
          
          return Math.min(score, 100);
        };

        // Hilfsfunktion: Berechne ROI-Schätzung
        const calculateEstimatedROI = (product: any): number => {
          // ROI = (Marge / Kosten) * 100
          // Vereinfachte Annahmen:
          // - Herstellungskosten: ~25% des Verkaufspreises
          // - Conversion Rate: 2-5% je nach Qualität
          const price = parseFloat(product.regular_price || 0);
          
          if (price <= 0) return 0;
          
          // Geschätzter Gewinn pro Verkauf (40% Marge, 35% Kosten, 25% für Betrieb)
          const estimatedMargin = price * 0.4;
          
          // Erwartete Verkäufe pro Monat basierend auf Optimierungsgrad
          const baseConversions = optimization === 'high' ? 5 : optimization === 'medium' ? 3 : 1;
          const monthlyRevenue = estimatedMargin * baseConversions;
          
          // ROI = (monatlicher Gewinn / initiale Kosten) * 100
          // Annahme: initiale Kosten = Produktpreis
          const roi = (monthlyRevenue / price) * 100;
          
          return Math.min(Math.round(roi), 300); // Cap bei 300%
        };

        // Erstelle Produkte in WooCommerce
        const startTime = Date.now();
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

            // Bild-URL holen wenn generateImages aktiviert
            let imageUrl = null;
            if (generateImages) {
              try {
                // Nutze OpenAI DALL-E für hochwertige Produktbilder
                console.log(`🎨 Generating product image for: ${productIdea.name}`);
                
                const imagePrompt = `Professional product photography of ${productIdea.name}, high quality, studio lighting, white background, e-commerce style, detailed, 4k`;
                
                const imageResponse = await openai.images.generate({
                  model: 'dall-e-3',
                  prompt: imagePrompt,
                  n: 1,
                  size: '1024x1024',
                  quality: 'standard'
                });
                
                imageUrl = imageResponse.data?.[0]?.url || null;
                if (imageUrl) {
                  console.log(`✅ Generated image for ${productIdea.name}: ${imageUrl}`);
                }
              } catch (imgError) {
                console.error('Fehler beim Generieren des Bildes mit DALL-E:', imgError);
                // Fallback zu Picsum (zuverlässiger als Unsplash)
                imageUrl = `https://picsum.photos/seed/${encodeURIComponent(productIdea.name)}/800/600`;
                console.log(`⚠️ Using fallback image: ${imageUrl}`);
              }
            }

            // Parse category ID - nur wenn valide Nummer
            const categoryId = category && category !== 'all' ? parseInt(category, 10) : null;
            const categories = categoryId && !isNaN(categoryId) ? [{ id: categoryId }] : [];

            const wooPayload: any = {
              name: productIdea.name,
              type: wooType,
              regular_price: productIdea.price.toString(),
              description: productIdea.description,
              categories: categories,
              virtual: isVirtual,
              downloadable: isDownloadable,
              status: 'publish'
            };

            // Bild hinzufügen wenn vorhanden (aber nicht zwingend erforderlich)
            if (imageUrl) {
              wooPayload.images = [{ src: imageUrl }];
            }

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
              
              // Berechne Qualität und ROI für dieses Produkt
              const qualityScore = calculateQualityScore(created, productIdea);
              const estimatedROI = calculateEstimatedROI(created);
              
              // Füge erweiterte Metadaten hinzu
              created.qualityScore = qualityScore;
              created.estimatedROI = estimatedROI;
              created.processingTime = Math.round((Date.now() - startTime) / 1000);
              
              createdProducts.push(created);
              console.log(`✅ Created product: ${created.name} (ID: ${created.id}, Quality: ${qualityScore}%, ROI: ${estimatedROI}%)`);
            } else {
              const errorData = await response.json().catch(() => ({}));
              
              // Wenn Bild-Upload fehlschlägt, versuche ohne Bild
              if (errorData.code === 'woocommerce_product_image_upload_error' && imageUrl) {
                console.log(`⚠️ Image upload failed for ${productIdea.name}, retrying without image...`);
                delete wooPayload.images;
                
                const retryResponse = await fetch(`${wooConfig.url}/wp-json/wc/v3/products`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(wooPayload)
                });
                
                if (retryResponse.ok) {
                  const created = await retryResponse.json();
                  
                  // Berechne Qualität und ROI für dieses Produkt
                  const qualityScore = calculateQualityScore(created, productIdea);
                  const estimatedROI = calculateEstimatedROI(created);
                  
                  created.qualityScore = qualityScore;
                  created.estimatedROI = estimatedROI;
                  created.processingTime = Math.round((Date.now() - startTime) / 1000);
                  
                  createdProducts.push(created);
                  console.log(`✅ Created product without image: ${created.name} (ID: ${created.id}, Quality: ${qualityScore}%, ROI: ${estimatedROI}%)`);
                } else {
                  const errorText = await retryResponse.text();
                  errors.push(`${productIdea.name}: ${errorText}`);
                }
              } else {
                const errorText = JSON.stringify(errorData);
                errors.push(`${productIdea.name}: ${errorText}`);
              }
            }
          } catch (err) {
            errors.push(`${productIdea.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        
        const now = new Date();
        const totalTime = Date.now() - startTime;
        const estimatedMinutes = Math.ceil(totalTime / 60000);
        
        // Berechne aggregierte Statistiken
        const avgQualityScore = createdProducts.length > 0
          ? createdProducts.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / createdProducts.length
          : 0;
        
        const avgROI = createdProducts.length > 0
          ? createdProducts.reduce((sum, p) => sum + (p.estimatedROI || 0), 0) / createdProducts.length
          : 0;
        
        const avgProcessTime = createdProducts.length > 0
          ? Math.round(totalTime / createdProducts.length / 1000)
          : 0;
        
        return reply.send({
          success: true,
          data: {
            success: true,
            message: `${createdProducts.length} von ${count} Produkten erfolgreich erstellt`,
            productsCreated: createdProducts.length,
            estimatedTime: `${estimatedMinutes} Minuten`,
            avgQualityScore: Math.round(avgQualityScore),
            avgROI: Math.round(avgROI),
            avgProcessTime: avgProcessTime,
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
        description: 'Erstellt ein neues WooCommerce Produkt mit optionalem Bild',
        body: {
          type: 'object',
          required: ['name', 'price', 'category', 'type'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            category: { type: 'string' },
            type: { type: 'string', enum: ['simple', 'virtual', 'downloadable', 'variable', 'grouped', 'external'] },
            stock: { type: 'number' },
            image: { type: 'string', description: 'URL des Produktbildes (DALL-E oder andere)' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: WooProductBody & { image?: string } }>, reply: FastifyReply) => {
      try {
        const productData = request.body;
        console.log('📥 Received product data:', JSON.stringify(productData, null, 2));

        // ✅ WooCommerce API Integration (aus zentraler config)
        const wooConfig = getConfig().woocommerce || {};

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

        // 🎨 Handle Product Image - WooCommerce kann direkt eine Image-URL importieren
        if (productData.image) {
          try {
            console.log('🎨 Adding product image from URL:', productData.image);
            wooPayload.images = [
              {
                src: productData.image
              }
            ];
          } catch (imageError) {
            console.warn('⚠️ Image processing error, continuing without image:', imageError instanceof Error ? imageError.message : imageError);
          }
        }

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
        const wooConfig = getConfig().woocommerce || {};
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

  // Update Single WooCommerce Product (für AI-Updates)
  server.put<{ 
    Params: { productId: string };
    Body: { regular_price?: string; description?: string; stock_quantity?: number } 
  }>(
    '/woo/update-single/:productId',
    {
      schema: {
        tags: ['products'],
        description: 'Aktualisiert ein einzelnes WooCommerce Produkt',
        params: {
          type: 'object',
          properties: {
            productId: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            regular_price: { type: 'string' },
            description: { type: 'string' },
            stock_quantity: { type: 'number' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { productId } = request.params;
        const updatePayload = request.body;

        console.log(`🔄 Updating single product ${productId} with AI values:`, updatePayload);

        const wooConfig = getConfig().woocommerce || {};
        if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
          throw new Error('WooCommerce-Konfiguration fehlt');
        }
        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');

        const response = await fetch(`${wooConfig.url}/wp-json/wc/v3/products/${productId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`WooCommerce API Error: ${errorText}`);
        }

        const updatedProduct = await response.json();
        console.log(`✅ Product ${productId} updated successfully`);

        return reply.send({
          success: true,
          data: updatedProduct
        });

      } catch (_error) {
        console.error('❌ Error updating single product:', _error);
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

        const wooConfig = getConfig().woocommerce || {};
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

  // ML Generate Product Ideas
  server.get<{ Querystring: { count: string; category: string } }>(
    '/ml/generate-ideas',
    {
      schema: {
        tags: ['products', 'ml'],
        description: 'Generiert KI-basierte Produktideen',
        querystring: {
          type: 'object',
          properties: {
            count: { type: 'string', description: 'Anzahl der Ideen (Standard: 3)' },
            category: { type: 'string', description: 'Kategorie-ID oder "all"' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Querystring: { count: string; category: string } }>, reply: FastifyReply) => {
      try {
        const count = parseInt(request.query.count || '3', 10) || 3;
        const category = request.query.category || 'all';

        console.log('🤖 Generating product ideas:', { count, category });

        // OpenAI für Produktideen
        const openai = new OpenAI({
          apiKey: getConfig().openAI?.apiKey || ''
        });
        if (!getConfig().openAI?.apiKey) {
          throw new Error('OpenAI API Key nicht konfiguriert');
        }

        const prompt = `Generiere ${count} innovative und thematisch passende Produktideen für einen E-Commerce Shop. Antworte ausschließlich als JSON-Objekt.
${category !== 'all' ? `Kategorie-ID: ${category}` : 'Alle Kategorien erlaubt'}

Für jede Idee:
- title: Produktname (einzigartig, modern)
- description: Kurze Beschreibung (50-80 Wörter)
- category: Kategorie (z.B. "Digital Products", "Home & Garden", etc.)
- price: Preis in Euro (9.99-299.99)
- score: Qualitäts-Score 0-100
- reason: Warum diese Idee gerade passt/trending ist

Antwort-Format (streng):
{ "ideas": [
  { "title": "...", "description": "...", "category": "...", "price": 0, "score": 85, "reason": "..." }
] }`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });

        const responseContent = completion.choices[0].message.content || '{}';
        console.log('🤖 OpenAI Ideas Response:', responseContent);
        
        let ideas: any[] = [];
        try {
          const parsed = JSON.parse(responseContent);
          ideas = Array.isArray(parsed) ? parsed : (parsed.ideas || parsed.products || []);
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError);
          ideas = [];
        }

        if (!ideas || ideas.length === 0) {
          throw new Error('Keine Produktideen vom KI-Dienst erhalten');
        }

        // Generiere Score für jede Idee wenn nicht vorhanden
        ideas = ideas.map((idea) => ({
          ...idea,
          score: idea.score || Math.floor(70 + Math.random() * 25),
          reason: idea.reason || 'Trending im Markt'
        }));

        console.log(`✅ Generated ${ideas.length} product ideas`);

        return reply.send({
          success: true,
          ideas: ideas,
          count: ideas.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Error generating product ideas:', error);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Fehler bei der Generierung von Produktideen'
        });
      }
    }
  );
}
