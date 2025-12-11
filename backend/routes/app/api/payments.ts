import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { recordMlEvent, getMlEvents } from '../../../services/mlStats.js';

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

interface TestPlanBody {
  testType: string;
  target: string;
  riskTolerance?: 'low' | 'medium' | 'high';
}

interface TestDiagnoseBody {
  failureLogs: string[];
  environment?: string;
  testType?: string;
}

interface VerifyPaymentBody {
  transactionId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  ipAddress?: string;
  paymentMethod?: string;
  signature?: string;
  payload?: string;
  environment?: 'prod' | 'staging' | 'dev';
}

interface SuccessMetricsBody {
  timeRange: 'today' | 'week' | 'month' | 'year';
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

        recordMlEvent('payments.fraud-check', true, normalizedAnalysis.confidence);

        console.log(`✅ Fraud analysis: Risk=${normalizedAnalysis.riskScore}, Level=${normalizedAnalysis.riskLevel}`);

        return reply.send({
          success: true,
          data: normalizedAnalysis
        });
      } catch (error) {
        console.error('❌ Fraud check error:', error);
        recordMlEvent('payments.fraud-check', false, 0);
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

        const avgConfidence = suggestions.length
          ? suggestions.reduce((sum: number, s: any) => sum + (s.conversionScore || 0.5), 0) / suggestions.length
          : 0.6;

        console.log(`✅ Generated ${suggestions.length} amount suggestions`);

        recordMlEvent('payments.suggest-amounts', true, avgConfidence);

        return reply.send({
          success: true,
          data: suggestions,
          currency,
          category
        });
      } catch (error) {
        console.error('❌ Amount suggestion error:', error);
        recordMlEvent('payments.suggest-amounts', false, 0);
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

        recordMlEvent('payments.predict-success', true, successProbability);

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
        recordMlEvent('payments.predict-success', false, 0);
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

        recordMlEvent('payments.ux-check', true, normalized.expectedLift || 0.1);

        return reply.send({ success: true, data: normalized });
      } catch (error) {
        console.error('❌ UX check error:', error);
        recordMlEvent('payments.ux-check', false, 0);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'UX-Check fehlgeschlagen'
        });
      }
    }
  );

  // ML: Payment Verification & Risk Assessment
  server.post<{ Body: VerifyPaymentBody }>(
    '/ml/verify',
    {
      schema: {
        tags: ['payments', 'ml'],
        description: 'Validierung einer Payment-Transaktion inkl. Risikoanalyse',
        body: {
          type: 'object',
          required: ['transactionId', 'amount', 'currency', 'customerEmail'],
          properties: {
            transactionId: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            customerEmail: { type: 'string' },
            ipAddress: { type: 'string' },
            paymentMethod: { type: 'string' },
            signature: { type: 'string' },
            payload: { type: 'string' },
            environment: { type: 'string', enum: ['prod', 'staging', 'dev'] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: VerifyPaymentBody }>, reply: FastifyReply) => {
      try {
        const {
          transactionId,
          amount,
          currency,
          customerEmail,
          ipAddress = 'unknown',
          paymentMethod = 'card',
          signature = 'not-provided',
          payload = 'not-provided',
          environment = 'prod'
        } = request.body;

        const { getOpenAIClient, executeOpenAI } = await import('../../../utils/openai.js');
        const openai = getOpenAIClient();

        const emailDomain = customerEmail.split('@')[1] || 'unknown';
        const prompt = `Pruefe eine Payment-Transaktion auf Validitaet und Risiko.

Transaktion:
- Transaction ID: ${transactionId}
- Amount: ${amount} ${currency}
- Customer Email: ${customerEmail}
- Email Domain: ${emailDomain}
- IP: ${ipAddress}
- Payment Method: ${paymentMethod}
- Environment: ${environment}
- Signature: ${signature}
- Payload snippet (max 500 chars): ${payload?.slice(0, 500)}

Aufgaben:
1) Validitaet der Daten plausibilisieren (IDs/Signatur/Email/IP/Method).
2) Betrugsrisiko bewerten (Score 0-100) und Level (low|medium|high|critical).
3) Technische und fachliche Flags ausgeben (z.B. fehlende Signatur, ungültiges Format, Domain-Risiko, Betragsspitze, Duplikatsverdacht).
4) Empfohlene Aktion: approve | manual-review | reject.
5) Liste der Checks mit Status und kurzer Begründung.

Antwort nur als JSON:
{
  "valid": true|false,
  "riskScore": 0-100,
  "riskLevel": "low"|"medium"|"high"|"critical",
  "flags": ["..."],
  "recommendedAction": "approve"|"manual-review"|"reject",
  "reasoning": "kurze Zusammenfassung",
  "checks": [
    { "name": "Signature", "status": "pass|fail|warn", "detail": "..." },
    { "name": "Email", "status": "pass|fail|warn", "detail": "..." },
    { "name": "Amount", "status": "pass|fail|warn", "detail": "..." }
  ]
}`;

        const completion = await executeOpenAI(
          () => openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.28,
            messages: [
              {
                role: 'system',
                content: 'Du bist Payment-Risk- und SRE-Experte. Antworte strikt in JSON, kompakt, ohne Freitext.'
              },
              { role: 'user', content: prompt }
            ]
          }),
          'payment-verify'
        );

        const responseText = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(responseText);

        const normalized = {
          valid: Boolean(parsed.valid),
          riskScore: Math.max(0, Math.min(100, parsed.riskScore ?? 50)),
          riskLevel: ['low', 'medium', 'high', 'critical'].includes(parsed.riskLevel) ? parsed.riskLevel : 'medium',
          flags: Array.isArray(parsed.flags) ? parsed.flags : [],
          recommendedAction: ['approve', 'manual-review', 'reject'].includes(parsed.recommendedAction)
            ? parsed.recommendedAction
            : 'manual-review',
          reasoning: parsed.reasoning || 'Automatische Verifikation',
          checks: Array.isArray(parsed.checks)
            ? parsed.checks.map((c: any) => ({
                name: c.name || 'Check',
                status: ['pass', 'fail', 'warn'].includes(c.status) ? c.status : 'warn',
                detail: c.detail || 'Ohne Detail'
              }))
            : []
        };

        recordMlEvent('payments.verify', normalized.valid, 1 - normalized.riskScore / 100);

        return reply.send({ success: true, data: normalized });
      } catch (error) {
        console.error('❌ Payment verify error:', error);
        recordMlEvent('payments.verify', false, 0);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Verifikation fehlgeschlagen'
        });
      }
    }
  );

  // ML: Payment Test Plan Generation
  server.post<{ Body: TestPlanBody }>(
    '/ml/test-plan',
    {
      schema: {
        tags: ['payments', 'ml'],
        description: 'KI-generierter Testplan für Payments (Risikobasiert)',
        body: {
          type: 'object',
          required: ['testType', 'target'],
          properties: {
            testType: { type: 'string' },
            target: { type: 'string' },
            riskTolerance: { type: 'string', enum: ['low', 'medium', 'high'] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: TestPlanBody }>, reply: FastifyReply) => {
      try {
        const { testType, target, riskTolerance = 'medium' } = request.body;
        const { getOpenAIClient, executeOpenAI } = await import('../../../utils/openai.js');
        const openai = getOpenAIClient();

        const prompt = `Erstelle einen Testplan für Payment-Checks.

Test-Typ: ${testType}
Target: ${target}
Risikotoleranz: ${riskTolerance}

Liefere 5 Szenarien als JSON Array:
[
  {
    "title": "Happy Path Checkout",
    "riskLevel": "low|medium|high",
    "priority": "P1|P2|P3",
    "successProbability": 0.0-1.0,
    "steps": ["Schritt 1", "Schritt 2"],
    "focusArea": "Gateway|Webhook|Retry|3DS|Refund",
    "expectedImpact": "Kurzbeschreibung"
  }
]

Regeln:
- P1 wenn Ausfall Umsatz-kritisch ist
- mind. 1 Szenario für Refund/Chargeback
- mind. 1 Szenario für 3DS / SCA falls relevant
- successProbability realistisch zwischen 0.6 und 0.95
`;

        const completion = await executeOpenAI(
          () => openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.45,
            messages: [
              { role: 'system', content: 'Du bist QA-Lead für Payment, antworte nur mit JSON.' },
              { role: 'user', content: prompt }
            ]
          }),
          'payment-test-plan'
        );

        const responseText = completion.choices[0]?.message?.content || '[]';
        const parsed = JSON.parse(responseText);
        const scenarios = Array.isArray(parsed) ? parsed : [];

        const normalized = scenarios.map((s: any) => ({
          title: s.title || 'Unbenanntes Szenario',
          riskLevel: s.riskLevel === 'high' || s.riskLevel === 'medium' ? s.riskLevel : 'low',
          priority: ['P1', 'P2', 'P3'].includes(s.priority) ? s.priority : 'P2',
          successProbability: Math.max(0, Math.min(1, s.successProbability ?? 0.8)),
          steps: Array.isArray(s.steps) ? s.steps : [],
          focusArea: s.focusArea || 'checkout',
          expectedImpact: s.expectedImpact || 'Stabilität erhöhen'
        }));

        const avgConfidence = normalized.length
          ? normalized.reduce((sum, s) => sum + (s.successProbability ?? 0.8), 0) / normalized.length
          : 0.7;

        recordMlEvent('payments.test-plan', true, avgConfidence);

        return reply.send({ success: true, data: normalized });
      } catch (error) {
        console.error('❌ Test plan error:', error);
        recordMlEvent('payments.test-plan', false, 0);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Testplan konnte nicht generiert werden'
        });
      }
    }
  );

  // ML: Diagnose fehlgeschlagener Tests
  server.post<{ Body: TestDiagnoseBody }>(
    '/ml/test-diagnose',
    {
      schema: {
        tags: ['payments', 'ml'],
        description: 'Root-Cause-Analyse für fehlgeschlagene Payment-Tests',
        body: {
          type: 'object',
          required: ['failureLogs'],
          properties: {
            failureLogs: { type: 'array', items: { type: 'string' } },
            environment: { type: 'string' },
            testType: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: TestDiagnoseBody }>, reply: FastifyReply) => {
      try {
        const { failureLogs, environment = 'staging', testType = 'unknown' } = request.body;
        const { getOpenAIClient, executeOpenAI } = await import('../../../utils/openai.js');
        const openai = getOpenAIClient();

        const prompt = `Analysiere fehlgeschlagene Payment-Tests.
Environment: ${environment}
Test-Typ: ${testType}
Logs:
${failureLogs.slice(0, 10).join('\n')}

Liefere JSON:
{
  "severity": "low|medium|high|critical",
  "confidence": 0.0-1.0,
  "rootCauses": ["..."],
  "fixes": ["..."],
  "recommendedOwners": ["payments", "backend", "devops", "fraud"]
}`;

        const completion = await executeOpenAI(
          () => openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.35,
            messages: [
              { role: 'system', content: 'Du bist ein SRE/QA Lead. Antworte kompakt in JSON, keine Erklärtexte.' },
              { role: 'user', content: prompt }
            ]
          }),
          'test-diagnose'
        );

        const responseText = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(responseText);

        const normalized = {
          severity: ['low', 'medium', 'high', 'critical'].includes(parsed.severity) ? parsed.severity : 'medium',
          confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.6)),
          rootCauses: Array.isArray(parsed.rootCauses) ? parsed.rootCauses : [],
          fixes: Array.isArray(parsed.fixes) ? parsed.fixes : [],
          recommendedOwners: Array.isArray(parsed.recommendedOwners) ? parsed.recommendedOwners : [],
        };

        recordMlEvent('payments.test-diagnose', true, normalized.confidence);

        return reply.send({ success: true, data: normalized });
      } catch (error) {
        console.error('❌ Test diagnose error:', error);
        recordMlEvent('payments.test-diagnose', false, 0);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Test-Diagnose fehlgeschlagen'
        });
      }
    }
  );

  // ML: Payment Success Metrics (real events only)
  server.post<{ Body: SuccessMetricsBody }>(
    '/ml/success-metrics',
    {
      schema: {
        tags: ['payments', 'ml'],
        description: 'Aggregierte Erfolgsmetriken für Payment-ML Events (Verifikation/Fraud/Test)',
        body: {
          type: 'object',
          required: ['timeRange'],
          properties: {
            timeRange: { type: 'string', enum: ['today', 'week', 'month', 'year'] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: SuccessMetricsBody }>, reply: FastifyReply) => {
      try {
        const { timeRange } = request.body;
        const now = new Date();
        const start = new Date(now);
        if (timeRange === 'today') {
          start.setHours(0, 0, 0, 0);
        } else if (timeRange === 'week') {
          const day = start.getDay();
          const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Montag als Wochenstart
          start.setDate(diff);
          start.setHours(0, 0, 0, 0);
        } else if (timeRange === 'month') {
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
        } else if (timeRange === 'year') {
          start.setMonth(0, 1);
          start.setHours(0, 0, 0, 0);
        }

        const events = getMlEvents().filter((e) => e.timestamp >= start.getTime());
        const relevant = events.filter((e) => e.feature.startsWith('payments.'));

        const total = relevant.length;
        const valid = relevant.filter((e) => e.feature === 'payments.verify' ? e.success : true).length;
        const successRate = total > 0 ? valid / total : 0;
        const avgConfidence = relevant.length
          ? relevant.reduce((sum, e) => sum + e.confidence, 0) / relevant.length
          : 0;

        const byFeature = relevant.reduce<Record<string, number>>((acc, e) => {
          acc[e.feature] = (acc[e.feature] || 0) + 1;
          return acc;
        }, {});

        const lastEvent = relevant.length ? new Date(relevant[relevant.length - 1].timestamp).toISOString() : null;

        return reply.send({
          success: true,
          data: {
            total,
            valid,
            successRate,
            avgConfidence,
            byFeature,
            lastEvent
          }
        });
      } catch (error) {
        console.error('❌ Success metrics error:', error);
        return reply.status(500).send({ success: false, error: error instanceof Error ? error.message : 'Metriken konnten nicht berechnet werden' });
      }
    }
  );
}
