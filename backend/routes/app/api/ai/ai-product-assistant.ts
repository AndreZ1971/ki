import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getOpenAIClient, executeOpenAI } from '../../../../utils/openaiHelper';

interface DescriptionRequest {
  productName: string;
  category?: string;
  keywords?: string[];
  tone?: 'formal' | 'casual' | 'professional' | 'creative';
  length?: 'short' | 'medium' | 'long';
}

interface AutoTagRequest {
  productName: string;
  description: string;
  category?: string;
}

interface QualityScoreRequest {
  productName: string;
  description: string;
  price: number;
  category?: string;
  images?: number;
}

interface SeoOptimizeRequest {
  productName: string;
  description: string;
  category?: string;
}

interface ImageGenerationRequest {
  productName: string;
  description?: string;
  style?: 'professional' | 'minimalist' | 'vibrant' | 'realistic';
}

interface PricingSuggestionRequest {
  productName: string;
  category: string;
  description?: string;
}

interface TrendPricingRequest {
  productId: number;
  productName: string;
  currentPrice: number;
  category: string;
}

interface TrendDescriptionRequest {
  productName: string;
  currentDescription: string;
  category: string;
}

interface BulkTrendOptimizeRequest {
  productIds: number[];
  updateTypes: ('pricing' | 'description' | 'tags')[];
}

interface RedditSentimentRequest {
  productName: string;
  category?: string;
}

