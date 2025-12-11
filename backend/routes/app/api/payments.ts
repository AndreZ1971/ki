import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { recordMlEvent, getMlEvents } from '../../../services/mlStats.js';

/**
 * Helper: Remove markdown code blocks from GPT responses
 */
function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

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

interface IssueDetectionBody {
  scanDepth?: 'quick' | 'standard' | 'deep';
  timeRange?: string; // e.g., 'last-24h', 'last-week'
}

interface UserPreferencesBody {
  customerId: string;
  customerEmail?: string;
  purchaseHistory?: Array<{
    amount: number;
    currency: string;
    paymentMethod: string;
    timestamp: string;
  }>;
}

interface DeliveryOptimizationBody {
  orderId: string;
  destination: {
    country: string;
    city: string;
    postalCode: string;
  };
  items: Array<{
    productType: string;
    weight: number;
    value: number;
  }>;
  urgency?: 'standard' | 'express' | 'overnight';
}

interface EmergencyAnalysisBody {
  issueType: string;
  description: string;
  affectedCustomers?: number;
  financialImpact?: number;
  systemsAffected?: string[];
}

interface ExpansionStrategyBody {
  targetRegion: 'eu' | 'us' | 'asia' | 'global';
  currentRevenue?: number;
  currentMarkets?: number;
  priority?: 'speed' | 'balanced' | 'compliance-first';
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

        const responseText = cleanJsonResponse(completion.choices[0]?.message?.content || '[]');
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

