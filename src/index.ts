// src/index.ts
// Vereinfachter CLI-Entry-Point ohne GitHub-Fallback.
// Führt ausschließlich planAndAct(...) aus und gibt Schritt- und Ergebnisinfos aus.

import "dotenv/config";
import { planAndAct } from "./agent/planner.js";
import { logger } from "./logger.js";

type ToolIO = {
  __tool_output?: unknown;
  __tool_error?: unknown;
};

function asToolIO(v: unknown): ToolIO | undefined {
  return v && typeof v === "object" ? (v as ToolIO) : undefined;
}

async function main() {
  // kompletten Prompt aus den CLI-Argumenten lesen
  const goal = process.argv.slice(2).join(" ").trim();
  if (!goal) {
    console.log(`
Verwendung:
  npm run dev -- "woo_get (GET, path:'/products/categories', params:{ per_page:100 }) und gib id, name, slug aus."
  npm run dev -- "woo_post (POST, path:'/products', data:{ name:'Mini-Audit', slug:'mini-audit', type:'simple', status:'publish', virtual:true, downloadable:false, regular_price:'50', categories:[{ id:51 }] }) und gib id, permalink, status aus."
`);
    process.exit(1);
  }

  logger.info(`Starte Agent mit Ziel:\n${goal}`);

  // minimaler Verlauf – wichtig, damit detectManualWooCommand greifen kann
  const history: { role: "system" | "user" | "assistant" | "tool"; content: string }[] = [
    { role: "system", content: "Du bist ein deterministischer KI-Agent für WooCommerce-Aufrufe." },
    { role: "user", content: goal },
  ];

  try {
    const { result, steps } = await planAndAct(goal, history);

    console.log("== Schritte ==");
    for (const [i, s] of steps.entries()) {
      console.log(`${i + 1}. ${s.thought ?? ""}${s.tool ? ` (Tool: ${s.tool})` : ""}`);

      const io = asToolIO(s.input);
      if (io && io.__tool_output !== undefined) {
        const out = io.__tool_output;
        const preview =
          typeof out === "string"
            ? out.slice(0, 300)
            : JSON.stringify(out, null, 2).slice(0, 300);
        console.log(`   ↳ Output: ${preview}${preview.length === 300 ? "…" : ""}`);
      }
      if (io && io.__tool_error !== undefined) {
        console.log(`   ↳ ERROR: ${String(io.__tool_error)}`);
      }
    }

    console.log("\n== Ergebnis ==");
    console.log(typeof result === "string" ? result : JSON.stringify(result, null, 2));

    const usedTools = steps.map((s) => s.tool).filter(Boolean) as string[];
    if (!usedTools.includes("woo_get") && !usedTools.includes("woo_post")) {
      console.warn(
        "\n⚠️  Es wurde kein woo_* Tool ausgeführt – prüfe, ob dein Prompt exakt 'woo_get(...)' oder 'woo_post(...)' enthält (ASCII-Zeichen!)."
      );
    }
  } catch (err) {
    console.error("Fehler:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();


