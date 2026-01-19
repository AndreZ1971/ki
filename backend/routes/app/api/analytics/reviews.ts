import { FastifyInstance } from 'fastify';
import OpenAI from 'openai';
import { getConfig } from '@config';
import { logger } from '../../../../logger';
import { WooCommerceClient } from '../../../../woocommerce/client.js';

// ✅ NEU (richtig - lazy Initialisierung)
let openai: OpenAI | null = null;
let lastApiKey: string | undefined = undefined;
let lastModel: string | undefined = undefined;

const REVIEW_STOP_WORDS = new Set([
  'der','die','das','und','mit','fuer','für','eine','ein','ist','sind','nicht','auf','von','den','im','aber','auch','oder','ohne','mehr','als','zum','zur','ich','wir','man','dass','dieses','diese','dieser','einfach','sehr'
]);

async function fetchProductReviews(client: WooCommerceClient, productId: string) {
  const perPage = 100;
  const maxPages = 10;
  const all: any[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await client.get(`products/reviews?product=${encodeURIComponent(productId)}&per_page=${perPage}&page=${page}`);
    if (!Array.isArray(batch)) {
      throw new Error('Unerwartete Antwort von der WooCommerce Reviews API');
    }

    all.push(...batch);
    if (batch.length < perPage) break;
  }

  return all;
}

function extractThemes(reviews: any[]): string[] {
  const text = reviews
    .map((review: any) => {
      if (typeof review?.review === 'string') return review.review;
      if (typeof review?.review?.rendered === 'string') return review.review.rendered;
      return '';
    })
    .join(' ')
    .toLowerCase();

  const words = text.split(/[^a-zäöüß0-9]+/i).filter(word => word.length >= 5 && !REVIEW_STOP_WORDS.has(word));
  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function calculateSentimentScore(ratings: number[]): number {
  if (!ratings.length) return 0;
  const normalized = ratings.map(rating => {
    const value = Number(rating);
    const score = (value - 3) / 2; // 1->-1, 3->0, 5->1
    return Math.max(-1, Math.min(1, score));
  });

  const average = normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
  return parseFloat(average.toFixed(2));
}

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
  const wooCommerce = new WooCommerceClient();
  
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

    try {
      const reviews = await fetchProductReviews(wooCommerce, productId);

      if (!reviews.length) {
        return {
          success: true,
          productId,
          overallSentiment: 'neutral',
          sentimentScore: 0,
          totalReviews: 0,
          positiveReviews: 0,
          negativeReviews: 0,
          neutralReviews: 0,
          trendingThemes: [],
          message: 'Keine Bewertungen für dieses Produkt vorhanden'
        };
      }

      const ratings = reviews
        .map((review: any) => Number(review.rating ?? review?.rating?.rendered))
        .filter((rating: number) => Number.isFinite(rating));

      const totalReviews = ratings.length;
      const positiveReviews = ratings.filter((rating: number) => rating >= 4).length;
      const negativeReviews = ratings.filter((rating: number) => rating <= 2).length;
      const neutralReviews = totalReviews - positiveReviews - negativeReviews;

      const sentimentScore = calculateSentimentScore(ratings);
      const overallSentiment = sentimentScore > 0.25 ? 'positive' : sentimentScore < -0.25 ? 'negative' : 'neutral';

      const trendingThemes = extractThemes(reviews);

      return {
        success: true,
        productId,
        overallSentiment,
        sentimentScore,
        totalReviews,
        positiveReviews,
        negativeReviews,
        neutralReviews,
        trendingThemes,
        message: 'Bewertungen aus WooCommerce analysiert'
      };
    } catch (error: any) {
      logger.error({ error: error.message, productId }, 'Reviews sentiment fetching failed');
      return {
        success: false,
        productId,
        overallSentiment: 'neutral',
        sentimentScore: 0,
        totalReviews: 0,
        positiveReviews: 0,
        negativeReviews: 0,
        neutralReviews: 0,
        trendingThemes: [],
        error: error.message
      };
    }
  });
}