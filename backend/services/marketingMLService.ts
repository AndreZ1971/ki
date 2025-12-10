// backend/services/marketingMLService.ts
import { getOpenAIClient, executeOpenAI } from '../utils/openai';
import config from '../config';

const OPENAI_MODEL = config.openAI?.model?.trim() || 'gpt-4-turbo';

export interface MarketingIdea {
  type: 'copywriting' | 'audience' | 'campaign' | 'content' | 'forecast';
  title: string;
  description: string;
  actionable_steps: string[];
  estimated_impact: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface EmailCampaignIdea {
  subject_lines: string[];
  body_templates: string[];
  cta_variants: string[];
  send_timing: string;
  estimated_open_rate: number;
}

export interface SocialMediaContent {
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook';
  posts: string[];
  hashtags: string[];
  best_posting_times: string[];
  engagement_prediction: number;
}

export class MarketingMLService {
  /**
   * Generiert KI-basierte Marketing-Ideen für Kampagnen
   */
  static async generateMarketingIdeas(data: {
    goal: string;
    audience?: string;
    productInfo?: string;
    budget?: string;
  }): Promise<{ ideas: MarketingIdea[]; campaign_name: string; confidence_score: number }> {
    const openai = getOpenAIClient();

    console.log('🎯 [MarketingMLService] generateMarketingIdeas aufgerufen:', {
      goal: data.goal,
      audience: data.audience,
      hasProductInfo: !!data.productInfo
    });

    const prompt = `Du bist ein Expert Digital Marketing Strategist. Generiere innovative Marketing-Ideen für die folgende Kampagne:

KAMPAGNENZIEL: ${data.goal}
ZIELGRUPPE: ${data.audience || 'Nicht spezifiziert'}
PRODUKTINFO: ${data.productInfo || 'Nicht spezifiziert'}
BUDGET: ${data.budget || 'Nicht spezifiziert'}

Erstelle 5 konkrete, umsetzbare Marketing-Ideen im folgenden JSON-Format:
{
  "ideas": [
    {
      "type": "copywriting|audience|campaign|content|forecast",
      "title": "Kurzer Titel",
      "description": "Detaillierte Beschreibung der Idee",
      "actionable_steps": ["Schritt 1", "Schritt 2", "Schritt 3"],
      "estimated_impact": "high|medium|low",
      "confidence": 0-100
    }
  ],
  "campaign_name": "Kreativ-Name für die Kampagne",
  "confidence_score": 0-100
}

Fokus: Kreativ, datengestützt, sofort umsetzbar für E-Commerce.`;

    try {
      console.log('🔄 [MarketingMLService] Sende Anfrage an OpenAI...');
      const completion = await executeOpenAI(async () => {
        return openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 1500
        });
      }, 'marketing_ideas');

      const content = (completion as any).choices[0]?.message?.content || '{}';
      console.log('✅ [MarketingMLService] OpenAI-Response erhalten');

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { ideas: [], campaign_name: 'Kampagne', confidence_score: 0 };

