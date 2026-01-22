// backend/services/social/publishers/TikTokPublisher.ts
import { logger } from '../../../logger';
import * as fs from 'fs';
import * as path from 'path';

interface TikTokPostResult {
  success: boolean;
  publishId?: string;
  platform: string;
  status?: string;
}

export class TikTokPublisher {
  private getSocialMediaConfig() {
    try {
      const configPath = path.resolve(__dirname, '../../../../connection.json');
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return configData.socialMedia || {};
    } catch (error) {
      logger.error({ error }, 'Failed to read socialMedia config');
      return {};
    }
  }

  async publish(caption: string, videoUrl?: string): Promise<TikTokPostResult> {
    const socialMedia = this.getSocialMediaConfig();
    const tiktokConfig = socialMedia.tiktok;
    
    const accessToken = tiktokConfig?.accessToken || process.env.TIKTOK_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('TikTok credentials nicht konfiguriert');
    }

    if (!videoUrl) {
      throw new Error('TikTok benötigt ein Video. Bild-Posts sind nicht möglich.');
    }

    // Validate URL is not an image
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const urlLower = videoUrl.toLowerCase();
    if (imageExtensions.some(ext => urlLower.endsWith(ext))) {
      throw new Error('TikTok benötigt ein Video. Bild-Posts sind nicht möglich.');
    }

    // TikTok Content Posting API
    const url = 'https://open.tiktokapis.com/v2/post/publish/video/init/';

    const body = {
      post_info: {
        title: caption,
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: videoUrl
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`TikTok API Error: ${data.error.message}`);
    }

    logger.info({ publishId: data.data?.publish_id }, 'TikTok post created successfully');

    return {
      success: true,
      publishId: data.data?.publish_id,
      platform: 'tiktok',
      status: data.data?.status
    };
  }
}
