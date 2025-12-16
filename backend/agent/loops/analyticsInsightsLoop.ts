// backend/agent/loops/analyticsInsightsLoop.ts
/**
 * Agentic Loop für Analytics & Insights
 * SENSE: Hole Dashboard Daten (Revenue, Conversion, Retention)
 * THINK: Analysiere Trends & Anomalien
 * ACT: Generiere Insight-Karten
 * LEARN: Verbessere Metriken
 */

import { AgenticLoop } from '../agenticLoop';
import { logger } from '../../logger';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import config from '../../config';

interface DashboardMetrics {
  revenue: { total: number; change: number };
  orders: { count: number; change: number };
  customers: { count: number; change: number };
  conversion: { rate: number; change: number };
  avgOrderValue: { value: number; change: number };
}

interface InsightCard {
  title: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

interface Anomaly {
  metric: string;
  current: number;
  expected: number;
  deviation: number;
  severity: 'critical' | 'warning' | 'info';
}

export class AnalyticsInsightsLoop extends AgenticLoop {
  private wooCommerce: WooCommerceRestApi;
  private metrics: DashboardMetrics | null = null;
  private insights: InsightCard[] = [];
  private anomalies: Anomaly[] = [];

  constructor() {
    super('analytics-insights', 4);

    this.wooCommerce = new WooCommerceRestApi({
      url: config.woocommerce?.url || '',
      consumerKey: config.woocommerce?.consumerKey || '',
      consumerSecret: config.woocommerce?.consumerSecret || '',
      version: 'wc/v3',
    });

    this.setupSteps();
  }

