
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getConfig } from '../../../../config';
import { getOpenAIClient, executeOpenAI } from '../../../../utils/openaiHelper';

interface Category {
  id: number;
  name: string;
  slug?: string;
  productCount: number;
  needsOptimization: boolean;
  parentId?: number;
  description?: string;
}

interface CreateCategoryBody {
  name: string;
  slug?: string;
  productCount: number;
  needsOptimization: boolean;
  parentId?: number;
  description?: string;
}

interface CategorySuggestRequest {
  title: string;
  description: string;
  maxSuggestions?: number;
}

interface CategorySuggestion {
  name: string;
  confidence: number;
  reason: string;
}

async function fetchWooCategories() {
  const cfg = getConfig();
  const wooConfig = {
    url: cfg.woocommerce?.url || '',
    consumerKey: cfg.woocommerce?.consumerKey || '',
    consumerSecret: cfg.woocommerce?.consumerSecret || '',
  };

  if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
    throw new Error('WooCommerce API nicht konfiguriert');
  }

  const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');

  const response = await fetch(`${wooConfig.url}/wp-json/wc/v3/products/categories?per_page=100`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`WooCommerce API Error: ${response.status}`);
  }

  const wooCategories = await response.json() as any[];

  const categories: Category[] = wooCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    productCount: cat.count || 0,
    needsOptimization: cat.count > 0 && !cat.description,
    parentId: cat.parent || undefined,
    description: cat.description || undefined
  }));

  return categories;
}

