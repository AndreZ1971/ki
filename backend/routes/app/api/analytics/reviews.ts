import { FastifyInstance } from 'fastify';
import OpenAI from 'openai';
import { getConfig } from '@config';
import { logger } from '../../../../logger';

// ✅ NEU (richtig - lazy Initialisierung)
let openai: OpenAI | null = null;
let lastApiKey: string | undefined = undefined;
let lastModel: string | undefined = undefined;

function initializeOpenAI() {
  const config = getConfig();
  const apiKey = config.openAI?.apiKey;
  const model = config.openAI?.model;
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-')) {
    logger.warn('OpenAI API Key not configured');
    openai = null;
    lastApiKey = undefined;
    lastModel = undefined;
    return null;
  }
  // Only re-initialize if apiKey or model changed
  if (!openai || apiKey !== lastApiKey || model !== lastModel) {
    openai = new OpenAI({ apiKey });
    lastApiKey = apiKey;
    lastModel = model;
    logger.debug('Reviews OpenAI client successfully initialized');
  }
  return openai;
}

export default async function reviewsRoutes(server: FastifyInstance) {
  
  // 📊 Einzelne Bewertung analysieren
  server.post('/reviews/analyze', {
    schema: {
      tags: ['reviews'],
      summary: 'Analyze product review sentiment',
      description: 'AI-powered sentiment analysis for product reviews',
      body: {
        type: 'object',
        required: ['reviewText'],
        properties: {
          reviewText: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          productName: { type: 'string' },
          language: { type: 'string', default: 'de' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral', 'mixed'] },
            sentimentScore: { type: 'number', minimum: -1, maximum: 1 },
            keyThemes: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' },
            improvementSuggestions: { type: 'array', items: { type: 'string' } },
            responseSuggestion: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    const { reviewText, rating, productName, language = 'de' } = request.body;

    const openAIClient = initializeOpenAI();
    if (!openAIClient) {
      return {
        success: false,
        sentiment: 'neutral',
        sentimentScore: 0,
        keyThemes: [],
        summary: 'AI service not available',
        improvementSuggestions: [],
        responseSuggestion: '',
        error: 'OpenAI not configured'
      };
    }

    try {
      const prompt = `
Analysiere diese Produktbewertung:

PRODUKT: ${productName || 'Unbekannt'}
BEWERTUNG: ${rating || 'Keine Sterne'} Sterne
TEXT: "${reviewText}"

Analysiere:
1. Sentiment (positive/negative/neutral/mixed)
2. Sentiment Score (-1 sehr negativ bis +1 sehr positiv)
3. Hauptthemen/Key Points
4. Kurze Zusammenfassung
5. Verbesserungsvorschläge basierend auf der Kritik
6. Vorschlag für eine Antwort des Shop-Betreibers

Antworte im JSON Format:
{
  "sentiment": "positive",
  "sentimentScore": 0.8,
  "keyThemes": ["Lieferung", "Qualität", "Preis"],
  "summary": "Kunde ist zufrieden mit Qualität aber Lieferung war langsam",
  "improvementSuggestions": ["Lieferzeiten kommunizieren", "Verpackung verbessern"],
  "responseSuggestion": "Vielen Dank für Ihre Bewertung! Wir arbeiten an der Verbesserung unserer Lieferzeiten."
}
`;

      const config = getConfig();
      const completion = await openAIClient.chat.completions.create({
        model: config.openAI?.model || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Du bist ein E-Commerce Experte der Produktbewertungen analysiert. Sprache: ${language}`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse) {
        try {
          const analysis = JSON.parse(aiResponse);
          return {
            success: true,
            ...analysis
          };
        } catch (__parseError) {
          throw new Error('Failed to parse AI response');
        }
      } else {
        throw new Error('No response from AI');
      }

    } catch (error: any) {
      server.log.error('Review analysis error:', error);
      return {
        success: false,
        sentiment: 'neutral',
        sentimentScore: 0,
        keyThemes: [],
        summary: 'Analysis failed',
        improvementSuggestions: [],
        responseSuggestion: '',
        error: error.message
      };
    }
  });

  // 📈 Mehrere Bewertungen zusammenfassen
  server.post('/reviews/summarize', {
    schema: {
      tags: ['reviews'],
      summary: 'Summarize multiple product reviews',
      description: 'AI-powered summary of multiple product reviews with insights',
      body: {
        type: 'object',
        required: ['reviews'],
        properties: {
          productName: { type: 'string' },
          reviews: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                rating: { type: 'integer' },
                date: { type: 'string' }
              }
            }
          },
          language: { type: 'string', default: 'de' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            overallSentiment: { type: 'string' },
            averageRating: { type: 'number' },
            keyThemes: { type: 'array', items: { type: 'string' } },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' },
            improvementRecommendations: { type: 'array', items: { type: 'string' } },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    const { productName, reviews, language = 'de' } = request.body;

    const openAIClient = initializeOpenAI();
    if (!openAIClient) {
      return {
        success: false,
        overallSentiment: 'neutral',
        averageRating: 0,
        keyThemes: [],
        strengths: [],
        weaknesses: [],
        summary: 'AI service not available',
        improvementRecommendations: [],
        error: 'OpenAI not configured'
      };
    }

    try {
      const prompt = `
Fasse diese Produktbewertungen zusammen:

PRODUKT: ${productName || 'Unbekannt'}
ANZAHL BEWERTUNGEN: ${reviews.length}

BEWERTUNGEN:
${reviews.map((review: any, index: number) => 
  `Bewertung ${index + 1}: ${review.rating} Sterne - "${review.text}"${review.date ? ` (${review.date})` : ''}`
).join('\n')}

Analysiere und fasse zusammen:
1. Gesamtsentiment
2. Durchschnittliche Bewertung
3. Hauptthemen die auftauchen
4. Stärken des Produkts (basierend auf positiven Bewertungen)
5. Schwächen/Verbesserungsbereiche (basierend auf negativen Bewertungen)
6. Kurze Gesamtzusammenfassung
7. Empfehlungen zur Produktverbesserung

Antworte im JSON Format:
{
  "overallSentiment": "positive",
  "averageRating": 4.2,
  "keyThemes": ["Qualität", "Benutzerfreundlichkeit", "Preis"],
  "strengths": ["Gute Verarbeitung", "Einfache Installation"],
  "weaknesses": ["Lieferzeit", "Dokumentation unvollständig"],
  "summary": "Kunden sind insgesamt zufrieden mit der Qualität, aber wünschen sich schnellere Lieferung.",
  "improvementRecommendations": ["Lieferzeiten optimieren", "Anleitung erweitern"]
}
`;

      const config = getConfig();
      const completion = await openAIClient.chat.completions.create({
        model: config.openAI?.model || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Du bist ein E-Commerce Analyst der mehrere Produktbewertungen zusammenfasst und analysiert. Sprache: ${language}`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1200,
        response_format: { type: "json_object" }
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse) {
        try {
          const summary = JSON.parse(aiResponse);
          return {
            success: true,
            ...summary
          };
        } catch (__parseError) {
          throw new Error('Failed to parse AI response');
        }
      } else {
        throw new Error('No response from AI');
      }

    } catch (error: any) {
      server.log.error('Review summary error:', error);
      return {
        success: false,
        overallSentiment: 'neutral',
        averageRating: 0,
        keyThemes: [],
        strengths: [],
        weaknesses: [],
        summary: 'Summary generation failed',
        improvementRecommendations: [],
        error: error.message
      };
    }
  });

  // 🎯 Produkt-Sentiment Analyse
  server.get('/reviews/sentiment/:productId', {
    schema: {
      tags: ['reviews'],
      summary: 'Get overall sentiment for a product',
      description: 'Analyze overall customer sentiment for a specific product',
      params: {
        type: 'object',
        properties: {
          productId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            productId: { type: 'string' },
            overallSentiment: { type: 'string' },
            sentimentScore: { type: 'number' },
            totalReviews: { type: 'integer' },
            positiveReviews: { type: 'integer' },
            negativeReviews: { type: 'integer' },
            neutralReviews: { type: 'integer' },
            trendingThemes: { type: 'array', items: { type: 'string' } },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    const { productId } = request.params;

    // Hier würde normalerweise die Datenbank abgefragt werden
    // Für dieses Beispiel geben wir eine Mock-Antwort zurück
    
    return {
      success: true,
      productId,
      overallSentiment: 'positive',
      sentimentScore: 0.75,
      totalReviews: 42,
      positiveReviews: 32,
      negativeReviews: 5,
      neutralReviews: 5,
      trendingThemes: ['Benutzerfreundlichkeit', 'Leistung', 'Design'],
      message: 'Sentiment analysis would query database in production'
    };
  });
}