      return result;
    } catch (error: any) {
      console.error('❌ [MarketingMLService] Fehler bei generateMarketingIdeas:', error.message);
      throw error;
    }
  }

  /**
   * Generiert optimierte Email-Kampagnen-Templates mit KI
   */
  static async generateEmailCampaign(data: {
    productName: string;
    productDesc: string;
    targetAudience: string;
    campaignType: 'welcome' | 'promotional' | 'newsletter' | 'abandoned_cart' | 'loyalty';
  }): Promise<EmailCampaignIdea> {
    const openai = getOpenAIClient();

    console.log('📧 [MarketingMLService] generateEmailCampaign für:', data.campaignType);

    const prompt = `Du bist ein E-Mail Marketing Expert. Erstelle eine hochkonvertierend Kampagne:

PRODUKT: ${data.productName}
BESCHREIBUNG: ${data.productDesc}
ZIELGRUPPE: ${data.targetAudience}
KAMPAGNEN-TYP: ${data.campaignType}

Generiere im JSON-Format:
{
  "subject_lines": ["Subjekt 1", "Subjekt 2", "Subjekt 3"],
  "body_templates": ["Body-Template 1", "Body-Template 2"],
  "cta_variants": ["CTA 1", "CTA 2", "CTA 3"],
  "send_timing": "Best time to send",
  "estimated_open_rate": 0-100
}

Alle Texte auf DEUTSCH, hochkonvertierend, DSGVO-konform.`;

    try {
      const completion = await executeOpenAI(
        async () => {
          return openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1500
          });
        },
        'email_campaign'
      );

      const content = (completion as any).choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        subject_lines: [],
        body_templates: [],
        cta_variants: [],
        send_timing: '',
        estimated_open_rate: 0
      };

      return result;
    } catch (error: any) {
      console.error('❌ Fehler bei generateEmailCampaign:', error.message);
      throw error;
    }
  }

  /**
   * Generiert Social Media Content für mehrere Plattformen
   */
  static async generateSocialMediaContent(data: {
    topic: string;
    tone: 'professional' | 'casual' | 'humorous' | 'inspirational';
    platforms: Array<'linkedin' | 'twitter' | 'instagram' | 'facebook'>;
  }): Promise<SocialMediaContent[]> {
    const openai = getOpenAIClient();

    console.log('📱 [MarketingMLService] generateSocialMediaContent für:', data.platforms);

    const prompt = `Du bist ein Social Media Content Strategist. Erstelle 5 Posts für jede Plattform:

THEMA: ${data.topic}
TON: ${data.tone}

Generiere für jede Plattform im JSON-Format:
{
  "platform": "linkedin|twitter|instagram|facebook",
  "posts": ["Post 1", "Post 2", "Post 3", "Post 4", "Post 5"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "best_posting_times": ["Beste Zeit 1", "Beste Zeit 2"],
  "engagement_prediction": 0-100
}

WICHTIG: Posts sind auf DEUTSCH, plattformoptimiert, viral-potenzial.`;

    try {
      const completion = await executeOpenAI(
        async () => {
          return openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            max_tokens: 2000
          });
        },
        'social_media'
      );

      const content = (completion as any).choices[0]?.message?.content || '[]';
      
      // Parse multiple JSON objects
      const jsonMatches = content.match(/\{[\s\S]*?\}/g) || [];
      const results = jsonMatches.map((match: string) => {
        try {
          return JSON.parse(match);
        } catch {
          return null;
        }
      }).filter(Boolean);

      return results.length > 0 ? results : data.platforms.map(platform => ({
        platform,
        posts: [],
        hashtags: [],
        best_posting_times: [],
        engagement_prediction: 0
      }));
    } catch (error: any) {
      console.error('❌ Fehler bei generateSocialMediaContent:', error.message);
      throw error;
    }
  }

  /**
   * Optimiert bestehende Marketing-Copy mit KI
   */
  static async optimizeMarketingCopy(data: {
    currentCopy: string;
    targetAction: string;
    audience: string;
  }): Promise<{ optimized_versions: string[]; improvements: string[]; confidence: number }> {
    const openai = getOpenAIClient();

    console.log('✏️ [MarketingMLService] optimizeMarketingCopy');

    const prompt = `Du bist ein hochperformanter Copywriter. Optimiere den folgenden Marketing-Text für Konvertierung:

AKTUELLER TEXT: "${data.currentCopy}"
ZIELAKTION: ${data.targetAction}
ZIELGRUPPE: ${data.audience}

Generiere 3 optimierte Versionen + Verbesserungsvorschläge im JSON-Format:
{
  "optimized_versions": ["Version 1", "Version 2", "Version 3"],
  "improvements": ["Verbesserung 1", "Verbesserung 2", "Verbesserung 3"],
  "confidence": 0-100
}

Fokus: Konvertierung, Klarheit, emotionale Resonanz.`;

    try {
      const completion = await executeOpenAI(
        async () => {
          return openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1500
          });
        },
        'copy_optimization'
      );

      const content = (completion as any).choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        optimized_versions: [],
        improvements: [],
        confidence: 0
      };

      return result;
    } catch (error: any) {
      console.error('❌ Fehler bei optimizeMarketingCopy:', error.message);
      throw error;
    }
  }

  /**
   * Vorhersage für Kampagnen-Performance mit ML
   */
  static async forecastCampaignPerformance(data: {
    campaignType: string;
    budget: number;
    targetAudience: number;
    historicalCTR?: number;
    historicalROI?: number;
  }): Promise<{ forecast: any; recommendations: string[] }> {
    const openai = getOpenAIClient();

    console.log('📊 [MarketingMLService] forecastCampaignPerformance');

    const prompt = `Du bist ein Marketing Analytics Expert. Prognostiziere die Performance der Kampagne:

KAMPAGNEN-TYP: ${data.campaignType}
BUDGET: €${data.budget}
ZIELGRUPPE-GRÖßE: ${data.targetAudience}
HISTORISCHES CTR: ${data.historicalCTR || 'Keine Daten'}%
HISTORISCHES ROI: ${data.historicalROI || 'Keine Daten'}%

Generiere Prognose + Handlungsempfehlungen im JSON-Format:
{
  "forecast": {
    "estimated_impressions": 0,
    "estimated_clicks": 0,
    "estimated_conversions": 0,
    "estimated_revenue": 0,
    "roi_projection": 0,
    "confidence_level": "high|medium|low"
  },
  "recommendations": ["Empfehlung 1", "Empfehlung 2", "Empfehlung 3"]
}`;

    try {
      const completion = await executeOpenAI(
        async () => {
          return openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1500
          });
        },
        'campaign_forecast'
      );

      const content = (completion as any).choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        forecast: {},
        recommendations: []
      };

      return result;
    } catch (error: any) {
      console.error('❌ Fehler bei forecastCampaignPerformance:', error.message);
      throw error;
    }
  }
}
