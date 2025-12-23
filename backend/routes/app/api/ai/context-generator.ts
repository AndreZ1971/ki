import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getOpenAIClient, executeOpenAI } from '../../../../utils/openaiHelper';

interface ContextGeneratorBody {
  contextType: 'technical' | 'marketing' | 'educational' | 'creative';
  topic: string;
  targetAudience?: string;
  detailLevel?: 'basic' | 'medium' | 'detailed' | 'expert';
  tone?: 'neutral' | 'friendly' | 'authoritative' | 'playful';
}

export default async function contextGeneratorRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ContextGeneratorBody }>(
    '/ai/context/generate',
    async (request: FastifyRequest<{ Body: ContextGeneratorBody }>, reply: FastifyReply) => {
      const { topic, contextType, targetAudience = '', detailLevel = 'medium', tone = 'neutral' } = request.body;

      if (!topic || !contextType) {
        return reply.status(400).send({ success: false, error: 'topic und contextType sind erforderlich' });
      }

      try {
        const openai = getOpenAIClient();

        const prompt = `Erzeuge einen KI-Kontext für bessere Prompt-Antworten.

Topic: ${topic}
Context-Type: ${contextType}
Target-Audience: ${targetAudience || 'general'}
Detail-Level: ${detailLevel}
Tone: ${tone}

Antworte strikt als JSON mit folgender Struktur:
{
  "context": "Markdown-Kontext, klar strukturiert, kurze Absätze",
  "summary": "1-2 Sätze Kurzfassung",
  "keyPoints": ["Stichpunkt 1", "Stichpunkt 2"],
  "promptTemplate": "Vorlagen-Prompt, den der Nutzer kopieren kann",
  "guardrails": ["Sicherheits-/Qualitäts-Leitplanke 1", "Leitplanke 2"],
  "metadata": {
    "confidence": 0.0-1.0,
    "model": "gpt-4o-mini",
    "generatedAt": "ISO-Timestamp"
  }
}

Richtlinien:
- Passe Inhalt, Tiefe und Wortwahl an Context-Type und Zielgruppe an.
- Bleibe präzise, vermeide Füllwörter.
- Nutze deutsch als Sprache.
- Der Prompt in "promptTemplate" soll die Rolle und den Stil klar machen und Variable {{input}} lassen.
- Guardrails sollen Bias/PII vermeiden und Faktencheck/Quellenhinweise empfehlen.`;

        const completion = await executeOpenAI(
          () => openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.4,
            messages: [
              { role: 'system', content: 'Du bist ein präziser Prompt-Context-Generator. Antworte immer in kompaktem JSON.' },
              { role: 'user', content: prompt }
            ]
          }),
          'ai-context-generator',
          { topic, contextType, targetAudience, detailLevel }
        );

        const content = completion.choices?.[0]?.message?.content || '{}';
        let parsed: any;
        try {
          parsed = JSON.parse(content);
        } catch (err) {
          fastify.log.warn({ err, content }, 'Kontext-Antwort konnte nicht geparst werden, nutze Fallback');
          parsed = { context: content };
        }

        const normalized = {
          context: typeof parsed.context === 'string' ? parsed.context : content,
          summary: parsed.summary || '',
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          promptTemplate: parsed.promptTemplate || 'Du bist ein Assistent. Nutze folgenden Kontext: {{input}}',
          guardrails: Array.isArray(parsed.guardrails) ? parsed.guardrails : [],
          metadata: {
            confidence: typeof parsed?.metadata?.confidence === 'number' ? parsed.metadata.confidence : 0.73,
            model: parsed?.metadata?.model || 'gpt-4o-mini',
            generatedAt: parsed?.metadata?.generatedAt || new Date().toISOString()
          }
        };

        return reply.send({ success: true, data: normalized });
      } catch (error) {
        fastify.log.error({ err: error }, '❌ Context generation failed');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Kontextgenerierung fehlgeschlagen'
        });
      }
    }
  );
}
