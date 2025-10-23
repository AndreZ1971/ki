// src/agent/planner.ts

// external (values)
import OpenAI from "openai";

// internal (values)
import { toolByName, toolCatalogForSystem } from "./tools.js";

// internal (types)
import type { Step, AgentMessage } from "../types.js";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Balanciert einen {...}-Block ab einer Startposition aus.
 *  Erwartet, dass tail[idx] auf '{' zeigt. Gibt den Substring inkl. schließender '}' zurück.
 */
function extractBalancedObject(tail: string, idx: number): string | null {
  let depth = 0;
  let i = idx;
  let inStr: '"' | "'" | null = null;
  let escape = false;

  for (; i < tail.length; i++) {
    const ch = tail[i];

    if (inStr) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === inStr) {
        inStr = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inStr = ch as '"' | "'";
      continue;
    }

    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        // inklusive abschließendem '}'
        return tail.slice(idx, i + 1);
      }
    }
  }
  return null; // nicht balanciert
}

/** Sucht im tail nach ", key:{...}" (beliebige Whitespace), extrahiert balancierten Objekt-Block. */
function findKeyObject(tail: string, key: "params" | "data"): string | undefined {
  const keyRe = new RegExp(`,\\s*${key}\\s*:\\s*\\{`, "m");
  const m = tail.match(keyRe);
  if (!m || m.index === undefined) return undefined;

  const start = m.index + m[0].length - 1; // position auf '{'
  const obj = extractBalancedObject(tail, start);
  return obj ?? undefined;
}

/** JSON-ähnlich -> JSON:
 *  - Single Quotes -> Double Quotes
 *  - Ungequotete Keys -> "keys"
 *  - Trailing Commas entfernen
 */
function normalizeAndParseJSONish(raw?: string): unknown {
  if (!raw) return undefined;

  // 1) Quotes vereinheitlichen
  let s = raw.replace(/'/g, "\"");

  // 2) Keys quoten: { key: ..., foo_bar-1: ... } -> { "key": ..., "foo_bar-1": ... }
  //    Greift nach { oder , gefolgt von evtl. Whitespace und dann einem Key bis zum Doppelpunkt.
  //    Erlaubt Buchstaben/Ziffern/Unterstrich/Bindestrich im Key.
  s = s.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_-]*)\s*:/g, '$1"$2":');

  // 3) Trailing Commas vor } oder ] entfernen
  s = s.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(s);
  } catch {
    throw new Error(
      `Konnte params/data nicht parsen. Bitte gültiges JSON verwenden. Roh: ${raw}`
    );
  }
}

/**
 * Erkenne und parse manuelle Woo-Kommandos im Goal/User-Prompt, z. B.:
 *   woo_post (POST, path:'/products', data:{ ... })
 *   woo_get  (GET,  path:'/products/categories', params:{ ... })
 *
 * Gibt { name, args } zurück, die direkt als Tool-Step ausgeführt werden können.
 */
function detectManualWooCommand(source: string):
  | {
      name: "woo_post" | "woo_get";
      args: {
        path: string;
        params?: Record<string, unknown>;
        data?: Record<string, unknown>;
        method?: string;
      };
    }
  | null {
  if (!source) return null;
  const text = source.trim();

  // Path mit ' oder " | params/data in beliebiger Reihenfolge
  // Wir parsen den "Tail" zwischen path:... und der schließenden Klammer separat.
  const re =
    /woo_(post|get)\s*\(\s*([A-Z]+)\s*,\s*path:\s*(?:'([^']+)'|"([^"]+)")([\s\S]*?)\)/m;
  const match = text.match(re);
  if (!match) return null;

  const [, kind, method, path1, path2, tail] = match as [
    string,
    "post" | "get",
    string,
    string | undefined,
    string | undefined,
    string
  ];
  const path = path1 ?? path2 ?? "";

  // params:{...} und data:{...} unabhängig von der Reihenfolge & balanciert extrahieren
  const paramsRaw = findKeyObject(tail, "params");
  const dataRaw = findKeyObject(tail, "data");

  const params = normalizeAndParseJSONish(paramsRaw) as Record<string, unknown> | undefined;
  const data = normalizeAndParseJSONish(dataRaw) as Record<string, unknown> | undefined;
  const name = kind === "post" ? "woo_post" : "woo_get";

  return {
    name,
    args: {
      method, // informativ; in tools.ts wird aus dem Toolnamen abgeleitet
      path,
      ...(params ? { params } : {}),
      ...(data ? { data } : {}),
    },
  };
}

