import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsMLService } from '../../../../services/analyticsMLService';

export default async function regioningRoutes(fastify: FastifyInstance) {
  // GET /api/analytics/regioning/data
  fastify.get('/data', async (request: FastifyRequest, reply: FastifyReply) => {
    const { region } = request.query as { region?: string };

    const regionData = {
      'europe': {
        sales: 45230,
        orders: 324,
        customers: 892,
        revenue_change: 12.5,
        top_products: ['Laptop', 'Monitor', 'Keyboard'],
        growth_rate: 8.2
      },
      'asia': {
        sales: 32150,
        orders: 456,
        customers: 1203,
        revenue_change: 18.3,
        top_products: ['Smartphone', 'Tablet', 'Headphones'],
        growth_rate: 15.7
      },
      'americas': {
        sales: 58900,
        orders: 523,
        customers: 1456,
        revenue_change: 5.2,
        top_products: ['Desktop PC', 'Gaming Console', 'Smartwatch'],
        growth_rate: 3.9
      },
      'africa': {
        sales: 12340,
        orders: 145,
        customers: 289,
        revenue_change: 22.8,
        top_products: ['Accessories', 'Cases', 'Chargers'],
        growth_rate: 21.5
      },
      'oceania': {
        sales: 8920,
        orders: 89,
        customers: 176,
        revenue_change: 9.1,
        top_products: ['Cables', 'Adapters', 'Protectors'],
        growth_rate: 7.3
      }
    };

    const selectedRegion = region || 'europe';
    const data = (regionData as any)[selectedRegion] || regionData['europe'];

    return reply.send({
      success: true,
      region: selectedRegion,
      data,
      all_regions: Object.keys(regionData),
      timestamp: new Date().toISOString()
    });
  });

  // POST /api/analytics/regioning/ml-analysis
  fastify.post('/ml-analysis', async (request: FastifyRequest, reply: FastifyReply) => {
    const { region = 'europe', regionData } = request.body as { 
      region?: string;
      regionData?: any;
    };

    try {
      // Hole aktuelle Region-Daten wenn nicht übergeben
      const dataToAnalyze = regionData || {
        region,
        sales: 45230,
        orders: 324,
        growth: 8.2,
        topProducts: ['Product A', 'Product B', 'Product C']
      };

      // ✅ Echte OpenAI-Integration
      const mlInsights = await AnalyticsMLService.analyzeRegion(dataToAnalyze);

      return reply.send({
        success: true,
        mlInsights,
        region,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Regional ML Analysis failed:', error);
      // Fallback bei Fehler
      return reply.send({
        success: true,
        mlInsights: [
          {
            title: 'Analyse temporär nicht verfügbar',
            description: 'Die regionale ML-Analyse konnte nicht durchgeführt werden.',
            confidence: 50,
            action: 'Bitte später erneut versuchen'
          }
        ],
        region,
        timestamp: new Date().toISOString()
      });
    }
  });

  // GET /api/analytics/regioning/comparison
  fastify.get('/comparison', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      comparison: [
        {
          region: 'Europe',
          sales: 45230,
          growth: 8.2,
          marketShare: 32.1,
          trend: 'up'
        },
        {
          region: 'Asia',
          sales: 32150,
          growth: 15.7,
          marketShare: 22.8,
          trend: 'up'
        },
        {
          region: 'Americas',
          sales: 58900,
          growth: 3.9,
          marketShare: 41.8,
          trend: 'stable'
        },
        {
          region: 'Africa',
          sales: 12340,
          growth: 21.5,
          marketShare: 8.7,
          trend: 'up'
        },
        {
          region: 'Oceania',
          sales: 8920,
          growth: 7.3,
          marketShare: 6.3,
          trend: 'stable'
        }
      ],
      total_sales: 157940,
      timestamp: new Date().toISOString()
    });
  });
}
