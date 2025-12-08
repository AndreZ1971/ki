import { FastifyInstance } from 'fastify';
// Dynamischer Import für node-fetch (ESM in CommonJS)
const fetch = async (url: string, options?: any) => (await import('node-fetch')).default(url, options);

export default async function chatbotMessageRoute(server: FastifyInstance) {
  server.post('/message', async (request, _reply) => {
    try {
      const { message } = request.body as any;
      // Detect if user asks for news/status
      const newsKeywords = [
        'was gibt es neues',
        'news',
        'status',
        'update',
        'aktuell',
        'dashboard',
        'kennzahlen',
        'shop',
        'bericht',
        'report',
        'zahlen',
        'umsatz',
        'orders',
        'kunden',
        'produkte'
      ];
      const lowerMsg = (message || '').toLowerCase();
      const isNewsRequest = newsKeywords.some(k => lowerMsg.includes(k));

      if (isNewsRequest) {
        // Fetch shop metrics from dashboard endpoint
        const res = await fetch('http://localhost:3000/api/analytics/metrics/dashboard');
        const data = await res.json() as { success: boolean; data?: any; error?: string };
        if (data.success && data.data) {
          const m = data.data;
          // Motivierende, lebendige Antwort generieren
          const reply = `Hier sind die neuesten Shop-Kennzahlen für dich! 🚀\n\n` +
            `Umsatz heute: ${m.todaySales} €\n` +
            `Bestellungen heute: ${m.todayOrders}\n` +
            `Neue Kunden heute: ${m.todayCustomers}\n` +
            `Gesamtumsatz: ${m.totalSales} €\n` +
            `Gesamtbestellungen: ${m.totalOrders}\n` +
            `Gesamtkunden: ${m.totalCustomers}\n` +
            `Produkte im Shop: ${m.totalProducts}\n` +
            `Conversion Rate: ${m.conversionRate}%\n\n` +
            `Weiter so! Jeder Tag bringt neue Chancen. 💡`;
          return { success: true, reply };
        } else {
          return { success: false, error: 'Shop-Kennzahlen konnten nicht abgerufen werden.' };
        }
      }

      // Default fallback: motivierende Standardantwort
      return {
        success: true,
        reply: 'Ich bin Ari, dein motivierender KI-Chatbot! Stelle mir Fragen zu deinem Shop, und ich liefere dir aktuelle News, Kennzahlen und Tipps.'
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
    }
  });
}