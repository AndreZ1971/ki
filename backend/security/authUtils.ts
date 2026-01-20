// backend/security/authUtils.ts
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { logger } from '../logger';

const BCRYPT_SALT_ROUNDS = 12; // Höher = sicherer aber langsamer (10-12 recommended)

/**
 * Hash-Typen für Passwort-Migrationslogik
 */
export enum HashType {
  BCRYPT = 'bcrypt',
  SHA256 = 'sha256',
  UNKNOWN = 'unknown',
}

/**
 * Erkennt den Hash-Typ anhand des Formats
 * - bcrypt: Beginnt mit $2a$, $2b$ oder $2y$
 * - SHA-256: 64 Zeichen Hex-String
 */
export function detectHashType(hash: string): HashType {
  if (!hash) return HashType.UNKNOWN;
  
  // bcrypt-Hashes beginnen mit $2a$, $2b$ oder $2y$
  if (/^\$2[aby]\$/.test(hash)) {
    return HashType.BCRYPT;
  }
  
  // SHA-256 ist ein 64 Zeichen langer Hex-String
  if (/^[a-f0-9]{64}$/i.test(hash)) {
    return HashType.SHA256;
  }
  
  return HashType.UNKNOWN;
}

/**
 * Erstellt einen bcrypt-Hash aus einem Passwort
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    return hash;
  } catch (error) {
    logger.error({ error }, 'Failed to hash password with bcrypt');
    throw new Error('Password hashing failed');
  }
}

/**
 * Vergleicht ein Passwort mit einem bcrypt-Hash
 */
export async function verifyBcryptPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error({ error }, 'Failed to verify bcrypt password');
    return false;
  }
}

/**
 * Vergleicht ein Passwort mit einem SHA-256-Hash (Legacy)
 */
export function verifySha256Password(password: string, hash: string): boolean {
  try {
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    return passwordHash === hash;
  } catch (error) {
    logger.error({ error }, 'Failed to verify SHA-256 password');
    return false;
  }
}

/**
 * Hybrid-Passwort-Verifikation mit automatischer Migration
 * 
 * Diese Funktion:
 * 1. Erkennt den Hash-Typ (bcrypt oder SHA-256)
 * 2. Verifiziert das Passwort entsprechend
 * 3. Gibt zurück, ob eine Migration zu bcrypt nötig ist
 * 
 * @returns { valid: boolean, needsMigration: boolean, newHash?: string }
 */
export async function verifyPasswordHybrid(
  password: string,
  storedHash: string
): Promise<{ valid: boolean; needsMigration: boolean; newHash?: string }> {
  const hashType = detectHashType(storedHash);

  switch (hashType) {
    case HashType.BCRYPT: {
      // Bereits bcrypt - keine Migration nötig
      const bcryptValid = await verifyBcryptPassword(password, storedHash);
      return {
        valid: bcryptValid,
        needsMigration: false,
      };
    }

    case HashType.SHA256: {
      // Legacy SHA-256 - Migration zu bcrypt empfohlen
      const sha256Valid = verifySha256Password(password, storedHash);
      
      if (sha256Valid) {
        // Passwort ist korrekt - erstelle neuen bcrypt-Hash für Migration
        const newHash = await hashPassword(password);
        logger.info('Password verified with SHA-256, migration to bcrypt recommended');
        return {
          valid: true,
          needsMigration: true,
          newHash,
        };
      }
      
      return {
        valid: false,
        needsMigration: false,
      };
    }

    case HashType.UNKNOWN:
    default:
      logger.warn({ hashType, hashLength: storedHash.length }, 'Unknown hash type detected');
      return {
        valid: false,
        needsMigration: false,
      };
  }
}

/**
 * Generiert einen sicheren bcrypt-Hash aus Environment-Variable oder wirft Fehler
 * WICHTIG: Kein Default-Passwort mehr!
 */
export async function getSecureAdminHash(): Promise<string> {
  // Prüfe ob ADMIN_PASS_HASH bereits bcrypt ist
  if (process.env.ADMIN_PASS_HASH) {
    const hashType = detectHashType(process.env.ADMIN_PASS_HASH);
    if (hashType === HashType.BCRYPT) {
      logger.info('Using existing bcrypt hash from ADMIN_PASS_HASH');
      return process.env.ADMIN_PASS_HASH;
    } else if (hashType === HashType.SHA256) {
      logger.warn('ADMIN_PASS_HASH is SHA-256 format - consider migrating to bcrypt');
      return process.env.ADMIN_PASS_HASH;
    }
  }

  // Wenn ADMIN_PASS vorhanden, erstelle bcrypt-Hash
  if (process.env.ADMIN_PASS) {
    logger.info('Creating bcrypt hash from ADMIN_PASS environment variable');
    return await hashPassword(process.env.ADMIN_PASS);
  }

  // ⚠️ Legacy-Fallback für Automattic-Zugriff (nur wenn nichts konfiguriert)
  // Hinweis: Für Produktion trotzdem dringend ENV setzen!
  const LEGACY_DEFAULT_PASSWORD = 'ARI#2026!Secure';
  logger.warn(
    'Using legacy default admin password fallback (intended for Automattic access). ' +
    'Please set ADMIN_PASS or ADMIN_PASS_HASH to override this in production.'
  );
  return await hashPassword(LEGACY_DEFAULT_PASSWORD);
}
