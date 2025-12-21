// backend/routes/app/api/social/buffer-routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getConfig } from '@config';

interface BufferPostRequest {
  platform: string;
  content: string;
  mediaUrl?: string;
  scheduleTime?: string;
}

export default async function bufferRoutes(fastify: FastifyInstance) {

  // POST to social media via Buffer API
  fastify.post<{ Body: BufferPostRequest }>(
    '/social/buffer/post',
    async (request: FastifyRequest<{ Body: BufferPostRequest }>, reply: FastifyReply) => {
      const { platform, content, mediaUrl, scheduleTime } = request.body;

      const bufferAccessToken = getConfig().webhooks?.buffer || process.env.BUFFER_ACCESS_TOKEN;
      
      if (!bufferAccessToken) {
        return reply.status(400).send({
          success: false,
          error: 'Buffer Access Token nicht konfiguriert. Gehe zu: https://buffer.com/developers/apps'
        });
      }

      try {
        // Step 1: Get profile IDs from Buffer
        const profilesResponse = await fetch('https://api.bufferapp.com/1/profiles.json', {
          headers: {
            'Authorization': `Bearer ${bufferAccessToken}`
          }
        });

        const profiles = await profilesResponse.json();
        
        // Find the profile for the requested platform
        const profile = profiles.find((p: any) => 
          p.service.toLowerCase() === platform.toLowerCase()
        );

        if (!profile) {
          return reply.status(404).send({
            success: false,
            error: `Kein ${platform.toUpperCase()} Account bei Buffer gefunden. Verbinde ihn in Buffer: https://buffer.com/app`,
            availablePlatforms: profiles.map((p: any) => p.service)
          });
        }

        // Step 2: Create post via Buffer
        const postData: any = {
          text: content,
          profile_ids: [profile.id]
        };

        if (mediaUrl) {
          postData.media = {
            photo: mediaUrl
          };
        }

        if (scheduleTime && scheduleTime !== 'now') {
          postData.scheduled_at = new Date(scheduleTime).getTime() / 1000;
        } else {
          postData.now = true; // Post immediately
        }

        const postResponse = await fetch('https://api.bufferapp.com/1/updates/create.json', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${bufferAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData)
        });

        const result = await postResponse.json();

        if (!postResponse.ok) {
          throw new Error(result.message || 'Buffer API Fehler');
        }

        console.log('✅ Buffer Post erstellt:', result);

        return reply.send({
          success: true,
          message: `Post erfolgreich auf ${platform} ${postData.now ? 'veröffentlicht' : 'geplant'}!`,
          data: {
            postId: result.id,
            platform: platform,
            status: postData.now ? 'published' : 'scheduled',
            url: result.url
          }
        });

      } catch (_error) {
        console.error('❌ Buffer API Error:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Post fehlgeschlagen'
        });
      }
    }
  );

  // Get Buffer profiles (connected accounts)
  fastify.get('/social/buffer/profiles', async (_request: FastifyRequest, reply: FastifyReply) => {
    const bufferAccessToken = getConfig().webhooks?.buffer || process.env.BUFFER_ACCESS_TOKEN;
    
    if (!bufferAccessToken) {
      return reply.send({
        success: false,
        error: 'Buffer nicht konfiguriert',
        setupUrl: 'https://buffer.com/developers/apps'
      });
    }

    try {
      const response = await fetch('https://api.bufferapp.com/1/profiles.json', {
        headers: {
          'Authorization': `Bearer ${bufferAccessToken}`
        }
      });

      const profiles = await response.json();

      const formatted = profiles.map((p: any) => ({
        id: p.id,
        service: p.service,
        username: p.formatted_username,
        followers: p.statistics?.followers || 0,
        connected: true
      }));

      return reply.send({
        success: true,
        profiles: formatted,
        total: formatted.length
      });

    } catch (_error) {
      console.error('❌ Buffer Profiles Error:', _error);
      return reply.status(500).send({
        success: false,
        error: _error instanceof Error ? _error.message : 'Konnte Profile nicht laden'
      });
    }
  });

  // Get Buffer stats
  fastify.get('/social/buffer/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
    const bufferAccessToken = getConfig().webhooks?.buffer || process.env.BUFFER_ACCESS_TOKEN;
    
    if (!bufferAccessToken) {
      return reply.send({
        success: false,
        error: 'Buffer nicht konfiguriert'
      });
    }

    try {
      // Get recent updates
      const response = await fetch('https://api.bufferapp.com/1/profiles.json', {
        headers: {
          'Authorization': `Bearer ${bufferAccessToken}`
        }
      });

      const profiles = await response.json();

      const stats = {
        totalProfiles: profiles.length,
        platforms: profiles.map((p: any) => p.service),
        totalFollowers: profiles.reduce((sum: number, p: any) => 
          sum + (p.statistics?.followers || 0), 0
        )
      };

      return reply.send({
        success: true,
        stats
      });

    } catch (_error) {
      return reply.status(500).send({
        success: false,
        error: 'Stats konnten nicht geladen werden'
      });
    }
  });
}
