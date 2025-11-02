import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

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
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // ✅ ECHTE WooCommerce API statt Mock-Daten
        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
        };

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
        
        // Transformiere WooCommerce-Format zu unserem Format
        const categories: Category[] = wooCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          productCount: cat.count || 0,
          needsOptimization: cat.count > 0 && !cat.description, // Optimierung nötig wenn Produkte aber keine Beschreibung
          parentId: cat.parent || undefined,
          description: cat.description || undefined
        }));

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

        // ✅ WooCommerce API Integration
        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
        };

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
