// backend/utils/social-ai-transform.ts
import { getOpenAIClient, executeOpenAI } from './openai';
import { logger } from '../logger';

interface TransformOptions {
  platform: 'linkedin' | 'facebook' | 'tiktok' | 'twitter' | 'instagram';
  content: string;
}

interface TransformedPost {
  content: string;
  platform: string;
  originalContent: string;
}

/**
 * Transformiert einfachen Text in plattform-optimierte Social Media Posts
 * Nutzt OpenAI GPT-4 mit spezifischen Prompts für jede Plattform
 */
export async function transformContentForPlatform(
  options: TransformOptions
): Promise<TransformedPost> {
  const { platform, content } = options;

  // Plattform-spezifische Prompts
  const prompts: { [key: string]: string } = {
    linkedin: `Transformiere folgenden Text in einen professionellen LinkedIn-Post für Kaufe.es (E-Commerce):

INPUT: "${content}"

ANFORDERUNGEN:
- Ton: Professionell, B2B-fokussiert
- Länge: 150-200 Zeichen
- Emojis: 2-3 max (💼 ✅ 📊 🚀)
- Hashtags: 3-5 relevante B2B-Tags (#ECommerce #B2B)
- Struktur: Hook → Kernbotschaft → Call-to-Action
- Zielgruppe: Geschäftsführer, Einkäufer, B2B-Kunden

OUTPUT: Nur der fertige Post, keine Erklärungen!`,

    facebook: `Transformiere folgenden Text in einen freundlichen Facebook-Post für Kaufe.es (742 Follower):

INPUT: "${content}"

ANFORDERUNGEN:
- Ton: Freundlich, nahbar, Community-fokussiert
- Länge: 100-150 Zeichen
- Emojis: 3-5 passende (🛍️ 🎉 💝 ⭐)
- Hashtags: 2-3 thematische Tags
- Ansprache: "Du/Ihr" (direkt)
- Zielgruppe: Lokale Kunden, Familien, Privatpersonen

OUTPUT: Nur der fertige Post, keine Erklärungen!`,

    tiktok: `Transformiere folgenden Text in einen viralen TikTok-Caption für @kaufe.es (2098 Follower):

INPUT: "${content}"

ANFORDERUNGEN:
- Ton: Locker, witzig, Gen Z (16-30 Jahre)
- Länge: 50-100 Zeichen
- Format: POV/Tell me why/No one
- Slang: "fr fr", "no cap", "bussin", "slay"
- Emojis: 5-10+ (🔥 💀 😭 ✨ 💅 ⚡)
- Hashtags: 5-8 inkl. #fyp #foryou #viral #shopping
- Style: Relatable, meme-artig, authentisch

OUTPUT: Nur der fertige Caption, keine Erklärungen!`,

    twitter: `Transformiere folgenden Text in einen prägnanten Twitter-Post für Kaufe.es:

INPUT: "${content}"

ANFORDERUNGEN:
- Ton: Kurz, prägnant, witzig
- Länge: Max 280 Zeichen (optimal: 100-150)
- Emojis: 2-4 passende
- Hashtags: 1-3 max
- Zielgruppe: Tech-affin, trendbewusst
- Style: Clever, auf den Punkt

OUTPUT: Nur der fertige Tweet, keine Erklärungen!`,

    instagram: `Transformiere folgenden Text in einen Instagram-Post für Kaufe.es:

INPUT: "${content}"

ANFORDERUNGEN:
- Ton: Visuell, lifestyle-orientiert
- Länge: 100-150 Zeichen
- Emojis: 4-6 passende (✨ 💫 🌟 💝)
- Hashtags: 5-10 beliebte Tags
- Zielgruppe: Visual-affine Nutzer, Lifestyle
- Style: Ästhetisch, aspirational

OUTPUT: Nur der fertige Post, keine Erklärungen!`
  };

  const prompt = prompts[platform];
  
  if (!prompt) {
    throw new Error(`Unbekannte Plattform: ${platform}`);
  }

  try {
    const openai = getOpenAIClient();

    const transformedContent = await executeOpenAI(
      async () => {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // Schneller & günstiger als gpt-4
          messages: [
            {
              role: 'system',
              content: `Du bist ein Social Media Content Expert spezialisiert auf ${platform.toUpperCase()}. 
Du transformierst einfache Texte in plattform-optimierte Posts für Kaufe.es (E-Commerce).
Antworte NUR mit dem fertigen Post, keine Erklärungen oder Meta-Kommentare!`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8, // Kreativ aber konsistent
          max_tokens: 300
        });

        return response.choices[0]?.message?.content?.trim() || content;
      },
      `social-ai-transform-${platform}`,
      { platform, originalContent: content }
    );

    logger.info({
      platform,
      originalPreview: content.substring(0, 50) + '...',
      transformedPreview: transformedContent.substring(0, 50) + '...'
    }, 'AI transformation completed for platform');

    return {
      content: transformedContent,
      platform,
      originalContent: content
    };

  } catch (error) {
    logger.error({ error, platform }, 'AI transformation failed');
    // Fallback: Original Content nutzen
    logger.warn({ platform }, 'Using original content as fallback');
    return {
      content,
      platform,
      originalContent: content
    };
  }
}

/**
 * Batch-Transformation für mehrere Plattformen gleichzeitig
 */
export async function transformContentForMultiplePlatforms(
  content: string,
  platforms: ('linkedin' | 'facebook' | 'tiktok' | 'twitter' | 'instagram')[]
): Promise<{ [key: string]: TransformedPost }> {
  const results = await Promise.allSettled(
    platforms.map(platform =>
      transformContentForPlatform({ platform, content })
    )
  );

  const transformed: { [key: string]: TransformedPost } = {};

  results.forEach((result, index) => {
    const platform = platforms[index];
    if (result.status === 'fulfilled') {
      transformed[platform] = result.value;
    } else {
      logger.error({ platform, reason: result.reason }, 'Batch transformation failed for platform');
      // Fallback
      transformed[platform] = {
        content,
        platform,
        originalContent: content
      };
    }
  });

  return transformed;
}
