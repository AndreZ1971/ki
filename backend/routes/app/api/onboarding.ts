// backend/routes/app/api/onboarding.ts
/**
 * Onboarding Endpoints
 * POST /api/onboarding/save-config - Speichert SHOP_URL in .env.production
 * GET /api/config - Lädt aktuelle Konfiguration
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../../logger.js';
import fs from 'fs/promises';
import path from 'path';

interface OnboardingRequest {
  shopUrl: string;
}

interface ConfigResponse {
  shopUrl: string | null;
  isConfigured: boolean;
}

const onboardingRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Hilfsfunktion: Pfad zu .env.production ermitteln
   */
  const getEnvProductionPath = (): string => {
    // Im Container: /app/data/.env.production (Volume-Mount)
    // Lokal: Project-Root/.env.production
    const containerPath = path.join('/app/data', '.env.production');
    const localPath = path.resolve(process.cwd(), '.env.production');

    return containerPath; // Immer Container-Pfad, da dort alles persistent ist
  };

  /**
   * Hilfsfunktion: .env.production lesen
   */
  const readEnvProduction = async (): Promise<string | null> => {
    const envPath = getEnvProductionPath();
    try {
      const content = await fs.readFile(envPath, 'utf-8');
      return content;
    } catch (error) {
      logger.debug(`[onboarding] .env.production nicht gefunden: ${envPath}`);
      return null;
    }
  };

  /**
   * Hilfsfunktion: SHOP_URL aus .env.production extrahieren
   */
  const parseShopUrl = (envContent: string): string | null => {
    const match = envContent.match(/^SHOP_URL=(.+)$/m);
    return match ? match[1].trim() : null;
  };

  /**
   * POST /api/onboarding/save-config
   * Speichert SHOP_URL in .env.production
   */
  fastify.post<{ Body: OnboardingRequest }>(
    '/save-config',
    async (request: FastifyRequest<{ Body: OnboardingRequest }>, reply: FastifyReply) => {
      try {
        const { shopUrl } = request.body;

        // Validierung
        if (!shopUrl || typeof shopUrl !== 'string') {
          return reply.code(400).send({
            success: false,
            error: 'shopUrl is required and must be a string',
          });
        }

        // URL validieren (basic check)
        try {
          new URL(shopUrl);
        } catch {
          return reply.code(400).send({
            success: false,
            error: 'Invalid URL format',
          });
        }

        const envPath = getEnvProductionPath();
        const envContent = `SHOP_URL=${shopUrl}\n`;

        // Stelle sicher, dass das Verzeichnis existiert
        const envDir = path.dirname(envPath);
        try {
          await fs.mkdir(envDir, { recursive: true });
        } catch (err) {
          logger.warn(`[onboarding] Konnte Verzeichnis nicht erstellen: ${envDir}`);
        }

        // Schreibe .env.production
        await fs.writeFile(envPath, envContent, 'utf-8');

        logger.info(`✅ [onboarding] SHOP_URL gespeichert: ${shopUrl}`);

        return reply.send({
          success: true,
          message: 'Configuration saved successfully',
          shopUrl,
        });
      } catch (error) {
        logger.error(`❌ [onboarding] Fehler beim Speichern: ${error}`);
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /api/config
   * Lädt aktuelle Konfiguration (SHOP_URL)
   */
  fastify.get<{ Reply: ConfigResponse }>(
    '/config',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const envContent = await readEnvProduction();
        const shopUrl = envContent ? parseShopUrl(envContent) : null;

        const response: ConfigResponse = {
          shopUrl,
          isConfigured: !!shopUrl,
        };

        logger.debug(`[onboarding] Config geladen: isConfigured=${response.isConfigured}`);

        return reply.send(response);
      } catch (error) {
        logger.error(`❌ [onboarding] Fehler beim Laden der Config: ${error}`);
        return reply.code(500).send({
          shopUrl: null,
          isConfigured: false,
        });
      }
    }
  );
};

export default onboardingRoutes;
