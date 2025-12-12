import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SpecializationService } from '../../../../services/specializationService';
import { SignedSpecialization } from '../../../../types/specialization';
import { logger } from '../../../../logger';

/**
 * Spezialisierungs-Routen
 * Endpoints für Upload, Verwaltung und Aktivierung von Spezialisierungen
 */
export default async function specializationRoutes(server: FastifyInstance) {
  
  /**
   * GET /api/specializations/list
   * Listet alle installierten Spezialisierungen auf
   */
  server.get('/api/specializations/list', {
    schema: {
      tags: ['specializations'],
      summary: 'List installed specializations',
      description: 'Get all installed specializations for the current user',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            specializations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  icon: { type: 'string' },
                  version: { type: 'string' },
                  features: { type: 'array', items: { type: 'string' } },
                  installedAt: { type: 'number' },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    }
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = 'default'; // TODO: Get from auth
      const specializations = await SpecializationService.getInstalledSpecializations(userId);
      
      return reply.send({
        success: true,
        specializations
      });
    } catch (error) {
      logger.error({ err: error }, '❌ Fehler beim Laden der Spezialisierungen');
      return reply.status(500).send({
        success: false,
        error: 'Fehler beim Laden der Spezialisierungen'
      });
    }
  });

  /**
   * POST /api/specializations/upload
   * Lädt eine signierte Spezialisierungs-Datei hoch
   */
  server.post('/api/specializations/upload', {
    schema: {
      tags: ['specializations'],
      summary: 'Upload specialization',
      description: 'Upload and install a signed specialization file from kaufe-es.eu',
      body: {
        type: 'object',
        required: ['signedData'],
        properties: {
          signedData: {
            type: 'object',
            description: 'Signed specialization JSON from WooCommerce'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            specialization: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: { signedData: SignedSpecialization } }>, reply: FastifyReply) => {
    try {
      const { signedData } = request.body;

      // Validiere Signatur
      const isValid = SpecializationService.validateSignature(signedData);
      if (!isValid) {
        return reply.status(400).send({
          success: false,
          error: 'Ungültige Signatur - Datei wurde manipuliert oder stammt nicht von kaufe-es.eu'
        });
      }

      // Speichere verschlüsselt
      const userId = 'default'; // TODO: Get from auth
      const stored = await SpecializationService.encryptAndStore(signedData.data, userId);

      logger.info(`✅ Spezialisierung installiert: ${stored.name}`);

      return reply.send({
        success: true,
        message: `Spezialisierung "${stored.name}" erfolgreich installiert!`,
        specialization: {
          id: stored.id,
          name: stored.name,
          description: stored.description
        }
      });
    } catch (error) {
      logger.error({ err: error }, '❌ Fehler beim Upload');
      return reply.status(500).send({
        success: false,
        error: 'Fehler beim Installieren der Spezialisierung'
      });
    }
  });

  /**
   * POST /api/specializations/activate
   * Aktiviert eine installierte Spezialisierung
   */
  server.post('/api/specializations/activate', {
    schema: {
      tags: ['specializations'],
      summary: 'Activate specialization',
      description: 'Set a specialization as active (only one can be active at a time)',
      body: {
        type: 'object',
        required: ['specId'],
        properties: {
          specId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: { specId: string } }>, reply: FastifyReply) => {
    try {
      const { specId } = request.body;
      const userId = 'default'; // TODO: Get from auth

      await SpecializationService.activateSpecialization(userId, specId);

      return reply.send({
        success: true,
        message: `Spezialisierung aktiviert`
      });
    } catch (error) {
      logger.error({ err: error }, '❌ Fehler beim Aktivieren');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Fehler beim Aktivieren'
      });
    }
  });

  /**
   * DELETE /api/specializations/:specId
   * Löscht eine installierte Spezialisierung
   */
  server.delete('/api/specializations/:specId', {
    schema: {
      tags: ['specializations'],
      summary: 'Delete specialization',
      description: 'Remove an installed specialization',
      params: {
        type: 'object',
        properties: {
          specId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { specId: string } }>, reply: FastifyReply) => {
    try {
      const { specId } = request.params;
      const userId = 'default'; // TODO: Get from auth

      await SpecializationService.deleteSpecialization(userId, specId);

      return reply.send({
        success: true,
        message: 'Spezialisierung gelöscht'
      });
    } catch (error) {
      logger.error({ err: error }, '❌ Fehler beim Löschen');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Fehler beim Löschen'
      });
    }
  });

  /**
   * GET /api/specializations/active
   * Gibt die aktuell aktive Spezialisierung zurück
   */
  server.get('/api/specializations/active', {
    schema: {
      tags: ['specializations'],
      summary: 'Get active specialization',
      description: 'Get the currently active specialization context',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            specialization: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                systemPrompt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = 'default'; // TODO: Get from auth
      const active = await SpecializationService.getActiveSpecialization(userId);

      return reply.send({
        success: true,
        specialization: active
      });
    } catch (error) {
      logger.error({ err: error }, '❌ Fehler beim Laden der aktiven Spezialisierung');
      return reply.status(500).send({
        success: false,
        error: 'Fehler beim Laden'
      });
    }
  });
}
