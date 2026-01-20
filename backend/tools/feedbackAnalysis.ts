// Kunden-Feedback-Analyse Tool
// Analysiert Bewertungen und Support-Tickets aus dem Shop

import { logger } from '../logger';

// Dynamischer Import für node-fetch (ESM/TS kompatibel)
// @ts-expect-error: TypeScript cannot resolve .js import in mixed ESM/CJS build
import type { RequestInfo, RequestInit } from 'node-fetch';
const fetch = async (input: RequestInfo, init?: RequestInit) => {
  const mod = await import('node-fetch');
  return mod.default(input, init);
};

// Typen für Reviews und Tickets
export interface Review {
  id: number;
  rating: number;
  review: string;
}

export interface Ticket {
  id: number;
  subject: string;
  status: string;
  message: string;
}

// Beispiel: WooCommerce Bewertungen abrufen
export async function fetchReviews({ shopUrl, consumerKey, consumerSecret }: { shopUrl: string; consumerKey: string; consumerSecret: string }): Promise<Review[]> {
  const url = `${shopUrl}/wp-json/wc/v3/products/reviews`;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Fehler beim Abrufen der Bewertungen');
    const data = await response.json();
    return data as Review[];
  } catch (error) {
    logger.error({ error }, 'Failed to fetch reviews');
    return [];
  }
}

// Beispiel: Support-Tickets abrufen (wenn Plugin/API vorhanden)
export async function fetchSupportTickets({ shopUrl, apiToken }: { shopUrl: string; apiToken: string }): Promise<Ticket[]> {
  if (!apiToken || !shopUrl) {
    logger.warn('Support-Tickets werden nicht geladen: fehlender apiToken oder shopUrl');
    return [];
  }

  const url = `${shopUrl}/wp-json/support/v1/tickets`;
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Fehler beim Abrufen der Support-Tickets');
    const data = await response.json();
    return data as Ticket[];
  } catch (error) {
    logger.error({ error, url }, 'Failed to fetch support tickets');
    return [];
  }
}

// Beispiel: Analyse der Bewertungen (deterministisch, ohne Zufall)
export function analyzeReviews(reviews: Review[]): Array<{ id: number; rating: number; sentiment: string; content: string }> {
  const positiveWords = ['gut', 'super', 'top', 'zufrieden', 'empfehlung', 'schnell', 'toll'];
  const negativeWords = ['schlecht', 'langsam', 'defekt', 'mangelhaft', 'unzufrieden', 'problem'];

  return reviews.map((r: Review) => {
    const text = (r.review || '').toLowerCase();
    const posHits = positiveWords.filter(w => text.includes(w)).length;
    const negHits = negativeWords.filter(w => text.includes(w)).length;
    const sentiment = posHits > negHits ? 'positiv' : negHits > posHits ? 'negativ' : 'neutral';

    return {
      id: r.id,
      rating: r.rating,
      sentiment,
      content: r.review,
    };
  });
}

// Beispiel: Zusammenfassung generieren
export function summarizeFeedback(reviews: Review[], tickets: Ticket[]): { totalReviews: number; averageRating: number; ticketCount: number } {
  return {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 ? reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length : 0,
    ticketCount: tickets.length,
    // Weitere Analysen möglich
  };
}

// Rohdaten-Ausgabe als Text (kein Code-Block)
export function formatRawFeedbackText(reviews: Review[], tickets: Ticket[]): string {
  const reviewLines = reviews.map(r => `Review #${r.id} (${r.rating}/5): ${r.review}`);
  const ticketLines = tickets.map(t => `Ticket #${t.id} [${t.status}] ${t.subject}: ${t.message}`);
  const sections = [
    '--- Reviews ---',
    reviewLines.join('\n') || 'Keine Reviews gefunden.',
    '\n--- Tickets ---',
    ticketLines.join('\n') || 'Keine Tickets gefunden.',
  ];
  return sections.join('\n');
}
