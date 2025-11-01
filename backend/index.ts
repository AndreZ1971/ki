// src/index.ts

import 'dotenv/config';

// Node builtins
import process from 'node:process';

// Local modules
import { planAndAct } from './agent/planner.js';

// ---------- Logging helpers ----------
function logInfo(msg: string) {
  console.log(
    JSON.stringify({
      level: 30,
      time: Date.now(),
      pid: process.pid,
      hostname: process.env.COMPUTERNAME ?? 'host',
      msg,
    })
  );
}

function logSection(title: string) {
  console.log(`== ${title} ==`);
}

function pretty(obj: unknown) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

// ---------- Runner ----------
async function main(): Promise<void> {
  // Nimmt ALLES nach `tsx src/index.ts` als Prompt (inkl. Zeilenumbrüche/Sonderzeichen)
  const userPrompt = process.argv.slice(2).join(' ').trim();
  if (!userPrompt) {
    console.error(
      'Fehler: Kein Prompt übergeben.\nBeispiel:\n  npm run dev -- "woo_get (GET, path:\'/products/categories\', params:{ per_page:100 }) und gib id, name aus."'
    );
    process.exit(1);
  }

  logInfo(`Starte Agent mit Ziel:\n${userPrompt}`);

  // FIX: Explizite Typ-Definition für history
  const history: any[] = []; // keine Chat-Historie im CLI

  // 1) Planung und Ausführung
  try {
    const { result, steps } = await planAndAct(userPrompt, history);

    // 2) Schritte anzeigen
    logSection('Ausgeführte Schritte');
    if (steps.length === 0) {
      console.log('Keine Schritte ausgeführt (direktes Ergebnis).');
    } else {
      steps.forEach((step, i) => {
        console.log(`${i + 1}. ${step.thought}`);
        if (step.tool) {
          console.log(`   ↳ Tool: ${step.tool}`);
        }
        if (step.input?.__tool_output) {
          const outputStr = pretty(step.input.__tool_output);
          console.log(
            `   ↳ Output: ${outputStr.slice(0, 200)}${outputStr.length > 200 ? '…' : ''}`
          );
        }
        if (step.input?.__tool_error) {
          console.log(`   ↳ ERROR: ${step.input.__tool_error}`);
        }
      });
    }

    // 3) Ergebnis
    logSection('Ergebnis');
    console.log(result);
  } catch (_err) {
    console.error(
      `Fehler beim Planen: ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(
    `Unerwarteter Fehler: ${e instanceof Error ? e.message : String(e)}`
  );
  process.exit(1);
});