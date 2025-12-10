import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsMLService } from '../../../../services/analyticsMLService';

export default async function conversionRoutes(fastify: FastifyInstance) {
  // GET /api/analytics/conversion/analysis
  fastify.get('/analysis', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Dummy-Daten für Conversion Analysis
    return reply.send({
      success: true,
      data: {
        overallRate: 2.8,
        cartAbandonment: 68,
        checkoutCompletion: 32,
        mobileRate: 1.9,
        desktopRate: 3.5,
        returningCustomers: 4.2,
        newCustomers: 1.8,
        lastUpdated: new Date().toISOString()
      }
    });
  });

  // POST /api/analytics/conversion/analyze
  fastify.post('/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    const { timeframe = '30days' } = request.body as { timeframe?: string };
    
    try {
      // Basis-Conversion-Daten
      const conversionData = {
        overallRate: 2.8,
        cartAbandonment: 68,
        checkoutCompletion: 32,
        mobileRate: 1.9,
        desktopRate: 3.5,
        timeframe
      };

      // ✅ KI-basierte Conversion-Analyse
      const aiInsights = await AnalyticsMLService.analyzeConversion(conversionData);

      return reply.send({
        success: true,
        analysis: {
          timeframe,
          totalSessions: 5420,
          totalConversions: 152,
          conversionRate: 2.8,
          averageOrderValue: 82.5,
          cartAbandonment: 68,
          checkoutCompletion: 32,
          mobileConversions: 45,
          desktopConversions: 107,
          returningCustomers: 4.2,
          newCustomers: 1.8,
          topConvertingProducts: [
            { id: 1, name: 'Product A', conversions: 45, rate: 8.5 },
            { id: 2, name: 'Product B', conversions: 32, rate: 6.2 },
            { id: 3, name: 'Product C', conversions: 28, rate: 5.1 }
          ],
          trends: {
            daily: [
              { date: '2025-12-01', rate: 2.5 },
              { date: '2025-12-02', rate: 2.7 },
              { date: '2025-12-03', rate: 2.8 },
              { date: '2025-12-04', rate: 2.9 },
              { date: '2025-12-05', rate: 2.8 }
            ]
          },
          ai_insights: aiInsights
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Conversion Analysis failed:', error);
      // Fallback bei Fehler
      return reply.send({
        success: true,
        analysis: {
          timeframe,
          totalSessions: 5420,
          totalConversions: 152,
          conversionRate: 2.8,
          recommendations: ['KI-Analyse temporär nicht verfügbar']
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  // GET /api/analytics/conversion/funnel
  fastify.get('/funnel', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      funnel: [
        { step: 'Landing Page', visitors: 5420, rate: 100 },
        { step: 'Product View', visitors: 3890, rate: 71.8 },
        { step: 'Add to Cart', visitors: 1240, rate: 31.9 },
        { step: 'Checkout Start', visitors: 840, rate: 67.7 },
        { step: 'Order Complete', visitors: 152, rate: 18.1 }
      ],
      dropoffAnalysis: {
        'Landing to Product': { lost: 1530, rate: 28.2 },
        'Product to Cart': { lost: 2650, rate: 68.1 },
        'Cart to Checkout': { lost: 400, rate: 32.3 },
        'Checkout to Complete': { lost: 688, rate: 81.9 }
      },
      timestamp: new Date().toISOString()
    });
  });
}
