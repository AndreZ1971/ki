// backend/routes/app/api/social/youtube-routes.ts
import { FastifyPluginAsync } from 'fastify';
import { YouTubePublisher } from '../../../../services/social/publishers/YouTubePublisher';
import { logger } from '../../../../logger';

const youtubeRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/social/youtube/upload
   * Upload a video to YouTube
   */
  fastify.post('/social/youtube/upload', async (request, reply) => {
    try {
      const parts = request.parts();
      let videoBuffer: Buffer | null = null;
      let videoMime = 'video/mp4';
      let title = 'A.R.I. Video';
      let description = '';
      let tags: string[] = [];

      const EMOJI_AND_SYMBOL_REGEX = /[\u{1F000}-\u{1FFFF}]/gu;
      const CONTROL_CHARS_REGEX = /\p{Cc}/gu;
      const MARKDOWN_REGEX = /[*`_~>#]/g;

      const stripUnsupported = (input: string, maxLen: number) =>
        (input || '')
          .replace(EMOJI_AND_SYMBOL_REGEX, '') // strip emojis and symbols beyond BMP
          .replace(CONTROL_CHARS_REGEX, '') // remove control chars
          .replace(MARKDOWN_REGEX, '') // strip markdown-ish chars
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, maxLen);

      // Process multipart form data
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'video') {
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          videoBuffer = Buffer.concat(chunks);
          videoMime = part.mimetype || videoMime;
        } else if (part.type === 'field') {
          // Fields haben direkt einen 'value' property
          const value = (part as any).value || '';

          if (part.fieldname === 'title') {
            // Bereinige Titel: Entferne Emojis/Markdown und kürze auf 95 Zeichen (YouTube max 100)
            const cleanTitle = value
              .replace(EMOJI_AND_SYMBOL_REGEX, '') // Emojis entfernen
              .replace(/[*_~`#]/g, '') // Markdown-Zeichen entfernen
              .replace(CONTROL_CHARS_REGEX, '') // Steuerzeichen entfernen
              .replace(/\s+/g, ' ') // Mehrfache Leerzeichen entfernen
              .trim()
              .slice(0, 95);
            title = cleanTitle || title;
          } else if (part.fieldname === 'description') {
            description = stripUnsupported(value, 4500);
          } else if (part.fieldname === 'tags') {
            tags = value
              ? value
                  .split(',')
                  .map((t: string) => stripUnsupported(t, 300))
                  .filter(Boolean)
                  .slice(0, 10)
              : [];
          }
        }
      }

      logger.info({ 
        hasVideo: !!videoBuffer, 
        videoSize: videoBuffer?.length,
        title, 
        description: description?.substring(0, 50),
        tagsCount: tags.length,
        videoMime,
        titleLength: title.length,
        descriptionLength: description.length
      }, 'YouTube upload parameters');

      if (!videoBuffer) {
        return reply.code(400).send({
          success: false,
          error: 'Kein Video hochgeladen'
        });
      }

      const publisher = new YouTubePublisher();
      const result = await publisher.publish({
        content: description,
        videoBuffer,
        videoMime,
        videoTitle: title,
        videoDescription: description,
        videoTags: tags
      });

      return reply.send({
        success: result.success,
        videoId: result.videoId,
        url: result.url,
        title: result.title,
        status: result.status
      });
    } catch (error) {
      const detail = (error as any)?.message || 'YouTube Upload fehlgeschlagen';
      logger.error({ error, detail }, 'YouTube upload error');
      
      return reply.code(500).send({
        success: false,
        error: detail
      });
    }
  });
};

export default youtubeRoutes;
