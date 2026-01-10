// backend/routes/app/api/marketing/email-marketing.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import transporter from '../../../../services/emailService.js';
import { getConfig } from '@config';
import https from 'https';
import axios from 'axios';
import { logger } from '../../../../logger';

interface SendCampaignBody {
  campaignName: string;
  emailSubject: string;
  emailContent: string;
  targetSegment: 'all' | 'new' | 'active' | 'inactive';
  sendTime: string;
}

interface EmailGenerationBody {
  campaignName?: string;
  goal?: string;
  productDescription?: string;
  targetAudience?: string;
  tone?: 'professional' | 'friendly' | 'enthusiastic' | 'informative';
  lengthMode?: 'short' | 'medium' | 'long';
  formality?: 'du' | 'sie';
  valueProps?: string;
  avoidTerms?: string;
  ctaStyle?: string;
  sendTime?: string;
}

interface CustomerSegmentsResponse {
  all: number;
  new: number;
  active: number;
  inactive: number;
}

export default async function emailMarketingRoutes(server: FastifyInstance) {
  // GET /api/customers/segments - Lade Kundensegmente aus WooCommerce
  server.get('/api/customers/segments', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Lade WooCommerce-Config aus connection.json (zentrale Konfiguration)
      const { woocommerce } = getConfig();
      if (!woocommerce?.url || !woocommerce?.consumerKey || !woocommerce?.consumerSecret) {
        return reply.status(500).send({
          success: false,
          error: 'WooCommerce nicht konfiguriert. Bitte connection.json einrichten.',
          data: { all: 0, new: 0, active: 0, inactive: 0 }
        });
      }

      const auth = Buffer.from(`${woocommerce.consumerKey}:${woocommerce.consumerSecret}`).toString('base64');

      // Lade alle Bestellungen (nicht Kunden, da WooCommerce oft keine separaten Customer-Records hat)
      const agent = new https.Agent({ rejectUnauthorized: true });
      const axiosResponse = await axios.get(`${woocommerce.url}/wp-json/wc/v3/orders?per_page=100&status=completed`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        httpsAgent: agent,
      });
      if (axiosResponse.status < 200 || axiosResponse.status >= 300) {
        throw new Error(`WooCommerce API Error: ${axiosResponse.status}`);
      }
      const orders = axiosResponse.data;

      // Extrahiere unique E-Mail-Adressen aus Bestellungen
      const customerEmails = new Map<string, { email: string; dateCreated: Date; lastOrder: Date }>();
      
      orders.forEach((order: any) => {
        const email = order.billing?.email;
        if (!email) return;

        const orderDate = new Date(order.date_created);
        
        if (customerEmails.has(email)) {
          const existing = customerEmails.get(email)!;
          // Update last order date if this order is newer
          if (orderDate > existing.lastOrder) {
            existing.lastOrder = orderDate;
          }
          // Update creation date if this order is older
          if (orderDate < existing.dateCreated) {
            existing.dateCreated = orderDate;
          }
        } else {
          customerEmails.set(email, {
            email,
            dateCreated: orderDate,
            lastOrder: orderDate
          });
        }
      });

      // Segmentiere Kunden basierend auf Order-Daten
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const segments: CustomerSegmentsResponse = {
        all: customerEmails.size,
        new: 0,
        active: 0,
        inactive: 0
      };

      customerEmails.forEach((customer) => {
        // Neue Kunden (erste Bestellung < 30 Tage)
        if (customer.dateCreated > thirtyDaysAgo) {
          segments.new++;
        }

        // Aktive Kunden (letzte Bestellung < 90 Tage)
        if (customer.lastOrder > ninetyDaysAgo) {
          segments.active++;
        } else {
          // Inaktive Kunden (letzte Bestellung > 90 Tage)
          segments.inactive++;
        }
      });

      return reply.send({
        success: true,
        data: segments
      });
    } catch (_error) {
      logger.error({ error: _error instanceof Error ? _error.message : 'Unknown', function: 'loadCustomerSegments' }, 'Error loading customer segments');
      // Liefere einen sanften Fallback statt 500, damit das UI weiter funktioniert
      return reply.send({
        success: true,
        errorMessage: _error instanceof Error ? _error.message : 'Unbekannter Fehler',
        data: { all: 0, new: 0, active: 0, inactive: 0 }
      });
    }
  });

  // POST /api/marketing/email/send-campaign - Sende E-Mail-Kampagne
  server.post<{ Body: SendCampaignBody }>(
    '/api/marketing/email/send-campaign',
    async (request: FastifyRequest<{ Body: SendCampaignBody }>, reply: FastifyReply) => {
      try {
        const { campaignName, emailSubject, emailContent, targetSegment } = request.body;

        // Fehlerbehandlung: WooCommerce Config prüfen
        const { woocommerce } = getConfig();
        if (!woocommerce?.url || !woocommerce?.consumerKey || !woocommerce?.consumerSecret) {
          return reply.status(400).send({
            success: false,
            error: 'WooCommerce ist nicht konfiguriert. Bitte connection.json prüfen.'
          });
        }

        const auth = Buffer.from(`${woocommerce.consumerKey}:${woocommerce.consumerSecret}`).toString('base64');

        // Lade Bestellungen aus WooCommerce
        const agent = new https.Agent({ rejectUnauthorized: true });
        const axiosResponse = await axios.get(`${woocommerce.url}/wp-json/wc/v3/orders?per_page=100&status=completed`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          httpsAgent: agent,
        });
        if (axiosResponse.status < 200 || axiosResponse.status >= 300) {
          throw new Error(`WooCommerce API Error: ${axiosResponse.status}`);
        }
        const orders = axiosResponse.data;

        // Extrahiere unique Kunden aus Bestellungen
        const customerMap = new Map<string, { email: string; name: string; dateCreated: Date; lastOrder: Date }>();
        
        orders.forEach((order: any) => {
          const email = order.billing?.email;
          if (!email) return;

          const orderDate = new Date(order.date_created);
          const name = `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim();
          
          if (customerMap.has(email)) {
            const existing = customerMap.get(email)!;
            if (orderDate > existing.lastOrder) {
              existing.lastOrder = orderDate;
            }
            if (orderDate < existing.dateCreated) {
              existing.dateCreated = orderDate;
            }
          } else {
            customerMap.set(email, {
              email,
              name: name || email,
              dateCreated: orderDate,
              lastOrder: orderDate
            });
          }
        });

        // Filtere Kunden nach Segment
        let targetCustomers = Array.from(customerMap.values());

        if (targetSegment !== 'all') {
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

          targetCustomers = targetCustomers.filter((customer) => {
            switch (targetSegment) {
              case 'new':
                return customer.dateCreated > thirtyDaysAgo;
              case 'active':
                return customer.lastOrder > ninetyDaysAgo;
              case 'inactive':
                return customer.lastOrder < ninetyDaysAgo;
              default:
                return true;
            }
          });
        }

        // 🔥 KORRIGIERT: Verwende vorkonfigurierten Email-Service (services/emailService.ts)
        // Sende E-Mails
        let sentCount = 0;
        const errors: string[] = [];

        for (const customer of targetCustomers) {
          try {
            const smtpFrom = (getConfig().smtp?.from) || process.env.SMTP_FROM || 'noreply@example.com';
            await transporter.sendMail({
              from: smtpFrom,
              to: customer.email,
              subject: emailSubject,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">${emailSubject}</h2>
                  <div style="line-height: 1.6; color: #666;">
                    ${emailContent.replace(/\n/g, '<br>')}
                  </div>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                  <p style="font-size: 12px; color: #999;">
                    Kampagne: ${campaignName}<br>
                    Sie erhalten diese E-Mail, weil Sie Kunde bei ${woocommerce.url} sind.
                  </p>
                </div>
              `,
            });
            sentCount++;
          } catch (err) {
            errors.push(`${customer.email}: ${err instanceof Error ? err.message : 'Fehler'}`);
          }
        }

        logger.info({ campaignName, sentCount, total: targetCustomers.length }, 'Email campaign sent');

        return reply.send({
          success: true,
          message: `${sentCount} von ${targetCustomers.length} E-Mails erfolgreich gesendet`,
          stats: {
            sent: sentCount,
            total: targetCustomers.length,
            failed: errors.length
          },
          errors: errors.length > 0 ? errors.slice(0, 5) : undefined
        });
      } catch (_error) {
        logger.error({ error: _error instanceof Error ? _error.message : 'Unknown', function: 'sendCampaign' }, 'Error sending campaign');
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );

  // POST /api/marketing/email/generate - KI-gestützte Kampagnen-Idee + Copy
  server.post<{ Body: EmailGenerationBody }>(
    '/api/marketing/email/generate',
    async (
      request: FastifyRequest<{ Body: EmailGenerationBody }>,
      reply: FastifyReply
    ) => {
      const {
        campaignName,
        goal,
        productDescription,
        targetAudience,
        tone = 'professional',
        lengthMode = 'medium',
        formality = 'du',
        valueProps,
        avoidTerms,
        ctaStyle,
        sendTime
      } = request.body || {};

      const fallback = () => {
        const subjectLines = [
          `${campaignName || goal || 'Deine neue Kampagne'}: Exklusive Vorteile sichern`,
          `${targetAudience ? `${targetAudience}, ` : ''}jetzt ${campaignName || 'mehr Umsatz'} erzielen`,
          `Nur heute: ${valueProps || 'Top-Angebot'} entdecken`
        ];

        const body = `${formality === 'sie' ? 'Guten Tag' : 'Hallo'}${targetAudience ? ` ${targetAudience}` : ''},

${goal || 'Wir haben ein neues Angebot für Sie'}.

Highlights:
- ${valueProps || 'Klarer Nutzen für Ihre Zielgruppe'}
- Persönliche Ansprache (${formality === 'sie' ? 'Sie' : 'Du'})
- ${ctaStyle || 'Direkter Call-to-Action'}

${lengthMode === 'short' ? 'Kurz & knackig.' : lengthMode === 'long' ? 'Ausführlich mit Mehrwert.' : 'Prägnant mit klaren Vorteilen.'}

${formality === 'sie' ? 'Mit freundlichen Grüßen' : 'Beste Grüße'},
Dein Team`;

        const wordCount = body.split(/\s+/).length;

        return {
          success: true,
          subjectLines,
          previewText: `${valueProps || 'Starker Nutzen'} jetzt entdecken`.slice(0, 140),
          body,
          ctas: [
            ctaStyle || 'Jetzt Angebot sichern',
            'Antworten & Termin buchen',
            'Mehr erfahren'
          ],
          personalizationHints: [
            'Name personalisieren',
            targetAudience ? `Segment: ${targetAudience}` : 'Segment: allgemein',
            `Ton: ${tone}`
          ],
          followUps: [
            'Follow-up nach 48h mit Social Proof',
            'Reminder + kleiner Bonus nach 5 Tagen'
          ],
          abTests: [
            { variant: 'A', subject: subjectLines[0], angle: 'Nutzenfokus' },
            { variant: 'B', subject: subjectLines[1], angle: 'Dringlichkeit' }
          ],
          wordCount,
          readTimeMinutes: Math.max(1, Math.round(wordCount / 180)),
          generatedAt: new Date().toISOString()
        };
      };

      try {
        if (!process.env.OPENAI_API_KEY) {
          return reply.send(fallback());
        }

        const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

        const prompt = `Du bist ein deutscher Lifecycle-Marketer. Erzeuge eine komplette E-Mail-Kampagnenvorlage als JSON. Antworte nur mit JSON. Nutze die Vorgaben strikt.

KAMPAGNENNAME: ${campaignName || 'E-Mail Kampagne'}
ZIEL/GOAL: ${goal || 'Verkäufe steigern'}
PRODUKT/BESCHREIBUNG: ${productDescription || 'Noch keine Beschreibung'}
ZIELGRUPPE: ${targetAudience || 'Allgemein'}
TON: ${tone}
FORMALITÄT: ${formality}
LÄNGE: ${lengthMode}
VALUE PROPS: ${valueProps || 'keine angegeben'}
VERMEIDEN: ${avoidTerms || 'keine Angaben'}
CTA-STIL: ${ctaStyle || 'direkt'}
SENDUNG: ${sendTime || 'immediate'}

JSON-Format:
{
  "subjectLines": ["...", "...", "..."],
  "previewText": "Kurzteaser 8-14 Wörter",
  "body": "Kompletter E-Mail-Body in Markdown (inkl. Zeilenumbrüche)",
  "ctas": ["..."],
  "personalizationHints": ["..."],
  "followUps": ["Follow-up Idee 1", "Follow-up Idee 2"],
  "abTests": [{"variant": "A", "subject": "...", "angle": "..."}],
  "wordCount": number,
  "readTimeMinutes": number
}

Texte auf Deutsch, konversionsstark, klar, DSGVO-freundlich.`;

        const completion = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'Du bist ein präziser deutscher E-Mail-Marketer. Antworte nur mit JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.65,
            response_format: { type: 'json_object' }
          })
        });

        if (!completion.ok) {
          throw new Error(`OpenAI Error: ${completion.status}`);
        }

        const data = await completion.json();
        const messageContent = data.choices?.[0]?.message?.content;
        if (!messageContent) {
          throw new Error('OpenAI lieferte keine Nachricht');
        }

        const parsed = JSON.parse(messageContent);
        const body = parsed.body || fallback().body;
        const wordCount = parsed.wordCount || body.split(/\s+/).length;

        return reply.send({
          success: true,
          subjectLines: parsed.subjectLines || [],
          previewText: parsed.previewText || '',
          body,
          ctas: parsed.ctas || [],
          personalizationHints: parsed.personalizationHints || [],
          followUps: parsed.followUps || [],
          abTests: parsed.abTests || [],
          wordCount,
          readTimeMinutes: parsed.readTimeMinutes || Math.max(1, Math.round(wordCount / 180)),
          generatedAt: new Date().toISOString()
        });
      } catch (_error) {
        logger.error({ error: _error instanceof Error ? _error.message : 'Unknown', function: 'generateEmailCampaign' }, 'Error generating email campaign');
        return reply.send(fallback());
      }
    }
  );
}
