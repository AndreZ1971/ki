// backend/routes/app/api/marketing/marketing-routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { analyzeSegmentsAI, generateCampaignAI } from './conversion-ai.js';
import config from '../../../../config.js';

interface GermanContentRequest {
  contentType: string;
  topic: string;
  targetAudience?: string;
  tone: string;
  lengthMode?: 'short' | 'medium' | 'long';
  formality?: 'du' | 'sie';
  includeSeo?: boolean;
  includeFaqs?: boolean;
  includeCtas?: boolean;
  keywords?: string;
  avoidTerms?: string;
}

interface EmailCampaignRequest {
  campaignName: string;
  emailSubject: string;
  targetSegment: string;
  sendTime: string;
}

interface AudioRequest {
  audioText: string;
  voice: string;
  platform: string;
}

interface AudioScriptRequest {
  topic?: string;
  platform?: string;
  tone?: 'casual' | 'professional' | 'energetic' | 'educational';
  targetAudience?: string;
  duration?: 'short' | 'medium' | 'long';
  hooks?: number;
  ctas?: number;
  useEmojis?: boolean;
}

interface PostRequest {
  postContent: string;
  platform: string;
  scheduleTime: string;
}

interface ConversionRequest {
  userSegment: string;
  incentiveType: string;
  conversionGoal: string;
}

interface MonetizationRequest {
  contentTitle: string;
  contentType: string;
  monetizationStrategy: string;
  pricing: string;
}

interface TemplateRequest {
  templateCategory: string;
  industry: string;
  customization?: string;
}

