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
        // TODO: WooCommerce API Integration
        const mockCategories: Category[] = [
          { id: 1, name: 'WordPress Themes', productCount: 15, needsOptimization: false },
          { id: 2, name: 'Plugins', productCount: 8, needsOptimization: true },
          { id: 3, name: 'Templates', productCount: 12, needsOptimization: false },
          { id: 4, name: 'Digital Products', productCount: 25, needsOptimization: true }
        ];

        return reply.send({
          success: true,
          data: mockCategories
        });
      } catch (_error) {
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
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

        // TODO: WooCommerce API Integration
        const newCategory: Category = {
          id: Date.now(),
          ...categoryData
        };

        return reply.send({
          success: true,
          data: newCategory,
          message: 'Kategorie erfolgreich erstellt'
        });
      } catch (_error) {
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
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
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
      }
    }
  );
}
