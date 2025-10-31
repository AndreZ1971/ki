// routes/emailTest.ts - VOLLSTÄNDIG KORRIGIERT
import { FastifyRequest, FastifyReply } from 'fastify';
import transporter from '../services/emailService';

async function emailTestRoutes(fastify: any, options: any) {
  
  // Test-Endpoint für Email-Konfiguration
  fastify.get('/test-email-config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('🧪 Teste Email-Konfiguration...');
      
      // Teste die Verbindung
      await transporter.verify();
      console.log('✅ SMTP Verbindung erfolgreich');
      
      // Test-Email senden
      const testResult = await transporter.sendMail({
        from: '"Kaufe-es.eu Test" <info@kaufe-es.eu>',
        to: 'jannro771@gmail.com',
        subject: 'Test Email - SMTP Konfiguration',
        text: 'Dies ist eine Test-Email zur Überprüfung der SMTP-Konfiguration.',
        html: '<p>Dies ist eine <b>Test-Email</b> zur Überprüfung der SMTP-Konfiguration.</p>'
      });

      console.log('✅ Test-Email gesendet:', testResult.messageId);

      return {
        success: true,
        message: 'Email-Konfiguration funktioniert!',
        messageId: testResult.messageId,
        config: {
          host: 'inn.bitpalast.net',
          port: 465,
          secure: true
        }
      };
    } catch (error: any) {
      console.error('❌ Email Test fehlgeschlagen:', error.message);
      return reply.status(500).send({
        success: false,
        error: error.message,
        config: {
          host: 'inn.bitpalast.net',
          port: 465,
          secure: true
        }
      });
    }
  });

  // Zusätzlicher einfacher Test-Endpoint
  fastify.get('/test', async (request: FastifyRequest, reply: FastifyReply) => {
    return { 
      success: true, 
      message: 'Email Test Route funktioniert!',
      timestamp: new Date().toISOString()
    };
  });
}

export default emailTestRoutes;