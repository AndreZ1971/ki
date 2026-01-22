// backend/routes/app/api/connection/status.ts
import { FastifyPluginAsync } from 'fastify';
import { logger } from '../../../../logger.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Endpoint to get social media connection status
 * Returns the socialMedia object from connection.json with enabled flags
 */
const statusRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/connection/status', async (_request, reply) => {
    try {
      // Try multiple sensible paths, mirroring config.ts behaviour
      const candidates = [
        path.resolve(__dirname, '../../../../connection.json'), // dist -> ../../../../connection.json => backend/connection.json
        path.resolve(process.cwd(), 'connection.json'),
        path.resolve(process.cwd(), 'backend', 'connection.json'),
      ];

      let connectionRaw = '';
      for (const candidate of candidates) {
        try {
          connectionRaw = await fs.readFile(candidate, 'utf-8');
          logger.info({ candidate }, 'Loaded connection.json for status endpoint');
          break;
        } catch (_err) {
          // try next
        }
      }

      if (!connectionRaw) {
        throw new Error('connection.json not found in expected locations');
      }

      const connection = JSON.parse(connectionRaw);

      // Return the socialMedia object directly with enabled flags
      return reply.send({
        success: true,
        socialMedia: connection.socialMedia || {
          linkedin: { enabled: false },
          facebook: { enabled: false },
          instagram: { enabled: false },
          twitter: { enabled: false },
          tiktok: { enabled: false },
          youtube: { enabled: false }
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to read connection status');
      return reply.status(500).send({
        success: false,
        error: 'Failed to read connection status'
      });
    }
  });
};

export default statusRoute;
