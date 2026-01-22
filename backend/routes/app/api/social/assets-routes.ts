// backend/routes/app/api/social/assets-routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../../../logger';
import { AssetStorageService } from '../../../../services/social/AssetStorageService';
import { MediaComposerService } from '../../../../services/social/MediaComposerService';

interface ComposeVideoBody {
  imageUrls: string[];
  audioUrl: string;
  duration?: number;
}

export default async function assetsRoutes(fastify: FastifyInstance) {
  const assetStorage = new AssetStorageService();
  const mediaComposer = new MediaComposerService();

  // ==================== UPLOAD ASSET ====================
  
  fastify.post(
    '/social/assets/upload',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const contentType = request.headers['content-type'] || '';

        if (!contentType.includes('multipart/form-data')) {
          return reply.status(400).send({
            success: false,
            error: 'Content-Type must be multipart/form-data'
          });
        }

        let fileBuffer: Buffer | undefined;
        let mimeType: string | undefined;
        let originalFilename: string | undefined;

        // Parse multipart/form-data
        const partsIterator = request.parts();

        for await (const part of partsIterator) {
          if (part.type === 'file') {
            fileBuffer = await part.toBuffer();
            mimeType = part.mimetype;
            originalFilename = part.filename;
            logger.info({ 
              fieldname: part.fieldname,
              filename: part.filename, 
              mimetype: part.mimetype,
              size: fileBuffer.length
            }, 'File received');
            break; // Only process first file
          }
        }

        if (!fileBuffer || !mimeType) {
          return reply.status(400).send({
            success: false,
            error: 'No file uploaded. Please provide a file in the request.'
          });
        }

        // Upload asset
        const result = await assetStorage.uploadAsset(fileBuffer, mimeType, originalFilename);

        logger.info({ assetId: result.assetId, type: result.type }, 'Asset uploaded successfully');

        return reply.send({
          success: true,
          asset: result
        });

      } catch (error) {
        logger.error({ error }, 'Asset upload failed');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }
  );

  // ==================== DELETE ASSET ====================
  
  fastify.delete<{ Params: { assetId: string } }>(
    '/social/assets/:assetId',
    async (request: FastifyRequest<{ Params: { assetId: string } }>, reply: FastifyReply) => {
      try {
        const { assetId } = request.params;

        const deleted = await assetStorage.deleteAsset(assetId);

        if (!deleted) {
          return reply.status(404).send({
            success: false,
            error: 'Asset not found'
          });
        }

        return reply.send({
          success: true,
          message: 'Asset deleted successfully'
        });

      } catch (error) {
        logger.error({ error }, 'Asset deletion failed');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Deletion failed'
        });
      }
    }
  );

  // ==================== COMPOSE VIDEO FROM IMAGES + AUDIO ====================
  
  fastify.post<{ Body: ComposeVideoBody }>(
    '/social/assets/compose-video',
    async (request: FastifyRequest<{ Body: ComposeVideoBody }>, reply: FastifyReply) => {
      try {
        const { imageUrls, audioUrl, duration } = request.body;

        if (!imageUrls || imageUrls.length === 0) {
          return reply.status(400).send({
            success: false,
            error: 'Mindestens ein Bild ist erforderlich'
          });
        }

        if (!audioUrl) {
          return reply.status(400).send({
            success: false,
            error: 'Audio ist erforderlich'
          });
        }

        logger.info({ imageCount: imageUrls.length, audioUrl, duration }, 'Starting video composition');

        const result = await mediaComposer.composeVideo({
          imageUrls,
          audioUrl,
          duration
        });

        return reply.send({
          success: true,
          video: {
            assetId: result.assetId,
            publicUrl: result.publicUrl,
            duration: result.duration
          }
        });

      } catch (error) {
        logger.error({ error }, 'Video composition failed');
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Composition failed'
        });
      }
    }
  );
}
