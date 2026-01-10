// backend/routes/app/api/social/webhook-routes.ts
// Supports: Make.com (FREE 1000 ops/month), Zapier, n8n
// AI-Powered: Transformiert Content automatisch für jede Plattform!
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { transformContentForPlatform } from '../../../../utils/social-ai-transform';
import { getConfig } from '@config';
import { logger } from '../../../../logger';

interface WebhookPostRequest {
  platform: string;
  content: string;
  mediaUrl?: string;
  scheduleTime?: string;
  useAI?: boolean; // Neu: AI-Transformation aktivieren
}

export default async function webhookRoutes(fastify: FastifyInstance) {

  // POST to social media via Make.com/Zapier Webhook
  fastify.post<{ Body: WebhookPostRequest }>(
    '/social/webhook/post',
    async (request: FastifyRequest<{ Body: WebhookPostRequest }>, reply: FastifyReply) => {
      const { platform, content, mediaUrl, scheduleTime, useAI = true } = request.body;

      // Get webhook URLs from dynamic config
      const config = getConfig();
      const webhookUrls: { [key: string]: string | undefined } = {
        linkedin: config.webhooks?.linkedin || process.env.WEBHOOK_LINKEDIN,
        facebook: config.webhooks?.facebook || process.env.WEBHOOK_FACEBOOK,
        tiktok: config.webhooks?.tiktok || process.env.WEBHOOK_TIKTOK
      };
      const webhookUrl = webhookUrls[platform];
      
      if (!webhookUrl) {
        return reply.status(400).send({
          success: false,
          error: `Kein Webhook für ${platform.toUpperCase()} konfiguriert!`,
          hint: `Setze WEBHOOK_${platform.toUpperCase()} in .env (Make.com/Zapier/n8n)`
        });
      }

      try {
        // ✨ AI-TRANSFORMATION! Backend macht die AI-Arbeit!
        let finalContent = content;
        
        if (useAI && (platform === 'linkedin' || platform === 'facebook' || platform === 'tiktok' || platform === 'twitter' || platform === 'instagram')) {
          logger.info({ platform }, 'AI transformation activated');
          const transformed = await transformContentForPlatform({
            platform: platform as 'linkedin' | 'facebook' | 'tiktok' | 'twitter' | 'instagram',
            content
          });
          finalContent = transformed.content;
          logger.info({
            platform,
            originalPreview: content.substring(0, 30) + '...',
            transformedPreview: finalContent.substring(0, 30) + '...'
          }, 'AI transformation successful');
        }

        // Send data to webhook (Make.com/Zapier/n8n)
        const webhookPayload = {
          platform,
          content: finalContent, // AI-transformiert!
          originalContent: content, // Original als Referenz
          mediaUrl,
          scheduleTime: scheduleTime === 'now' ? null : scheduleTime,
          timestamp: new Date().toISOString(),
          source: 'kaufe-es-marketing-automation',
          aiTransformed: useAI
        };

        logger.debug({ platform, webhookUrl: webhookUrl.substring(0, 50) + '...' }, 'Sending post to webhook');

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookPayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Webhook Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json().catch(() => ({ status: 'success' }));

        logger.info({ platform, result }, 'Post sent to webhook successfully');

        return reply.send({
          success: true,
          message: `✨ Post erfolgreich an ${platform.toUpperCase()} gesendet! ${useAI ? '(AI-optimiert)' : ''}`,
          data: {
            platform,
            status: 'sent_to_webhook',
            webhookUrl: webhookUrl.substring(0, 50) + '...',
            aiTransformed: useAI,
            originalContent: content,
            transformedContent: finalContent !== content ? finalContent : undefined,
            response: result
          }
        });

      } catch (error) {
        logger.error({ platform, error }, 'Webhook error');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Webhook fehlgeschlagen',
          platform
        });
      }
    }
  );

  // Check webhook configuration
  fastify.get('/social/webhook/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    const config = getConfig();
    const webhooks = {
      linkedin: !!(config.webhooks?.linkedin || process.env.WEBHOOK_LINKEDIN),
      facebook: !!(config.webhooks?.facebook || process.env.WEBHOOK_FACEBOOK),
      tiktok: !!(config.webhooks?.tiktok || process.env.WEBHOOK_TIKTOK)
    };
    const configuredCount = Object.values(webhooks).filter(Boolean).length;
    const totalCount = Object.keys(webhooks).length;
    return reply.send({
      success: true,
      webhooks,
      configured: configuredCount,
      total: totalCount,
      message: configuredCount === 0 
        ? '⚠️ Keine Webhooks konfiguriert! Siehe docs/MAKE_SETUP.md'
        : `✅ ${configuredCount}/${totalCount} Webhooks konfiguriert!`
    });
  });

  // Test endpoint - sends test data to webhook
  fastify.post<{ Body: { platform: string } }>(
    '/social/webhook/test',
    async (request: FastifyRequest<{ Body: { platform: string } }>, reply: FastifyReply) => {
      const { platform } = request.body;

      const config = getConfig();
      const webhookUrls: { [key: string]: string | undefined } = {
        linkedin: config.webhooks?.linkedin || process.env.WEBHOOK_LINKEDIN,
        facebook: config.webhooks?.facebook || process.env.WEBHOOK_FACEBOOK,
        tiktok: config.webhooks?.tiktok || process.env.WEBHOOK_TIKTOK
      };
      const webhookUrl = webhookUrls[platform];

      if (!webhookUrl) {
        return reply.status(400).send({
          success: false,
          error: `Kein Webhook für ${platform} konfiguriert`
        });
      }

      try {
        const testPayload = {
          platform,
          content: `🧪 Test Post von Kaufe.es Marketing Automation - ${new Date().toLocaleString('de-DE')}`,
          timestamp: new Date().toISOString(),
          test: true
        };

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });

        if (!response.ok) {
          throw new Error(`Webhook Test fehlgeschlagen: ${response.status}`);
        }

        return reply.send({
          success: true,
          message: `✅ Test erfolgreich an ${platform} Webhook gesendet!`,
          webhookUrl: webhookUrl.substring(0, 50) + '...'
        });

      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Test fehlgeschlagen'
        });
      }
    }
  );
}
