import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsMLService } from '../../../../services/analyticsMLService';
import { wooGet } from '../../../../tools/woo';

export default async function mlInsightsRoutes(fastify: FastifyInstance) {
  // GET /api/analytics/ml-insights/report
  fastify.get('/report', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type = 'general' } = request.query as { type?: string };

    try {
      // ✅ Echte OpenAI-Integration
      const mlReport = await AnalyticsMLService.generateMLReport({
        type,
        timeframe: '30days'
      });

      return reply.send({
        success: true,
        report: mlReport,
        type,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('ML Report Generation failed:', error);
      // Fallback zu statischen Daten bei Fehler
      return reply.send({
        success: true,
        report: {
          insights: [
            {
              title: 'Shop-Performance',
              value: 'Stabil',
              detail: 'ML-Analyse temporär nicht verfügbar',
              score: 75
            }
          ]
        },
        type,
        timestamp: new Date().toISOString()
      });
    }
  });

  // POST /api/analytics/ml/report - für RealWebAnalytics
  fastify.post('/report', async (request: FastifyRequest, reply: FastifyReply) => {
    const { keywords = [], trendData } = request.body as { 
      keywords?: string[]; 
      trendData?: any;
    };

    console.log('📊 [ML Report] Anfrage erhalten:', {
      keywords: keywords.length,
      hasTrendData: !!trendData,
      trendDataLength: trendData?.length || 0
    });

    try {
      // Berechne durchschnittlichen Score aus Trend-Daten
      const avgScore = trendData && trendData.length > 0
        ? Math.round(trendData.reduce((sum: number, t: any) => sum + (t.overallScore || 0), 0) / trendData.length)
        : 0;

      // Finde Top-Trend (höchster Score)
      const topTrend = trendData && trendData.length > 0
        ? trendData.reduce((max: any, t: any) => (t.overallScore || 0) > (max.overallScore || 0) ? t : max, trendData[0])
        : null;

      console.log('📈 [ML Report] Trend-Statistiken:', {
        avgScore,
        topTrend: topTrend?.keyword,
        topTrendScore: topTrend?.overallScore
      });

      console.log('🤖 [ML Report] Starte OpenAI-Analyse...');

      // ✅ Echte OpenAI-Integration für ausführlichen Trend-Report
      const mlReport = await AnalyticsMLService.generateInsights({
        metrics: keywords,
        shopData: {
          totalProducts: keywords.length,
          avgTrendScore: avgScore,
          topTrend: topTrend?.keyword || keywords[0],
          trendData: trendData
        },
        timeframe: '30days'
      });

      console.log('✅ [ML Report] OpenAI-Analyse erfolgreich:', {
        insightsCount: mlReport.insights?.length || 0,
        confidenceScore: mlReport.confidence_score,
        nextStepsCount: mlReport.next_steps?.length || 0
      });

      // Generiere ausführlichen, formatierten Report
      const reportSections = [
        `📊 **PRODUKT-TREND-ANALYSE**`,
        `Analysierte Produkte: ${keywords.length}`,
        `Durchschnittlicher Trend-Score: ${avgScore}/100`,
        topTrend ? `🏆 Top-Trend: "${topTrend.keyword}" (Score: ${topTrend.overallScore}/100)` : '',
        '',
        `🧠 **KI-INSIGHTS**`,
        ...mlReport.insights.map((insight, i) => {
          const icon = insight.impact === 'high' ? '🔴' : insight.impact === 'medium' ? '🟡' : '🟢';
          return `\n${i + 1}. ${icon} **${insight.category}**\n   ${insight.finding}\n   💡 ${insight.recommendation}`;
        }),
        '',
        `📈 **NÄCHSTE SCHRITTE**`,
        ...mlReport.next_steps.map((step, i) => `${i + 1}. ${step}`),
        '',
        `⚙️ Konfidenz-Score: ${mlReport.confidence_score}%`
      ];

      const reportText = reportSections.filter(Boolean).join('\n');

      // Format anpassen für Frontend-Kompatibilität
      return reply.send({
        report: reportText,
        summary: {
          total: keywords.length,
          topTrend: topTrend?.keyword || keywords[0] || 'N/A',
          avgScore: avgScore
        },
        raw: trendData || []
      });
    } catch (error) {
      console.error('ML Trend Report Generation failed:', error);
      // Fallback zu statischen Daten bei Fehler
      return reply.send({
        report: `📊 **PRODUKT-TREND-ANALYSE**\n\nAnalysierte Produkte: ${keywords.length}\n\n⚠️ ML-Analyse temporär nicht verfügbar.\nBitte versuchen Sie es später erneut oder kontaktieren Sie den Support.`,
        summary: {
          total: keywords.length,
          topTrend: keywords[0] || 'N/A',
          avgScore: 65
        },
        raw: trendData || []
      });
    }
  });

  // POST /api/analytics/ml-insights/generate
  fastify.post('/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { metrics = [], shopData, timeframe } = request.body as { 
      metrics?: string[]; 
      shopData?: any;
      timeframe?: string;
    };

    try {
      // ✅ Echte OpenAI-Integration
      const analysis = await AnalyticsMLService.generateInsights({
        metrics: metrics.length > 0 ? metrics : ['sales', 'conversion', 'traffic'],
        shopData,
        timeframe: timeframe || '30days'
      });

      // Transform Backend-Format zu Frontend-Format
      const transformedInsights = analysis.insights.map((insight: any) => {
        // Map category zu type
        const categoryToTypeMap: Record<string, string> = {
          'Performance': 'forecast',
          'Conversion': 'conversion',
          'Traffic': 'segment',
          'Customer': 'segment',
          'Products': 'forecast'
        };
        
        const insightType = categoryToTypeMap[insight.category] || 'anomaly';
        
        return {
          type: insightType,
          value: insight.finding,
          reason: insight.recommendation,
          score: (insight.confidence || 80) / 100,
          category: insight.category,
          impact: insight.impact
        };
      });

      return reply.send({
        success: true,
        insights: transformedInsights,
        confidence_score: analysis.confidence_score,
        next_steps: analysis.next_steps,
        analysis: {
          timestamp: new Date().toISOString(),
          metrics_analyzed: metrics.length > 0 ? metrics : ['sales', 'conversion', 'traffic'],
          insights: transformedInsights,
          confidence_score: analysis.confidence_score,
          next_steps: analysis.next_steps
        }
      });
    } catch (error) {
      console.error('ML Insights Generation failed:', error);
      // Fallback bei Fehler
      const fallbackInsights = [
        {
          category: 'System',
          finding: 'ML-Analyse temporär nicht verfügbar',
          impact: 'low',
          recommendation: 'Bitte später erneut versuchen'
        }
      ];

      return reply.send({
        success: true,
        insights: fallbackInsights,
        confidence_score: 50,
        next_steps: ['API-Status prüfen', 'Erneut versuchen'],
        analysis: {
          timestamp: new Date().toISOString(),
          metrics_analyzed: metrics.length > 0 ? metrics : ['sales', 'conversion', 'traffic'],
          insights: fallbackInsights,
          confidence_score: 50,
          next_steps: ['API-Status prüfen', 'Erneut versuchen']
        }
      });
    }
  });

  // POST /api/analytics/ml-insights/report-insights
  fastify.post('/report-insights', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('📊 Report-Insights: Hole echte WooCommerce-Daten...');
      
      // 1. WooCommerce-Daten abrufen mit wooGet
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let ordersData: any;
      try {
        ordersData = await wooGet('orders', {
          after: thirtyDaysAgo.toISOString(),
          per_page: 100,
          status: 'any'
        });
      } catch (wooError: any) {
        console.error('❌ WooCommerce API Fehler:', wooError.message);
        throw new Error(`WooCommerce API: ${wooError.message}`);
      }

      const orders = Array.isArray(ordersData) ? ordersData : (ordersData?.data || []);
      console.log(`📦 ${orders.length} Orders gefunden`);

      // 2. Conversion-Metriken berechnen
      const completedOrders = orders.filter((o: any) => o.status === 'completed');
      const processingOrders = orders.filter((o: any) => o.status === 'processing');
      const failedOrders = orders.filter((o: any) => ['failed', 'cancelled', 'refunded', 'pending'].includes(o.status));

      const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0);
      const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
      const conversionRate = orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0;

      // 3. OpenAI-Analyse mit echten Daten
      const aiAnalysis = await AnalyticsMLService.analyzeReportData({
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        processingOrders: processingOrders.length,
        failedOrders: failedOrders.length,
        totalRevenue,
        avgOrderValue,
        conversionRate
      });
      console.log('🤖 OpenAI-Analyse abgeschlossen');

      // 4. Response formatieren
      return reply.send({
        success: true,
        insights: aiAnalysis.insights,
        nextSteps: aiAnalysis.nextSteps,
        summary: aiAnalysis.summary,
        summaryDetails: {
          overallScore: aiAnalysis.overallScore,
          trend: aiAnalysis.trend,
          recommendation: aiAnalysis.recommendation
        },
        rawData: {
          totalOrders: orders.length,
          completedOrders: completedOrders.length,
          processingOrders: processingOrders.length,
          failedOrders: failedOrders.length,
          totalRevenue: totalRevenue.toFixed(2),
          avgOrderValue: avgOrderValue.toFixed(2),
          conversionRate: conversionRate.toFixed(1)
        }
      });

    } catch (error: any) {
      console.error('❌ Report-Insights Fehler:', error.message);
      
      // Fallback: Ehrliche Fehlermeldung mit Mock-Struktur
      return reply.send({
        success: false,
        error: error.message,
        insights: [
          {
            title: 'Datenquelle nicht verfügbar',
            description: `Fehler beim Abrufen der WooCommerce-Daten: ${error.message}`,
            confidence: 0
          }
        ],
        nextSteps: [
          {
            title: 'WooCommerce-Verbindung prüfen',
            description: 'Stelle sicher, dass die WooCommerce-API-Zugangsdaten korrekt sind',
            criticality: 'critical'
          }
        ],
        summary: 'Analyse konnte nicht durchgeführt werden - WooCommerce-Verbindung fehlgeschlagen',
        summaryDetails: {
          overallScore: 0,
          trend: 'unknown',
          recommendation: 'Technische Probleme beheben'
        }
      });
    }
  });
}
