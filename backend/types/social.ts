// backend/types/social.ts

export interface SocialAsset {
  assetId?: string;
  url: string;
  type: 'image' | 'audio' | 'video';
  mimeType?: string;
}

export interface SocialPostRequest {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'youtube' | 'all';
  content: string;
  assets?: SocialAsset[];
  // Legacy support
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  videoBuffer?: Buffer;
  videoTitle?: string;
  videoDescription?: string;
  videoTags?: string[];
}

export interface SocialPostResult {
  success: boolean;
  postId?: string;
  videoId?: string;
  publishId?: string;
  platform: string;
  url?: string;
  status?: string;
  error?: string;
}
