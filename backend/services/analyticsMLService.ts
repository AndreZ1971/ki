// services/analyticsMLService.ts
import { getOpenAIClient, executeOpenAI } from '../utils/openaiHelper';
import { getConfig } from '../config';
import { logger } from '../logger';

const OPENAI_MODEL = getConfig().openAI?.model?.trim() || 'gpt-4-turbo';

export interface MLInsight {
  category: string;
  finding: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  confidence?: number;
}

export interface ConversionInsight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  expectedImpact: string;
}

export interface RegionalInsight {
  title: string;
  description: string;
  confidence: number;
  action: string;
}

export interface TrendInsight {
  keyword: string;
  interpretation: string;
  opportunity: string;
  risk: string;
  recommendation: string;
}

export class AnalyticsMLService {
  /**
   * Generiert KI-basierte Insights für allgemeine Analytics-Daten
   */
  static async generateInsights(data: {
    metrics?: string[];
    shopData?: any;
    timeframe?: string;
  }): Promise<{ insights: MLInsight[]; confidence_score: number; next_steps: string[] }> {
    const openai = getOpenAIClient();

    logger.info({
      metricsCount: data.metrics?.length || 0,
      hasShopData: !!data.shopData,
      timeframe: data.timeframe
    }, 'Analytics generateInsights called');

    const prompt = `Du bist ein E-Commerce Analytics-Experte. Analysiere die folgenden Shop-Daten und gebe actionable Insights.

Metriken: ${data.metrics?.join(', ') || 'sales, conversion, traffic'}
Shop-Daten: ${JSON.stringify(data.shopData || {}, null, 2)}
Zeitraum: ${data.timeframe || '30 Tage'}

Erstelle 5 konkrete Insights im folgenden JSON-Format:
{
  "insights": [
    {
      "category": "Performance|Conversion|Traffic|Customer|Products",
      "finding": "Konkrete Beobachtung aus den Daten",
      "impact": "high|medium|low",
      "recommendation": "Konkrete Handlungsempfehlung",
      "confidence": 0-100
    }
  ],
  "confidence_score": 0-100,
  "next_steps": ["Schritt 1", "Schritt 2", "Schritt 3"]
}

Fokus: Actionable, datenbasierte Empfehlungen für E-Commerce-Optimierung.`;

    try {
      logger.info('Sending request to OpenAI for analytics insights');
      const completion = await executeOpenAI(
        () => openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Du bist ein E-Commerce Analytics-Experte mit Fokus auf WooCommerce/WordPress. Deine Analysen sind datenbasiert, actionable und ROI-orientiert.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
        'Analytics Insights Generation',
        { metrics: data.metrics, timeframe: data.timeframe }
      );

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      logger.info({
        insightsCount: result.insights?.length || 0,
        confidenceScore: result.confidence_score,
        hasNextSteps: !!result.next_steps
      }, 'OpenAI response received for analytics');
      return {
        insights: result.insights || [],
        confidence_score: result.confidence_score || 85,
        next_steps: result.next_steps || []
      };
    } catch (error) {
      logger.error({
        error,
        function: 'generateInsights',
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      }, 'Analytics insights generation failed');
      // Fallback zu strukturierten Dummy-Daten bei Fehler
      return {
        insights: [
          {
            category: 'Performance',
            finding: 'Analyse temporär nicht verfügbar',
            impact: 'medium',
            recommendation: 'Bitte später erneut versuchen',
            confidence: 50
          }
        ],
        confidence_score: 50,
        next_steps: ['Daten prüfen', 'Erneut versuchen']
      };
    }
  }