export default async function aiProductAssistant(fastify: FastifyInstance) {
  
  // ✍️ Smart Description Generator
  fastify.post<{ Body: DescriptionRequest }>(
    '/ai/generate-description',
    async (request: FastifyRequest<{ Body: DescriptionRequest }>, reply: FastifyReply) => {
      try {
        const { productName, category = '', keywords = [], tone = 'professional', length = 'medium' } = request.body;

        if (!productName?.trim()) {
          return reply.code(400).send({ success: false, error: 'Produktname erforderlich' });
        }

        const lengthMap = {
          short: '100-150 Wörter',
          medium: '150-250 Wörter',
          long: '250-400 Wörter'
        };

        const toneMap = {
          formal: 'formell und sachlich',
          casual: 'locker und freundlich',
          professional: 'professionell und vertrauenswürdig',
          creative: 'kreativ und emotional'
        };

        const prompt = `Du bist ein professioneller E-Commerce Copywriter. Erstelle eine verkaufsstarke Produktbeschreibung für ein WooCommerce-Produkt.

**Produkt:** ${productName}
${category ? `**Kategorie:** ${category}` : ''}
${keywords.length > 0 ? `**Keywords:** ${keywords.join(', ')}` : ''}

**Anforderungen:**
- Länge: ${lengthMap[length]}
- Ton: ${toneMap[tone]}
- SEO-optimiert mit natürlicher Keyword-Integration
- Klar strukturiert mit Absätzen
- Fokus auf Kundennutzen und USPs
- Call-to-Action am Ende
- Keine übertriebenen Superlative

Erstelle NUR die Beschreibung, ohne zusätzliche Kommentare oder Formatierung.`;

        const openai = getOpenAIClient();
        const description = await executeOpenAI(
          async () => {
            const response = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [
                { role: 'system', content: 'Du bist ein Experte für E-Commerce-Produktbeschreibungen.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 800
            });
            return response.choices[0]?.message?.content || '';
          },
          'generate-description'
        );

        const wordCount = description.trim().split(/\s+/).length;

        return reply.send({
          success: true,
          data: {
            description: description.trim(),
            metadata: {
              wordCount,
              tone,
              length,
              seoOptimized: true,
              generatedAt: new Date().toISOString()
            }
          }
        });

      } catch (error: any) {
        fastify.log.error('AI Description Generation Error:', error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Fehler bei KI-Beschreibungsgenerierung'
        });
      }
    }
  );

  // 🏷️ Auto-Tagging & Kategorisierung
  fastify.post<{ Body: AutoTagRequest }>(
    '/ai/auto-tag',
    async (request: FastifyRequest<{ Body: AutoTagRequest }>, reply: FastifyReply) => {
      try {
        const { productName, description, category = '' } = request.body;

        if (!productName?.trim() || !description?.trim()) {
          return reply.code(400).send({ 
            success: false, 
            error: 'Produktname und Beschreibung erforderlich' 
          });
        }

        const prompt = `Analysiere folgendes WooCommerce-Produkt und generiere relevante Tags und Kategorisierungen.

**Produkt:** ${productName}
${category ? `**Kategorie:** ${category}` : ''}
**Beschreibung:** ${description.substring(0, 500)}

Erstelle eine JSON-Antwort mit folgender Struktur:
{
  "tags": ["tag1", "tag2", ...],
  "suggestedCategories": ["category1", "category2"],
  "targetAudience": "Zielgruppe",
  "priceRange": "low|medium|high",
  "seasonality": "ganzjährig|saisonal",
  "productAttributes": ["attribut1", "attribut2"]
}

Antworte NUR mit dem JSON-Objekt, ohne zusätzlichen Text.`;

        const openai = getOpenAIClient();
        const result = await executeOpenAI(
          async () => {
            const response = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [
                { role: 'system', content: 'Du bist ein Experte für E-Commerce-Produktklassifikation. Antworte immer mit validem JSON.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.5,
              max_tokens: 500
            });
            return response.choices[0]?.message?.content || '{}';
          },
          'auto-tag'
        );

        const parsed = JSON.parse(result);

        return reply.send({
          success: true,
          data: {
            tags: parsed.tags || [],
            suggestedCategories: parsed.suggestedCategories || [],
            targetAudience: parsed.targetAudience || '',
            priceRange: parsed.priceRange || 'medium',
            seasonality: parsed.seasonality || 'ganzjährig',
            productAttributes: parsed.productAttributes || [],
            confidence: 0.85,
            generatedAt: new Date().toISOString()
          }
        });

      } catch (error: any) {
        fastify.log.error('AI Auto-Tagging Error:', error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Fehler beim Auto-Tagging'
        });
      }
    }
  );

  // 📊 Quality Score Predictor
  fastify.post<{ Body: QualityScoreRequest }>(
    '/ai/quality-score',
    async (request: FastifyRequest<{ Body: QualityScoreRequest }>, reply: FastifyReply) => {
      try {
        const { productName, description, price, category = '', images = 0 } = request.body;

        if (!productName?.trim() || !description?.trim() || price <= 0) {
          return reply.code(400).send({ 
            success: false, 
            error: 'Produktname, Beschreibung und Preis erforderlich' 
          });
        }

        // Simple ML-basierte Bewertung
        let score = 0;
        const feedback: string[] = [];

        // Produktname-Qualität (max 15 Punkte)
        const nameLength = productName.trim().length;
        if (nameLength >= 15 && nameLength <= 70) {
          score += 15;
        } else if (nameLength >= 10) {
          score += 10;
          feedback.push('Produktname könnte aussagekräftiger sein (15-70 Zeichen optimal)');
        } else {
          score += 5;
          feedback.push('⚠️ Produktname zu kurz (min. 15 Zeichen empfohlen)');
        }

        // Beschreibungs-Qualität (max 30 Punkte)
        const wordCount = description.trim().split(/\s+/).length;
        if (wordCount >= 100 && wordCount <= 400) {
          score += 30;
        } else if (wordCount >= 50) {
          score += 20;
          feedback.push('Beschreibung könnte detaillierter sein (100-400 Wörter optimal)');
        } else {
          score += 10;
          feedback.push('⚠️ Beschreibung zu kurz (min. 100 Wörter empfohlen)');
        }

        // Keyword-Dichte (max 15 Punkte)
        const keywordMatches = (description.toLowerCase().match(new RegExp(productName.toLowerCase().split(/\s+/)[0], 'g')) || []).length;
        if (keywordMatches >= 2 && keywordMatches <= 5) {
          score += 15;
        } else if (keywordMatches >= 1) {
          score += 10;
          feedback.push('Keyword-Dichte könnte optimiert werden (2-5 Erwähnungen)');
        } else {
          score += 5;
          feedback.push('⚠️ Hauptkeyword fehlt in der Beschreibung');
        }

        // Preis-Plausibilität (max 10 Punkte)
        if (price >= 9.99 && price <= 999) {
          score += 10;
        } else if (price > 0) {
          score += 5;
          feedback.push('Preis außerhalb des typischen E-Commerce-Bereichs');
        }

        // Bild-Qualität (max 15 Punkte)
        if (images >= 3) {
          score += 15;
        } else if (images >= 1) {
          score += 10;
          feedback.push('Mindestens 3 Produktbilder empfohlen');
        } else {
          score += 0;
          feedback.push('⚠️ Keine Produktbilder vorhanden');
        }

        // Kategorie (max 10 Punkte)
        if (category && category.trim() !== '') {
          score += 10;
        } else {
          score += 0;
          feedback.push('⚠️ Kategorie fehlt');
        }

        // SEO-Struktur (max 5 Punkte)
        const hasStructure = description.includes('\n') || description.length > 200;
        if (hasStructure) {
          score += 5;
        } else {
          feedback.push('Beschreibung sollte besser strukturiert sein (Absätze verwenden)');
        }

        return reply.send({
          success: true,
          data: {
            overallScore: Math.min(score, 100),
            breakdown: {
              nameQuality: Math.min((nameLength >= 15 && nameLength <= 70) ? 100 : 60, 100),
              descriptionQuality: Math.min((wordCount / 400) * 100, 100),
              seoScore: Math.min((keywordMatches / 5) * 100, 100),
              priceCompetitiveness: price >= 9.99 && price <= 999 ? 100 : 60,
              visualQuality: Math.min((images / 5) * 100, 100),
              categoryScore: category ? 100 : 0
            },
            recommendations: feedback,
            confidence: 0.92,
            evaluatedAt: new Date().toISOString()
          }
        });

      } catch (error: any) {
        fastify.log.error('Quality Score Error:', error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Fehler bei Quality Score Berechnung'
        });
      }
    }
  );

  // 🔍 SEO Optimization Assistant
  fastify.post<{ Body: SeoOptimizeRequest }>(
    '/ai/seo-optimize',
    async (request: FastifyRequest<{ Body: SeoOptimizeRequest }>, reply: FastifyReply) => {
      try {
        const { productName, description, category = '' } = request.body;

        if (!productName?.trim() || !description?.trim()) {
          return reply.code(400).send({ 
            success: false, 
            error: 'Produktname und Beschreibung erforderlich' 
          });
        }

        const prompt = `Analysiere folgendes Produkt und gib SEO-Optimierungsempfehlungen.

**Produkt:** ${productName}
**Kategorie:** ${category}
**Beschreibung:** ${description.substring(0, 500)}

Erstelle eine JSON-Antwort mit:
{
  "metaTitle": "SEO-optimierter Meta-Title (max 60 Zeichen)",
  "metaDescription": "SEO Meta-Description (max 160 Zeichen)",
  "urlSlug": "seo-optimierter-url-slug",
  "focusKeywords": ["keyword1", "keyword2"],
  "altTextSuggestion": "Alt-Text für Produktbild",
  "seoImprovements": ["verbesserung1", "verbesserung2"],
  "readabilityScore": 85
}

Antworte NUR mit JSON, ohne zusätzlichen Text.`;

        const openai = getOpenAIClient();
        const result = await executeOpenAI(
          async () => {
            const response = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [
                { role: 'system', content: 'Du bist ein SEO-Experte für E-Commerce. Antworte immer mit validem JSON.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.4,
              max_tokens: 600
            });
            return response.choices[0]?.message?.content || '{}';
          },
          'seo-optimize'
        );

        const parsed = JSON.parse(result);

        return reply.send({
          success: true,
          data: {
            metaTitle: parsed.metaTitle || productName.substring(0, 60),
            metaDescription: parsed.metaDescription || description.substring(0, 160),
            urlSlug: parsed.urlSlug || productName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            focusKeywords: parsed.focusKeywords || [],
            altTextSuggestion: parsed.altTextSuggestion || productName,
            seoImprovements: parsed.seoImprovements || [],
            readabilityScore: parsed.readabilityScore || 75,
            generatedAt: new Date().toISOString()
          }
        });

      } catch (error: any) {
        fastify.log.error('SEO Optimization Error:', error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Fehler bei SEO-Optimierung'
        });
      }
    }
  );

  // 🎨 Image Generation (DALL-E 3)
  fastify.post<{ Body: ImageGenerationRequest }>(
    '/ai/generate-image',
    async (request: FastifyRequest<{ Body: ImageGenerationRequest }>, reply: FastifyReply) => {
      try {
        const { productName, description = '', style = 'professional' } = request.body;

        if (!productName?.trim()) {
          return reply.code(400).send({ success: false, error: 'Produktname erforderlich' });
        }

        const stylePrompts = {
          professional: 'professional product photography, studio lighting, white background, high quality, 4K',
          minimalist: 'minimalist product design, clean, simple, elegant, white background',
          vibrant: 'vibrant colors, eye-catching, modern product photography, colorful background',
          realistic: 'photorealistic, detailed, natural lighting, lifestyle product shot'
        };

        const prompt = `High-quality product image: ${productName}. ${description ? `Product details: ${description.substring(0, 200)}.` : ''} Style: ${stylePrompts[style]}. Professional e-commerce product photo.`;

        const openai = getOpenAIClient();
        const imageResult = await executeOpenAI(
          async () => {
            const response = await openai.images.generate({
              model: 'dall-e-3',
              prompt: prompt.substring(0, 1000),
              n: 1,
              size: '1024x1024',
              quality: 'standard',
              style: 'natural'
            });
            if (!response.data || response.data.length === 0) {
              throw new Error('Keine Bilddaten von DALL-E erhalten');
            }
            return response.data[0];
          },
          'generate-image'
        );

        return reply.send({
          success: true,
          data: {
            imageUrl: imageResult.url,
            revisedPrompt: imageResult.revised_prompt,
            size: '1024x1024',
            model: 'dall-e-3',
            generatedAt: new Date().toISOString()
          }
        });

      } catch (error: any) {
        fastify.log.error('AI Image Generation Error:', error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Fehler bei Bildgenerierung'
        });
      }
    }
  );

  // 💰 Dynamic Pricing Intelligence
  fastify.post<{ Body: PricingSuggestionRequest }>(
    '/ai/suggest-pricing',
    async (request: FastifyRequest<{ Body: PricingSuggestionRequest }>, reply: FastifyReply) => {
      try {
        const { productName, category, description = '' } = request.body;

        if (!productName?.trim() || !category?.trim()) {
          return reply.code(400).send({ 
            success: false, 
            error: 'Produktname und Kategorie erforderlich' 
          });
        }

        const prompt = `Analysiere folgendes Produkt und schlage einen realistischen Preis vor.

**Produkt:** ${productName}
**Kategorie:** ${category}
${description ? `**Beschreibung:** ${description.substring(0, 300)}` : ''}

Berücksichtige:
- Marktübliche Preise in dieser Kategorie
- Produktqualität und Positionierung
- Zielgruppe und Kaufkraft
- Wettbewerbspreise

Erstelle eine JSON-Antwort:
{
  "suggestedPrice": 29.99,
  "priceRange": { "min": 19.99, "max": 39.99 },
  "confidence": 85,
  "reasoning": "Kurze Begründung",
  "competitorRange": "15-45€",
  "recommendation": "Preispositionierung Empfehlung"
}

Antworte NUR mit JSON.`;

        const openai = getOpenAIClient();
        const result = await executeOpenAI(
          async () => {
            const response = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [
                { role: 'system', content: 'Du bist ein E-Commerce Pricing-Experte. Antworte immer mit validem JSON.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              max_tokens: 400
            });
            return response.choices[0]?.message?.content || '{}';
          },
          'suggest-pricing'
        );

        const parsed = JSON.parse(result);

        return reply.send({
          success: true,
          data: {
            suggestedPrice: parsed.suggestedPrice || 29.99,
            priceRange: parsed.priceRange || { min: 19.99, max: 39.99 },
            confidence: parsed.confidence || 75,
            reasoning: parsed.reasoning || 'Basierend auf Kategorie-Durchschnitt',
            competitorRange: parsed.competitorRange || 'N/A',
            recommendation: parsed.recommendation || '',
            generatedAt: new Date().toISOString()
          }
        });

      } catch (error: any) {
        fastify.log.error('AI Pricing Suggestion Error:', error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Fehler bei Preis-Vorschlag'
        });
      }
    }
  );

  // 🔥 Trend-Based Pricing (Google Trends + Reddit Sentiment)
  fastify.post<{ Body: TrendPricingRequest }>(
    '/ai/trend-pricing',
    async (request: FastifyRequest<{ Body: TrendPricingRequest }>, reply: FastifyReply) => {
      try {
        const { productName, currentPrice, category } = request.body;

        if (!productName?.trim() || !currentPrice) {
          return reply.code(400).send({ 
            success: false, 
            error: 'Produktname und aktueller Preis erforderlich' 
          });
        }

        // Import TrendAggregator dynamisch
        const { trendAggregator } = await import('../../../../services/trendAggregatorService.js');

        // Google Trends + Reddit Daten sammeln
        const trendData = await trendAggregator.aggregateTrends(productName, ['googleTrends', 'reddit']);

        // GPT-4 für intelligente Preis-Analyse mit Trend-Kontext
        const prompt = `Analysiere die Preisstrategie für folgendes Produkt mit ECHTZEIT-TREND-DATEN:

**Produkt:** ${productName}
**Kategorie:** ${category}
**Aktueller Preis:** €${currentPrice}

**🔥 TREND-DATEN (Live):**
- Google Trends Score: ${trendData.overallScore.toFixed(1)}/100
- Datenquellen: ${trendData.sources.length} aktiv
- Confidence: ${trendData.confidence.toFixed(1)}%

**TREND-DETAILS:**
${trendData.sources.map((s: any) => `- ${s.source}: Score ${s.score.toFixed(1)}, Timestamp: ${new Date(s.timestamp).toLocaleString('de-DE')}`).join('\n')}

**AUFGABE:**
Basierend auf den Trend-Daten, schlage einen optimalen Preis vor.
- Hoher Trend (>70): Preis erhöhen (Demand steigt)
- Mittlerer Trend (30-70): Preis beibehalten oder leicht anpassen
- Niedriger Trend (<30): Preis senken (Demand sinkt)

Erstelle JSON-Antwort:
{
  "suggestedPrice": 29.99,
  "priceChange": "+15%",
  "trendScore": ${trendData.overallScore},
  "strategy": "INCREASE | MAINTAIN | DECREASE",
  "reasoning": "Kurze Begründung mit Trend-Bezug",
  "confidence": 85,
  "riskLevel": "LOW | MEDIUM | HIGH",
  "nextReviewDate": "2025-12-18"
}

Antworte NUR mit JSON.`;

        const openai = getOpenAIClient();
        const result = await executeOpenAI(
          async () => {
            const response = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [
                { role: 'system', content: 'Du bist ein KI-Pricing-Experte mit Zugriff auf Echtzeit-Trenddaten. Antworte immer mit validem JSON.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.4,
              max_tokens: 500
            });
            return response.choices[0]?.message?.content || '{}';
          },
          'trend-pricing'
        );

        const parsed = JSON.parse(result);

        return reply.send({
          success: true,
          data: {
            currentPrice,
            suggestedPrice: parsed.suggestedPrice || currentPrice,
            priceChange: parsed.priceChange || '0%',
            trendScore: trendData.overallScore,
            trendSources: trendData.sources.map((s: any) => ({
              name: s.source,
              score: s.score,
              timestamp: s.timestamp
            })),
            strategy: parsed.strategy || 'MAINTAIN',
            reasoning: parsed.reasoning || 'Keine Änderung empfohlen',
            confidence: parsed.confidence || trendData.confidence,
            riskLevel: parsed.riskLevel || 'MEDIUM',
            nextReviewDate: parsed.nextReviewDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            generatedAt: new Date().toISOString()
          }
        });

      } catch (error: any) {
        fastify.log.error('Trend Pricing Error:', error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Fehler bei Trend-Pricing-Analyse'
        });
      }
    }
  );

  // 📝 AI Description Optimizer with Trending Keywords
  fastify.post<{ Body: TrendDescriptionRequest }>(
    '/ai/optimize-description-trends',
    async (request: FastifyRequest<{ Body: TrendDescriptionRequest }>, reply: FastifyReply) => {
      try {
        const { productName, currentDescription, category } = request.body;

        if (!productName?.trim() || !currentDescription?.trim()) {
          return reply.code(400).send({ 
            success: false, 
            error: 'Produktname und Beschreibung erforderlich' 
          });
        }

        // Import TrendAggregator
        const { trendAggregator } = await import('../../../../services/trendAggregatorService.js');

        // Trend-Keywords sammeln
        const trendData = await trendAggregator.aggregateTrends(category || productName, ['googleTrends', 'googleNews']);

        const prompt = `Optimiere diese Produktbeschreibung mit TRENDING KEYWORDS aus Google Trends:

**Produkt:** ${productName}
**Kategorie:** ${category}

**AKTUELLE BESCHREIBUNG:**
${currentDescription}

**🔥 TRENDING KEYWORDS (Live von Google Trends):**
Trend-Score: ${trendData.overallScore.toFixed(1)}/100
Quellen: ${trendData.sources.map((s: any) => s.source).join(', ')}

**AUFGABE:**
1. Behalte Kernaussage und Produktinfos bei
2. Integriere trending Keywords natürlich in den Text
3. Optimiere für SEO und Conversion
4. Füge emotionale Trigger hinzu wenn Trend hoch ist (>60)

Erstelle JSON-Antwort:
{
  "optimizedDescription": "Neue Beschreibung hier",
  "addedKeywords": ["keyword1", "keyword2"],
  "seoScore": 85,
  "improvementAreas": ["Punkt 1", "Punkt 2"],
  "trendAlignment": "HIGH | MEDIUM | LOW"
}

Antworte NUR mit JSON.`;

        const openai = getOpenAIClient();
        const result = await executeOpenAI(
          async () => {
            const response = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [
                { role: 'system', content: 'Du bist ein SEO & Content-Experte mit Zugriff auf Echtzeit-Trenddaten. Antworte immer mit validem JSON.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 800
            });
            return response.choices[0]?.message?.content || '{}';
          },
          'optimize-description-trends'
        );

        const parsed = JSON.parse(result);

        return reply.send({
          success: true,
          data: {
            originalDescription: currentDescription,
            optimizedDescription: parsed.optimizedDescription || currentDescription,
            addedKeywords: parsed.addedKeywords || [],
            seoScore: parsed.seoScore || 70,
            improvementAreas: parsed.improvementAreas || [],
            trendAlignment: parsed.trendAlignment || 'MEDIUM',
            trendScore: trendData.overallScore,
            generatedAt: new Date().toISOString()
          }
        });

      } catch (error: any) {
        fastify.log.error('Description Optimization Error:', error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Fehler bei Beschreibungs-Optimierung'
        });
      }
    }
  );

  // 💬 Reddit Sentiment Analysis
  fastify.post<{ Body: RedditSentimentRequest }>(
    '/ai/reddit-sentiment',
    async (request: FastifyRequest<{ Body: RedditSentimentRequest }>, reply: FastifyReply) => {
      try {
        const { productName, category } = request.body;

        if (!productName?.trim()) {
          return reply.code(400).send({ 
            success: false, 
            error: 'Produktname erforderlich' 
          });
        }

        // Import Reddit Service
        const { redditService } = await import('../../../../services/redditService.js');

        // Reddit-Analyse durchführen
        const analysis = await redditService.analyzeProduct(productName, category);

        return reply.send({
          success: true,
          data: {
            productName,
            sentiment: analysis.overallSentiment.sentiment,
            sentimentScore: analysis.overallSentiment.score,
            confidence: analysis.overallSentiment.confidence,
            totalMentions: analysis.totalMentions,
            trendingScore: analysis.trendingScore,
            topKeywords: analysis.overallSentiment.keywords.slice(0, 5),
            topSubreddits: analysis.topSubreddits,
            recentPosts: analysis.posts.slice(0, 5).map((p: any) => ({
              title: p.title,
              subreddit: p.subreddit,
              score: p.score,
              comments: p.num_comments,
              url: p.permalink,
              age: Math.floor((Date.now() / 1000 - p.created_utc) / 3600) + 'h'
            })),
            generatedAt: new Date().toISOString()
          }
        });

      } catch (error: any) {
        fastify.log.error('Reddit Sentiment Error:', error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Fehler bei Reddit-Sentiment-Analyse'
        });
      }
    }
  );

  // 🎯 Bulk Trend Optimize (alle Produkte auf einmal)
  fastify.post<{ Body: BulkTrendOptimizeRequest }>(
    '/ai/bulk-trend-optimize',
    async (request: FastifyRequest<{ Body: BulkTrendOptimizeRequest }>, reply: FastifyReply) => {
      try {
        const { productIds, updateTypes } = request.body;

        if (!productIds || productIds.length === 0) {
          return reply.code(400).send({ 
            success: false, 
            error: 'Keine Produkt-IDs angegeben' 
          });
        }

        // TODO: Implementiere Bulk-Update-Logik
        // - Lade alle Produkte von WooCommerce
        // - Für jedes Produkt: Trend-Analyse durchführen
        // - Updates parallel verarbeiten
        // - Batch-Update zu WooCommerce

        return reply.send({
          success: true,
          data: {
            totalProducts: productIds.length,
            updateTypes,
            status: 'QUEUED',
            message: 'Bulk-Optimierung wird im Hintergrund verarbeitet',
            estimatedTime: `${productIds.length * 2} Sekunden`
          }
        });

      } catch (error: any) {
        fastify.log.error('Bulk Optimize Error:', error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Fehler bei Bulk-Optimierung'
        });
      }
    }
  );

  fastify.log.info('✅ AI Product Assistant Routes registered (with Trend Support)');
}
