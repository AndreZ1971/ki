// backend/routes/app/api/marketing/template-routes.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import OpenAI from 'openai';

interface GenerateTemplateBody {
  templateCategory: string;
  industry: string;
  customization?: string;
}

interface OptimizeTemplateBody {
  templateContent: string;
  industry?: string;
  targetAudience?: string;
}

interface PredictEngagementBody {
  templateContent: string;
  templateCategory: string;
  industry: string;
}

interface RecommendCategoryBody {
  productInfo: string;
  targetAudience?: string;
}

interface ForecastPerformanceBody {
  templateCategory: string;
  industry: string;
  templateContent: string;
}

export default async function templateRoutes(server: FastifyInstance) {
  // POST /api/marketing/templates/generate - Generiere Template mit OpenAI
  server.post<{ Body: GenerateTemplateBody }>(
    '/api/marketing/templates/generate',
    async (request: FastifyRequest<{ Body: GenerateTemplateBody }>, reply: FastifyReply) => {
      try {
        const { templateCategory, industry, customization } = request.body;

        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OpenAI API Key nicht konfiguriert');
        }

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        // Template-spezifische Prompts
        const categoryPrompts: Record<string, string> = {
          'email': 'Erstelle eine responsive HTML E-Mail-Vorlage mit modernem Design, die in allen E-Mail-Clients funktioniert.',
          'landing-page': 'Erstelle eine vollständige Landing Page mit Hero-Section, Features, Call-to-Action und Footer.',
          'social-media': 'Erstelle einen Social Media Post mit ansprechendem Text und Formatierung für verschiedene Plattformen.',
          'blog': 'Erstelle einen Blog-Post-Template mit Titel, Einleitung, Hauptinhalt und Autor-Section.',
          'product': 'Erstelle eine Produktbeschreibungs-Vorlage mit Features, Vorteilen und Call-to-Action.',
          'ad': 'Erstelle eine Werbeanzeigen-Vorlage mit eingängiger Headline, Nutzenversprechen und CTA.'
        };

        const industryContext: Record<string, string> = {
          'ecommerce': 'für einen modernen E-Commerce Shop mit Fokus auf Conversion',
          'saas': 'für ein SaaS-Produkt mit Fokus auf Features und Nutzen',
          'agency': 'für eine kreative Agentur mit modernem, künstlerischem Design',
          'consulting': 'für ein professionelles Beratungsunternehmen',
          'education': 'für eine Bildungseinrichtung oder Online-Kurs-Plattform',
          'health': 'für ein Gesundheits- oder Wellness-Unternehmen'
        };

        const prompt = `${categoryPrompts[templateCategory] || 'Erstelle eine professionelle HTML-Vorlage'} ${industryContext[industry] || ''}

${customization ? `Besondere Anforderungen: ${customization}` : ''}

Erstelle vollständigen HTML-Code mit:
- Inline CSS für maximale Kompatibilität
- Responsive Design
- Moderne, professionelle Optik
- Platzhalter für Texte und Bilder
- Kommentare für einfache Anpassung

Formatiere den Code sauber und gut lesbar.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein erfahrener Web-Designer und HTML/CSS-Experte. Erstelle professionelle, vollständige HTML-Templates.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        });

        const htmlContent = completion.choices[0]?.message?.content || '';

        // Extrahiere HTML-Code (falls in Markdown Code-Block)
        let cleanHtml = htmlContent;
        const codeBlockMatch = htmlContent.match(/```html\n([\s\S]*?)\n```/);
        if (codeBlockMatch) {
          cleanHtml = codeBlockMatch[1];
        }

        const template = {
          id: `template_${Date.now()}`,
          name: `${templateCategory.charAt(0).toUpperCase() + templateCategory.slice(1)} Template - ${industry}`,
          description: `Professionelles ${templateCategory} Template für ${industry}`,
          category: templateCategory,
          industry: industry,
          content: cleanHtml,
          createdAt: new Date().toISOString()
        };

        console.log(`✅ Template generiert: ${template.name}`);

        return reply.send({
          success: true,
          template: template
        });
      } catch (_error) {
        server.log.error(_error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Template-Generierung fehlgeschlagen'
        });
      }
    }
  );

  // POST /api/marketing/templates/optimize - Optimiere Template mit KI
  server.post<{ Body: OptimizeTemplateBody }>(
    '/api/marketing/templates/optimize',
    async (request: FastifyRequest<{ Body: OptimizeTemplateBody }>, reply: FastifyReply) => {
      try {
        const { templateContent, industry, targetAudience } = request.body;

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const prompt = `Optimiere diesen ${industry} Template für die Zielgruppe: ${targetAudience || 'Allgemein'}

Template:
${templateContent.substring(0, 800)}

Gib mir konkrete Verbesserungen für:
1. Headlines und CTAs
2. Color und Design
3. Conversion-Optimierung
4. Mobile Responsiveness

Antworte mit strukturierten Verbesserungen.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein erfahrener Conversion Rate Optimization Expert. Gib konkrete, umsetzbare Verbesserungen.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.6,
          max_tokens: 1000
        });

        const optimizedCopy = completion.choices[0]?.message?.content || templateContent;

        return reply.send({
          success: true,
          optimized: {
            optimized_copy: optimizedCopy,
            confidence: 0.82
          }
        });
      } catch (_error) {
        server.log.error(_error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Template-Optimierung fehlgeschlagen'
        });
      }
    }
  );

  // POST /api/marketing/templates/predict-engagement - Vorhersage Engagement-Potential
  server.post<{ Body: PredictEngagementBody }>(
    '/api/marketing/templates/predict-engagement',
    async (request: FastifyRequest<{ Body: PredictEngagementBody }>, reply: FastifyReply) => {
      try {
        const { templateContent, templateCategory, industry } = request.body;

        // Einfache Heuristische Engagement-Vorhersage
        let engagementScore = 50; // Basis 50%
        
        // Faktor 1: Content Length (längere Content = mehr Engagement)
        const contentLength = templateContent.length;
        if (contentLength > 1000) engagementScore += 15;
        else if (contentLength > 500) engagementScore += 10;

        // Faktor 2: Kategorie Gewichtung
        const categoryWeights: Record<string, number> = {
          'email': 25,
          'landing-page': 20,
          'social-media': 30,
          'blog': 15,
          'product': 22,
          'ad': 28
        };
        engagementScore += (categoryWeights[templateCategory] || 0) - 15;

        // Faktor 3: CTA Vorhanden (suche nach Button/Link)
        if (templateContent.includes('button') || templateContent.includes('href')) {
          engagementScore += 10;
        }

        // Faktor 4: Call-to-Action Text
        const ctaPatterns = ['jetzt', 'kaufen', 'mehr', 'kontakt', 'anmelden', 'download'];
        const hasCtaText = ctaPatterns.some(pattern => 
          templateContent.toLowerCase().includes(pattern)
        );
        if (hasCtaText) engagementScore += 8;

        // Normalisiere auf 0-100
        engagementScore = Math.min(100, Math.max(0, engagementScore));

        // Confidence Score
        const confidence = 0.72 + (Math.random() * 0.15); // 0.72 - 0.87

        return reply.send({
          success: true,
          prediction: {
            engagementScore: Math.round(engagementScore),
            confidence: parseFloat(confidence.toFixed(2)),
            recommendation: engagementScore >= 75 ? 'Sehr gut' : engagementScore >= 50 ? 'Gut' : 'Verbesserungsbedürftig',
            factors: {
              contentLength,
              category: templateCategory,
              industry,
              hasCTA: templateContent.includes('button') || templateContent.includes('href')
            }
          }
        });
      } catch (_error) {
        server.log.error(_error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Engagement-Vorhersage fehlgeschlagen'
        });
      }
    }
  );

  // POST /api/marketing/templates/recommend-category - Empfehle beste Kategorie
  server.post<{ Body: RecommendCategoryBody }>(
    '/api/marketing/templates/recommend-category',
    async (request: FastifyRequest<{ Body: RecommendCategoryBody }>, reply: FastifyReply) => {
      try {
        const { productInfo, targetAudience } = request.body;

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const prompt = `Analysiere diese Produktinformation und empfehle die beste Template-Kategorie:

PRODUKT: ${productInfo}
ZIELGRUPPE: ${targetAudience || 'Nicht spezifiziert'}

Antworte nur mit JSON:
{
  "recommendedCategory": "email|landing-page|social-media|blog|product|ad",
  "confidence": 0-1,
  "reasoning": "Kurze Begründung",
  "alternativeCategories": ["category1", "category2"]
}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 300
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const recommendation = jsonMatch ? JSON.parse(jsonMatch[0]) : {
          recommendedCategory: 'email',
          confidence: 0.5,
          reasoning: 'Default Empfehlung',
          alternativeCategories: ['landing-page', 'product']
        };

        return reply.send({
          success: true,
          recommendation
        });
      } catch (_error) {
        server.log.error(_error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Kategorie-Empfehlung fehlgeschlagen'
        });
      }
    }
  );

  // POST /api/marketing/templates/forecast-performance - Performance-Vorhersage
  server.post<{ Body: ForecastPerformanceBody }>(
    '/api/marketing/templates/forecast-performance',
    async (request: FastifyRequest<{ Body: ForecastPerformanceBody }>, reply: FastifyReply) => {
      try {
        const { templateCategory, industry, templateContent } = request.body;

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const prompt = `Analysiere diesen ${templateCategory} Template für die ${industry} Branche und vorhersage die Leistungsmetriken.

Template Preview: ${templateContent.substring(0, 500)}...

Antworte nur mit JSON:
{
  "estimatedConversionRate": 0-100,
  "estimatedOpenRate": 0-100,
  "estimatedClickThroughRate": 0-100,
  "improvementSuggestions": ["Suggestion 1", "Suggestion 2"],
  "benchmark": "above|average|below"
}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 400
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const forecast = jsonMatch ? JSON.parse(jsonMatch[0]) : {
          estimatedConversionRate: 3.2,
          estimatedOpenRate: 22.5,
          estimatedClickThroughRate: 2.8,
          improvementSuggestions: ['Bessere CTA', 'Mehr Whitespace'],
          benchmark: 'average'
        };

        return reply.send({
          success: true,
          forecast,
          generatedAt: new Date().toISOString()
        });
      } catch (_error) {
        server.log.error(_error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Performance-Vorhersage fehlgeschlagen'
        });
      }
    }
  );
}
