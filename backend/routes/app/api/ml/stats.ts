import { FastifyPluginAsync } from 'fastify';
import { getMlStats } from '../../../../services/mlStats.js';

const mlStatsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/stats', async (_request, reply) => {
    try {
      const stats = getMlStats();
      return { success: true, data: stats };
    } catch (error) {
      fastify.log.error({ err: error }, 'Failed to get ML stats');
      return reply.status(500).send({ success: false, error: 'Failed to get ML stats' });
    }
  });
};

export default mlStatsRoutes;
