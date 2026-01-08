// backend/routes/app/api/auth/index.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { generateToken, authMiddleware } from '../../../../middleware/authMiddleware';
import { logger } from '../../../../logger';
import crypto from 'crypto';

interface LoginRequest {
  username: string;
  password: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  passwordHash: string;
}

// In-memory user store (TODO: Replace with database in production)
const users: Map<string, User> = new Map();

// Initialize default admin user
// WICHTIG: Passwort nach erstem Login ändern!
const defaultPasswordHash = crypto
  .createHash('sha256')
  .update('ARI#2026!Secure')
  .digest('hex');

users.set('admin', {
  id: '1',
  username: 'admin',
  email: 'admin@ari.local',
  role: 'admin',
  passwordHash: defaultPasswordHash,
});

export default async function authRoutes(fastify: FastifyInstance) {
  // Login endpoint
  fastify.post<{ Body: LoginRequest }>(
    '/login',
    async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
      try {
        const { username, password } = request.body;

        if (!username || !password) {
          return reply.code(400).send({ error: 'Username and password required' });
        }

        const user = users.get(username);
        if (!user) {
          logger.warn({ username }, 'Login attempt for non-existent user');
          return reply.code(401).send({ error: 'Invalid credentials' });
        }

        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        if (passwordHash !== user.passwordHash) {
          logger.warn({ username }, 'Failed login attempt');
          return reply.code(401).send({ error: 'Invalid credentials' });
        }

        const userPayload = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        };

        const token = generateToken(userPayload);

        logger.info({ username }, 'User logged in successfully');

        return reply.send({
          token,
          user: userPayload,
        });
      } catch (error) {
        logger.error({ error }, 'Login error');
        return reply.code(500).send({ error: 'Login failed' });
      }
    }
  );

  // Get current user endpoint
  fastify.get('/me', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // authMiddleware should have already populated request.user
      if (!request.user) {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      return reply.send({ user: request.user });
    } catch (error) {
      logger.error({ error }, 'Get user error');
      return reply.code(500).send({ error: 'Failed to get user' });
    }
  });

  // Logout endpoint (client-side only for JWT)
  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    // With JWT, logout is handled client-side by removing the token
    // This endpoint is here for consistency but doesn't do much with JWT
    logger.info({ userId: request.user?.id }, 'User logged out');
    return reply.send({ message: 'Logged out successfully' });
  });
}
