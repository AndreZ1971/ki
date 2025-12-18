// backend/agent/loops/anomalyDetectionLoop.ts
/**
 * Agentic Loop für Anomalie-Detection
 * SENSE: Hole Payment-Daten
 * THINK: Erkenne Anomalien
 * ACT: Erstelle Alert/Recovery
 * LEARN: Speichere Pattern
 */

import { AgenticLoop } from '../agenticLoop';
import { logger } from '../../logger';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import config from '../../config';

interface PaymentAnomaly {
  orderId: number;
  type: 'failed_payment' | 'unusual_amount' | 'repeated_attempts' | 'high_risk';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedAction: string;
}

export class AnomalyDetectionLoop extends AgenticLoop {
  private wooCommerce: WooCommerceRestApi;
  private anomalies: PaymentAnomaly[] = [];
  private patterns: Map<string, number> = new Map();

  constructor() {
    super('anomaly-detection', 3);

    this.wooCommerce = new WooCommerceRestApi({
      url: config.woocommerce?.url || '',
      consumerKey: config.woocommerce?.consumerKey || '',
      consumerSecret: config.woocommerce?.consumerSecret || '',
      version: 'wc/v3',
    });

    this.setupSteps();
  }

  private setupSteps(): void {
    // SENSE: Hole letzte 100 Orders
    this.addStep({
      name: 'sense',
      description: 'Hole Payment-Daten der letzten Orders',
      action: async () => {
        logger.info('🔍 SENSE: Fetching payment data...');

        const response = await this.wooCommerce.get('orders', {
          per_page: 100,
          orderby: 'date',
          order: 'desc',
          status: ['failed', 'cancelled', 'pending'],
        });

        logger.info(
          `📊 SENSE: Found ${response.data.length} problematic orders`
        );
        return response.data;
      },
    });

    // THINK: Erkenne Anomalien
    this.addStep({
      name: 'think',
      description: 'Analysiere Muster und erkenne Anomalien',
      action: async () => {
        logger.info('🧠 THINK: Analyzing for anomalies...');

        // Hole letzte Findings
        const lastFindings =
          this.context.findings[this.context.findings.length - 1];
        if (!lastFindings || !Array.isArray(lastFindings)) {
          return [];
        }

        const detectedAnomalies: PaymentAnomaly[] = [];

        // Analysiere jeden Order
        for (const order of lastFindings) {
          // 1️⃣ Failed Payment Detection
          if (order.status === 'failed') {
            detectedAnomalies.push({
              orderId: order.id,
              type: 'failed_payment',
              severity: 'high',
              description: `Payment failed for order #${order.id}`,
              suggestedAction: 'Retry payment or contact customer',
            });
          }

          // 🆕 Cancelled Order Detection
          if (order.status === 'cancelled') {
            detectedAnomalies.push({
              orderId: order.id,
              type: 'failed_payment',
              severity: 'medium',
              description: `Order cancelled - potential payment issue #${order.id}`,
              suggestedAction:
                'Investigate cancellation reason and contact customer',
            });
          }

          // 2️⃣ Unusual Amount Detection
          const amount = parseFloat(order.total);
          if (amount > 5000) {
            detectedAnomalies.push({
              orderId: order.id,
              type: 'unusual_amount',
              severity: 'medium',
              description: `Unusually high amount: €${amount}`,
              suggestedAction: 'Manual review required',
            });
          }

          // 3️⃣ Repeated Attempts
          const customerHistory = await this.wooCommerce.get(
            `customers/${order.customer_id}/orders`
          );
          const failedAttempts = customerHistory.data.filter(
            (o: any) => o.status === 'failed'
          ).length;

          if (failedAttempts > 2) {
            detectedAnomalies.push({
              orderId: order.id,
              type: 'repeated_attempts',
              severity: 'high',
              description: `Customer has ${failedAttempts} failed payment attempts`,
              suggestedAction:
                'Contact customer, offer alternative payment method',
            });
          }
        }

        this.anomalies = detectedAnomalies;
        logger.info(`🚨 THINK: Detected ${detectedAnomalies.length} anomalies`);
        return detectedAnomalies;
      },
    });

    // ACT: Erstelle Alerts
    this.addStep({
      name: 'act',
      description: 'Erstelle Recovery-Actions',
      action: async () => {
        logger.info('⚡ ACT: Creating recovery actions...');

        const actions = this.anomalies.map((anomaly) => ({
          anomalyId: `${anomaly.orderId}-${anomaly.type}`,
          orderId: anomaly.orderId,
          action: anomaly.suggestedAction,
          priority:
            anomaly.severity === 'high'
              ? 1
              : anomaly.severity === 'medium'
                ? 2
                : 3,
          timestamp: new Date(),
          status: 'pending',
        }));

        logger.info(`✅ ACT: Created ${actions.length} recovery actions`);
        return actions;
      },
      // 🔧 FIXED: Entferne Validation - auch 0 actions sind valid (keine Anomalien gefunden ist OK)
    });

    // LEARN: Speichere Patterns
    this.addStep({
      name: 'learn',
      description: 'Lerne aus Anomalien für zukünftige Detection',
      action: async () => {
        logger.info('📚 LEARN: Storing patterns...');

        // Zähle Anomalie-Typen
        const typeCounts: Record<string, number> = {};
        for (const anomaly of this.anomalies) {
          typeCounts[anomaly.type] = (typeCounts[anomaly.type] || 0) + 1;
        }

        // Speichere Pattern im Memory
        const patterns = Object.entries(typeCounts).map(([type, count]) => ({
          type,
          count,
          frequency: count / this.anomalies.length,
          detectionRate: 'improving',
          confidence: Math.min(0.95, 0.5 + count * 0.15),
        }));

        logger.info(`📊 LEARN: Stored ${patterns.length} pattern types`);
        return patterns;
      },
    });

    // CONTINUE: Soll weiterlaufen?
    this.addStep({
      name: 'shouldContinue',
      description: 'Check if we should continue iterating',
      action: async () => {
        // Weiterlaufen solange noch Anomalien gefunden werden
        return (
          this.anomalies.length > 0 &&
          this.context.iteration < this.context.maxIterations
        );
      },
    });
  }

  /**
   * Spezielle Summary für Anomaly Loop
   */
  getSummary() {
    return {
      totalAnomalies: this.anomalies.length,
      byType: this.anomalies.reduce(
        (acc, a) => {
          acc[a.type] = (acc[a.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      bySeverity: this.anomalies.reduce(
        (acc, a) => {
          acc[a.severity] = (acc[a.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}
