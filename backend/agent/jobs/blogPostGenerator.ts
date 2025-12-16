// KI-Blogpost-Generator
import OpenAI from 'openai';
import config from '../../config.js';

export interface BlogPostOptions {
  topic: string;
  keywords?: string[];
  seo?: boolean;
  length?: 'short' | 'medium' | 'long';
  language?: string;
}

export async function generateBlogPost(
  options: BlogPostOptions
): Promise<string> {
  const apiKey = config.openAI?.apiKey;

  if (!apiKey) {
    throw new Error(
      'OpenAI nicht konfiguriert. Bitte OpenAI API-Key in der Konfiguration setzen.'
    );
  }

  const openai = new OpenAI({ apiKey });
  const model = config.openAI?.model || 'gpt-4o-mini';
  const prompt = buildPrompt(options);

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'Du bist ein professioneller SEO-Blog-Autor.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens:
      options.length === 'long'
        ? 1200
        : options.length === 'medium'
          ? 800
          : 400,
    temperature: 0.7,
  });
  return response.choices[0].message.content || '';
}

function buildPrompt(options: BlogPostOptions): string {
  let prompt = `Schreibe einen${options.seo ? ' SEO-optimierten' : ''} Blogpost über das Thema: "${options.topic}".`;
  if (options.keywords && options.keywords.length > 0) {
    prompt += ` Verwende die Keywords: ${options.keywords.join(', ')}.`;
  }
  if (options.length) {
    prompt += ` Länge: ${options.length}.`;
  }
  if (options.language) {
    prompt += ` Sprache: ${options.language}.`;
  }
  prompt += ' Schreibe professionell, strukturiert und ansprechend.';
  return prompt;
}
