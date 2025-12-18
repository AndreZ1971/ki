/**
 * Spezialisierungs-Auto-Load System
 * Lädt die gespeicherte Spezialisierung beim Agent-Startup
 * Mit Fehlertoleranz und Fallback-Mechanismen
 */

import { SpecializationPersistenceManager } from '../services/specializationPersistenceManager';
import { SpecializationContext } from '../types/specialization';
import { logger } from '../logger';

let _activeSpecialization: SpecializationContext | null = null;
let _loadingState: 'not-started' | 'loading' | 'loaded' | 'failed' =
  'not-started';

/**
 * Initialisiert das Auto-Load System
 * Wird beim Agent-Startup aufgerufen
 */
export async function initializeSpecializationAutoLoad(
  userId: string = 'default'
): Promise<SpecializationContext | null> {
  if (_loadingState === 'loading') {
    logger.warn('⏳ Specialization loading already in progress');
    return null;
  }

  if (_loadingState === 'loaded' && _activeSpecialization) {
    logger.debug('✓ Specialization already loaded');
    return _activeSpecialization;
  }

  _loadingState = 'loading';
  const startTime = Date.now();

  try {
    logger.info('🚀 Starting Specialization Auto-Load...');

    // Ensure persistence system is initialized
    await SpecializationPersistenceManager.initialize();

    // Load active specialization with fallback
    const result =
      await SpecializationPersistenceManager.getActiveSpecialization(userId);

    if (result.specialization) {
      _activeSpecialization = result.specialization;
      const duration = Date.now() - startTime;

      logger.info(
        {
          specializationId: result.specialization.id,
          name: result.specialization.name,
          source: result.source,
          durationMs: duration,
        },
        `✅ Specialization loaded (${result.source}): ${result.specialization.name}`
      );

      _loadingState = 'loaded';
      return _activeSpecialization;
    } else {
      logger.warn(
        '⚠️ No specialization found - Agent will run without specialization'
      );
      _loadingState = 'loaded';
      return null;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(
      { err: error },
      `❌ Error loading specialization: ${errorMsg}`
    );
    _loadingState = 'failed';
    return null;
  }
}

/**
 * Aktiviert eine neue Spezialisierung
 * Wird nach erfolgreichem Upload aufgerufen
 */
export async function activateSpecialization(
  specializationId: string,
  userId: string = 'default'
): Promise<boolean> {
  try {
    logger.info(
      `🔄 Activating specialization: ${specializationId} (User: ${userId})`
    );

    // Set as active in persistence
    const success =
      await SpecializationPersistenceManager.setActiveSpecialization(
        specializationId,
        userId
      );

    if (!success) {
      logger.error('❌ Failed to set active specialization');
      return false;
    }

    // Load and cache it
    const specialization =
      await SpecializationPersistenceManager.loadSpecialization(
        specializationId,
        userId
      );

    if (!specialization) {
      logger.error(
        `❌ Could not load specialization after activation: ${specializationId}`
      );
      return false;
    }

    // Update in-memory cache
    _activeSpecialization = specialization;
    _loadingState = 'loaded';

    logger.info(
      `✅ Specialization activated and cached: ${specialization.name}`
    );

    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(
      { err: error },
      `❌ Error activating specialization: ${errorMsg}`
    );
    return false;
  }
}

/**
 * Gibt die aktuell aktive Spezialisierung zurück
 */
export function getActiveSpecialization(): SpecializationContext | null {
  return _activeSpecialization;
}

/**
 * Gibt den aktuellen Lade-Status zurück
 */
export function getLoadingState(): string {
  return _loadingState;
}

/**
 * Reloads specialization from disk
 * Useful for manual refresh or error recovery
 */
export async function reloadSpecialization(
  userId: string = 'default'
): Promise<SpecializationContext | null> {
  _loadingState = 'not-started';
  _activeSpecialization = null;

  logger.info('🔄 Reloading specialization from disk');

  return initializeSpecializationAutoLoad(userId);
}

/**
 * Validiert die Integrität aller persistierten Spezialisierungen
 */
export async function validateAllSpecializations(
  userId: string = 'default'
): Promise<{
  valid: number;
  corrupted: number;
  missing: number;
}> {
  try {
    logger.info('🔍 Validating specialization integrity');

    const result =
      await SpecializationPersistenceManager.validateIntegrity(userId);

    logger.info(
      {
        valid: result.valid,
        corrupted: result.corrupted,
        missing: result.missing,
      },
      `📊 Validation complete`
    );

    // If active spec is corrupted, trigger reload
    if (
      result.corrupted > 0 &&
      _activeSpecialization &&
      result.details.some(
        (d) => d.id === _activeSpecialization!.id && d.status === 'corrupted'
      )
    ) {
      logger.warn('⚠️ Active specialization is corrupted - reloading');
      await reloadSpecialization(userId);
    }

    return {
      valid: result.valid,
      corrupted: result.corrupted,
      missing: result.missing,
    };
  } catch (error) {
    logger.error({ err: error }, '❌ Error validating specializations');
    return { valid: 0, corrupted: 0, missing: 0 };
  }
}

/**
 * Lists all available specializations
 */
export async function listAvailableSpecializations(
  userId: string = 'default'
): Promise<Array<{ id: string; name: string; checksum: string }>> {
  try {
    const specs =
      await SpecializationPersistenceManager.listSpecializations(userId);
    return specs.map((s) => ({
      id: s.id,
      name: s.name,
      checksum: s.checksum,
    }));
  } catch (error) {
    logger.error({ err: error }, '❌ Error listing specializations');
    return [];
  }
}
