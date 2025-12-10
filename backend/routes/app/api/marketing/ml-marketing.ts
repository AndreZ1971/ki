// backend/routes/app/api/marketing/ml-marketing.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MarketingMLService } from '../../../../services/marketingMLService';

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

      console.log('🎯 [ML Marketing] Generiere Ideas für:', goal);

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
      console.error('❌ Fehler bei /ideas:', error.message);
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

      console.log('📧 [ML Marketing] Generiere Email für:', campaignType);

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
      console.error('❌ Fehler bei /email:', error.message);
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

      console.log('📱 [ML Marketing] Generiere Social Content für:', platforms);

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
      console.error('❌ Fehler bei /social:', error.message);
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

      console.log('✏️ [ML Marketing] Optimiere Copy');

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
      console.error('❌ Fehler bei /optimize:', error.message);
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

      console.log('📊 [ML Marketing] Forecast für:', campaignType);

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
      console.error('❌ Fehler bei /forecast:', error.message);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Fehler bei der Prognose'
      });
    }
  });
}
