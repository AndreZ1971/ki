// backend/services/loopScheduleManager.ts
/**
 * Service für persistente Loop Schedule Verwaltung
 * Lädt/Speichert loop-schedules.json
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../logger';
import type {
  LoopType,
  LoopSchedules,
  PartialLoopSchedules,
  ScheduleConfig,
} from '../types/loopSchedule';

const SCHEDULES_FILE = path.resolve(
  __dirname,
  '../../data/loop-schedules.json'
);

// Default Schedules (Fallback wenn Datei nicht existiert)
const DEFAULT_SCHEDULES: LoopSchedules = {
  'anomaly-detection': {
    enabled: true,
    type: 'daily',
    time: '08:00',
  },
  'payment-recovery': {
    enabled: true,
    type: 'interval',
    minutes: 30,
  },
  'product-optimization': {
    enabled: true,
    type: 'weekly',
    time: '10:00',
    weekdays: ['Monday', 'Wednesday', 'Friday'],
  },
  'analytics-insights': {
    enabled: true,
    type: 'daily',
    time: '22:00',
  },
};

export class LoopScheduleManager {
  private schedules: LoopSchedules;

  constructor() {
    this.schedules = this.loadSchedules();
  }

  /**
   * Lädt Schedules aus loop-schedules.json
   */
  private loadSchedules(): LoopSchedules {
    try {
      if (!fs.existsSync(SCHEDULES_FILE)) {
        logger.info(
          '📅 loop-schedules.json nicht gefunden, erstelle Default-Schedules...'
        );
        this.saveSchedules(DEFAULT_SCHEDULES);
        return DEFAULT_SCHEDULES;
      }

      const raw = fs.readFileSync(SCHEDULES_FILE, 'utf-8');
      const loaded = JSON.parse(raw) as Partial<LoopSchedules>;

      // Merge mit Defaults (falls neue Loops hinzugefügt wurden)
      const merged: LoopSchedules = {
        ...DEFAULT_SCHEDULES,
        ...loaded,
      };

      logger.info(`✅ Loop Schedules geladen: ${SCHEDULES_FILE}`);
      return merged;
    } catch (error) {
      logger.error(`❌ Fehler beim Laden der Loop Schedules: ${error}`);
      return DEFAULT_SCHEDULES;
    }
  }

  /**
   * Speichert Schedules in loop-schedules.json
   */
  private saveSchedules(schedules: LoopSchedules): void {
    try {
      const dir = path.dirname(SCHEDULES_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        SCHEDULES_FILE,
        JSON.stringify(schedules, null, 2),
        'utf-8'
      );
      logger.info(`✅ Loop Schedules gespeichert: ${SCHEDULES_FILE}`);
    } catch (error) {
      logger.error(`❌ Fehler beim Speichern der Loop Schedules: ${error}`);
      throw error;
    }
  }

  /**
   * Hole alle Schedules
   */
  getAllSchedules(): LoopSchedules {
    return { ...this.schedules };
  }

  /**
   * Hole Schedule für einen spezifischen Loop
   */
  getSchedule(loopType: LoopType): ScheduleConfig {
    return this.schedules[loopType];
  }

  /**
   * Update Schedule für einen spezifischen Loop
   */
  updateSchedule(loopType: LoopType, config: ScheduleConfig): void {
    this.schedules[loopType] = config as any; // Type assertion OK wegen Validation
    this.saveSchedules(this.schedules);
    logger.info(`📅 Schedule aktualisiert: ${loopType}`);
  }

  /**
   * Update mehrere Schedules gleichzeitig
   */
  updateSchedules(updates: PartialLoopSchedules): void {
    this.schedules = {
      ...this.schedules,
      ...updates,
    };
    this.saveSchedules(this.schedules);
    logger.info('📅 Schedules aktualisiert');
  }

  /**
   * Setze Loop enabled/disabled
   */
  setEnabled(loopType: LoopType, enabled: boolean): void {
    this.schedules[loopType].enabled = enabled;
    this.saveSchedules(this.schedules);
    logger.info(
      `📅 Loop ${enabled ? 'aktiviert' : 'deaktiviert'}: ${loopType}`
    );
  }

  /**
   * Reload Schedules from file (z.B. nach manuellem Edit)
   */
  reload(): void {
    this.schedules = this.loadSchedules();
  }
}

// Singleton Export
export const loopScheduleManager = new LoopScheduleManager();
