// backend/services/emailEnhancementService.ts
import { getOpenAIClient, executeOpenAI } from '../utils/openaiHelper';
import config from '../config';

const OPENAI_MODEL = config.openAI?.model?.trim() || 'gpt-4-turbo';

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  customerIds: string[];
  characteristics: string[];
  recommendedEmailType: string;
  avgLifetimeValue: number;
  engagementScore: number;
}

export interface SubjectLineVariant {
  variant: string;
  type: 'emotional' | 'rational' | 'urgency' | 'curiosity' | 'benefit';
  estimatedOpenRate: number;
  reason: string;
}

export interface PersonalizedEmail {
  customerId: string;
  customerName: string;
  subject: string;
  body: string;
  personalizationElements: string[];
  estimatedCTR: number;
  estimatedConversionRate: number;
}

export interface OptimalSendTime {
  customerId: string;
  email: string;
  recommendedTime: string;
  timezone: string;
  dayOfWeek: string;
  confidence: number;
}

export interface EmailPerformanceForecast {
  emailType: string;
  segment: string;
  estimatedOpenRate: number;
  estimatedClickRate: number;
  estimatedConversionRate: number;
  estimatedRevenue: number;
  confidence: number;
  recommendations: string[];
}

export class EmailEnhancementService {
  /**
   * Generiert 5 intelligente Subject Line Varianten mit KI
   */
  static async generateSmartSubjectLines(data: {
    emailType: string;
    productName: string;
    targetAudience: string;
    brandVoice?: string;
  }): Promise<SubjectLineVariant[]> {
    const openai = getOpenAIClient();
    console.log('🎯 [EmailEnhancementService] generateSmartSubjectLines:', data.emailType);

    const prompt = `Du bist ein Email Marketing Expert. Generiere 5 hocheffektive Subject Lines für:
    
EMAIL-TYP: ${data.emailType}
PRODUKT: ${data.productName}
ZIELGRUPPE: ${data.targetAudience}
MARKENSTIL: ${data.brandVoice || 'professionell'}

Erstelle 5 Subject Lines in verschiedenen Stilen (emotional, rational, urgency, curiosity, benefit) als JSON:
[
  {
    "variant": "Subject Line Text",
    "type": "emotional|rational|urgency|curiosity|benefit",
    "estimatedOpenRate": 0-100,
    "reason": "Warum diese Zeile effektiv ist"
  }
]

Alle Zeilen auf DEUTSCH, max 60 Zeichen, hochkonvertierend.`;

    try {
      const completion = await executeOpenAI(
        async () => {
          return await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            max_tokens: 1500
          });
        },
        'smart_subject_lines'
      );

