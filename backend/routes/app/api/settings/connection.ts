// backend/routes/app/api/settings/connection.ts
import { FastifyPluginAsync } from 'fastify';
import { logger } from '../../../../logger.js';
import fs from 'fs/promises';
import path from 'path';
import { configValidator } from '../../../../services/configValidator.js';

interface ShopCredentials {
  // WordPress
  wpUrl: string;
  wpUsername: string;
  wpAppPassword: string;

  // WooCommerce
  wcApiUrl: string;
  wcConsumerKey: string;
  wcConsumerSecret: string;
  wooAuthMode: 'basic' | 'oauth';
  wooTimeoutMs: number;

  // AI & Services
  openaiApiKey: string;
  openaiModel: string;

  // Job Configuration
  jobMode: 'once' | 'interval';
  jobIntervalMs: number;

  // Optional Services
  enableAnalytics: boolean;
  enableAutoProducts: boolean;
  enableEmailMarketing: boolean;

  // Social Media Accounts
  linkedinEnabled: boolean;
  linkedinAccessToken: string;
  linkedinRefreshToken: string;

  facebookEnabled: boolean;
  facebookAccessToken: string;
  facebookPageId: string;

  instagramEnabled: boolean;
  instagramAccessToken: string;
  instagramBusinessAccountId: string;

  twitterEnabled: boolean;
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterAccessToken: string;
  twitterAccessTokenSecret: string;

  tiktokEnabled: boolean;
  tiktokAccessToken: string;
  tiktokRefreshToken: string;

  youtubeEnabled: boolean;
  youtubeAccessToken: string;
  youtubeRefreshToken: string;
  youtubeChannelId: string;
}

// Error categorization for connection tests
type ErrorCategory = 'network' | 'auth' | 'validation' | 'timeout' | 'unknown';

const connectionRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper: Categorize errors and provide helpful hints
  const categorizeError = (
    error: Error | string | unknown
  ): { category: ErrorCategory; hint: string } => {
    const errorStr = (
      error instanceof Error ? error.message : String(error)
    ).toLowerCase();

    // Network errors
    if (
      errorStr.includes('enotfound') ||
      errorStr.includes('econnrefused') ||
      errorStr.includes('etimedout') ||
      errorStr.includes('nicht erreichbar')
    ) {
      if (errorStr.includes('etimedout')) {
        return {
          category: 'timeout',
          hint: '⏱️ Timeout - Server antwortete nicht rechtzeitig. Prüfen Sie die URL und Netzwerkverbindung.',
        };
      }
      return {
        category: 'network',
        hint: '🌐 Netzwerkfehler - Kann den Server nicht erreichen. Prüfen Sie die URL und Firewall-Einstellungen.',
      };
    }

    // Auth errors
    if (
      errorStr.includes('401') ||
      errorStr.includes('unauthorized') ||
      errorStr.includes('forbidden') ||
      errorStr.includes('invalid') ||
      errorStr.includes('authentifizierung')
    ) {
      return {
        category: 'auth',
        hint: '🔐 Authentifizierungsfehler - Zugangsdaten ungültig oder abgelaufen. Überprüfen Sie API-Keys und Passwörter.',
      };
    }

    // Validation errors
    if (
      errorStr.includes('400') ||
      errorStr.includes('syntax') ||
      errorStr.includes('parse')
    ) {
      return {
        category: 'validation',
        hint: '✓ Validierungsfehler - Request-Format ungültig. Prüfen Sie die eingegebenen Daten.',
      };
    }

    return {
      category: 'unknown',
      hint: '❓ Unbekannter Fehler - Prüfen Sie die Logs für mehr Details.',
    };
  };
  // GET /api/settings/connection - Get current credentials from .env
  fastify.get('/connection', async (request, reply) => {
    try {
      logger.info(
        '📊 Settings: Getting current connection credentials (connection.json)'
      );
      const jsonPath = path.resolve(process.cwd(), 'connection.json');
      let credentials: ShopCredentials;
      try {
        const json = await fs.readFile(jsonPath, 'utf-8');
        const fileData = JSON.parse(json);

        // Transform structured format to flat for frontend compatibility
        credentials = {
          // WordPress
          wpUrl: fileData.wordpress?.url || '',
          wpUsername: fileData.wordpress?.username || '',
          wpAppPassword: fileData.wordpress?.appPassword ? '****' : '', // Mask sensitive data

          // WooCommerce
          wcApiUrl: fileData.woocommerce?.url || '',
          wcConsumerKey: fileData.woocommerce?.consumerKey ? '****' : '', // Mask sensitive API key
          wcConsumerSecret: fileData.woocommerce?.consumerSecret ? '****' : '', // Mask sensitive data
          wooAuthMode: fileData.woocommerce?.authMode || 'basic',
          wooTimeoutMs: fileData.woocommerce?.timeoutMs || 30000,

          // OpenAI
          openaiApiKey: fileData.openAI?.apiKey ? '****' : '', // Mask sensitive data
          openaiModel: fileData.openAI?.model || 'gpt-4o-mini',

          // Job Configuration
          jobMode: fileData.job?.mode || 'once',
          jobIntervalMs: fileData.job?.intervalMs || 900000,

          // Features
          enableAnalytics: fileData.features?.enableAnalytics ?? true,
          enableAutoProducts: fileData.features?.enableAutoProducts ?? true,
          enableEmailMarketing: fileData.features?.enableEmailMarketing ?? true,

          // Social Media - Convert from structured to flat
          linkedinEnabled: fileData.socialMedia?.linkedin?.enabled ?? false,
          linkedinAccessToken: fileData.socialMedia?.linkedin?.accessToken
            ? '****'
            : '',
          linkedinRefreshToken: fileData.socialMedia?.linkedin?.refreshToken
            ? '****'
            : '',

          facebookEnabled: fileData.socialMedia?.facebook?.enabled ?? false,
          facebookAccessToken: fileData.socialMedia?.facebook?.accessToken
            ? '****'
            : '',
          facebookPageId: fileData.socialMedia?.facebook?.pageId || '',

          instagramEnabled: fileData.socialMedia?.instagram?.enabled ?? false,
          instagramAccessToken: fileData.socialMedia?.instagram?.accessToken
            ? '****'
            : '',
          instagramBusinessAccountId:
            fileData.socialMedia?.instagram?.businessAccountId || '',

          twitterEnabled: fileData.socialMedia?.twitter?.enabled ?? false,
          twitterApiKey: fileData.socialMedia?.twitter?.apiKey ? '****' : '',
          twitterApiSecret: fileData.socialMedia?.twitter?.apiSecret
            ? '****'
            : '',
          twitterAccessToken: fileData.socialMedia?.twitter?.accessToken
            ? '****'
            : '',
          twitterAccessTokenSecret: fileData.socialMedia?.twitter
            ?.accessTokenSecret
            ? '****'
            : '',

          tiktokEnabled: fileData.socialMedia?.tiktok?.enabled ?? false,
          tiktokAccessToken: fileData.socialMedia?.tiktok?.accessToken
            ? '****'
            : '',
          tiktokRefreshToken: fileData.socialMedia?.tiktok?.refreshToken
            ? '****'
            : '',

          youtubeEnabled: fileData.socialMedia?.youtube?.enabled ?? false,
          youtubeAccessToken: fileData.socialMedia?.youtube?.accessToken
            ? '****'
            : '',
          youtubeRefreshToken: fileData.socialMedia?.youtube?.refreshToken
            ? '****'
            : '',
          youtubeChannelId: fileData.socialMedia?.youtube?.channelId || '',
        };
      } catch {
        // Datei existiert nicht oder ist leer
        credentials = {
          wpUrl: '',
          wpUsername: '',
          wpAppPassword: '',
          wcApiUrl: '',
          wcConsumerKey: '',
          wcConsumerSecret: '',
          wooAuthMode: 'basic',
          wooTimeoutMs: 30000,
          openaiApiKey: '',
          openaiModel: 'gpt-4o-mini',
          jobMode: 'once',
          jobIntervalMs: 900000,
          enableAnalytics: true,
          enableAutoProducts: true,
          enableEmailMarketing: true,
          // Social Media Defaults
          linkedinEnabled: false,
          linkedinAccessToken: '',
          linkedinRefreshToken: '',
          facebookEnabled: false,
          facebookAccessToken: '',
          facebookPageId: '',
          instagramEnabled: false,
          instagramAccessToken: '',
          instagramBusinessAccountId: '',
          twitterEnabled: false,
          twitterApiKey: '',
          twitterApiSecret: '',
          twitterAccessToken: '',
          twitterAccessTokenSecret: '',
          tiktokEnabled: false,
          tiktokAccessToken: '',
          tiktokRefreshToken: '',
          youtubeEnabled: false,
          youtubeAccessToken: '',
          youtubeRefreshToken: '',
          youtubeChannelId: '',
        };
      }
      return {
        success: true,
        credentials,
        hasFull: {
          wordpress: !!(
            credentials.wpUrl &&
            credentials.wpUsername &&
            credentials.wpAppPassword
          ),
          woocommerce: !!(
            credentials.wcApiUrl &&
            credentials.wcConsumerKey &&
            credentials.wcConsumerSecret
          ),
          openai: !!credentials.openaiApiKey,
        },
      };
    } catch (error) {
      logger.error(`Settings GET error: ${error}`);
      reply.status(500).send({ error: 'Failed to get connection settings' });
    }
  });

  // POST /api/settings/connection - Update credentials and save to .env
  fastify.post('/connection', async (request, reply) => {
    try {
      const newCredentials = request.body as ShopCredentials;
      logger.info(
        '💾 Settings: Updating connection credentials (connection.json)'
      );
      const jsonPath = path.resolve(process.cwd(), 'connection.json');
      // Masked Werte behandeln: Wenn Wert mit **** beginnt, alten Wert aus JSON übernehmen
      let oldFileData: any = {};
      try {
        const json = await fs.readFile(jsonPath, 'utf-8');
        oldFileData = JSON.parse(json);
      } catch {
        // intentionally left blank: falls Datei nicht existiert, bleibt oldFileData leer
      }
      const unmaskValue = (
        newValue: string,
        oldValue: string | undefined
      ): string => {
        if (typeof newValue === 'string' && newValue.startsWith('****')) {
          return oldValue || '';
        }
        return newValue;
      };

      // Helper: Get old value from nested social media structure
      const getOldSocialMediaValue = (
        channel: string,
        field: string
      ): string | undefined => {
        return oldFileData?.socialMedia?.[channel]?.[field];
      };

      // Get masked values from old structured format
      const oldWpPassword = oldFileData?.wordpress?.appPassword;
      const oldWcConsumerSecret = oldFileData?.woocommerce?.consumerSecret;
      const oldOpenaiApiKey = oldFileData?.openAI?.apiKey;
      const oldWcConsumerKey = oldFileData?.woocommerce?.consumerKey;

      // Build cleaned credentials (unmasking if needed)
      const cleanedCredentials: ShopCredentials = {
        ...newCredentials,
        // WordPress & WooCommerce
        wpAppPassword: unmaskValue(newCredentials.wpAppPassword, oldWpPassword),
        wcConsumerSecret: unmaskValue(
          newCredentials.wcConsumerSecret,
          oldWcConsumerSecret
        ),
        wcConsumerKey: unmaskValue(
          newCredentials.wcConsumerKey,
          oldWcConsumerKey
        ),
        openaiApiKey: unmaskValue(newCredentials.openaiApiKey, oldOpenaiApiKey),
        // Social Media - unmask tokens
        linkedinAccessToken: unmaskValue(
          newCredentials.linkedinAccessToken,
          getOldSocialMediaValue('linkedin', 'accessToken')
        ),
        linkedinRefreshToken: unmaskValue(
          newCredentials.linkedinRefreshToken,
          getOldSocialMediaValue('linkedin', 'refreshToken')
        ),
        facebookAccessToken: unmaskValue(
          newCredentials.facebookAccessToken,
          getOldSocialMediaValue('facebook', 'accessToken')
        ),
        instagramAccessToken: unmaskValue(
          newCredentials.instagramAccessToken,
          getOldSocialMediaValue('instagram', 'accessToken')
        ),
        twitterApiKey: unmaskValue(
          newCredentials.twitterApiKey,
          getOldSocialMediaValue('twitter', 'apiKey')
        ),
        twitterApiSecret: unmaskValue(
          newCredentials.twitterApiSecret,
          getOldSocialMediaValue('twitter', 'apiSecret')
        ),
        twitterAccessToken: unmaskValue(
          newCredentials.twitterAccessToken,
          getOldSocialMediaValue('twitter', 'accessToken')
        ),
        twitterAccessTokenSecret: unmaskValue(
          newCredentials.twitterAccessTokenSecret,
          getOldSocialMediaValue('twitter', 'accessTokenSecret')
        ),
        tiktokAccessToken: unmaskValue(
          newCredentials.tiktokAccessToken,
          getOldSocialMediaValue('tiktok', 'accessToken')
        ),
        tiktokRefreshToken: unmaskValue(
          newCredentials.tiktokRefreshToken,
          getOldSocialMediaValue('tiktok', 'refreshToken')
        ),
        youtubeAccessToken: unmaskValue(
          newCredentials.youtubeAccessToken,
          getOldSocialMediaValue('youtube', 'accessToken')
        ),
        youtubeRefreshToken: unmaskValue(
          newCredentials.youtubeRefreshToken,
          getOldSocialMediaValue('youtube', 'refreshToken')
        ),
      };

      // 🔍 VALIDATE all credentials before saving
      const validationResult = configValidator.validate(cleanedCredentials);

      if (!validationResult.isValid) {
        logger.warn(
          `❌ Validation failed: ${validationResult.errors.length} errors`
        );
        return reply.status(400).send({
          success: false,
          message: 'Konfiguration hat Validierungsfehler',
          errors: validationResult.errors.map((err: any) => ({
            field: err.field,
            message: err.message,
            severity: err.severity,
          })),
          warnings: validationResult.warnings.map((w: any) => ({
            field: w.field,
            message: w.message,
          })),
        });
      }

      // Log warnings if any
      if (validationResult.warnings.length > 0) {
        logger.info(
          `⚠️ Validation warnings: ${validationResult.warnings.length}`
        );
        validationResult.warnings.forEach((w: any) => {
          logger.info(`  - ${w.field}: ${w.message}`);
        });
      }
      // Transform flat social media fields to structured format for storage
      const socialMediaStructured: any = {
        linkedin: {
          enabled: cleanedCredentials.linkedinEnabled,
          accessToken: cleanedCredentials.linkedinAccessToken,
          refreshToken: cleanedCredentials.linkedinRefreshToken,
        },
        facebook: {
          enabled: cleanedCredentials.facebookEnabled,
          accessToken: cleanedCredentials.facebookAccessToken,
          pageId: cleanedCredentials.facebookPageId,
        },
        instagram: {
          enabled: cleanedCredentials.instagramEnabled,
          accessToken: cleanedCredentials.instagramAccessToken,
          businessAccountId: cleanedCredentials.instagramBusinessAccountId,
        },
        twitter: {
          enabled: cleanedCredentials.twitterEnabled,
          apiKey: cleanedCredentials.twitterApiKey,
          apiSecret: cleanedCredentials.twitterApiSecret,
          accessToken: cleanedCredentials.twitterAccessToken,
          accessTokenSecret: cleanedCredentials.twitterAccessTokenSecret,
        },
        tiktok: {
          enabled: cleanedCredentials.tiktokEnabled,
          accessToken: cleanedCredentials.tiktokAccessToken,
          refreshToken: cleanedCredentials.tiktokRefreshToken,
        },
        youtube: {
          enabled: cleanedCredentials.youtubeEnabled,
          accessToken: cleanedCredentials.youtubeAccessToken,
          refreshToken: cleanedCredentials.youtubeRefreshToken,
          channelId: cleanedCredentials.youtubeChannelId,
        },
      };

      // Store in connection.json with structured format
      const dataToStore = {
        // Core Services
        wordpress: {
          url: cleanedCredentials.wpUrl,
          username: cleanedCredentials.wpUsername,
          appPassword: cleanedCredentials.wpAppPassword,
        },
        woocommerce: {
          url: cleanedCredentials.wcApiUrl,
          consumerKey: cleanedCredentials.wcConsumerKey,
          consumerSecret: cleanedCredentials.wcConsumerSecret,
          authMode: cleanedCredentials.wooAuthMode,
          timeoutMs: cleanedCredentials.wooTimeoutMs,
        },
        openAI: {
          apiKey: cleanedCredentials.openaiApiKey,
          model: cleanedCredentials.openaiModel,
        },
        // Job Configuration
        job: {
          mode: cleanedCredentials.jobMode,
          intervalMs: cleanedCredentials.jobIntervalMs,
        },
        // Feature Flags
        features: {
          enableAnalytics: cleanedCredentials.enableAnalytics,
          enableAutoProducts: cleanedCredentials.enableAutoProducts,
          enableEmailMarketing: cleanedCredentials.enableEmailMarketing,
        },
        // Social Media - NEW STRUCTURED FORMAT
        socialMedia: socialMediaStructured,
        // Preserve other existing data from old file
        ...(oldFileData.reddit && { reddit: oldFileData.reddit }),
        ...(oldFileData.smtp && { smtp: oldFileData.smtp }),
        ...(oldFileData.support && { support: oldFileData.support }),
        ...(oldFileData.ml && { ml: oldFileData.ml }),
        ...(oldFileData.onboarding && { onboarding: oldFileData.onboarding }),
        ...(oldFileData.metadata && { metadata: oldFileData.metadata }),
      };

      await fs.writeFile(
        jsonPath,
        JSON.stringify(dataToStore, null, 2),
        'utf-8'
      );
      logger.info('✅ Settings: connection.json updated successfully');
      logger.info(
        `✅ Social Media section saved: ${Object.keys(socialMediaStructured).filter((k) => socialMediaStructured[k].enabled).length} channels enabled`
      );
      return {
        success: true,
        message: 'Konfiguration erfolgreich gespeichert!',
      };
    } catch (error) {
      logger.error(`Settings POST error: ${error}`);
      reply.status(500).send({ error: 'Failed to update connection settings' });
    }
  });

  // POST /api/settings/connection/test - Test connection to all services
  fastify.post('/connection/test', async (request, reply) => {
    try {
      const credentials = request.body as ShopCredentials;

      logger.info('🔍 Settings: Testing connection to all services...');

      const results: any = {
        wordpress: { success: false, message: '', time: 0 },
        woocommerce: { success: false, message: '', time: 0 },
        openai: { success: false, message: '', time: 0 },
        smtp: { success: false, message: '', time: 0 },
        reddit: { success: false, message: '', time: 0 },
        support: { success: false, message: '', time: 0 },
      };

      // Test WordPress
      if (
        credentials.wpUrl &&
        credentials.wpUsername &&
        credentials.wpAppPassword
      ) {
        const wpStart = Date.now();
        try {
          const wpResponse = await fetch(
            `${credentials.wpUrl}/wp-json/wp/v2/users/me`,
            {
              method: 'GET',
              headers: {
                Authorization:
                  'Basic ' +
                  Buffer.from(
                    `${credentials.wpUsername}:${credentials.wpAppPassword}`
                  ).toString('base64'),
              },
            }
          );

          results.wordpress.time = Date.now() - wpStart;

          if (wpResponse.ok) {
            const userData = (await wpResponse.json()) as { name?: string };
            results.wordpress.success = true;
            results.wordpress.message = `✅ Verbunden als ${userData.name || 'User'}`;
            logger.info(
              `✅ WordPress connection successful (${results.wordpress.time}ms)`
            );
          } else {
            const errorCategory =
              wpResponse.status === 401 ? 'auth' : 'unknown';
            const hint =
              wpResponse.status === 401
                ? '🔐 Authentifizierungsfehler - Username oder App Password ungültig'
                : `❌ WordPress-Fehler ${wpResponse.status}: ${wpResponse.statusText}`;
            results.wordpress.message = hint;
            results.wordpress.error = {
              category: errorCategory,
              hint,
            };
            logger.warn(`❌ WordPress connection failed: ${wpResponse.status}`);
          }
        } catch (wpError) {
          results.wordpress.time = Date.now() - wpStart;
          const { category, hint } = categorizeError(wpError);
          results.wordpress.message = hint;
          results.wordpress.error = { category, hint };
          logger.error(`❌ WordPress connection error: ${wpError}`);
        }
      } else {
        results.wordpress.message = '⚠️ WordPress-Zugangsdaten unvollständig';
      }

      // Test WooCommerce
      if (
        credentials.wcApiUrl &&
        credentials.wcConsumerKey &&
        credentials.wcConsumerSecret
      ) {
        const wcStart = Date.now();
        try {
          const wcUrl = new URL(
            '/wp-json/wc/v3/system_status',
            credentials.wcApiUrl
          );
          wcUrl.searchParams.append('consumer_key', credentials.wcConsumerKey);
          wcUrl.searchParams.append(
            'consumer_secret',
            credentials.wcConsumerSecret
          );

          const wcResponse = await fetch(wcUrl.toString(), {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          });

          results.woocommerce.time = Date.now() - wcStart;

          if (wcResponse.ok) {
            const systemStatus = (await wcResponse.json()) as {
              environment?: { version?: string };
            };
            const version = systemStatus?.environment?.version || 'Unknown';
            results.woocommerce.success = true;
            results.woocommerce.message = `✅ WooCommerce ${version} verbunden`;
            logger.info(
              `✅ WooCommerce connection successful (${results.woocommerce.time}ms)`
            );
          } else {
            const errorCategory =
              wcResponse.status === 401 ? 'auth' : 'unknown';
            const hint =
              wcResponse.status === 401
                ? '🔐 Authentifizierungsfehler - Consumer Key/Secret ungültig'
                : `❌ WooCommerce-Fehler ${wcResponse.status}: ${wcResponse.statusText}`;
            results.woocommerce.message = hint;
            results.woocommerce.error = {
              category: errorCategory,
              hint,
            };
            logger.warn(
              `❌ WooCommerce connection failed: ${wcResponse.status}`
            );
          }
        } catch (wcError) {
          results.woocommerce.time = Date.now() - wcStart;
          const { category, hint } = categorizeError(wcError);
          results.woocommerce.message = hint;
          results.woocommerce.error = { category, hint };
          logger.error(`❌ WooCommerce connection error: ${wcError}`);
        }
      } else {
        results.woocommerce.message = '⚠️ WooCommerce-API-Keys unvollständig';
      }

      // Test OpenAI
      if (credentials.openaiApiKey) {
        const openaiStart = Date.now();
        try {
          const openaiResponse = await fetch(
            'https://api.openai.com/v1/models',
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${credentials.openaiApiKey}`,
              },
            }
          );

          results.openai.time = Date.now() - openaiStart;

          if (openaiResponse.ok) {
            const data = (await openaiResponse.json()) as {
              data?: { id?: string }[];
            };
            const modelCount = data?.data?.length || 0;
            results.openai.success = true;
            results.openai.message = `✅ OpenAI API aktiv (${modelCount} Modelle verfügbar)`;
            logger.info(
              `✅ OpenAI connection successful (${results.openai.time}ms)`
            );
          } else if (openaiResponse.status === 401) {
            results.openai.message =
              '🔐 OpenAI API-Key ungültig oder abgelaufen';
            results.openai.error = {
              category: 'auth',
              hint: '🔐 Authentifizierungsfehler - API-Key ist ungültig. Überprüfen Sie den Key auf https://platform.openai.com',
            };
            logger.warn('❌ OpenAI authentication failed');
          } else {
            results.openai.message = `❌ OpenAI-Fehler: ${openaiResponse.status}`;
            results.openai.error = {
              category: 'unknown',
              hint: `❌ OpenAI API Fehler ${openaiResponse.status}. Probieren Sie später erneut.`,
            };
            logger.warn(
              `❌ OpenAI connection failed: ${openaiResponse.status}`
            );
          }
        } catch (openaiError) {
          results.openai.time = Date.now() - openaiStart;
          const { category, hint } = categorizeError(openaiError);
          results.openai.message = hint;
          results.openai.error = { category, hint };
          logger.error(`❌ OpenAI connection error: ${openaiError}`);
        }
      } else {
        results.openai.message = '⚠️ OpenAI API-Key nicht konfiguriert';
      }

      // Test SMTP (optional - nur wenn in config vorhanden)
      // Note: SMTP Test wird in Zukunft implementiert wenn connection.json SMTP-Felder hat
      results.smtp.message = '⏳ SMTP Test kommt in v5.1.1';

      // Test Reddit (optional - nur wenn konfiguriert)
      // Note: Reddit Test wird in Zukunft implementiert wenn OAuth-Details vorhanden
      results.reddit.message = '⏳ Reddit Test kommt in v5.1.1';

      // Test Support-System (optional)
      // Note: Support Test wird in Zukunft implementiert
      results.support.message = '⏳ Support-System Test kommt in v5.2.0';

      const overallSuccess =
        results.wordpress.success ||
        results.woocommerce.success ||
        results.openai.success;

      return {
        success: overallSuccess,
        results,
        message: overallSuccess
          ? '✅ Verbindungstest erfolgreich! (einige Services noch ausstehend)'
          : '❌ Kein Service erreichbar - bitte Zugangsdaten prüfen',
      };
    } catch (error) {
      logger.error(`Connection test error: ${error}`);
      reply.status(500).send({ error: 'Failed to test connection' });
    }
  });
};

// updateEnvFile entfernt, da jetzt connection.json verwendet wird

export default connectionRoutes;
