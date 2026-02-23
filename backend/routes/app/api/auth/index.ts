// backend/routes/app/api/auth/index.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../../../logger';
import { hashPassword, verifyPassword, validatePassword } from '../../../../security/authUtils';
import fs from 'fs';
import path from 'path';

interface SetPasswordRequest {
  password: string;
  passwordConfirm: string;
}

interface LoginRequest {
  password: string;
}

/**
 * Helper: Lese/Schreibe connection.json synchron
 */
function readConnectionJson(): any {
  try {
    const configPath = path.resolve(process.cwd(), 'connection.json');
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.error({ error }, 'Failed to read connection.json');
    return {};
  }
}

function writeConnectionJson(data: any): boolean {
  try {
    const configPath = path.resolve(process.cwd(), 'connection.json');
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf-8');
    // 🔒 Setze Dateiberechtigungen auf 0600 (nur owner read/write)
    fs.chmodSync(configPath, 0o600);
    logger.info('connection.json updated with new auth data');
    return true;
  } catch (error) {
    logger.error({ error }, 'Failed to write connection.json');
    return false;
  }
}

/**
 * Auth Middleware für geschützte Routes
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // @fastify/session mit @fastify/cookie speichert Daten in request.session
  const authData = (request.session as any)?.auth;
  
  if (!authData?.authenticated) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }
}

export default async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/check
   * Prüfe ob initiales Passwort gesetzt wurde
   * Keine Authentifizierung nötig!
   */
  fastify.post('/check', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = readConnectionJson();
      const passwordHash = config?.auth?.passwordHash || '';
      const isFirstLogin = !passwordHash;

      if (isFirstLogin) {
        return reply.send({
          status: 'first_login_required',
          message: 'Please set your password first',
        });
      }

      return reply.send({
        status: 'ready_for_login',
        message: 'Password is set, login is required',
      });
    } catch (error) {
      logger.error({ error }, 'Check auth status error');
      return reply.code(500).send({ error: 'Failed to check auth status' });
    }
  });

  /**
   * POST /api/auth/setup
   * Setze initiales Passwort beim ersten Login
   * Keine Authentifizierung nötig! (nur beim ersten Setup)
   */
  fastify.post<{ Body: SetPasswordRequest }>(
    '/setup',
    async (request: FastifyRequest<{ Body: SetPasswordRequest }>, reply: FastifyReply) => {
      try {
        const { password, passwordConfirm } = request.body || {};

        // Validierung
        if (!password || !passwordConfirm) {
          return reply.code(400).send({
            error: 'Password and confirmation required',
          });
        }

        if (password !== passwordConfirm) {
          return reply.code(400).send({
            error: 'Passwords do not match',
          });
        }

        // Prüfe ob Passwort bereits existiert (verhindere mehrfaches Setup)
        const config = readConnectionJson();
        if (config?.auth?.passwordHash && config.auth.isFirstLoginComplete) {
          return reply.code(403).send({
            error: 'Password already set. Use login endpoint instead.',
          });
        }

        // Validiere Passwort-Anforderungen
        const validation = validatePassword(password);
        if (!validation.valid) {
          return reply.code(400).send({
            error: 'Password does not meet requirements',
            details: validation.errors,
          });
        }

        // Hash das Passwort
        const passwordHash = await hashPassword(password);

        // Speichere in connection.json
        config.auth = {
          passwordHash,
          isFirstLoginComplete: true,
          lastPasswordSetAt: new Date().toISOString(),
          passwordExpiry: null,
        };

        if (!writeConnectionJson(config)) {
          return reply.code(500).send({
            error: 'Failed to save password',
          });
        }

        // Erstelle Session
        (request.session as any).auth = {
          authenticated: true,
          setupCompletedAt: new Date().toISOString(),
        };

        logger.info('Initial password set successfully');

        return reply.send({
          status: 'setup_complete',
          message: 'Password set successfully. Session created.',
        });
      } catch (error) {
        logger.error({ error }, 'Setup password error');
        return reply.code(500).send({ error: 'Failed to set password' });
      }
    }
  );

  /**
   * POST /api/auth/login
   * Login mit Passwort (nach erstem Setup)
   */
  fastify.post<{ Body: LoginRequest }>(
    '/login',
    async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
      try {
        const { password } = request.body || {};

        if (!password) {
          return reply.code(400).send({
            error: 'Password required',
          });
        }

        const config = readConnectionJson();
        const storedHash = config?.auth?.passwordHash;

        // Prüfe ob Passwort gesetzt wurde
        if (!storedHash) {
          return reply.code(403).send({
            status: 'first_login_required',
            error: 'Please set your password first using /setup',
          });
        }

        // Verifiziere Passwort
        const isValid = await verifyPassword(password, storedHash);
        if (!isValid) {
          logger.warn('Failed login attempt - invalid password');
          return reply.code(401).send({
            error: 'Invalid password',
          });
        }

        // Erstelle Session
        (request.session as any).auth = {
          authenticated: true,
          loginTime: new Date().toISOString(),
        };

        logger.info('User logged in successfully');

        return reply.send({
          status: 'authenticated',
          message: 'Login successful',
        });
      } catch (error) {
        logger.error({ error }, 'Login error');
        return reply.code(500).send({ error: 'Login failed' });
      }
    }
  );

  /**
   * POST /api/auth/logout
   * Logout: Zerstöre Session
   * Session wird auch automatisch zerstört wenn Browser geschlossen wird
   */
  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @fastify/secure-session: Session automatisch auf null setzen
      (request.session as any).auth = null;
      
      logger.info('User logged out, session cleared');
      return reply.send({
        status: 'logged_out',
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error({ error }, 'Logout error');
      return reply.code(500).send({ error: 'Logout failed' });
    }
  });

  /**
   * GET /api/auth/session
   * Prüfe aktuelle Session
   * NICHT geschützt - kann ohne aktive Session abgerufen werden
   */
  fastify.get('/session', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const sessionData = (request.session as any).auth;

      return reply.send({
        authenticated: !!sessionData?.authenticated,
        session: sessionData || null,
      });
    } catch (error) {
      logger.error({ error }, 'Session check error');
      return reply.code(500).send({ error: 'Failed to check session' });
    }
  });

  /**
   * POST /api/auth/change-password
   * Ändere das Passwort (erfordert aktive Session)
   */
  fastify.post<{ Body: { currentPassword: string; newPassword: string; newPasswordConfirm: string } }>(
    '/change-password',
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{
        Body: { currentPassword: string; newPassword: string; newPasswordConfirm: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { currentPassword, newPassword, newPasswordConfirm } = request.body || {};

        // Validierung
        if (!currentPassword || !newPassword || !newPasswordConfirm) {
          return reply.code(400).send({
            error: 'All fields required',
          });
        }

        if (newPassword !== newPasswordConfirm) {
          return reply.code(400).send({
            error: 'New passwords do not match',
          });
        }

        // Verifiziere altes Passwort
        const config = readConnectionJson();
        const storedHash = config?.auth?.passwordHash;

        const isValid = await verifyPassword(currentPassword, storedHash);
        if (!isValid) {
          return reply.code(401).send({
            error: 'Current password is incorrect',
          });
        }

        // Validiere neues Passwort
        const validation = validatePassword(newPassword);
        if (!validation.valid) {
          return reply.code(400).send({
            error: 'New password does not meet requirements',
            details: validation.errors,
          });
        }

        // Hash neues Passwort
        const newHash = await hashPassword(newPassword);

        // Speichere in connection.json
        config.auth.passwordHash = newHash;
        config.auth.lastPasswordSetAt = new Date().toISOString();

        if (!writeConnectionJson(config)) {
          return reply.code(500).send({
            error: 'Failed to save new password',
          });
        }

        logger.info('Password changed successfully');

        return reply.send({
          status: 'password_changed',
          message: 'Password changed successfully',
        });
      } catch (error) {
        logger.error({ error }, 'Change password error');
        return reply.code(500).send({ error: 'Failed to change password' });
      }
    }
  );
}
