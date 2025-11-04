// backend/routes/app/api/marketing/template-routes.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import OpenAI from 'openai';

interface GenerateTemplateBody {
  templateCategory: string;
  industry: string;
  customization?: string;
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
}
