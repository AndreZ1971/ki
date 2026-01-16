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
        const categoryGuideline = (specialization.contextInstructions || []).join(' ') || specialization.category || '';

        const prompt = `Du bist ein KI-Personalisierungs-Engine für einen E-Commerce Shop.

Generiere 3-5 personalisierte Produktangebote für Nutzer ID: ${userId}

🎯 SPEZIALISIERUNG DES NUTZERS (BINDEND):
- Name: ${specializationName}
- Beschreibung: ${specializationDescription}
- Kategorie-Richtlinie: ${categoryGuideline}

⚠️ KRITISCH: Du MUSST dich STRIKT an diese Spezialisierung halten. Empfehle KEINE Produkte außerhalb dieser Kategorie!

Wenn die Spezialisierung "Technik & Elektronik" ist:
  → NUR Elektronik, Gadgets, Computer, Smartphones, Zubehör
  → KEINE Kleidung, Schuhe, Möbel, Bücher

Wenn die Spezialisierung "Fashion & Mode" ist:
  → NUR Kleidung, Schuhe, Accessoires
  → KEINE Elektronik, Möbel, Technik

Wenn die Spezialisierung "Sport & Fitness" ist:
  → NUR Sportartikel, Fitness-Geräte, Sportzubehör
  → KEINE Mode, Elektronik

Wenn die Spezialisierung "Küche & Haushalt" ist:
  → NUR Küchengeräte, Haushaltswaren
  → KEINE Mode, Elektronik, Sport

Wenn die Spezialisierung "Bücher & Bildung" ist:
  → NUR Bücher, E-Books, Lernmaterialien
  → KEINE Mode, Sport, Küchengeräte

Antworte STRIKT als JSON:
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
- ALLE Produkte müssen EXAKT zur Spezialisierung passen
- Score basiert auf Relevanz für diesen Nutzer
- Beschreibungen sollen kurz und verkaufsfördernd sein
- Alle Texte auf Deutsch
- KEINE Produkte außerhalb der Spezialisierungskategorie!`;

        const completion = await executeOpenAI(
          () =>
            openai.chat.completions.create({
              model: 'gpt-4o-mini',
              temperature: 0.7,
              messages: [
                {
                  role: 'system',
                  content:
                    'Du bist ein KI-Personalisierungs-Engine. Antworte immer in kompaktem JSON mit der angeforderten Struktur. Du hältst dich strikt an die Spezialisierung des Nutzers!',
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
