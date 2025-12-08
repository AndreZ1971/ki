import { FastifyInstance } from 'fastify';
import { fetchReviews, fetchSupportTickets, analyzeReviews, summarizeFeedback } from '../../../../tools/feedbackAnalysis.js';

export default async function feedbackRoutes(server: FastifyInstance) {
  // GET /api/analytics/feedback/reviews
  server.get('/feedback/reviews', async (request, reply) => {
    // Hier: Zugangsdaten aus ENV oder Config holen
    const shopUrl = process.env.SHOP_URL || '';
    const consumerKey = process.env.WC_CONSUMER_KEY || '';
    const consumerSecret = process.env.WC_CONSUMER_SECRET || '';
    const reviews = await fetchReviews({ shopUrl, consumerKey, consumerSecret });
    reply.send({ success: true, reviews });
  });

  // GET /api/analytics/feedback/tickets
  server.get('/feedback/tickets', async (request, reply) => {
    const shopUrl = process.env.SHOP_URL || '';
    const apiToken = process.env.SUPPORT_API_TOKEN || '';
    const tickets = await fetchSupportTickets({ shopUrl, apiToken });
    reply.send({ success: true, tickets });
  });

  // POST /api/analytics/feedback/analyze
  server.post('/feedback/analyze', async (request, reply) => {
    const { reviews, tickets } = request.body as { reviews: any[]; tickets: any[] };
    const analysis = analyzeReviews(reviews);
    const summary = summarizeFeedback(reviews, tickets);
    reply.send({ success: true, analysis, summary });
  });
}
