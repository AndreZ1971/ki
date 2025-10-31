// backend/routes/app/api/email/email-sender.ts
import { FastifyPluginAsync } from 'fastify';
import nodemailer from 'nodemailer';

const emailSenderRoutes: FastifyPluginAsync = async (fastify, options) => {
  
  // SMTP Transporter erstellen
  const createTransporter = () => {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Timeout erhöhen für Hoster-SMTP
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  };

  // POST: ECHTER Email-Versand
  fastify.post('/send', async (request, reply) => {
    try {
      const { customers, subject, body, emailType } = request.body as any;
      
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
          const mailOptions = {
            from: process.env.SMTP_FROM,
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
          
        } catch (error) {
          console.error(`❌ Fehler bei ${customer.email}:`, error);
          failedEmails.push({
            email: customer.email,
            error: error instanceof Error ? error.message : String(error)
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
      
    } catch (error) {
      console.error('Email Send Error:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Email-Versand fehlgeschlagen',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // GET: SMTP Verbindung testen
  fastify.get('/test-smtp', async (request, reply) => {
    try {
      const transporter = createTransporter();
      
      // Test-Email an dich selbst
      const testEmail = {
        from: process.env.SMTP_FROM,
        to: process.env.SMTP_USER, // An dich selbst
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
          test_email_sent_to: process.env.SMTP_USER
        }
      };
      
    } catch (error) {
      console.error('SMTP Test Error:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'SMTP Verbindungstest fehlgeschlagen',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Rest der Routes bleiben gleich...
  fastify.get('/status', async (request, reply) => {
    // ... existing code
  });

  fastify.get('/history', async (request, reply) => {
    // ... existing code
  });
};

export default emailSenderRoutes;