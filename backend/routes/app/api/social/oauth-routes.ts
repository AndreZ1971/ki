// backend/routes/app/api/social/oauth-routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getConfig } from '@config';

interface OAuthCallbackQuery {
  code: string;
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
        console.log('✅ Facebook Access Token:', longLivedData.access_token);

        // Get user's pages
        const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedData.access_token}`;
        const pagesResponse = await fetch(pagesUrl);
        const pagesData = await pagesResponse.json();

        console.log('📄 Facebook Pages:', pagesData.data);

        // Get Instagram Business Account ID
        if (pagesData.data && pagesData.data.length > 0) {
          const pageId = pagesData.data[0].id;
          const pageToken = pagesData.data[0].access_token;

          const igUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`;
          const igResponse = await fetch(igUrl);
          const igData = await igResponse.json();

          console.log('📸 Instagram Business Account:', igData.instagram_business_account);
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
        console.error('❌ Facebook OAuth Error:', error);
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

        console.log('✅ TikTok Access Token:', tokenData.access_token);
        console.log('🔄 TikTok Refresh Token:', tokenData.refresh_token);

        // Get user info
        const userUrl = 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name';
        const userResponse = await fetch(userUrl, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });

        const userData = await userResponse.json();
        console.log('👤 TikTok User:', userData);

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
        console.error('❌ TikTok OAuth Error:', error);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'TikTok OAuth failed'
        });
      }
    }
  );

  // ==================== STATUS & MANAGEMENT ====================

  // Get connected accounts status
  fastify.get('/auth/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    // In production, check database for stored tokens
    return reply.send({
      success: true,
      accounts: {
        facebook: {
          connected: !!(getConfig().webhooks?.facebookPageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN),
          pageId: getConfig().webhooks?.facebookPageId || process.env.FACEBOOK_PAGE_ID || null
        },
        instagram: {
          connected: !!(getConfig().webhooks?.instagramBusinessAccountId || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID),
          accountId: getConfig().webhooks?.instagramBusinessAccountId || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || null
        },
        tiktok: {
          connected: false, // Check in DB
          username: null
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
      console.log(`🔌 Disconnecting ${platform}`);

      return reply.send({
        success: true,
        message: `${platform} wurde getrennt`
      });
    }
  );
}
