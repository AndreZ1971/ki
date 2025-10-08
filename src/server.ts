import 'dotenv/config';
import Fastify from 'fastify';
import fastifyRawBody from 'fastify-raw-body';
import crypto from 'node:crypto';
import { Memory } from './agent/memory.js';
import { planAndAct } from './agent/planner.js';
import { logger } from './logger.js';

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL || 'info' },
});

const memory = new Memory();

// ✨ Raw Body für HMAC-Signatur prüfen (Woo Webhooks)
await app.register(fastifyRawBody, { field: 'rawBody', global: true, encoding: 'utf8' });

type RunBody = { goal?: string };
type WebhookHeaders = Record<string, string | string[] | undefined>;

function getHeader(headers: WebhookHeaders, key: string): string | undefined {
  const v = headers[key.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
}

function getPossibleOrderId(payload: Record<string, unknown>): string {
  const keys = ['id', 'resource_id', 'order_id'] as const;
  for (const k of keys) {
    const val = payload[k];
    if (typeof val === 'string' || typeof val === 'number') return String(val);
  }
  return 'unbekannt';
}

/**
 * POST /run
 * Freitext-Ziel ausführen (Plan & Act)
 */
app.post('/run', async (req, res) => {
  const body = (req.body ?? {}) as RunBody;
  const goal = body.goal?.toString().trim();
  if (!goal) return res.code(400).send({ error: 'Missing goal' });

  memory.push({ role: 'user', content: goal });
  const result = await planAndAct(goal, memory.all());
  memory.push({ role: 'assistant', content: result.result });

  return { steps: result.steps, result: result.result };
});

/**
 * WooCommerce Webhook (z. B. order.created)
 * Signatur wird mit WOO_WEBHOOK_SECRET verifiziert.
 */
app.post('/woo/webhook', async (req, res) => {
  const secret = process.env.WOO_WEBHOOK_SECRET;
  if (!secret) return res.code(500).send({ error: 'WOO_WEBHOOK_SECRET missing' });

  // rohe Payload für HMAC
 
  const raw: string = (req as unknown as { rawBody?: string }).rawBody ?? JSON.stringify(req.body ?? {});
  const headers = req.headers as WebhookHeaders;
  const sig = getHeader(headers, 'x-wc-webhook-signature');
  if (typeof sig !== 'string') return res.code(401).send({ error: 'missing signature' });

  const calc = crypto.createHmac('sha256', secret).update(raw).digest('base64');
  if (calc !== sig) return res.code(401).send({ error: 'invalid signature' });

  // Payload verarbeiten
  const payload = (req.body ?? {}) as Record<string, unknown>;
  const orderId = getPossibleOrderId(payload);

  // Agenten-Ziel formulieren (kannst du später weiter spezifizieren)
  const goal = `Verarbeite neue WooCommerce-Bestellung ${orderId}:
- prüfe Positionen und aktualisiere Lagerstände
- extrahiere Kunde/E-Mail für Follow-up
- gib eine kurze Zusammenfassung aus`;

  // Eigene Memory-Session für das Event (idempotent & isoliert)
  const mem = new Memory();
  mem.push({ role: 'system', content: 'Handle Bestell-Events robust und idempotent.' });
  mem.push({ role: 'user', content: `Webhook: ${JSON.stringify(payload)}` });

  const result = await planAndAct(goal, mem.all());

  return { ok: true, result: result.result, steps: result.steps };
});

/**
 * Memory-Endpoints
 */
app.get('/memory', async () => memory.all());

app.delete('/memory', async () => {
  memory.clear();
  return { cleared: true };
});

/**
 * Healthcheck
 */
app.get('/health', async () => ({
  ok: true,
  node: process.version,
  uptime: process.uptime(),
}));

/**
 * Start
 */
const PORT = Number(process.env.PORT || 3000);
app
  .listen({ port: PORT, host: '0.0.0.0' })
  .then(() => logger.info(`🚀 KI-Agent API läuft auf http://localhost:${PORT}`))
  .catch((err) => {
    logger.error(err, 'Fastify Startfehler');
    process.exit(1);
  });