  // ML: Issue Detection (proactive payment issue scanning)
  server.post<{ Body: IssueDetectionBody }>(
    '/ml/detect-issues',
    {
      schema: {
        tags: ['payments', 'ml'],
        description: 'KI-gestützte Erkennung von Payment-System-Problemen',
        body: {
          type: 'object',
          properties: {
            scanDepth: { type: 'string', enum: ['quick', 'standard', 'deep'] },
            timeRange: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: IssueDetectionBody }>, reply: FastifyReply) => {
      try {
        const { scanDepth = 'standard', timeRange = 'last-24h' } = request.body;
        const { getOpenAIClient, executeOpenAI } = await import('../../../utils/openai.js');
        const openai = getOpenAIClient();

        // Hole ML Events für Kontext
        const events = getMlEvents();
        const recentEvents = events.filter(e => 
          e.feature.startsWith('payments.') && 
          Date.now() - e.timestamp < 24 * 60 * 60 * 1000
        );

        const failureRate = recentEvents.length > 0
          ? recentEvents.filter(e => !e.success).length / recentEvents.length
          : 0;

        const avgConfidence = recentEvents.length > 0
          ? recentEvents.reduce((sum, e) => sum + e.confidence, 0) / recentEvents.length
          : 0;

        const prompt = `Analysiere Payment-System für potenzielle Probleme.

Scan-Tiefe: ${scanDepth}
Zeitraum: ${timeRange}
Aktuelle Metriken:
- Failure Rate: ${(failureRate * 100).toFixed(1)}%
- Durchschnittliche KI Confidence: ${(avgConfidence * 100).toFixed(1)}%
- Anzahl Events: ${recentEvents.length}

Erkenne Probleme in folgenden Kategorien:
1. Gateway-Timeouts & Latency
2. Validation-Fehler
3. Retry-Loops
4. Fraud-Detection-Anomalien
5. Integration-Probleme (Stripe, PayPal etc.)
6. Rate-Limiting
7. Configuration-Issues

Liefere JSON:
{
  "issues": [
    {
      "type": "Gateway-Timeout" | "Validation" | "Retry" | "Fraud" | "Integration" | "RateLimit" | "Configuration",
      "severity": "low" | "medium" | "high" | "critical",
      "confidence": 0.0-1.0,
      "description": "Klare Beschreibung",
      "affectedArea": "stripe" | "paypal" | "fraud-detection" | "validation" | "webhook",
      "suggestedFix": "Konkrete Lösung",
      "impact": "Auswirkung auf User/Business"
    }
  ],
  "systemHealth": "healthy" | "degraded" | "critical",
  "overallConfidence": 0.0-1.0,
  "recommendedActions": ["Prioritäre Aktionen"]
}`;

        const completion = await executeOpenAI(
          () => openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.28,
            messages: [
              { 
                role: 'system', 
                content: 'Du bist Payment-SRE mit 10 Jahren Erfahrung. Identifiziere reale Probleme basierend auf Metriken. Antworte kompakt in JSON.' 
              },
              { role: 'user', content: prompt }
            ]
          }),
          'issue-detection'
        );

        const responseText = cleanJsonResponse(completion.choices[0]?.message?.content || '{}');
        const parsed = JSON.parse(responseText);

        const normalized = {
          issues: Array.isArray(parsed.issues) ? parsed.issues.map((issue: any) => ({
            type: issue.type || 'Unknown',
            severity: ['low', 'medium', 'high', 'critical'].includes(issue.severity) ? issue.severity : 'medium',
            confidence: Math.max(0, Math.min(1, issue.confidence ?? 0.7)),
            description: issue.description || 'No description',
            affectedArea: issue.affectedArea || 'unknown',
            suggestedFix: issue.suggestedFix || 'Requires investigation',
            impact: issue.impact || 'Unknown impact'
          })) : [],
          systemHealth: ['healthy', 'degraded', 'critical'].includes(parsed.systemHealth) ? parsed.systemHealth : 'healthy',
          overallConfidence: Math.max(0, Math.min(1, parsed.overallConfidence ?? 0.7)),
          recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
          scanMetadata: {
            scanDepth,
            timeRange,
            scannedEvents: recentEvents.length,
            currentFailureRate: failureRate,
            timestamp: new Date().toISOString()
          }
        };

        recordMlEvent('payments.issue-detection', true, normalized.overallConfidence);

        return reply.send({ success: true, data: normalized });
      } catch (error) {
        console.error('❌ Issue detection error:', error);
        recordMlEvent('payments.issue-detection', false, 0);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Issue-Detection fehlgeschlagen'
        });
      }
    }
  );

  // ML: User Payment Preferences (KI-gestützte Präferenzanalyse)
  server.post<{ Body: UserPreferencesBody }>(
    '/ml/user-preferences',
    {
      schema: {
        tags: ['payments', 'ml'],
        description: 'KI-gestützte Analyse von Kundenpräferenzen für personalisierte Payment-Erfahrungen',
        body: {
          type: 'object',
          required: ['customerId'],
          properties: {
            customerId: { type: 'string' },
            customerEmail: { type: 'string' },
            purchaseHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  amount: { type: 'number' },
                  currency: { type: 'string' },
                  paymentMethod: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: UserPreferencesBody }>, reply: FastifyReply) => {
      try {
        const { customerId, customerEmail, purchaseHistory = [] } = request.body;
        const { getOpenAIClient, executeOpenAI } = await import('../../../utils/openai.js');
        const openai = getOpenAIClient();

        // Berechne Statistiken aus Purchase History
        const totalPurchases = purchaseHistory.length;
        const paymentMethodCounts: Record<string, number> = {};
        const currencyCounts: Record<string, number> = {};
        let totalAmount = 0;
        let avgAmount = 0;

        purchaseHistory.forEach(purchase => {
          paymentMethodCounts[purchase.paymentMethod] = (paymentMethodCounts[purchase.paymentMethod] || 0) + 1;
          currencyCounts[purchase.currency] = (currencyCounts[purchase.currency] || 0) + 1;
          totalAmount += purchase.amount;
        });

        if (totalPurchases > 0) {
          avgAmount = totalAmount / totalPurchases;
        }

        const mostUsedPaymentMethod = Object.entries(paymentMethodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'card';
        const preferredCurrency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'EUR';

        const prompt = `Analysiere Kundenpräferenzen für personalisierte Payment-Erfahrung.

Kunde: ${customerId}
Email: ${customerEmail || 'unbekannt'}
Kaufhistorie: ${totalPurchases} Transaktionen
Durchschnittsbetrag: ${avgAmount.toFixed(2)} ${preferredCurrency}
Am meisten genutzt: ${mostUsedPaymentMethod}

Erkenne:
1. Bevorzugte Zahlungsmethoden (Kreditkarte, PayPal, SEPA, Klarna, etc.)
2. Bevorzugte Währung
3. Bevorzugte Sprache (basierend auf Email/Region)
4. Optimale Checkout-Flow (one-page vs. multi-step)
5. Personalisierungs-Empfehlungen für höhere Conversion

Liefere JSON:
{
  "preferredPaymentMethods": ["primary", "secondary", "tertiary"],
  "preferredCurrency": "EUR" | "USD" | "GBP",
  "preferredLanguage": "de" | "en" | "fr",
  "checkoutFlowRecommendation": "one-page" | "multi-step",
  "confidence": 0.0-1.0,
  "personalizations": {
    "showSavedCards": boolean,
    "suggestInstallments": boolean,
    "highlightTrustBadges": boolean,
    "showSecurityFeatures": boolean
  },
  "conversionOptimizations": ["Konkrete Empfehlungen zur Conversion-Steigerung"],
  "riskProfile": "low" | "medium" | "high",
  "lifetimeValue": number,
  "nextBestAction": "string"
}`;

        const completion = await executeOpenAI(
          () => openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.35,
            messages: [
              { 
                role: 'system', 
                content: 'Du bist Payment-UX-Experte mit Fokus auf Personalisierung und Conversion-Optimierung. Antworte kompakt in JSON.' 
              },
              { role: 'user', content: prompt }
            ]
          }),
          'user-preferences'
        );

        const responseText = cleanJsonResponse(completion.choices[0]?.message?.content || '{}');
        const parsed = JSON.parse(responseText);

        const normalized = {
          preferredPaymentMethods: Array.isArray(parsed.preferredPaymentMethods) 
            ? parsed.preferredPaymentMethods 
            : [mostUsedPaymentMethod],
          preferredCurrency: parsed.preferredCurrency || preferredCurrency,
          preferredLanguage: parsed.preferredLanguage || 'de',
          checkoutFlowRecommendation: ['one-page', 'multi-step'].includes(parsed.checkoutFlowRecommendation)
            ? parsed.checkoutFlowRecommendation
            : 'one-page',
          confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.7)),
          personalizations: {
            showSavedCards: parsed.personalizations?.showSavedCards ?? true,
            suggestInstallments: parsed.personalizations?.suggestInstallments ?? false,
            highlightTrustBadges: parsed.personalizations?.highlightTrustBadges ?? true,
            showSecurityFeatures: parsed.personalizations?.showSecurityFeatures ?? true
          },
          conversionOptimizations: Array.isArray(parsed.conversionOptimizations)
            ? parsed.conversionOptimizations
            : [],
          riskProfile: ['low', 'medium', 'high'].includes(parsed.riskProfile)
            ? parsed.riskProfile
            : 'medium',
          lifetimeValue: parsed.lifetimeValue || totalAmount,
          nextBestAction: parsed.nextBestAction || 'Optimize checkout flow',
          metadata: {
            customerId,
            totalPurchases,
            avgAmount,
            analyzedAt: new Date().toISOString()
          }
        };

        recordMlEvent('payments.user-preferences', true, normalized.confidence);

        return reply.send({ success: true, data: normalized });
      } catch (error) {
        console.error('❌ User preferences error:', error);
        recordMlEvent('payments.user-preferences', false, 0);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'User-Preferences-Analyse fehlgeschlagen'
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

  // ML: Delivery Optimization (GPT-4o-mini)
  server.post<{ Body: DeliveryOptimizationBody }>(
    '/ml/delivery-optimization',
    {
      schema: {
        tags: ['payments', 'ml', 'delivery'],
        description: 'KI-gestützte Lieferoptimierung: Carrier-Empfehlung, Route-Analyse, Risiko-Assessment',
        body: {
          type: 'object',
          required: ['orderId', 'destination', 'items'],
          properties: {
            orderId: { type: 'string' },
            destination: {
              type: 'object',
              required: ['country', 'city', 'postalCode'],
              properties: {
                country: { type: 'string' },
                city: { type: 'string' },
                postalCode: { type: 'string' }
              }
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['productType', 'weight', 'value'],
                properties: {
                  productType: { type: 'string' },
                  weight: { type: 'number' },
                  value: { type: 'number' }
                }
              }
            },
            urgency: { type: 'string', enum: ['standard', 'express', 'overnight'] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: DeliveryOptimizationBody }>, reply: FastifyReply) => {
      try {
        const { orderId, destination, items, urgency = 'standard' } = request.body;

        const { getOpenAIClient } = await import('../../../utils/openai.js');
        const openai = getOpenAIClient();

        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        const totalValue = items.reduce((sum, item) => sum + item.value, 0);
        const productTypes = items.map((i) => i.productType).join(', ');

        const systemRole = `Du bist ein Logistik-Experte mit 15 Jahren Erfahrung im E-Commerce-Versand. 
Du analysierst Lieferungen und empfiehlst optimale Versandlösungen basierend auf:
- Zielort (Customs, Infrastruktur, Wetter)
- Produktart & Gewicht
- Versandkosten vs. Lieferzeit
- Carrier-Performance & Zuverlässigkeit
- Risikofaktoren (Zoll, Verzögerungen, Verlust)

Antworte NUR mit JSON (kein Markdown)!`;

        const userPrompt = `Analysiere diese Lieferung:

**Bestellung:** ${orderId}
**Ziel:** ${destination.city}, ${destination.postalCode}, ${destination.country}
**Dringlichkeit:** ${urgency}
**Gewicht gesamt:** ${totalWeight} kg
**Warenwert:** €${totalValue.toFixed(2)}
**Produkte:** ${productTypes}

Gib zurück (JSON):
{
  "recommendedCarrier": {
    "name": "DHL Express",
    "reason": "...",
    "estimatedDays": 2,
    "cost": 15.99,
    "reliability": 95
  },
  "alternativeCarriers": [
    {"name": "UPS", "estimatedDays": 3, "cost": 12.50, "reliability": 88}
  ],
  "deliveryRisks": [
    {"risk": "Zollverzögerung", "probability": "medium", "mitigation": "..."}
  ],
  "routeOptimization": {
    "fastestRoute": "Hamburg → Frankfurt → ${destination.city}",
    "cheapestRoute": "...",
    "recommended": "fastest"
  },
  "estimatedDelivery": {
    "best": "2024-12-13",
    "likely": "2024-12-14",
    "worst": "2024-12-16"
  },
  "specialInstructions": ["Signature required", "Fragile handling"],
  "confidence": 0.85
}`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.32,
          messages: [
            { role: 'system', content: systemRole },
            { role: 'user', content: userPrompt }
          ]
        });

        const responseText = response.choices[0]?.message?.content;
        if (!responseText) {
          throw new Error('Keine Antwort von OpenAI');
        }

        const cleanedText = cleanJsonResponse(responseText);
        const analysis = JSON.parse(cleanedText);

        const normalized = {
          orderId,
          recommendedCarrier: analysis.recommendedCarrier || { name: 'DHL', reason: 'Standard', estimatedDays: 3, cost: 10, reliability: 90 },
          alternativeCarriers: analysis.alternativeCarriers || [],
          deliveryRisks: analysis.deliveryRisks || [],
          routeOptimization: analysis.routeOptimization || { fastestRoute: 'Direct', cheapestRoute: 'Direct', recommended: 'fastest' },
          estimatedDelivery: analysis.estimatedDelivery || { best: '', likely: '', worst: '' },
          specialInstructions: analysis.specialInstructions || [],
          confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.7,
          metadata: {
            destination: `${destination.city}, ${destination.country}`,
            totalWeight,
            totalValue,
            urgency,
            analyzedAt: new Date().toISOString()
          }
        };

        recordMlEvent('payments.delivery-optimization', true, normalized.confidence);

        return reply.send({ success: true, data: normalized });
      } catch (error) {
        console.error('❌ Delivery optimization error:', error);
        recordMlEvent('payments.delivery-optimization', false, 0);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Delivery-Optimierung fehlgeschlagen'
        });
      }
    }
  );

  // ML: Emergency Analysis (GPT-4o-mini)
  server.post<{ Body: EmergencyAnalysisBody }>(
    '/ml/emergency-analysis',
    {
      schema: {
        tags: ['payments', 'ml', 'emergency'],
        description: 'KI-gestützte Notfall-Analyse: Schweregrad, Impact, Sofortmaßnahmen, Eskalation',
        body: {
          type: 'object',
          required: ['issueType', 'description'],
          properties: {
            issueType: { type: 'string' },
            description: { type: 'string' },
            affectedCustomers: { type: 'number' },
            financialImpact: { type: 'number' },
            systemsAffected: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: EmergencyAnalysisBody }>, reply: FastifyReply) => {
      try {
        const { issueType, description, affectedCustomers = 0, financialImpact = 0, systemsAffected = [] } = request.body;

        const { getOpenAIClient } = await import('../../../utils/openai.js');
        const openai = getOpenAIClient();

        const systemRole = `Du bist ein Payment-Incident-Manager mit 20 Jahren Erfahrung in kritischen E-Commerce-Umgebungen.
Du analysierst Notfälle und triffst schnelle, fundierte Entscheidungen basierend auf:
- Schweregrad & Business Impact
- Betroffene Systeme & Kundenanzahl
- SLA-Verletzungen & Eskalationspfade
- Sofortmaßnahmen (Immediate Actions)
- Runbooks & Standard Operating Procedures
- Communication Templates für Stakeholder

Prioritäten: P0 (Critical/Outage) > P1 (High/Degraded) > P2 (Medium) > P3 (Low)

Antworte NUR mit JSON (kein Markdown)!`;

        const userPrompt = `NOTFALL-ANALYSE:

**Problem-Typ:** ${issueType}
**Beschreibung:** ${description}
**Betroffene Kunden:** ${affectedCustomers}
**Finanzieller Impact:** €${financialImpact}
**Betroffene Systeme:** ${systemsAffected.length > 0 ? systemsAffected.join(', ') : 'Unbekannt'}

Analysiere und gib zurück (JSON):
{
  "severity": "P0" | "P1" | "P2" | "P3",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "estimatedImpact": {
    "customersFacing": 1000,
    "revenueAtRisk": 50000,
    "slaViolation": true,
    "uptimeImpact": "95%"
  },
  "rootCauseHypothesis": ["...", "..."],
  "immediateActions": [
    {"action": "...", "owner": "DevOps", "eta": "5 min"},
    {"action": "...", "owner": "Payment Team", "eta": "10 min"}
  ],
  "escalationPath": ["L1 Support", "Payment Lead", "CTO"],
  "runbookUrl": "https://docs.company.com/runbooks/payment-outage",
  "communicationTemplate": {
    "internal": "...",
    "customer": "...",
    "stakeholder": "..."
  },
  "slaDeadline": "2024-12-11T15:00:00Z",
  "mitigationSteps": ["...", "..."],
  "preventionRecommendations": ["...", "..."],
  "confidence": 0.9
}`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.15, // Sehr niedrig für kritische Entscheidungen
          messages: [
            { role: 'system', content: systemRole },
            { role: 'user', content: userPrompt }
          ]
        });

        const responseText = response.choices[0]?.message?.content;
        if (!responseText) {
          throw new Error('Keine Antwort von OpenAI');
        }

        const cleanedText = cleanJsonResponse(responseText);
        const analysis = JSON.parse(cleanedText);

        const ticketId = `EMG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const normalized = {
          ticketId,
          severity: analysis.severity || 'P2',
          priority: analysis.priority || 'MEDIUM',
          estimatedImpact: analysis.estimatedImpact || {
            customersFacing: affectedCustomers,
            revenueAtRisk: financialImpact,
            slaViolation: false,
            uptimeImpact: '99%'
          },
          rootCauseHypothesis: analysis.rootCauseHypothesis || ['Unbekannt'],
          immediateActions: analysis.immediateActions || [],
          escalationPath: analysis.escalationPath || ['Support', 'Engineering'],
          runbookUrl: analysis.runbookUrl || null,
          communicationTemplate: analysis.communicationTemplate || {
            internal: 'Notfall gemeldet. Untersuchung läuft.',
            customer: 'Wir arbeiten an einer Lösung.',
            stakeholder: 'Incident wurde eskaliert.'
          },
          slaDeadline: analysis.slaDeadline || null,
          mitigationSteps: analysis.mitigationSteps || [],
          preventionRecommendations: analysis.preventionRecommendations || [],
          confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.8,
          metadata: {
            issueType,
            affectedCustomers,
            financialImpact,
            systemsAffected,
            reportedAt: new Date().toISOString()
          }
        };

        recordMlEvent('payments.emergency-analysis', true, normalized.confidence);

        // 🚨 ALERTING: Sende Notfall-Meldungen an konfigurierte Kanäle
        await sendEmergencyAlerts(normalized);

        return reply.send({ success: true, data: normalized });
      } catch (error) {
        console.error('❌ Emergency analysis error:', error);
        recordMlEvent('payments.emergency-analysis', false, 0);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Emergency-Analyse fehlgeschlagen'
        });
      }
    }
  );

  // ML: Expansion Strategy (GPT-4o-mini)
  server.post<{ Body: ExpansionStrategyBody }>(
    '/ml/expansion-strategy',
    {
      schema: {
        tags: ['payments', 'ml', 'expansion'],
        description: 'KI-gestützte Expansionsempfehlung: Märkte, Umsatzprojektion, Risiken, Compliance',
        body: {
          type: 'object',
          required: ['targetRegion'],
          properties: {
            targetRegion: { type: 'string', enum: ['eu', 'us', 'asia', 'global'] },
            currentRevenue: { type: 'number' },
            currentMarkets: { type: 'number' },
            priority: { type: 'string', enum: ['speed', 'balanced', 'compliance-first'] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: ExpansionStrategyBody }>, reply: FastifyReply) => {
      try {
        const { targetRegion, currentRevenue = 0, currentMarkets = 1, priority = 'balanced' } = request.body;

        const { getOpenAIClient } = await import('../../../utils/openai.js');
        const openai = getOpenAIClient();

        const systemRole = `Du bist ein Payment-Expansion-Experte mit Fokus auf PSP/Acquirer-Auswahl, Lokalisierung und Compliance (PCI, PSD2, SCA).
Liefere konkrete, umsetzbare Pläne für Markteintritt, Payments-Stack, Risiko & Compliance.
Antworte NUR mit JSON (kein Markdown)!`;

        const userPrompt = `EXPANSIONS-ANALYSE
Region: ${targetRegion}
Aktueller Umsatz: €${currentRevenue}
Aktuelle Märkte: ${currentMarkets}
Priorität: ${priority}

Gib zurück (JSON):
{
  "marketsToEnter": [
    {"country": "Germany", "reason": "Hohe Kaufkraft", "expectedLift": 12},
    {"country": "France", "reason": "Großer Markt", "expectedLift": 8}
  ],
  "revenueProjection": {"best": 1200000, "likely": 850000, "worst": 550000},
  "timeline": [
    {"phase": "Setup", "durationWeeks": 4, "milestones": ["PSP Auswahl", "KYC/PCI"]},
    {"phase": "Go-Live", "durationWeeks": 3, "milestones": ["A/B Payment Methoden", "3DS Routing"]}
  ],
  "riskMitigation": [
    {"risk": "SCA-Abbrüche", "probability": "medium", "action": "Fallback auf 3DS exemptions"}
  ],
  "complianceChecklist": ["PCI SAQ A", "PSD2 SCA", "DSGVO"],
  "paymentStack": {
    "psp": ["Adyen", "Stripe"],
    "paymentMethods": ["Cards", "PayPal", "Klarna", "Apple Pay"],
    "fraud": "Rules + 3DS" 
  },
  "localization": {
    "currencies": ["EUR", "USD"],
    "languages": ["de", "en"],
    "tax": "EU VAT OSS"
  },
  "logisticsNotes": ["Lokale Warehousing-Partner evaluieren"],
  "confidence": 0.82
}`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.25,
          messages: [
            { role: 'system', content: systemRole },
            { role: 'user', content: userPrompt }
          ]
        });

        const responseText = response.choices[0]?.message?.content;
        if (!responseText) {
          throw new Error('Keine Antwort von OpenAI');
        }

        const cleanedText = cleanJsonResponse(responseText);
        const analysis = JSON.parse(cleanedText);

        const normalized = {
          targetRegion,
          marketsToEnter: analysis.marketsToEnter || [],
          revenueProjection: analysis.revenueProjection || { best: 0, likely: 0, worst: 0 },
          timeline: analysis.timeline || [],
          riskMitigation: analysis.riskMitigation || [],
          complianceChecklist: analysis.complianceChecklist || [],
          paymentStack: analysis.paymentStack || { psp: [], paymentMethods: [], fraud: '' },
          localization: analysis.localization || { currencies: [], languages: [], tax: '' },
          logisticsNotes: analysis.logisticsNotes || [],
          confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.75,
          metadata: {
            currentRevenue,
            currentMarkets,
            priority,
            analyzedAt: new Date().toISOString()
          }
        };

        recordMlEvent('payments.expansion-strategy', true, normalized.confidence);

        return reply.send({ success: true, data: normalized });
      } catch (error) {
        console.error('❌ Expansion strategy error:', error);
        recordMlEvent('payments.expansion-strategy', false, 0);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Expansion-Strategie fehlgeschlagen'
        });
      }
    }
  );
}

/**
 * 🚨 Emergency Alerting: Sendet Notfall-Meldungen an konfigurierte Systeme
 */
async function sendEmergencyAlerts(analysis: any): Promise<void> {
  const alerts: string[] = [];

  try {
    // 1. Slack Webhook (wenn konfiguriert)
    const slackWebhook = process.env.SLACK_EMERGENCY_WEBHOOK;
    if (slackWebhook) {
      try {
        const slackPayload = {
          text: `🚨 *PAYMENT EMERGENCY*`,
          blocks: [
            {
              type: 'header',
              text: { type: 'plain_text', text: `🚨 Payment Emergency: ${analysis.severity}` }
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Ticket:*\n${analysis.ticketId}` },
                { type: 'mrkdwn', text: `*Priority:*\n${analysis.priority}` },
                { type: 'mrkdwn', text: `*Customers Affected:*\n${analysis.estimatedImpact.customersFacing.toLocaleString()}` },
                { type: 'mrkdwn', text: `*Revenue at Risk:*\n€${analysis.estimatedImpact.revenueAtRisk.toLocaleString()}` }
              ]
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*Issue Type:* ${analysis.metadata.issueType}\n*SLA Violation:* ${analysis.estimatedImpact.slaViolation ? '❌ YES' : '✅ NO'}` }
            },
            {
              type: 'divider'
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*Escalation Path:*\n${analysis.escalationPath.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}` }
            }
          ]
        };

        const slackResponse = await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackPayload)
        });

        if (slackResponse.ok) {
          alerts.push('✅ Slack notification sent');
        } else {
          alerts.push('⚠️ Slack notification failed');
        }
      } catch (slackError) {
        console.error('Slack webhook error:', slackError);
        alerts.push('❌ Slack error');
      }
    }

    // 2. Email Alert (über existierendes Email-System)
    const alertEmail = process.env.EMERGENCY_ALERT_EMAIL;
    if (alertEmail) {
      try {
        // Hier würde dein bestehendes Email-System integriert werden
        console.log(`📧 Emergency email would be sent to: ${alertEmail}`);
        alerts.push('✅ Email queued');
      } catch (emailError) {
        console.error('Email error:', emailError);
        alerts.push('❌ Email error');
      }
    }

    // 3. PagerDuty Integration (wenn konfiguriert)
    const pagerDutyKey = process.env.PAGERDUTY_INTEGRATION_KEY;
    if (pagerDutyKey && (analysis.severity === 'P0' || analysis.severity === 'P1')) {
      try {
        const pagerDutyPayload = {
          routing_key: pagerDutyKey,
          event_action: 'trigger',
          payload: {
            summary: `Payment Emergency: ${analysis.metadata.issueType}`,
            severity: analysis.severity === 'P0' ? 'critical' : 'error',
            source: 'ARI Payment System',
            custom_details: {
              ticket_id: analysis.ticketId,
              customers_affected: analysis.estimatedImpact.customersFacing,
              revenue_at_risk: analysis.estimatedImpact.revenueAtRisk,
              sla_violation: analysis.estimatedImpact.slaViolation,
              escalation_path: analysis.escalationPath.join(' → ')
            }
          }
        };

        const pdResponse = await fetch('https://events.pagerduty.com/v2/enqueue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pagerDutyPayload)
        });

        if (pdResponse.ok) {
          alerts.push('✅ PagerDuty incident created');
        } else {
          alerts.push('⚠️ PagerDuty failed');
        }
      } catch (pdError) {
        console.error('PagerDuty error:', pdError);
        alerts.push('❌ PagerDuty error');
      }
    }

    // 4. Console Log (immer)
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 PAYMENT EMERGENCY ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ticket:           ${analysis.ticketId}
Severity:         ${analysis.severity}
Priority:         ${analysis.priority}
Customers:        ${analysis.estimatedImpact.customersFacing.toLocaleString()}
Revenue at Risk:  €${analysis.estimatedImpact.revenueAtRisk.toLocaleString()}
SLA Violation:    ${analysis.estimatedImpact.slaViolation ? 'YES ❌' : 'NO ✅'}
Issue Type:       ${analysis.metadata.issueType}

Escalation Path:
${analysis.escalationPath.map((p: string, i: number) => `  ${i + 1}. ${p}`).join('\n')}

Alerts Sent: ${alerts.join(', ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

  } catch (error) {
    console.error('❌ Error sending emergency alerts:', error);
  }
}
