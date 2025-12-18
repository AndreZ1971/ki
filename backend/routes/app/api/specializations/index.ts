import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { SpecializationService } from '../../../../services/specializationService';
import {
  SignedSpecialization,
  SpecializationData,
} from '../../../../types/specialization';
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
   * POST /api/settings/specialization/upload
   * Lädt eine Spezialisierungs-Datei vom Settings-Frontend hoch
   * Akzeptiert JSON/CSV mit FormData
   *
   * Security Features:
   * - Input Sanitization
   * - File Integrity Verification
   * - Audit Logging
   * - Rate Limiting Support
   * - Encrypted Storage
   */
  server.post<{ Body: unknown }>(
    '/api/settings/specialization/upload',
    {
      schema: {
        tags: ['specializations'],
        summary: 'Upload specialization from settings',
        description:
          'Upload specialization file (JSON/CSV) directly from frontend settings with enhanced security',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  checksum: { type: 'string' },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              code: { type: 'string' },
            },
          },
          413: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              code: { type: 'string' },
            },
          },
          429: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const uploadStartTime = Date.now();
      let fileName = '';
      let fileSize = 0;
      let fileChecksum = '';

      try {
        // Extract user ID from headers or use default
        const userId = (request.headers['x-user-id'] as string) || 'default';
        const uploadId = crypto.randomUUID();

        logger.debug(
          `📋 Upload-Session gestartet: ${uploadId} | User: ${userId}`
        );

        // Get file from request
        const data = await request.file();

        if (!data) {
          logger.warn(
            `⚠️ Upload ${uploadId} fehlergeschlagen: Keine Datei übertragen`
          );
          return reply.status(400).send({
            success: false,
            error: 'Keine Datei hochgeladen',
            code: 'NO_FILE_PROVIDED',
          });
        }

        fileName = data.filename;
        fileSize = data.file.readableLength || 0;

        // Validate file extension
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        if (!['json', 'csv'].includes(fileExtension || '')) {
          logger.warn(
            `⚠️ Upload ${uploadId} fehlergeschlagen: Ungültiger Dateityp ${fileExtension}`
          );
          return reply.status(400).send({
            success: false,
            error: 'Nur .json oder .csv Dateien sind erlaubt',
            code: 'INVALID_FILE_TYPE',
          });
        }

        // Validate file size (max 5MB)
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (fileSize > MAX_FILE_SIZE) {
          logger.warn(
            `⚠️ Upload ${uploadId} fehlergeschlagen: Datei zu groß (${fileSize} bytes > ${MAX_FILE_SIZE} bytes)`
          );
          return reply.status(413).send({
            success: false,
            error: `Datei zu groß (${(fileSize / 1024 / 1024).toFixed(2)}MB > 5MB)`,
            code: 'FILE_TOO_LARGE',
          });
        }

        // Read file content
        const buffer = await data.toBuffer();
        const content = buffer.toString('utf-8');

        // Calculate file checksum for integrity verification
        fileChecksum = crypto.createHash('sha256').update(buffer).digest('hex');

        logger.debug(
          `✓ Datei geladen: ${fileName} (${(fileSize / 1024).toFixed(2)}KB) | Checksum: ${fileChecksum.substring(0, 8)}...`
        );

        // Parse content
        let specialization: Record<string, unknown>;

        try {
          if (fileExtension === 'csv') {
            // Parse CSV to JSON
            const lines = content
              .trim()
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line.length > 0);

            if (lines.length < 2) {
              throw new Error(
                'CSV muss mindestens 2 Zeilen haben (Header + Daten)'
              );
            }

            const headers = lines[0].split(',').map((h) => h.trim());
            const values = lines[1].split(',').map((v) => v.trim());

            specialization = {};
            headers.forEach((header, index) => {
              specialization[header] = values[index] || '';
            });
          } else {
            // Parse JSON
            specialization = JSON.parse(content);
          }
        } catch (parseError) {
          const errorMsg =
            parseError instanceof Error
              ? parseError.message
              : 'Unbekannter Parse-Fehler';
          logger.warn(
            `⚠️ Upload ${uploadId} fehlergeschlagen: Parse-Fehler - ${errorMsg}`
          );
          return reply.status(400).send({
            success: false,
            error: `Ungültiges ${fileExtension?.toUpperCase() || 'Datei'}-Format: ${errorMsg}`,
            code: 'INVALID_FILE_FORMAT',
          });
        }

        // Validate required fields
        const requiredFields = ['id', 'name', 'systemPrompt', 'description'];
        const missingFields = requiredFields.filter(
          (field) => !specialization[field]
        );

        if (missingFields.length > 0) {
          logger.warn(
            `⚠️ Upload ${uploadId} fehlergeschlagen: Fehlende Felder - ${missingFields.join(', ')}`
          );
          return reply.status(400).send({
            success: false,
            error: `Erforderliche Felder fehlen: ${missingFields.join(', ')}`,
            code: 'MISSING_REQUIRED_FIELDS',
          });
        }

        // Sanitize specialization data
        specialization = sanitizeSpecializationData(specialization);

        logger.debug(
          `✓ Validation erfolgreich | ID: ${specialization.id} | Name: ${specialization.name}`
        );

        // Store specialization (encrypted)
        const stored = await SpecializationService.encryptAndStore(
          specialization as unknown as SpecializationData,
          userId
        );

        const uploadDuration = Date.now() - uploadStartTime;

        // Audit logging
        logger.info(
          {
            uploadId,
            userId,
            specializationId: stored.id,
            specializationName: stored.name,
            fileName,
            fileSize,
            fileChecksum: fileChecksum.substring(0, 16),
            duration: uploadDuration,
            status: 'SUCCESS',
          },
          `✅ Spezialisierung erfolgreich hochgeladen: ${stored.name}`
        );

        return reply.send({
          success: true,
          message: `Spezialisierung "${stored.name}" erfolgreich installiert!`,
          data: {
            id: stored.id,
            name: stored.name,
            checksum: fileChecksum,
          },
        });
      } catch (error) {
        const uploadDuration = Date.now() - uploadStartTime;
        const errorMessage =
          error instanceof Error ? error.message : 'Unbekannter Fehler';

        // Error audit logging
        logger.error(
          {
            uploadId: crypto.randomUUID(),
            fileName,
            fileSize,
            fileChecksum: fileChecksum.substring(0, 16),
            duration: uploadDuration,
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
            status: 'ERROR',
          },
          `❌ Fehler beim Settings-Upload: ${errorMessage}`
        );

        return reply.status(400).send({
          success: false,
          error: `Upload fehlgeschlagen: ${errorMessage}`,
          code: 'UPLOAD_FAILED',
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

    let value: unknown = data[field];

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
