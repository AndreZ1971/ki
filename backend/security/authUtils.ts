// backend/security/authUtils.ts
import bcrypt from 'bcrypt';
import { logger } from '../logger';

const BCRYPT_SALT_ROUNDS = 12; // Standard für Production

/**
 * Erstellt einen bcrypt-Hash aus einem Passwort
 * Verwendung: Neue Passwörter beim Setup oder Passwort-Änderung
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || password.length < 8 || password.length > 16) {
      throw new Error('Password must be between 8 and 16 characters');
    }
    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    return hash;
  } catch (error) {
    logger.error({ error }, 'Failed to hash password');
    throw new Error('Password hashing failed');
  }
}

/**
 * Vergleicht ein Passwort mit einem bcrypt-Hash
 * Verwendung: Login-Verifizierung
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    if (!hash) {
      // Kein Hash = First-Login (Passwort nicht gesetzt)
      return false;
    }
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error({ error }, 'Failed to verify password');
    return false;
  }
}

/**
 * Validiert die Passwort-Anforderungen
 * - Zwischen 8 und 16 Zeichen
 * - Sollte Großbuchstaben, Kleinbuchstaben, Zahlen, Sonderzeichen enthalten
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8 || password.length > 16) {
      errors.push('Password must be between 8 and 16 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain numbers');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain special characters');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
