import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { SpecializationService } from '../../../../services/specializationService';
import {
  SpecializationData,
} from '../../../../types/specialization';
import { logger } from '../../../../logger';
import { i18nService } from '../../../../services/i18nService';

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
      error: i18nService.translate('error.invalidAriFormat'),
    };
  }

  if (!data.data || typeof data.data !== "object") {
    return {
      valid: false,
      error: i18nService.translate('error.missingDataField'),
    };
  }

  const specData = data.data as Record<string, unknown>;

  // Prüfe erforderliche Felder
  const requiredFields = ["id", "name", "description", "systemPrompt"];
  for (const field of requiredFields) {
    if (!specData[field]) {
      return {
        valid: false,
        error: `${i18nService.translate('error.missingRequiredField')}: ${field}`,
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
          error: i18nService.translate('error.loadingFailed'),
        });
      }
    }
  );

  /**
   * POST /api/specializations/upload
   * Lädt eine .ari-spec Datei hoch und speichert sie verschlüsselt
   * Akzeptiert Multipart FormData mit ARI-Format-Validierung
   */
  server.post(
    '/api/specializations/upload',
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
            error: i18nService.translate('error.noFileProvided'),
            code: 'NO_FILE_PROVIDED',
          });
        }

        fileName = data.filename;
        fileSize = data.file.readableLength || 0;

        // Validate file extension - only .ari-spec or .json (must be ARI format)
        const fileExtension = fileName.split(".").pop()?.toLowerCase();
        if (!["ari-spec", "json"].includes(fileExtension || "")) {
          logger.warn(
            `⚠️ Upload ${uploadId} fehlergeschlagen: Ungültiger Dateityp ${fileExtension}`
          );
          return reply.status(400).send({
            success: false,
            error: i18nService.translate('error.invalidFileType'),
            code: "INVALID_FILE_TYPE",
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
            error: i18nService.translate('error.fileTooLarge'),
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

        // Parse content - validate ARI format
        let specialization: Record<string, unknown>;

        try {
          // Only JSON for .ari-spec format (no CSV)
          specialization = JSON.parse(content);

          // Validate ARI-Spec format
          const formatValidation = validateARISpecFormat(specialization);
          if (!formatValidation.valid) {
            throw new Error(
              formatValidation.error ||
                "Ungültiges ARI-Spezialisierungs-Format"
            );
          }
        } catch (parseError) {
          const errorMsg =
            parseError instanceof Error
              ? parseError.message
              : "Unbekannter Parse-Fehler";
          logger.warn(
            `⚠️ Upload ${uploadId} fehlergeschlagen: Format-Validierung - ${errorMsg}`
          );
          return reply.status(400).send({
            success: false,
            error: `Ungültiges ARI-Spezialisierungs-Format: ${errorMsg}`,
            code: "INVALID_ARI_FORMAT",
          });
        }

        // Validate required fields (already validated by ARI format check)
        // Extract actual specialization data from ARI wrapper
        const ariSpec = specialization as unknown as ARISpecializationFile;
        const specData = ariSpec.data;

        if (!specData.id || !specData.name || !specData.systemPrompt) {
          logger.warn(
            `⚠️ Upload ${uploadId} fehlergeschlagen: Erforderliche Felder fehlen`
          );
          return reply.status(400).send({
            success: false,
            error: i18nService.translate('error.missingRequiredFields'),
            code: "MISSING_REQUIRED_FIELDS",
          });
        }

        // Sanitize and store specialization data (use extracted spec data)
        const sanitized = sanitizeSpecializationData(specData as Record<string, unknown>);

        logger.debug(
          `✓ ARI-Validation erfolgreich | ID: ${sanitized.id} | Name: ${sanitized.name} | Format: .ari-spec`
        );

        // Store specialization (encrypted)
        const stored = await SpecializationService.encryptAndStore(
          sanitized as unknown as SpecializationData,
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
          message: i18nService.translate('specialization.uploadSuccess'),
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
          `❌ Fehler beim Upload: ${errorMessage}`
        );

        return reply.status(400).send({
          success: false,
          error: i18nService.translate('error.uploadFailed'),
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
          message: i18nService.translate('specialization.activated'),
        });
      } catch (error) {
        logger.error({ err: error }, '❌ Fehler beim Aktivieren');
        return reply.status(500).send({
          success: false,
          error:
            error instanceof Error ? error.message : i18nService.translate('error.activationFailed'),
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
          message: i18nService.translate('specialization.deleted'),
        });
      } catch (error) {
        logger.error({ err: error }, '❌ Fehler beim Löschen');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : i18nService.translate('error.deletionFailed'),
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
          error: i18nService.translate('error.loadingFailed'),
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
    throw new Error(i18nService.translate('error.missingRequiredFields'));
  }

  return sanitized;
}
