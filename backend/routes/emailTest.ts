// routes/emailTest.ts - VOLLSTÄNDIG KORRIGIERT
import { FastifyRequest, FastifyReply } from 'fastify';
import transporter from '../services/emailService';
import { getConfig } from '@config';

async function emailTestRoutes(fastify: any, _options: any) {
  
  // Test-Endpoint für Email-Konfiguration
  fastify.get('/test-email-config', async (_request: FastifyRequest, _reply: FastifyReply) => {
    try {
      console.log('🧪 Teste Email-Konfiguration...');
      
      // Teste die Verbindung
      await transporter.verify();
      console.log('✅ SMTP Verbindung erfolgreich');
      
      // Test-Email senden
      const smtp = getConfig().smtp || {};
      const fromAddr = smtp.from || process.env.SMTP_FROM || 'noreply@example.com';
      const toAddr = process.env.TEST_EMAIL_TO || fromAddr;
      const testResult = await transporter.sendMail({
        from: `"App Test" <${fromAddr}>`,
        to: toAddr,
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
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure,
          user: smtp.user,
          from: smtp.from
        }
      };
    } catch (error: any) {
      console.error('❌ Email Test fehlgeschlagen:', error.message);
      const smtp = getConfig().smtp || {};
      return _reply.status(500).send({
        success: false,
        error: error.message,
        config: {
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure,
          user: smtp.user,
          from: smtp.from
        }
      });
    }
  });

  // Zusätzlicher einfacher Test-Endpoint
  fastify.get('/test', async (_request: FastifyRequest, _reply: FastifyReply) => {
    return { 
      success: true, 
      message: 'Email Test Route funktioniert!',
      timestamp: new Date().toISOString()
    };
  });
}

export default emailTestRoutes;