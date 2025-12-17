// backend/agent/memory/persistentMemory.ts
/**
 * Persistente Memory für Agentic Loops
 * Speichert Learnings und Patterns in MongoDB
 * Nutzt Exponential Decay für alte Learnings
 */

import { logger } from '../../logger';

export interface LearningRecord {
  _id?: string;
  loopType: string;
  pattern: string;
  learning: any;
  confidence: number;
  timestamp: Date;
  expiresAt: Date;
  tags: string[];
  successRate?: number;
}

export interface MemoryInsight {
  pattern: string;
  occurrences: number;
  avgConfidence: number;
  lastSeen: Date;
  successRate: number;
}

export class PersistentMemory {
  private db: any; // MongoDB connection
  private collectionName = 'loop_learnings';
  private ttlDays = 30; // Default TTL
  private memoryStore: LearningRecord[] = []; // In-memory fallback

  constructor(mongoDb: any) {
    this.db = mongoDb;
    this.initializeIndexes();
  }

  /**
   * Setup MongoDB indexes für Performance
   */
  private async initializeIndexes(): Promise<void> {
    try {
      if (!this.db) {
        logger.info('ℹ️ Persistent Memory running in memory mode (no DB)');
        return;
      }
      const collection = this.db.collection(this.collectionName);

      // TTL Index: Automatic deletion nach expiresAt
      await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

      // Query Indexes
      await collection.createIndex({ loopType: 1, pattern: 1 });
      await collection.createIndex({ loopType: 1, timestamp: -1 });
      await collection.createIndex({ tags: 1 });

      logger.info('✅ Memory indexes initialized');
    } catch (error) {
      logger.error(`Failed to initialize indexes: ${error}`);
    }
  }

  /**
   * Speichere ein Learning
   */
  async remember(
    loopType: string,
    pattern: string,
    learning: any,
    confidence: number = 0.8,
    tags: string[] = []
  ): Promise<void> {
    try {
      const expiresAt = new Date(
        Date.now() + this.ttlDays * 24 * 60 * 60 * 1000
      );

      const record: LearningRecord = {
        loopType,
        pattern,
        learning,
        confidence,
        timestamp: new Date(),
        expiresAt,
        tags: [...tags, loopType, pattern],
      };

      if (!this.db) {
        this.memoryStore.unshift(record);
        // Cap memory to last 1000 records
        if (this.memoryStore.length > 1000) this.memoryStore.length = 1000;
        logger.info(
          `📚 (mem) Learning remembered: ${loopType}/${pattern} (confidence: ${confidence})`
        );
        return;
      }

      const collection = this.db.collection(this.collectionName);
      await collection.insertOne(record);

      logger.info(
        `📚 Learning remembered: ${loopType}/${pattern} (confidence: ${confidence})`
      );
    } catch (error) {
      logger.error(`Failed to remember: ${error}`);
    }
  }

