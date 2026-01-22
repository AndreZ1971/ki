// backend/services/social/publishers/InstagramPublisher.ts
import { logger } from '../../../logger';
import * as fs from 'fs';
import * as path from 'path';

interface InstagramPostResult {
  success: boolean;
  postId: string;
  platform: string;
  url: string;
}

export class InstagramPublisher {
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

  async publish(caption: string, imageUrl?: string): Promise<InstagramPostResult> {
    const socialMedia = this.getSocialMediaConfig();
    const instagramConfig = socialMedia.instagram;
    
    const igAccountId = instagramConfig?.businessAccountId || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const accessToken = instagramConfig?.accessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN; // Instagram uses Facebook token

    if (!igAccountId || !accessToken) {
      throw new Error('Instagram credentials nicht konfiguriert');
    }

    if (!imageUrl) {
      // Instagram requires media - fallback to text is not possible
      throw new Error('Instagram benötigt ein Bild. Text-only Posts sind nicht möglich.');
    }

    // Step 1: Create media container
    const createUrl = `https://graph.facebook.com/v18.0/${igAccountId}/media`;
    
    const createBody: any = {
      image_url: imageUrl,
      caption,
      access_token: accessToken
    };

    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createBody)
    });

    const createData = await createResponse.json();

    if (createData.error) {
      throw new Error(`Instagram Create Error: ${createData.error.message}`);
    }

    const containerId = createData.id;

    // Step 2: Publish media container
    const publishUrl = `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`;
    
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken
      })
    });

    const publishData = await publishResponse.json();

    if (publishData.error) {
      throw new Error(`Instagram Publish Error: ${publishData.error.message}`);
    }

    logger.info({ postId: publishData.id }, 'Instagram post created successfully');

    return {
      success: true,
      postId: publishData.id,
      platform: 'instagram',
      url: `https://instagram.com/p/${publishData.id}`
    };
  }
}