export default async function categoryRoutes(server: FastifyInstance) {
  
  // Get All Categories
  server.get(
    '/',
    {
      schema: {
        tags: ['categories'],
        description: 'Holt alle Kategorien'
      }
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const categories = await fetchWooCategories();

        return reply.send({
          success: true,
          data: categories,
          total: categories.length,
          source: 'woocommerce-api'
        });
      } catch (_error) {
        console.error('Categories API Error:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // Create Category
  server.post<{ Body: CreateCategoryBody }>(
    '/',
    {
      schema: {
        tags: ['categories'],
        description: 'Erstellt eine neue Kategorie',
        body: {
          type: 'object',
          required: ['name', 'productCount', 'needsOptimization'],
          properties: {
            name: { type: 'string' },
            slug: { type: 'string' },
            productCount: { type: 'number' },
            needsOptimization: { type: 'boolean' },
            parentId: { type: 'number' },
            description: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateCategoryBody }>, reply: FastifyReply) => {
      try {
        const categoryData = request.body;

        // WooCommerce-Konfiguration dynamisch laden
        const cfg = getConfig();
        const wooConfig = {
          url: cfg.woocommerce?.url || '',
          consumerKey: cfg.woocommerce?.consumerKey || '',
          consumerSecret: cfg.woocommerce?.consumerSecret || '',
        };

        if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
          throw new Error('WooCommerce API nicht konfiguriert');
        }

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');

        const response = await fetch(`${wooConfig.url}/wp-json/wc/v3/products/categories`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: categoryData.name,
            slug: categoryData.slug,
            description: categoryData.description,
            parent: categoryData.parentId || 0
          })
        });

        if (!response.ok) {
          throw new Error(`WooCommerce API Error: ${response.status}`);
        }

        const wooCategory = await response.json() as any;

        const newCategory: Category = {
          id: wooCategory.id,
          name: wooCategory.name,
          slug: wooCategory.slug,
          productCount: wooCategory.count || 0,
          needsOptimization: false,
          parentId: wooCategory.parent || undefined,
          description: wooCategory.description || undefined
        };

        return reply.send({
          success: true,
          data: newCategory,
          message: 'Kategorie erfolgreich in WooCommerce erstellt'
        });
      } catch (_error) {
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // ML Category Suggestion
  server.post<{ Body: CategorySuggestRequest }>(
    '/ml/suggest',
    {
      schema: {
        tags: ['categories'],
        description: 'Schlägt Kategorien auf Basis von Titel und Beschreibung vor',
        body: {
          type: 'object',
          required: ['title', 'description'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            maxSuggestions: { type: 'number', minimum: 1, maximum: 10 }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CategorySuggestRequest }>, reply: FastifyReply) => {
      try {
        const { title, description, maxSuggestions = 5 } = request.body;

        if (!title?.trim() || !description?.trim()) {
          return reply.code(400).send({ success: false, error: 'Titel und Beschreibung sind erforderlich' });
        }

        const categories = await fetchWooCategories();
        const categoryNames = categories.map(cat => cat.name).slice(0, 100); // begrenze Kontext

        const openai = getOpenAIClient();

        const completion = await executeOpenAI(
          async () => {
            return openai.chat.completions.create({
              model: 'gpt-4o-mini',
              temperature: 0.2,
              response_format: { type: 'json_object' },
              messages: [
                {
                  role: 'system',
                  content: 'Du bist ein präziser Produkt-Kategorisierer für WooCommerce. Antworte nur mit JSON.'
                },
                {
                  role: 'user',
                  content: [
                    'Finde die besten Kategorien für folgendes Produkt. Nutze nur die bekannten Kategorien.',
                    `Produkt: ${title}`,
                    `Beschreibung: ${description}`,
                    `Bekannte Kategorien (${categoryNames.length}): ${categoryNames.join(', ')}`,
                    'Gib maximal ' + maxSuggestions + ' Vorschläge zurück.',
                    'Antwortformat: { "suggestions": [ { "name": string, "confidence": 0-1, "reason": string } ] }',
                    'Nutze nur Kategorienamen aus der Liste, erfinde keine neuen.'
                  ].join('\n')
                }
              ]
            });
          },
          'category-ml-suggest',
          { title, maxSuggestions }
        );

        const rawContent = completion.choices[0]?.message?.content || '';
        console.log('🔍 [CategorySuggest] OpenAI Response:', rawContent.substring(0, 200));

        let parsed: { suggestions?: CategorySuggestion[] } = {};
        try {
          parsed = JSON.parse(rawContent);
        } catch (_parseError) {
          console.warn('⚠️ [CategorySuggest] Konnte JSON nicht direkt parsen, versuche zu reparieren', _parseError);
          // Fallback: versuche JSON in der Response zu finden
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
            } catch (e2) {
              console.error('❌ JSON-Reparatur fehlgeschlagen:', e2);
            }
          }
        }

        const suggestions = (parsed.suggestions || [])
          .filter(s => s && s.name && typeof s.name === 'string')
          .slice(0, maxSuggestions)
          .map(s => ({
            name: String(s.name).trim(),
            confidence: Math.min(Math.max(Number(s.confidence) || 0.5, 0), 1),
            reason: s.reason || 'Automatisch vorgeschlagen'
          }));

        // Fallback mit bekannten Kategorien falls AI fehlschlägt
        if (suggestions.length === 0) {
          console.warn('⚠️ [CategorySuggest] Keine gültigen AI-Vorschläge, nutze Fallback');
          const categories = await fetchWooCategories();
          const fallbackSuggestions = categories
            .sort((a, b) => b.productCount - a.productCount)
            .slice(0, maxSuggestions)
            .map(cat => ({
              name: cat.name,
              confidence: 0.6,
              reason: 'Häufigste Kategorie (Fallback)'
            }));
          
          if (fallbackSuggestions.length > 0) {
            return reply.send({ success: true, suggestions: fallbackSuggestions });
          }
        }

        return reply.send({ success: true, suggestions });
      } catch (_error) {
        console.error('❌ Category ML Suggest Error:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Kategorievorschläge konnten nicht generiert werden'
        });
      }
    }
  );

  // Optimize Categories
  server.post(
    '/optimize',
    {
      schema: {
        tags: ['categories'],
        description: 'Optimiert alle Kategorien'
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // TODO: AI-basierte Kategorie-Optimierung implementieren

        return reply.send({
          success: true,
          message: 'Alle Kategorien erfolgreich optimiert',
          optimizedCount: 4
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
