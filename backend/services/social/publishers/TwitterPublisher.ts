
// backend/services/social/publishers/TwitterPublisher.ts
import { logger } from '../../../logger';
import { getConfig as _getConfig } from '@config';
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
      const twitterConfig = this._getTwitterConfig();

      logger.info({ 
        hasApiKey: !!twitterConfig.apiKey,
        hasApiSecret: !!twitterConfig.apiSecret,
        hasAccessToken: !!twitterConfig.accessToken,
        hasAccessSecret: !!twitterConfig.accessTokenSecret,
        enabled: twitterConfig.enabled
      }, 'Twitter config check');

      if (!twitterConfig.apiKey || !twitterConfig.apiSecret || !twitterConfig.accessToken || !twitterConfig.accessTokenSecret) {
        throw new Error('Twitter credentials nicht konfiguriert');
      }

      // Use Twitter API v2 with OAuth 1.0a
      const { TwitterApi } = await import('twitter-api-v2').catch(() => {
        throw new Error('twitter-api-v2 package not installed');
      });

      logger.info('Initializing TwitterApi client');

      const client = new TwitterApi({
        appKey: twitterConfig.apiKey,
        appSecret: twitterConfig.apiSecret,
        accessToken: twitterConfig.accessToken,
        accessSecret: twitterConfig.accessTokenSecret
      });

      logger.info('TwitterApi client initialized');

      const rwClient = client.readWrite;

      // Truncate content to 280 characters (Twitter limit)
      const truncatedContent = content.length > 280 ? content.substring(0, 277) + '...' : content;

      logger.info({ contentLength: truncatedContent.length }, 'Publishing to Twitter');

      // Create tweet (with media if available)
      let response;
      if (imageUrl) {
        logger.info({ imageUrl }, 'Attempting to upload media');
        // Fetch image from URL and convert to buffer
        const imageBuffer = await fetch(imageUrl).then(res => res.arrayBuffer()).then(ab => Buffer.from(ab));
        
        // Upload media first
        const mediaData = await rwClient.v1.uploadMedia(imageBuffer, { mimeType: 'image/jpeg' });
        const mediaId = typeof mediaData === 'string' ? mediaData : (mediaData as any).media_id_string;
        
        logger.info({ mediaId }, 'Media uploaded, tweeting with media');

        // Tweet with media
        response = await rwClient.v2.tweet(truncatedContent, {
          media: {
            media_ids: [mediaId]
          }
        });
      } else {
        logger.info('Tweeting without media');
        response = await rwClient.v2.tweet(truncatedContent);
      }

      // Log full response for debugging
      logger.info({ 
        fullResponse: JSON.stringify(response, null, 2),
        responseKeys: Object.keys(response || {}),
        hasData: !!response?.data,
        hasErrors: !!(response as any)?.errors
      }, 'Full Twitter API response');

      // Check for API errors in response
      if ((response as any).errors && (response as any).errors.length > 0) {
        const apiError = (response as any).errors[0];
        throw new Error(`Twitter API Error: ${apiError.message || apiError.detail || JSON.stringify(apiError)}`);
      }

      if (!response.data?.id) {
        logger.error({ response }, 'Invalid Twitter API response - no tweet ID');
        throw new Error('Twitter API returned invalid response - no tweet ID');
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
      const detail = (error as any)?.data?.detail
        || (error as any)?.error?.detail
        || (error as any)?.message
        || 'Veröffentlichung fehlgeschlagen';
      const status = (error as any)?.code || (error as any)?.data?.status;

      logger.error({ error, status, detail }, 'Twitter publish error');
      return {
        success: false,
        platform: 'twitter',
        error: status ? `Twitter API (${status}): ${detail}` : `Twitter API: ${detail}`
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
          logger.info({ candidate }, 'Loaded connection.json for Twitter config');
          break;
        } catch (_err) {
          // try next
        }
      }

      if (!configRaw) {
        logger.error('connection.json not found for Twitter config');
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