  /**
   * Analysiert Conversion-Daten mit KI
   */
  static async analyzeConversion(conversionData: {
    overallRate: number;
    cartAbandonment: number;
    checkoutCompletion: number;
    mobileRate: number;
    desktopRate: number;
    timeframe?: string;
  }): Promise<ConversionInsight[]> {
    const openai = getOpenAIClient();

    const prompt = `Analysiere die folgenden Conversion-Daten eines WooCommerce Shops:

Gesamt-Conversion-Rate: ${conversionData.overallRate}%
Warenkorb-Abbruch: ${conversionData.cartAbandonment}%
Checkout-Abschluss: ${conversionData.checkoutCompletion}%
Mobile-Conversion: ${conversionData.mobileRate}%
Desktop-Conversion: ${conversionData.desktopRate}%

Erstelle 4 priorisierte Insights zur Conversion-Optimierung im JSON-Format:
{
  "insights": [
    {
      "title": "Kurzer prägnanter Titel",
      "description": "Detaillierte Beschreibung des Problems/der Chance",
      "priority": "high|medium|low",
      "action": "Konkrete Handlungsempfehlung",
      "expectedImpact": "Erwartete Verbesserung (z.B. '+0.5% Conversion')"
    }
  ]
}

Fokus: Quick Wins und High-Impact-Optimierungen für E-Commerce.`;

    try {
      const completion = await executeOpenAI(
        () => openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Conversion-Rate-Optimization (CRO) Experte für E-Commerce. Deine Empfehlungen sind testbar und ROI-fokussiert.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.6,
          response_format: { type: 'json_object' }
        }),
        'Conversion Analysis',
        { conversionData }
      );

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return result.insights || [];
    } catch (error) {
      logger.error({ error, function: 'analyzeConversionData' }, 'Conversion analysis failed');
      return [
        {
          title: 'Analyse temporär nicht verfügbar',
          description: 'Die KI-Analyse konnte nicht durchgeführt werden.',
          priority: 'medium',
          action: 'Bitte später erneut versuchen',
          expectedImpact: 'N/A'
        }
      ];
    }
  }

  /**
   * Generiert regionale ML-Insights
   */
  static async analyzeRegion(regionData: {
    region: string;
    sales: number;
    orders: number;
    growth: number;
    topProducts?: string[];
  }): Promise<RegionalInsight[]> {
    const openai = getOpenAIClient();

    const prompt = `Analysiere die Performance der Region "${regionData.region}" für einen E-Commerce Shop:

Umsatz: ${regionData.sales}
Bestellungen: ${regionData.orders}
Wachstumsrate: ${regionData.growth}%
Top-Produkte: ${regionData.topProducts?.join(', ') || 'Nicht verfügbar'}

Erstelle 5 ML-basierte Insights für regionale Optimierung im JSON-Format:
{
  "insights": [
    {
      "title": "Insight-Titel",
      "description": "Detaillierte regionale Analyse",
      "confidence": 0-100,
      "action": "Konkrete Handlungsempfehlung für diese Region"
    }
  ]
}

Fokus: Regionale Besonderheiten, Wachstumspotenziale, lokale Optimierungen.`;

    try {
      const completion = await executeOpenAI(
        () => openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Du bist ein International E-Commerce Experte mit Fokus auf regionale Marktoptimierung und Geo-Targeting.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
        'Regional Analysis',
        { region: regionData.region }
      );

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return result.insights || [];
    } catch (error) {
      logger.error({ error, function: 'analyzeRegionalData' }, 'Regional analysis failed');
      return [
        {
          title: 'Analyse temporär nicht verfügbar',
          description: 'Die regionale KI-Analyse konnte nicht durchgeführt werden.',
          confidence: 50,
          action: 'Bitte später erneut versuchen'
        }
      ];
    }
  }

  /**
   * Interpretiert Trend-Daten mit KI
   */
  static async interpretTrends(trendData: {
    keyword: string;
    trendScore: number;
    searchVolume?: number;
    competition?: string;
    trend?: string;
    relatedKeywords?: string[];
  }): Promise<TrendInsight> {
    const openai = getOpenAIClient();

    const prompt = `Interpretiere den folgenden Trend für E-Commerce:

Keyword: "${trendData.keyword}"
Trend-Score: ${trendData.trendScore}/100
Suchvolumen: ${trendData.searchVolume || 'N/A'}
Wettbewerb: ${trendData.competition || 'N/A'}
Trend-Richtung: ${trendData.trend || 'N/A'}
Verwandte Keywords: ${trendData.relatedKeywords?.join(', ') || 'N/A'}

Erstelle eine umfassende Trend-Interpretation im JSON-Format:
{
  "keyword": "${trendData.keyword}",
  "interpretation": "Was bedeutet dieser Trend für E-Commerce?",
  "opportunity": "Konkrete Geschäftschance",
  "risk": "Potenzielle Risiken",
  "recommendation": "Actionable Empfehlung für Produktstrategie"
}

Fokus: Business-Relevanz, Marktchancen, Timing-Empfehlungen.`;

    try {
      const completion = await executeOpenAI(
        () => openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Trend-Analyst für E-Commerce mit Fokus auf Produktstrategie und Market Timing.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
        'Trend Interpretation',
        { keyword: trendData.keyword }
      );

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return {
        keyword: trendData.keyword,
        interpretation: result.interpretation || 'Keine Interpretation verfügbar',
        opportunity: result.opportunity || 'N/A',
        risk: result.risk || 'N/A',
        recommendation: result.recommendation || 'N/A'
      };
    } catch (error) {
      logger.error({ error, function: 'interpretTrendData' }, 'Trend interpretation failed');
      return {
        keyword: trendData.keyword,
        interpretation: 'Analyse temporär nicht verfügbar',
        opportunity: 'N/A',
        risk: 'N/A',
        recommendation: 'Bitte später erneut versuchen'
      };
    }
  }

  /**
   * Generiert einen umfassenden ML-Report
   */
  static async generateMLReport(reportData: {
    type: string;
    metrics?: any;
    timeframe?: string;
  }): Promise<{ insights: Array<{ title: string; value: string; detail: string; score: number }> }> {
    const openai = getOpenAIClient();

    const prompt = `Erstelle einen ${reportData.type}-Report für E-Commerce Analytics:

Metriken: ${JSON.stringify(reportData.metrics || {}, null, 2)}
Zeitraum: ${reportData.timeframe || '30 Tage'}

Erstelle 4 prägnante Insights im JSON-Format:
{
  "insights": [
    {
      "title": "Kurzer Insight-Titel",
      "value": "Kennzahl (z.B. '+12.5%' oder '4.7/5')",
      "detail": "Kontext und Bedeutung",
      "score": 0-100
    }
  ]
}

Fokus: Positive Entwicklungen, Quick Wins, High-Impact Bereiche.`;

    try {
      const completion = await executeOpenAI(
        () => openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Business Intelligence Analyst für E-Commerce. Deine Reports sind prägnant, positiv und handlungsorientiert.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.6,
          response_format: { type: 'json_object' }
        }),
        'ML Report Generation',
        { type: reportData.type }
      );

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return { insights: result.insights || [] };
    } catch (error) {
      logger.error({ error, function: 'generateMLReport' }, 'ML report generation failed');
      return {
        insights: [
          {
            title: 'Report temporär nicht verfügbar',
            value: 'N/A',
            detail: 'Die ML-Report-Generierung konnte nicht durchgeführt werden.',
            score: 50
          }
        ]
      };
    }
  }

  /**
   * Analysiert Conversion-Report-Daten mit OpenAI
   */
  static async analyzeReportData(reportContext: {
    totalOrders: number;
    completedOrders: number;
    processingOrders: number;
    failedOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    conversionRate: number;
  }): Promise<{
    insights: Array<{ title: string; description: string; confidence: number }>;
    nextSteps: Array<{ title: string; description: string; criticality: string }>;
    summary: string;
    overallScore: number;
    trend: string;
    recommendation: string;
  }> {
    const openai = getOpenAIClient();

    logger.info({ reportContext }, 'Analytics analyzeReportData called');

    const prompt = `Analysiere diese echten WooCommerce-Conversion-Daten und gebe professionelle Business-Insights:

**Bestellungen (letzte 30 Tage):**
- Gesamt: ${reportContext.totalOrders}
- Abgeschlossen: ${reportContext.completedOrders}
- In Bearbeitung: ${reportContext.processingOrders}
- Fehlgeschlagen/Storniert: ${reportContext.failedOrders}

**Umsatz:**
- Gesamtumsatz: €${reportContext.totalRevenue.toFixed(2)}
- Ø Bestellwert: €${reportContext.avgOrderValue.toFixed(2)}
- Conversion-Rate: ${reportContext.conversionRate.toFixed(1)}%

Erstelle eine ehrliche, datenbasierte Analyse. Antworte IMMER in validem JSON-Format:

{
  "insights": [
    {"title": "Insight-Titel", "description": "Detaillierte Erklärung basierend auf Daten", "confidence": 85}
  ],
  "nextSteps": [
    {"title": "Maßnahme", "description": "Konkrete Handlungsempfehlung", "criticality": "good|warning|critical"}
  ],
  "summary": "1-2 Sätze Zusammenfassung der wichtigsten Erkenntnisse",
  "overallScore": 75,
  "trend": "positive|neutral|negative",
  "recommendation": "Hauptempfehlung für nächste Schritte"
}`;

    try {
      const completion = await executeOpenAI(
        () => openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Du bist ein E-Commerce Analytics Experte. Analysiere Conversion-Daten ehrlich und datenbasiert. Gebe immer valides JSON zurück.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
        'Report Data Analysis',
        reportContext
      );

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      logger.info('OpenAI report analysis successful');
      
      return {
        insights: result.insights || [],
        nextSteps: result.nextSteps || [],
        summary: result.summary || 'Keine Zusammenfassung verfügbar',
        overallScore: result.overallScore || 50,
        trend: result.trend || 'neutral',
        recommendation: result.recommendation || 'Weitere Analyse erforderlich'
      };
    } catch (error) {
      logger.error({ error, function: 'analyzeReportData' }, 'Report data analysis failed');
      throw error;
    }
  }
}