  /**
   * Rufe Learnings ab
   */
  async recall(
    loopType: string,
    pattern?: string,
    limit: number = 10
  ): Promise<LearningRecord[]> {
    try {
      const now = new Date();

      if (!this.db) {
        const filtered = this.memoryStore.filter((r) => {
          const matchesType = r.loopType === loopType;
          const matchesPattern = !pattern || r.pattern === pattern;
          const notExpired = r.expiresAt > now;
          return matchesType && matchesPattern && notExpired;
        });
        const result = filtered
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, limit);
        logger.info(
          `🧠 (mem) Recalled ${result.length} learnings for ${loopType}`
        );
        return result;
      }

      const collection = this.db.collection(this.collectionName);

      const query: any = {
        loopType,
        expiresAt: { $gt: now }, // Nicht abgelaufen
      };

      if (pattern) {
        query.pattern = pattern;
      }

      const learnings = await collection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      logger.info(`🧠 Recalled ${learnings.length} learnings for ${loopType}`);
      return learnings;
    } catch (error) {
      logger.error(`Failed to recall: ${error}`);
      return [];
    }
  }

  /**
   * Hole Insights/Patterns
   */
  async getInsights(loopType: string): Promise<MemoryInsight[]> {
    try {
      const now = new Date();

      if (!this.db) {
        const relevant = this.memoryStore.filter(
          (r) => r.loopType === loopType && r.expiresAt > now
        );

        // Group by pattern
        const byPattern: Record<string, LearningRecord[]> = {};
        for (const rec of relevant) {
          if (!byPattern[rec.pattern]) byPattern[rec.pattern] = [];
          byPattern[rec.pattern].push(rec);
        }

        const insights: MemoryInsight[] = Object.keys(byPattern).map(
          (pattern) => {
            const records = byPattern[pattern];
            const occurrences = records.length;
            const avgConfidence =
              records.reduce((sum, r) => sum + r.confidence, 0) / occurrences;
            const lastSeen = records.reduce(
              (max, r) => (r.timestamp > max ? r.timestamp : max),
              new Date(0)
            );
            const successRate =
              records.reduce((sum, r) => sum + (r.successRate || 0), 0) /
              occurrences;
            return {
              pattern,
              occurrences,
              avgConfidence,
              lastSeen,
              successRate,
            };
          }
        );

        return insights
          .sort((a, b) => b.occurrences - a.occurrences)
          .slice(0, 20);
      }

      const collection = this.db.collection(this.collectionName);

      const insights = await collection
        .aggregate([
          {
            $match: {
              loopType,
              expiresAt: { $gt: now },
            },
          },
          {
            $group: {
              _id: '$pattern',
              occurrences: { $sum: 1 },
              avgConfidence: { $avg: '$confidence' },
              lastSeen: { $max: '$timestamp' },
              successRate: { $avg: { $cond: ['$success', 1, 0] } },
            },
          },
          {
            $sort: { occurrences: -1 },
          },
          {
            $limit: 20,
          },
        ])
        .toArray();

      return insights.map((doc: any) => ({
        pattern: doc._id,
        occurrences: doc.occurrences,
        avgConfidence: doc.avgConfidence,
        lastSeen: doc.lastSeen,
        successRate: doc.successRate || 0,
      }));
    } catch (error) {
      logger.error(`Failed to get insights: ${error}`);
      return [];
    }
  }

  /**
   * Lerne aus erfolgreichem Result
   */
  async learnFromSuccess(
    loopType: string,
    pattern: string,
    successDetails: any
  ): Promise<void> {
    await this.remember(loopType, pattern, successDetails, 0.95, ['success']);
  }

  /**
   * Lerne aus Fehler
   */
  async learnFromFailure(
    loopType: string,
    pattern: string,
    failureDetails: any
  ): Promise<void> {
    await this.remember(loopType, pattern, failureDetails, 0.3, ['failure']);
  }

  /**
   * Loesche alte Learnings manuell
   */
  async cleanup(olderThanDays: number = 60): Promise<number> {
    try {
      const cutoffDate = new Date(
        Date.now() - olderThanDays * 24 * 60 * 60 * 1000
      );

      if (!this.db) {
        const before = this.memoryStore.length;
        this.memoryStore = this.memoryStore.filter(
          (r) => r.timestamp >= cutoffDate
        );
        const deleted = before - this.memoryStore.length;
        logger.info(`🧹 (mem) Cleaned up ${deleted} old learnings`);
        return deleted;
      }

      const collection = this.db.collection(this.collectionName);

      const result = await collection.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      logger.info(`🧹 Cleaned up ${result.deletedCount} old learnings`);
      return result.deletedCount;
    } catch (error) {
      logger.error(`Failed to cleanup: ${error}`);
      return 0;
    }
  }

  /**
   * Hole Stats über alle Learnings
   */
  async getStats(loopType?: string): Promise<any> {
    try {
      if (!this.db) {
        const filtered = loopType
          ? this.memoryStore.filter((r) => r.loopType === loopType)
          : this.memoryStore.slice();

        if (filtered.length === 0) return [];

        const byType: Record<string, LearningRecord[]> = {};
        for (const rec of filtered) {
          if (!byType[rec.loopType]) byType[rec.loopType] = [];
          byType[rec.loopType].push(rec);
        }

        return Object.keys(byType).map((type) => {
          const records = byType[type];
          const totalRecords = records.length;
          const avgConfidence =
            records.reduce((sum, r) => sum + r.confidence, 0) / totalRecords;
          const oldestRecord = records.reduce(
            (min, r) => (r.timestamp < min ? r.timestamp : min),
            new Date()
          );
          const newestRecord = records.reduce(
            (max, r) => (r.timestamp > max ? r.timestamp : max),
            new Date(0)
          );
          return {
            _id: type,
            totalRecords,
            avgConfidence,
            oldestRecord,
            newestRecord,
          };
        });
      }

      const collection = this.db.collection(this.collectionName);

      const query = loopType ? { loopType } : {};

      const stats = await collection
        .aggregate([
          { $match: query },
          {
            $group: {
              _id: '$loopType',
              totalRecords: { $sum: 1 },
              avgConfidence: { $avg: '$confidence' },
              oldestRecord: { $min: '$timestamp' },
              newestRecord: { $max: '$timestamp' },
            },
          },
        ])
        .toArray();

      return stats;
    } catch (error) {
      logger.error(`Failed to get stats: ${error}`);
      return [];
    }
  }
}

// Export singleton wenn DB verfügbar
export let persistentMemory: PersistentMemory | null = null;

export function initializePersistentMemory(mongoDb: any): void {
  persistentMemory = new PersistentMemory(mongoDb);
  logger.info('✅ Persistent Memory initialized');
}
