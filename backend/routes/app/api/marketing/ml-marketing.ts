// backend/routes/app/api/marketing/ml-marketing.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MarketingMLService } from '../../../../services/marketingMLService';
import { logger } from '../../../../logger';

export default async function mlMarketingRoutes(fastify: FastifyInstance) {
  // POST /api/marketing/ml/ideas - Generiere Marketing-Ideen
  fastify.post('/ideas', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { goal, audience, productInfo, budget } = request.body as any;

      if (!goal) {
        return reply.status(400).send({
          success: false,
          error: 'Kampagnenziel erforderlich'
        });
      }

      logger.info({ goal }, 'Generating marketing ideas');

      const result = await MarketingMLService.generateMarketingIdeas({
        goal,
        audience,
        productInfo,
        budget
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate marketing ideas');
      return reply.status(500).send({
        success: false,
        error: error.message || 'Fehler bei der Ideengenerierung'
      });
    }
  });

  // POST /api/marketing/ml/email - Generiere Email-Kampagne
  fastify.post('/email', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { productName, productDesc, targetAudience, campaignType } = request.body as any;

      if (!productName || !targetAudience) {
        return reply.status(400).send({
          success: false,
          error: 'Produktname und Zielgruppe erforderlich'
        });
      }

      logger.info({ campaignType }, 'Generating email campaign');

      const result = await MarketingMLService.generateEmailCampaign({
        productName,
        productDesc: productDesc || '',
        targetAudience,
        campaignType: campaignType || 'promotional'
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate email campaign');
      return reply.status(500).send({
        success: false,
        error: error.message || 'Fehler bei der Email-Generierung'
      });
    }
  });

  // POST /api/marketing/ml/social - Generiere Social Media Content
  fastify.post('/social', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { topic, tone, platforms } = request.body as any;

      if (!topic || !platforms) {
        return reply.status(400).send({
          success: false,
          error: 'Thema und Plattformen erforderlich'
        });
      }

      logger.info({ platforms }, 'Generating social media content');

      const result = await MarketingMLService.generateSocialMediaContent({
        topic,
        tone: tone || 'professional',
        platforms
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate social media content');
      return reply.status(500).send({
        success: false,
        error: error.message || 'Fehler bei der Content-Generierung'
      });
    }
  });

  // POST /api/marketing/ml/optimize - Optimiere bestehende Copy
  fastify.post('/optimize', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { currentCopy, targetAction, audience } = request.body as any;

      if (!currentCopy) {
        return reply.status(400).send({
          success: false,
          error: 'Aktueller Text erforderlich'
        });
      }

      logger.info('Optimizing marketing copy');

      const result = await MarketingMLService.optimizeMarketingCopy({
        currentCopy,
        targetAction: targetAction || '',
        audience: audience || 'Allgemeine Zielgruppe'
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to optimize marketing copy');
      return reply.status(500).send({
        success: false,
        error: error.message || 'Fehler bei der Optimierung'
      });
    }
  });

  // POST /api/marketing/ml/forecast - Prognostiziere Campaign-Performance
  fastify.post('/forecast', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { campaignType, budget, targetAudience, historicalCTR, historicalROI } = request.body as any;

      if (!campaignType || !budget || !targetAudience) {
        return reply.status(400).send({
          success: false,
          error: 'Kampagnentyp, Budget und Zielgruppengröße erforderlich'
        });
      }

      logger.info({ campaignType }, 'Forecasting campaign performance');

      const result = await MarketingMLService.forecastCampaignPerformance({
        campaignType,
        budget,
        targetAudience,
        historicalCTR,
        historicalROI
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to forecast campaign performance');
      return reply.status(500).send({
        success: false,
        error: error.message || 'Fehler bei der Prognose'
      });
    }
  });
}
