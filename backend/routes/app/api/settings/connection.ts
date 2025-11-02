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
  githubToken: string;
  
  // Job Configuration
  jobMode: 'once' | 'interval';
  jobIntervalMs: number;
  
  // Optional Services
  enableAnalytics: boolean;
  enableAutoProducts: boolean;
  enableEmailMarketing: boolean;
}

const connectionRoutes: FastifyPluginAsync = async (fastify) => {
  
  // GET /api/settings/connection - Get current credentials from .env
  fastify.get('/connection', async (request, reply) => {
    try {
      logger.info('📊 Settings: Getting current connection credentials');
      
      const credentials: ShopCredentials = {
        // WordPress
        wpUrl: process.env.WORDPRESS_URL || '',
        wpUsername: process.env.WORDPRESS_USERNAME || '',
        wpAppPassword: process.env.WORDPRESS_APP_PASSWORD || '',
        
        // WooCommerce
        wcApiUrl: process.env.WOOCOMMERCE_URL || '',
        wcConsumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
        wcConsumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
        wooAuthMode: (process.env.WOO_AUTH_MODE as 'basic' | 'oauth') || 'basic',
        wooTimeoutMs: parseInt(process.env.WOO_TIMEOUT_MS || '30000'),
        
        // AI & Services
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        githubToken: process.env.GITHUB_TOKEN || '',
        
        // Job Configuration
        jobMode: (process.env.JOB_MODE as 'once' | 'interval') || 'once',
        jobIntervalMs: parseInt(process.env.JOB_INTERVAL_MS || '900000'),
        
        // Optional Services
        enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
        enableAutoProducts: process.env.ENABLE_AUTO_PRODUCTS === 'true',
        enableEmailMarketing: process.env.ENABLE_EMAIL_MARKETING === 'true',
      };
      
      return {
        success: true,
        credentials: credentials, // Send full credentials to frontend for editing
        hasFull: {
          wordpress: !!(credentials.wpUrl && credentials.wpUsername && credentials.wpAppPassword),
          woocommerce: !!(credentials.wcApiUrl && credentials.wcConsumerKey && credentials.wcConsumerSecret),
          openai: !!credentials.openaiApiKey,
          github: !!credentials.githubToken,
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
      
      logger.info('💾 Settings: Updating connection credentials');
      
      // Helper: Don't save masked values (****), keep existing ones
      const unmaskValue = (newValue: string, envKey: string): string => {
        if (newValue.startsWith('****')) {
          return process.env[envKey] || '';
        }
        return newValue;
      };
      
      // Unmask credentials before saving
      const cleanedCredentials = {
        ...newCredentials,
        wpAppPassword: unmaskValue(newCredentials.wpAppPassword, 'WORDPRESS_APP_PASSWORD'),
        wcConsumerSecret: unmaskValue(newCredentials.wcConsumerSecret, 'WOOCOMMERCE_CONSUMER_SECRET'),
        openaiApiKey: unmaskValue(newCredentials.openaiApiKey, 'OPENAI_API_KEY'),
        githubToken: unmaskValue(newCredentials.githubToken, 'GITHUB_TOKEN'),
      };
      
      // Update .env file
      await updateEnvFile(cleanedCredentials);
      
      // Update process.env in-memory (runtime)
      process.env.WORDPRESS_URL = cleanedCredentials.wpUrl;
      process.env.WORDPRESS_USERNAME = cleanedCredentials.wpUsername;
      if (cleanedCredentials.wpAppPassword) {
        process.env.WORDPRESS_APP_PASSWORD = cleanedCredentials.wpAppPassword;
      }
      
      process.env.WOOCOMMERCE_URL = cleanedCredentials.wcApiUrl;
      process.env.WOOCOMMERCE_CONSUMER_KEY = cleanedCredentials.wcConsumerKey;
      if (cleanedCredentials.wcConsumerSecret) {
        process.env.WOOCOMMERCE_CONSUMER_SECRET = cleanedCredentials.wcConsumerSecret;
      }
      process.env.WOO_AUTH_MODE = cleanedCredentials.wooAuthMode;
      process.env.WOO_TIMEOUT_MS = cleanedCredentials.wooTimeoutMs.toString();
      
      if (cleanedCredentials.openaiApiKey) {
        process.env.OPENAI_API_KEY = cleanedCredentials.openaiApiKey;
      }
      process.env.OPENAI_MODEL = cleanedCredentials.openaiModel;
      if (cleanedCredentials.githubToken) {
        process.env.GITHUB_TOKEN = cleanedCredentials.githubToken;
      }
      
      process.env.JOB_MODE = newCredentials.jobMode;
      process.env.JOB_INTERVAL_MS = newCredentials.jobIntervalMs.toString();
      
      process.env.ENABLE_ANALYTICS = newCredentials.enableAnalytics.toString();
      process.env.ENABLE_AUTO_PRODUCTS = newCredentials.enableAutoProducts.toString();
      process.env.ENABLE_EMAIL_MARKETING = newCredentials.enableEmailMarketing.toString();
      
      logger.info('✅ Settings: Connection credentials updated successfully');
      
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

async function updateEnvFile(credentials: ShopCredentials) {
  try {
    // Find .env file in project root
    const envPath = path.resolve(process.cwd(), '.env');
    
    logger.info(`📝 Updating .env file: ${envPath}`);
    
    // Read current .env file
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch {
      // .env doesn't exist, create new one
      logger.info('📄 Creating new .env file');
      envContent = '# Auto-generated by Settings API\n\n';
    }
    
    // Helper function to update or add env variable
    const updateOrAdd = (key: string, value: string | number | boolean) => {
      const valueStr = value.toString();
      const regex = new RegExp(`^${key}=.*$`, 'm');
      
      if (regex.test(envContent)) {
        // Update existing
        envContent = envContent.replace(regex, `${key}=${valueStr}`);
      } else {
        // Add new
        envContent += `${key}=${valueStr}\n`;
      }
    };
    
    // Update all credentials
    updateOrAdd('WORDPRESS_URL', credentials.wpUrl);
    updateOrAdd('WORDPRESS_USERNAME', credentials.wpUsername);
    updateOrAdd('WORDPRESS_APP_PASSWORD', credentials.wpAppPassword);
    
    updateOrAdd('WOOCOMMERCE_URL', credentials.wcApiUrl);
    updateOrAdd('WOOCOMMERCE_CONSUMER_KEY', credentials.wcConsumerKey);
    updateOrAdd('WOOCOMMERCE_CONSUMER_SECRET', credentials.wcConsumerSecret);
    updateOrAdd('WOO_AUTH_MODE', credentials.wooAuthMode);
    updateOrAdd('WOO_TIMEOUT_MS', credentials.wooTimeoutMs);
    
    updateOrAdd('OPENAI_API_KEY', credentials.openaiApiKey);
    updateOrAdd('OPENAI_MODEL', credentials.openaiModel);
    updateOrAdd('GITHUB_TOKEN', credentials.githubToken);
    
    updateOrAdd('JOB_MODE', credentials.jobMode);
    updateOrAdd('JOB_INTERVAL_MS', credentials.jobIntervalMs);
    
    updateOrAdd('ENABLE_ANALYTICS', credentials.enableAnalytics);
    updateOrAdd('ENABLE_AUTO_PRODUCTS', credentials.enableAutoProducts);
    updateOrAdd('ENABLE_EMAIL_MARKETING', credentials.enableEmailMarketing);
    
    // Write back to file
    await fs.writeFile(envPath, envContent, 'utf-8');
    
    logger.info('✅ .env file updated successfully');
  } catch (error) {
    logger.error(`Failed to update .env file: ${error}`);
    throw error;
  }
}

export default connectionRoutes;
