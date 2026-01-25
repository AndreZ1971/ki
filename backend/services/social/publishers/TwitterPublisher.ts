// backend/services/social/publishers/TwitterPublisher.ts
import { logger } from '../../../logger';
import { getConfig } from '@config';
import * as fs from 'fs';
import * as path from 'path';

interface TwitterPostResult {
  success: boolean;
  platform: string;
  postId?: string;
  url?: string;
  error?: string;
}

export class TwitterPublisher {
  async publish(content: string, imageUrl?: string): Promise<TwitterPostResult> {
    try {
      const config = getConfig();
      const twitterConfig = this._getTwitterConfig();

      if (!twitterConfig.apiKey || !twitterConfig.apiSecret || !twitterConfig.accessToken || !twitterConfig.accessTokenSecret) {
        throw new Error('Twitter credentials nicht konfiguriert');
      }

      // Use Twitter API v2 with OAuth 1.0a
      const { TwitterApi } = await import('twitter-api-v2').catch(() => {
        throw new Error('twitter-api-v2 package not installed');
      });

      const client = new TwitterApi({
        appKey: twitterConfig.apiKey,
        appSecret: twitterConfig.apiSecret,
        accessToken: twitterConfig.accessToken,
        accessSecret: twitterConfig.accessTokenSecret
      });

      const rwClient = client.readWrite;

      // Truncate content to 280 characters (Twitter limit)
      const truncatedContent = content.length > 280 ? content.substring(0, 277) + '...' : content;

      logger.info({ contentLength: truncatedContent.length }, 'Publishing to Twitter');

      // Create tweet (with media if available)
      let response;
      if (imageUrl) {
        try {
          // Fetch image from URL and convert to buffer
          const imageBuffer = await fetch(imageUrl).then(res => res.arrayBuffer()).then(ab => Buffer.from(ab));
          
          // Upload media first
          const mediaData = await rwClient.v1.uploadMedia(imageBuffer, { mimeType: 'image/jpeg' });
          const mediaId = typeof mediaData === 'string' ? mediaData : (mediaData as any).media_id_string;
          
          // Tweet with media
          response = await rwClient.v2.tweet(truncatedContent, {
            media: {
              media_ids: [mediaId]
            }
          });
        } catch (mediaError) {
          logger.warn({ error: mediaError }, 'Failed to upload media, posting text only');
          // Fall back to text-only tweet
          response = await rwClient.v2.tweet(truncatedContent);
        }
      } else {
        response = await rwClient.v2.tweet(truncatedContent);
      }

      const tweetId = response.data.id;
      const tweetUrl = `https://twitter.com/i/web/status/${tweetId}`;

      logger.info({ tweetId, tweetUrl }, 'Tweet published successfully');

      return {
        success: true,
        platform: 'twitter',
        postId: tweetId,
        url: tweetUrl
      };
    } catch (error) {
      logger.error({ error }, 'Twitter publish error');
      return {
        success: false,
        platform: 'twitter',
        error: error instanceof Error ? error.message : 'Veröffentlichung fehlgeschlagen'
      };
    }
  }

  private _getTwitterConfig() {
    try {
      const candidates = [
        path.resolve(__dirname, '../../../../../connection.json'),
        path.resolve(process.cwd(), 'connection.json'),
        path.resolve(process.cwd(), 'backend', 'connection.json')
      ];

      let configRaw = '';
      for (const candidate of candidates) {
        try {
          configRaw = fs.readFileSync(candidate, 'utf-8');
          break;
        } catch (_err) {
          // try next
        }
      }

      if (!configRaw) {
        return {};
      }

      const configData = JSON.parse(configRaw);
      const twitterConfig = configData.socialMedia?.twitter || {};

      return {
        enabled: twitterConfig.enabled || false,
        apiKey: twitterConfig.apiKey || process.env.TWITTER_API_KEY,
        apiSecret: twitterConfig.apiSecret || process.env.TWITTER_API_SECRET,
        accessToken: twitterConfig.accessToken || process.env.TWITTER_ACCESS_TOKEN,
        accessTokenSecret: twitterConfig.accessTokenSecret || process.env.TWITTER_ACCESS_TOKEN_SECRET
      };
    } catch (error) {
      logger.error({ error }, 'Failed to read Twitter config');
      return {};
    }
  }
}
