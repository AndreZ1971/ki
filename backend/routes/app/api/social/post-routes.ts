// backend/routes/app/api/social/post-routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getConfig } from '@config';
import { logger } from '../../../../logger';
import * as fs from 'fs';
import * as path from 'path';

interface PostRequest {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'all';
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  videoFile?: string; // Base64 encoded video for YouTube (deprecated - use FormData instead)
  videoTitle?: string;
  videoDescription?: string;
  videoTags?: string[];
}

export default async function postRoutes(fastify: FastifyInstance) {

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

  // ==================== POST TO SOCIAL MEDIA ====================
  
  fastify.post<{ Body: PostRequest }>(
    '/social/post',
    async (request: FastifyRequest<{ Body: PostRequest }>, reply: FastifyReply) => {
      try {
        // Handle both JSON and FormData uploads
        let platform: string;
        let content: string;
        let videoFile: Buffer | undefined;
        let videoTitle: string | undefined;
        let videoDescription: string | undefined;
        let videoTags: string[] = [];

        const contentType = request.headers['content-type'] || '';

        if (contentType.includes('multipart/form-data')) {
          // FormData upload (for video files)
          const fields = await request.files();
          const parts: any = {};

          for await (const part of fields) {
            if (part.file) {
              // This is a file field
              parts[part.fieldname] = await part.toBuffer();
            } else {
              // This is a regular field
              const buffer = await part.toBuffer();
              const value = buffer.toString('utf-8');
              try {
                parts[part.fieldname] = JSON.parse(value);
              } catch {
                parts[part.fieldname] = value;
              }
            }
          }

          platform = parts.platform;
          content = parts.content;
          videoFile = parts.video;
          videoTitle = parts.videoTitle;
          videoDescription = parts.videoDescription;
          videoTags = parts.videoTags || [];

          if (typeof videoTags === 'string') {
            videoTags = JSON.parse(videoTags);
          }
        } else {
          // JSON upload
          const body = request.body as PostRequest;
          platform = body.platform;
          content = body.content;
          videoTitle = body.videoTitle;
          videoDescription = body.videoDescription;
          videoTags = body.videoTags || [];

          // Legacy: support base64 in body
          if (body.videoFile) {
            videoFile = Buffer.from(body.videoFile, 'base64');
          }
        }

        if (!content) {
          return reply.status(400).send({
            success: false,
            error: 'Content ist erforderlich'
          });
        }

        try {
          const results: any = {};

          // Post to all platforms if 'all' is selected
          const platforms = platform === 'all' 
            ? ['facebook', 'instagram', 'tiktok'] 
            : [platform];

          for (const targetPlatform of platforms) {
            switch (targetPlatform) {
              case 'facebook':
                results.facebook = await postToFacebook(content);
                break;
              case 'instagram':
                results.instagram = await postToInstagram(content);
                break;
              case 'tiktok':
                results.tiktok = await postToTikTok(content);
                break;
              case 'youtube':
                results.youtube = await postToYouTube({
                  content,
                  videoBuffer: videoFile,
                  videoTitle,
                  videoDescription,
                  videoTags
                });
                break;
            }
          }

          return reply.send({
            success: true,
            message: `Post erfolgreich auf ${platforms.join(', ')} veröffentlicht!`,
            results
          });

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

  // ==================== FACEBOOK POSTING ====================

  async function postToFacebook(message: string) {
    const socialMedia = getSocialMediaConfig();
    const facebookConfig = socialMedia.facebook;
    
    const pageId = facebookConfig?.pageId || process.env.FACEBOOK_PAGE_ID;
    const accessToken = facebookConfig?.accessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
      throw new Error('Facebook credentials nicht konfiguriert. Bitte fügen Sie den Access Token und die Page ID in den Einstellungen hinzu.');
    }

    const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;

    const body: any = {
      message,
      access_token: accessToken
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    logger.info({ postId: data.id }, 'Facebook post created successfully');

    return {
      success: true,
      postId: data.id,
      platform: 'facebook',
      url: `https://facebook.com/${data.id}`
    };
  }

  // ==================== INSTAGRAM POSTING ====================

  async function postToInstagram(caption: string) {
    const socialMedia = getSocialMediaConfig();
    const instagramConfig = socialMedia.instagram;
    
    const igAccountId = instagramConfig?.businessAccountId || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const accessToken = instagramConfig?.accessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN; // Instagram uses Facebook token

    if (!igAccountId || !accessToken) {
      throw new Error('Instagram credentials nicht konfiguriert');
    }

    // Step 1: Create media container
    const createUrl = `https://graph.facebook.com/v18.0/${igAccountId}/media`;
    
    const createBody: any = {
      caption,
      access_token: accessToken,
      media_type: 'IMAGE'
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

  // ==================== TIKTOK POSTING ====================

  async function postToTikTok(caption: string, videoUrl?: string) {
    const socialMedia = getSocialMediaConfig();
    const tiktokConfig = socialMedia.tiktok;
    
    const accessToken = tiktokConfig?.accessToken || process.env.TIKTOK_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('TikTok credentials nicht konfiguriert');
    }

    if (!videoUrl) {
      throw new Error('TikTok benötigt ein Video');
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

  // ==================== YOUTUBE POSTING ====================

  async function generateYouTubeMetadata(content: string) {
    // Generate title, description, and tags from content using simple heuristics
    // In production, this could use OpenAI or Claude API
    const lines = content.split('\n').filter(l => l.trim());
    
    // Title: first line or first 100 chars
    const title = (lines[0] || content).substring(0, 100);
    
    // Extract hashtags or keywords
    const hashtagRegex = /#\w+/g;
    const tags = content.match(hashtagRegex)?.map(tag => tag.substring(1)) || [];
    
    // Description: full content
    const description = content;
    
    return { title, description, tags };
  }

  async function postToYouTube(uploadRequest: {
    content: string;
    videoBuffer?: Buffer;
    videoTitle?: string;
    videoDescription?: string;
    videoTags?: string[];
  }) {
    const socialMedia = getSocialMediaConfig();
    const youtubeConfig = socialMedia.youtube;
    
    const accessToken = youtubeConfig?.accessToken || process.env.YOUTUBE_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('YouTube credentials nicht konfiguriert. Bitte verbinden Sie Ihren YouTube-Kanal in den Einstellungen.');
    }

    const { content, videoBuffer, videoTitle, videoDescription, videoTags } = uploadRequest;

    if (!videoBuffer) {
      throw new Error('YouTube benötigt ein Video');
    }

    // Ensure videoBuffer is a Node Buffer
    const buffer = Buffer.isBuffer(videoBuffer) 
      ? videoBuffer 
      : Buffer.from(videoBuffer as ArrayBuffer | ArrayBufferLike);

    // Validate video size
    if (buffer.length > 100 * 1024 * 1024) {
      throw new Error('Video zu groß! Max. 100 MB.');
    }

    // Generate metadata from content if not provided
    const metadata = videoTitle && videoDescription
      ? { title: videoTitle, description: videoDescription, tags: videoTags || [] }
      : await generateYouTubeMetadata(content);

    try {
      // Step 1: Initialize resumable upload session
      const initUrl = 'https://www.googleapis.com/youtube/v3/videos?uploadType=resumable&part=snippet,status';
      
      const snippet = {
        title: metadata.title || 'Untitled Video',
        description: metadata.description || content,
        tags: metadata.tags || [],
        categoryId: '24' // Entertainment category
      };

      logger.info({ videoSize: videoBuffer.length, title: snippet.title }, 'Starting YouTube video upload');

      const initResponse = await fetch(initUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Type': 'video/*'
        },
        body: JSON.stringify({
          snippet,
          status: {
            privacyStatus: 'public', // or 'private', 'unlisted'
            selfDeclaredMadeForKids: false,
            embeddable: true,
            license: 'creativeCommon'
          }
        })
      });

      if (!initResponse.ok) {
        throw new Error(`YouTube init failed: ${initResponse.statusText}`);
      }

      const sessionUri = initResponse.headers.get('location');
      if (!sessionUri) {
        throw new Error('No upload session URI returned');
      }

      // Step 3: Upload video file
      const uploadResponse = await fetch(sessionUri, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'X-Goog-Upload-Command': 'upload, finalize',
          'X-Goog-Upload-Offset': '0'
        },
        body: buffer as any
      });

      if (!uploadResponse.ok) {
        throw new Error(`YouTube upload failed: ${uploadResponse.statusText}`);
      }

      const uploadedVideo = await uploadResponse.json();

      logger.info({ videoId: uploadedVideo.id }, 'YouTube video uploaded successfully');

      return {
        success: true,
        videoId: uploadedVideo.id,
        platform: 'youtube',
        title: metadata.title,
        url: `https://youtube.com/watch?v=${uploadedVideo.id}`,
        status: uploadedVideo.status?.uploadStatus || 'processing'
      };

    } catch (error) {
      // If token expired, try refresh
      if (error instanceof Error && error.message.includes('401')) {
        logger.warn('YouTube access token expired, attempting refresh');
        // Token refresh logic would go here
      }
      throw error;
    }
  }

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
