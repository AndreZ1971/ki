// backend/routes/app/api/health.ts
import { FastifyPluginAsync } from 'fastify';
import { logger } from '../../../logger.js';
import fs from 'fs/promises';
import path from 'path';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/health - System health check
  fastify.get('/health', async (_request, _reply) => {
    try {
      const health: any = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
        services: {
          configFile: false,
          backupDir: false,
        },
      };

      // Check if connection.json exists
      const jsonPath = path.resolve(process.cwd(), 'connection.json');
      try {
        await fs.access(jsonPath);
        health.services.configFile = true;
      } catch {
        health.services.configFile = false;
        health.status = 'warning';
      }

      // Check if backup directory exists
      const backupDir = path.resolve(process.cwd(), 'data', 'backups');
      try {
        await fs.access(backupDir);
        health.services.backupDir = true;
      } catch {
        health.services.backupDir = false;
      }

      return health;
    } catch (error) {
      logger.error(`Health check error: ${error}`);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: String(error),
      };
    }
  });
};

export default healthRoutes;
