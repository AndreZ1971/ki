// backend/services/social/publishers/YouTubePublisher.ts
import { logger } from '../../../logger';
import * as fs from 'fs';
import * as path from 'path';

interface YouTubeUploadRequest {
  content: string;
  videoBuffer?: Buffer;
  videoTitle?: string;
  videoDescription?: string;
  videoTags?: string[];
}

interface YouTubePostResult {
  success: boolean;
  videoId: string;
  platform: string;
  title: string;
  url: string;
  status: string;
}

export class YouTubePublisher {
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

  private async generateYouTubeMetadata(content: string) {
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

  private async refreshYouTubeToken(refreshToken: string, clientId: string, clientSecret: string): Promise<string> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error({ status: response.status, errorBody }, 'Token refresh failed');
      throw new Error(`Token refresh fehlgeschlagen: ${response.statusText}`);
    }

    const data = await response.json();
    const newAccessToken = data.access_token;

    // Save new access token to connection.json
    try {
      const configPath = path.resolve(__dirname, '../../../../connection.json');
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      
      if (!configData.socialMedia) configData.socialMedia = {};
      if (!configData.socialMedia.youtube) configData.socialMedia.youtube = {};
      
      configData.socialMedia.youtube.accessToken = newAccessToken;
      
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
      logger.info('YouTube access token refreshed and saved');
    } catch (error) {
      logger.error({ error }, 'Failed to save refreshed token');
    }

    return newAccessToken;
  }

  async publish(uploadRequest: YouTubeUploadRequest): Promise<YouTubePostResult> {
    const socialMedia = this.getSocialMediaConfig();
    const youtubeConfig = socialMedia.youtube;
    
    let accessToken = youtubeConfig?.accessToken || process.env.YOUTUBE_ACCESS_TOKEN;
    const refreshToken = youtubeConfig?.refreshToken;
    const clientId = youtubeConfig?.clientId;
    const clientSecret = youtubeConfig?.clientSecret;

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
      : await this.generateYouTubeMetadata(content);

    try {
      // Step 1: Initialize resumable upload session
      const initUrl = 'https://www.googleapis.com/youtube/v3/videos?uploadType=resumable&part=snippet,status';
      
      const snippet = {
        title: metadata.title || 'Untitled Video',
        description: metadata.description || content,
        tags: metadata.tags || [],
        categoryId: '24' // Entertainment category
      };

      logger.info({ 
        videoSize: buffer.length, 
        title: snippet.title,
        tags: snippet.tags,
        description: snippet.description?.substring(0, 100)
      }, 'Starting YouTube video upload');

      // YouTube Data API v3 - Resumable Upload Init
      // Only include essential fields to avoid "Invalid Argument" errors
      const initBody = {
        snippet,
        status: {
          privacyStatus: 'public' // Only required field for status
        }
      };

      logger.info({ 
        title: snippet.title,
        categoryId: snippet.categoryId,
        tagsCount: snippet.tags?.length,
        privacyStatus: initBody.status.privacyStatus
      }, 'YouTube init request body');

      let initResponse = await fetch(initUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Type': 'video/*',
          'X-Goog-Upload-Header-Content-Length': buffer.length.toString()
        },
        body: JSON.stringify(initBody)
      });

      // Handle 401 Unauthorized - try to refresh token
      if (initResponse.status === 401 && refreshToken && clientId && clientSecret) {
        logger.info('Access token expired - refreshing...');
        
        try {
          accessToken = await this.refreshYouTubeToken(refreshToken, clientId, clientSecret);
          
          // Retry with new token
          initResponse = await fetch(initUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'X-Goog-Upload-Protocol': 'resumable',
              'X-Goog-Upload-Command': 'start',
              'X-Goog-Upload-Header-Content-Type': 'video/*',
              'X-Goog-Upload-Header-Content-Length': buffer.length.toString()
            },
            body: JSON.stringify(initBody)
          });
        } catch (refreshError) {
          logger.error({ refreshError }, 'Token refresh failed');
          throw new Error('YouTube Token abgelaufen. Bitte verbinden Sie YouTube erneut in den Einstellungen.');
        }
      }

      if (!initResponse.ok) {
        const errorBody = await initResponse.text();
        logger.error({ 
          status: initResponse.status, 
          statusText: initResponse.statusText,
          errorBody,
          headers: Object.fromEntries(initResponse.headers.entries())
        }, 'YouTube init failed');
        
        // Provide user-friendly error message
        if (initResponse.status === 401) {
          throw new Error('YouTube Authentifizierung fehlgeschlagen. Bitte verbinden Sie YouTube erneut in den Einstellungen.');
        }
        
        throw new Error(`YouTube init failed: ${initResponse.statusText} - ${errorBody}`);
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
}
