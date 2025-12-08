// API-Route für KI-Blogpost-Generator
import type { FastifyInstance } from 'fastify';
import { generateBlogPost, BlogPostOptions } from '../../../../agent/jobs/blogPostGenerator';

export default async function blogpostRoutes(server: FastifyInstance) {
  server.post<{ Body: BlogPostOptions }>(
    '/api/marketing/blogpost/generate',
    async (request, reply) => {
      try {
        const options = request.body;
        const content = await generateBlogPost(options);
        reply.send({ success: true, content });
      } catch (error: any) {
        reply.status(500).send({ success: false, error: error.message });
      }
    }
  );
}
