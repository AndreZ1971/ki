import 'dotenv/config';
import { Memory } from './agent/memory.js';
import { planAndAct } from './agent/planner.js';

async function main() {
  const goal = process.argv.slice(2).join(' ') || 'Finde die aktuelle Zeit und gib sie formatiert aus.';
  const memory = new Memory();

  memory.push({ role: 'system', content: 'Sprich knapp, aber präzise.' });
  memory.push({ role: 'user', content: `Ziel: ${goal}` });

  const res = await planAndAct(goal, memory.all());

  console.log('== Schritte ==');
  res.steps.forEach((s, i) => console.log(`${i + 1}. ${s.thought}`, s.tool ? `(Tool: ${s.tool})` : ''));
  console.log('\n== Ergebnis ==\n' + res.result);
}

main().catch((err) => {
  console.error('Agent-Fehler:', err);
  process.exit(1);
});
