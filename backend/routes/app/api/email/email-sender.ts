// backend/routes/app/api/email/email-sender.ts
import { FastifyPluginAsync } from 'fastify';
import nodemailer from 'nodemailer';
import { getConfig } from '@config';

const emailSenderRoutes: FastifyPluginAsync = async (fastify, _options) => {
  
  // SMTP Transporter erstellen - LÄDT SMTP-DATEN AUS connection.json
  const createTransporter = () => {
    const config = getConfig();
    
    // SMTP-Daten aus connection.json holen (Fallback auf ENV für Rückwärtskompatibilität)
    const smtpConfig = {
      host: config.smtp?.host || process.env.SMTP_HOST,
      port: config.smtp?.port || parseInt(process.env.SMTP_PORT || '587'),
      secure: config.smtp?.secure ?? (process.env.SMTP_SECURE === 'true'),
      auth: {
        user: config.smtp?.user || process.env.SMTP_USER,
        pass: config.smtp?.password || process.env.SMTP_PASSWORD,
      },
      // Timeout erhöhen für Hoster-SMTP
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    };
    
    return nodemailer.createTransport(smtpConfig);
  };

  // POST: ECHTER Email-Versand
  fastify.post('/send', async (_request, _reply) => {
    try {
      const { customers, subject, body, emailType } = _request.body as any;
      
      console.log('📧 Starte echten Email-Versand:');
      console.log(`- An: ${customers.length} Kunden`);
      console.log(`- Betreff: ${subject}`);
      console.log(`- Typ: ${emailType}`);

      // SMTP Transporter erstellen
      const transporter = createTransporter();
      
      // Email an alle ausgewählten Kunden senden
      const sentEmails = [];
      const failedEmails = [];

      for (const customer of customers) {
        try {
          const config = getConfig();
          const mailOptions = {
            from: config.smtp?.from || process.env.SMTP_FROM,
            to: customer.email,
            subject: subject,
            text: body,
            html: body.replace(/\n/g, '<br>'), // Einfache HTML-Umwandlung
          };

          const result = await transporter.sendMail(mailOptions);
          sentEmails.push({
            email: customer.email,
            messageId: result.messageId,
            status: 'sent'
          });
          
          console.log(`✅ Email an ${customer.email} gesendet: ${result.messageId}`);
          
          // Kurze Pause zwischen Emails (100ms)
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (_error) {
          console.error(`❌ Fehler bei ${customer.email}:`, _error);
          failedEmails.push({
            email: customer.email,
            error: _error instanceof Error ? _error.message : String(_error)
          });
        }
      }

      // Transporter schließen
      transporter.close();

      return {
        success: true,
        message: `Emails versendet: ${sentEmails.length} erfolgreich, ${failedEmails.length} fehlgeschlagen`,
        data: {
          sent: sentEmails.length,
          failed: failedEmails.length,
          sent_emails: sentEmails,
          failed_emails: failedEmails,
          email_type: emailType,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (_error) {
      console.error('Email Send Error:', _error);
      _reply.status(500).send({ 
        success: false, 
        error: 'Email-Versand fehlgeschlagen',
        details: _error instanceof Error ? _error.message : String(_error)
      });
    }
  });

  // GET: SMTP Verbindung testen
  fastify.get('/test-smtp', async (_request, _reply) => {
    try {
      const config = getConfig();
      const transporter = createTransporter();
      
      // Test-Email an dich selbst
      const testEmail = {
        from: config.smtp?.from || process.env.SMTP_FROM,
        to: config.smtp?.user || process.env.SMTP_USER, // An dich selbst
        subject: '🧪 SMTP Test von WooCommerce AI',
        text: 'Dies ist eine Test-Email um die SMTP Verbindung zu prüfen.',
        html: '<h3>🧪 SMTP Test erfolgreich!</h3><p>Deine WooCommerce AI kann jetzt Emails versenden.</p>'
      };

      const result = await transporter.sendMail(testEmail);
      transporter.close();

      return {
        success: true,
        message: 'SMTP Test erfolgreich!',
        data: {
          messageId: result.messageId,
          response: result.response,
          test_email_sent_to: config.smtp?.user || process.env.SMTP_USER
        }
      };
      
    } catch (_error) {
      console.error('SMTP Test Error:', _error);
      _reply.status(500).send({ 
        success: false, 
        error: 'SMTP Verbindungstest fehlgeschlagen',
        details: _error instanceof Error ? _error.message : String(_error)
      });
    }
  });

  // Rest der Routes bleiben gleich...
  fastify.get('/status', async (_request, _reply) => {
    // ... existing code
  });

  fastify.get('/history', async (_request, _reply) => {
    // ... existing code
  });
};

export default emailSenderRoutes;