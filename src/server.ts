import 'dotenv/config';
import Fastify from 'fastify';

import { Memory } from './agent/memory.js';
import { planAndAct } from './agent/planner.js';
import { logger } from './logger.js';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

const memory = new Memory();

app.post('/run', async (req, res) => {
  const body = (req.body ?? {}) as { goal?: string };
  const goal = body.goal?.toString().trim();
  if (!goal) return res.code(400).send({ error: 'Missing goal' });

  memory.push({ role: 'user', content: goal });
  const result = await planAndAct(goal, memory.all());
  memory.push({ role: 'assistant', content: result.result });

  return { steps: result.steps, result: result.result };
});

app.get('/memory', async () => memory.all());

app.delete('/memory', async () => {
  memory.clear();
  return { cleared: true };
});

const PORT = Number(process.env.PORT || 3000);
app
  .listen({ port: PORT, host: '0.0.0.0' })
  .then(() => logger.info(`🚀 KI-Agent API läuft auf http://localhost:${PORT}`))
  .catch((err) => {
    logger.error(err, 'Fastify Startfehler');
    process.exit(1);
  });
