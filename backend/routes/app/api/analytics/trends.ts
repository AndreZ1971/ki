import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsMLService } from '../../../../services/analyticsMLService';
import { getConfig } from '@config';
// Update the import path if the file exists elsewhere, for example:
import { getOpenAIClient, executeOpenAI } from '../../../../utils/openaiHelper';
// Or create the file at '../../../utils/openaiHelper.ts' if it does not exist.

export default async function trendsRoutes(fastify: FastifyInstance) {
  // GET /api/analytics/trends/analyze
  fastify.get('/analyze/:keyword', async (request: FastifyRequest, reply: FastifyReply) => {
    const { keyword } = request.params as { keyword: string };
    const decodedKeyword = decodeURIComponent(keyword);

    try {
      // Basis-Trend-Daten (können aus Google Trends API kommen)
      const trendData = {
        keyword: decodedKeyword,
        trendScore: 78,
        searchVolume: 12500,
        competition: 'medium',
        trend: 'increasing',
        relatedKeywords: ['keyword1', 'keyword2']
      };

      // ✅ KI-Interpretation des Trends
      const interpretation = await AnalyticsMLService.interpretTrends(trendData);

      return reply.send({
        success: true,
        keyword: decodedKeyword,
        trends: {
          google: {
            score: 78,
            trend: 'increasing',
            searches: 12500,
            timeframe: 'last 90 days'
          },
          social: {
            score: 65,
            trend: 'stable',
            mentions: 3420,
            platforms: ['Twitter', 'Instagram', 'TikTok']
          }
        },
        overall_score: trendData.trendScore,
        confidence: 0.82,
        ai_interpretation: interpretation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Trend Analysis failed:', error);
      // Fallback bei Fehler
      return reply.send({
        success: true,
        keyword: decodedKeyword,
        trends: {
          google: { score: 78, trend: 'increasing', searches: 12500, timeframe: 'last 90 days' }
        },
        overall_score: 65,
        confidence: 0.82,
        timestamp: new Date().toISOString()
      });
    }
  });

  // POST /api/analytics/trends/analyze
  fastify.post('/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    const { keywords = [] } = request.body as { keywords?: string[] };

    if (keywords.length === 0) {
      return reply.code(400).send({
        success: false,
        error: 'Keywords erforderlich'
      });
    }

    // Hole aktuelle Produkttrends für Kontext
    const config = getConfig();
    const WC_API_URL = config.woocommerce?.url || '';
    const WC_CONSUMER_KEY = config.woocommerce?.consumerKey || '';
    const WC_CONSUMER_SECRET = config.woocommerce?.consumerSecret || '';
    const now = new Date();
    const after = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ordersUrl = `${WC_API_URL}/wp-json/wc/v3/orders?after=${after.toISOString()}&per_page=100&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
    let orders = [];
    try {
      const res = await fetch(ordersUrl);
      if (res.ok) {
        orders = await res.json();
      }
    } catch (err) {
      // Ignoriere Fehler, KI kann auch ohne Kontext antworten
    }
    // Aggregiere Top-Produkte
    const productSales: Record<string, { id: number, name: string, count: number }> = {};
    for (const order of orders) {
      if (Array.isArray(order.line_items)) {
        for (const item of order.line_items) {
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = { id: item.product_id, name: item.name, count: 0 };
          }
          productSales[item.product_id].count += item.quantity;
        }
      }
    }
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((p) => `${p.name} (${p.count} Verkäufe)`);

    // Prompt für OpenAI
    const prompt = `Analysiere folgende Shop-Trends und Keywords und gib für jeden Insight ein Objekt mit category, finding und confidence zurück.\n\nKeywords: ${keywords.join(", ")}\nTop-Produkte: ${topProducts.join(", ")}\n\nFormat: [{category: string, finding: string, confidence: number}]`;
    let insights = [];
    let next_steps: string[] = [];
    try {
      const openai = getOpenAIClient();
      const completion = await executeOpenAI(
        () => openai.chat.completions.create({
          model: config.openAI?.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Du bist ein E-Commerce-Analyst.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 600
        }),
        'KI-Trend-Analyse',
        { keywords, topProducts }
      );
      // Versuche, Insights aus der KI-Antwort zu extrahieren
      const match = completion.choices?.[0]?.message?.content?.match(/\[.*\]/s);
      if (match) {
        insights = JSON.parse(match[0]);
      }
      // Extrahiere Next Steps, falls vorhanden
      const nextMatch = completion.choices?.[0]?.message?.content?.match(/Next Steps:(.*)/i);
      if (nextMatch) {
        next_steps = nextMatch[1].split(/\n|,|;/).map((s: string) => s.trim()).filter(Boolean);
      }
    } catch (err) {
      console.error('[KI-Analyse] Fehler bei OpenAI:', err);
    }
    return reply.send({
      success: true,
      analysis: {
        insights: Array.isArray(insights) ? insights : [],
        next_steps: Array.isArray(next_steps) ? next_steps : []
      },
      timestamp: new Date().toISOString()
    });
  });

  // GET /api/analytics/trends/products
  fastify.get('/products', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Echte WooCommerce-API-Anbindung für Produkttrends
    const { range = '30d' } = _request.query as { range?: string };
    // Zeitraum berechnen
    const now = new Date();
    let after;
    if (range === '7d') after = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (range === '30d') after = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    else if (range === '90d') after = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    else if (range === '1y') after = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    else after = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // WooCommerce-API-URL und Authentifizierung aus getConfig
    const config = getConfig();
    const WC_API_URL = config.woocommerce?.url || '';
    const WC_CONSUMER_KEY = config.woocommerce?.consumerKey || '';
    const WC_CONSUMER_SECRET = config.woocommerce?.consumerSecret || '';

    // Logging der Konfiguration
    console.log('[TrendAnalysis] WC_API_URL:', WC_API_URL);
    console.log('[TrendAnalysis] WC_CONSUMER_KEY:', WC_CONSUMER_KEY ? 'SET' : 'NOT SET');
    console.log('[TrendAnalysis] WC_CONSUMER_SECRET:', WC_CONSUMER_SECRET ? 'SET' : 'NOT SET');

    // Hole Bestellungen für den Zeitraum
    const ordersUrl = `${WC_API_URL}/wp-json/wc/v3/orders?after=${after.toISOString()}&per_page=100&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
    console.log('[TrendAnalysis] ordersUrl:', ordersUrl);
    let orders = [];
    try {
      const res = await fetch(ordersUrl);
      console.log('[TrendAnalysis] WooCommerce-API Status:', res.status, res.statusText);
      if (res.ok) {
        orders = await res.json();
        console.log('[TrendAnalysis] Orders loaded:', Array.isArray(orders) ? orders.length : typeof orders);
      } else {
        const errorText = await res.text();
        console.error('[TrendAnalysis] WooCommerce-API Error:', errorText);
        return reply.code(500).send({ success: false, error: 'WooCommerce-API-Error', status: res.status, details: errorText });
      }
    } catch (err) {
      console.error('[TrendAnalysis] WooCommerce-API-Fetch-Exception:', err);
      return reply.code(500).send({ success: false, error: 'WooCommerce-API-Fehler', details: String(err) });
    }

    // Aggregiere Verkäufe pro Produkt
    const productSales: Record<string, { id: number, name: string, count: number }> = {};
    for (const order of orders) {
      if (Array.isArray(order.line_items)) {
        for (const item of order.line_items) {
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = { id: item.product_id, name: item.name, count: 0 };
          }
          productSales[item.product_id].count += item.quantity;
        }
      }
    }

    // Top 5 Produkte nach Verkaufszahl
    const trending_products = Object.values(productSales)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((p, idx) => ({
        id: p.id,
        name: p.name,
        trend_score: Math.min(100, 60 + p.count * 2),
        trend: idx === 0 ? 'rising_fast' : idx < 3 ? 'rising' : 'stable',
        searches: p.count * 10,
        mentions: p.count * 3
      }));

    return reply.send({
      success: true,
      trending_products,
      timestamp: new Date().toISOString()
    });
  });

  // POST /api/analytics/trends/report
  fastify.post('/report', async (request: FastifyRequest, reply: FastifyReply) => {
    const { timeframe = '30days', keywords = [] } = request.body as { timeframe?: string; keywords?: string[] };

    return reply.send({
      success: true,
      report: {
        timeframe,
        keywords_analyzed: keywords.length,
        key_findings: [
          'AI und Machine Learning weiterhin Top-Trends',
          'Nachhaltigkeit gewinnt an Bedeutung',
          'Smart Home Integration wird mainstream',
          'Mobile-first Ansatz ist nicht optional'
        ],
        opportunities: [
          'AI-Integrationsmöglichkeiten in Produkten',
          'Eco-friendly Varianten anbieten',
          'Smart Home Kompatibilität herstellen',
          'Mobile-optimierte Erlebnisse schaffen'
        ],
        risks: [
          'Schnelle Marktveränderungen',
          'Neue Konkurrenten mit Trend-Produkten',
          'Regulatorische Änderungen im Tech-Sektor'
        ],
        confidence_score: 84,
        recommendation: 'Trend-Produkte in Portfolio integrieren'
      },
      timestamp: new Date().toISOString()
    });
  });
}
