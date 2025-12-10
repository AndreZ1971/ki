// backend/routes/app/api/marketing/email-enhancement.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { EmailEnhancementService } from '../../../../services/emailEnhancementService';

export async function emailEnhancementRoutes(fastify: FastifyInstance) {
  // 🎯 Smart Subject Lines
  fastify.post('/subject-lines', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('📨 POST /email-enhancement/subject-lines');
      const body = request.body as any;
      const variantsRaw = await EmailEnhancementService.generateSmartSubjectLines(body);
      const variants = (variantsRaw || []).map((v: any) => ({
        variant: v.variant,
        type: v.type,
        openRate: v.estimatedOpenRate ?? v.openRate ?? 0,
        reason: v.reason
      }));
      
      reply.send({
        success: true,
        data: variants,
        message: `${variants.length} Subject Line Varianten generiert`
      });
    } catch (error: any) {
      console.error('❌ Fehler bei subject-lines:', error.message);
      reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // 🔍 Customer Segmentation
  fastify.post('/segment-customers', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('🔍 POST /email-enhancement/segment-customers');
      const body = request.body as any;
      const segments = await EmailEnhancementService.segmentCustomers(body.customers);
      
      reply.send({
        success: true,
        data: segments,
        message: `${segments.length} Kundensegmente erstellt`
      });
    } catch (error: any) {
      console.error('❌ Fehler bei segment-customers:', error.message);
      reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // ✨ Email Personalization
  fastify.post('/personalize-email', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('✨ POST /email-enhancement/personalize-email');
      const body = request.body as any;
      const personalizedEmail = await EmailEnhancementService.personalizeEmail(body);
      
      reply.send({
        success: true,
        data: personalizedEmail,
        message: 'Email erfolgreich personalisiert'
      });
    } catch (error: any) {
      console.error('❌ Fehler bei personalize-email:', error.message);
      reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // ⏰ Send Time Optimization
  fastify.post('/optimize-send-time', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('⏰ POST /email-enhancement/optimize-send-time');
      const body = request.body as any;
      const sendTimesRaw = await EmailEnhancementService.optimizeSendTime(body.customers);
      const sendTimes = (sendTimesRaw || []).map((item: any) => ({
        customerId: item.customerId || item.id,
        email: item.email || 'unknown@email.com',
        time: item.recommendedTime ?? item.time ?? '09:00',
        timezone: item.timezone || 'Europe/Berlin',
        dayOfWeek: item.dayOfWeek || 'Tuesday',
        confidence: item.confidence ?? 0
      }));
      
      reply.send({
        success: true,
        data: sendTimes,
        message: 'Optimale Versandzeiten berechnet'
      });
    } catch (error: any) {
      console.error('❌ Fehler bei optimize-send-time:', error.message);
      reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // 📊 Email Performance Forecast
  fastify.post('/forecast-performance', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('📊 POST /email-enhancement/forecast-performance');
      const body = request.body as any;
      const forecastRaw = await EmailEnhancementService.forecastEmailPerformance(body);
      const forecast = {
        emailType: forecastRaw.emailType,
        segment: forecastRaw.segment,
        openRate: forecastRaw.estimatedOpenRate ?? 0,
        clickRate: forecastRaw.estimatedClickRate ?? 0,
        conversionRate: forecastRaw.estimatedConversionRate ?? 0,
        estimatedRevenue: forecastRaw.estimatedRevenue ?? 0,
        confidence: forecastRaw.confidence ?? 0,
        recommendations: forecastRaw.recommendations ?? []
      };
      
      reply.send({
        success: true,
        data: forecast,
        message: 'Performance-Prognose erstellt'
      });
    } catch (error: any) {
      console.error('❌ Fehler bei forecast-performance:', error.message);
      reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });
}
