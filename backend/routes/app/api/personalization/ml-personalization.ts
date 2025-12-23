import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getOpenAIClient, executeOpenAI } from '../../../../utils/openaiHelper';

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

        const prompt = `Du bist ein KI-Personalisierungs-Engine für einen E-Commerce Shop.
        
Generiere 3-5 personalisierte Produktangebote für Nutzer ID: ${userId}

Antworte STRIKT als JSON mit dieser Struktur:
{
  "success": true,
  "offers": [
    {
      "title": "Produktname",
      "description": "Kurze Beschreibung (1-2 Sätze)",
      "score": 0.0-1.0,
      "reason": "Warum dieses Angebot für diesen Nutzer (1 Satz)"
    }
  ]
}

Richtlinien:
- Nutze verschiedene Produktkategorien
- Score basiert auf Relevanz für diesen Nutzer
- Beschreibungen sollen kurz und verkaufsfördernd sein
- Alle Texte auf Deutsch`;

        const completion = await executeOpenAI(
          () =>
            openai.chat.completions.create({
              model: 'gpt-4o-mini',
              temperature: 0.7,
              messages: [
                {
                  role: 'system',
                  content:
                    'Du bist ein KI-Personalisierungs-Engine. Antworte immer in kompaktem JSON mit der angeforderten Struktur.',
                },
                { role: 'user', content: prompt },
              ],
            }),
          'ml-personalization-offers',
          { userId }
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
