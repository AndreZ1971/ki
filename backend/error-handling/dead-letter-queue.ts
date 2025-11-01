// backend/error-handling/dead-letter-queue.ts
/**
 * Dead Letter Queue (DLQ) für fehlgeschlagene Jobs
 * Speichert fehlgeschlagene Operationen für spätere Wiederholung
 */

import fs from 'fs/promises';
import path from 'path';

export interface DeadLetterMessage<T = any> {
  id: string;
  jobType: string;
  payload: T;
  error: {
    message: string;
    stack?: string;
    code?: string;
  };
  attempts: number;
  firstFailedAt: string;
  lastFailedAt: string;
  nextRetryAt?: string;
  metadata?: Record<string, any>;
}

export interface DLQOptions {
  storagePath?: string;          // Pfad für Persistierung
  maxRetries?: number;           // Maximale Wiederholungen
  retryDelay?: number;           // Delay zwischen Retries (ms)
  autoRetry?: boolean;           // Automatische Wiederholung
  onRetry?: (message: DeadLetterMessage) => void;
  onMaxRetriesReached?: (message: DeadLetterMessage) => void;
}

export class DeadLetterQueue {
  private messages = new Map<string, DeadLetterMessage>();
  private readonly options: Required<DLQOptions>;
  private retryInterval?: NodeJS.Timeout;

  constructor(options: DLQOptions = {}) {
    this.options = {
      storagePath: options.storagePath || path.join(process.cwd(), 'data', 'dlq'),
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 300000, // 5 Minuten
      autoRetry: options.autoRetry !== undefined ? options.autoRetry : true,
      onRetry: options.onRetry || (() => {}),
      onMaxRetriesReached: options.onMaxRetriesReached || ((msg) => {
        console.error(`[DLQ] Max retries reached for job ${msg.jobType} (ID: ${msg.id})`);
      })
    };

    this.init();
  }

  private async init() {
    // Erstelle Storage-Verzeichnis
    try {
      await fs.mkdir(this.options.storagePath, { recursive: true });
      await this.loadFromDisk();
    } catch (_error) {
      console.error('[DLQ] Initialization error:', error);
    }

    // Starte Auto-Retry wenn aktiviert
    if (this.options.autoRetry) {
      this.startAutoRetry();
    }
  }

  /**
   * Fügt fehlgeschlagenen Job zur Queue hinzu
   */
  async add<T = any>(
    jobType: string,
    payload: T,
    error: Error,
    metadata?: Record<string, any>
  ): Promise<string> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const message: DeadLetterMessage<T> = {
      id,
      jobType,
      payload,
      error: {
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      },
      attempts: 1,
      firstFailedAt: now,
      lastFailedAt: now,
      nextRetryAt: new Date(Date.now() + this.options.retryDelay).toISOString(),
      metadata
    };

    this.messages.set(id, message);
    await this.saveToDisk(id, message);

