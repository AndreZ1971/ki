// backend/routes/app/api/social/post-routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getConfig } from '@config';
import { logger } from '../../../../logger';
import * as fs from 'fs';
import * as path from 'path';
import { SocialPostOrchestrator } from '../../../../services/social/SocialPostOrchestrator';
import { SocialAsset } from '../../../../types/social';

interface PostRequest {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'youtube' | 'all';
  content: string;
  assets?: SocialAsset[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  videoFile?: string; // Base64 encoded video for YouTube (deprecated - use FormData instead)
  videoTitle?: string;
  videoDescription?: string;
  videoTags?: string[];
}

export default async function postRoutes(fastify: FastifyInstance) {
  
  // Initialize orchestrator
  const orchestrator = new SocialPostOrchestrator();

  // Helper: Get socialMedia config from connection.json
  const _getSocialMediaConfig = () => {
    try {
      const configPath = path.resolve(__dirname, '../../../../../connection.json');
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return configData.socialMedia || {};
    } catch (error) {
      logger.error({ error }, 'Failed to read socialMedia config');
      return {};
    }
  };

  // ==================== POST TO SOCIAL MEDIA ====================
  
  fastify.post<{ Body: PostRequest }>(
    '/social/post',
    async (request: FastifyRequest<{ Body: PostRequest }>, reply: FastifyReply) => {
      try {
        // Handle both JSON and FormData uploads
        let platform: string;
        let content: string;
        let assets: SocialAsset[] | undefined;
        let videoFile: Buffer | undefined;
        let videoTitle: string | undefined;
        let videoDescription: string | undefined;
        let videoTags: string[] = [];

        const contentType = request.headers['content-type'] || '';

  logger.info({ contentType, bodyKeys: Object.keys((request as any).body || {}) }, 'Incoming /social/post request');

        if (contentType.includes('multipart/form-data')) {
          // FormData upload (for video files)
          logger.info('Parsing FormData request');
          const parts: any = {};

          try {
            // Get all parts (both files and fields)
            const partsIterator = request.parts();
            
            for await (const part of partsIterator) {
              const fieldname = part.fieldname;
              
              if (part.type === 'file') {
                // This is a file field
                logger.info({ fieldname, filename: part.filename, mimetype: part.mimetype }, 'Processing file field');
                parts[fieldname] = await part.toBuffer();
              } else {
                // This is a regular text field (part.type === 'field')
                // For field parts, the value is directly in part.value (not a stream)
                const value = (part as any).value || '';
                logger.info({ fieldname, valueLength: value.length }, 'Processing text field');
                try {
                  parts[fieldname] = JSON.parse(value);
                } catch {
                  parts[fieldname] = value;
                }
              }
            }
          } catch (err) {
            logger.error({ err }, 'FormData parsing error');
            return reply.status(400).send({
              success: false,
              error: 'Failed to parse FormData'
            });
          }

          platform = parts.platform;
          content = parts.content;
          assets = parts.assets;
          videoFile = parts.video;
          videoTitle = parts.videoTitle;
          videoDescription = parts.videoDescription;
          videoTags = parts.videoTags || [];

          logger.info({ 
            receivedFields: Object.keys(parts),
            platform, 
            contentLength: content?.length,
            hasAssets: !!assets,
            assetsCount: assets?.length,
            hasVideo: !!videoFile,
            videoSize: videoFile?.length 
          }, 'FormData fields received');

          if (!platform || !content) {
            logger.error({ platform, hasContent: !!content }, 'Missing required fields');
            return reply.status(400).send({
              success: false,
              error: `Missing required fields: ${!platform ? 'platform' : ''} ${!content ? 'content' : ''}`
            });
          }

          if (typeof videoTags === 'string') {
            try {
              videoTags = JSON.parse(videoTags);
            } catch {
              logger.warn('Failed to parse videoTags, using as-is');
            }
          }

          logger.info({ platform, contentLength: content?.length, hasVideo: !!videoFile }, 'FormData parsed successfully');
        } else {
          // JSON upload
          const body = request.body as PostRequest;
          platform = body.platform;
          content = body.content;
          assets = body.assets;
          videoTitle = body.videoTitle;
          videoDescription = body.videoDescription;
          videoTags = body.videoTags || [];

          // Legacy: support base64 in body
          if (body.videoFile) {
            videoFile = Buffer.from(body.videoFile, 'base64');
          }
        }

        if (!platform || !content) {
          logger.error({ platform, hasContent: !!content }, 'Missing required fields for /social/post');
          return reply.status(400).send({
            success: false,
            error: 'Content und Plattform sind erforderlich'
          });
        }

        try {
          // Use orchestrator to handle posting
          const result = await orchestrator.publishPost({
            platform: platform as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'youtube' | 'all',
            content,
            assets,
            mediaUrl: undefined,
            videoBuffer: videoFile,
            videoTitle,
            videoDescription,
            videoTags
          });

          logger.info({ platform, success: result.success, resultKeys: Object.keys(result.results || {}) }, 'Social post processed');

          return reply.send(result);

        } catch (error) {
          logger.error({ error }, 'Social media post error');
          return reply.status(500).send({
            success: false,
            error: error instanceof Error ? error.message : 'Post failed'
          });
        }
      } catch (error) {
        logger.error({ error }, 'Request parsing error');
        return reply.status(400).send({
          success: false,
          error: 'Invalid request format'
        });
      }
    }
  );

  // ==================== GET POST STATS ====================

  fastify.get('/social/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = {
        facebook: await getFacebookStats(),
        instagram: await getInstagramStats(),
        tiktok: await getTikTokStats()
      };

      return reply.send({
        success: true,
        stats
      });

    } catch (error) {
      logger.error({ error }, 'Failed to fetch social media stats');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats'
      });
    }
  });

  async function getFacebookStats() {
    const config = getConfig();
    const pageId = config.webhooks?.facebookPageId || process.env.FACEBOOK_PAGE_ID;
    const accessToken = config.webhooks?.facebookPageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
      return { followers: 742, posts: 0, engagement: 0 }; // Your actual numbers
    }

    const url = `https://graph.facebook.com/v18.0/${pageId}?fields=followers_count,posts.limit(10)&access_token=${accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();

    return {
      followers: data.followers_count || 742,
      posts: data.posts?.data?.length || 0,
      engagement: 0 // Would need more complex calculation
    };
  }

  async function getInstagramStats() {
    const config = getConfig();
    const igAccountId = config.webhooks?.instagramBusinessAccountId || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const accessToken = config.webhooks?.facebookPageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!igAccountId || !accessToken) {
      return { followers: 52, posts: 0, engagement: 0 }; // Your actual numbers
    }

    const url = `https://graph.facebook.com/v18.0/${igAccountId}?fields=followers_count,media_count&access_token=${accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();

    return {
      followers: data.followers_count || 52,
      posts: data.media_count || 0,
      engagement: 0
    };
  }

  async function getTikTokStats() {
    // TikTok stats would require API call with access token
    return {
      followers: 2098, // Your actual TikTok followers
      posts: 0,
      engagement: 0
    };
  }
}
