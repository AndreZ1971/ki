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

  constructor(mongoDb: any) {
    this.db = mongoDb;
    this.initializeIndexes();
  }

  /**
   * Setup MongoDB indexes für Performance
   */
  private async initializeIndexes(): Promise<void> {
    try {
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
      const collection = this.db.collection(this.collectionName);
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
      const collection = this.db.collection(this.collectionName);

      const query: any = {
        loopType,
        expiresAt: { $gt: new Date() }, // Nicht abgelaufen
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
      const collection = this.db.collection(this.collectionName);

      const insights = await collection
        .aggregate([
          {
            $match: {
              loopType,
              expiresAt: { $gt: new Date() },
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
      const collection = this.db.collection(this.collectionName);
      const cutoffDate = new Date(
        Date.now() - olderThanDays * 24 * 60 * 60 * 1000
      );

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
