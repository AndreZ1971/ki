import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface MLInsight {
  type: string;
  title: string;
  value?: string;
  score?: number;
  detail?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  category?: string;
}

interface ConversionMetrics {
  overallRate?: number;
  cartAbandonment?: number;
  checkoutCompletion?: number;
  mobileRate?: number;
  desktopRate?: number;
  returningCustomers?: number;
  newCustomers?: number;
}

export async function registerConversionMLAnalysis(server: FastifyInstance) {
  server.post<{ Body: { data: ConversionMetrics } }>(
    '/ml-analysis',
    async (request: FastifyRequest<{ Body: { data: ConversionMetrics } }>, reply: FastifyReply) => {
      try {
        const { data } = request.body;
        const mlInsights: MLInsight[] = [];

        // Analyse 1: Geringe Conversion-Rate
        if (data?.overallRate && data.overallRate < 2.5) {
          mlInsights.push({
            type: 'Low_Conversion_Rate',
            title: '📊 Geringe Conversion-Rate erkannt',
            value: `${data.overallRate}%`,
            priority: 'high',
            detail: 'Die Conversion-Rate liegt unter dem Branchendurchschnitt von 2.5%',
            category: 'performance',
            score: data.overallRate
          });
        }

        // Analyse 2: Hohe Warenkorbabbruch-Rate
        if (data?.cartAbandonment && data.cartAbandonment > 65) {
          mlInsights.push({
            type: 'High_Cart_Abandonment',
            title: '🛒 Kritisch: Hohe Warenkorbabbruch-Rate',
            value: `${data.cartAbandonment}%`,
            priority: 'critical',
            detail: 'Benutzer brechen den Checkout-Prozess ab - Optimierung notwendig',
            category: 'critical_issue',
            score: data.cartAbandonment
          });
        }

        // Analyse 3: Mobile vs Desktop Unterschied
        if (data?.mobileRate && data?.desktopRate && data.mobileRate < data.desktopRate * 0.5) {
          mlInsights.push({
            type: 'Mobile_Optimization_Gap',
            title: '📱 Mobile Conversion deutlich niedriger',
            value: `Mobile: ${data.mobileRate}% | Desktop: ${data.desktopRate}%`,
            priority: 'high',
            detail: 'Mobile-Benutzer konvertieren weniger als die Hälfte der Desktop-Benutzer',
            category: 'optimization',
            score: data.mobileRate
          });
        }

        // Analyse 4: Niedriges Returning-Customer-Engagement
        if (data?.returningCustomers && data.returningCustomers < 3.0) {
          mlInsights.push({
            type: 'Low_Returning_Customer_Rate',
            title: '🔄 Niedriges Rückkäufer-Engagement',
            value: `${data.returningCustomers}%`,
            priority: 'medium',
            detail: 'Wiederholungskäufe sind niedrig - Retention-Strategie verbessern',
            category: 'retention',
            score: data.returningCustomers
          });
        }

        // Analyse 5: Checkout-Completion unter Erwartung
        if (data?.checkoutCompletion && data.checkoutCompletion < 30) {
          mlInsights.push({
            type: 'Low_Checkout_Completion',
            title: '✅ Niedriger Checkout-Abschluss',
            value: `${data.checkoutCompletion}%`,
            priority: 'high',
            detail: `Nur ${data.checkoutCompletion}% der Nutzer schließen den Checkout ab`,
            category: 'conversion_funnel',
            score: data.checkoutCompletion
          });
        }

        // Analyse 6: Neue vs Rückkäufer Balance
        if (data?.newCustomers && data?.returningCustomers) {
          const ratio = data.returningCustomers / data.newCustomers;
          if (ratio > 2.0) {
            mlInsights.push({
              type: 'Strong_Customer_Loyalty',
              title: '⭐ Starke Kundengetreue erkannt',
              value: `Rückkäufer:Neukunden Verhältnis ${ratio.toFixed(2)}:1`,
              priority: 'low',
              detail: 'Ihre Kundenbindung ist überdurchschnittlich gut',
              category: 'positive',
              score: ratio
            });
          }
        }

        // Analyse 7: Gesamtperformance-Bewertung
        if (mlInsights.length === 0) {
          mlInsights.push({
            type: 'Solid_Overall_Performance',
            title: '✅ Conversion-Performance insgesamt solid',
            value: `${data?.overallRate || 2.8}%`,
            priority: 'low',
            detail: 'Ihre Konversionsmetriken sind im guten Bereich',
            category: 'positive',
            score: data?.overallRate || 2.8
          });
        }

        // Analyse 8: Optimierungsstrategie (immer)
        mlInsights.push({
          type: 'Conversion_Optimization_Strategy',
          title: '🎯 Empfohlene Optimierungsstrategie',
          detail: '1. A/B-Tests für Checkout-Flow durchführen\n2. Mobile UX verbessern\n3. Trust-Signale auf Produktseiten erhöhen\n4. Exit-Intent-Popups implementieren\n5. Personalisierung für Wiederholungskäufer',
          priority: 'medium',
          category: 'strategy'
        });

        return reply.send({
          success: true,
          mlInsights: mlInsights.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return (priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low']);
          })
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: 'ML-Analyse fehlgeschlagen',
          message: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
      }
    }
  );
}
