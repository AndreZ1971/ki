import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import config from '../../../../config';
import { getTickets } from '../../../../services/supportTickets';

export default async function feedbackRoutes(fastify: FastifyInstance) {
  // GET /api/analytics/feedback/reviews - WooCommerce Produktbewertungen
  fastify.get('/reviews', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const wooConfig = {
        url: process.env.WOOCOMMERCE_URL || process.env.WOO_URL || config.woocommerce?.url,
        consumerKey: process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY || config.woocommerce?.consumerKey,
        consumerSecret: process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET || config.woocommerce?.consumerSecret,
      };
      if (!wooConfig.url || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
        throw new Error('WooCommerce Konfiguration fehlt (url/consumerKey/consumerSecret).');
      }
      const auth = Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64');
      // WooCommerce Reviews abrufen
      const res = await fetch(`${wooConfig.url}/wp-json/wc/v3/products/reviews?per_page=20`, {
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('WooCommerce API Error (Reviews)');
      const reviews = await res.json();
      return reply.send({
        success: true,
        reviews,
        total: reviews.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return reply.status(404).send({
        success: false,
        reviews: [],
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });

  // GET /api/analytics/feedback/tickets - Tickets via Provider (auto/konfiguriert)
  fastify.get('/tickets', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tickets = await getTickets();
      return reply.send({ success: true, tickets, total: tickets.length, timestamp: new Date().toISOString() });
    } catch (error) {
      return reply.status(404).send({
        success: false,
        tickets: [],
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });

  // POST /api/analytics/feedback/analyze - Analysiert nur echte Feedbackdaten (aktuell keine angebunden)
  fastify.post('/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    // Noch keine echte Datenquelle angebunden
    return reply.status(404).send({
      success: false,
      analysis: [],
      summary: null,
      error: 'Keine echten Feedbackdaten angebunden.'
    });
  });

  // GET /api/analytics/feedback/tickets/health - Ermittelt verfügbare WP REST-Namespaces und mögliche Ticket-Routen
  fastify.get('/tickets/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const wpUrl = process.env.WORDPRESS_URL || config.wordpress?.url;
      if (!wpUrl) {
        return reply.status(400).send({ success: false, error: 'WORDPRESS_URL fehlt in Konfiguration.' });
      }
      const indexRes = await fetch(`${wpUrl.replace(/\/$/, '')}/wp-json/`);
      const indexJson: any = indexRes.ok ? await indexRes.json() : null;
      const namespaces: string[] = Array.isArray(indexJson?.namespaces) ? indexJson.namespaces : [];
      const routesObj = indexJson?.routes || {};
      const allRoutes = Object.keys(routesObj);
      const candidates = allRoutes.filter((r: string) => /ticket|awesome|support/i.test(r));
      return reply.send({
        success: true,
        wordpressUrl: wpUrl,
        namespaces,
        candidates,
        exampleQueries: candidates.slice(0, 10).map((r: string) => `${wpUrl.replace(/\/$/, '')}${r.includes('?') ? r : r + '?per_page=5'}`)
      });
    } catch (e) {
      return reply.status(500).send({ success: false, error: e instanceof Error ? e.message : 'Unbekannter Fehler' });
    }
  });
}
