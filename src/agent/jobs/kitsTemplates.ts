// src/agent/jobs/kitsTemplates.ts
// Node-Builtins: –
// External: –
// Local:
import { wooPost } from "../../tools/woo.js";

type WooId = number;

export async function createKit_SocialMediaPromptPack(): Promise<{ id: WooId }> {
  const res = (await wooPost("/products", {
    name: "Social Media Prompt Pack",
    slug: "social-media-prompt-pack",
    type: "simple",
    status: "publish",
    virtual: true,
    downloadable: true,
    regular_price: "19",
    catalog_visibility: "visible",
    categories: [{ id: 53 }], // Kits & Templates
    tags: [{ name: "Prompt-Pack" }, { name: "Social Media" }, { name: "KI Content" }, { name: "Vorlage" }],
  })) as any;

  const id: WooId = res?.id;

  const short_description = "50+ KI-Prompts für Instagram, TikTok & LinkedIn – sofort anwendbar.";
  const description = `
<h2>🚀 Social Media Prompt Pack</h2>
<p><strong>50+ getestete Prompts</strong> für Hooks, Captions, Reels &amp; Ideen. Sofort nutzbar mit ChatGPT, Claude &amp; Gemini.</p>
<ul>
  <li>Strukturierte Kategorien (Awareness, Engagement, Conversion)</li>
  <li>Copy-ready Formulierungen</li>
  <li>Bonus-Mini-Guide: „KI-Prompts effektiv nutzen“</li>
</ul>
<p><strong>Sofort-Download</strong> (ZIP: PDF + Notion-Import).</p>
`;
  await wooPost(`/products/${id}`, { short_description, description });

  return { id };
}

export async function createKit_NotionContentPlanner(): Promise<{ id: WooId }> {
  const res = (await wooPost("/products", {
    name: "Notion Content Planner",
    slug: "notion-content-planner",
    type: "simple",
    status: "publish",
    virtual: true,
    downloadable: true,
    regular_price: "29",
    catalog_visibility: "visible",
    categories: [{ id: 53 }],
    tags: [{ name: "Notion" }, { name: "Content Planner" }, { name: "Produktivität" }],
  })) as any;

  const id: WooId = res?.id;

  const short_description = "Notion-Template für Redaktionsplanung, Kanban, Kalender & Assets.";
  const description = `
<h2>🗓️ Notion Content Planner</h2>
<p>Redaktionsplanung mit <strong>Board, Kalender, Verantwortlichkeiten</strong> und Asset-Verwaltung. Ready-to-use.</p>
<ul>
  <li>Vorlagen für Posts, Briefings, Freigaben</li>
  <li>Status-Workflow &amp; Tags</li>
  <li>Export/Archiv-Sichten</li>
</ul>
<p><strong>Sofort-Download</strong> (ZIP: PDF-Guide + Notion-Import).</p>
`;
  await wooPost(`/products/${id}`, { short_description, description });

  return { id };
}

/** Seed-Funktion: legt 2 Kern-Kits an */
export async function createKitsSeed(): Promise<{ kits: { id: WooId; name: string }[] }> {
  const a = await createKit_SocialMediaPromptPack();
  const b = await createKit_NotionContentPlanner();
  return { kits: [{ id: a.id, name: "Social Media Prompt Pack" }, { id: b.id, name: "Notion Content Planner" }] };
}

export default createKitsSeed;
