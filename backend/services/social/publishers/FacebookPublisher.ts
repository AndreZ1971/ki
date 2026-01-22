// backend/services/social/publishers/FacebookPublisher.ts
import { logger } from '../../../logger';
import * as fs from 'fs';
import * as path from 'path';

interface FacebookPostResult {
  success: boolean;
  postId: string;
  platform: string;
  url: string;
}

export class FacebookPublisher {
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

  async publish(message: string, imageUrl?: string): Promise<FacebookPostResult> {
    const socialMedia = this.getSocialMediaConfig();
    const facebookConfig = socialMedia.facebook;
    
    const pageId = facebookConfig?.pageId || process.env.FACEBOOK_PAGE_ID;
    const accessToken = facebookConfig?.accessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
      throw new Error('Facebook credentials nicht konfiguriert. Bitte fügen Sie den Access Token und die Page ID in den Einstellungen hinzu.');
    }

    // Choose endpoint based on whether we have an image
    const endpoint = imageUrl ? 'photos' : 'feed';
    const url = `https://graph.facebook.com/v18.0/${pageId}/${endpoint}`;

    const body: any = {
      access_token: accessToken
    };

    if (imageUrl) {
      // Image post with caption
      body.url = imageUrl;
      body.caption = message;
    } else {
      // Text-only post
      body.message = message;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    logger.info({ postId: data.id, hasImage: !!imageUrl }, 'Facebook post created successfully');

    return {
      success: true,
      postId: data.id,
      platform: 'facebook',
      url: `https://facebook.com/${data.id}`
    };
  }
}
