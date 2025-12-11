import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface FraudCheckBody {
  amount: number;
  currency: string;
  customerEmail: string;
  ipAddress?: string;
}

interface AmountSuggestionQuery {
  currency?: string;
  category?: string;
}

interface UxCheckBody {
  productName: string;
  amount: number;
  currency: string;
  flowType?: 'one-page' | 'multi-step';
}

export default async function paymentRoutes(server: FastifyInstance) {
  
  // ML: Fraud Detection
  server.post<{ Body: FraudCheckBody }>(
    '/ml/fraud-check',
    {
      schema: {
        tags: ['payments', 'ml'],
        description: 'KI-basierte Betrugserkennung für Payment-Transaktionen',
        body: {
          type: 'object',
          required: ['amount', 'currency', 'customerEmail'],
          properties: {
            amount: { type: 'number' },
            currency: { type: 'string' },
            customerEmail: { type: 'string' },
            ipAddress: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: FraudCheckBody }>, reply: FastifyReply) => {
      try {
        const { amount, currency, customerEmail, ipAddress = 'unknown' } = request.body;
        console.log('🔍 Fraud check:', { amount, customerEmail });

        const { getOpenAIClient, executeOpenAI } = await import('../../../utils/openai.js');
        const openai = getOpenAIClient();

        // Email-Domain extrahieren
        const emailDomain = customerEmail.split('@')[1] || 'unknown';
        
        const prompt = `Analysiere diese Payment-Transaktion auf Betrugsrisiko:

Transaktionsdetails:
- Betrag: ${amount} ${currency}
- Kunden-Email: ${customerEmail}
- Email-Domain: ${emailDomain}
- IP-Adresse: ${ipAddress}

Bewerte folgende Risikofaktoren:
1. **Email-Domain-Reputation**: Ist dies eine bekannte Wegwerf-Email-Domain? (tempmail, guerrillamail, etc.)
2. **Betragshöhe**: Ist ${amount} ${currency} ungewöhnlich hoch für E-Commerce? (>500€ = Risiko)
3. **Email-Muster**: Sieht die Email verdächtig aus? (random chars, kein Name, etc.)
4. **Geografische Indikatoren**: Basierend auf Domain/IP, gibt es Risiko-Länder?

Fraud-Detection-Regeln:
- Wegwerf-Email-Domains = +40 Risiko-Punkte
- Betrag >500€ = +20 Punkte
- Betrag >1000€ = +40 Punkte
- Verdächtige Email-Struktur = +15 Punkte
- Neue/unbekannte Domain = +10 Punkte

Antworte mit einem JSON-Objekt:
{
  "riskScore": 0-100,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "flags": ["Liste der erkannten Risikofaktoren"],
  "recommendation": "Transaktion genehmigen" | "Manuelle Prüfung erforderlich" | "Transaktion ablehnen",
  "confidence": 0.0-1.0,
  "reasoning": "Kurze Begründung der Bewertung"
}

Scoring:
- 0-25: low risk
- 26-50: medium risk
- 51-75: high risk
- 76-100: critical risk`;

        const completion = await executeOpenAI(
          () => openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.3,
            messages: [
              { 
                role: 'system', 
                content: 'Du bist Payment-Security-Experte mit 15 Jahren Erfahrung in Fraud-Detection. Deine Analysen sind präzise und datenbasiert.' 
              },
              { role: 'user', content: prompt }
            ]
          }),
          'fraud-detection'
        );

        const responseText = completion.choices[0]?.message?.content || '{}';
        const analysis = JSON.parse(responseText);

        // Validierung & Normalisierung
        const normalizedAnalysis = {
          riskScore: Math.max(0, Math.min(100, analysis.riskScore || 0)),
          riskLevel: analysis.riskLevel || 'low',
          flags: Array.isArray(analysis.flags) ? analysis.flags : [],
          recommendation: analysis.recommendation || 'Manuelle Prüfung erforderlich',
          confidence: Math.max(0, Math.min(1, analysis.confidence || 0.7)),
          reasoning: analysis.reasoning || 'Automatische Analyse',
          analyzedAt: new Date().toISOString()
        };

        console.log(`✅ Fraud analysis: Risk=${normalizedAnalysis.riskScore}, Level=${normalizedAnalysis.riskLevel}`);

        return reply.send({
          success: true,
          data: normalizedAnalysis
        });
      } catch (error) {
        console.error('❌ Fraud check error:', error);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Fraud-Check fehlgeschlagen'
        });
      }
    }
  );

  // ML: Smart Amount Suggestions
  server.get<{ Querystring: AmountSuggestionQuery }>(
    '/ml/suggest-amounts',
    {
      schema: {
        tags: ['payments', 'ml'],
        description: 'KI-basierte Betrags-Empfehlungen für optimale Conversion',
        querystring: {
          type: 'object',
          properties: {
            currency: { type: 'string' },
            category: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Querystring: AmountSuggestionQuery }>, reply: FastifyReply) => {
      try {
        const { currency = 'EUR', category = 'digital-products' } = request.query;
        console.log('💰 Amount suggestions for:', currency, category);

        const { getOpenAIClient, executeOpenAI } = await import('../../../utils/openai.js');
        const openai = getOpenAIClient();

        const prompt = `Empfehle 5 optimale Payment-Beträge für ${category} in ${currency}.

Kontext:
- Kategorie: ${category}
- Währung: ${currency}
- Ziel: Maximale Conversion-Rate

Psychologische Preisgestaltung beachten:
- Charm Pricing: 9,99 statt 10,00
- Prestige Pricing: runde Zahlen für Premium
- Anchoring: Mittlerer Preis wirkt fair
- Sweet Spots: 49, 99, 149, 199, 299€

Antworte mit JSON Array:
[
  {
    "amount": 49.99,
    "reason": "Einstiegspreis mit hoher Conversion (87%)",
    "conversionScore": 0.87,
    "targetAudience": "Preisbewusste Käufer",
    "psychologicalEffect": "Charm Pricing - unter 50€ Schwelle"
  }
]`;

        const completion = await executeOpenAI(
          () => openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.7,
            messages: [
              { role: 'system', content: 'Du bist Pricing-Strategie-Experte mit Fokus auf psychologische Preisgestaltung.' },
              { role: 'user', content: prompt }
            ]
          }),
          'amount-suggestions'
        );

        const responseText = completion.choices[0]?.message?.content || '[]';
        let suggestions = JSON.parse(responseText);

        // Validierung
        suggestions = suggestions.map((s: any) => ({
          ...s,
          amount: parseFloat(s.amount || 0),
          conversionScore: Math.max(0, Math.min(1, s.conversionScore || 0.5))
        }));

        console.log(`✅ Generated ${suggestions.length} amount suggestions`);

        return reply.send({
          success: true,
          data: suggestions,
          currency,
          category
        });
      } catch (error) {
        console.error('❌ Amount suggestion error:', error);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Betrags-Empfehlung fehlgeschlagen'
        });
      }
    }
  );

  // ML: Payment Success Prediction
  server.post<{ Body: FraudCheckBody }>(
    '/ml/predict-success',
    {
      schema: {
        tags: ['payments', 'ml'],
        description: 'Vorhersage der Payment-Erfolgswahrscheinlichkeit',
        body: {
          type: 'object',
          required: ['amount', 'currency', 'customerEmail'],
          properties: {
            amount: { type: 'number' },
            currency: { type: 'string' },
            customerEmail: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: FraudCheckBody }>, reply: FastifyReply) => {
      try {
        const { amount, currency, customerEmail } = request.body;

        // Einfaches Regelbasiertes System (kann später durch echtes ML ersetzt werden)
        let successProbability = 0.85; // Baseline
        const factors: string[] = [];

        // Betrags-Check
        if (amount < 10) {
          successProbability += 0.1;
          factors.push('Niedriger Betrag erhöht Erfolgswahrscheinlichkeit');
        } else if (amount > 500) {
          successProbability -= 0.15;
          factors.push('Hoher Betrag kann zu Abbrüchen führen');
        }

        // Email-Check
        const emailDomain = customerEmail.split('@')[1] || '';
        const knownDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'web.de', 'gmx.de'];
        if (knownDomains.includes(emailDomain)) {
          successProbability += 0.05;
          factors.push('Bekannte Email-Domain');
        }

        // Währungs-Check
        if (currency === 'EUR') {
          successProbability += 0.03;
          factors.push('EUR hat höchste Erfolgsrate');
        }

        successProbability = Math.max(0, Math.min(1, successProbability));

        return reply.send({
          success: true,
          data: {
            successProbability: parseFloat(successProbability.toFixed(3)),
            factors,
            recommendation: successProbability > 0.7 
              ? 'Payment durchführen - hohe Erfolgswahrscheinlichkeit'
              : 'Alternative Payment-Methode anbieten'
          }
        });
      } catch (error) {
        console.error('❌ Success prediction error:', error);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Vorhersage fehlgeschlagen'
        });
      }
    }
  );

  // ML: UX Quick Wins & Conversion Lift
  server.post<{ Body: UxCheckBody }>(
    '/ml/ux-check',
    {
      schema: {
        tags: ['payments', 'ml'],
        description: 'KI-Empfehlungen für Checkout-UX und erwarteten Conversion-Lift',
        body: {
          type: 'object',
          required: ['productName', 'amount', 'currency'],
          properties: {
            productName: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            flowType: { type: 'string', enum: ['one-page', 'multi-step'] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: UxCheckBody }>, reply: FastifyReply) => {
      try {
        const { productName, amount, currency, flowType = 'one-page' } = request.body;
        const { getOpenAIClient, executeOpenAI } = await import('../../../utils/openai.js');
        const openai = getOpenAIClient();

        const prompt = `Gib UX-Empfehlungen für einen Checkout.

Produkt: ${productName}
Betrag: ${amount} ${currency}
Flow-Typ: ${flowType}

Ziele:
- Abbrüche reduzieren
- Vertrauen erhöhen
- Geschwindigkeit steigern

Antworte als JSON-Objekt:
{
  "expectedLift": 0.0-1.0, // erwarteter relativer Conversion-Lift
  "quickWins": ["stichpunktartige Quick Wins"],
  "issues": ["potenzielle UX-Probleme"],
  "recommendedFlow": "kurze Empfehlung zum Flow"
}`;

        const completion = await executeOpenAI(
          () => openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.4,
            messages: [
              {
                role: 'system',
                content: 'Du bist Conversion-Rate-Optimization (CRO) Experte für Checkouts. Antworte kompakt in JSON.'
              },
              { role: 'user', content: prompt }
            ]
          }),
          'ux-check'
        );

        const responseText = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(responseText);

        const normalized = {
          expectedLift: Math.max(0, Math.min(1, parsed.expectedLift ?? 0.08)),
          quickWins: Array.isArray(parsed.quickWins) ? parsed.quickWins : [],
          issues: Array.isArray(parsed.issues) ? parsed.issues : [],
          recommendedFlow: parsed.recommendedFlow || 'One-Page mit Gast-Checkout und Auto-Fill'
        };

        return reply.send({ success: true, data: normalized });
      } catch (error) {
        console.error('❌ UX check error:', error);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'UX-Check fehlgeschlagen'
        });
      }
    }
  );
}
