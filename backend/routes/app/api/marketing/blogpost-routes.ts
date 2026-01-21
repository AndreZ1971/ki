// API-Route für KI-Blogpost-Generator
import type { FastifyInstance } from 'fastify';
import {
  generateBlogPost,
  BlogPostOptions,
} from '../../../../agent/jobs/blogPostGenerator';
import { getConfig } from '@config';

export default async function blogpostRoutes(server: FastifyInstance) {
  server.post<{ Body: BlogPostOptions }>(
    '/blogpost/generate',
    async (request, reply) => {
      try {
        const options = request.body;
        const { openAI } = getConfig();
        const config = openAI || {};
        const hasOpenAI = !!(config as any).apiKey;
        
        const content = await generateBlogPost(options);
        
        reply.send({
          success: true,
          mode: hasOpenAI ? 'real' as const : 'fallback' as const,
          confidence: hasOpenAI ? 95 : 60,
          inputs: {
            topic: options.topic,
            keywords: options.keywords?.join(', ') || 'Keine',
            seo: options.seo ? 'Ja' : 'Nein',
            length: options.length || 'medium',
            language: options.language || 'de'
          },
          content
        });
      } catch (error: any) {
        reply.status(500).send({ success: false, error: error.message });
      }
    }
  );
}
