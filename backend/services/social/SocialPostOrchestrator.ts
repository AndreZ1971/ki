// backend/services/social/SocialPostOrchestrator.ts
import { logger } from '../../logger';
import { FacebookPublisher } from './publishers/FacebookPublisher';
import { InstagramPublisher } from './publishers/InstagramPublisher';
import { TikTokPublisher } from './publishers/TikTokPublisher';
import { TwitterPublisher } from './publishers/TwitterPublisher';
import { YouTubePublisher } from './publishers/YouTubePublisher';
import { SocialPostRequest, SocialPostResult } from '../../types/social';

export interface SocialPostResults {
  success: boolean;
  message: string;
  results: Record<string, SocialPostResult>;
}

export class SocialPostOrchestrator {
  private facebookPublisher: FacebookPublisher;
  private instagramPublisher: InstagramPublisher;
  private tiktokPublisher: TikTokPublisher;
  private twitterPublisher: TwitterPublisher;
  private youtubePublisher: YouTubePublisher;

  constructor() {
    this.facebookPublisher = new FacebookPublisher();
    this.instagramPublisher = new InstagramPublisher();
    this.tiktokPublisher = new TikTokPublisher();
    this.twitterPublisher = new TwitterPublisher();
    this.youtubePublisher = new YouTubePublisher();
  }

  async publishPost(request: SocialPostRequest): Promise<SocialPostResults> {
    const { platform, content, assets, mediaUrl, videoBuffer, videoTitle, videoDescription, videoTags } = request;

    if (!content) {
      throw new Error('Content ist erforderlich');
    }

    const results: Record<string, SocialPostResult> = {};

    // Extract asset URLs by type
    const imageAsset = assets?.find(a => a.type === 'image');
    const videoAsset = assets?.find(a => a.type === 'video');
    const _audioAsset = assets?.find(a => a.type === 'audio');

    // Use asset URL or fallback to legacy mediaUrl
    const imageUrl = imageAsset?.url || (mediaUrl && request.mediaType === 'image' ? mediaUrl : undefined);
    const videoUrl = videoAsset?.url || (mediaUrl && request.mediaType === 'video' ? mediaUrl : undefined);

    // Post to all platforms if 'all' is selected
    const platforms = platform === 'all' 
      ? ['facebook', 'instagram', 'tiktok'] 
      : [platform];

    for (const targetPlatform of platforms) {
      try {
        switch (targetPlatform) {
          case 'facebook':
            results.facebook = await this.facebookPublisher.publish(content, imageUrl);
            break;
          
          case 'instagram':
            results.instagram = await this.instagramPublisher.publish(content, imageUrl);
            break;
          
          case 'tiktok':
            results.tiktok = await this.tiktokPublisher.publish(content, videoUrl);
            break;
          
          case 'twitter':
            results.twitter = await this.twitterPublisher.publish(content, imageUrl);
            break;
          
          case 'youtube':
            results.youtube = await this.youtubePublisher.publish({
              content,
              videoBuffer,
              videoTitle,
              videoDescription,
              videoTags
            });
            break;
        }
      } catch (error) {
        logger.error({ error, platform: targetPlatform }, `Failed to post to ${targetPlatform}`);
        results[targetPlatform] = {
          success: false,
          platform: targetPlatform,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return {
      success: true,
      message: `Post erfolgreich auf ${platforms.join(', ')} veröffentlicht!`,
      results
    };
  }
}
