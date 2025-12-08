import { FastifyInstance } from 'fastify';
import OpenAI from 'openai';

// ✅ Korrekte lazy Initialisierung
let openai: OpenAI | null = null;

function initializeOpenAI() {
  if (openai !== null) return openai; // Bereits initialisiert
  
  try {
    const apiKey = process.env.OPENAI_API_KEY; // ✅ Jetzt ist process.env geladen!
    
    if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-')) {
      console.warn('⚠️ OpenAI API Key nicht konfiguriert');
      openai = null;
    } else {
      openai = new OpenAI({ apiKey });
      console.log('✅ OpenAI Client erfolgreich initialisiert');
    }
  } catch (_error) {
    console.error('❌ Fehler bei OpenAI Initialisierung:', _error);
    openai = null;
  }
  
  return openai;
}

// Einfache WooCommerce Client Implementierung
import config from '../../../../config';

class WooCommerceClient {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;

  constructor() {
    const woo = config.woocommerce || {};
    console.log('[WooCommerceClient] Initialisierte Daten:', woo);
    this.baseUrl = woo.url || '';
    this.consumerKey = woo.consumerKey || '';
    this.consumerSecret = woo.consumerSecret || '';
    this.validateConfig();
  }

  private validateConfig() {
    const isValid = !!(this.baseUrl && this.consumerKey && this.consumerSecret);
    console.log('[WooCommerceClient] Config Check:', {
      baseUrl: this.baseUrl,
      consumerKey: this.consumerKey,
      consumerSecret: this.consumerSecret ? 'SET' : 'MISSING'
    });
    if (!isValid) {
      console.warn('⚠️ WooCommerce API nicht korrekt konfiguriert - bitte Werte in connection.json setzen');
    } else {
      console.log('✅ WooCommerce Client erfolgreich konfiguriert');
    }
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
      console.error('[WooCommerceClient] Fehlende Konfiguration:', {
        baseUrl: this.baseUrl,
        consumerKey: this.consumerKey,
        consumerSecret: this.consumerSecret
      });
      throw new Error('WooCommerce API nicht konfiguriert. Bitte Werte in connection.json setzen');
    }
    const url = `${this.baseUrl}${endpoint}`;
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    };
    console.log(`[WooCommerce] Request:`, url, defaultOptions, options);
    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      console.log(`[WooCommerce] Response Status:`, response.status);
      if (!response.ok) {
        const text = await response.text();
        console.error(`[WooCommerce] Fehlerhafte Antwort:`, text);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      console.log(`[WooCommerce] Response JSON:`, json);
      return json;
    } catch (_error) {
      console.error(`Fehler bei WooCommerce Request ${endpoint}:`, _error);
      throw _error;
    }
  }

  async getProducts(params: any = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    
    const endpoint = `/products${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getProduct(id: number) {
    return this.makeRequest(`/products/${id}`);
  }

  async createProduct(productData: any) {
    return this.makeRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(id: number, updateData: any) {
    return this.makeRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  async deleteProduct(id: number) {
    return this.makeRequest(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  async getCategories(params: any = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const endpoint = `/products/categories${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getOrders(params: any = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status) queryParams.append('status', params.status);
    
    const endpoint = `/orders${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getCustomers(params: any = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const endpoint = `/customers${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }
}

export default async function wooCommerceRoutes(server: FastifyInstance) {
  const wooCommerce = new WooCommerceClient();

  // Get products
  server.get('/woo/products', {
    schema: {
      tags: ['woocommerce'],
      summary: 'Get products from WooCommerce',
      description: 'Retrieve a list of products from WooCommerce store',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1, minimum: 1 },
          per_page: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
          search: { type: 'string' },
          category: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    try {
      const { page, per_page, search, category } = request.query;
      console.log('[Route] /woo/products called with:', { page, per_page, search, category });
      const products = await wooCommerce.getProducts({ 
        page, 
        per_page, 
        search,
        category 
      });
      console.log('[Route] /woo/products result:', products);
      return { success: true, data: products };
    } catch (error: any) {
      server.log.error('Fehler beim Abrufen der Produkte:', error);
      console.error('[Route] /woo/products error:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  });

  // Get single product
  server.get('/woo/products/:id', {
    schema: {
      tags: ['woocommerce'],
      summary: 'Get single product by ID',
      description: 'Retrieve a single product by its ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const product = await wooCommerce.getProduct(id);
      
      if (!product) {
        reply.code(404);
        return { success: false, error: 'Product not found' };
      }
      
      return { success: true, data: product };
    } catch (error: any) {
      server.log.error('Fehler beim Abrufen des Produkts:', error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  });

  // Create product
  server.post('/woo/products', {
    schema: {
      tags: ['woocommerce'],
      summary: 'Create a new product',
      description: 'Create a new product in WooCommerce store',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', default: 'simple' },
          description: { type: 'string' },
          short_description: { type: 'string' },
          regular_price: { type: 'string' },
          sale_price: { type: 'string' },
          sku: { type: 'string' },
          manage_stock: { type: 'boolean', default: false },
          stock_quantity: { type: 'integer' },
          categories: { 
            type: 'array', 
            items: { 
              type: 'object',
              properties: {
                id: { type: 'number' }
              }
            } 
          },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' }
              }
            }
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                src: { type: 'string' }
              }
            }
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const productData = request.body;
      const product = await wooCommerce.createProduct(productData);
      
      reply.code(201);
      return { success: true, data: product };
    } catch (error: any) {
      server.log.error('Fehler beim Erstellen des Produkts:', error);
      throw new Error(`Failed to create product: ${error.message}`);
    }
  });

  // Update product
  server.put('/woo/products/:id', {
    schema: {
      tags: ['woocommerce'],
      summary: 'Update existing product',
      description: 'Update an existing product in WooCommerce store',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          regular_price: { type: 'string' },
          sale_price: { type: 'string' },
          stock_quantity: { type: 'integer' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      
      const product = await wooCommerce.updateProduct(id, updateData);
      
      if (!product) {
        reply.code(404);
        return { success: false, error: 'Product not found' };
      }
      
      return { success: true, data: product };
    } catch (error: any) {
      server.log.error('Fehler beim Aktualisieren des Produkts:', error);
      throw new Error(`Failed to update product: ${error.message}`);
    }
  });

  // Delete product
  server.delete('/woo/products/:id', {
    schema: {
      tags: ['woocommerce'],
      summary: 'Delete product',
      description: 'Delete a product from WooCommerce store',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    try {
      const { id } = request.params;
      await wooCommerce.deleteProduct(id);
      
      return { 
        success: true, 
        message: `Product ${id} deleted successfully` 
      };
    } catch (error: any) {
      server.log.error('Fehler beim Löschen des Produkts:', error);
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  });

  // Bulk create products
  server.post('/woo/products/bulk', {
    schema: {
      tags: ['woocommerce'],
      summary: 'Bulk create products',
      description: 'Create multiple products at once',
      body: {
        type: 'object',
        required: ['products'],
        properties: {
          products: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                regular_price: { type: 'string' },
                categories: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      response: {
        207: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            results: { type: 'array' },
            summary: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                successful: { type: 'integer' },
                failed: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { products } = request.body;
      const results = [];
      
      for (const productData of products) {
        try {
          const product = await wooCommerce.createProduct(productData);
          results.push({ success: true, data: product });
        } catch (error: any) {
          results.push({ 
            success: false, 
            error: error.message,
            product: productData.name 
          });
        }
      }
      
      reply.code(207); // Multi-Status
      return { 
        success: true, 
        results,
        summary: {
          total: products.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      };
    } catch (error: any) {
      server.log.error('Fehler beim Bulk-Erstellen von Produkten:', error);
      throw new Error(`Failed to bulk create products: ${error.message}`);
    }
  });

  // Get categories
  server.get('/woo/categories', {
    schema: {
      tags: ['woocommerce'],
      summary: 'Get product categories',
      description: 'Retrieve all product categories from WooCommerce',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          per_page: { type: 'integer', default: 50 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' }
          }
        }
      }
    }
  }, async (request: any) => {
    try {
      const { page, per_page } = request.query;
      const categories = await wooCommerce.getCategories({ page, per_page });
      return { success: true, data: categories };
    } catch (error: any) {
      server.log.error('Fehler beim Abrufen der Kategorien:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  });

  // AI description generation - ✅ KORRIGIERT mit lazy initialization
  server.post('/woo/products/ai-description', {
    schema: {
      tags: ['woocommerce'],
      summary: 'Generate AI product description',
      description: 'Generate professional product descriptions using AI',
      body: {
        type: 'object',
        required: ['productName'],
        properties: {
          productName: { type: 'string' },
          productType: { type: 'string' },
          keyFeatures: { 
            type: 'array', 
            items: { type: 'string' },
            default: []
          },
          targetAudience: { type: 'string' },
          language: { type: 'string', default: 'de' },
          tone: { type: 'string', enum: ['professional', 'friendly', 'enthusiastic', 'luxury'], default: 'professional' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            description: { type: 'string' },
            shortDescription: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    const { 
      productName, 
      productType, 
      keyFeatures = [], 
      targetAudience, 
      language = 'de',
      tone = 'professional' 
    } = request.body;

    // Ton-Mapping für bessere Beschreibungen
    const toneMap: Record<string, string> = {
      professional: "professionell und sachlich",
      friendly: "freundlich und einladend", 
      enthusiastic: "begeistert und energisch",
      luxury: "exklusiv und hochwertig"
    };

    const toneDescription = toneMap[tone] || toneMap.professional;

    // ✅ Erst HIER wird initialisiert
    const openAIClient = initializeOpenAI();
    
    console.log(`[AI Description] OpenAI verfügbar: ${!!openAIClient}`);
    
    if (!openAIClient) {
      server.log.warn('OpenAI nicht verfügbar - verwende Fallback');
      
      const fallbackDescription = `🎯 **${productName}** - Das perfekte ${productType || 'Produkt'} für ${targetAudience || 'dich'}!

✨ **Hauptfeatures:**
${keyFeatures.map((feature: string, _index: number) => `• ✅ ${feature}`).join('\n')}

💫 **Warum ${productName}?**
Entdecke die einzigartigen Vorteile und die herausragende Qualität dieses Produkts. Perfekt abgestimmt auf die Bedürfnisse ${targetAudience ? `von ${targetAudience}` : 'moderner Anwender'}.

🛡️ **Zufriedenheit garantiert!**`;

      const fallbackShortDescription = `🚀 ${productName} - ${keyFeatures.slice(0, 2).join(' • ')}${keyFeatures.length > 2 ? ' • ...' : ''}`;

      const fallbackTags = [
        productName, 
        productType, 
        ...keyFeatures,
        targetAudience,
        tone
      ].filter(Boolean).slice(0, 8);

      return {
        success: false,
        description: fallbackDescription,
        shortDescription: fallbackShortDescription.length > 150 ? fallbackShortDescription.substring(0, 147) + '...' : fallbackShortDescription,
        tags: fallbackTags,
        error: 'OpenAI service not configured - using fallback description'
      };
    }

    try {
      const prompt = `
Erstelle eine professionelle Produktbeschreibung für: "${productName}"
${productType ? `Produkttyp: ${productType}` : ''}
${targetAudience ? `Zielgruppe: ${targetAudience}` : ''}
${keyFeatures.length > 0 ? `Hauptfeatures: ${keyFeatures.join(', ')}` : ''}
Ton: ${toneDescription}

Erstelle:
1. Eine detaillierte Produktbeschreibung (300-500 Zeichen) mit Überschriften, Aufzählungen und passenden Emojis
2. Eine kurze Beschreibung (80-120 Zeichen) für die Produktübersicht
3. 5-8 relevante Tags/Schlagworte

WICHTIG: Antworte NUR im JSON Format ohne zusätzlichen Text:
{
  "description": "detaillierte Beschreibung hier",
  "shortDescription": "kurze Beschreibung hier", 
  "tags": ["tag1", "tag2", "tag3"]
}
`;

      server.log.info('Sende Request an OpenAI...');
      
      const completion = await openAIClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `Du bist ein professioneller E-Commerce Copywriter. Erstelle überzeugende Produktbeschreibungen die Conversions steigern. Sprache: ${language}` 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse) {
        server.log.info('OpenAI Response erhalten');
        
        try {
          const parsedResponse = JSON.parse(aiResponse);
          return {
            success: true,
            description: parsedResponse.description,
            shortDescription: parsedResponse.shortDescription,
            tags: parsedResponse.tags
          };
        } catch (parseError: any) {
          server.log.error('Fehler beim Parsen der AI-Antwort:', parseError.message);
          
          // Fallback: Versuche die Antwort zu bereinigen
          const cleanResponse = aiResponse.replace(/```json|```/g, '').trim();
          try {
            const parsedResponse = JSON.parse(cleanResponse);
            return {
              success: true,
              description: parsedResponse.description,
              shortDescription: parsedResponse.shortDescription,
              tags: parsedResponse.tags
            };
          } catch (_secondParseError) {
            // Finaler Fallback: Verwende die rohe Antwort
            return {
              success: true,
              description: aiResponse,
              shortDescription: aiResponse.substring(0, 120) + (aiResponse.length > 120 ? '...' : ''),
              tags: [productName, productType, ...keyFeatures].filter(Boolean).slice(0, 6)
            };
          }
        }
      } else {
        throw new Error('Keine Antwort von OpenAI erhalten');
      }

    } catch (error: any) {
      server.log.error('OpenAI Fehler:', error);
      
      // Verbesserter Fallback
      const fallbackDescription = `🎯 **${productName}** - Das perfekte ${productType || 'Produkt'} für ${targetAudience || 'dich'}!

✨ **Hauptfeatures:**
${keyFeatures.map((feature: string, _index: number) => `• ✅ ${feature}`).join('\n')}

💫 **Warum ${productName}?**
Entdecke die einzigartigen Vorteile und die herausragende Qualität dieses Produkts. Perfekt abgestimmt auf die Bedürfnisse ${targetAudience ? `von ${targetAudience}` : 'moderner Anwender'}.

🛡️ **Zufriedenheit garantiert!**`;

      const fallbackShortDescription = `🚀 ${productName} - ${keyFeatures.slice(0, 2).join(' • ')}${keyFeatures.length > 2 ? ' • ...' : ''}`;

      const fallbackTags = [
        productName, 
        productType, 
        ...keyFeatures,
        targetAudience,
        tone
      ].filter(Boolean).slice(0, 8);

      return {
        success: false,
        description: fallbackDescription,
        shortDescription: fallbackShortDescription.length > 150 ? fallbackShortDescription.substring(0, 147) + '...' : fallbackShortDescription,
        tags: fallbackTags,
        error: error instanceof Error ? error.message : 'AI service unavailable - Using fallback'
      };
    }
  });

  // Get orders
  server.get('/woo/orders', {
    schema: {
      tags: ['woocommerce'],
      summary: 'Get orders',
      description: 'Retrieve orders from WooCommerce',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          per_page: { type: 'integer', default: 10 },
          status: { type: 'string' }
        }
      }
    }
  }, async (request: any) => {
    try {
      const { page, per_page, status } = request.query;
      const orders = await wooCommerce.getOrders({ page, per_page, status });
      return { success: true, data: orders };
    } catch (error: any) {
      server.log.error('Fehler beim Abrufen der Orders:', error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  });

  // Get customers
  server.get('/woo/customers', {
    schema: {
      tags: ['woocommerce'],
      summary: 'Get customers',
      description: 'Retrieve customers from WooCommerce',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          per_page: { type: 'integer', default: 10 }
        }
      }
    }
  }, async (request: any) => {
    try {
      const { page, per_page } = request.query;
      const customers = await wooCommerce.getCustomers({ page, per_page });
      return { success: true, data: customers };
    } catch (error: any) {
      server.log.error('Fehler beim Abrufen der Kunden:', error);
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }
  });

  // Bulk-Update für mehrere Produkte
  server.put('/woo/products/update', {
    schema: {
      tags: ['woocommerce'],
      summary: 'Bulk update products',
      description: 'Update multiple products in WooCommerce store',
      body: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            updateData: { type: 'object' }
          },
          required: ['id', 'updateData']
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            results: { type: 'array' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, _reply: any) => {
    try {
      const updates = request.body;
      const results = [];
      for (const { id, updateData } of updates) {
        try {
          const product = await wooCommerce.updateProduct(id, updateData);
          results.push({ id, success: true, product });
        } catch (error: any) {
          results.push({ id, success: false, error: error.message });
        }
      }
      return { success: true, results };
    } catch (error: any) {
      server.log.error('Fehler beim Bulk-Update:', error);
      return { success: false, error: error.message };
    }
  });
}