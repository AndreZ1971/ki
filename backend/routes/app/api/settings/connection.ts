// backend/routes/app/api/settings/connection.ts
import { FastifyPluginAsync } from 'fastify';
import { logger } from '../../../../logger.js';
import fs from 'fs/promises';
import path from 'path';

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

const connectionRoutes: FastifyPluginAsync = async (fastify) => {
  
  // GET /api/settings/connection - Get current credentials from .env
    fastify.get('/connection', async (request, reply) => {
      try {
        logger.info('📊 Settings: Getting current connection credentials (connection.json)');
        const jsonPath = path.resolve(process.cwd(), 'connection.json');
        let credentials: ShopCredentials;
        try {
          const json = await fs.readFile(jsonPath, 'utf-8');
          credentials = JSON.parse(json);
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
            youtubeChannelId: ''
          };
        }
        return {
          success: true,
          credentials,
          hasFull: {
            wordpress: !!(credentials.wpUrl && credentials.wpUsername && credentials.wpAppPassword),
            woocommerce: !!(credentials.wcApiUrl && credentials.wcConsumerKey && credentials.wcConsumerSecret),
            openai: !!credentials.openaiApiKey,
          }
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
      logger.info('💾 Settings: Updating connection credentials (connection.json)');
      const jsonPath = path.resolve(process.cwd(), 'connection.json');
      // Masked Werte behandeln: Wenn Wert mit **** beginnt, alten Wert aus JSON übernehmen
      let oldCredentials: Partial<ShopCredentials> = {};
      try {
        const json = await fs.readFile(jsonPath, 'utf-8');
        oldCredentials = JSON.parse(json);
      } catch {
        // intentionally left blank: falls Datei nicht existiert, bleibt oldCredentials leer
      }
      const unmaskValue = (newValue: string, oldValue: string | undefined): string => {
        if (typeof newValue === 'string' && newValue.startsWith('****')) {
          return oldValue || '';
        }
        return newValue;
      };
      const cleanedCredentials: ShopCredentials = {
        ...newCredentials,
        wpAppPassword: unmaskValue(newCredentials.wpAppPassword, oldCredentials.wpAppPassword),
        wcConsumerSecret: unmaskValue(newCredentials.wcConsumerSecret, oldCredentials.wcConsumerSecret),
        openaiApiKey: unmaskValue(newCredentials.openaiApiKey, oldCredentials.openaiApiKey),
      };
      await fs.writeFile(jsonPath, JSON.stringify(cleanedCredentials, null, 2), 'utf-8');
      logger.info('✅ Settings: connection.json updated successfully');
      return {
        success: true,
        message: 'Konfiguration erfolgreich gespeichert!',
      };
    } catch (error) {
      logger.error(`Settings POST error: ${error}`);
      reply.status(500).send({ error: 'Failed to update connection settings' });
    }
  });

  // POST /api/settings/connection/test - Test connection to WordPress and WooCommerce
  fastify.post('/connection/test', async (request, reply) => {
    try {
      const credentials = request.body as ShopCredentials;
      
      logger.info('🔍 Settings: Testing connection...');
      
      const results = {
        wordpress: { success: false, message: '', time: 0 },
        woocommerce: { success: false, message: '', time: 0 },
      };

      // Test WordPress
      if (credentials.wpUrl && credentials.wpUsername && credentials.wpAppPassword) {
        const wpStart = Date.now();
        try {
          const wpResponse = await fetch(`${credentials.wpUrl}/wp-json/wp/v2/users/me`, {
            method: 'GET',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${credentials.wpUsername}:${credentials.wpAppPassword}`).toString('base64'),
            },
          });
          
          results.wordpress.time = Date.now() - wpStart;
          
          if (wpResponse.ok) {
            const userData = await wpResponse.json() as { name?: string };
            results.wordpress.success = true;
            results.wordpress.message = `✅ Verbunden als ${userData.name || 'User'}`;
            logger.info(`✅ WordPress connection successful (${results.wordpress.time}ms)`);
          } else {
            results.wordpress.message = `❌ WordPress-Fehler: ${wpResponse.status} ${wpResponse.statusText}`;
            logger.warn(`❌ WordPress connection failed: ${wpResponse.status}`);
          }
        } catch (wpError) {
          results.wordpress.time = Date.now() - wpStart;
          results.wordpress.message = `❌ WordPress nicht erreichbar: ${wpError}`;
          logger.error(`❌ WordPress connection error: ${wpError}`);
        }
      } else {
        results.wordpress.message = '⚠️ WordPress-Zugangsdaten unvollständig';
      }

      // Test WooCommerce
      if (credentials.wcApiUrl && credentials.wcConsumerKey && credentials.wcConsumerSecret) {
        const wcStart = Date.now();
        try {
          const wcUrl = new URL('/wp-json/wc/v3/system_status', credentials.wcApiUrl);
          wcUrl.searchParams.append('consumer_key', credentials.wcConsumerKey);
          wcUrl.searchParams.append('consumer_secret', credentials.wcConsumerSecret);
          
          const wcResponse = await fetch(wcUrl.toString(), {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });
          
          results.woocommerce.time = Date.now() - wcStart;
          
          if (wcResponse.ok) {
            const systemStatus = await wcResponse.json() as { environment?: { version?: string } };
            const version = systemStatus?.environment?.version || 'Unknown';
            results.woocommerce.success = true;
            results.woocommerce.message = `✅ WooCommerce ${version} verbunden`;
            logger.info(`✅ WooCommerce connection successful (${results.woocommerce.time}ms)`);
          } else {
            results.woocommerce.message = `❌ WooCommerce-Fehler: ${wcResponse.status} ${wcResponse.statusText}`;
            logger.warn(`❌ WooCommerce connection failed: ${wcResponse.status}`);
          }
        } catch (wcError) {
          results.woocommerce.time = Date.now() - wcStart;
          results.woocommerce.message = `❌ WooCommerce nicht erreichbar: ${wcError}`;
          logger.error(`❌ WooCommerce connection error: ${wcError}`);
        }
      } else {
        results.woocommerce.message = '⚠️ WooCommerce-API-Keys unvollständig';
      }

      const overallSuccess = results.wordpress.success || results.woocommerce.success;
      
      return {
        success: overallSuccess,
        results,
        message: overallSuccess 
          ? '✅ Verbindungstest erfolgreich!' 
          : '❌ Verbindungstest fehlgeschlagen - bitte Zugangsdaten prüfen',
      };
    } catch (error) {
      logger.error(`Connection test error: ${error}`);
      reply.status(500).send({ error: 'Failed to test connection' });
    }
  });
};

// updateEnvFile entfernt, da jetzt connection.json verwendet wird

export default connectionRoutes;
