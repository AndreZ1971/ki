import 'dotenv/config';

import { Memory } from './agent/memory.js';
import { planAndAct } from './agent/planner.js';
import { logger } from './logger.js';

import type { Step } from './types.js';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function getFirstToolOutput(steps: Step[]): unknown {
  for (const s of steps) {
    const input = s.input;
    if (input && '___nonexistent' in input) { /* TS hint noop */ }
    if (input && ' __tool_output' in (input as never)) { /* never */ }
    if (input && ' __tool_error' in (input as never)) { /* never */ }
    const out = input?.__tool_output;
    if (out !== undefined) return out;
  }
  return undefined;
}

function getFirstJsonPickValue(steps: Step[]): unknown {
  for (const s of steps) {
    if (s.tool === 'json_pick') {
      const out = s.input?.__tool_output;
      if (isRecord(out) && 'value' in out) return (out as Record<string, unknown>).value;
    }
  }
  return undefined;
}

function getFirstToolError(steps: Step[]): string | undefined {
  for (const s of steps) {
    const err = s.input?.__tool_error;
    if (typeof err === 'string') return err;
  }
  return undefined;
}

async function main() {
  const goal =
    process.argv.slice(2).join(' ') ||
    'Rufe https://api.github.com/repos/nodejs/node ab und gib die Sterne aus.';

  const memory = new Memory();
  memory.push({ role: 'system', content: 'Sprich knapp, aber präzise.' });
  memory.push({ role: 'user', content: `Ziel: ${goal}` });

  const res = await planAndAct(goal, memory.all());

  for (const [i, s] of res.steps.entries()) {
    logger.info(`${i + 1}. ${s.thought}${s.tool ? ` (Tool: ${s.tool})` : ''}`);
  }

  let output = (res.result || '').trim();

  // Platzhalter aus json_pick ersetzen
  const pickVal = getFirstJsonPickValue(res.steps);
  if (output.includes('<extracted_value>') && pickVal !== undefined) {
    output = output.replace('<extracted_value>', String(pickVal));
  }

  // Fallbacks
  if (!output || output === '...' || output.includes('<extracted_value>')) {
    const toolErr = getFirstToolError(res.steps);
    const toolOut = getFirstToolOutput(res.steps);

    // GitHub Stars direkt aus http_get
    if (pickVal === undefined && isRecord(toolOut) && 'data' in toolOut) {
      const data = (toolOut as Record<string, unknown>).data;
      const stars =
        isRecord(data) && typeof (data as Record<string, unknown>).stargazers_count === 'number'
          ? (data as Record<string, unknown>).stargazers_count
          : undefined;

      if (typeof stars === 'number') {
        output = `Stars: ${stars}`;
      }
    }

    if (!output || output === '...' || output.includes('<extracted_value>')) {
      if (pickVal !== undefined) {
        output = `Wert: ${String(pickVal)}`;
      } else if (toolErr) {
        output = `Tool-Fehler: ${toolErr}`;
      } else if (toolOut !== undefined) {
        try {
          output = `Rohdaten:\n${JSON.stringify(toolOut, null, 2)}`;
        } catch {
          output = String(toolOut);
        }
      } else {
        output = 'Kein final_answer und kein Tool-Output verfügbar.';
      }
    }
  }

  console.log('\n== Ergebnis ==\n' + output);
}

main().catch((err) => {
  console.error('Agent-Fehler:', err);
  process.exit(1);
});
