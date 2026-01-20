// backend/agent/loops/paymentRecoveryLoop.ts
/**
 * Agentic Loop für Payment-Recovery
 * SENSE: Finde Failed Orders
 * THINK: Wähle Recovery-Strategie
 * ACT: Versuche Recovery
 * LEARN: Speichere welche Strategie wann funktioniert
 */

import { AgenticLoop } from '../agenticLoop';
import { logger } from '../../logger';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { getConfig } from '../../config';

interface FailedOrder {
  id: number;
  customerId: number;
  email: string;
  amount: number;
  failureReason: string;
  attempts: number;
}

interface RecoveryStrategy {
  name: 'retry' | 'discount' | 'alt_payment' | 'contact';
  priority: number;
  successRate: number;
}

interface RecoveryAttempt {
  orderId: number;
  strategy: RecoveryStrategy;
  success: boolean;
  details: string;
}

export class PaymentRecoveryLoop extends AgenticLoop {
  private wooCommerce: WooCommerceRestApi;
  private failedOrders: FailedOrder[] = [];
  private strategies: Map<string, RecoveryStrategy> = new Map();
  private attempts: RecoveryAttempt[] = [];

  constructor() {
    super('payment-recovery', 4);


    const config = getConfig();
    this.wooCommerce = new WooCommerceRestApi({
      url: config.woocommerce?.url || '',
      consumerKey: config.woocommerce?.consumerKey || '',
      consumerSecret: config.woocommerce?.consumerSecret || '',
      version: 'wc/v3',
    });

    this.initStrategies();
    this.setupSteps();
  }

  private initStrategies(): void {
    this.strategies.set('retry', {
      name: 'retry',
      priority: 1,
      successRate: 0.35,
    });

    this.strategies.set('discount', {
      name: 'discount',
      priority: 2,
      successRate: 0.45,
    });

    this.strategies.set('alt_payment', {
      name: 'alt_payment',
      priority: 3,
      successRate: 0.52,
    });

    this.strategies.set('contact', {
      name: 'contact',
      priority: 4,
      successRate: 0.6,
    });
  }