    console.log(`[DLQ] Added failed job: ${jobType} (ID: ${id})`);
    return id;
  }

  /**
   * Aktualisiert Message nach erneutem Fehlschlag
   */
  async updateFailure(id: string, error: Error): Promise<void> {
    const message = this.messages.get(id);
    if (!message) {
      throw new Error(`Message ${id} not found in DLQ`);
    }

    message.attempts++;
    message.lastFailedAt = new Date().toISOString();
    message.error = {
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    };

    if (message.attempts < this.options.maxRetries) {
      message.nextRetryAt = new Date(
        Date.now() + this.options.retryDelay * message.attempts
      ).toISOString();
    } else {
      message.nextRetryAt = undefined;
      this.options.onMaxRetriesReached(message);
    }

    await this.saveToDisk(id, message);
  }

  /**
   * Entfernt erfolgreich verarbeitete Message
   */
  async remove(id: string): Promise<void> {
    this.messages.delete(id);
    await this.deleteFromDisk(id);
    console.log(`[DLQ] Removed successfully processed job (ID: ${id})`);
  }

  /**
   * Holt Message aus Queue
   */
  get(id: string): DeadLetterMessage | undefined {
    return this.messages.get(id);
  }

  /**
   * Holt alle Messages eines Job-Types
   */
  getByJobType(jobType: string): DeadLetterMessage[] {
    return Array.from(this.messages.values())
      .filter(msg => msg.jobType === jobType);
  }

  /**
   * Holt alle Messages die für Retry bereit sind
   */
  getReadyForRetry(): DeadLetterMessage[] {
    const now = new Date();
    return Array.from(this.messages.values())
      .filter(msg => 
        msg.nextRetryAt && 
        new Date(msg.nextRetryAt) <= now &&
        msg.attempts < this.options.maxRetries
      );
  }

  /**
   * Holt alle Messages
   */
  getAll(): DeadLetterMessage[] {
    return Array.from(this.messages.values());
  }

  /**
   * Gibt Statistiken zurück
   */
  getStats() {
    const messages = this.getAll();
    const byJobType = messages.reduce((acc, msg) => {
      acc[msg.jobType] = (acc[msg.jobType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: messages.length,
      readyForRetry: this.getReadyForRetry().length,
      maxRetriesReached: messages.filter(m => m.attempts >= this.options.maxRetries).length,
      byJobType
    };
  }

  /**
   * Startet automatische Retry-Verarbeitung
   */
  private startAutoRetry(): void {
    this.retryInterval = setInterval(() => {
      const readyMessages = this.getReadyForRetry();
      if (readyMessages.length > 0) {
        console.log(`[DLQ] ${readyMessages.length} jobs ready for retry`);
        readyMessages.forEach(msg => this.options.onRetry(msg));
      }
    }, 60000); // Check jede Minute
  }

  /**
   * Stoppt Auto-Retry
   */
  stopAutoRetry(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = undefined;
    }
  }

  /**
   * Leert komplette Queue
   */
  async clear(): Promise<void> {
    for (const id of this.messages.keys()) {
      await this.deleteFromDisk(id);
    }
    this.messages.clear();
    console.log('[DLQ] Queue cleared');
  }

  /**
   * Persistierung auf Disk
   */
  private async saveToDisk(id: string, message: DeadLetterMessage): Promise<void> {
    try {
      const filePath = path.join(this.options.storagePath, `${id}.json`);
      await fs.writeFile(filePath, JSON.stringify(message, null, 2), 'utf-8');
    } catch (_error) {
      console.error(`[DLQ] Failed to save message ${id}:`, error);
    }
  }

  private async deleteFromDisk(id: string): Promise<void> {
    try {
      const filePath = path.join(this.options.storagePath, `${id}.json`);
      await fs.unlink(filePath);
    } catch (_error) {
      // Ignore if file doesn't exist
      if ((error as any).code !== 'ENOENT') {
        console.error(`[DLQ] Failed to delete message ${id}:`, error);
      }
    }
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const files = await fs.readdir(this.options.storagePath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        try {
          const content = await fs.readFile(
            path.join(this.options.storagePath, file),
            'utf-8'
          );
          const message = JSON.parse(content) as DeadLetterMessage;
          this.messages.set(message.id, message);
        } catch (_error) {
          console.error(`[DLQ] Failed to load message from ${file}:`, error);
        }
      }

      console.log(`[DLQ] Loaded ${this.messages.size} messages from disk`);
    } catch (_error) {
      console.error('[DLQ] Failed to load from disk:', error);
    }
  }

  private generateId(): string {
    return `dlq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup beim Beenden
   */
  async shutdown(): Promise<void> {
    this.stopAutoRetry();
    console.log('[DLQ] Shutdown complete');
  }
}

// Globale DLQ Instanz
export const deadLetterQueue = new DeadLetterQueue({
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 300000 // 5 Minuten
});
