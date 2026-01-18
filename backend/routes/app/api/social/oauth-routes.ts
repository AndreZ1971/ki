// backend/routes/app/api/social/oauth-routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import { getConfig } from '@config';
import { logger } from '../../../../logger.js';

interface OAuthCallbackQuery {
  code: string;
}

const connectionPath = path.resolve(__dirname, '../../../../../connection.json');

function loadConnection(): any {
  try {
    return JSON.parse(fs.readFileSync(connectionPath, 'utf-8'));
  } catch (error) {
    logger.error({ error }, 'Failed to read connection.json');
    return {};
  }
}

function saveConnection(data: any) {
  try {
    fs.writeFileSync(connectionPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    logger.error({ error }, 'Failed to write connection.json');
    throw error;
  }
}

export default async function oauthRoutes(fastify: FastifyInstance) {
  
  // ==================== META (Facebook + Instagram) ====================
  
  // Facebook OAuth Start
  fastify.get('/auth/facebook', async (_request: FastifyRequest, reply: FastifyReply) => {
    const config = getConfig();
    const appId = config.webhooks?.facebook || process.env.META_APP_ID;
    const redirectUri = `${config.webhooks?.facebookRedirect || process.env.OAUTH_CALLBACK_BASE_URL}/api/auth/facebook/callback`;
    
    const scopes = [
      'pages_manage_posts',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_content_publish'
    ].join(',');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;

    return reply.redirect(authUrl);
  });

  // Facebook OAuth Callback
  fastify.get<{ Querystring: OAuthCallbackQuery }>(
    '/auth/facebook/callback',
    async (request: FastifyRequest<{ Querystring: OAuthCallbackQuery }>, reply: FastifyReply) => {
      const { code } = request.query;

      if (!code) {
        return reply.status(400).send({ success: false, error: 'No authorization code received' });
      }

      try {
        const config = getConfig();
        const appId = config.webhooks?.facebook || process.env.META_APP_ID;
        const appSecret = config.webhooks?.facebookSecret || process.env.META_APP_SECRET;
        const redirectUri = `${config.webhooks?.facebookRedirect || process.env.OAUTH_CALLBACK_BASE_URL}/api/auth/facebook/callback`;

        // Exchange code for access token
        const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
        
        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
          throw new Error('Failed to get access token');
        }

        // Get long-lived page access token
        const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`;
        
        const longLivedResponse = await fetch(longLivedUrl);
        const longLivedData = await longLivedResponse.json();

        // Store tokens (in real app, save to database)
        logger.info({ hasAccessToken: !!longLivedData.access_token }, 'Facebook access token received');

        // Get user's pages
        const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedData.access_token}`;
        const pagesResponse = await fetch(pagesUrl);
        const pagesData = await pagesResponse.json();

        logger.info({ pageCount: pagesData.data?.length || 0 }, 'Facebook pages retrieved');

        // Get Instagram Business Account ID
        if (pagesData.data && pagesData.data.length > 0) {
          const pageId = pagesData.data[0].id;
          const pageToken = pagesData.data[0].access_token;

          const igUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`;
          const igResponse = await fetch(igUrl);
          const igData = await igResponse.json();

          logger.info({ hasIgAccount: !!igData.instagram_business_account }, 'Instagram business account retrieved');
        }

        return reply.send({
          success: true,
          message: 'Facebook & Instagram erfolgreich verbunden!',
          data: {
            accessToken: longLivedData.access_token,
            pages: pagesData.data
          }
        });

      } catch (error) {
        logger.error({ error }, 'Facebook OAuth failed');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'OAuth failed'
        });
      }
    }
  );

  // ==================== TIKTOK ====================

  // TikTok OAuth Start
  fastify.get('/auth/tiktok', async (_request: FastifyRequest, reply: FastifyReply) => {
    const config = getConfig();
    const clientKey = config.webhooks?.tiktok || process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = config.webhooks?.tiktokRedirect || process.env.TIKTOK_REDIRECT_URI;
    const state = Math.random().toString(36).substring(7); // CSRF protection

    const scopes = ['user.info.basic', 'video.publish', 'video.list'].join(',');

    const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&redirect_uri=${encodeURIComponent(redirectUri!)}&response_type=code&scope=${scopes}&state=${state}`;

    return reply.redirect(authUrl);
  });

  // TikTok OAuth Callback
  fastify.get<{ Querystring: OAuthCallbackQuery }>(
    '/auth/tiktok/callback',
    async (request: FastifyRequest<{ Querystring: OAuthCallbackQuery }>, reply: FastifyReply) => {
      const { code } = request.query;

      if (!code) {
        return reply.status(400).send({ success: false, error: 'No authorization code received' });
      }

      try {
        const config = getConfig();
        const clientKey = config.webhooks?.tiktok || process.env.TIKTOK_CLIENT_KEY;
        const clientSecret = config.webhooks?.tiktokSecret || process.env.TIKTOK_CLIENT_SECRET;
        const redirectUri = config.webhooks?.tiktokRedirect || process.env.TIKTOK_REDIRECT_URI;

        // Exchange code for access token
        const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
        
        const tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_key: clientKey!,
            client_secret: clientSecret!,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri!
          })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
          throw new Error('Failed to get TikTok access token');
        }

        logger.info({ hasAccessToken: !!tokenData.access_token, hasRefreshToken: !!tokenData.refresh_token }, 'TikTok tokens received');

        // Get user info
        const userUrl = 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name';
        const userResponse = await fetch(userUrl, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });

        const userData = await userResponse.json();
        logger.info({ hasUserData: !!userData.data }, 'TikTok user info retrieved');

        return reply.send({
          success: true,
          message: 'TikTok erfolgreich verbunden!',
          data: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in
          }
        });

      } catch (error) {
        logger.error({ error }, 'TikTok OAuth failed');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'TikTok OAuth failed'
        });
      }
    }
  );

  // ==================== YOUTUBE ====================

  // YouTube OAuth Start
  fastify.get('/auth/youtube', async (_request: FastifyRequest, reply: FastifyReply) => {
    const config = loadConnection();
    const youtube = config.socialMedia?.youtube || {};
    const clientId = youtube.clientId || process.env.YOUTUBE_CLIENT_ID;
    const redirectBase = youtube.redirectUri || process.env.OAUTH_CALLBACK_BASE_URL || config.apiBaseUrl || '';
    const redirectUri = `${redirectBase}/api/auth/youtube/callback`;

    if (!clientId || !redirectBase) {
      logger.error('Missing YouTube clientId or redirectUri');
      return reply
        .status(400)
        .send({ success: false, error: 'YouTube clientId oder Redirect-URL fehlt' });
    }

    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(
      scopes
    )}&access_type=offline&prompt=consent`;

    return reply.redirect(authUrl);
  });

  // YouTube OAuth Callback
  fastify.get<{ Querystring: OAuthCallbackQuery }>(
    '/auth/youtube/callback',
    async (request: FastifyRequest<{ Querystring: OAuthCallbackQuery }>, reply: FastifyReply) => {
      const { code } = request.query;

      if (!code) {
        return reply.status(400).send({ success: false, error: 'No authorization code received' });
      }

      const config = loadConnection();
      const youtube = config.socialMedia?.youtube || {};
      const clientId = youtube.clientId || process.env.YOUTUBE_CLIENT_ID;
      const clientSecret = youtube.clientSecret || process.env.YOUTUBE_CLIENT_SECRET;
      const redirectBase = youtube.redirectUri || process.env.OAUTH_CALLBACK_BASE_URL || config.apiBaseUrl || '';
      const redirectUri = `${redirectBase}/api/auth/youtube/callback`;

      if (!clientId || !clientSecret) {
        logger.error('Missing YouTube clientId/clientSecret');
        return reply.status(400).send({ success: false, error: 'YouTube Client Daten fehlen' });
      }

      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
          throw new Error('Failed to get access token');
        }

        // Fetch channelId if missing
        let channelId = youtube.channelId || '';
        if (!channelId) {
          try {
            const channelResp = await fetch(
              'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',
              {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
              }
            );
            const channelJson = await channelResp.json();
            channelId = channelJson.items?.[0]?.id || channelId;
          } catch (err) {
            logger.warn({ err }, 'Could not fetch YouTube channelId');
          }
        }

        const updated = loadConnection();
        if (!updated.socialMedia) updated.socialMedia = {};
        if (!updated.socialMedia.youtube) updated.socialMedia.youtube = {};
        updated.socialMedia.youtube.enabled = true;
        updated.socialMedia.youtube.accessToken = tokenData.access_token;
        if (tokenData.refresh_token) {
          updated.socialMedia.youtube.refreshToken = tokenData.refresh_token;
        }
        if (channelId) {
          updated.socialMedia.youtube.channelId = channelId;
        }

        saveConnection(updated);

        return reply.send({
          success: true,
          message: 'YouTube erfolgreich verbunden',
          data: {
            accessToken: !!tokenData.access_token,
            hasRefresh: !!tokenData.refresh_token,
            channelId: channelId || null,
          },
        });
      } catch (error) {
        logger.error({ error }, 'YouTube OAuth failed');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'OAuth failed',
        });
      }
    }
  );

  // ==================== STATUS & MANAGEMENT ====================

  // Get connected accounts status
  fastify.get('/auth/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Read connection.json directly to get socialMedia config
    const fs = await import('fs');
    const path = await import('path');
    
    let socialMedia: any = {};
    try {
      // From backend/dist/routes/app/api/social -> backend/connection.json = ../../../../../connection.json
      const configPath = path.resolve(__dirname, '../../../../../connection.json');
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      socialMedia = configData.socialMedia || {};
    } catch (error) {
      logger.error({ error }, 'Failed to read socialMedia config');
    }

    return reply.send({
      success: true,
      accounts: {
        linkedin: {
          connected: socialMedia.linkedin?.enabled && !!socialMedia.linkedin?.accessToken,
          hasToken: !!socialMedia.linkedin?.accessToken
        },
        facebook: {
          connected: socialMedia.facebook?.enabled && !!socialMedia.facebook?.accessToken,
          pageId: socialMedia.facebook?.pageId || null,
          hasToken: !!socialMedia.facebook?.accessToken
        },
        instagram: {
          connected: socialMedia.instagram?.enabled && !!socialMedia.instagram?.accessToken,
          accountId: socialMedia.instagram?.businessAccountId || null,
          hasToken: !!socialMedia.instagram?.accessToken
        },
        twitter: {
          connected: socialMedia.twitter?.enabled && !!socialMedia.twitter?.accessToken,
          hasToken: !!socialMedia.twitter?.accessToken
        },
        tiktok: {
          connected: socialMedia.tiktok?.enabled && !!socialMedia.tiktok?.accessToken,
          hasToken: !!socialMedia.tiktok?.accessToken
        },
        youtube: {
          connected: socialMedia.youtube?.enabled && !!socialMedia.youtube?.accessToken,
          channelId: socialMedia.youtube?.channelId || null,
          hasToken: !!socialMedia.youtube?.accessToken
        }
      }
    });
  });

  // Disconnect account
  fastify.post<{ Body: { platform: string } }>(
    '/auth/disconnect',
    async (request: FastifyRequest<{ Body: { platform: string } }>, reply: FastifyReply) => {
      const { platform } = request.body;

      // In production, remove tokens from database
      logger.info({ platform }, 'Disconnecting social media platform');

      return reply.send({
        success: true,
        message: `${platform} wurde getrennt`
      });
    }
  );
}
