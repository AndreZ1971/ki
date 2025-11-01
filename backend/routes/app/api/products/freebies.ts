import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface Freebie {
  id: number;
  name: string;
  type: 'ebook' | 'checklist' | 'templates' | 'guide';
  downloads: number;
  created: string;
  description?: string;
  fileUrl?: string;
}

interface CreateFreebieBody {
  name: string;
  type: 'ebook' | 'checklist' | 'templates' | 'guide';
  downloads: number;
  created: string;
  description?: string;
  fileUrl?: string;
}

interface AutoCreateBody {
  type: 'ebook' | 'checklist' | 'templates' | 'guide';
}

export default async function freebieRoutes(server: FastifyInstance) {
  
  // Get All Freebies
  server.get(
    '/',
    {
      schema: {
        tags: ['freebies'],
        description: 'Holt alle kostenlosen Produkte (Preis = 0) aus WooCommerce'
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // ✅ ECHTE Freebies aus WooCommerce (Produkte mit Preis = 0)
        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
        };

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');
        
        // Lade alle Produkte und filtere kostenlose
        const productsResponse = await fetch(
          `${wooConfig.url}/wp-json/wc/v3/products?per_page=100`,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!productsResponse.ok) {
          throw new Error(`WooCommerce API Error: ${productsResponse.status}`);
        }

        const products = await productsResponse.json() as any[];
        
        // Filtere Produkte mit Preis = 0 oder "0.00"
        const freeProducts = products.filter(p => 
          parseFloat(p.price) === 0 || p.price === '0' || p.price === '0.00'
        );
        
        // Typ-Erkennung basierend auf Kategorie oder Name
        const detectType = (product: any): Freebie['type'] => {
          const name = product.name.toLowerCase();
          const categories = product.categories?.map((c: any) => c.name.toLowerCase()) || [];
          
          if (name.includes('ebook') || name.includes('e-book') || categories.some((c: string) => c.includes('ebook'))) {
            return 'ebook';
          }
          if (name.includes('checklist') || categories.some((c: string) => c.includes('checklist'))) {
            return 'checklist';
          }
          if (name.includes('template') || categories.some((c: string) => c.includes('template'))) {
            return 'templates';
          }
          if (name.includes('guide') || name.includes('anleitung') || categories.some((c: string) => c.includes('guide'))) {
            return 'guide';
          }
          return 'guide'; // Default
        };
        
        // Transformiere zu Freebie-Format
        const freebies: Freebie[] = freeProducts.map(product => ({
          id: product.id,
          name: product.name,
          type: detectType(product),
          downloads: product.total_sales || 0, // Total Sales = Downloads bei kostenlosen Produkten
          created: product.date_created,
          description: product.short_description || product.description,
          fileUrl: product.downloads?.[0]?.file || product.permalink
        }));

        return reply.send({
          success: true,
          data: freebies,
          total: freebies.length,
          source: 'woocommerce-free-products',
          totalProducts: products.length
        });
      } catch (_error) {
        console.error('Freebies API Error:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // Create Freebie
  server.post<{ Body: CreateFreebieBody }>(
    '/',
    {
      schema: {
        tags: ['freebies'],
        description: 'Erstellt ein neues Freebie',
        body: {
          type: 'object',
          required: ['name', 'type', 'downloads', 'created'],
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['ebook', 'checklist', 'templates', 'guide'] },
            downloads: { type: 'number' },
            created: { type: 'string' },
            description: { type: 'string' },
            fileUrl: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateFreebieBody }>, reply: FastifyReply) => {
      try {
        const freebieData = request.body;

        const newFreebie: Freebie = {
          id: Date.now(),
          ...freebieData
        };

        return reply.send({
          success: true,
          data: newFreebie,
          message: 'Freebie erfolgreich erstellt'
        });
      } catch (_error) {
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // Auto-Create Freebie with AI
  server.post<{ Body: AutoCreateBody }>(
    '/auto-create',
    {
      schema: {
        tags: ['freebies'],
        description: 'Erstellt automatisch ein optimiertes Freebie mit AI',
        body: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: ['ebook', 'checklist', 'templates', 'guide'] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: AutoCreateBody }>, reply: FastifyReply) => {
      try {
        const { type } = request.body;

        // TODO: AI-basierte Freebie-Generierung
        const aiGeneratedFreebie: Freebie = {
          id: Date.now(),
          name: `AI-Generated ${type} #${Date.now()}`,
          type,
          downloads: 0,
          created: new Date().toISOString().split('T')[0],
          description: 'Automatisch mit AI erstellt'
        };

        return reply.send({
          success: true,
          data: aiGeneratedFreebie,
          message: 'Freebie erfolgreich mit AI erstellt'
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
