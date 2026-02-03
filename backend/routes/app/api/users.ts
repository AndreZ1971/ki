import { FastifyInstance } from 'fastify';
import { logger } from '../../../logger';

// Neue Single-Passwort Authentifizierung (nicht mehr multi-user)
// Dieses File wird noch nicht benötigt mit dem neuen Session-basierten System
// TODO: Falls Benutzer-Management wieder nötig wird, anpassen

export default async function userRoutes(_server: FastifyInstance) {
  // Placeholder - Legacy-Routes werden nicht mehr verwendet
  logger.info('User management routes disabled with new session-based auth system');
}
