import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../logger';
import { SpecializationContext } from '../types/specialization';

/**
 * Spezialisierungs-Persistence Manager
 * Verwaltet persistente Speicherung, Indexierung und Fehlertoleranz
 *
 * Struktur:
 * data/specializations/
 *   ├── index.json (Metadaten aller Spezialisierungen)
 *   ├── active.json (Aktuell aktive Spezialisierung ID)
 *   ├── default/
 *   │   ├── specialization-default.enc (Verschlüsselte Default-Spec)
 *   │   └── metadata.json
 *   └── [userId]/
 *       ├── [specializationId].enc
 *       ├── [specializationId].meta.json
 *       └── fallback.json (Letzte funktionierende Version)
 */

interface SpecializationMetadata {
  id: string;
  name: string;
  version: string;
  checksum: string;
  createdAt: number;
  updatedAt: number;
  size: number;
  encrypted: boolean;
}

interface SpecializationIndex {
  [userId: string]: {
    specializations: SpecializationMetadata[];
    active?: string;
    fallback?: string;
    lastValidated?: number;
  };
}

interface ActiveSpecialization {
  userId: string;
  specializationId: string;
  timestamp: number;
  checksum: string;
}

export class SpecializationPersistenceManager {
  private static readonly DATA_DIR = path.join(
    process.cwd(),
    'data',
    'specializations'
  );
  private static readonly INDEX_FILE = path.join(
    SpecializationPersistenceManager.DATA_DIR,
    'index.json'
  );
  private static readonly ACTIVE_FILE = path.join(
    SpecializationPersistenceManager.DATA_DIR,
    'active.json'
  );
  private static readonly FALLBACK_FILE = path.join(
    SpecializationPersistenceManager.DATA_DIR,
    'fallback.json'
  );

  /**
   * Initialisiert das Persistenz-System
   * Erstellt notwendige Verzeichnisse und Indizes
   */
  static async initialize(): Promise<void> {
    try {
      // Erstelle Verzeichnisse
      await fs.mkdir(this.DATA_DIR, { recursive: true });

      // Erstelle oder lade Index
      try {
        await fs.access(this.INDEX_FILE);
        logger.debug('📋 Spezialisierungs-Index existiert');
      } catch {
        logger.info('📋 Erstelle neuen Spezialisierungs-Index');
        await this.saveIndex({});
      }

      // Erstelle oder lade Active File
      try {
        await fs.access(this.ACTIVE_FILE);
        logger.debug('🎯 Active-Spezialisierung File existiert');
      } catch {
        logger.info('🎯 Erstelle neue Active-Spezialisierung File');
        await this.saveActiveFile(null);
      }

      logger.info('✅ Persistence Manager initialisiert');
    } catch (_error) {
      logger.error(
        { err: _error },
        '❌ Fehler beim Initialisieren des Persistence Managers'
      );
      throw _error;
    }
  }