  private setupSteps(): void {
    // SENSE: Hole Metriken
    this.addStep({
      name: 'sense',
      description: 'Gather dashboard metrics from last 30 days',
      action: async () => {
        logger.info('📊 SENSE: Fetching analytics data...');

        // Baseline: Diese Werte würden aus real Daten kommen
        const thisMonth = {
          revenue: 45000,
          orders: 320,
          customers: 180,
          conversion: 3.2,
          avgOrderValue: 140.6,
        };

        const lastMonth = {
          revenue: 42000,
          orders: 310,
          customers: 170,
          conversion: 3.1,
          avgOrderValue: 135.5,
        };

        this.metrics = {
          revenue: {
            total: thisMonth.revenue,
            change:
              ((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) *
              100,
          },
          orders: {
            count: thisMonth.orders,
            change:
              ((thisMonth.orders - lastMonth.orders) / lastMonth.orders) * 100,
          },
          customers: {
            count: thisMonth.customers,
            change:
              ((thisMonth.customers - lastMonth.customers) /
                lastMonth.customers) *
              100,
          },
          conversion: {
            rate: thisMonth.conversion,
            change:
              ((thisMonth.conversion - lastMonth.conversion) /
                lastMonth.conversion) *
              100,
          },
          avgOrderValue: {
            value: thisMonth.avgOrderValue,
            change:
              ((thisMonth.avgOrderValue - lastMonth.avgOrderValue) /
                lastMonth.avgOrderValue) *
              100,
          },
        };

        logger.info(
          `✅ SENSE: Collected ${Object.keys(this.metrics).length} metrics`
        );
        return this.metrics;
      },
    });

    // THINK: Analysiere Trends & Erkenne Anomalien
    this.addStep({
      name: 'think',
      description: 'Analyze trends and detect anomalies',
      action: async () => {
        logger.info('🧠 THINK: Analyzing metrics for trends and anomalies...');

        if (!this.metrics) return [];

        // 1️⃣ Erkenne Anomalien (wenn Veränderung > 15%)
        const anomalyThreshold = 15;

        if (Math.abs(this.metrics.conversion.change) > anomalyThreshold) {
          this.anomalies.push({
            metric: 'conversion',
            current: this.metrics.conversion.rate,
            expected: 3.0,
            deviation: this.metrics.conversion.change,
            severity:
              Math.abs(this.metrics.conversion.change) > 20
                ? 'critical'
                : 'warning',
          });
        }

        if (Math.abs(this.metrics.avgOrderValue.change) > anomalyThreshold) {
          this.anomalies.push({
            metric: 'avg_order_value',
            current: this.metrics.avgOrderValue.value,
            expected: 135,
            deviation: this.metrics.avgOrderValue.change,
            severity:
              Math.abs(this.metrics.avgOrderValue.change) > 20
                ? 'critical'
                : 'warning',
          });
        }

        // 2️⃣ Generiere Insights aus den Trends
        // Positive Trends
        if (this.metrics.revenue.change > 0) {
          this.insights.push({
            title: '📈 Revenue Growth',
            value: `€${this.metrics.revenue.total.toLocaleString()}`,
            trend: 'up',
            recommendation:
              'Maintain current marketing strategy and increase inventory',
            priority: 'high',
          });
        }

        if (this.metrics.conversion.change > 0) {
          this.insights.push({
            title: '🎯 Conversion Improvement',
            value: `${this.metrics.conversion.rate.toFixed(2)}%`,
            trend: 'up',
            recommendation:
              'Analyze winning pages and scale successful experiments',
            priority: 'high',
          });
        }

        // Negative Trends
        if (this.metrics.revenue.change < -5) {
          this.insights.push({
            title: '⚠️ Revenue Decline',
            value: `${this.metrics.revenue.change.toFixed(1)}% MoM`,
            trend: 'down',
            recommendation:
              'Review recent product changes and run promotional campaign',
            priority: 'high',
          });
        }

        if (this.metrics.customers.change < 0) {
          this.insights.push({
            title: '👥 Customer Growth Slowdown',
            value: `${this.metrics.customers.change.toFixed(1)}% MoM`,
            trend: 'down',
            recommendation:
              'Increase acquisition budget or improve retention campaigns',
            priority: 'medium',
          });
        }

        logger.info(
          `✅ THINK: Found ${this.anomalies.length} anomalies, ${this.insights.length} insights`
        );
        return { anomalies: this.anomalies, insights: this.insights };
      },
    });

    // ACT: Konkretisiere Empfehlungen
    this.addStep({
      name: 'act',
      description: 'Generate actionable recommendations',
      action: async () => {
        logger.info('⚡ ACT: Generating actionable recommendations...');

        // Ergänze Insights mit spezifischen Aktionen
        const actions = [];

        for (const anomaly of this.anomalies) {
          let action = '';

          if (
            anomaly.metric === 'conversion' &&
            anomaly.severity === 'critical'
          ) {
            action =
              '🔴 URGENT: Run A/B tests on checkout flow - conversion dropped > 20%';
          } else if (anomaly.metric === 'avg_order_value') {
            action =
              '🟡 Investigate product bundling - AOV decreased, suggest bundles';
          }

          if (action) {
            actions.push(action);
            logger.info(`✅ Action: ${action}`);
          }
        }

        // High-Priority Insights bekommen explizite Actions
        const highPriority = this.insights.filter((i) => i.priority === 'high');
        logger.info(
          `⚡ ACT: ${highPriority.length} high-priority insights require action`
        );

        return actions;
      },
    });

    // LEARN: Speichere Best Practices
    this.addStep({
      name: 'learn',
      description: 'Learn from insights to improve future recommendations',
      action: async () => {
        logger.info('📚 LEARN: Storing insights for future reference...');

        // In einer echten App würde dies in memory.ts gespeichert
        const learnings = {
          conversationRate: this.metrics?.conversion.rate,
          revenuePerDay: (this.metrics?.revenue.total || 0) / 30,
          customerAcquisitionCost:
            (this.metrics?.revenue.total || 0) /
            (this.metrics?.customers.count || 1) /
            10, // Vereinfacht
          topInsights: this.insights
            .filter((i) => i.priority === 'high')
            .map((i) => i.title),
        };

        logger.info(
          `✅ LEARN: Stored learnings - ${JSON.stringify(learnings)}`
        );
        return learnings;
      },
    });

    // CONTINUE
    this.addStep({
      name: 'shouldContinue',
      description: 'Continue if more metrics need analysis',
      action: async () => {
        // Könnte auch andere Zeitperioden analysieren (weekly, quarterly)
        return this.context.iteration < 2;
      },
    });
  }

  getSummary() {
    return {
      totalInsights: this.insights.length,
      highPriority: this.insights.filter((i) => i.priority === 'high').length,
      mediumPriority: this.insights.filter((i) => i.priority === 'medium')
        .length,
      anomaliesDetected: this.anomalies.length,
      criticalAnomalies: this.anomalies.filter((a) => a.severity === 'critical')
        .length,
      insights: this.insights.map((i) => ({
        title: i.title,
        trend: i.trend,
        recommendation: i.recommendation,
      })),
      topAnomalies: this.anomalies
        .filter((a) => a.severity === 'critical' || a.severity === 'warning')
        .map((a) => ({
          metric: a.metric,
          deviation: `${a.deviation.toFixed(1)}%`,
        })),
    };
  }
}