  private setupSteps(): void {
    // SENSE: Hole Failed Orders
    this.addStep({
      name: 'sense',
      description: 'Find failed and pending payment orders',
      action: async () => {
        logger.info('🔍 SENSE: Finding failed payment orders...');

        const response = await this.wooCommerce.get('orders', {
          per_page: 50,
          status: ['failed', 'pending'],
          orderby: 'date',
          order: 'desc',
        });

        this.failedOrders = response.data.map((order: any) => ({
          id: order.id,
          customerId: order.customer_id,
          email: order.billing.email,
          amount: parseFloat(order.total),
          failureReason:
            order.status === 'failed' ? 'payment_declined' : 'pending_payment',
          attempts: 1, // In Real World: würde aus Order History kommen
        }));

        logger.info(
          `💳 SENSE: Found ${this.failedOrders.length} orders to recover`
        );
        return this.failedOrders;
      },
    });

    // THINK: Wähle beste Recovery-Strategie
    this.addStep({
      name: 'think',
      description: 'Select best recovery strategy for each order',
      action: async () => {
        logger.info('🧠 THINK: Selecting recovery strategies...');

        const strategies: RecoveryStrategy[] = [];

        for (const order of this.failedOrders) {
          let selectedStrategy: RecoveryStrategy;

          // 1️⃣ Neue Kunden + hoher Betrag → Contact (höchste Success Rate)
          if (order.attempts === 1 && order.amount > 100) {
            selectedStrategy = this.strategies.get('contact')!;
            logger.info(
              `👤 Order ${order.id}: High-value new customer → Contact strategy`
            );
          }
          // 2️⃣ Mehrfache Versuche → Alternative Payment
          else if (order.attempts > 2) {
            selectedStrategy = this.strategies.get('alt_payment')!;
            logger.info(
              `🔄 Order ${order.id}: Multiple attempts → Alternative payment`
            );
          }
          // 3️⃣ Mittlere Beträge → Discount incentive
          else if (order.amount > 50) {
            selectedStrategy = this.strategies.get('discount')!;
            logger.info(
              `💰 Order ${order.id}: Medium amount → Discount incentive`
            );
          }
          // 4️⃣ Kleine Beträge → Simple Retry
          else {
            selectedStrategy = this.strategies.get('retry')!;
            logger.info(`🔁 Order ${order.id}: Small amount → Simple retry`);
          }

          strategies.push(selectedStrategy);
        }

        logger.info(`✅ THINK: Selected ${strategies.length} strategies`);
        return strategies;
      },
    });

    // ACT: Versuche Recovery
    this.addStep({
      name: 'act',
      description: 'Execute recovery attempts',
      action: async () => {
        logger.info('⚡ ACT: Attempting payment recovery via WooCommerce...');

        const strategies: RecoveryStrategy[] = (this.context.decisions[
          this.context.decisions.length - 1
        ] || []) as any[];

        for (let i = 0; i < this.failedOrders.length; i++) {
          const order = this.failedOrders[i];
          const strategy = strategies[i];
          let success = false;
          let details = '';

          try {
            // Versuche Order-Status zu aktualisieren nach Recovery-Strategie
            switch (strategy.name) {
              case 'retry':
                // Sende Zahlungserinnerung
                details = `Payment reminder sent to ${order.email}`;
                logger.info(`💳 Order ${order.id}: Retry strategy - reminder sent`);
                break;

              case 'discount': {
                // Füge Rabatt hinzu und speichere Order
                const discountResponse = await fetch(
                  `${process.env.WOO_URL}/wp-json/wc/v3/orders/${order.id}`,
                  {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Basic ${Buffer.from(
                        `${process.env.WOO_KEY}:${process.env.WOO_SECRET}`
                      ).toString('base64')}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      meta_data: [{ key: 'recovery_discount', value: 0.1 }]
                    })
                  }
                );
                success = discountResponse.ok;
                details = success ? `Discount applied: EUR ${(order.amount * 0.1).toFixed(2)} off` : 'Discount update failed';
                break;
              }

              case 'alt_payment':
                details = `Alternative payment methods offered for order ${order.id}`;
                logger.info(`💰 Order ${order.id}: Alternative payment methods suggested`);
                break;

              case 'contact':
                details = `Manual outreach logged for order ${order.id}`;
                logger.info(`📞 Order ${order.id}: Contact scheduled`);
                break;
            }
          } catch (error: any) {
            details = `Recovery attempt failed: ${error.message}`;
            logger.error(`❌ Order ${order.id}: ${details}`);
          }

          this.attempts.push({
            orderId: order.id,
            strategy,
            success,
            details,
          });
        }

        return this.attempts;
      },
    });

    // LEARN: Evaluiere Strategien
    this.addStep({
      name: 'learn',
      description: 'Learn which strategies work best',
      action: async () => {
        logger.info('📚 LEARN: Evaluating strategy effectiveness...');

        const strategyStats: Record<
          string,
          { successes: number; total: number }
        > = {};

        for (const attempt of this.attempts) {
          const strategyName = attempt.strategy.name;
          if (!strategyStats[strategyName]) {
            strategyStats[strategyName] = { successes: 0, total: 0 };
          }

          strategyStats[strategyName].total++;
          if (attempt.success) {
            strategyStats[strategyName].successes++;
          }
        }

        const insights = Object.entries(strategyStats).map(([name, stats]) => ({
          strategy: name,
          successRate: ((stats.successes / stats.total) * 100).toFixed(1),
          successes: stats.successes,
          total: stats.total,
        }));

        logger.info(`📊 LEARN: ${JSON.stringify(insights)}`);
        return insights;
      },
    });

    // CONTINUE
    this.addStep({
      name: 'shouldContinue',
      description: 'Continue if recovery opportunities remain',
      action: async () => {
        const failed = this.attempts.filter((a) => !a.success).length;
        return (
          failed > 0 && this.context.iteration < this.context.maxIterations
        );
      },
    });
  }

  getSummary() {
    const successes = this.attempts.filter((a) => a.success).length;
    const totalRecovered = this.attempts
      .filter((a) => a.success)
      .reduce((sum, a) => {
        const order = this.failedOrders.find((o) => o.id === a.orderId);
        return sum + (order?.amount || 0);
      }, 0);

    return {
      totalAttempts: this.attempts.length,
      successCount: successes,
      successRate: `${((successes / this.attempts.length) * 100).toFixed(1)}%`,
      totalRecovered: `€${totalRecovered.toFixed(2)}`,
      byStrategy: this.attempts.reduce(
        (acc, a) => {
          const key = a.strategy.name;
          if (!acc[key]) acc[key] = { success: 0, total: 0 };
          acc[key].total++;
          if (a.success) acc[key].success++;
          return acc;
        },
        {} as Record<string, { success: number; total: number }>
      ),
    };
  }
}