interface SocialPostGenerationRequest {
  topic: string;
  targetAudience?: string;
  tone: 'casual' | 'professional' | 'energetic' | 'educational';
  platforms: ('linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'youtube')[];
  includeHashtags: boolean;
  includeEmojis: boolean;
  ctaType?: 'none' | 'click' | 'engagement' | 'message' | 'like';
  customBriefing?: string;
}

interface GeneratedPost {
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'youtube';
  content: string;
  hashtags?: string[];
  characterCount: number;
  estimatedEngagement?: string;
  suggestions?: string[];
}

interface GeneratedPostsResponse {
  success: boolean;
  posts: GeneratedPost[];
  metadata: {
    topic: string;
    generatedAt: string;
    totalPosts: number;
  };
}

// Platform-specific configuration for AI prompting
const platformConstraints = {
  linkedin: {
    maxChars: 3000,
    style: 'professional, business-focused, authoritative',
    hashtagLimit: 3,
    preferVideo: true,
    avoidEmojis: false,
    includeCTA: 'professional',
    bestPractices: ['Share insights', 'Include statistics', 'Use professional tone', 'Encourage engagement']
  },
  facebook: {
    maxChars: 2000,
    style: 'personal, conversational, friendly',
    hashtagLimit: 5,
    preferVideo: true,
    avoidEmojis: false,
    includeCTA: 'friendly',
    bestPractices: ['Tell a story', 'Ask questions', 'Use emojis moderately', 'Encourage sharing']
  },
  instagram: {
    maxChars: 2200,
    style: 'visual, trendy, engaging, lifestyle-focused',
    hashtagLimit: 30,
    preferVideo: true,
    avoidEmojis: false,
    includeCTA: 'engagement-focused',
    bestPractices: ['Use relevant hashtags', 'Include call to action', 'Use emojis creatively', 'Keep first line engaging']
  },
  twitter: {
    maxChars: 280,
    style: 'witty, concise, trending, conversational',
    hashtagLimit: 2,
    preferVideo: false,
    avoidEmojis: false,
    includeCTA: 'optional',
    bestPractices: ['Be concise', 'Use trending topics', 'Include link if relevant', 'Make it shareable']
  },
  tiktok: {
    maxChars: 2500,
    style: 'fun, trendy, youth-focused, meme-culture, energetic',
    hashtagLimit: 15,
    preferVideo: true,
    avoidEmojis: false,
    includeCTA: 'action-focused',
    bestPractices: ['Use trending sounds', 'Keep it entertaining', 'Include hashtag trends', 'Call to action clear']
  },
  youtube: {
    maxChars: 5000,
    style: 'detailed, SEO-optimized, professional, descriptive',
    hashtagLimit: 5,
    preferVideo: true,
    avoidEmojis: false,
    includeCTA: 'conversion-focused',
    bestPractices: ['Optimize for search', 'Include timestamps', 'Clear description', 'Strong CTA with links']
  }
};

export default async function marketingRoutes(fastify: FastifyInstance) {
  
  // ========== ML & AI CONVERSION ROUTES ==========
  
  // 0a. Analyze customer segments using ML
  fastify.get('/conversion/analyze-segments-ai', analyzeSegmentsAI);
  
  // 0b. Generate AI-powered campaign proposals
  fastify.post<{
    Body: {
      segmentId: string;
      segmentName: string;
      conversionGoal: string;
      incentiveType: string;
    };
  }>('/conversion/generate-campaign-ai', generateCampaignAI);
  
  // 0c. Create/save campaign - handled in conversion-routes.ts
  
  // ========== ORIGINAL ROUTES ==========
  
  // 1. German Content Generator
  fastify.post<{ Body: GermanContentRequest }>(
    '/content/german',
    async (request: FastifyRequest<{ Body: GermanContentRequest }>, reply: FastifyReply) => {
      const {
        contentType,
        topic,
        targetAudience,
        tone,
        lengthMode = 'medium',
        formality = 'du',
        includeSeo = true,
        includeFaqs = true,
        includeCtas = true,
        keywords,
        avoidTerms
      } = request.body;

      const fallbackContentMap: Record<string, string> = {
          'blog-post': `# ${topic}\n\n## Einführung\n\nWillkommen zu unserem ausführlichen Artikel über ${topic}. In diesem Beitrag erfahren Sie alles Wichtige...\n\n## Hauptteil\n\n${targetAudience ? `Speziell für ${targetAudience} haben wir folgende Insights zusammengestellt:\n\n` : ''}Lorem ipsum dolor sit amet, consectetur adipiscing elit. Unser Team hat umfangreiche Recherchen durchgeführt...\n\n## Fazit\n\nZusammenfassend lässt sich sagen, dass ${topic} ein wichtiges Thema ist. Bleiben Sie auf dem Laufenden!`,
          'product-description': `🛍️ **${topic}**\n\n✨ Highlights:\n• Premium Qualität\n• Sofort lieferbar\n• 100% Zufriedenheitsgarantie\n\n${tone === 'enthusiastic' ? '🚀 Dieses Produkt wird Ihr Leben verändern!\n\n' : ''}Beschreibung:\n${targetAudience ? `Perfekt für ${targetAudience}. ` : ''}Unser ${topic} überzeugt durch herausragende Eigenschaften und modernste Technologie.\n\n📦 Lieferumfang:\n• Hauptprodukt\n• Garantiekarte\n• Premium-Verpackung\n\n💡 Jetzt bestellen und von unseren Einführungspreisen profitieren!`,
          'social-media': `📱 ${topic}\n\n${tone === 'friendly' ? '👋 Hey Community! ' : ''}Heute haben wir etwas Besonderes für euch:\n\n✨ ${topic} ist jetzt verfügbar!\n\n${targetAudience ? `Speziell für ${targetAudience} 🎯\n\n` : ''}💬 Was haltet ihr davon? Kommentiert unten!\n\n#${topic.replace(/\s+/g, '')} #Marketing #Innovation`,
          'email': `Betreff: ${topic}\n\n${tone === 'professional' ? 'Sehr geehrte Damen und Herren,' : 'Hallo,'}\n\n${targetAudience ? `Als ${targetAudience} ` : 'Wir '}freuen uns, Ihnen ${topic} vorstellen zu dürfen.\n\nUnsere Highlights:\n• Punkt 1: Exzellente Qualität\n• Punkt 2: Faire Preise\n• Punkt 3: Schneller Service\n\n${tone === 'enthusiastic' ? '🎉 Jetzt zugreifen und profitieren!\n\n' : ''}Weitere Informationen finden Sie auf unserer Website.\n\n${tone === 'professional' ? 'Mit freundlichen Grüßen' : 'Beste Grüße'}\nIhr Team`,
          'landing-page': `🎯 ${topic}\n\n## ${tone === 'enthusiastic' ? '🚀 Revolution beginnt jetzt!' : 'Ihre Lösung für morgen'}\n\n${targetAudience ? `**Speziell entwickelt für ${targetAudience}**\n\n` : ''}### Vorteile auf einen Blick:\n\n✅ Vorteil 1: Zeitsparend\n✅ Vorteil 2: Kosteneffizient\n✅ Vorteil 3: Einfach zu bedienen\n\n### Kundenstimmen:\n\n💬 "Absolut begeistert!" - Max M.\n⭐⭐⭐⭐⭐\n\n### Jetzt starten!\n\n[Call-to-Action Button]\n\n📞 Kontakt: info@example.com`,
          'press-release': `PRESSEMITTEILUNG\n\n${topic}\n\n${new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n${targetAudience ? `[Stadt/Region für ${targetAudience}] - ` : '[Stadt] - '}Heute gibt [Unternehmen] bekannt: ${topic}.\n\n"Diese Entwicklung markiert einen wichtigen Meilenstein", erklärt [Name], [Position]. "${tone === 'professional' ? 'Wir setzen neue Standards in der Branche.' : 'Wir sind begeistert von den Möglichkeiten.'}"\n\nWeitere Informationen:\n- Detail 1\n- Detail 2\n- Detail 3\n\nÜber das Unternehmen:\n[Boilerplate Text]\n\nKontakt:\n[Name]\n[Email]\n[Telefon]`
        };

      const fallback = () => {
        const generatedContent = fallbackContentMap[contentType] || `Content für ${topic} wird generiert...\n\nThema: ${topic}\nZielgruppe: ${targetAudience || 'Allgemein'}\nTon: ${tone}\n\nDieser Content würde normalerweise von einer KI generiert werden.`;
        return {
          success: true,
          content: generatedContent,
          metaTitle: `${topic} | ${contentType}`,
          metaDescription: `Erfahren Sie mehr über ${topic}${targetAudience ? ` für ${targetAudience}` : ''}.`,
          headlines: [topic, `Warum ${topic} wichtig ist`, `So profitieren Sie von ${topic}`],
          faqs: [
            { question: `Was ist ${topic}?`, answer: `${topic} beschreibt ein wichtiges Thema für ${targetAudience || 'unsere Zielgruppe'}.` },
            { question: `Für wen ist ${topic} geeignet?`, answer: targetAudience ? `${topic} ist besonders interessant für ${targetAudience}.` : `${topic} eignet sich für viele Zielgruppen.` }
          ],
          ctas: ['Jetzt informieren', 'Angebot anfordern', 'Demo buchen'],
          keywords: [topic, targetAudience || 'Zielgruppe', tone],
          wordCount: generatedContent.split(/\s+/).length,
          readTimeMinutes: Math.max(1, Math.round(generatedContent.split(/\s+/).length / 180)),
          generatedAt: new Date().toISOString()
        };
      };

      try {
        if (!process.env.OPENAI_API_KEY) {
          return reply.send(fallback());
        }

        const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
        const prompt = `Du bist ein deutscher Marketing-Texter. Erzeuge hochwertiges deutsches Marketing-Content als JSON. Halte dich strikt an die Vorgaben. Ausgabe MUSS valides JSON sein.

Content-Typ: ${contentType}
Thema: ${topic}
Zielgruppe: ${targetAudience || 'allgemein'}
Tonfall: ${tone}
Länge: ${lengthMode}
Formalität: ${formality}
Keywords (optional): ${keywords || 'keine'}
Zu vermeiden (optional): ${avoidTerms || 'keine'}
SEO: ${includeSeo ? 'ja' : 'nein'}
FAQs: ${includeFaqs ? 'ja' : 'nein'}
CTAs: ${includeCtas ? 'ja' : 'nein'}

Struktur:
{
  "content": "haupttext",
  "metaTitle": "...",
  "metaDescription": "...",
  "headlines": ["...", "..."],
  "faqs": [{"question": "...", "answer": "..."}],
  "ctas": ["..."],
  "keywords": ["..."],
  "wordCount": number,
  "readTimeMinutes": number
}`;

        const completion = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'Du bist ein präziser deutscher Marketing-Texter. Antworte nur mit JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          })
        });

        if (!completion.ok) {
          throw new Error(`OpenAI Error: ${completion.status}`);
        }

        const data = await completion.json();
        const messageContent = data.choices?.[0]?.message?.content;
        if (!messageContent) {
          throw new Error('OpenAI lieferte keine Nachricht');
        }

        const parsed = JSON.parse(messageContent);
        // Sanity-Fallbacks
        const content = parsed.content || fallback().content;
        const wordCount = parsed.wordCount || content.split(/\s+/).length;
        const readTimeMinutes = parsed.readTimeMinutes || Math.max(1, Math.round(wordCount / 180));

        return reply.send({
          success: true,
          content,
          metaTitle: parsed.metaTitle,
          metaDescription: parsed.metaDescription,
          headlines: parsed.headlines || [],
          faqs: parsed.faqs || [],
          ctas: parsed.ctas || [],
          keywords: parsed.keywords || [],
          wordCount,
          readTimeMinutes,
          generatedAt: new Date().toISOString()
        });

      } catch (_error) {
        fastify.log.error(_error);
        return reply.send(fallback());
      }
    }
  );

  // 2. Email Marketing Automation
  fastify.post<{ Body: EmailCampaignRequest }>(
    '/email/automate',
    async (request: FastifyRequest<{ Body: EmailCampaignRequest }>, reply: FastifyReply) => {
      const { campaignName, emailSubject, targetSegment, sendTime } = request.body;

      try {
        // Simuliere Kampagnen-Erstellung
        const segmentSizes: Record<string, number> = {
          'all': 1245,
          'new': 320,
          'active': 650,
          'inactive': 230,
          'high-value': 85,
          'subscribers': 890
        };

        const estimatedReach = segmentSizes[targetSegment] || 0;

        return reply.send({
          success: true,
          campaign: {
            id: `camp_${Date.now()}`,
            name: campaignName,
            subject: emailSubject,
            segment: targetSegment,
            schedule: sendTime,
            estimatedReach,
            status: sendTime === 'immediate' ? 'sending' : 'scheduled',
            createdAt: new Date().toISOString()
          },
          stats: {
            sent: 0,
            opened: 0,
            clicked: 0
          }
        });

      } catch (_error) {
        fastify.log.error(_error);
        return reply.status(500).send({
          success: false,
          error: 'Kampagnen-Erstellung fehlgeschlagen'
        });
      }
    }
  );

  // 3. Social Media Audio Script Generator (KI-gestützt)
  fastify.post<{ Body: AudioScriptRequest }>(
    '/social/audio/generate-script',
    async (request: FastifyRequest<{ Body: AudioScriptRequest }>, reply: FastifyReply) => {
      const {
        topic,
        platform = 'instagram',
        tone = 'casual',
        targetAudience,
        duration = 'medium',
        hooks = 3,
        ctas = 2,
        useEmojis = true
      } = request.body || {};

      const fallback = () => {
        const durationMap = { short: '30-45', medium: '60-90', long: '120-180' };
        const platformEmojis: Record<string, string> = {
          'instagram': '📸',
          'tiktok': '🎵',
          'youtube': '▶️',
          'facebook': '👍'
        };

        const script = `${useEmojis ? platformEmojis[platform] : ''}  ${topic || 'Spannender Content'}\n\nHallo${targetAudience ? ` ${targetAudience}` : ''},\n\nHier ist eine großartige Idee für dich:\n- Punkt 1: Wertvolles Insight\n- Punkt 2: Praktischer Tipp\n- Punkt 3: Actionable Takeaway\n\nWas hältst du davon? Schreib mir einen Kommentar!\n\n${useEmojis ? '#' + (topic || 'content').replace(/\\s+/g, '') : ''}`;

        return {
          success: true,
          script,
          hooks: [`${topic || 'Thema'}: Du wirst überrascht sein...`, `3 Tipps die dein ${platform} Game verändern...`, `Das hättest du früher wissen sollen...`],
          ctas: ['Jetzt probieren!', 'Schreib mir einen Kommentar!'],
          voiceRecommendations: {
            recommended: tone === 'energetic' ? 'fable' : tone === 'professional' ? 'onyx' : 'nova',
            alternatives: ['alloy', 'nova', 'onyx']
          },
          platformTips: [
            `${platform === 'instagram' ? 'Instagram liebt Verticals - nutze die volle Höhe!' : ''}`,
            `${platform === 'tiktok' ? 'Erste 3 Sekunden sind entscheidend - Hook gleich am Anfang!' : ''}`,
            `${platform === 'youtube' ? 'Nutze Pattern Interrupts alle 5-10 Sekunden!' : ''}`,
            `${platform === 'facebook' ? 'Achte auf Video mit Text-Overlay für Sound-off Zuschauer!' : ''}`
          ],
          wordCount: script.split(/\\s+/).length,
          estimatedDuration: durationMap[duration],
          readTimeMinutes: Math.max(1, Math.round(script.split(/\\s+/).length / 180)),
          generatedAt: new Date().toISOString()
        };
      };

      try {
        if (!process.env.OPENAI_API_KEY) {
          return reply.send(fallback());
        }

        const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
        const durationWords = { short: '50-80', medium: '100-150', long: '200-300' };

        const prompt = `Du bist ein Social-Media Audio-Script-Expert. Schreibe ein fesselndes Skript für ein Audio-Beitrag. Antworte nur mit JSON.

THEMA: ${topic || 'Allgemeines Thema'}
PLATTFORM: ${platform}
TON: ${tone}
ZIELGRUPPE: ${targetAudience || 'allgemein'}
LÄNGE: ${durationWords[duration] || '100-150'} Wörter
HOOKS: ${hooks}
CTAs: ${ctas}
EMOJIS: ${useEmojis ? 'ja' : 'nein'}

JSON Format:
{
  "script": "Das komplette Skript für den Audio-Beitrag",
  "hooks": ["Hook 1", "Hook 2", "Hook 3"],
  "ctas": ["CTA 1", "CTA 2"],
  "voiceRecommendations": {
    "recommended": "fable|nova|onyx|alloy",
    "alternatives": ["..."]
  },
  "platformTips": ["Tipp 1", "Tipp 2"],
  "wordCount": number,
  "estimatedDuration": "X-Y Sekunden"
}

Deutsch, natürlich, konversionsstark, plattformoptimiert.`;

        const completion = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'Du bist ein präziser deutscher Audio-Script-Autor für Social Media. Antworte nur mit JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          })
        });

        if (!completion.ok) {
          throw new Error(`OpenAI Error: ${completion.status}`);
        }

        const data = await completion.json();
        const messageContent = data.choices?.[0]?.message?.content;
        if (!messageContent) {
          throw new Error('OpenAI lieferte keine Nachricht');
        }

        const parsed = JSON.parse(messageContent);
        const script = parsed.script || fallback().script;
        const wordCount = parsed.wordCount || script.split(/\s+/).length;

        return reply.send({
          success: true,
          script,
          hooks: parsed.hooks || [],
          ctas: parsed.ctas || [],
          voiceRecommendations: parsed.voiceRecommendations || { recommended: 'nova', alternatives: [] },
          platformTips: parsed.platformTips || [],
          wordCount,
          estimatedDuration: parsed.estimatedDuration || `${Math.round(wordCount / 150 * 60)}-${Math.round(wordCount / 120 * 60)} Sekunden`,
          readTimeMinutes: Math.max(1, Math.round(wordCount / 180)),
          generatedAt: new Date().toISOString()
        });
      } catch (_error) {
        console.error('❌ Error generating audio script:', _error);
        return reply.send(fallback());
      }
    }
  );

  // 3.5 Social Media Audio Generator (OpenAI TTS)
  fastify.post<{ Body: AudioRequest }>(
    '/social/audio',
    async (request: FastifyRequest<{ Body: AudioRequest }>, reply: FastifyReply) => {
      const { audioText, voice, platform } = request.body;

      try {
        const apiKey = config.openAI?.apiKey;
        if (!apiKey) {
          return reply.status(400).send({
            success: false,
            error: 'OpenAI TTS ist nicht konfiguriert. Bitte openai.apiKey in connection.json hinterlegen oder einen alternativen TTS-Provider konfigurieren.'
          });
        }

        // Map voice zu OpenAI TTS voices
        const voiceMap: Record<string, string> = {
          'neutral': 'alloy',
          'friendly': 'nova',
          'professional': 'onyx',
          'energetic': 'fable'
        };

        const openaiVoice = voiceMap[voice] || 'alloy';

        // OpenAI TTS API Call
        const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: audioText,
            voice: openaiVoice,
            response_format: 'mp3'
          })
        });

        if (!ttsResponse.ok) {
          throw new Error(`OpenAI TTS Error: ${ttsResponse.status}`);
        }

        // Konvertiere Audio-Stream zu Base64
        const audioBuffer = await ttsResponse.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        
        // Berechne ungefähre Dauer (ca. 150 Wörter pro Minute)
        const wordCount = audioText.split(/\s+/).length;
        const estimatedDuration = Math.round((wordCount / 150) * 60);
        
        return reply.send({
          success: true,
          audio: {
            id: `audio_${Date.now()}`,
            data: `data:audio/mp3;base64,${base64Audio}`,
            duration: estimatedDuration,
            voice: openaiVoice,
            platform,
            text: audioText,
            format: 'mp3',
            generatedAt: new Date().toISOString()
          }
        });

      } catch (_error) {
        fastify.log.error(_error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Audio-Generierung fehlgeschlagen'
        });
      }
    }
  );

  // 4. Social Media Poster
  fastify.post<{ Body: PostRequest }>(
    '/social/poster',
    async (request: FastifyRequest<{ Body: PostRequest }>, reply: FastifyReply) => {
      const { postContent, platform, scheduleTime } = request.body;

      try {
        const platformLimits: Record<string, number> = {
          'twitter': 280,
          'instagram': 2200,
          'facebook': 63206,
          'linkedin': 3000,
          'tiktok': 2200,
          'youtube': 5000
        };

        const charLimit = platformLimits[platform] || 2000;
        const isWithinLimit = postContent.length <= charLimit;

        return reply.send({
          success: true,
          post: {
            id: `post_${Date.now()}`,
            content: postContent,
            platform,
            scheduleTime,
            status: scheduleTime === 'now' ? 'published' : 'scheduled',
            charCount: postContent.length,
            charLimit,
            isWithinLimit,
            publishedAt: scheduleTime === 'now' ? new Date().toISOString() : null,
            scheduledFor: scheduleTime !== 'now' ? new Date(Date.now() + 3600000).toISOString() : null
          },
          stats: {
            scheduled: scheduleTime !== 'now' ? 1 : 0,
            published: scheduleTime === 'now' ? 1 : 0,
            engagement: 0
          }
        });

      } catch (_error) {
        fastify.log.error(_error);
        return reply.status(500).send({
          success: false,
          error: 'Post-Erstellung fehlgeschlagen'
        });
      }
    }
  );

  // 5. Free to Paid Converter
  fastify.post<{ Body: ConversionRequest }>(
    '/conversion/free-to-paid',
    async (request: FastifyRequest<{ Body: ConversionRequest }>, reply: FastifyReply) => {
      const { userSegment, incentiveType, conversionGoal } = request.body;

      try {
        const segmentData: Record<string, { users: number; currentRate: number }> = {
          'inactive': { users: 1200, currentRate: 8 },
          'free-users': { users: 3500, currentRate: 12 },
          'trial-expired': { users: 450, currentRate: 22 },
          'low-engagement': { users: 890, currentRate: 15 }
        };

        const incentiveBoost: Record<string, number> = {
          'discount': 18,
          'trial': 25,
          'feature': 32,
          'bundle': 28
        };

        const segment = segmentData[userSegment] || { users: 1000, currentRate: 10 };
        const boost = incentiveBoost[incentiveType] || 20;
        const targetRate = Math.min(segment.currentRate + boost, 95);
        const estimatedConversions = Math.round(segment.users * (targetRate / 100));

        return reply.send({
          success: true,
          conversion: {
            id: `conv_${Date.now()}`,
            goal: conversionGoal,
            segment: userSegment,
            incentive: incentiveType,
            createdAt: new Date().toISOString()
          },
          data: {
            current: segment.currentRate,
            target: targetRate,
            users: segment.users,
            estimatedConversions,
            expectedRevenue: estimatedConversions * 49.99 // Beispiel-Preis
          }
        });

      } catch (_error) {
        fastify.log.error(_error);
        return reply.status(500).send({
          success: false,
          error: 'Conversion-Analyse fehlgeschlagen'
        });
      }
    }
  );

  // 6. Content Monetization
  fastify.post<{ Body: MonetizationRequest }>(
    '/content/monetize',
    async (request: FastifyRequest<{ Body: MonetizationRequest }>, reply: FastifyReply) => {
      const { contentTitle, contentType, monetizationStrategy, pricing } = request.body;

      try {
        const priceValue = parseFloat(pricing) || 49.99;
        const strategyMultipliers: Record<string, number> = {
          'one-time': 1.0,
          'subscription': 1.5,
          'freemium': 1.3,
          'tiered': 1.8
        };

        const multiplier = strategyMultipliers[monetizationStrategy] || 1.0;
        const estimatedMonthlyRevenue = Math.round(priceValue * multiplier * 50); // 50 Käufe/Monat

        return reply.send({
          success: true,
          content: {
            id: `content_${Date.now()}`,
            title: contentTitle,
            type: contentType,
            strategy: monetizationStrategy,
            pricing: priceValue,
            status: 'active',
            createdAt: new Date().toISOString()
          },
          revenue: {
            today: Math.round(priceValue * 5),
            week: Math.round(priceValue * 37),
            month: estimatedMonthlyRevenue,
            total: Math.round(estimatedMonthlyRevenue * 3.5)
          },
          projections: {
            monthly: estimatedMonthlyRevenue,
            yearly: Math.round(estimatedMonthlyRevenue * 12)
          }
        });

      } catch (_error) {
        fastify.log.error(_error);
        return reply.status(500).send({
          success: false,
          error: 'Monetarisierung fehlgeschlagen'
        });
      }
    }
  );

  // 7. Social Media Post Generation (AI-powered, platform-specific)
  fastify.post<{ Body: SocialPostGenerationRequest }>(
    '/social/generate-posts',
    async (request: FastifyRequest<{ Body: SocialPostGenerationRequest }>, reply: FastifyReply) => {
      const {
        topic,
        targetAudience,
        tone,
        platforms,
        includeHashtags,
        includeEmojis,
        ctaType = 'engagement',
        customBriefing
      } = request.body;

      if (!topic || !platforms || platforms.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Topic und mindestens eine Plattform sind erforderlich'
        });
      }

      try {
        const posts: GeneratedPost[] = [];
        const apiKey = config.openAI?.apiKey;

        if (!apiKey) {
          // Fallback: Template-basierte Generation
          return reply.send(generateFallbackPosts(topic, platforms, tone, targetAudience, includeHashtags, includeEmojis));
        }

        // Generate posts for each platform using OpenAI
        for (const platform of platforms) {
          const constraints = platformConstraints[platform as keyof typeof platformConstraints];

          const platformPrompt = `You are a social media expert specializing in ${platform} content.

TASK: Generate a compelling ${platform} post for the following topic.

INPUT:
- Topic/Main Message: ${topic}
${targetAudience ? `- Target Audience: ${targetAudience}` : ''}
- Tone: ${tone}
- Custom Brief: ${customBriefing || 'None'}

PLATFORM REQUIREMENTS for ${platform}:
- Maximum characters: ${constraints.maxChars}
- Style: ${constraints.style}
- Hashtag limit: ${constraints.hashtagLimit}
- Include hashtags: ${includeHashtags}
- Include emojis: ${includeEmojis && !constraints.avoidEmojis}
- CTA type: ${ctaType}
- Best practices: ${constraints.bestPractices.join(', ')}

REQUIREMENTS:
1. Write the post content (must be under ${constraints.maxChars} characters)
2. Generate ${constraints.hashtagLimit} relevant hashtags (or less)
3. Keep it authentic and engaging
4. Use ${includeEmojis && !constraints.avoidEmojis ? 'strategic' : 'no'} emojis
5. Optimize for ${platform} algorithm and culture
6. Include a subtle ${ctaType} call-to-action if appropriate

Return VALID JSON:
{
  "content": "post text here",
  "hashtags": ["tag1", "tag2"],
  "characterCount": 150,
  "suggestions": ["suggestion1", "suggestion2"]
}`;

          const modelName = config.openAI?.model || 'gpt-4-turbo';
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                {
                  role: 'system',
                  content: 'You are a professional social media copywriter. Return only valid JSON.'
                },
                {
                  role: 'user',
                  content: platformPrompt
                }
              ],
              temperature: 0.7,
              response_format: { type: 'json_object' }
            })
          });

          const data = await response.json();

          if (!response.ok || !data.choices?.[0]?.message?.content) {
            throw new Error(`OpenAI API error for ${platform}: ${data.error?.message || 'Unknown error'}`);
          }

          try {
            const generatedContent = JSON.parse(data.choices[0].message.content);
            posts.push({
              platform: platform as any,
              content: generatedContent.content || '',
              hashtags: generatedContent.hashtags || [],
              characterCount: generatedContent.characterCount || generatedContent.content?.length || 0,
              estimatedEngagement: estimateEngagement(platform, generatedContent.content),
              suggestions: generatedContent.suggestions || []
            });
          } catch (parseError) {
            console.error(`Failed to parse response for ${platform}:`, parseError);
            // Fallback for this platform
            const fallback = generateFallbackPost(topic, platform, tone, targetAudience, includeHashtags, includeEmojis);
            posts.push(fallback);
          }
        }

        return reply.send({
          success: true,
          posts,
          metadata: {
            topic,
            generatedAt: new Date().toISOString(),
            totalPosts: posts.length
          }
        } as GeneratedPostsResponse);

      } catch (error) {
        console.error('❌ Social Post Generation Error:', error);
        // Return fallback posts on error
        return reply.send({
          success: true,
          posts: generateFallbackPosts(topic, platforms, tone, targetAudience, includeHashtags, includeEmojis).posts,
          metadata: {
            topic,
            generatedAt: new Date().toISOString(),
            totalPosts: platforms.length
          }
        });
      }
    }
  );

  // Helper function: Estimate engagement based on platform and content
  function estimateEngagement(platform: string, content: string): string {
    const baseScores: Record<string, number> = {
      'linkedin': 3,
      'facebook': 2,
      'instagram': 4,
      'twitter': 2,
      'tiktok': 5,
      'youtube': 4
    };

    const score = (baseScores[platform] || 2) * (1 + (content?.length || 0) / 500);
    if (score > 8) return '🔥 Very High';
    if (score > 6) return '📈 High';
    if (score > 4) return '👍 Good';
    return '📊 Fair';
  }

  // Helper function: Generate single fallback post
  function generateFallbackPost(
    topic: string,
    platform: string,
    tone: string,
    targetAudience: string | undefined,
    includeHashtags: boolean,
    _includeEmojis: boolean
  ): GeneratedPost {
    const emojis: Record<string, string> = {
      linkedin: '💼',
      facebook: '👍',
      instagram: '📸',
      twitter: '🐦',
      tiktok: '🎵',
      youtube: '📺'
    };

    const basePosts: Record<string, string> = {
      linkedin: `${emojis.linkedin} Excited to share: ${topic}\n\nOur team has been working on this and we're thrilled with the results. ${targetAudience ? `Perfect for ${targetAudience}. ` : ''}Would love to hear your thoughts!\n\n#innovation #business`,
      facebook: `${emojis.facebook} Check this out!\n\n${topic} - we think you'll love it! ${targetAudience ? `Especially great for ${targetAudience}. ` : ''}\n\nWhat do you think? Drop a comment!\n\n#facebook #community`,
      instagram: `${emojis.instagram} New post! ✨\n\n${topic}\n\n${targetAudience ? `Perfect for ${targetAudience}! 🎯 ` : ''}Double tap if you like it!\n\n#socialmedia #trending #instagram`,
      twitter: `${emojis.twitter} Just shared: ${topic}\n\n${targetAudience ? `Great for ${targetAudience}! ` : ''}#trending #news`,
      tiktok: `${emojis.tiktok} New! ${topic}\n\n${targetAudience ? `For all the ${targetAudience} out there! 🔥 ` : ''}Like & follow for more!\n\n#trending #foryou #viral`,
      youtube: `${emojis.youtube} New Video: ${topic}\n\n${targetAudience ? `Designed for ${targetAudience}, ` : ''}this video covers everything you need to know.\n\nDon't forget to like, comment & subscribe!\n\n#youtube #content`
    };

    const content = basePosts[platform] || `Check out: ${topic}`;
    const hashtags = includeHashtags ? ['marketing', 'content', 'social'] : [];

    return {
      platform: platform as any,
      content,
      hashtags,
      characterCount: content.length,
      estimatedEngagement: '📊 Fair',
      suggestions: ['Customize with your branding', 'Add visual media for better engagement', 'Test different posting times']
    };
  }

  // Helper function: Generate all fallback posts at once
  function generateFallbackPosts(
    topic: string,
    platforms: string[],
    tone: string,
    targetAudience: string | undefined,
    includeHashtags: boolean,
    includeEmojis: boolean
  ): GeneratedPostsResponse {
    const posts = platforms.map(platform =>
      generateFallbackPost(topic, platform, tone, targetAudience, includeHashtags, includeEmojis)
    );

    return {
      success: true,
      posts,
      metadata: {
        topic,
        generatedAt: new Date().toISOString(),
        totalPosts: posts.length
      }
    };
  }

  // 8. Template Loader
  fastify.post<{ Body: TemplateRequest }>(
    '/templates',
    async (request: FastifyRequest<{ Body: TemplateRequest }>, reply: FastifyReply) => {
      const { templateCategory, industry, customization } = request.body;

      try {
        const templates: Record<string, any[]> = {
          'email': [
            { id: 'email_1', name: 'Welcome Email', description: 'Begrüßungs-Email für neue Kunden' },
            { id: 'email_2', name: 'Newsletter Template', description: 'Monatlicher Newsletter' },
            { id: 'email_3', name: 'Promotion Email', description: 'Werbeaktion ankündigen' }
          ],
          'landing-page': [
            { id: 'lp_1', name: 'Product Launch', description: 'Produkteinführungs-Seite' },
            { id: 'lp_2', name: 'Lead Magnet', description: 'Lead-Generierung optimiert' }
          ],
          'social-media': [
            { id: 'sm_1', name: 'Instagram Story', description: 'Story-Template für Instagram' },
            { id: 'sm_2', name: 'Facebook Ad', description: 'Werbeanzeige für Facebook' },
            { id: 'sm_3', name: 'LinkedIn Post', description: 'Professional Post Template' }
          ],
          'blog': [
            { id: 'blog_1', name: 'How-To Article', description: 'Anleitung schreiben' },
            { id: 'blog_2', name: 'List Article', description: 'Top 10 Listen' }
          ],
          'product': [
            { id: 'prod_1', name: 'Product Description', description: 'Verkaufsstarke Beschreibung' },
            { id: 'prod_2', name: 'Comparison Sheet', description: 'Produktvergleich' }
          ],
          'ad': [
            { id: 'ad_1', name: 'Google Ads', description: 'Google Suchanzeigen' },
            { id: 'ad_2', name: 'Display Banner', description: 'Banner-Werbung' }
          ]
        };

        const categoryTemplates = templates[templateCategory] || [];
        const selectedTemplate = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];

        return reply.send({
          success: true,
          template: selectedTemplate ? {
            ...selectedTemplate,
            industry,
            customization: customization || 'Standard',
            preview: `Template Preview für ${selectedTemplate.name}\n\nBranche: ${industry}\n${customization ? `\nAnpassungen: ${customization}` : ''}\n\nDies ist eine Vorschau des Templates...`,
            downloadUrl: `https://example.com/templates/${selectedTemplate.id}.html`
          } : null,
          available: categoryTemplates.length,
          category: templateCategory
        });

      } catch (_error) {
        fastify.log.error(_error);
        return reply.status(500).send({
          success: false,
          error: 'Template-Laden fehlgeschlagen'
        });
      }
    }
  );
}
