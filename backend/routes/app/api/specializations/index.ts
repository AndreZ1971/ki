import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { SpecializationService } from '../../../../services/specializationService';
import {
  SignedSpecialization,
  SpecializationData,
} from '../../../../types/specialization';
import { logger } from '../../../../logger';

/**
 * ARI Spezialisierungs-Dateiformat (.ari-spec)
 * 
 * Format-Spezifikation:
 * - Extension: .ari-spec oder .json (muss Format validieren)
 * - Inhalt: Signierte Spezialisierungs-Datei von kaufe-es.eu
 * - Struktur: { format: "ari-specialization", version: "1.0", data: {...} }
 */
export interface ARISpecializationFile {
  format: "ari-specialization";
  version: "1.0";
  issuer: "kaufe-es.eu";
  timestamp: number;
  signature: string;
  data: {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    category?: string;
    icon?: string;
    version?: string;
    contextInstructions?: string[];
    examplePrompts?: string[];
    features?: string[];
  };
}

/**
 * Validiert, dass eine Datei das .ari-spec Format erfüllt
 */
function validateARISpecFormat(data: Record<string, unknown>): {
  valid: boolean;
  error?: string;
} {
  // Prüfe ob Pflichtfelder für ARI-Spec vorhanden sind
  if (data.format !== "ari-specialization") {
    return {
      valid: false,
      error: 'Format muss "ari-specialization" sein',
    };
  }

  if (!data.data || typeof data.data !== "object") {
    return {
      valid: false,
      error: 'Feld "data" ist erforderlich',
    };
  }

  const specData = data.data as Record<string, unknown>;

  // Prüfe erforderliche Felder
  const requiredFields = ["id", "name", "description", "systemPrompt"];
  for (const field of requiredFields) {
    if (!specData[field]) {
      return {
        valid: false,
        error: `Erforderliches Feld fehlt: ${field}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Spezialisierungs-Routen
 * Endpoints für Upload, Verwaltung und Aktivierung von Spezialisierungen
 */
export default async function specializationRoutes(server: FastifyInstance) {
  /**
   * GET /api/specializations/list
   * Listet alle installierten Spezialisierungen auf
   */
  server.get(
    '/api/specializations/list',
    {
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
                    isActive: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = 'default'; // TODO: Get from auth
        const specializations =
          await SpecializationService.getInstalledSpecializations(userId);

        return reply.send({
          success: true,
          specializations,
        });
      } catch (error) {
        logger.error(
          { err: error },
          '❌ Fehler beim Laden der Spezialisierungen'
        );
        return reply.status(500).send({
          success: false,
          error: 'Fehler beim Laden der Spezialisierungen',
        });
      }
    }
  );

  /**
   * POST /api/specializations/upload
   * Lädt eine signierte Spezialisierungs-Datei hoch
   */
  server.post(
    '/api/specializations/upload',
    {
      schema: {
        tags: ['specializations'],
        summary: 'Upload specialization',
        description:
          'Upload and install a signed specialization file from kaufe-es.eu',
        body: {
          type: 'object',
          required: ['signedData'],
          properties: {
            signedData: {
              type: 'object',
              description: 'Signed specialization JSON from WooCommerce',
            },
          },
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
                  description: { type: 'string' },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: { signedData: SignedSpecialization } }>,
      reply: FastifyReply
    ) => {
      try {
        const { signedData } = request.body;

        // Validiere Signatur
        const isValid = SpecializationService.validateSignature(signedData);
        if (!isValid) {
          return reply.status(400).send({
            success: false,
            error:
              'Ungültige Signatur - Datei wurde manipuliert oder stammt nicht von kaufe-es.eu',
          });
        }

        // Speichere verschlüsselt
        const userId = 'default'; // TODO: Get from auth
        const stored = await SpecializationService.encryptAndStore(
          signedData.data,
          userId
        );

        logger.info(`✅ Spezialisierung installiert: ${stored.name}`);

        return reply.send({
          success: true,
          message: `Spezialisierung "${stored.name}" erfolgreich installiert!`,
          specialization: {
            id: stored.id,
            name: stored.name,
            description: stored.description,
          },
        });
      } catch (error) {
        logger.error({ err: error }, '❌ Fehler beim Upload');
        return reply.status(500).send({
          success: false,
          error: 'Fehler beim Installieren der Spezialisierung',
        });
      }
    }
  );

  /**
   * POST /api/specializations/activate
   * Aktiviert eine installierte Spezialisierung
   */
  server.post(
    '/api/specializations/activate',
    {
      schema: {
        tags: ['specializations'],
        summary: 'Activate specialization',
        description:
          'Set a specialization as active (only one can be active at a time)',
        body: {
          type: 'object',
          required: ['specId'],
          properties: {
            specId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: { specId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { specId } = request.body;
        const userId = 'default'; // TODO: Get from auth

        await SpecializationService.activateSpecialization(userId, specId);

        return reply.send({
          success: true,
          message: `Spezialisierung aktiviert`,
        });
      } catch (error) {
        logger.error({ err: error }, '❌ Fehler beim Aktivieren');
        return reply.status(500).send({
          success: false,
          error:
            error instanceof Error ? error.message : 'Fehler beim Aktivieren',
        });
      }
    }
  );

  /**
   * DELETE /api/specializations/:specId
   * Löscht eine installierte Spezialisierung
   */
  server.delete(
    '/api/specializations/:specId',
    {
      schema: {
        tags: ['specializations'],
        summary: 'Delete specialization',
        description: 'Remove an installed specialization',
        params: {
          type: 'object',
          properties: {
            specId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { specId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { specId } = request.params;
        const userId = 'default'; // TODO: Get from auth

        await SpecializationService.deleteSpecialization(userId, specId);

        return reply.send({
          success: true,
          message: 'Spezialisierung gelöscht',
        });
      } catch (error) {
        logger.error({ err: error }, '❌ Fehler beim Löschen');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Fehler beim Löschen',
        });
      }
    }
  );

  /**
   * GET /api/specializations/active
   * Gibt die aktuell aktive Spezialisierung zurück
   */
  server.get(
    '/api/specializations/active',
    {
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
                  systemPrompt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = 'default'; // TODO: Get from auth
        const active =
          await SpecializationService.getActiveSpecialization(userId);

        return reply.send({
          success: true,
          specialization: active,
        });
      } catch (error) {
        logger.error(
          { err: error },
          '❌ Fehler beim Laden der aktiven Spezialisierung'
        );
        return reply.status(500).send({
          success: false,
          error: 'Fehler beim Laden',
        });
      }
    }
  );
}

/**
 * Sanitizes specialization data to prevent XSS and injection attacks
 * - Removes null bytes
 * - Trims whitespace
 * - Validates string types
 * - Removes potentially dangerous fields
 */
function sanitizeSpecializationData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  // List of allowed fields
  const allowedFields = [
    'id',
    'name',
    'description',
    'systemPrompt',
    'category',
    'icon',
    'version',
    'features',
    'contextInstructions',
    'author',
    'createdAt',
    'updatedAt',
  ];

  for (const field of allowedFields) {
    if (!(field in data)) continue;

    const value: unknown = data[field];

    // Sanitize strings
    if (typeof value === 'string') {
      // Remove null bytes
      let s = (value as string).replace(/\0/g, '');
      // Trim whitespace
      s = s.trim();
      // Validate length (max 5000 chars for most fields, 50000 for systemPrompt)
      const maxLength = field === 'systemPrompt' ? 50000 : 5000;
      if (s.length > maxLength) {
        s = s.substring(0, maxLength);
      }
      sanitized[field] = s;
    }
    // Allow arrays for features
    else if (field === 'features' && Array.isArray(value)) {
      sanitized[field] = value
        .filter((item) => typeof item === 'string')
        .map((item) => (item as string).substring(0, 100))
        .slice(0, 20); // Max 20 features
    }
    // Allow arrays for contextInstructions
    else if (field === 'contextInstructions' && Array.isArray(value)) {
      sanitized[field] = value
        .filter((item) => typeof item === 'string')
        .map((item) => (item as string).substring(0, 2000))
        .slice(0, 50);
    }
    // Allow numbers for version timestamps
    else if (field === 'createdAt' || field === 'updatedAt') {
      if (
        typeof value === 'number' &&
        value > 0 &&
        value < Date.now() + 86400000
      ) {
        sanitized[field] = value;
      }
    }
    // For other types, keep if valid
    else if (value !== null && value !== undefined) {
      sanitized[field] = value;
    }
  }

  // Ensure required fields are present
  if (!sanitized.id || !sanitized.name || !sanitized.systemPrompt) {
    throw new Error('Erforderliche Felder fehlen nach Sanitization');
  }

  return sanitized;
}
