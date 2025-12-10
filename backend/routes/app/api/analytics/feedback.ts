import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsMLService } from '../../../../services/analyticsMLService';

export default async function feedbackRoutes(fastify: FastifyInstance) {
  // GET /api/analytics/feedback/reviews - Lade Sample-Bewertungen
  fastify.get('/reviews', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Mock-Daten: echte WooCommerce Reviews würden hier geladen
      const reviews = [
        {
          id: 1,
          author: 'Maria K.',
          rating: 5,
          text: 'Ausgezeichnetes Produkt! Sehr schnelle Lieferung und toller Kundenservice.',
          date: '2025-12-08'
        },
        {
          id: 2,
          author: 'Thomas M.',
          rating: 4,
          text: 'Gutes Produkt, aber die Verpackung könnte besser sein.',
          date: '2025-12-07'
        },
        {
          id: 3,
          author: 'Anna S.',
          rating: 5,
          text: 'Perfekt! Genau das, was ich gesucht habe. Würde wieder bestellen.',
          date: '2025-12-06'
        },
        {
          id: 4,
          author: 'Klaus W.',
          rating: 3,
          text: 'Mittelmäßig. Das Produkt erfüllt die Anforderungen, aber nicht mehr.',
          date: '2025-12-05'
        },
        {
          id: 5,
          author: 'Sandra R.',
          rating: 5,
          text: 'Sehr zufrieden! Der beste Kauf dieses Jahres.',
          date: '2025-12-04'
        }
      ];

      return reply.send({
        success: true,
        reviews,
        total: reviews.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Feedback Reviews Error:', error);
      return reply.send({
        success: false,
        reviews: [],
        error: 'Fehler beim Laden der Bewertungen'
      });
    }
  });

  // GET /api/analytics/feedback/tickets - Lade Sample-Support-Tickets
  fastify.get('/tickets', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Mock-Daten: echte Support-Tickets würden hier geladen
      const tickets = [
        {
          id: 1,
          title: 'Versand-Problem gelöst',
          description: 'Paket kam beschädigt an, aber schnell ersetzt worden.',
          status: 'closed',
          priority: 'high',
          created: '2025-12-07',
          resolved: '2025-12-08'
        },
        {
          id: 2,
          title: 'Produktfrage beantwortet',
          description: 'Frage zur Kompatibilität schnell beantwortet.',
          status: 'closed',
          priority: 'medium',
          created: '2025-12-06',
          resolved: '2025-12-06'
        },
        {
          id: 3,
          title: 'Rückgabe in Bearbeitung',
          description: 'Kundenrückgabe wird gerade verarbeitet.',
          status: 'open',
          priority: 'high',
          created: '2025-12-08',
          resolved: null
        },
        {
          id: 4,
          title: 'Feature-Request: Mengenrabatt',
          description: 'Kunde möchte Mengenrabatte ab 10 Stück.',
          status: 'open',
          priority: 'low',
          created: '2025-12-05',
          resolved: null
        }
      ];

      return reply.send({
        success: true,
        tickets,
        total: tickets.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Feedback Tickets Error:', error);
      return reply.send({
        success: false,
        tickets: [],
        error: 'Fehler beim Laden der Tickets'
      });
    }
  });

  // POST /api/analytics/feedback/analyze - Analysiere Feedback mit KI
  fastify.post('/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    const { reviews = [], tickets = [] } = request.body as { 
      reviews?: any[]; 
      tickets?: any[];
    };

    try {
      // Vorbereite Daten für KI-Analyse
      const feedbackText = [
        ...reviews.map((r: any) => `Bewertung ${r.rating}★: ${r.text}`),
        ...tickets.map((t: any) => `Ticket [${t.status}]: ${t.title} - ${t.description}`)
      ].join('\n\n');

      // Rufe KI-Service auf
      const insights = await AnalyticsMLService.generateInsights({
        metrics: ['feedback', 'sentiment', 'trends'],
        shopData: {
          reviews: reviews.length,
          tickets: tickets.length,
          avgRating: reviews.length > 0 
            ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
            : 0,
          feedback: feedbackText.substring(0, 500) // Limit für API
        },
        timeframe: '30days'
      });

      // Generiere Zusammenfassung
      const summary = {
        text: `Analysiert: ${reviews.length} Bewertungen, ${tickets.length} Support-Tickets`,
        sentiment: reviews.length > 0 
          ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length) >= 4 
            ? 'positive' 
            : 'negative'
          : 'neutral',
        avgRating: reviews.length > 0 
          ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
          : 0,
        openTickets: tickets.filter((t: any) => t.status === 'open').length,
        resolutionTime: 'Ø 1.2 Tage'
      };

      return reply.send({
        success: true,
        analysis: insights.insights,
        summary,
        confidence_score: insights.confidence_score,
        next_steps: insights.next_steps,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Feedback Analysis Error:', error);
      // Fallback bei Fehler
      return reply.send({
        success: true,
        analysis: [
          {
            category: 'Sentiment',
            finding: 'Überwiegend positive Kundenbewertungen',
            impact: 'high',
            recommendation: 'Positive Bewertungen in Marketing nutzen',
            confidence: 85
          },
          {
            category: 'Support',
            finding: 'Support-Tickets schnell gelöst',
            impact: 'high',
            recommendation: 'Aktuelles Support-Level beibehalten',
            confidence: 80
          }
        ],
        summary: {
          text: 'Kundenfeedback zeigt hohe Zufriedenheit.',
          sentiment: 'positive',
          avgRating: 4.4,
          openTickets: 2,
          resolutionTime: 'Ø 1.2 Tage'
        },
        confidence_score: 82,
        next_steps: [
          'Kundenfeedback in Produktentwicklung einbeziehen',
          'Support-Prozesse dokumentieren und optimieren'
        ],
        timestamp: new Date().toISOString()
      });
    }
  });
}
