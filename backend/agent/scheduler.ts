// backend/agent/scheduler.ts
/**
 * Agentic Loop Scheduler
 * Verwaltet automatische Execution aller Loops
 * Unterstützt: Cron-basiert oder Manual Trigger
 */

import cron from 'node-cron';
import { logger } from '../logger';
import { AnomalyDetectionLoop } from './loops/anomalyDetectionLoop';
import { ProductOptimizationLoop } from './loops/productOptimizationLoop';
import { PaymentRecoveryLoop } from './loops/paymentRecoveryLoop';
import { AnalyticsInsightsLoop } from './loops/analyticsInsightsLoop';
import { AgenticLoop, LoopResult } from './agenticLoop';

export interface ScheduleConfig {
  anomalyDetection: string; // Cron pattern
  productOptimization: string;
  paymentRecovery: string;
  analyticsInsights: string;
}

export interface ScheduleStatus {
  anomalyDetection: { scheduled: boolean; lastRun?: Date; nextRun?: string };
  productOptimization: { scheduled: boolean; lastRun?: Date; nextRun?: string };
  paymentRecovery: { scheduled: boolean; lastRun?: Date; nextRun?: string };
  analyticsInsights: { scheduled: boolean; lastRun?: Date; nextRun?: string };
  isRunning: boolean;
}

export class LoopScheduler {
  private jobs: Map<string, any> = new Map();
  private lastRuns: Map<string, Date> = new Map();
  private isRunning = false;

  private defaultSchedule: ScheduleConfig = {
    // Daily at 09:00
    anomalyDetection: '0 9 * * *',
    // Twice a week: Monday and Thursday at 10:00
    productOptimization: '0 10 * * 1,4',
    // Every 30 minutes
    paymentRecovery: '*/30 * * * *',
    // Daily at 20:00
    analyticsInsights: '0 20 * * *',
  };

  /**
   * Starte alle Scheduled Jobs
   */
  startAll(config?: ScheduleConfig): void {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    const schedule = config || this.defaultSchedule;
    this.isRunning = true;

    logger.info('🤖 Starting Agentic Loop Scheduler...');

    // Anomaly Detection: täglich 09:00
    this.scheduleLoop('anomaly-detection', schedule.anomalyDetection, () => {
      return new AnomalyDetectionLoop().execute();
    });

    // Product Optimization: Mo/Do 10:00
    this.scheduleLoop(
      'product-optimization',
      schedule.productOptimization,
      () => {
        return new ProductOptimizationLoop().execute();
      }
    );

    // Payment Recovery: alle 30 Minuten
    this.scheduleLoop('payment-recovery', schedule.paymentRecovery, () => {
      return new PaymentRecoveryLoop().execute();
    });

    // Analytics Insights: täglich 20:00
    this.scheduleLoop('analytics-insights', schedule.analyticsInsights, () => {
      return new AnalyticsInsightsLoop().execute();
    });

    logger.info('✅ All Agentic Loops scheduled');
  }

  /**
   * Helper: Registriere einen Loop mit Cron
   */
  private scheduleLoop(
    loopType: string,
    cronPattern: string,
    executeFunc: () => Promise<LoopResult>
  ): void {
    try {
      const task = cron.schedule(cronPattern, async () => {
        logger.info(`🔄 Starting scheduled ${loopType}...`);
        this.lastRuns.set(loopType, new Date());

        try {
          const result = await executeFunc();
          logger.info(
            `✅ ${loopType} completed: ${result.insights.length} insights`
          );
        } catch (error) {
          logger.error(
            `❌ ${loopType} failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      });

      this.jobs.set(loopType, task);
      logger.info(`📅 Scheduled ${loopType} with pattern: ${cronPattern}`);
    } catch (error) {
      logger.error(
        `Failed to schedule ${loopType}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Stoppe alle Scheduled Jobs
   */
  stopAll(): void {
    if (!this.isRunning) {
      logger.warn('Scheduler is not running');
      return;
    }

    logger.info('🛑 Stopping all scheduled jobs...');

    for (const [loopType, task] of this.jobs) {
      task.stop();
      logger.info(`⏹️ Stopped ${loopType}`);
    }

    this.jobs.clear();
    this.isRunning = false;
    logger.info('✅ All jobs stopped');
  }

  /**
   * Trigger einen Loop sofort
   */
  async triggerManual(loopType: string): Promise<LoopResult> {
    logger.info(`⚡ Manual trigger for ${loopType}`);

    let loop: AgenticLoop | null = null;

    switch (loopType) {
      case 'anomaly-detection':
        loop = new AnomalyDetectionLoop();
        break;
      case 'product-optimization':
        loop = new ProductOptimizationLoop();
        break;
      case 'payment-recovery':
        loop = new PaymentRecoveryLoop();
        break;
      case 'analytics-insights':
        loop = new AnalyticsInsightsLoop();
        break;
      default:
        throw new Error(`Unknown loop type: ${loopType}`);
    }

    this.lastRuns.set(loopType, new Date());
    return await loop.execute();
  }

  /**
   * Erhalte Scheduler-Status
   */
  getStatus(): ScheduleStatus {
    return {
      anomalyDetection: {
        scheduled: this.jobs.has('anomaly-detection'),
        lastRun: this.lastRuns.get('anomaly-detection'),
        nextRun: this.jobs.get('anomaly-detection')?.nextDate().toISOString(),
      },
      productOptimization: {
        scheduled: this.jobs.has('product-optimization'),
        lastRun: this.lastRuns.get('product-optimization'),
        nextRun: this.jobs
          .get('product-optimization')
          ?.nextDate()
          .toISOString(),
      },
      paymentRecovery: {
        scheduled: this.jobs.has('payment-recovery'),
        lastRun: this.lastRuns.get('payment-recovery'),
        nextRun: this.jobs.get('payment-recovery')?.nextDate().toISOString(),
      },
      analyticsInsights: {
        scheduled: this.jobs.has('analytics-insights'),
        lastRun: this.lastRuns.get('analytics-insights'),
        nextRun: this.jobs.get('analytics-insights')?.nextDate().toISOString(),
      },
      isRunning: this.isRunning,
    };
  }

  /**
   * Ist Scheduler aktiv?
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Update Cron Pattern für einen Loop
   */
  updateSchedule(loopType: string, cronPattern: string): void {
    if (!this.jobs.has(loopType)) {
      throw new Error(`Loop ${loopType} not scheduled`);
    }

    logger.info(`Updating ${loopType} schedule to: ${cronPattern}`);
    const job = this.jobs.get(loopType)!;
    job.stop();
    this.jobs.delete(loopType);

    // Re-schedule mit neuem Pattern
    switch (loopType) {
      case 'anomaly-detection':
        this.scheduleLoop(loopType, cronPattern, () =>
          new AnomalyDetectionLoop().execute()
        );
        break;
      case 'product-optimization':
        this.scheduleLoop(loopType, cronPattern, () =>
          new ProductOptimizationLoop().execute()
        );
        break;
      case 'payment-recovery':
        this.scheduleLoop(loopType, cronPattern, () =>
          new PaymentRecoveryLoop().execute()
        );
        break;
      case 'analytics-insights':
        this.scheduleLoop(loopType, cronPattern, () =>
          new AnalyticsInsightsLoop().execute()
        );
        break;
    }
  }
}

// Singleton Instance
export const globalScheduler = new LoopScheduler();
