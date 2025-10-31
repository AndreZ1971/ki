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
        description: 'Holt alle Bundles'
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const mockBundles: Bundle[] = [
          {
            id: 1,
            name: 'WordPress Starter Pack',
            products: ['Theme', 'Plugin', 'Tutorial'],
            price: 79.99,
            discount: 20,
            active: true,
            createdAt: '2024-01-15'
          },
          {
            id: 2,
            name: 'SEO Complete Bundle',
            products: ['SEO Plugin', 'Guide', 'Templates'],
            price: 129.99,
            discount: 25,
            active: false,
            createdAt: '2024-01-10'
          }
        ];

        return reply.send({
          success: true,
          data: mockBundles
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
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

        const newBundle: Bundle = {
          id: Date.now(),
          ...bundleData,
          createdAt: new Date().toISOString()
        };

        return reply.send({
          success: true,
          data: newBundle,
          message: 'Bundle erfolgreich erstellt'
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
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
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
      }
    }
  );
}
