// backend/middleware/authMiddleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { logger } from '../logger';

const JWT_SECRET = process.env.JWT_SECRET || 'ari-secret-key-change-in-production';

interface JWTPayload {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      request.user = decoded;
    } catch (err) {
      logger.warn({ error: err }, 'Invalid JWT token');
      reply.code(401).send({ error: 'Invalid token' });
      return;
    }
  } catch (error) {
    logger.error({ error }, 'Auth middleware error');
    reply.code(500).send({ error: 'Authentication failed' });
  }
}

export function generateToken(user: JWTPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}
