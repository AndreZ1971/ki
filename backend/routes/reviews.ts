import { FastifyInstance } from 'fastify';
import OpenAI from 'openai';

let openai: OpenAI;

// OpenAI Initialisierung (wie in product-optimizer.ts)
try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-')) {
    console.warn('⚠️  OpenAI nicht verfügbar für Reviews-Analyse');
    openai = null as any;
  } else {
    openai = new OpenAI({ apiKey });
    console.log('✅ Reviews OpenAI Client initialisiert');
  }
} catch (error) {
  console.error('❌ Fehler bei Reviews OpenAI Initialisierung:', error);
  openai = null as any;
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
            responseSuggestion: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any) => {
    const { reviewText, rating, productName, language = 'de' } = request.body;

    if (!openai) {
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

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
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
        } catch (parseError) {
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
      }
    }
  }, async (request: any) => {
    // Implementation folgt...
    return { message: 'Review summary endpoint - to be implemented' };
  });

  // 🎯 Produkt-Sentiment Analyse
  server.get('/reviews/sentiment/:productId', {
    schema: {
      tags: ['reviews'],
      summary: 'Get overall sentiment for a product',
      description: 'Analyze overall customer sentiment for a specific product'
    }
  }, async (request: any) => {
    // Implementation folgt...
    return { message: 'Product sentiment endpoint - to be implemented' };
  });
}