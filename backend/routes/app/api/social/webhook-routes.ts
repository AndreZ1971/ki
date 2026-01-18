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

  // Helper: Get socialMedia config from connection.json
  const getSocialMediaConfig = () => {
    try {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.resolve(__dirname, '../../../../../connection.json');
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return configData.socialMedia || {};
    } catch (error) {
      logger.error({ error }, 'Failed to read socialMedia config');
      return {};
    }
  };

  // POST to social media via Make.com/Zapier Webhook
  fastify.post<{ Body: WebhookPostRequest }>(
    '/social/webhook/post',
    async (request: FastifyRequest<{ Body: WebhookPostRequest }>, reply: FastifyReply) => {
      const { platform, content, mediaUrl, scheduleTime, useAI = true } = request.body;

      try {
        // ✨ FACEBOOK DIRECT POSTING (no webhook needed)
        if (platform === 'facebook') {
          const socialMedia = getSocialMediaConfig();
          const facebookConfig = socialMedia.facebook;

          if (!facebookConfig?.enabled || !facebookConfig?.accessToken || !facebookConfig?.pageId) {
            return reply.status(400).send({
              success: false,
              error: 'Facebook ist nicht konfiguriert. Bitte fügen Sie den Access Token und die Page ID in den Einstellungen hinzu.',
              platform
            });
          }

          // Transform content if AI is enabled
          let finalContent = content;
          if (useAI) {
            try {
              const transformed = await transformContentForPlatform({
                platform: 'facebook',
                content
              });
              finalContent = transformed.content;
              logger.info({ platform: 'facebook' }, 'AI transformation successful');
            } catch (transformError) {
              logger.warn({ error: transformError }, 'AI transformation failed, using original content');
              finalContent = content;
            }
          }

          // Post to Facebook Graph API
          const graphUrl = `https://graph.facebook.com/v18.0/${facebookConfig.pageId}/feed`;
          const response = await fetch(graphUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: finalContent,
              access_token: facebookConfig.accessToken
            })
          });

          const result = await response.json();

          if (!response.ok) {
            logger.error({ error: result }, 'Facebook API error');
            return reply.status(400).send({
              success: false,
              error: result.error?.message || 'Facebook posting fehlgeschlagen',
              details: result.error,
              platform
            });
          }

          logger.info({ platform: 'facebook', postId: result.id }, 'Post sent to Facebook successfully');

          return reply.send({
            success: true,
            message: `✨ Post erfolgreich auf Facebook veröffentlicht! ${useAI ? '(AI-optimiert)' : ''}`,
            data: {
              platform: 'facebook',
              postId: result.id,
              status: 'published',
              aiTransformed: useAI,
              originalContent: content,
              transformedContent: finalContent !== content ? finalContent : undefined
            }
          });
        }

        // ✨ TWITTER DIRECT POSTING (OAuth 1.0a)
        if (platform === 'twitter') {
          const socialMedia = getSocialMediaConfig();
          const twitterConfig = socialMedia.twitter;

          if (!twitterConfig?.enabled || !twitterConfig?.apiKey || !twitterConfig?.apiSecret || 
              !twitterConfig?.accessToken || !twitterConfig?.accessTokenSecret) {
            return reply.status(400).send({
              success: false,
              error: 'Twitter ist nicht konfiguriert. Bitte fügen Sie alle Credentials (API Key, Secret, Access Token, Token Secret) in den Einstellungen hinzu.',
              platform
            });
          }

          // Transform content if AI is enabled
          let finalContent = content;
          if (useAI) {
            try {
              const transformed = await transformContentForPlatform({
                platform: 'twitter',
                content
              });
              finalContent = transformed.content;
              logger.info({ platform: 'twitter' }, 'AI transformation successful');
            } catch (transformError) {
              logger.warn({ error: transformError }, 'AI transformation failed, using original content');
              finalContent = content;
            }
          }

          // Twitter requires OAuth 1.0a signature
          // Using a simple approach: direct POST with Bearer token would need elevated access
          // For now, use basic OAuth1.0a with oauth library
          try {
            const oauth = require('oauth-1.0a');
            const crypto = require('crypto');

            const oauthClient = oauth({
              consumer: {
                key: twitterConfig.apiKey,
                secret: twitterConfig.apiSecret
              },
              signature_method: 'HMAC-SHA1',
              hash_function(base_string: string, key: string) {
                return crypto
                  .createHmac('sha1', key)
                  .update(base_string)
                  .digest('base64');
              }
            });

            const requestData = {
              url: 'https://api.twitter.com/2/tweets',
              method: 'POST'
            };

            const token = {
              key: twitterConfig.accessToken,
              secret: twitterConfig.accessTokenSecret
            };

            const authHeader = oauthClient.toHeader(
              oauthClient.authorize(requestData, token)
            );

            const response = await fetch('https://api.twitter.com/2/tweets', {
              method: 'POST',
              headers: {
                ...authHeader,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                text: finalContent.substring(0, 280) // Twitter 280 char limit
              })
            });

            const result = await response.json();

            if (!response.ok) {
              logger.error({ error: result }, 'Twitter API error');
              return reply.status(400).send({
                success: false,
                error: result.detail || result.message || 'Twitter posting fehlgeschlagen',
                details: result,
                platform
              });
            }

            logger.info({ platform: 'twitter', tweetId: result.data?.id }, 'Tweet sent successfully');

            return reply.send({
              success: true,
              message: `✨ Tweet erfolgreich veröffentlicht! ${useAI ? '(AI-optimiert)' : ''}`,
              data: {
                platform: 'twitter',
                tweetId: result.data?.id,
                status: 'published',
                aiTransformed: useAI,
                originalContent: content,
                transformedContent: finalContent !== content ? finalContent : undefined
              }
            });
          } catch (error) {
            logger.error({ error }, 'Twitter OAuth error');
            return reply.status(500).send({
              success: false,
              error: error instanceof Error ? error.message : 'Twitter posting fehlgeschlagen',
              platform
            });
          }
        }

        // ✨ LINKEDIN DIRECT POSTING
        if (platform === 'linkedin') {
          const socialMedia = getSocialMediaConfig();
          const linkedinConfig = socialMedia.linkedin;

          if (!linkedinConfig?.enabled || !linkedinConfig?.accessToken || !linkedinConfig?.urn) {
            return reply.status(400).send({
              success: false,
              error: 'LinkedIn ist nicht konfiguriert. Bitte Client ID, Client Secret, Access Token und URN in den Einstellungen hinterlegen.',
              platform
            });
          }

          // Transform content if AI is enabled
          let finalContent = content;
          if (useAI) {
            try {
              const transformed = await transformContentForPlatform({
                platform: 'linkedin',
                content
              });
              finalContent = transformed.content;
              logger.info({ platform: 'linkedin' }, 'AI transformation successful');
            } catch (transformError) {
              logger.warn({ error: transformError }, 'AI transformation failed, using original content');
              finalContent = content;
            }
          }

          const body = {
            author: linkedinConfig.urn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
              'com.linkedin.ugc.ShareContent': {
                shareCommentary: { text: finalContent },
                shareMediaCategory: 'NONE'
              }
            },
            visibility: {
              'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
          };

          try {
            const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${linkedinConfig.accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
              },
              body: JSON.stringify(body)
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
              logger.error({ 
                error: result, 
                requestBody: body,
                statusCode: response.status,
                statusText: response.statusText
              }, 'LinkedIn API error');
              
              // Parse LinkedIn error message
              let errorMsg = result.message || result.status || 'LinkedIn posting fehlgeschlagen';
              if (result.serviceErrorCode) {
                errorMsg = `LinkedIn Error: ${result.serviceErrorCode} - ${result.message || 'Unbekannter Fehler'}`;
              }
              
              return reply.status(400).send({
                success: false,
                error: errorMsg,
                hint: 'Prüfen Sie: 1) URN ist korrekt 2) Token hat write-Berechtigung 3) Organisation ist mit App verknüpft',
                details: result,
                platform
              });
            }

            logger.info({ platform: 'linkedin', entity: result.id || result }, 'Post sent to LinkedIn successfully');

            return reply.send({
              success: true,
              message: `✨ Post erfolgreich auf LinkedIn veröffentlicht! ${useAI ? '(AI-optimiert)' : ''}`,
              data: {
                platform: 'linkedin',
                entity: result.id || result,
                status: 'published',
                aiTransformed: useAI,
                originalContent: content,
                transformedContent: finalContent !== content ? finalContent : undefined
              }
            });
          } catch (error) {
            logger.error({ error }, 'LinkedIn posting failed');
            return reply.status(500).send({
              success: false,
              error: error instanceof Error ? error.message : 'LinkedIn posting fehlgeschlagen',
              platform
            });
          }
        }

        // For other platforms, use webhook system
        const config = getConfig();
        const webhookUrls: { [key: string]: string | undefined } = {
          linkedin: config.webhooks?.linkedin || process.env.WEBHOOK_LINKEDIN,
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

        // ✨ AI-TRANSFORMATION for other platforms
        let finalContent = content;
        
        if (useAI && (platform === 'linkedin' || platform === 'tiktok' || platform === 'twitter' || platform === 'instagram')) {
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

  // Debug endpoint: Validate Facebook token and get page info
  fastify.get<{ Querystring: { token?: string } }>(
    '/social/facebook/debug',
    async (request: FastifyRequest<{ Querystring: { token?: string } }>, reply: FastifyReply) => {
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Helper: Get socialMedia config from connection.json
        const getSocialMediaConfig = () => {
          try {
            const configPath = path.resolve(__dirname, '../../../../../connection.json');
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            return configData.socialMedia || {};
          } catch (error) {
            logger.error({ error }, 'Failed to read socialMedia config');
            return {};
          }
        };

        const socialMedia = getSocialMediaConfig();
        const facebookConfig = socialMedia.facebook;
        const token = request.query.token || facebookConfig?.accessToken;

        if (!token) {
          return reply.status(400).send({
            success: false,
            error: 'Kein Facebook Access Token konfiguriert'
          });
        }

        // Get token info
        const tokenInfoResponse = await fetch(`https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`);
        const tokenInfo = await tokenInfoResponse.json();

        // Get pages this token can access
        const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`);
        const pagesData = await pagesResponse.json();

        return reply.send({
          success: true,
          tokenInfo: tokenInfo.data || { error: tokenInfo.error },
          pages: pagesData.data || [],
          configuredPageId: facebookConfig?.pageId,
          configuredToken: facebookConfig?.accessToken ? '***' + facebookConfig.accessToken.substring(facebookConfig.accessToken.length - 10) : 'none'
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Debug fehlgeschlagen'
        });
      }
    }
  );
}