export async function planAndAct(
  goal: string,
  history: AgentMessage[]
): Promise<{ result: string; steps: Step[] }> {
  // ---------- 1) Harte Abkürzung: manuelles woo_* Kommando erkannt ----------
  const manualFromGoal = detectManualWooCommand(goal);

  // Optional: auch die jüngste User-Nachricht durchsuchen (robuster bei unterschiedlichen Aufrufern)
  let manualFromHistory: ReturnType<typeof detectManualWooCommand> | null = null;
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m && m.role === "user") {
      manualFromHistory = detectManualWooCommand(m.content);
      if (manualFromHistory) break;
    }
  }

  const manual = manualFromGoal ?? manualFromHistory;
  if (manual) {
    const steps: Step[] = [];
    const tool = toolByName(manual.name);

    if (!tool) {
      // Sollte praktisch nicht vorkommen – schützt aber vor Fehlkonfigurationen
      steps.push({
        thought: `Manuelles Kommando erkannt, aber Tool "${manual.name}" nicht registriert.`,
        tool: null,
        input: {},
      });
      return {
        result: `Tool "${manual.name}" nicht gefunden.`,
        steps,
      };
    }

    try {
      const output = await tool.run(manual.args ?? {});
      steps.push({
        thought: `Manuelles Woo-Kommando ausgeführt: ${manual.name} ${manual.args?.path ?? ""}`,
        tool: manual.name,
        input: { ...(manual.args ?? {}), __tool_output: output },
      });

      const result =
        typeof output === "string" ? output : JSON.stringify(output, null, 2);

      return { result, steps };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
      steps.push({
        thought: `Fehler bei manueller Woo-Ausführung: ${manual.name}`,
        tool: manual.name,
        input: { ...(manual.args ?? {}), __tool_error: String(msg) },
      });
      return { result: `Fehler: ${String(msg)}`, steps };
    }
  }

  // ---------- 2) LLM-Planung (Fallback unverändert) ----------
  const systemPrompt = `Du bist ein KI-Agent. Ziel: "${goal}".
Dir stehen Tools zur Verfügung:
${toolCatalogForSystem()}

Antworte **ausschließlich** im JSON-Format:
{
  "steps": [
    {"thought":"...","tool":"<name-oder-null>","input":{...}}
  ],
  "final_answer":"..."
}

Hinweise:
- Wenn du per http_get JSON erhältst, nutze "json_pick", um konkrete Felder (z. B. "stargazers_count") zu extrahieren.
- Fasse dich im "final_answer" kurz und nenne das Ergebnis prägnant (z. B. "Stars: 123456").`;

  const coreHistory: Array<{ role: "system" | "user"; content: string }> = history
    .filter((m) => m.role === "system" || m.role === "user")
    .map((m) => ({ role: m.role as "system" | "user", content: m.content }));

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...coreHistory,
    { role: "user", content: "Starte die Bearbeitung des Ziels." },
  ];

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages,
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  let parsed: { steps?: Step[]; final_answer?: string } = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  const steps: Step[] = parsed.steps ?? [];
  const executed: Step[] = [];

  for (const s of steps) {
    if (!s.tool) {
      executed.push(s);
      continue;
    }

    const tool = toolByName(s.tool);
    if (!tool) {
      executed.push({
        ...s,
        thought: `${s.thought ?? ""} (Unbekanntes Tool)`,
      });
      continue;
    }

    try {
      const output = await tool.run(s.input ?? {});
      executed.push({
        ...s,
        input: { ...(s.input ?? {}), __tool_output: output },
      });
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
      executed.push({
        ...s,
        input: { ...(s.input ?? {}), __tool_error: String(msg) },
      });
    }
  }

  const final_answer = parsed.final_answer ?? "Kein final_answer erhalten.";
  return { result: final_answer, steps: executed };
}
