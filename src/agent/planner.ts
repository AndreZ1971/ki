import OpenAI from 'openai';
import type { Step, AgentMessage } from '../types.js';
import { toolByName, toolCatalogForSystem } from './tools.js';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function planAndAct(
  goal: string,
  history: AgentMessage[]
): Promise<{ result: string; steps: Step[] }> {
  const system = `Du bist ein KI-Agent. Ziel: "${goal}".
Dir stehen Tools zur Verfügung:
${toolCatalogForSystem()}
Antworte im JSON-Format mit:
{
  "steps": [
    {"thought":"...", "tool":"name-oder-null", "input":{...}}
  ],
  "final_answer": "..."
}`;

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: system },
    ...history.filter((m) => m.role !== 'assistant' && m.role !== 'tool') as any,
    { role: 'user', content: 'Starte die Bearbeitung des Ziels.' },
  ];

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages,
  });

  const content = completion.choices[0]?.message?.content ?? '{}';
  let parsed: { steps?: Step[]; final_answer?: string };
  try { parsed = JSON.parse(content); } catch { parsed = {}; }

  const steps: Step[] = parsed.steps ?? [];
  const executed: Step[] = [];

  for (const s of steps) {
    if (!s.tool) { executed.push(s); continue; }
    const tool = toolByName(s.tool);
    if (!tool) {
      executed.push({ ...s, thought: s.thought + ' (Unbekanntes Tool)' });
      continue;
    }
    try {
      const output = await tool.run(s.input ?? {});
      executed.push({ ...s, input: { ...(s.input ?? {}), __tool_output: output } });
    } catch (e: any) {
      executed.push({ ...s, input: { ...(s.input ?? {}), __tool_error: String(e?.message || e) } });
    }
  }

  const final_answer = parsed.final_answer ?? 'Kein final_answer erhalten.';
  return { result: final_answer, steps: executed };
}
