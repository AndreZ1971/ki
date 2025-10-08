import 'dotenv/config';
import cron from 'node-cron';
import { planAndAct } from './agent/planner.js';
import { Memory } from './agent/memory.js';
import { logger } from './logger.js';

let lastIso = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // Start: -10min

cron.schedule('*/2 * * * *', async () => {
  try {
    const mem = new Memory();
    const goal = `Liste alle Bestellungen seit ${lastIso} und gib die neuen Bestell-IDs aus.`;

    mem.push({ role: 'system', content: 'Arbeite deterministisch & idempotent.' });
    mem.push({ role: 'user', content: `Nutze woo_list_orders_since.` });

    const res = await planAndAct(goal, mem.all());
    logger.info({ result: res.result }, 'cron: orders since');

    // Simple Fortschrittsmarke: neuestes Bestelldatum extrahieren (falls vom Modell geliefert)
    // Optional: Du kannst hier direkt Tool-Outputs parsen und lastIso schieben.
    lastIso = new Date().toISOString();
  } catch (e) {
    logger.error(e, 'cron error');
  }
});
