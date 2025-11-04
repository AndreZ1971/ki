// backend/routes/app/api/marketing/email-marketing.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import nodemailer from 'nodemailer';

interface SendCampaignBody {
  campaignName: string;
  emailSubject: string;
  emailContent: string;
  targetSegment: 'all' | 'new' | 'active' | 'inactive';
  sendTime: string;
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
      const wooConfig = {
        url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
        consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
        consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
      };

      const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');

      // Lade alle Bestellungen (nicht Kunden, da WooCommerce oft keine separaten Customer-Records hat)
      const response = await fetch(`${wooConfig.url}/wp-json/wc/v3/orders?per_page=100&status=completed`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`WooCommerce API Error: ${response.status}`);
      }

      const orders = await response.json();

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
      console.error('❌ Error loading customer segments:', _error);
      return reply.status(500).send({
        success: false,
        error: _error instanceof Error ? _error.message : 'Unbekannter Fehler',
        // Fallback für Demo
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

        const wooConfig = {
          url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL,
          consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET,
        };

        const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');

        // Lade Bestellungen aus WooCommerce
        const response = await fetch(`${wooConfig.url}/wp-json/wc/v3/orders?per_page=100&status=completed`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`WooCommerce API Error: ${response.status}`);
        }

        const orders = await response.json();

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

        // E-Mail-Versand konfigurieren
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        // Sende E-Mails
        let sentCount = 0;
        const errors: string[] = [];

        for (const customer of targetCustomers) {
          try {
            await transporter.sendMail({
              from: process.env.SMTP_FROM || process.env.SMTP_USER,
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
                    Sie erhalten diese E-Mail, weil Sie Kunde bei ${wooConfig.url} sind.
                  </p>
                </div>
              `,
            });
            sentCount++;
          } catch (err) {
            errors.push(`${customer.email}: ${err instanceof Error ? err.message : 'Fehler'}`);
          }
        }

        console.log(`✅ E-Mail-Kampagne "${campaignName}" gesendet: ${sentCount}/${targetCustomers.length}`);

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
        console.error('❌ Error sending campaign:', _error);
        return reply.status(500).send({
          success: false,
          error: _error instanceof Error ? _error.message : 'Unbekannter Fehler'
        });
      }
    }
  );
}