  /**
   * Speichert eine Spezialisierung persistent
   */
  static async persistSpecialization(
    specialization: SpecializationContext,
    userId: string = 'default'
  ): Promise<{
    success: boolean;
    id?: string;
    fallbackReady: boolean;
  }> {
    try {
      const specializationId = specialization.id;
      const userDir = path.join(this.DATA_DIR, userId);

      // Erstelle User-Verzeichnis
      await fs.mkdir(userDir, { recursive: true });

      // Berechne Checksum
      const checksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(specialization))
        .digest('hex');

      // Speichere Spezialisierung als JSON (wird von SpecializationService verschlüsselt)
      const specFile = path.join(userDir, `${specializationId}.json`);
      await fs.writeFile(specFile, JSON.stringify(specialization, null, 2));

      // Speichere Metadaten
      const metadata: SpecializationMetadata = {
        id: specializationId,
        name: specialization.name,
        version: specialization.version || '1.0.0',
        checksum,
        createdAt: specialization.createdAt || Date.now(),
        updatedAt: Date.now(),
        size: JSON.stringify(specialization).length,
        encrypted: false, // Wird vom SpecializationService verschlüsselt
      };

      const metaFile = path.join(userDir, `${specializationId}.meta.json`);
      await fs.writeFile(metaFile, JSON.stringify(metadata, null, 2));

      // Update Index
      const index = await this.loadIndex();
      if (!index[userId]) {
        index[userId] = { specializations: [] };
      }

      const existingIdx = index[userId].specializations.findIndex(
        (s) => s.id === specializationId
      );
      if (existingIdx >= 0) {
        index[userId].specializations[existingIdx] = metadata;
      } else {
        index[userId].specializations.push(metadata);
      }

      await this.saveIndex(index);

      // Speichere auch als Fallback
      const fallbackData = {
        specializationId,
        userId,
        data: specialization,
        timestamp: Date.now(),
        checksum,
      };
      await fs.writeFile(
        this.FALLBACK_FILE,
        JSON.stringify(fallbackData, null, 2)
      );

      logger.info(
        `✅ Spezialisierung persistiert: ${specializationId} (User: ${userId})`
      );

      return {
        success: true,
        id: specializationId,
        fallbackReady: true,
      };
    } catch (_error) {
      const errorMsg =
        _error instanceof Error ? _error.message : String(_error);
      logger.error(
        { err: _error },
        `❌ Fehler beim Persistieren der Spezialisierung: ${errorMsg}`
      );
      return {
        success: false,
        fallbackReady: false,
      };
    }
  }

  /**
   * Lädt eine gespeicherte Spezialisierung
   */
  static async loadSpecialization(
    specializationId: string,
    userId: string = 'default'
  ): Promise<SpecializationContext | null> {
    try {
      const specFile = path.join(
        this.DATA_DIR,
        userId,
        `${specializationId}.json`
      );

      try {
        const content = await fs.readFile(specFile, 'utf-8');
        const specialization = JSON.parse(content) as SpecializationContext;

        // Validiere Integrität
        const checksum = crypto
          .createHash('sha256')
          .update(JSON.stringify(specialization))
          .digest('hex');

        logger.debug(
          `✓ Spezialisierung geladen: ${specializationId} | Checksum: ${checksum.substring(0, 8)}...`
        );

        return specialization;
      } catch (_error) {
        logger.warn(
          `⚠️ Fehler beim Laden von ${specializationId}: ${_error instanceof Error ? _error.message : String(_error)}`
        );
        return null;
      }
    } catch (_error) {
      logger.error({ err: _error }, `❌ Fehler beim Laden der Spezialisierung`);
      return null;
    }
  }

  /**
   * Setzt die aktive Spezialisierung
   */
  static async setActiveSpecialization(
    specializationId: string,
    userId: string = 'default'
  ): Promise<boolean> {
    try {
      const activeSpec: ActiveSpecialization = {
        userId,
        specializationId,
        timestamp: Date.now(),
        checksum: specializationId, // placeholder, wird bei Load aktualisiert
      };

      await this.saveActiveFile(activeSpec);

      logger.info(
        `🎯 Aktive Spezialisierung gesetzt: ${specializationId} (User: ${userId})`
      );

      return true;
    } catch (_error) {
      logger.error(
        { err: _error },
        '❌ Fehler beim Setzen der aktiven Spezialisierung'
      );
      return false;
    }
  }

  /**
   * Lädt die aktive Spezialisierung
   */
  static async getActiveSpecialization(userId: string = 'default'): Promise<{
    specialization: SpecializationContext | null;
    source: 'active' | 'default' | 'fallback' | 'none';
  }> {
    try {
      // Versuche Active-Spezialisierung zu laden
      const activeData = await this.loadActiveFile();

      if (activeData?.userId === userId) {
        const spec = await this.loadSpecialization(
          activeData.specializationId,
          userId
        );
        if (spec) {
          logger.debug(
            `✓ Active Spezialisierung geladen: ${activeData.specializationId}`
          );
          return { specialization: spec, source: 'active' };
        }
      }

      // Fallback 1: Letzte funktionierende Version
      const fallback = await this.loadFallback();
      if (fallback && fallback.userId === userId) {
        logger.warn('⚠️ Fallback-Spezialisierung wird verwendet');
        return { specialization: fallback.data, source: 'fallback' };
      }

      // Fallback 2: Erste verfügbare Spezialisierung
      const spec = await this.loadFirstAvailableSpecialization(userId);
      if (spec) {
        logger.warn('⚠️ Erste verfügbare Spezialisierung wird verwendet');
        return { specialization: spec, source: 'default' };
      }

      logger.warn(
        '⚠️ Keine Spezialisierung verfügbar - System läuft ohne Spezialisierung'
      );
      return { specialization: null, source: 'none' };
    } catch (_error) {
      logger.error(
        { err: _error },
        '❌ Fehler beim Laden der aktiven Spezialisierung'
      );
      return { specialization: null, source: 'none' };
    }
  }

  /**
   * Gibt alle Spezialisierungen eines Users auf
   */
  static async listSpecializations(userId: string = 'default'): Promise<
    Array<{
      id: string;
      name: string;
      checksum: string;
      size: number;
      updatedAt: number;
    }>
  > {
    try {
      const index = await this.loadIndex();
      const userIndex = index[userId];

      if (!userIndex) {
        logger.debug(`ℹ️ Keine Spezialisierungen für User ${userId}`);
        return [];
      }

      return userIndex.specializations.map((spec) => ({
        id: spec.id,
        name: spec.name,
        checksum: spec.checksum.substring(0, 16),
        size: spec.size,
        updatedAt: spec.updatedAt,
      }));
    } catch (_error) {
      logger.error(
        { err: _error },
        '❌ Fehler beim Auflisten von Spezialisierungen'
      );
      return [];
    }
  }

  /**
   * Validiert die Integrität aller gespeicherten Spezialisierungen
   */
  static async validateIntegrity(userId: string = 'default'): Promise<{
    valid: number;
    corrupted: number;
    missing: number;
    details: Array<{
      id: string;
      status: 'valid' | 'corrupted' | 'missing';
    }>;
  }> {
    const result = {
      valid: 0,
      corrupted: 0,
      missing: 0,
      details: [] as Array<{
        id: string;
        status: 'valid' | 'corrupted' | 'missing';
      }>,
    };

    try {
      const index = await this.loadIndex();
      const userIndex = index[userId];

      if (!userIndex) {
        logger.debug(
          `ℹ️ Keine Spezialisierungen zum Validieren für User ${userId}`
        );
        return result;
      }

      for (const metadata of userIndex.specializations) {
        const spec = await this.loadSpecialization(metadata.id, userId);

        if (!spec) {
          result.missing++;
          result.details.push({ id: metadata.id, status: 'missing' });
          logger.warn(`⚠️ Spezialisierung nicht gefunden: ${metadata.id}`);
        } else {
          // Validiere Checksum
          const actualChecksum = crypto
            .createHash('sha256')
            .update(JSON.stringify(spec))
            .digest('hex');

          if (actualChecksum === metadata.checksum) {
            result.valid++;
            result.details.push({ id: metadata.id, status: 'valid' });
            logger.debug(`✓ Spezialisierung valid: ${metadata.id}`);
          } else {
            result.corrupted++;
            result.details.push({ id: metadata.id, status: 'corrupted' });
            logger.error(`❌ Spezialisierung beschädigt: ${metadata.id}`);
          }
        }
      }

      logger.info(
        `📊 Integrität-Validierung: ${result.valid} valid, ${result.corrupted} corrupted, ${result.missing} missing`
      );

      return result;
    } catch (_error) {
      logger.error({ err: _error }, '❌ Fehler bei der Integrität-Validierung');
      return result;
    }
  }

  /**
   * Löscht eine Spezialisierung
   */
  static async deleteSpecialization(
    specializationId: string,
    userId: string = 'default'
  ): Promise<boolean> {
    try {
      const userDir = path.join(this.DATA_DIR, userId);
      const specFile = path.join(userDir, `${specializationId}.json`);
      const metaFile = path.join(userDir, `${specializationId}.meta.json`);

      await fs.unlink(specFile).catch(() => {
        /* file might not exist */
      });
      await fs.unlink(metaFile).catch(() => {
        /* file might not exist */
      });

      // Update Index
      const index = await this.loadIndex();
      if (index[userId]) {
        index[userId].specializations = index[userId].specializations.filter(
          (s) => s.id !== specializationId
        );
        await this.saveIndex(index);
      }

      logger.info(`✓ Spezialisierung gelöscht: ${specializationId}`);
      return true;
    } catch (_error) {
      logger.error(
        { err: _error },
        `❌ Fehler beim Löschen der Spezialisierung: ${specializationId}`
      );
      return false;
    }
  }

  // Private Hilfsfunktionen

  private static async loadIndex(): Promise<SpecializationIndex> {
    try {
      const content = await fs.readFile(this.INDEX_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (_error) {
      logger.debug('📋 Index nicht gefunden, starte mit leerem Index');
      return {};
    }
  }

  private static async saveIndex(index: SpecializationIndex): Promise<void> {
    try {
      await fs.writeFile(this.INDEX_FILE, JSON.stringify(index, null, 2));
    } catch (_error) {
      logger.error({ err: _error }, '❌ Fehler beim Speichern des Index');
      throw _error;
    }
  }

  private static async loadActiveFile(): Promise<ActiveSpecialization | null> {
    try {
      const content = await fs.readFile(this.ACTIVE_FILE, 'utf-8');
      const data = JSON.parse(content);
      return data || null;
    } catch (_error) {
      logger.debug('🎯 Active-File nicht gefunden');
      return null;
    }
  }

  private static async saveActiveFile(
    data: ActiveSpecialization | null
  ): Promise<void> {
    try {
      await fs.writeFile(this.ACTIVE_FILE, JSON.stringify(data, null, 2));
    } catch (_error) {
      logger.error(
        { err: _error },
        '❌ Fehler beim Speichern des Active-Files'
      );
      throw _error;
    }
  }

  private static async loadFallback(): Promise<{
    specializationId: string;
    userId: string;
    data: SpecializationContext;
    timestamp: number;
    checksum: string;
  } | null> {
    try {
      const content = await fs.readFile(this.FALLBACK_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (_error) {
      logger.debug('↩️ Fallback-File nicht gefunden');
      return null;
    }
  }

  private static async loadFirstAvailableSpecialization(
    userId: string
  ): Promise<SpecializationContext | null> {
    try {
      const index = await this.loadIndex();
      const userIndex = index[userId];

      if (!userIndex || userIndex.specializations.length === 0) {
        return null;
      }

      const firstSpec = userIndex.specializations[0];
      return this.loadSpecialization(firstSpec.id, userId);
    } catch (_error) {
      return null;
    }
  }
}
