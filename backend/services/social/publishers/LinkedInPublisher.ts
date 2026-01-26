// backend/services/social/publishers/LinkedInPublisher.ts
import { logger } from '../../../logger';
import * as fs from 'fs';
import * as path from 'path';

interface LinkedInPostResult {
  success: boolean;
  platform: string;
  postId?: string;
  url?: string;
  error?: string;
}

export class LinkedInPublisher {
  async publish(content: string, imageUrl?: string): Promise<LinkedInPostResult> {
    try {
      const linkedinConfig = this._getLinkedInConfig();

      logger.info({
        hasAccessToken: !!linkedinConfig.accessToken,
        hasUrn: !!linkedinConfig.urn,
        enabled: linkedinConfig.enabled
      }, 'LinkedIn config check');

      if (!linkedinConfig.accessToken || !linkedinConfig.urn) {
        throw new Error('LinkedIn Anmeldedaten nicht konfiguriert');
      }

      // Check URN type - LinkedIn API requires Person URN for direct posting
      const authorUrn = linkedinConfig.personUrn;
      const organizationUrn = linkedinConfig.organizationUrn || (linkedinConfig.urn?.includes('organization') ? linkedinConfig.urn : null);

      if (!authorUrn) {
        throw new Error(
          'LinkedIn: Person URN erforderlich. ' +
          'Bitte einen persönlichen URN (urn:li:person:XXXXX) in connection.json konfigurieren unter socialMedia.linkedin.personUrn'
        );
      }

      logger.info({
        authorUrn,
        organizationUrn: organizationUrn || 'none',
        hasOrganization: !!organizationUrn
      }, 'Publishing to LinkedIn');

      // LinkedIn API v2 POST to create a share
      const shareContent: any = {
        commentary: content
      };

      // Falls Bild vorhanden, Media hinzufügen
      if (imageUrl) {
        logger.info({ imageUrl }, 'Attempting to upload media to LinkedIn');
        // LinkedIn erfordert 2-Schritt-Prozess:
        // 1. registerUpload für Media
        // 2. uploadMedia
        // 3. share mit media reference

        try {
          // Schritt 1: Register upload
          const isOrgURN = linkedinConfig.urn.includes('organization');
          const uploadRegisterResponse = await fetch(
            'https://api.linkedin.com/v2/assets?action=registerUpload',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${linkedinConfig.accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                registerUploadRequest: {
                  recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                  owner: linkedinConfig.urn,
                  serviceRelationships: [
                    {
                      relationshipType: 'OWNER',
                      identifier: isOrgURN ? 'urn:li:userGeneratedContent' : 'urn:li:userGeneratedContent'
                    }
                  ]
                }
              })
            }
          );

          if (!uploadRegisterResponse.ok) {
            const err = await uploadRegisterResponse.json();
            logger.error({ err }, 'LinkedIn register upload failed');
            throw new Error(`LinkedIn upload error: ${JSON.stringify(err)}`);
          }

          const uploadRegister = await uploadRegisterResponse.json();
          const uploadUrl = uploadRegister.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
          const assetId = uploadRegister.value.asset;

          // Schritt 2: Upload image
          logger.info({ uploadUrl, assetId }, 'Uploading image to LinkedIn');

          const imageBuffer = await fetch(imageUrl)
            .then(res => res.arrayBuffer())
            .then(ab => Buffer.from(ab));

          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'image/jpeg'
            },
            body: imageBuffer
          });

          if (!uploadResponse.ok) {
            logger.error({ status: uploadResponse.status }, 'LinkedIn image upload failed');
            throw new Error(`LinkedIn image upload failed: ${uploadResponse.status}`);
          }

          logger.info({ assetId }, 'Image uploaded, creating share with media');

          // Schritt 3: Create share mit Media
          shareContent.content = {
            media: [
              {
                status: 'READY',
                media: assetId
              }
            ]
          };
        } catch (mediaError) {
          logger.warn({ mediaError }, 'Media upload failed, continuing without media');
          // Ohne media weitermachen
        }
      }

      // LinkedIn Share erstellen - nutze personUrn zum Posten
      const endpoint = 'https://api.linkedin.com/v2/ugcPosts';

      const sharePayload: any = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            ...(shareContent.content ? { media: shareContent.content.media } : {})
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      // Falls Organization URN vorhanden, als Attribution hinzufügen
      if (organizationUrn) {
        sharePayload.containerRelationships = [
          {
            relationshipType: 'ORGANIZATIONAL',
            identifier: organizationUrn
          }
        ];
      }

      const shareResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${linkedinConfig.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sharePayload)
      });

      if (!shareResponse.ok) {
        const err = await shareResponse.json();
        const detail = err?.message || err?.detail || JSON.stringify(err);
        const status = err?.status || shareResponse.status;

        logger.error({ err, status, detail }, 'LinkedIn share creation failed');
        throw new Error(`LinkedIn API (${status}): ${detail}`);
      }

      const shareData = await shareResponse.json();

      logger.info({
        shareId: shareData.id,
        fullResponse: JSON.stringify(shareData, null, 2)
      }, 'Full LinkedIn API response');

      if (!shareData.id) {
        logger.error({ shareData }, 'Invalid LinkedIn API response - no share ID');
        throw new Error('LinkedIn API returned invalid response - no share ID');
      }

      const shareId = shareData.id;
      const shareUrl = `https://www.linkedin.com/feed/update/${shareId}/`;

      logger.info({ shareId, shareUrl }, 'Share published successfully to LinkedIn');

      return {
        success: true,
        platform: 'linkedin',
        postId: shareId,
        url: shareUrl
      };
    } catch (error) {
      const detail = (error as any)?.data?.detail
        || (error as any)?.error?.detail
        || (error as any)?.message
        || 'Veröffentlichung fehlgeschlagen';
      const status = (error as any)?.code || (error as any)?.data?.status;

      logger.error({ error, status, detail }, 'LinkedIn publish error');
      return {
        success: false,
        platform: 'linkedin',
        error: status ? `LinkedIn API (${status}): ${detail}` : `LinkedIn API: ${detail}`
      };
    }
  }

  private _getLinkedInConfig() {
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
          logger.info({ candidate }, 'Loaded connection.json for LinkedIn config');
          break;
        } catch (_err) {
          // try next
        }
      }

      if (!configRaw) {
        logger.error('connection.json not found for LinkedIn config');
        return {};
      }

      const configData = JSON.parse(configRaw);
      const linkedinConfig = configData.socialMedia?.linkedin || {};

      return {
        enabled: linkedinConfig.enabled || false,
        accessToken: linkedinConfig.accessToken || process.env.LINKEDIN_ACCESS_TOKEN,
        urn: linkedinConfig.urn || process.env.LINKEDIN_ORG_URN,
        personUrn: linkedinConfig.personUrn || process.env.LINKEDIN_PERSON_URN,
        organizationUrn: linkedinConfig.organizationUrn || linkedinConfig.urn || process.env.LINKEDIN_ORG_URN,
        clientId: linkedinConfig.clientId,
        clientSecret: linkedinConfig.clientSecret
      };
    } catch (error) {
      logger.error({ error }, 'Failed to read LinkedIn config');
      return {};
    }
  }
}
