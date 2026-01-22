import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getOpenAIClient, executeOpenAI } from '../../../../utils/openaiHelper';
import { SpecializationPersistenceManager } from '../../../../services/specializationPersistenceManager';

interface _PersonalizationOffer {
  title: string;
  description: string;
  score: number;
  reason: string;
}

interface PersonalizationQuery {
  userId?: string;
}

export default async function mlPersonalizationRoutes(
  fastify: FastifyInstance
) {
  fastify.get<{ Querystring: PersonalizationQuery }>(
    '/ml/offers',
    async (
      request: FastifyRequest<{ Querystring: PersonalizationQuery }>,
      reply: FastifyReply
    ) => {
      const { userId = '1' } = request.query;

      if (!userId) {
        return reply
          .status(400)
          .send({ success: false, error: 'userId ist erforderlich' });
      }

      try {
        const openai = getOpenAIClient();

        // 🎯 Lade die GLOBALE aktive Spezialisierung (für alle Nutzer gleich)
        let specialization;
        try {
          const specializationResult = await SpecializationPersistenceManager.getActiveSpecialization('default');
          specialization = specializationResult?.specialization;
        } catch (err) {
          // Fallback wenn Spezialisierung nicht geladen werden kann
          console.warn('⚠️ Spezialisierung konnte nicht geladen werden, nutze Fallback:', err);
          specialization = null;
        }
        
        // Fallback: Nutze generische Spezialisierung wenn keine gefunden
        if (!specialization) {
          specialization = {
            id: 'generic-personalization',
            name: 'Allgemeine Personalisierung',
            systemPrompt: 'Du bist ein KI-Personalisierungs-Engine für E-Commerce',
            contextInstructions: ['Empfehle relevante Produkte basierend auf Kundenpräferenzen'],
            description: 'Allgemeine Produktempfehlungen',
            category: 'general',
          };
        }

        // 🎯 Extrahiere Spezialisierungsdetails
        const specializationName = specialization.name || specialization.id || 'Generisch';
        const specializationDescription = specialization.description || '';
        const categoryGuideline = (specialization.contextInstructions || []).join('\n- ') || specialization.category || '';
        const systemPrompt = specialization.systemPrompt || 'Du bist ein KI-Personalisierungs-Engine für E-Commerce';

        const prompt = `🎯 AKTIVE SHOP-SPEZIALISIERUNG: ${specializationName}

${specializationDescription}

DEINE AUFGABE:
Generiere 3-5 personalisierte Produktangebote für Nutzer ID: ${userId}

⚠️ KRITISCHE ANFORDERUNG - ABSOLUTE PRIORITÄT:
Du MUSST AUSSCHLIESSLICH Produkte aus der Kategorie "${specializationName}" empfehlen!

KATEGORIERICHTLINIEN:
${categoryGuideline ? `- ${categoryGuideline}` : ''}

VERBOTEN:
- Produkte außerhalb der Spezialisierung "${specializationName}"
- Generische Empfehlungen ohne Kategoriebezug
- Cross-Category Vorschläge

BEISPIEL für "${specializationName}":
Wenn Tierbedarf → ONLY: Hundefutter, Katzenstreu, Spielzeug für Tiere, Kratzbäume, Leinen, Näpfe
Wenn Technik → ONLY: Laptops, Smartphones, Kopfhörer, Tablets, Zubehör, Gadgets
Wenn Mode → ONLY: Kleidung, Schuhe, Taschen, Accessoires

Antworte STRIKT als JSON:
{
  "success": true,
  "offers": [
    {
      "title": "Produktname (passend zu ${specializationName})",
      "description": "Kurze Beschreibung (1-2 Sätze)",
      "score": 0.0-1.0,
      "reason": "Warum relevant für Nutzer (1 Satz)"
    }
  ]
}

FINALE REGEL: KEINE Produkte außerhalb "${specializationName}"!`;

        const completion = await executeOpenAI(
          () =>
            openai.chat.completions.create({
              model: 'gpt-4o-mini',
              temperature: 0.5, // Reduzierte Temperature für konsistentere Ergebnisse
              messages: [
                {
                  role: 'system',
                  content: systemPrompt + `\n\n⚠️ KRITISCH: Du bist AUSSCHLIESSLICH auf die Kategorie "${specializationName}" spezialisiert. Empfehle NIEMALS Produkte außerhalb dieser Kategorie!`,
                },
                { role: 'user', content: prompt },
              ],
            }),
          'ml-personalization-offers',
          { userId, specialization: specializationName }
        );

        const content = completion.choices?.[0]?.message?.content || '{}';
        let parsed: any;

        try {
          parsed = JSON.parse(content);
        } catch (err) {
          fastify.log.warn(
            { err, content },
            'Personalisierungs-Antwort konnte nicht geparst werden'
          );
          parsed = {
            success: true,
            offers: [
              {
                title: 'Produktempfehlung',
                description:
                  'Ein empfohlenes Produkt basierend auf deinen Interessen',
                score: 0.8,
                reason: 'Relevant für dein Profil',
              },
            ],
          };
        }

        return reply.send({
          success: true,
          offers: Array.isArray(parsed.offers) ? parsed.offers : [],
        });
      } catch (error) {
        fastify.log.error({ err: error }, '❌ ML Personalization failed');
        return reply.status(500).send({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Personalisierung fehlgeschlagen',
        });
      }
    }
  );
}