      const content = (completion as any).choices[0]?.message?.content || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      return result;
    } catch (error: any) {
      console.error('❌ Fehler bei generateSmartSubjectLines:', error.message);
      throw error;
    }
  }

  /**
   * Segmentiert Kunden automatisch basierend auf Verhalten & Daten
   */
  static async segmentCustomers(customers: any[]): Promise<CustomerSegment[]> {
    const openai = getOpenAIClient();
    console.log('🔍 [EmailEnhancementService] segmentCustomers:', customers.length);

    // Kundendaten zusammenfassen für KI-Analyse
    const customerSummary = customers.map(c => ({
      id: c.id,
      name: c.name,
      totalSpent: c.total_spent || 0,
      ordersCount: c.orders_count || 0,
      lastOrderDate: c.last_order_date,
      email: c.email
    }));

    const prompt = `Du bist ein Marketing Analyst. Segmentiere diese Kunden basierend auf ihrem Verhalten:

${JSON.stringify(customerSummary, null, 2)}

Erstelle 3-5 Kundensegmente mit Charakteristiken als JSON:
{
  "segments": [
    {
      "id": "segment_id",
      "name": "Segment Name",
      "description": "Beschreibung",
      "characteristics": ["Merkmal 1"],
      "recommendedEmailType": "welcome-email|newsletter|special-offer",
      "customerIds": ["id1", "id2"],
      "avgLifetimeValue": 0,
      "engagementScore": 0-100
    }
  ]
}`;

    try {
      const completion = await executeOpenAI(
        async () => {
          return await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000
          });
        },
        'customer_segmentation'
      );

      const content = (completion as any).choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { segments: [] };
      return result.segments || [];
    } catch (error: any) {
      console.error('❌ Fehler bei segmentCustomers:', error.message);
      throw error;
    }
  }

  /**
   * Personalisiert Emails basierend auf Kundendaten & Kaufhistorie
   */
  static async personalizeEmail(data: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    emailType: string;
    emailBody: string;
    customerHistory?: {
      lastProducts: string[];
      totalSpent: number;
      ordersCount: number;
      lastOrderDate?: string;
    };
  }): Promise<PersonalizedEmail> {
    const openai = getOpenAIClient();
    console.log('✨ [EmailEnhancementService] personalizeEmail:', data.customerName);

    const historyContext = data.customerHistory
      ? `LETZTE PRODUKTE: ${data.customerHistory.lastProducts.join(', ')}
GESAMTUMSATZ: €${data.customerHistory.totalSpent}
BESTELLUNGEN: ${data.customerHistory.ordersCount}
LETZTE BESTELLUNG: ${data.customerHistory.lastOrderDate || 'keine'}`
      : 'Keine Kaufhistorie vorhanden';

    const prompt = `Du bist ein Personalisierungs-Expert. Personalisiere diese Email:

KUNDE: ${data.customerName}
EMAIL-TYP: ${data.emailType}
KUNDENHISTORIE:
${historyContext}

AKTUELLE EMAIL:
${data.emailBody}

Personalisiere den Text mit:
1. Namen und Kundenanrede
2. Bezug zu Kaufhistorie (falls vorhanden)
3. Personalisierte CTAs basierend auf Verhalten
4. Dynamische Inhalte

Gib das Ergebnis als JSON zurück:
{
  "subject": "Subject Line",
  "body": "Personalisierte Email",
  "personalizationElements": ["Element 1"],
  "estimatedCTR": 0-100,
  "estimatedConversionRate": 0-100
}`;

    try {
      const completion = await executeOpenAI(
        async () => {
          return await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000
          });
        },
        'email_personalization'
      );

      const content = (completion as any).choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        customerId: data.customerId,
        customerName: data.customerName,
        subject: parsedResult.subject || '',
        body: parsedResult.body || data.emailBody,
        personalizationElements: parsedResult.personalizationElements || [],
        estimatedCTR: parsedResult.estimatedCTR || 0,
        estimatedConversionRate: parsedResult.estimatedConversionRate || 0
      };
    } catch (error: any) {
      console.error('❌ Fehler bei personalizeEmail:', error.message);
      throw error;
    }
  }

  /**
   * Berechnet optimale Versandzeit für jeden Kunden
   */
  static async optimizeSendTime(customers: any[]): Promise<OptimalSendTime[]> {
    const openai = getOpenAIClient();
    console.log('⏰ [EmailEnhancementService] optimizeSendTime:', customers.length);

    const prompt = `Du bist ein Send-Time Optimization Expert. Analysiere diese Kunden und bestimme optimale Versandzeiten:

${JSON.stringify(customers.slice(0, 10), null, 2)}

Berücksichtige:
- Zeitzonen
- Wochentag
- Tageszeit (Peak Engagement)
- Emailtyp

Gib für jeden Kunden die beste Versandzeit als JSON zurück:
{
  "sendTimes": [
    {
      "customerId": "id",
      "email": "email@example.com",
      "recommendedTime": "HH:MM",
      "timezone": "Europe/Berlin",
      "dayOfWeek": "Tuesday",
      "confidence": 0-100
    }
  ]
}`;

    try {
      const completion = await executeOpenAI(
        async () => {
          return await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
            max_tokens: 1500
          });
        },
        'send_time_optimization'
      );

      const content = (completion as any).choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { sendTimes: [] };
      return result.sendTimes || [];
    } catch (error: any) {
      console.error('❌ Fehler bei optimizeSendTime:', error.message);
      throw error;
    }
  }

  /**
   * Prognostiziert Email-Performance & ROI
   */
  static async forecastEmailPerformance(data: {
    emailType: string;
    segment: string;
    subjectLine: string;
    recipientCount: number;
    historicalOpenRate?: number;
    historicalCTR?: number;
  }): Promise<EmailPerformanceForecast> {
    const openai = getOpenAIClient();
    console.log('📊 [EmailEnhancementService] forecastEmailPerformance:', data.emailType);

    const prompt = `Du bist ein Email Performance Analyst. Prognostiziere die Performance dieser Email:

EMAIL-TYP: ${data.emailType}
SEGMENT: ${data.segment}
SUBJECT LINE: "${data.subjectLine}"
EMPFÄNGER: ${data.recipientCount}
HISTORISCHES OPEN RATE: ${data.historicalOpenRate || 'keine Daten'}%
HISTORISCHES CTR: ${data.historicalCTR || 'keine Daten'}%

Erstelle eine detaillierte Prognose als JSON:
{
  "estimatedOpenRate": 0-100,
  "estimatedClickRate": 0-100,
  "estimatedConversionRate": 0-100,
  "estimatedRevenue": 0,
  "confidence": 0-100,
  "recommendations": ["Empfehlung 1"]
}

Basiere auf Industrie-Benchmarks und Best Practices.`;

    try {
      const completion = await executeOpenAI(
        async () => {
          return await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
            max_tokens: 1500
          });
        },
        'email_performance_forecast'
      );

      const content = (completion as any).choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        emailType: data.emailType,
        segment: data.segment,
        estimatedOpenRate: parsedResult.estimatedOpenRate || 0,
        estimatedClickRate: parsedResult.estimatedClickRate || 0,
        estimatedConversionRate: parsedResult.estimatedConversionRate || 0,
        estimatedRevenue: parsedResult.estimatedRevenue || 0,
        confidence: parsedResult.confidence || 0,
        recommendations: parsedResult.recommendations || []
      };
    } catch (error: any) {
      console.error('❌ Fehler bei forecastEmailPerformance:', error.message);
      throw error;
    }
  }
}
