// backend/agent/logger/executionLogger.ts
/**
 * Speichert Loop Executions in MongoDB für History & Analytics
 */

import { logger } from '../../logger';
import { LoopResult } from '../agenticLoop';

export interface ExecutionRecord {
  _id?: string;
  loopType: string;
  runId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // ms
  status: 'success' | 'failed' | 'timeout';
  iterations: number;
  result: {
    totalProcessed?: number;
    totalActions?: number;
    findings: any[];
    recommendations: any[];
    insights: string[];
  };
  metrics: {
    successRate?: number;
    avgProcessingTime?: number;
    itemsPerSecond?: number;
  };
  error?: string;
  tags: string[];
  createdAt: Date;
}

export class ExecutionLogger {
  private db: any;
  private collectionName = 'loop_executions';

  constructor(mongoDb: any) {
    this.db = mongoDb;
    this.initializeIndexes();
  }

  /**
   * Setup MongoDB indexes
   */
  private async initializeIndexes(): Promise<void> {
    try {
      const collection = this.db.collection(this.collectionName);

      // Query Indexes
      await collection.createIndex({ loopType: 1, startTime: -1 });
      await collection.createIndex({ status: 1 });
      await collection.createIndex({ createdAt: -1 });
      await collection.createIndex({ tags: 1 });

      // TTL: Lösche nach 90 Tagen
      await collection.createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 90 * 24 * 60 * 60 }
      );

      logger.info('✅ Execution Logger indexes initialized');
    } catch (error) {
      logger.error(`Failed to initialize execution logger indexes: ${error}`);
    }
  }

  /**
   * Speichere Loop Execution
   */
  async logExecution(
    loopType: string,
    result: LoopResult,
    error?: Error
  ): Promise<void> {
    try {
      const collection = this.db.collection(this.collectionName);
      const duration = result.executionTime;

      const record: ExecutionRecord = {
        loopType,
        runId: result.context.id,
        startTime: result.context.startTime,
        endTime: new Date(),
        duration,
        status: error ? 'failed' : result.success ? 'success' : 'failed',
        iterations: result.context.iteration,
        result: {
          findings: result.context.findings,
          recommendations: result.recommendations,
          insights: result.insights,
        },
        metrics: {
          successRate: result.success ? 1.0 : 0.0,
          avgProcessingTime: duration / result.context.iteration,
        },
        error: error?.message,
        tags: [loopType, result.success ? 'success' : 'failure'],
        createdAt: new Date(),
      };

      await collection.insertOne(record);

      logger.info(
        `📝 Execution logged: ${loopType} (${result.success ? '✅' : '❌'}, ${duration}ms)`
      );
    } catch (err) {
      logger.error(`Failed to log execution: ${err}`);
    }
  }

  /**
   * Hole Execution History
   */
  async getHistory(
    loopType?: string,
    limit: number = 50
  ): Promise<ExecutionRecord[]> {
    try {
      const collection = this.db.collection(this.collectionName);

      const query = loopType ? { loopType } : {};

      const executions = await collection
        .find(query)
        .sort({ startTime: -1 })
        .limit(limit)
        .toArray();

      return executions;
    } catch (error) {
      logger.error(`Failed to get history: ${error}`);
      return [];
    }
  }

  /**
   * Hole Execution Stats für Dashboard
   */
  async getStats(
    loopType: string,
    days: number = 7
  ): Promise<{
    totalRuns: number;
    successCount: number;
    failureCount: number;
    avgDuration: number;
    successRate: number;
    lastRun: Date | null;
  }> {
    try {
      const collection = this.db.collection(this.collectionName);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const stats = await collection
        .aggregate([
          {
            $match: {
              loopType,
              startTime: { $gte: cutoffDate },
            },
          },
          {
            $group: {
              _id: '$loopType',
              totalRuns: { $sum: 1 },
              successCount: {
                $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
              },
              failureCount: {
                $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
              },
              avgDuration: { $avg: '$duration' },
              lastRun: { $max: '$startTime' },
            },
          },
        ])
        .toArray();

      if (stats.length === 0) {
        return {
          totalRuns: 0,
          successCount: 0,
          failureCount: 0,
          avgDuration: 0,
          successRate: 0,
          lastRun: null,
        };
      }

      const stat = stats[0];
      return {
        totalRuns: stat.totalRuns,
        successCount: stat.successCount,
        failureCount: stat.failureCount,
        avgDuration: stat.avgDuration,
        successRate:
          stat.totalRuns > 0 ? stat.successCount / stat.totalRuns : 0,
        lastRun: stat.lastRun,
      };
    } catch (error) {
      logger.error(`Failed to get stats: ${error}`);
      return {
        totalRuns: 0,
        successCount: 0,
        failureCount: 0,
        avgDuration: 0,
        successRate: 0,
        lastRun: null,
      };
    }
  }

  /**
   * Hole Trends für Visualisierung
   */
  async getTrends(
    loopType: string,
    days: number = 30
  ): Promise<
    Array<{
      date: string;
      runs: number;
      success: number;
      failures: number;
    }>
  > {
    try {
      const collection = this.db.collection(this.collectionName);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const trends = await collection
        .aggregate([
          {
            $match: {
              loopType,
              startTime: { $gte: cutoffDate },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$startTime',
                },
              },
              runs: { $sum: 1 },
              success: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'success'] }, 1, 0],
                },
              },
              failures: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'failed'] }, 1, 0],
                },
              },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ])
        .toArray();

      return trends.map((t: any) => ({
        date: t._id,
        runs: t.runs,
        success: t.success,
        failures: t.failures,
      }));
    } catch (error) {
      logger.error(`Failed to get trends: ${error}`);
      return [];
    }
  }
}

// Export singleton
export let executionLogger: ExecutionLogger | null = null;

export function initializeExecutionLogger(mongoDb: any): void {
  executionLogger = new ExecutionLogger(mongoDb);
  logger.info('✅ Execution Logger initialized');
}
