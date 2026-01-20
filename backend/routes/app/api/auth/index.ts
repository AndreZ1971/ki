// backend/routes/app/api/auth/index.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { generateToken, authMiddleware } from '../../../../middleware/authMiddleware';
import { logger } from '../../../../logger';
import { verifyPasswordHybrid, getSecureAdminHash } from '../../../../security/authUtils';

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

// Initialize admin user from ENV
// ⚠️ SECURITY: No default password! Set ADMIN_PASS or ADMIN_PASS_HASH
// Configure via .env or environment variables:
// - ADMIN_USER (default: 'admin')
// - ADMIN_PASS (plaintext - will be hashed with bcrypt)
// - ADMIN_PASS_HASH (bcrypt hash - recommended for production)
// Generate hash: npm run generate-admin-hash
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
let ADMIN_PASS_HASH: string;

// Initialize admin user asynchronously
(async () => {
  try {
    ADMIN_PASS_HASH = await getSecureAdminHash();
    users.set(ADMIN_USER, {
      id: '1',
      username: ADMIN_USER,
      email: process.env.ADMIN_EMAIL || 'admin@ari.local',
      role: 'admin',
      passwordHash: ADMIN_PASS_HASH,
    });
    logger.info({ username: ADMIN_USER }, 'Admin user initialized successfully');
  } catch (error) {
    logger.error({ error }, 'CRITICAL: Failed to initialize admin user');
    logger.error('Set ADMIN_PASS or ADMIN_PASS_HASH environment variable');
    logger.error('Run: npm run generate-admin-hash');
    // In production, this should halt the application
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
})();

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

        // Hybrid password verification with automatic migration
        const { valid, needsMigration, newHash } = await verifyPasswordHybrid(
          password,
          user.passwordHash
        );

        if (!valid) {
          logger.warn({ username }, 'Failed login attempt - invalid password');
          return reply.code(401).send({ error: 'Invalid credentials' });
        }

        // Auto-migrate SHA-256 to bcrypt on successful login
        if (needsMigration && newHash) {
          logger.info({ username }, 'Migrating password from SHA-256 to bcrypt');
          user.passwordHash = newHash;
          users.set(username, user);
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
