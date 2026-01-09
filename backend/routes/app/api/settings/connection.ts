// backend/routes/app/api/settings/connection.ts
import { FastifyPluginAsync } from 'fastify';
import { logger } from '../../../../logger.js';
import fs from 'fs/promises';
import path from 'path';
import { configValidator } from '../../../../services/configValidator.js';
import { getConfig } from '@config';

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

  // SMTP (optional, flattened for frontend)
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom?: string;

  // Reddit (optional, flattened for frontend)
  redditClientId?: string;
  redditClientSecret?: string;
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

          // SMTP (flattened)
          smtpHost: fileData.smtp?.host || '',
          smtpPort: fileData.smtp?.port ?? 465,
          smtpSecure: fileData.smtp?.secure ?? true,
          smtpUser: fileData.smtp?.user || '',
          smtpPassword: fileData.smtp?.password ? '****' : '',
          smtpFrom: fileData.smtp?.from || '',

          // Reddit (flattened)
          redditClientId: fileData.reddit?.clientId || '',
          redditClientSecret: fileData.reddit?.clientSecret ? '****' : '',
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
          // SMTP defaults
          smtpHost: '',
          smtpPort: 465,
          smtpSecure: true,
          smtpUser: '',
          smtpPassword: '',
          smtpFrom: '',
          // Reddit defaults
          redditClientId: '',
          redditClientSecret: '',
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
      const payload = request.body as any;
      logger.info(
        '💾 Settings: Updating connection credentials (connection.json)'
      );

      // Transform nested structure from frontend to flat structure for validator
      const newCredentials: ShopCredentials = {
        // WordPress
        wpUrl: payload.wordpress?.url || '',
        wpUsername: payload.wordpress?.username || '',
        wpAppPassword: payload.wordpress?.appPassword || '',
        // WooCommerce
        wcApiUrl: payload.woocommerce?.url || '',
        wcConsumerKey: payload.woocommerce?.consumerKey || '',
        wcConsumerSecret: payload.woocommerce?.consumerSecret || '',
        wooAuthMode: payload.woocommerce?.authMode || 'basic',
        wooTimeoutMs: payload.woocommerce?.timeoutMs || 30000,
        // OpenAI
        openaiApiKey: payload.openAI?.apiKey || '',
        openaiModel: payload.openAI?.model || 'gpt-4o-mini',
        // Job
        jobMode: payload.job?.mode || 'once',
        jobIntervalMs: payload.job?.intervalMs || 900000,
        // Features
        enableAnalytics: payload.features?.enableAnalytics ?? true,
        enableAutoProducts: payload.features?.enableAutoProducts ?? true,
        enableEmailMarketing: payload.features?.enableEmailMarketing ?? true,
        // Social Media (extract from payload.socialMedia or legacy format)
        linkedinEnabled: payload.socialMedia?.linkedin?.enabled ?? false,
        linkedinAccessToken: payload.socialMedia?.linkedin?.accessToken || '',
        linkedinRefreshToken: payload.socialMedia?.linkedin?.refreshToken || '',
        facebookEnabled: payload.socialMedia?.facebook?.enabled ?? false,
        facebookAccessToken: payload.socialMedia?.facebook?.accessToken || '',
        facebookPageId: payload.socialMedia?.facebook?.pageId || '',
        instagramEnabled: payload.socialMedia?.instagram?.enabled ?? false,
        instagramAccessToken: payload.socialMedia?.instagram?.accessToken || '',
        instagramBusinessAccountId:
          payload.socialMedia?.instagram?.businessAccountId || '',
        twitterEnabled: payload.socialMedia?.twitter?.enabled ?? false,
        twitterApiKey: payload.socialMedia?.twitter?.apiKey || '',
        twitterApiSecret: payload.socialMedia?.twitter?.apiSecret || '',
        twitterAccessToken: payload.socialMedia?.twitter?.accessToken || '',
        twitterAccessTokenSecret:
          payload.socialMedia?.twitter?.accessTokenSecret || '',
        tiktokEnabled: payload.socialMedia?.tiktok?.enabled ?? false,
        tiktokAccessToken: payload.socialMedia?.tiktok?.accessToken || '',
        tiktokRefreshToken: payload.socialMedia?.tiktok?.refreshToken || '',
        youtubeEnabled: payload.socialMedia?.youtube?.enabled ?? false,
        youtubeAccessToken: payload.socialMedia?.youtube?.accessToken || '',
        youtubeRefreshToken: payload.socialMedia?.youtube?.refreshToken || '',
        youtubeChannelId: payload.socialMedia?.youtube?.channelId || '',
      };

      const jsonPath = path.resolve(process.cwd(), 'connection.json');
      // Masked Werte behandeln: Wenn Wert mit **** beginnt, alten Wert aus JSON übernehmen
      let oldFileData: any = {};
      try {
        const json = await fs.readFile(jsonPath, 'utf-8');
        oldFileData = JSON.parse(json);

        // 💾 CREATE BACKUP before modifying
        const backupDir = path.resolve(process.cwd(), 'data', 'backups');
        await fs.mkdir(backupDir, { recursive: true });
        const timestamp = new Date()
          .toISOString()
          .replace(/:/g, '-')
          .split('.')[0];
        const backupPath = path.join(backupDir, `connection.${timestamp}.json`);
        await fs.writeFile(backupPath, json, 'utf-8');
        logger.info(`📦 Backup created: ${backupPath}`);
      } catch (error) {
        // If file doesn't exist or backup fails, log but continue
        if ((error as any).code !== 'ENOENT') {
          logger.warn(`⚠️ Backup creation failed: ${error}`);
        }
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
      const oldSmtp = oldFileData?.smtp || {};
      const oldReddit = oldFileData?.reddit || {};

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

      // Unmask SMTP + Reddit (masking not handled before)
      const cleanedSmtp = {
        host: unmaskValue(payload.smtp?.host || '', oldSmtp.host),
        port: payload.smtp?.port ?? oldSmtp.port ?? 465,
        secure:
          payload.smtp?.secure ??
          (typeof oldSmtp.secure === 'boolean' ? oldSmtp.secure : true),
        user: unmaskValue(payload.smtp?.user || '', oldSmtp.user),
        password: unmaskValue(payload.smtp?.password || '', oldSmtp.password),
        from: unmaskValue(payload.smtp?.from || '', oldSmtp.from),
      };

      const cleanedReddit = {
        clientId: unmaskValue(payload.reddit?.clientId || '', oldReddit.clientId),
        clientSecret: unmaskValue(
          payload.reddit?.clientSecret || '',
          oldReddit.clientSecret
        ),
      };

      // 🔍 VALIDATE all credentials before saving
      const validationResult = configValidator.validate(cleanedCredentials);

      if (!validationResult.isValid) {
        logger.warn(
          `❌ Validation failed: ${validationResult.errors.length} errors`
        );
        // Log each validation error with details
        validationResult.errors.forEach((err: any) => {
          logger.error(`  ❌ ${err.field}: ${err.message} (rule: ${err.rule})`);
        });
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
        // Optional sections: prefer new payload values, otherwise preserve existing
        reddit: cleanedReddit,
        smtp: cleanedSmtp,
        ...(payload.support && { support: payload.support }),
        ...(payload.ml && { ml: payload.ml }),
        // Preserve existing if payload did not provide them
        ...(!payload.support && oldFileData.support ? { support: oldFileData.support } : {}),
        ...(!payload.ml && oldFileData.ml ? { ml: oldFileData.ml } : {}),
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
      
      // Reload email transporter if SMTP config changed
      if (cleanedSmtp.host || cleanedSmtp.user) {
        try {
          const { reloadTransporter } = await import('../../../../services/emailService.js');
          reloadTransporter();
          logger.info('🔄 Email transporter reloaded with new SMTP config');
        } catch (reloadError) {
          logger.warn(`⚠️ Could not reload email transporter: ${reloadError}`);
        }
      }
      
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

      // Timeout helper
      const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
          ),
        ]);
      };

      const timeoutMs = 7000;
      const tasks: Promise<void>[] = [];

      // Test WordPress
      if (
        credentials.wpUrl &&
        credentials.wpUsername &&
        credentials.wpAppPassword
      ) {
        tasks.push((async () => {
          const wpStart = Date.now();
          try {
            const wpResponse = await withTimeout(
              fetch(
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
              ),
              timeoutMs
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
        })());
      } else {
        results.wordpress.message = '⚠️ WordPress-Zugangsdaten unvollständig';
      }

      // Test WooCommerce
      if (
        credentials.wcApiUrl &&
        credentials.wcConsumerKey &&
        credentials.wcConsumerSecret
      ) {
        tasks.push((async () => {
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

            const wcResponse = await withTimeout(
              fetch(wcUrl.toString(), {
                method: 'GET',
                headers: {
                  Accept: 'application/json',
                },
              }),
              timeoutMs
            );

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
        })());
      } else {
        results.woocommerce.message = '⚠️ WooCommerce-API-Keys unvollständig';
      }

      // Test OpenAI
      if (credentials.openaiApiKey) {
        tasks.push((async () => {
          const openaiStart = Date.now();
          try {
            const openaiResponse = await withTimeout(
              fetch(
                'https://api.openai.com/v1/models',
                {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${credentials.openaiApiKey}`,
                  },
                }
              ),
              timeoutMs
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
        })());
      } else {
        results.openai.message = '⚠️ OpenAI API-Key nicht konfiguriert';
      }

      // Test SMTP (optional - nur wenn in config vorhanden)
      const currentConfig = getConfig();
      if (currentConfig.smtp?.host && currentConfig.smtp?.user && currentConfig.smtp?.password) {
        tasks.push((async () => {
          const smtp = currentConfig.smtp!;
          const smtpStart = Date.now();
          try {
            const nodemailer = await import('nodemailer');
            const testTransporter = nodemailer.default.createTransport({
              host: smtp.host,
              port: smtp.port || 465,
              secure: smtp.secure !== false,
              auth: {
                user: smtp.user,
                pass: smtp.password
              },
              connectionTimeout: timeoutMs,
              greetingTimeout: timeoutMs,
              socketTimeout: timeoutMs,
              tls: { rejectUnauthorized: false }
            });
            
            await testTransporter.verify();
            results.smtp.success = true;
            results.smtp.time = Date.now() - smtpStart;
            results.smtp.message = `✅ SMTP-Server erreichbar (${smtp.host}:${smtp.port})`;
            logger.info('✅ SMTP connection successful');
          } catch (smtpError: any) {
            results.smtp.time = Date.now() - smtpStart;
            results.smtp.message = `❌ SMTP-Fehler: ${smtpError.message}`;
            results.smtp.error = {
              category: 'auth',
              hint: 'SMTP-Zugangsdaten oder Server-Einstellungen prüfen'
            };
            logger.warn(`❌ SMTP connection failed: ${smtpError.message}`);
          }
        })());
      } else {
        results.smtp.message = '⚠️ SMTP nicht konfiguriert';
      }

      // Test Support-System (optional)
      if (currentConfig.wordpress?.url && currentConfig.support?.ticketsEndpoint) {
        tasks.push((async () => {
          const supportStart = Date.now();
          try {
            const { getTickets } = await import('../../../../services/supportTickets.js');
            const tickets = await withTimeout(getTickets(), timeoutMs);
            results.support.success = true;
            results.support.time = Date.now() - supportStart;
            results.support.message = `✅ Support-System erreichbar (${tickets.length} Tickets gefunden)`;
            logger.info(`✅ Support system connection successful - ${tickets.length} tickets`);
          } catch (supportError: any) {
            results.support.time = Date.now() - supportStart;
            results.support.message = `❌ Support-Fehler: ${supportError.message}`;
            results.support.error = {
              category: 'network',
              hint: 'Support-Endpoint oder WordPress-Zugangsdaten prüfen'
            };
            logger.warn(`❌ Support connection failed: ${supportError.message}`);
          }
        })());
      } else {
        results.support.message = '⚠️ Support-System nicht konfiguriert';
      }

      // Test Reddit (optional - nur wenn konfiguriert)
      if (currentConfig.reddit?.clientId && currentConfig.reddit?.clientSecret) {
        tasks.push((async () => {
          const reddit = currentConfig.reddit!;
          const redditStart = Date.now();
          try {
            const redditAuth = Buffer.from(`${reddit.clientId}:${reddit.clientSecret}`).toString('base64');
            const redditResponse = await withTimeout(
              fetch('https://www.reddit.com/api/v1/access_token', {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${redditAuth}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'User-Agent': 'ARI-Agent/1.0'
                },
                body: 'grant_type=client_credentials'
              }),
              timeoutMs
            );
            
            if (redditResponse.ok) {
              const redditData = await redditResponse.json();
              if (redditData.access_token) {
                results.reddit.success = true;
                results.reddit.time = Date.now() - redditStart;
                results.reddit.message = '✅ Reddit OAuth erfolgreich';
                logger.info('✅ Reddit OAuth successful');
              } else {
                throw new Error('Kein Access Token erhalten');
              }
            } else {
              throw new Error(`HTTP ${redditResponse.status}`);
            }
          } catch (redditError: any) {
            results.reddit.time = Date.now() - redditStart;
            results.reddit.message = `❌ Reddit-Fehler: ${redditError.message}`;
            results.reddit.error = {
              category: 'auth',
              hint: 'Reddit Client-ID oder Secret prüfen'
            };
            logger.warn(`❌ Reddit connection failed: ${redditError.message}`);
          }
        })());
      } else {
        results.reddit.message = '⚠️ Reddit nicht konfiguriert';
      }

      // Alle Tests parallel warten
      await Promise.allSettled(tasks);

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
