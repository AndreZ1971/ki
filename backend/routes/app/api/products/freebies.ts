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
        description: 'Holt alle Freebies'
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const mockFreebies: Freebie[] = [
          { id: 1, name: 'SEO Guide Ebook', type: 'ebook', downloads: 142, created: '2024-01-15' },
          { id: 2, name: 'WordPress Checklist', type: 'checklist', downloads: 89, created: '2024-01-10' },
          { id: 3, name: 'Social Media Templates', type: 'templates', downloads: 203, created: '2024-01-05' }
        ];

        return reply.send({
          success: true,
          data: mockFreebies
        });
      } catch (_error) {
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
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
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
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
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
      }
    }
  );
}
