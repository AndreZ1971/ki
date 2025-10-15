// src/agent/planner.ts
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import type { Step, AgentMessage } from "../types.js";
import { toolByName, toolCatalogForSystem } from "./tools.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function planAndAct(
  goal: string,
  history: AgentMessage[]
): Promise<{ result: string; steps: Step[] }> {
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

  // Nur System- und User-Historie an das Modell geben (KEIN readonly-Array!)
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
    // Falls das Modell einmal nicht korrektes JSON liefert
    parsed = {};
  }

  const steps: Step[] = parsed.steps ?? [];
  const executed: Step[] = [];

  // Schrittweise Tools ausführen
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
